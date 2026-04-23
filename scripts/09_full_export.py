"""Full export: roster for ALL schools + student detail JSONs for ALL students.

Keeps the same artifact structure as 08_shap_and_export.py but with:
- roster/<schoolid>.json  for every school (not just top 200)
- students/<child_sno>.json for every student (not just top 3000)

SHAP is run in one batch on the full dataset — TreeExplainer is fast O(n).
"""
from pathlib import Path
import json, pickle, time
import numpy as np
import polars as pl
import shap

ROOT = Path(__file__).resolve().parents[1]
PROC = ROOT / "data" / "processed"
MOD  = ROOT / "models"
ART  = ROOT / "artifacts"
WEB  = ROOT / "web" / "public" / "data"

ART.mkdir(exist_ok=True, parents=True)
(ART / "roster").mkdir(exist_ok=True)
(ART / "students").mkdir(exist_ok=True)
(WEB / "roster").mkdir(exist_ok=True, parents=True)
(WEB / "students").mkdir(exist_ok=True, parents=True)

# ── Load model ────────────────────────────────────────────────────────────────
with open(MOD / "xgb_full.pkl", "rb") as f:
    bundle = pickle.load(f)
model     = bundle["model"]
FEATURES  = bundle["features"]
threshold = bundle["threshold"]

# ── Load scored dataset ───────────────────────────────────────────────────────
scored = pl.read_parquet(PROC / "scored_24_full.parquet")
print(f"Total students: {scored.height:,}")

def tier(p):
    if p >= 0.85: return "Critical"
    if p >= 0.65: return "High"
    if p >= threshold: return "Medium"
    return "Low"

tiers  = [tier(p) for p in scored["risk_score"].to_list()]
scored = scored.with_columns(pl.Series("tier", tiers))

# ── SHAP — full dataset in one shot ──────────────────────────────────────────
X = scored.select(FEATURES).to_numpy().astype(np.float32)
print(f"Computing SHAP for {len(X):,} students…")
t0 = time.time()
explainer = shap.TreeExplainer(model)
shap_vals = explainer.shap_values(X)
print(f"SHAP done in {time.time()-t0:.1f}s — shape: {shap_vals.shape}")

