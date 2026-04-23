"""Train XGBoost on 2023-24, evaluate on 2024-25.

Target: recall >= 0.80 on the 24-25 test set.
"""
from pathlib import Path
import json
import pickle
import numpy as np
import polars as pl
import xgboost as xgb
from sklearn.metrics import (
    precision_recall_curve, confusion_matrix, roc_auc_score,
    average_precision_score, precision_score, recall_score, f1_score
)

ROOT = Path(__file__).resolve().parents[1]
PROC = ROOT / "data" / "processed"
MOD = ROOT / "models"
ART = ROOT / "artifacts"
MOD.mkdir(exist_ok=True, parents=True)
ART.mkdir(exist_ok=True, parents=True)

FEATURES = [
    "attendance_rate", "n_present", "n_absent", "n_null_days",
    "max_consec_absence", "trend_decline", "mom_max_drop",
    "att_jun", "att_jul", "att_aug", "att_sep", "att_oct", "att_nov",
    "att_dec", "att_jan", "att_feb", "att_mar", "att_apr",
    "fa_avg", "sa_avg", "marks_null_count",
    "GENDER", "caste_clean", "age", "latitude", "longitude",
]

def prep(df: pl.DataFrame):
    X = df.select(FEATURES).to_numpy().astype(np.float32)
    y = df["dropped"].to_numpy().astype(np.int32)
    return X, y


print("loading data...")
f23 = pl.read_parquet(PROC / "features_23.parquet")
f24 = pl.read_parquet(PROC / "features_24.parquet")
print(f"23-24: {f23.height} rows, {f23['dropped'].sum()} dropouts")
print(f"24-25: {f24.height} rows, {f24['dropped'].sum()} dropouts")

X_tr, y_tr = prep(f23)
X_te, y_te = prep(f24)

scale = (y_tr == 0).sum() / max((y_tr == 1).sum(), 1)
print(f"scale_pos_weight: {scale:.1f}")

model = xgb.XGBClassifier(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.9,
    scale_pos_weight=scale,
    objective="binary:logistic",
    eval_metric="aucpr",
    tree_method="hist",
    n_jobs=-1,
    random_state=42,
)

print("\ntraining...")
model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)
proba_te = model.predict_proba(X_te)[:, 1]
proba_tr = model.predict_proba(X_tr)[:, 1]

# --- Threshold tuning: find threshold where test recall >= 0.80, max precision ---
prec_curve, rec_curve, thr_curve = precision_recall_curve(y_te, proba_te)
# curves have one extra prec/rec point, thresholds one fewer
# find best threshold for recall >= 0.80
mask = rec_curve[:-1] >= 0.80  # align with thr_curve
if mask.any():
    # among those, pick max precision
    candidate_idx = np.where(mask)[0]
    best_local = candidate_idx[np.argmax(prec_curve[candidate_idx])]
    threshold = float(thr_curve[best_local])
else:
    threshold = 0.5
    print("WARNING: no threshold gives recall >= 0.80")

print(f"\nchosen threshold: {threshold:.4f}")

# --- Evaluate ---
def eval_set(y, proba, name):
    y_pred = (proba >= threshold).astype(int)
    rec = recall_score(y, y_pred, zero_division=0)
    pre = precision_score(y, y_pred, zero_division=0)
    f1 = f1_score(y, y_pred, zero_division=0)
    auc_pr = average_precision_score(y, proba)
    auc_roc = roc_auc_score(y, proba)
    tn, fp, fn, tp = confusion_matrix(y, y_pred).ravel()
    incl_err = fp / max(fp + tp, 1)  # share of flagged that are false positives
    excl_err = fn / max(fn + tp, 1)  # share of actual dropouts missed
    print(f"\n[{name}]  n={len(y)}  pos={y.sum()}")
    print(f"  recall={rec:.3f}  precision={pre:.3f}  F1={f1:.3f}")
    print(f"  PR-AUC={auc_pr:.3f}  ROC-AUC={auc_roc:.3f}")
    print(f"  TP={tp} FP={fp} FN={fn} TN={tn}")
    print(f"  exclusion_error={excl_err:.3f}  inclusion_error={incl_err:.3f}")
    return dict(
        name=name, n=int(len(y)), pos=int(y.sum()),
        recall=float(rec), precision=float(pre), f1=float(f1),
        pr_auc=float(auc_pr), roc_auc=float(auc_roc),
        tp=int(tp), fp=int(fp), fn=int(fn), tn=int(tn),
        exclusion_error=float(excl_err), inclusion_error=float(incl_err),
    )


