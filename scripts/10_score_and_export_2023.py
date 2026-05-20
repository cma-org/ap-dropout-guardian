"""Score 2023-24 data and export JSON files to web/public/data/2023-24/.

Run once to generate the 2023-24 platform data:
  python scripts/10_score_and_export_2023.py

Outputs:
  web/public/data/2023-24/schools.json
  web/public/data/2023-24/mandal_aggregates.json
  web/public/data/2023-24/students/<child_sno>.json
  web/public/data/2023-24/roster/<schoolid>.json
"""
from pathlib import Path
import json, pickle, time
import numpy as np
import polars as pl
import shap
import xgboost as xgb
from sklearn.metrics import precision_recall_curve

ROOT = Path(__file__).resolve().parents[1]
PROC = ROOT / "data" / "processed"
MOD  = ROOT / "models"
WEB  = ROOT / "web" / "public" / "data" / "2023-24"

WEB.mkdir(exist_ok=True, parents=True)
(WEB / "students").mkdir(exist_ok=True)
(WEB / "roster").mkdir(exist_ok=True)
MOD.mkdir(exist_ok=True, parents=True)

FEATURES = [
    "attendance_rate", "n_present", "n_absent", "n_null_days",
    "max_consec_absence", "trend_decline", "mom_max_drop",
    "att_jun", "att_jul", "att_aug", "att_sep", "att_oct", "att_nov",
    "att_dec", "att_jan", "att_feb", "att_mar", "att_apr",
    "fa_avg", "sa_avg", "marks_null_count",
    "GENDER", "caste_clean", "age", "latitude", "longitude",
    "migration_flag", "parent_literacy", "family_income_bracket", "transport_allowance",
]

# ── Load or retrain model ─────────────────────────────────────────────────────
pkl_path = MOD / "xgb_full.pkl"
if pkl_path.exists():
    print(f"Loading model from {pkl_path}…")
    with open(pkl_path, "rb") as fh:
        bundle = pickle.load(fh)
    model     = bundle["model"]
    threshold = bundle["threshold"]
    print(f"  threshold={threshold:.4f}")
else:
    print("Model not found — retraining on 2023-24 full profile (this takes a few minutes)…")
    f23_tr = pl.read_parquet(PROC / "features_23_full.parquet")
    f24_te = pl.read_parquet(PROC / "features_24_full.parquet")

    X_tr = f23_tr.select(FEATURES).to_numpy().astype(np.float32)
    y_tr = f23_tr["dropped"].to_numpy().astype(np.int32)
    X_te = f24_te.select(FEATURES).to_numpy().astype(np.float32)
    y_te = f24_te["dropped"].to_numpy().astype(np.int32)

    scale = (y_tr == 0).sum() / max((y_tr == 1).sum(), 1)
    model = xgb.XGBClassifier(
        n_estimators=500, max_depth=6, learning_rate=0.05,
        subsample=0.9, colsample_bytree=0.9, scale_pos_weight=scale,
        objective="binary:logistic", eval_metric="aucpr",
        tree_method="hist", n_jobs=-1, random_state=42,
    )
    model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)
    print("  Training complete.")

    proba_te = model.predict_proba(X_te)[:, 1]
    prec_c, rec_c, thr_c = precision_recall_curve(y_te, proba_te)
    mask = rec_c[:-1] >= 0.80
    if mask.any():
        cand = np.where(mask)[0]
        threshold = float(thr_c[cand[np.argmax(prec_c[cand])]])
    else:
        threshold = 0.5
    print(f"  threshold={threshold:.4f}")

    with open(pkl_path, "wb") as fh:
        pickle.dump({"model": model, "features": FEATURES, "threshold": threshold}, fh)
    print(f"  Saved model to {pkl_path}")

    # Also save scored_24_full if missing
    scored_24_path = PROC / "scored_24_full.parquet"
    if not scored_24_path.exists():
        y_pred_te = (proba_te >= threshold).astype(np.int32)
        scored_24 = f24_te.with_columns([
            pl.Series("risk_score", proba_te),
            pl.Series("risk_pred", y_pred_te),
        ])
        scored_24.write_parquet(scored_24_path)
        print(f"  Also saved {scored_24_path}")

# ── Load 2023-24 features and score ──────────────────────────────────────────
print("\nLoading 2023-24 features…")
f23 = pl.read_parquet(PROC / "features_23_full.parquet")
print(f"  {f23.height:,} students")

