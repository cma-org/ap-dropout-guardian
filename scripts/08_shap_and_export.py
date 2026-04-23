"""Compute SHAP for top-risk students + export all Next.js artifacts as JSON.

Outputs under artifacts/ (which will be copied to public/data/ in Next.js):
  - metrics.json
  - pr_curve.json
  - fairness.json
  - feature_importance.json
  - schools.json            (one entry per school: id, name, district, mandal, lat, long, avg_risk, n_students, n_flagged)
  - mandal_aggregates.json  (mandal -> avg_risk, n_students, n_flagged)
  - districts.json          (district list for dropdowns)
  - roster/<schoolid>.json  (roster of students in a school w/ risk tier)
  - students/<child_sno>.json  (detail: score, drivers-EN, drivers-TE, counsellor card)
  - interventions.json      (empty, for closed-loop log)
"""
from pathlib import Path
import json
import pickle
import numpy as np
import polars as pl
import shap

ROOT = Path(__file__).resolve().parents[1]
PROC = ROOT / "data" / "processed"
MOD = ROOT / "models"
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True, parents=True)
(ART / "roster").mkdir(exist_ok=True)
(ART / "students").mkdir(exist_ok=True)

with open(MOD / "xgb_full.pkl", "rb") as f:
    bundle = pickle.load(f)
model = bundle["model"]
FEATURES = bundle["features"]
threshold = bundle["threshold"]

scored = pl.read_parquet(PROC / "scored_24_full.parquet")
print(f"scored rows: {scored.height}")

# Risk tiers from probability
def tier(p):
    if p >= 0.85:
        return "Critical"
    if p >= 0.65:
        return "High"
    if p >= threshold:
        return "Medium"
    return "Low"


tiers = [tier(p) for p in scored["risk_score"].to_list()]
scored = scored.with_columns(pl.Series("tier", tiers))

# ----- SHAP for highest-risk 3000 students (covers all flagged + buffer) -----
X = scored.select(FEATURES).to_numpy().astype(np.float32)
proba = scored["risk_score"].to_numpy()
idx_sorted = np.argsort(-proba)
top_n = 3000
top_idx = idx_sorted[:top_n]

print(f"computing SHAP for top {top_n} risky students...")
explainer = shap.TreeExplainer(model)
shap_vals = explainer.shap_values(X[top_idx])  # shape (top_n, n_features)
print(f"SHAP shape: {shap_vals.shape}")