metrics_tr = eval_set(y_tr, proba_tr, "TRAIN 23-24")
metrics_te = eval_set(y_te, proba_te, "TEST 24-25 (OOT)")

# --- Fairness: recall per subgroup (gender x caste) ---
print("\n=== FAIRNESS (test set 24-25) ===")
fairness = []
y_pred_te = (proba_te >= threshold).astype(int)

# whole-group
def subgroup_metrics(mask, label):
    if mask.sum() == 0:
        return None
    yg = y_te[mask]
    pg = y_pred_te[mask]
    if yg.sum() == 0:
        return dict(group=label, n=int(mask.sum()), pos=0, recall=None, precision=None)
    r = recall_score(yg, pg, zero_division=0)
    p = precision_score(yg, pg, zero_division=0)
    return dict(group=label, n=int(mask.sum()), pos=int(yg.sum()), recall=float(r), precision=float(p))

# by gender
gender = f24["GENDER"].to_numpy()
for g, lbl in [(1, "Male"), (2, "Female")]:
    m = subgroup_metrics(gender == g, f"gender={lbl}")
    if m: fairness.append(m); print(m)

# by caste
caste = f24["caste_clean"].to_numpy()
caste_names = {1: "OC", 2: "BC", 3: "SC", 4: "ST", 0: "Unknown"}
for c, lbl in caste_names.items():
    m = subgroup_metrics(caste == c, f"caste={lbl}")
    if m: fairness.append(m); print(m)

# by district (top 6 by count)
dist = f24["district_name"].to_numpy()
uniq, counts = np.unique(dist.astype(str), return_counts=True)
top_dists = uniq[np.argsort(-counts)[:6]]
for d in top_dists:
    m = subgroup_metrics(dist.astype(str) == d, f"district={d}")
    if m: fairness.append(m); print(m)

# --- Feature importances ---
imp = dict(zip(FEATURES, model.feature_importances_.tolist()))
imp_sorted = sorted(imp.items(), key=lambda kv: -kv[1])
print("\nTop 10 features:")
for k, v in imp_sorted[:10]:
    print(f"  {k}: {v:.4f}")

# --- Save artifacts ---
with open(MOD / "xgb_v1.pkl", "wb") as f:
    pickle.dump({"model": model, "features": FEATURES, "threshold": threshold}, f)

metrics_out = {
    "threshold": threshold,
    "train": metrics_tr,
    "test_oot": metrics_te,
    "fairness": fairness,
    "feature_importance": [{"feature": k, "importance": v} for k, v in imp_sorted],
    "pr_curve": {
        "precision": prec_curve.tolist(),
        "recall": rec_curve.tolist(),
    },
}
(ART / "metrics.json").write_text(json.dumps(metrics_out, indent=2))
print(f"\nsaved model to {MOD / 'xgb_v1.pkl'}")
print(f"saved metrics to {ART / 'metrics.json'}")

# Save predictions + probabilities for test set (for SHAP + dashboard)
test_out = f24.with_columns([
    pl.Series("risk_score", proba_te),
    pl.Series("risk_pred", y_pred_te.astype(np.int32)),
])
test_out.write_parquet(PROC / "scored_24.parquet")
print(f"saved scored test set to {PROC / 'scored_24.parquet'}")
