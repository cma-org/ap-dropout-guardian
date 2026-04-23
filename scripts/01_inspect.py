"""Inspect raw datasets: schema, nulls, key uniqueness, dropout base rate."""
from pathlib import Path
import polars as pl
import pandas as pd

RAW = Path(__file__).resolve().parents[1] / "data" / "raw"
OUT = Path(__file__).resolve().parents[1] / "docs" / "data_inventory.md"

lines = ["# Data Inventory\n"]


def heading(t):
    lines.append(f"\n## {t}\n")


def block(text):
    lines.append(f"```\n{text}\n```\n")


# --- Dropout xlsx files ---
for name in ["CHILDSNO_Dropped_2023_24.xlsx", "CHILDSNO_Dropped_2024_25.xlsx"]:
    heading(name)
    df = pd.read_excel(RAW / name)
    block(
        f"rows: {len(df)}\n"
        f"cols: {list(df.columns)}\n"
        f"dtypes:\n{df.dtypes.to_string()}\n"
        f"head:\n{df.head(3).to_string()}\n"
        f"nulls:\n{df.isna().sum().to_string()}"
    )

# --- School location master ---
heading("school_location_master.csv")
slm = pl.read_csv(RAW / "school_location_master.csv", infer_schema_length=10000, ignore_errors=True)
block(
    f"rows: {slm.height}  cols: {slm.width}\n"
    f"columns: {slm.columns}\n"
    f"head:\n{slm.head(3)}\n"
    f"null counts (top 20):\n{slm.null_count().transpose(include_header=True).head(20)}"
)

# --- FIN_YEAR files (use scan for speed) ---
for year in ["2023-2024", "2024-2025"]:
    fname = f"data_FIN_YEAR_{year}.csv"
    heading(fname)
    # scan to avoid loading all 230MB twice
    lazy = pl.scan_csv(RAW / fname, infer_schema_length=10000, ignore_errors=True)
    schema = lazy.collect_schema()
    cols = list(schema.keys())
    # sample
    sample = lazy.head(3).collect()
    # row count
    n = lazy.select(pl.len()).collect().item()
    # find candidate key columns
    key_candidates = [c for c in cols if any(k in c.upper() for k in ["CHILD", "STUDENT", "PEN", "UID", "AADHAAR", "SCHOOL"])]
    block(
        f"rows: {n}  cols: {len(cols)}\n"
        f"all columns: {cols}\n"
        f"key-like columns: {key_candidates}\n"
        f"head:\n{sample}\n"
    )

OUT.write_text("".join(lines))
print(f"wrote {OUT}")
print(f"size: {OUT.stat().st_size} bytes")