X = f23.select(FEATURES).to_numpy().astype(np.float32)
print("Scoring…")
proba = model.predict_proba(X)[:, 1]

def tier(p):
    if p >= 0.85: return "Critical"
    if p >= 0.65: return "High"
    if p >= threshold: return "Medium"
    return "Low"

tiers  = [tier(p) for p in proba]
scored = f23.with_columns([
    pl.Series("risk_score", proba.tolist()),
    pl.Series("tier", tiers),
])

# ── SHAP ──────────────────────────────────────────────────────────────────────
print(f"Computing SHAP for {len(X):,} students…")
t0 = time.time()
explainer = shap.TreeExplainer(model)
shap_vals  = explainer.shap_values(X)
print(f"  SHAP done in {time.time()-t0:.1f}s")

# ── Feature metadata (bilingual) ──────────────────────────────────────────────
FEATURE_META = {
    "attendance_rate":       {"en": "Attendance rate",                    "te": "హాజరు శాతం",           "reason_high": "Attendance rate is critically low ({val:.0%}) — persistent absence is the strongest single predictor.", "reason_high_te": "హాజరు శాతం చాలా తక్కువ ({val:.0%}) — నిరంతర గైర్హాజరు అత్యంత ముఖ్యమైన సూచిక."},
    "max_consec_absence":    {"en": "Longest absence streak",             "te": "నిరంతర గైర్హాజరు",      "reason_high": "A streak of {val:.0f} consecutive absent days — strong disengagement signal.", "reason_high_te": "{val:.0f} రోజుల నిరంతర గైర్హాజరు — బలమైన నిర్లక్ష్య సూచన."},
    "trend_decline":         {"en": "Attendance declining over the year", "te": "హాజరు తగ్గుదల",         "reason_high": "Attendance dropped {val:.0%} from early to late year.", "reason_high_te": "సంవత్సర ప్రారంభం నుండి చివర వరకు హాజరు {val:.0%} తగ్గింది."},
    "mom_max_drop":          {"en": "Month-over-month attendance drop",   "te": "నెల-నెలా హాజరు తగ్గుదల", "reason_high": "Biggest single-month drop was {val:.0%}.", "reason_high_te": "అత్యధిక నెల తగ్గుదల {val:.0%}."},
    "fa_avg":                {"en": "Formative assessment average",       "te": "ఫార్మేటివ్ పరీక్షల సగటు", "reason_high": "FA marks: {val:.0f} — well below the pass threshold.", "reason_high_te": "FA మార్కులు: {val:.0f} — పాస్ పరిమితి కంటే చాలా తక్కువ."},
    "sa_avg":                {"en": "Summative assessment average",       "te": "సంగ్రహ పరీక్షల సగటు",    "reason_high": "SA marks: {val:.0f} — below class expectations.", "reason_high_te": "SA మార్కులు: {val:.0f} — తరగతి అంచనాల కంటే తక్కువ."},
    "marks_null_count":      {"en": "Missed assessments",                 "te": "తప్పిన పరీక్షలు",       "reason_high": "Missed {val:.0f} assessment windows — often a precursor to dropout.", "reason_high_te": "{val:.0f} పరీక్షలు తప్పాయి — తరచుగా డ్రాపౌట్‌కు పూర్వరంగం."},
    "migration_flag":        {"en": "Seasonal migration",                 "te": "కాలానుగుణ వలస",         "reason_high": "Family shows seasonal migration pattern — disrupts continuity of schooling.", "reason_high_te": "కుటుంబంలో కాలానుగుణ వలస — పాఠశాల కొనసాగింపుకు ఆటంకం."},
    "parent_literacy":       {"en": "Parent literacy",                    "te": "తల్లిదండ్రుల అక్షరాస్యత", "reason_high": "Parent literacy is low — correlates with lower home-based academic support.", "reason_high_te": "తల్లిదండ్రుల అక్షరాస్యత తక్కువ — ఇంటి వద్ద విద్యా సహాయం తక్కువ."},
    "family_income_bracket": {"en": "Household income",                   "te": "కుటుంబ ఆదాయం",          "reason_high": "Low household income bracket — financial pressure elevates dropout risk.", "reason_high_te": "తక్కువ కుటుంబ ఆదాయం — ఆర్థిక ఒత్తిడి వల్ల డ్రాపౌట్ ప్రమాదం పెరుగుతుంది."},
    "transport_allowance":   {"en": "Transport allowance eligibility",    "te": "రవాణా భత్యం అర్హత",     "reason_high": "Student receives transport allowance — indicates distance/accessibility challenge.", "reason_high_te": "విద్యార్థి రవాణా భత్యం పొందుతున్నాడు — దూరం/అందుబాటు సవాలు."},
    "caste_clean":           {"en": "Social category",                    "te": "సామాజిక వర్గం",          "reason_high": "Social category historically associated with elevated dropout incidence.", "reason_high_te": "చారిత్రకంగా ఎక్కువ డ్రాపౌట్ రేటు గల సామాజిక వర్గం."},
    "GENDER":                {"en": "Gender",                             "te": "లింగం",                  "reason_high": "Demographic factor — girls in this district face elevated dropout risk.", "reason_high_te": "జనాభా అంశం — ఈ జిల్లాలో బాలికలకు డ్రాపౌట్ ప్రమాదం ఎక్కువ."},
    "age":                   {"en": "Age",                                "te": "వయస్సు",                 "reason_high": "Older-for-grade students are at higher dropout risk.", "reason_high_te": "తరగతికి పెద్ద వయస్సు గల విద్యార్థులకు ప్రమాదం ఎక్కువ."},
    "latitude":              {"en": "School location",                    "te": "పాఠశాల స్థానం",          "reason_high": "School is in a geographic cluster with higher dropout patterns.", "reason_high_te": "పాఠశాల అధిక డ్రాపౌట్ ఉన్న భౌగోళిక క్లస్టర్‌లో ఉంది."},
    "longitude":             {"en": "School location",                    "te": "పాఠశాల స్థానం",          "reason_high": "School is in a geographic cluster with higher dropout patterns.", "reason_high_te": "పాఠశాల అధిక డ్రాపౌట్ ఉన్న భౌగోళిక క్లస్టర్‌లో ఉంది."},
    "n_present":             {"en": "Days present",                       "te": "హాజరైన రోజులు",          "reason_high": "Number of days present is well below cohort average.", "reason_high_te": "హాజరైన రోజులు సగటు కంటే చాలా తక్కువ."},
    "n_absent":              {"en": "Days absent",                        "te": "గైర్హాజరు రోజులు",        "reason_high": "Number of absent days is high ({val:.0f}).", "reason_high_te": "గైర్హాజరు రోజులు అత్యధికం ({val:.0f})."},
    "n_null_days":           {"en": "Unrecorded days",                    "te": "నమోదు కాని రోజులు",       "reason_high": "Many attendance days unrecorded — possible disengagement.", "reason_high_te": "చాలా రోజులు హాజరు నమోదు కాలేదు — నిర్లక్ష్యం సూచన."},
}
for feat in FEATURES:
    if feat not in FEATURE_META:
        FEATURE_META[feat] = {"en": feat, "te": feat, "reason_high": f"{feat} contributes to elevated risk.", "reason_high_te": f"{feat}."}


