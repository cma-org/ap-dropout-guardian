"""Find thresholds satisfying both PoC criteria if any exist."""
from pathlib import Path
import pickle
import numpy as np
import polars as pl
import xgboost as xgb
from sklearn.metrics import precision_recall_curve

ROOT = Path(__file__).resolve().parents[1]
PROC = ROOT / "data" / "processed"
MOD = ROOT / "models"

with open(MOD / "xgb_full.pkl", "rb") as f:
    bundle = pickle.load(f)
model, FEATURES = bundle["model"], bundle["features"]

f24 = pl.read_parquet(PROC / "features_24_full.parquet")
X_te = f24.select(FEATURES).to_numpy().astype(np.float32)
y_te = f24["dropped"].to_numpy()
proba = model.predict_proba(X_te)[:, 1]

prec, rec, thr = precision_recall_curve(y_te, proba)

print("Looking for (recall >= 0.80) AND (precision > 0.20)")
mask = (rec[:-1] >= 0.80) & (prec[:-1] > 0.20)
print(f"valid points: {mask.sum()}")
if mask.any():
    idx = np.where(mask)[0]
    print(f"sample thresholds: {thr[idx[:5]]}")
    for i in idx[:5]:
        print(f"  thr={thr[i]:.4f}  recall={rec[i]:.3f}  precision={prec[i]:.3f}")
else:
    print("NO feasible point. Finding closest.")
    # find the threshold with smallest sum of (excl_err, max(0, incl_err-0.80))
    recall_gap = np.maximum(0, 0.80 - rec[:-1])
    precision_gap = np.maximum(0, 0.20 - prec[:-1])
    loss = recall_gap + precision_gap
    best = np.argmin(loss)
    print(f"best compromise: thr={thr[best]:.4f}  recall={rec[best]:.3f}  precision={prec[best]:.3f}")

print("\nSampling the curve at recall points:")
for target in [0.60, 0.70, 0.75, 0.80, 0.85, 0.90]:
    gap = np.abs(rec[:-1] - target)
    i = np.argmin(gap)
    print(f"  recall~{target:.2f}: actual rec={rec[i]:.3f}  precision={prec[i]:.3f}  thr={thr[i]:.4f}")

print("\nAt high-precision:")
for target in [0.50, 0.40, 0.30, 0.20]:
    gap = np.abs(prec[:-1] - target)
    i = np.argmin(gap)
    print(f"  precision~{target:.2f}: actual prec={prec[i]:.3f}  recall={rec[i]:.3f}  thr={thr[i]:.4f}")