# Feature display names + plain-English driver generators
FEATURE_META = {
    "attendance_rate": {
        "en": "Attendance rate",
        "te": "హాజరు శాతం",
        "reason_high": "Attendance rate is below average — consistent attendance gaps signal disengagement.",
        "reason_high_te": "హాజరు శాతం సగటు కంటే తక్కువగా ఉంది — నిరంతర గైర్హాజరు నిర్లక్ష్యాన్ని సూచిస్తుంది.",
    },
    "max_consec_absence": {
        "en": "Longest absence streak",
        "te": "అత్యధిక నిరంతర గైర్హాజరు",
        "reason_high": "A long streak of consecutive absences ({val:.0f} days) is a strong disengagement signal.",
        "reason_high_te": "{val:.0f} రోజుల నిరంతర గైర్హాజరు బలమైన నిర్లక్ష్య సూచన.",
    },
    "trend_decline": {
        "en": "Attendance declining over the year",
        "te": "సంవత్సరంలో హాజరు తగ్గుదల",
        "reason_high": "Attendance dropped sharply from early year to late year (gap of {val:.0%}).",
        "reason_high_te": "సంవత్సర ప్రారంభం నుండి చివర వరకు హాజరు {val:.0%} తగ్గింది.",
    },
    "mom_max_drop": {
        "en": "Month-over-month attendance drop",
        "te": "నెల-నుండి-నెల హాజరు తగ్గుదల",
        "reason_high": "Biggest month-to-month attendance drop was {val:.0%} — often a sign of emerging issues.",
        "reason_high_te": "అత్యధిక నెల-నుండి-నెల తగ్గుదల {val:.0%} — ఆవిర్భవిస్తున్న సమస్యల సూచన.",
    },
    "fa_avg": {
        "en": "Formative assessment average",
        "te": "ఫార్మేటివ్ పరీక్షల సగటు",
        "reason_high": "Formative assessment scores are low ({val:.0f} avg).",
        "reason_high_te": "ఫార్మేటివ్ పరీక్షల స్కోర్లు తక్కువగా ఉన్నాయి ({val:.0f} సగటు).",
    },
    "sa_avg": {
        "en": "Summative assessment average",
        "te": "సంగ్రహ పరీక్షల సగటు",
        "reason_high": "Summative exam scores are below class expectations ({val:.0f}).",
        "reason_high_te": "సంగ్రహ పరీక్షల స్కోర్లు తరగతి అంచనాల కంటే తక్కువ ({val:.0f}).",
    },
    "marks_null_count": {
        "en": "Missed assessments",
        "te": "తప్పిన పరీక్షలు",
        "reason_high": "Missed {val:.0f} assessment windows — often a precursor to disengagement.",
        "reason_high_te": "{val:.0f} పరీక్షలు తప్పాయి — తరచుగా నిర్లక్ష్యానికి పూర్వరంగం.",
    },
    "migration_flag": {
        "en": "Seasonal migration",
        "te": "కాలానుగుణ వలస",
        "reason_high": "Family shows seasonal migration pattern — disrupts continuity of schooling.",
        "reason_high_te": "కుటుంబంలో కాలానుగుణ వలస — పాఠశాల కొనసాగింపుకు ఆటంకం.",
    },
    "parent_literacy": {
        "en": "Parent literacy",
        "te": "తల్లిదండ్రుల అక్షరాస్యత",
        "reason_high": "Parent literacy is low — correlates with lower home-based academic support.",
        "reason_high_te": "తల్లిదండ్రుల అక్షరాస్యత తక్కువ — ఇంటి వద్ద విద్యా సహాయం తక్కువ.",
    },
    "family_income_bracket": {
        "en": "Household income",
        "te": "కుటుంబ ఆదాయం",
        "reason_high": "Low household income bracket — financial pressure elevates dropout risk.",
        "reason_high_te": "తక్కువ కుటుంబ ఆదాయం — ఆర్థిక ఒత్తిడి వల్ల డ్రాపౌట్ ప్రమాదం పెరుగుతుంది.",
    },
    "transport_allowance": {
        "en": "Transport allowance eligibility",
        "te": "రవాణా భత్యం అర్హత",
        "reason_high": "Student receives transport allowance — indicates distance/accessibility challenge.",
        "reason_high_te": "విద్యార్థి రవాణా భత్యం పొందుతున్నాడు — దూరం / అందుబాటు సవాలు.",
    },
    "caste_clean": {
        "en": "Social category",
        "te": "సామాజిక వర్గం",
        "reason_high": "Social category historically associated with elevated dropout incidence.",
        "reason_high_te": "చారిత్రకంగా ఎక్కువ డ్రాపౌట్ రేటు గల సామాజిక వర్గం.",
    },
    "GENDER": {
        "en": "Gender",
        "te": "లింగం",
        "reason_high": "Demographic factor — girls in this district face elevated dropout risk.",
        "reason_high_te": "జనాభా అంశం — ఈ జిల్లాలో బాలికలకు డ్రాపౌట్ ప్రమాదం ఎక్కువ.",
    },
    "age": {
        "en": "Age",
        "te": "వయస్సు",
        "reason_high": "Age relative to grade — older-for-grade students are at higher risk.",
        "reason_high_te": "తరగతికి సంబంధించి వయస్సు — తరగతికి పెద్ద వయస్సు గల విద్యార్థులకు ప్రమాదం ఎక్కువ.",
    },
    "latitude": {
        "en": "School location",
        "te": "పాఠశాల స్థానం",
        "reason_high": "School is in a geographic cluster with higher dropout patterns.",
        "reason_high_te": "పాఠశాల అధిక డ్రాపౌట్ ఉన్న భౌగోళిక క్లస్టర్‌లో ఉంది.",
    },
    "longitude": {
        "en": "School location",
        "te": "పాఠశాల స్థానం",
        "reason_high": "School is in a geographic cluster with higher dropout patterns.",
        "reason_high_te": "పాఠశాల అధిక డ్రాపౌట్ ఉన్న భౌగోళిక క్లస్టర్‌లో ఉంది.",
    },
    "n_present": {
        "en": "Days present",
        "te": "హాజరైన రోజులు",
        "reason_high": "Number of days present is below cohort average.",
        "reason_high_te": "హాజరైన రోజులు సగటు కంటే తక్కువ.",
    },
    "n_absent": {
        "en": "Days absent",
        "te": "గైర్హాజరు రోజులు",
        "reason_high": "Number of days absent is unusually high ({val:.0f}).",
        "reason_high_te": "గైర్హాజరు రోజులు అత్యధికం ({val:.0f}).",
    },
    "n_null_days": {
        "en": "Unrecorded days",
        "te": "నమోదు కాని రోజులు",
        "reason_high": "Many days have no attendance record — possible disengagement.",
        "reason_high_te": "చాలా రోజులు హాజరు నమోదు కాలేదు — నిర్లక్ష్యం సూచన.",
    },
}

