"""Build engineered feature table for both years.

Strategy:
- Read FIN_YEAR CSV with polars (lazy), collect attendance cols as numpy
- Encode: Y=0 (present), N=1 (absent), null=NaN (no record)
- Compute row-wise aggregates with vectorized numpy
- Join demographics (gender, caste cleaned) + dropout label + school location
- Write features_{year}.parquet
"""
from pathlib import Path
import numpy as np
import polars as pl
import pandas as pd
import time

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"
OUT.mkdir(exist_ok=True, parents=True)

# --- Shared: school location master ---
slm = pl.read_csv(
    RAW / "school_location_master.csv",
    infer_schema_length=10000,
    ignore_errors=True,
).select([
    pl.col("udise_code").cast(pl.Int64).alias("schoolid"),
    pl.col("school_name"),
    pl.col("district_name"),
    pl.col("block_name").alias("mandal_name"),
    pl.col("cluster_name"),
    pl.col("latitude").cast(pl.Float64),
    pl.col("longitude").cast(pl.Float64),
])
print(f"school master: {slm.height} schools")


def clean_caste(series: pl.Series) -> pl.Series:
    """Normalise caste to integers 1-4. Unknown = 0."""
    mapping = {
        "1": 1, "2": 2, "3": 3, "4": 4,
        "OC": 1, "BC": 2, "SC": 3, "ST": 4,
        "BC-A": 2, "BC-B": 2, "BC-C": 2, "BC-D": 2, "BC-E": 2,
    }
    s = series.cast(pl.Utf8)
    return s.map_elements(lambda v: mapping.get(v, 0) if v is not None else 0, return_dtype=pl.Int64)