def driver_sentences(shap_row, feat_row):
    pos = [(f, c, v) for f, c, v in zip(FEATURES, shap_row, feat_row) if c > 0]
    pos.sort(key=lambda x: -x[1])
    out = []
    for f, c, v in pos[:3]:
        meta = FEATURE_META[f]
        try:   en = meta["reason_high"].format(val=v)
        except: en = meta["reason_high"]
        try:   te = meta["reason_high_te"].format(val=v)
        except: te = meta["reason_high_te"]
        out.append({"feature": f, "label_en": meta["en"], "label_te": meta["te"],
                    "contrib": float(c), "value": float(v) if not np.isnan(v) else None,
                    "sentence_en": en, "sentence_te": te})
    return out


def clean(v):
    if v != v: return None  # NaN
    return v


# ── Student detail JSONs ──────────────────────────────────────────────────────
print("\nWriting student detail JSONs…")
scored_pd = scored.to_pandas()
t0 = time.time()
written = 0
for i, row in scored_pd.iterrows():
    child  = int(row["CHILD_SNO"])
    detail = {
        "child_sno":            child,
        "school_id":            int(row["schoolid"]),
        "school_name":          clean(row.get("school_name")),
        "district_name":        clean(row.get("district_name")),
        "mandal_name":          clean(row.get("mandal_name")),
        "gender":               int(row["GENDER"]),
        "gender_label":         "Female" if row["GENDER"] == 2 else "Male",
        "caste_clean":          int(row["caste_clean"]),
        "age":                  int(row["age"]) if clean(row["age"]) is not None else None,
        "attendance_rate":      float(row["attendance_rate"]),
        "max_consec_absence":   int(row["max_consec_absence"]),
        "fa_avg":               float(row["fa_avg"]) if clean(row["fa_avg"]) is not None else None,
        "sa_avg":               float(row["sa_avg"]) if clean(row["sa_avg"]) is not None else None,
        "migration_flag":       int(row["migration_flag"]),
        "parent_literacy":      int(row["parent_literacy"]),
        "family_income_bracket": int(row["family_income_bracket"]),
        "transport_allowance":  int(row["transport_allowance"]),
        "risk_score":           float(row["risk_score"]),
        "tier":                 row["tier"],
        "drivers":              driver_sentences(shap_vals[i], X[i]),
    }
    (WEB / "students" / f"{child}.json").write_text(json.dumps(detail))
    written += 1
    if written % 10000 == 0:
        elapsed = time.time() - t0
        rate    = written / elapsed
        remaining = (len(scored_pd) - written) / rate
        print(f"  {written:,}/{len(scored_pd):,} ({rate:.0f}/s, ~{remaining/60:.1f}min left)")