for f in FEATURES:
    if f not in FEATURE_META:
        FEATURE_META[f] = {"en": f, "te": f, "reason_high": f"{f} contributes to risk.", "reason_high_te": f"{f}."}


def driver_sentences(shap_row, feat_row):
    """Return top 3 risk-increasing drivers as dicts {feature, contrib, en, te}."""
    # consider only features that INCREASE risk (positive SHAP)
    contribs = list(zip(FEATURES, shap_row, feat_row))
    pos = [(f, c, v) for f, c, v in contribs if c > 0]
    pos.sort(key=lambda x: -x[1])
    out = []
    for f, c, v in pos[:3]:
        meta = FEATURE_META[f]
        try:
            en = meta["reason_high"].format(val=v)
        except Exception:
            en = meta["reason_high"]
        try:
            te = meta["reason_high_te"].format(val=v)
        except Exception:
            te = meta["reason_high_te"]
        out.append({
            "feature": f,
            "label_en": meta["en"],
            "label_te": meta["te"],
            "contrib": float(c),
            "value": float(v) if not np.isnan(v) else None,
            "sentence_en": en,
            "sentence_te": te,
        })
    return out


# ----- Per-student detail files for top_n -----
print("writing student detail files...")
scored_cols = scored.columns
scored_pd = scored.to_pandas()
count = 0
for pos, i in enumerate(top_idx):
    row = scored_pd.iloc[i]
    child = int(row["CHILD_SNO"])
    detail = {
        "child_sno": child,
        "school_id": int(row["schoolid"]),
        "school_name": row.get("school_name"),
        "district_name": row.get("district_name"),
        "mandal_name": row.get("mandal_name"),
        "gender": int(row["GENDER"]),
        "gender_label": "Female" if row["GENDER"] == 2 else "Male",
        "caste_clean": int(row["caste_clean"]),
        "age": int(row["age"]) if row["age"] is not None else None,
        "attendance_rate": float(row["attendance_rate"]),
        "max_consec_absence": int(row["max_consec_absence"]),
        "fa_avg": float(row["fa_avg"]) if row["fa_avg"] is not None else None,
        "sa_avg": float(row["sa_avg"]) if row["sa_avg"] is not None else None,
        "migration_flag": int(row["migration_flag"]),
        "parent_literacy": int(row["parent_literacy"]),
        "family_income_bracket": int(row["family_income_bracket"]),
        "transport_allowance": int(row["transport_allowance"]),
        "risk_score": float(row["risk_score"]),
        "tier": row["tier"],
        "drivers": driver_sentences(shap_vals[pos], X[i]),
    }
    (ART / "students" / f"{child}.json").write_text(json.dumps(detail))
    count += 1
print(f"wrote {count} student detail files")