def build_year(year_str: str, dropout_xlsx: str) -> pl.DataFrame:
    t0 = time.time()
    print(f"\n=== Building features for {year_str} ===")

    fpath = RAW / f"data_FIN_YEAR_{year_str}.csv"
    df = pl.read_csv(fpath, infer_schema_length=10000, ignore_errors=True)
    print(f"loaded {df.height} rows, {df.width} cols in {time.time()-t0:.1f}s")

    # Identify date cols vs meta
    meta_cols = ["schoolid", "GENDER", "CASTE", "DOB", "CHILD_SNO", "FIN_YEAR"]
    marks_cols = ["FA1_MARKS", "FA2_MARKS", "FA3_MARKS", "FA4_MARKS", "SA1_MARKS", "SA2_MARKS"]
    date_cols = [c for c in df.columns if c not in meta_cols + marks_cols]
    print(f"date cols: {len(date_cols)}, marks: {len(marks_cols)}")

    # Extract attendance as numpy
    t1 = time.time()
    attend_raw = df.select(date_cols).to_numpy()  # object dtype
    # Encode to float: 0 present, 1 absent, NaN for anything else (null, etc.)
    present = (attend_raw == "Y")
    absent = (attend_raw == "N")
    attend = np.where(absent, 1.0, np.where(present, 0.0, np.nan))
    print(f"encoded attendance matrix {attend.shape} in {time.time()-t1:.1f}s")

    # --- Row aggregates ---
    n_present = np.nansum((1 - attend) * (~np.isnan(attend)), axis=1)
    n_absent = np.nansum(attend * (~np.isnan(attend)), axis=1)
    n_recorded = n_present + n_absent
    attendance_rate = np.where(n_recorded > 0, n_present / np.maximum(n_recorded, 1), 0.0)
    n_null = np.sum(np.isnan(attend), axis=1)

    # Max consecutive absences: running-counter trick
    absent_flag = (attend == 1.0).astype(np.float32)
    max_consec = np.zeros(attend.shape[0], dtype=np.float32)
    acc = np.zeros(attend.shape[0], dtype=np.float32)
    for j in range(attend.shape[1]):
        acc = (acc + 1) * absent_flag[:, j]
        max_consec = np.maximum(max_consec, acc)

    # Monthly groups: parse month from col name like "12-Jun"
    month_idx = {}
    month_order = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]
    for i, c in enumerate(date_cols):
        parts = c.split("-")
        if len(parts) == 2:
            month_idx.setdefault(parts[1], []).append(i)

    monthly_rates = {}
    for m in month_order:
        if m not in month_idx:
            monthly_rates[m] = np.full(attend.shape[0], np.nan, dtype=np.float32)
            continue
        sub = attend[:, month_idx[m]]
        p = np.nansum((1 - sub) * (~np.isnan(sub)), axis=1)
        a = np.nansum(sub * (~np.isnan(sub)), axis=1)
        r = p + a
        monthly_rates[m] = np.where(r > 0, p / np.maximum(r, 1), np.nan).astype(np.float32)

    # Early year (Jun-Aug) vs late year (Jan-Mar)
    early = np.nanmean(np.stack([monthly_rates[m] for m in ["Jun", "Jul", "Aug"] if m in monthly_rates]), axis=0)
    late = np.nanmean(np.stack([monthly_rates[m] for m in ["Jan", "Feb", "Mar"] if m in monthly_rates]), axis=0)
    trend_decline = early - late  # positive = attendance dropped through the year

    # Biggest month-over-month decline
    month_matrix = np.stack([monthly_rates[m] for m in month_order])  # (months, students)
    mom_diff = month_matrix[:-1] - month_matrix[1:]  # positive = drop
    mom_max_drop = np.nanmax(mom_diff, axis=0)

    print(f"row aggregates done in {time.time()-t1:.1f}s")

    # --- Marks aggregates (using pandas for NaN-safe ops) ---
    marks_df = df.select(marks_cols).to_pandas()
    fa_avg = marks_df[["FA1_MARKS", "FA2_MARKS", "FA3_MARKS", "FA4_MARKS"]].mean(axis=1)
    sa_avg = marks_df[["SA1_MARKS", "SA2_MARKS"]].mean(axis=1)
    marks_null_count = marks_df.isna().sum(axis=1)

    # --- Demographics + meta ---
    meta = df.select([
        pl.col("CHILD_SNO"),
        pl.col("schoolid"),
        pl.col("GENDER"),
        pl.col("CASTE"),
        pl.col("DOB"),
    ])

    # Build feature frame
    feats = meta.with_columns([
        pl.Series("attendance_rate", attendance_rate),
        pl.Series("n_present", n_present.astype(np.int32)),
        pl.Series("n_absent", n_absent.astype(np.int32)),
        pl.Series("n_null_days", n_null.astype(np.int32)),
        pl.Series("max_consec_absence", max_consec.astype(np.int32)),
        pl.Series("trend_decline", trend_decline.astype(np.float32)),
        pl.Series("mom_max_drop", mom_max_drop.astype(np.float32)),
        pl.Series("fa_avg", fa_avg.values.astype(np.float32)),
        pl.Series("sa_avg", sa_avg.values.astype(np.float32)),
        pl.Series("marks_null_count", marks_null_count.values.astype(np.int32)),
    ] + [pl.Series(f"att_{m.lower()}", monthly_rates[m]) for m in month_order])

    # Clean caste
    feats = feats.with_columns(clean_caste(feats["CASTE"]).alias("caste_clean"))

    # Age from DOB (format DD/MM/YY → compute age at year start)
    year_end = int(year_str.split("-")[0])  # use fin year start
    def parse_age(dob_str):
        if dob_str is None or not isinstance(dob_str, str):
            return None
        try:
            parts = dob_str.split("/")
            if len(parts) != 3:
                return None
            yr = int(parts[2])
            yr = 2000 + yr if yr < 30 else 1900 + yr
            return year_end - yr
        except Exception:
            return None

    ages = [parse_age(d) for d in df["DOB"].to_list()]
    feats = feats.with_columns(pl.Series("age", ages, dtype=pl.Int64))

    # Join school location
    feats = feats.join(slm, on="schoolid", how="left")

    # Join dropout label
    dropout_df = pd.read_excel(RAW / dropout_xlsx)
    dropout_ids = set(dropout_df["CHILD_SNO"].tolist())
    feats = feats.with_columns(
        pl.col("CHILD_SNO").is_in(list(dropout_ids)).cast(pl.Int8).alias("dropped")
    )

    print(f"feature frame: {feats.height} rows, {feats.width} cols")
    print(f"dropout label rate: {100 * feats['dropped'].mean():.2f}%")
    print(f"total time: {time.time()-t0:.1f}s")
    return feats


f23 = build_year("2023-2024", "CHILDSNO_Dropped_2023_24.xlsx")
f23.write_parquet(OUT / "features_23.parquet")
print(f"wrote {OUT / 'features_23.parquet'}")

f24 = build_year("2024-2025", "CHILDSNO_Dropped_2024_25.xlsx")
f24.write_parquet(OUT / "features_24.parquet")
print(f"wrote {OUT / 'features_24.parquet'}")

# Sanity prints
print("\n=== sample features (first 3 rows, 2023-24) ===")
print(f23.head(3))
print("\ncolumns:", f23.columns)
