"""Peek at attendance cell values to understand encoding (P/A/1/0/numeric?)."""
from pathlib import Path
import polars as pl

RAW = Path(__file__).resolve().parents[1] / "data" / "raw"

for year in ["2023-2024", "2024-2025"]:
    print(f"\n--- FIN_YEAR {year} attendance values ---")
    lf = pl.scan_csv(RAW / f"data_FIN_YEAR_{year}.csv", infer_schema_length=10000, ignore_errors=True)
    schema = lf.collect_schema()

    # Find attendance cols (date-like) and marks cols
    all_cols = list(schema.keys())
    date_cols = [c for c in all_cols if "-" in c and c not in ("DOB",) and not c.endswith("_MARKS")]
    mark_cols = [c for c in all_cols if c.endswith("_MARKS")]
    print(f"attendance cols: {len(date_cols)} (first 3: {date_cols[:3]}, last 3: {date_cols[-3:]})")
    print(f"marks cols: {mark_cols}")
    print(f"dtype of first date col '{date_cols[0]}': {schema[date_cols[0]]}")
    print(f"dtype of first marks col '{mark_cols[0]}': {schema[mark_cols[0]]}")

    # sample 3 attendance cols, show distinct values
    for col in date_cols[:3] + date_cols[100:102]:
        vals = lf.select(pl.col(col).value_counts(sort=True)).head(10).collect()
        print(f"\n{col} value counts (top 10):\n{vals}")

    # marks summary
    print(f"\nmarks summary:")
    ms = lf.select([pl.col(c).describe() for c in mark_cols]).collect() if False else None
    for c in mark_cols:
        stats = lf.select([
            pl.col(c).min().alias("min"),
            pl.col(c).max().alias("max"),
            pl.col(c).mean().alias("mean"),
            pl.col(c).null_count().alias("nulls"),
        ]).collect()
        print(f"  {c}: {stats.to_dicts()[0]}")

    break  # only need to see 2023-24 for this