# ----- School-level aggregate + roster files -----
print("computing school aggregates + roster files...")
schools_df = (
    scored_pd.groupby("schoolid", dropna=False)
    .agg(
        school_name=("school_name", "first"),
        district_name=("district_name", "first"),
        mandal_name=("mandal_name", "first"),
        latitude=("latitude", "first"),
        longitude=("longitude", "first"),
        n_students=("CHILD_SNO", "count"),
        n_flagged=("tier", lambda t: (t.isin(["Medium", "High", "Critical"])).sum()),
        avg_risk=("risk_score", "mean"),
        pct_critical=("tier", lambda t: 100 * (t == "Critical").sum() / max(len(t), 1)),
    )
    .reset_index()
)
schools_list = []
for _, r in schools_df.iterrows():
    schools_list.append({
        "school_id": int(r["schoolid"]),
        "school_name": r["school_name"],
        "district_name": r["district_name"],
        "mandal_name": r["mandal_name"],
        "latitude": float(r["latitude"]) if r["latitude"] == r["latitude"] else None,
        "longitude": float(r["longitude"]) if r["longitude"] == r["longitude"] else None,
        "n_students": int(r["n_students"]),
        "n_flagged": int(r["n_flagged"]),
        "avg_risk": float(r["avg_risk"]),
        "pct_critical": float(r["pct_critical"]),
    })
(ART / "schools.json").write_text(json.dumps(schools_list))
print(f"wrote schools.json: {len(schools_list)} schools")

# Roster per school (only write for schools with flagged students to keep dir small)
flagged_schools = schools_df[schools_df["n_flagged"] > 0].sort_values(
    "n_flagged", ascending=False
).head(200)["schoolid"].tolist()
print(f"writing rosters for top {len(flagged_schools)} schools with flagged students...")
for sid in flagged_schools:
    sub = scored_pd[scored_pd["schoolid"] == sid].sort_values("risk_score", ascending=False)
    roster = []
    for _, r in sub.iterrows():
        roster.append({
            "child_sno": int(r["CHILD_SNO"]),
            "gender_label": "Female" if r["GENDER"] == 2 else "Male",
            "attendance_rate": float(r["attendance_rate"]),
            "fa_avg": float(r["fa_avg"]) if r["fa_avg"] == r["fa_avg"] else None,
            "risk_score": float(r["risk_score"]),
            "tier": r["tier"],
        })
    (ART / "roster" / f"{sid}.json").write_text(json.dumps(roster))

# ----- Mandal aggregates -----
mandal_df = (
    scored_pd.groupby("mandal_name", dropna=False)
    .agg(
        district_name=("district_name", "first"),
        n_students=("CHILD_SNO", "count"),
        n_flagged=("tier", lambda t: (t.isin(["Medium", "High", "Critical"])).sum()),
        avg_risk=("risk_score", "mean"),
        latitude=("latitude", "mean"),
        longitude=("longitude", "mean"),
    )
    .reset_index()
)
mandals = []
for _, r in mandal_df.iterrows():
    mandals.append({
        "mandal_name": r["mandal_name"],
        "district_name": r["district_name"],
        "n_students": int(r["n_students"]),
        "n_flagged": int(r["n_flagged"]),
        "avg_risk": float(r["avg_risk"]),
        "latitude": float(r["latitude"]) if r["latitude"] == r["latitude"] else None,
        "longitude": float(r["longitude"]) if r["longitude"] == r["longitude"] else None,
    })
(ART / "mandal_aggregates.json").write_text(json.dumps(mandals))
print(f"wrote mandal_aggregates.json: {len(mandals)} mandals")

# ----- Districts for dropdown -----
districts = sorted(set(
    s["district_name"] for s in schools_list
    if s["district_name"] and isinstance(s["district_name"], str)
))
(ART / "districts.json").write_text(json.dumps(districts))
print(f"wrote districts.json: {len(districts)} districts")

# ----- Overview metrics (rebuild with tier breakdown) -----
metrics_path = ART / "metrics_full.json"
m = json.loads(metrics_path.read_text())
tier_counts = scored_pd["tier"].value_counts().to_dict()
m["tier_counts"] = {k: int(v) for k, v in tier_counts.items()}
m["threshold_current"] = threshold
metrics_path.write_text(json.dumps(m, indent=2))
print(f"updated metrics_full.json with tier counts")

# empty interventions log placeholder
(ART / "interventions.json").write_text("[]")

print("\nArtifact tree:")
for p in sorted(ART.rglob("*")):
    if p.is_file():
        size = p.stat().st_size
        if size > 1024 * 100:
            print(f"  {p.relative_to(ART)}: {size/1024:.1f} KB")
        else:
            print(f"  {p.relative_to(ART)}: {size} B")
print(f"\nTotal files: {sum(1 for _ in ART.rglob('*') if _.is_file())}")