# ── Feature metadata (bilingual) ──────────────────────────────────────────────
FEATURE_META = {
    "attendance_rate":      {"en":"Attendance rate","te":"హాజరు శాతం","reason_high":"Attendance rate is critically low ({val:.0%}) — persistent absence is the strongest single predictor.","reason_high_te":"హాజరు శాతం చాలా తక్కువ ({val:.0%}) — నిరంతర గైర్హాజరు అత్యంత ముఖ్యమైన సూచిక."},
    "max_consec_absence":   {"en":"Longest absence streak","te":"నిరంతర గైర్హాజరు","reason_high":"A streak of {val:.0f} consecutive absent days — strong disengagement signal.","reason_high_te":"{val:.0f} రోజుల నిరంతర గైర్హాజరు — బలమైన నిర్లక్ష్య సూచన."},
    "trend_decline":        {"en":"Attendance declining over the year","te":"హాజరు తగ్గుదల","reason_high":"Attendance dropped {val:.0%} from early to late year.","reason_high_te":"సంవత్సర ప్రారంభం నుండి చివర వరకు హాజరు {val:.0%} తగ్గింది."},
    "mom_max_drop":         {"en":"Month-over-month attendance drop","te":"నెల-నెలా హాజరు తగ్గుదల","reason_high":"Biggest single-month drop was {val:.0%}.","reason_high_te":"అత్యధిక నెల తగ్గుదల {val:.0%}."},
    "fa_avg":               {"en":"Formative assessment average","te":"ఫార్మేటివ్ పరీక్షల సగటు","reason_high":"FA marks: {val:.0f} — well below the pass threshold.","reason_high_te":"FA మార్కులు: {val:.0f} — పాస్ పరిమితి కంటే చాలా తక్కువ."},
    "sa_avg":               {"en":"Summative assessment average","te":"సంగ్రహ పరీక్షల సగటు","reason_high":"SA marks: {val:.0f} — below class expectations.","reason_high_te":"SA మార్కులు: {val:.0f} — తరగతి అంచనాల కంటే తక్కువ."},
    "marks_null_count":     {"en":"Missed assessments","te":"తప్పిన పరీక్షలు","reason_high":"Missed {val:.0f} assessment windows — often a precursor to dropout.","reason_high_te":"{val:.0f} పరీక్షలు తప్పాయి — తరచుగా డ్రాపౌట్‌కు పూర్వరంగం."},
    "migration_flag":       {"en":"Seasonal migration","te":"కాలానుగుణ వలస","reason_high":"Family shows seasonal migration pattern — disrupts continuity of schooling.","reason_high_te":"కుటుంబంలో కాలానుగుణ వలస — పాఠశాల కొనసాగింపుకు ఆటంకం."},
    "parent_literacy":      {"en":"Parent literacy","te":"తల్లిదండ్రుల అక్షరాస్యత","reason_high":"Parent literacy is low — correlates with lower home-based academic support.","reason_high_te":"తల్లిదండ్రుల అక్షరాస్యత తక్కువ — ఇంటి వద్ద విద్యా సహాయం తక్కువ."},
    "family_income_bracket":{"en":"Household income","te":"కుటుంబ ఆదాయం","reason_high":"Low household income bracket — financial pressure elevates dropout risk.","reason_high_te":"తక్కువ కుటుంబ ఆదాయం — ఆర్థిక ఒత్తిడి వల్ల డ్రాపౌట్ ప్రమాదం పెరుగుతుంది."},
    "transport_allowance":  {"en":"Transport allowance eligibility","te":"రవాణా భత్యం అర్హత","reason_high":"Student receives transport allowance — indicates distance/accessibility challenge.","reason_high_te":"విద్యార్థి రవాణా భత్యం పొందుతున్నాడు — దూరం/అందుబాటు సవాలు."},
    "caste_clean":          {"en":"Social category","te":"సామాజిక వర్గం","reason_high":"Social category historically associated with elevated dropout incidence.","reason_high_te":"చారిత్రకంగా ఎక్కువ డ్రాపౌట్ రేటు గల సామాజిక వర్గం."},
    "GENDER":               {"en":"Gender","te":"లింగం","reason_high":"Demographic factor — girls in this district face elevated dropout risk.","reason_high_te":"జనాభా అంశం — ఈ జిల్లాలో బాలికలకు డ్రాపౌట్ ప్రమాదం ఎక్కువ."},
    "age":                  {"en":"Age","te":"వయస్సు","reason_high":"Older-for-grade students are at higher dropout risk.","reason_high_te":"తరగతికి పెద్ద వయస్సు గల విద్యార్థులకు ప్రమాదం ఎక్కువ."},
    "latitude":             {"en":"School location","te":"పాఠశాల స్థానం","reason_high":"School is in a geographic cluster with higher dropout patterns.","reason_high_te":"పాఠశాల అధిక డ్రాపౌట్ ఉన్న భౌగోళిక క్లస్టర్‌లో ఉంది."},
    "longitude":            {"en":"School location","te":"పాఠశాల స్థానం","reason_high":"School is in a geographic cluster with higher dropout patterns.","reason_high_te":"పాఠశాల అధిక డ్రాపౌట్ ఉన్న భౌగోళిక క్లస్టర్‌లో ఉంది."},
    "n_present":            {"en":"Days present","te":"హాజరైన రోజులు","reason_high":"Number of days present is well below cohort average.","reason_high_te":"హాజరైన రోజులు సగటు కంటే చాలా తక్కువ."},
    "n_absent":             {"en":"Days absent","te":"గైర్హాజరు రోజులు","reason_high":"Number of absent days is high ({val:.0f}).","reason_high_te":"గైర్హాజరు రోజులు అత్యధికం ({val:.0f})."},
    "n_null_days":          {"en":"Unrecorded days","te":"నమోదు కాని రోజులు","reason_high":"Many attendance days unrecorded — possible disengagement.","reason_high_te":"చాలా రోజులు హాజరు నమోదు కాలేదు — నిర్లక్ష్యం సూచన."},
}
for f in FEATURES:
    if f not in FEATURE_META:
        FEATURE_META[f] = {"en": f, "te": f, "reason_high": f"{f} contributes to elevated risk.", "reason_high_te": f"{f}."}

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

