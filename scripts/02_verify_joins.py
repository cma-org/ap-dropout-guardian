"""Verify join keys: schoolid <-> udise_code, CHILD_SNO uniqueness, cohort sizes."""
from pathlib import Path
import polars as pl
import pandas as pd

RAW = Path(__file__).resolve().parents[1] / "data" / "raw"

# --- Load dropouts ---
d23 = pd.read_excel(RAW / "CHILDSNO_Dropped_2023_24.xlsx")
d24 = pd.read_excel(RAW / "CHILDSNO_Dropped_2024_25.xlsx")
print(f"Dropouts 2023-24: {len(d23)}  (unique CHILD_SNO: {d23.CHILD_SNO.nunique()})")
print(f"Dropouts 2024-25: {len(d24)}  (unique CHILD_SNO: {d24.CHILD_SNO.nunique()})")
print(f"Overlap across years: {len(set(d23.CHILD_SNO) & set(d24.CHILD_SNO))}")

# --- Load school master ---
slm = pl.read_csv(RAW / "school_location_master.csv", infer_schema_length=10000, ignore_errors=True)
print(f"\nSchool master: {slm.height} schools")
print(f"Unique udise_codes: {slm['udise_code'].n_unique()}")
print(f"Districts: {slm['district_name'].n_unique()}")
print(f"Blocks (mandals): {slm['block_name'].n_unique()}")

# --- Load FIN_YEAR lazy, check join key ---
for year in ["2023-2024", "2024-2025"]:
    print(f"\n--- FIN_YEAR {year} ---")
    lf = pl.scan_csv(RAW / f"data_FIN_YEAR_{year}.csv", infer_schema_length=10000, ignore_errors=True)

    # Basic counts
    basic = lf.select([
        pl.len().alias("rows"),
        pl.col("CHILD_SNO").n_unique().alias("unique_children"),
        pl.col("schoolid").n_unique().alias("unique_schools"),
        pl.col("GENDER").n_unique().alias("n_genders"),
        pl.col("CASTE").n_unique().alias("n_castes"),
    ]).collect()
    print(basic)

    # schoolid match with udise_code
    fin_schools = lf.select("schoolid").unique().collect()["schoolid"].to_list()
    master_udise = set(slm["udise_code"].to_list())
    fin_set = set(fin_schools)
    matched = fin_set & master_udise
    print(f"schoolid values: {len(fin_set)}  |  in master: {len(matched)}  "
          f"({100*len(matched)/max(len(fin_set),1):.1f}% match)")

    # Gender distribution
    gender_dist = lf.group_by("GENDER").agg(pl.len()).collect()
    print(f"gender dist:\n{gender_dist}")

    # Caste distribution
    caste_dist = lf.group_by("CASTE").agg(pl.len()).collect().sort("CASTE")
    print(f"caste dist:\n{caste_dist}")

# --- Join FIN_YEAR_2023-2024 with dropouts to get label + base rate ---
print("\n--- Base rate check (2023-24) ---")
lf23 = pl.scan_csv(RAW / "data_FIN_YEAR_2023-2024.csv", infer_schema_length=10000, ignore_errors=True)
n23 = lf23.select(pl.len()).collect().item()
d23_ids = set(d23.CHILD_SNO.tolist())
# Count how many dropout ids are present in 2023-24 roster
fin23_ids = set(lf23.select("CHILD_SNO").unique().collect()["CHILD_SNO"].to_list())
labeled_23 = len(d23_ids & fin23_ids)
print(f"FIN_YEAR 2023-24 students: {n23}")
print(f"Dropout IDs found in FIN_YEAR 2023-24: {labeled_23}/{len(d23_ids)} "
      f"({100*labeled_23/len(d23_ids):.1f}% of dropouts present in roster)")
print(f"Dropout base rate (labeled / roster): {100*labeled_23/n23:.2f}%")

print("\n--- Base rate check (2024-25) ---")
lf24 = pl.scan_csv(RAW / "data_FIN_YEAR_2024-2025.csv", infer_schema_length=10000, ignore_errors=True)
n24 = lf24.select(pl.len()).collect().item()
d24_ids = set(d24.CHILD_SNO.tolist())
fin24_ids = set(lf24.select("CHILD_SNO").unique().collect()["CHILD_SNO"].to_list())
labeled_24 = len(d24_ids & fin24_ids)
print(f"FIN_YEAR 2024-25 students: {n24}")
print(f"Dropout IDs found in FIN_YEAR 2024-25: {labeled_24}/{len(d24_ids)} "
      f"({100*labeled_24/len(d24_ids):.1f}% of dropouts present in roster)")
print(f"Dropout base rate (labeled / roster): {100*labeled_24/n24:.2f}%")

# Are 2024-25 dropouts = students in 2023-24 but NOT in 2024-25?
print("\n--- Cross-year dropout interpretation ---")
present_23_not_24 = fin23_ids - fin24_ids
print(f"Students in 2023-24 roster but NOT in 2024-25: {len(present_23_not_24)}")
print(f"Of those, how many are in d23 xlsx: {len(present_23_not_24 & d23_ids)}")
print(f"Of those, how many are in d24 xlsx: {len(present_23_not_24 & d24_ids)}")