print(f"  Wrote {written:,} student files in {time.time()-t0:.1f}s")

# ── Roster files ──────────────────────────────────────────────────────────────
print("\nWriting roster files…")
t0 = time.time()
school_groups = scored_pd.groupby("schoolid", sort=False)
roster_count  = 0
for sid, group in school_groups:
    sub = group.sort_values("risk_score", ascending=False)
    roster = [
        {
            "child_sno":     int(r["CHILD_SNO"]),
            "gender_label":  "Female" if r["GENDER"] == 2 else "Male",
            "attendance_rate": float(r["attendance_rate"]),
            "fa_avg":        float(r["fa_avg"]) if clean(r["fa_avg"]) is not None else None,
            "risk_score":    float(r["risk_score"]),
            "tier":          r["tier"],
        }
        for _, r in sub.iterrows()
    ]
    (WEB / "roster" / f"{int(sid)}.json").write_text(json.dumps(roster))
    roster_count += 1

print(f"  Wrote {roster_count:,} roster files in {time.time()-t0:.1f}s")

# ── School aggregates ─────────────────────────────────────────────────────────
print("\nComputing school aggregates…")
flagged_tiers = {"Critical", "High", "Medium"}
school_agg = []
for sid, group in scored_pd.groupby("schoolid"):
    n_students  = len(group)
    n_flagged   = int((group["tier"].isin(flagged_tiers)).sum())
    avg_risk    = float(group["risk_score"].mean())
    pct_critical = float((group["tier"] == "Critical").mean())
    # grab location from first row (all rows same school)
    row0 = group.iloc[0]
    school_agg.append({
        "school_id":    int(sid),
        "school_name":  clean(row0.get("school_name")),
        "district_name": clean(row0.get("district_name")),
        "mandal_name":  clean(row0.get("mandal_name")),
        "latitude":     float(row0["latitude"]) if clean(row0["latitude"]) is not None else None,
        "longitude":    float(row0["longitude"]) if clean(row0["longitude"]) is not None else None,
        "n_students":   n_students,
        "n_flagged":    n_flagged,
        "avg_risk":     avg_risk,
        "pct_critical": pct_critical,
    })

(WEB / "schools.json").write_text(json.dumps(school_agg))
print(f"  Wrote schools.json ({len(school_agg):,} schools)")

# ── Mandal aggregates ─────────────────────────────────────────────────────────
print("Computing mandal aggregates…")
mandal_agg = []
for (mandal, district), group in scored_pd.groupby(["mandal_name", "district_name"]):
    n_students = len(group)
    n_flagged  = int((group["tier"].isin(flagged_tiers)).sum())
    avg_risk   = float(group["risk_score"].mean())
    row0 = group.iloc[0]
    mandal_agg.append({
        "mandal_name":   clean(mandal),
        "district_name": clean(district),
        "n_students":    n_students,
        "n_flagged":     n_flagged,
        "avg_risk":      avg_risk,
        "latitude":      float(row0["latitude"]) if clean(row0["latitude"]) is not None else None,
        "longitude":     float(row0["longitude"]) if clean(row0["longitude"]) is not None else None,
    })

(WEB / "mandal_aggregates.json").write_text(json.dumps(mandal_agg))
print(f"  Wrote mandal_aggregates.json ({len(mandal_agg):,} mandals)")

print(f"\n✓ 2023-24 export complete → {WEB}")