# ── Student detail JSONs — ALL students ───────────────────────────────────────
print("Writing student detail JSONs for all students…")
scored_pd = scored.to_pandas()
t0 = time.time()

def clean(v):
    if v != v: return None  # NaN check
    return v

written = 0
for i, row in scored_pd.iterrows():
    child  = int(row["CHILD_SNO"])
    detail = {
        "child_sno": child,
        "school_id": int(row["schoolid"]),
        "school_name": clean(row.get("school_name")),
        "district_name": clean(row.get("district_name")),
        "mandal_name": clean(row.get("mandal_name")),
        "gender": int(row["GENDER"]),
        "gender_label": "Female" if row["GENDER"] == 2 else "Male",
        "caste_clean": int(row["caste_clean"]),
        "age": int(row["age"]) if clean(row["age"]) is not None else None,
        "attendance_rate": float(row["attendance_rate"]),
        "max_consec_absence": int(row["max_consec_absence"]),
        "fa_avg": float(row["fa_avg"]) if clean(row["fa_avg"]) is not None else None,
        "sa_avg": float(row["sa_avg"]) if clean(row["sa_avg"]) is not None else None,
        "migration_flag": int(row["migration_flag"]),
        "parent_literacy": int(row["parent_literacy"]),
        "family_income_bracket": int(row["family_income_bracket"]),
        "transport_allowance": int(row["transport_allowance"]),
        "risk_score": float(row["risk_score"]),
        "tier": row["tier"],
        "drivers": driver_sentences(shap_vals[i], X[i]),
    }
    js = json.dumps(detail)
    path_art = ART / "students" / f"{child}.json"
    path_web = WEB / "students" / f"{child}.json"
    path_art.write_text(js)
    path_web.write_text(js)
    written += 1
    if written % 10000 == 0:
        elapsed = time.time() - t0
        rate = written / elapsed
        remaining = (len(scored_pd) - written) / rate
        print(f"  {written:,}/{len(scored_pd):,} ({rate:.0f}/s, ~{remaining/60:.1f}min left)")

print(f"Wrote {written:,} student detail files in {time.time()-t0:.1f}s")

# ── Roster for ALL schools ────────────────────────────────────────────────────
print("Writing roster files for ALL schools…")
t0 = time.time()
school_groups = scored_pd.groupby("schoolid", sort=False)
roster_count = 0
for sid, group in school_groups:
    sub = group.sort_values("risk_score", ascending=False)
    roster = []
    for _, r in sub.iterrows():
        roster.append({
            "child_sno": int(r["CHILD_SNO"]),
            "gender_label": "Female" if r["GENDER"] == 2 else "Male",
            "attendance_rate": float(r["attendance_rate"]),
            "fa_avg": float(r["fa_avg"]) if clean(r["fa_avg"]) is not None else None,
            "risk_score": float(r["risk_score"]),
            "tier": r["tier"],
        })
    js = json.dumps(roster)
    (ART / "roster" / f"{int(sid)}.json").write_text(js)
    (WEB / "roster" / f"{int(sid)}.json").write_text(js)
    roster_count += 1

print(f"Wrote {roster_count:,} roster files in {time.time()-t0:.1f}s")
print("\nDone. All schools and all students exported.")
