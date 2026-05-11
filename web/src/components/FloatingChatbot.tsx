"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "bot"; text: string };

// ── data shapes matching backend ─────────────────────────────────────────────
interface SchoolRow {
  school_id: number;
  school_name: string | null;
  district_name: string | null;
  mandal_name: string | null;
  n_students: number;
  n_flagged: number;
  avg_risk: number;
  pct_critical: number;
}

interface MandalRow {
  mandal_name: string | null;
  district_name: string | null;
  n_students: number;
  n_flagged: number;
  avg_risk: number;
}

interface MetricsData {
  threshold: number;
  threshold_current: number;
  test_oot: {
    recall: number; precision: number;
    pr_auc: number; roc_auc: number;
    tp: number; fp: number; fn: number; tn: number;
    exclusion_error: number; inclusion_error: number;
  };
  tier_counts: Record<string, number>;
  feature_importance: Array<{ feature: string; importance: number }>;
  fairness: Array<{
    group: string; n: number; pos: number;
    recall: number | null; precision: number | null;
  }>;
}

interface DistrictStat {
  nSchools: number;
  nStudents: number;
  nFlagged: number;
  avgRisk: number;
  nCritical: number;
  pct: number;
}

interface LiveData {
  // from /api/schools
  totalSchools: number;
  totalStudents: number;
  totalFlagged: number;
  overallAvgRisk: number;
  districts: Record<string, DistrictStat>;        // keyed by UPPER district name
  topSchools: SchoolRow[];                          // top 10 by n_flagged
  // from /api/mandals
  mandals: MandalRow[];
  topMandals: MandalRow[];                          // top 10 by n_flagged
  // from /api/metrics
  metrics: MetricsData;
}

// ── district name normalisation ───────────────────────────────────────────────
const DISTRICT_ALIASES: Record<string, string[]> = {
  vizag:           ["VISAKHAPATNAM"],
  visakha:         ["VISAKHAPATNAM"],
  visakhapatnam:   ["VISAKHAPATNAM"],
  kurnool:         ["KURNOOL"],
  nellore:         ["NELLORE", "SPS NELLORE"],
  guntur:          ["GUNTUR"],
  krishna:         ["KRISHNA"],
  prakasam:        ["PRAKASAM"],
  kadapa:          ["Y.S.R.", "KADAPA", "YSR"],
  chittoor:        ["CHITTOOR"],
  tirupati:        ["TIRUPATI"],
  srikakulam:      ["SRIKAKULAM"],
  vizianagaram:    ["VIZIANAGARAM"],
  anakapalli:      ["ANAKAPALLI"],
  kakinada:        ["KAKINADA"],
  "east godavari": ["EAST GODAVARI", "EAST GODAVARI (KAKINADA)"],
  "west godavari": ["WEST GODAVARI"],
  eluru:           ["ELURU"],
  konaseema:       ["KONASEEMA", "DR. B.R. AMBEDKAR KONASEEMA"],
  bapatla:         ["BAPATLA"],
  palnadu:         ["PALNADU"],
  nandyal:         ["NANDYAL"],
  anantapur:       ["ANANTAPUR", "SRI SATYA SAI"],
  annamayya:       ["ANNAMAYYA"],
  manyam:          ["ALLURI SITARAMARAJU"],
  asr:             ["ALLURI SITARAMARAJU"],
  ntr:             ["NTR"],
};

function resolveDistrict(query: string, districts: Record<string, DistrictStat>): string | null {
  const lower = query.toLowerCase();
  // try alias table first
  for (const [alias, candidates] of Object.entries(DISTRICT_ALIASES)) {
    if (lower.includes(alias)) {
      for (const c of candidates) {
        if (districts[c]) return c;
      }
    }
  }
  // direct substring match on actual district names
  for (const name of Object.keys(districts)) {
    if (lower.includes(name.toLowerCase())) return name;
  }
  return null;
}

function fmt(n: number) { return n.toLocaleString("en-IN"); }
function pct(n: number, decimals = 1) { return `${(n * 100).toFixed(decimals)}%`; }

function featureLabel(f: string) {
  const map: Record<string, string> = {
    migration_flag:        "Seasonal migration / relocation",
    caste_clean:           "Social category (SC/ST/BC)",
    family_income_bracket: "Low household income",
    parent_literacy:       "Low parent literacy",
    transport_allowance:   "Long distance to school",
    attendance_rate:       "Poor attendance rate",
    n_absent:              "High absence count",
    max_consec_absence:    "Long consecutive absences",
    fa_avg:                "Low FA exam scores",
    sa_avg:                "Low SA exam scores",
    gender:                "Gender (girls in certain areas)",
  };
  return map[f] ?? f.replace(/_/g, " ");
}

// ── response builder ──────────────────────────────────────────────────────────
function answer(query: string, lang: "en" | "te", d: LiveData | null, role: Role = "teacher", userName = "", userDistrict = "", userSchoolName = "", userGrade?: number): string {
  if (!d) return lang === "en" ? "Still loading live data, please try again in a moment." : "డేటా లోడ్ అవుతోంది…";

  const lower = query.toLowerCase();
  const m = d.metrics;
  const flagged = d.totalFlagged;

  const deny = (suggestion: string) => lang === "en"
    ? `This information is not available for your role. ${suggestion}`
    : `ఈ సమాచారం మీ పాత్రకు అందుబాటులో లేదు. ${suggestion}`;

  const mySchoolRow = userSchoolName
    ? d.topSchools.find(s => (s.school_name ?? "").toLowerCase() === userSchoolName.toLowerCase())
    : null;

  const teacherSuggestion = `As a Teacher, try "my class", "critical students in my class", "top reasons", or "attendance".`;
  const hmSuggestion = `As a Headmaster, try "my school", "school-wide risk", "gender breakdown", or "model accuracy".`;
  const districtSuggestion = `As a District Officer, try "my district stats", "top mandals", or "school-wise risk comparison".`;

  // ── 1. District-specific lookup ──
  const distName = resolveDistrict(lower, d.districts);
  if (distName) {
    if (role === "teacher") return deny(`District-level data is not available for Teachers. ${teacherSuggestion}`);
    if (role === "hm") return deny(`District-level data is not available for Headmasters. ${hmSuggestion}`);
    const s = d.districts[distName];
    const mandalList = d.mandals
      .filter(row => row.district_name === distName)
      .sort((a, b) => b.n_flagged - a.n_flagged)
      .slice(0, 5);

    const mandalLines = mandalList.map(
      (mn, i) => `   ${i + 1}. ${mn.mandal_name} — ${fmt(mn.n_flagged)} flagged / ${fmt(mn.n_students)} students (${pct(mn.n_flagged / mn.n_students)})`
    ).join("\n");

    return lang === "en"
      ? `📍 **${distName}** district (live data)\n• Schools: ${fmt(s.nSchools)}\n• Students enrolled: ${fmt(s.nStudents)}\n• Flagged at-risk: ${fmt(s.nFlagged)} (${s.pct.toFixed(1)}% flag rate)\n• Avg dropout risk: ${pct(s.avgRisk)}\n• Critical-zone schools: ${s.nCritical}\n\nTop mandals by flagged count:\n${mandalLines}`
      : `📍 **${distName}** జిల్లా (లైవ్ డేటా)\n• పాఠశాలలు: ${fmt(s.nSchools)}\n• నమోదైన విద్యార్థులు: ${fmt(s.nStudents)}\n• ప్రమాదంలో: ${fmt(s.nFlagged)} (${s.pct.toFixed(1)}%)\n• సగటు ప్రమాదం: ${pct(s.avgRisk)}\n• క్రిటికల్ పాఠశాలలు: ${s.nCritical}`;
  }

  // ── 1a. Role-scoped "my district" ──
  if ((/my district|my stats|నా జిల్లా/.test(lower)) && userDistrict && d.districts[userDistrict]) {
    if (role !== "district") return deny(`District stats are only available for District Officers. ${role === "teacher" ? teacherSuggestion : hmSuggestion}`);
    const distName = userDistrict;
    const s = d.districts[distName];
    const mandalList = d.mandals
      .filter(row => row.district_name === distName)
      .sort((a, b) => b.n_flagged - a.n_flagged)
      .slice(0, 5);
    const mandalLines = mandalList.map(
      (mn, i) => `   ${i + 1}. ${mn.mandal_name} — ${fmt(mn.n_flagged)} flagged / ${fmt(mn.n_students)} students (${pct(mn.n_flagged / mn.n_students)})`
    ).join("\n");
    return lang === "en"
      ? `📍 **${distName}** — your district (live data)\n• Schools: ${fmt(s.nSchools)}\n• Students: ${fmt(s.nStudents)}\n• Flagged: ${fmt(s.nFlagged)} (${s.pct.toFixed(1)}% flag rate)\n• Avg risk: ${pct(s.avgRisk)}\n\nTop mandals:\n${mandalLines}`
      : `📍 **${distName}** — మీ జిల్లా (లైవ్ డేటా)\n• పాఠశాలలు: ${fmt(s.nSchools)}\n• విద్యార్థులు: ${fmt(s.nStudents)}\n• ప్రమాదంలో: ${fmt(s.nFlagged)} (${s.pct.toFixed(1)}%)\n• సగటు ప్రమాదం: ${pct(s.avgRisk)}`;
  }

  // ── 1b. Teacher grade/class query ──
  if ((/my class|my grade|class risk|my students|నా తరగతి|నా గ్రేడ్/.test(lower)) && role === "teacher" && userGrade) {
    const schoolName = mySchoolRow?.school_name ?? userSchoolName ?? "your school";
    return lang === "en"
      ? `👩‍🏫 **Your Class (Grade ${userGrade})** at ${schoolName}\n\nYou are assigned to Grade ${userGrade}. The AI assistant can answer class-level questions about risk factors, attendance impact, dropout reasons, and support schemes.\n\n**Available data highlights:**\n• Top dropout risk factors from statewide model\n• Attendance impact on dropout probability\n• Government schemes for student support\n\nTry asking:\n• "top reasons" — top dropout risk factors\n• "schemes" — government support programs\n• "attendance" — how attendance affects risk`
      : `👩‍🏫 **మీ తరగతి (గ్రేడ్ ${userGrade})** ${schoolName} లో\n\nమీరు గ్రేడ్ ${userGrade} కు నియమించబడ్డారు. రిస్క్ ఫ్యాక్టర్లు, హాజరు ప్రభావం, డ్రాపౌట్ కారణాలు మరియు పథకాల గురించి అడగండి.`;
  }

  // ── 2. Mandal query ──
  if (/mandal|మండల/.test(lower)) {
    if (role === "teacher") return deny(`Mandal-level data is not available for Teachers. ${teacherSuggestion}`);
    if (role === "hm") return deny(`Mandal-level data is not available for Headmasters. ${hmSuggestion}`);
    const lines = d.topMandals.slice(0, 8).map(
      (mn, i) => `${i + 1}. **${mn.mandal_name}** (${mn.district_name}) — ${fmt(mn.n_flagged)} flagged / ${fmt(mn.n_students)} students (${pct(mn.n_flagged / mn.n_students)})`
    ).join("\n");
    return lang === "en"
      ? `Top 8 mandals by flagged students (live data):\n${lines}`
      : `అత్యధిక ప్రమాద విద్యార్థులు ఉన్న మండలాలు:\n${lines}`;
  }

  // ── 3. School-specific ──
  if (/school|పాఠశాల/.test(lower) && !/total school|how many school/.test(lower)) {
    // "My school" for HM only — teachers see class-level only
    if ((/my school|నా పాఠశాల/.test(lower)) && userSchoolName) {
      if (role === "teacher") return lang === "en"
        ? `👩‍🏫 As a Teacher, school-wide stats are not available. Try "my class" for your Grade ${userGrade ?? "—"} overview, "critical students" for at-risk counts, or "top reasons" for dropout drivers.`
        : `👩‍🏫 టీచర్‌గా, పాఠశాల గణాంకాలు అందుబాటులో లేవు. "నా తరగతి" ప్రయత్నించండి.`;
      if (role !== "hm") return deny(`School-level data is limited to Headmasters. ${role === "district" ? districtSuggestion : "Try \"statewide coverage\" or \"top 5 districts\"."}`);
      const ms = mySchoolRow;
      if (ms) {
        return lang === "en"
          ? `🏫 **${ms.school_name}** — your school\n• District: ${ms.district_name} · Mandal: ${ms.mandal_name}\n• Students: ${fmt(ms.n_students)} · Flagged: ${fmt(ms.n_flagged)}\n• Avg risk: ${pct(ms.avg_risk)}`
          : `🏫 **${ms.school_name}** — మీ పాఠశాల\n• జిల్లా: ${ms.district_name} · మండలం: ${ms.mandal_name}\n• విద్యార్థులు: ${fmt(ms.n_students)} · ప్రమాదంలో: ${fmt(ms.n_flagged)}`;
      }
    }
    // Named school search — district (within their district) or SED only
    const words = lower.replace(/school/g, "").trim().split(/\s+/).filter(w => w.length > 3);
    const match = words.length
      ? d.topSchools.find(s =>
          words.some(w => (s.school_name ?? "").toLowerCase().includes(w) ||
                          (s.mandal_name ?? "").toLowerCase().includes(w))
        )
      : null;
    if (match) {
      if (role === "teacher") return deny(`School search is not available for Teachers. ${teacherSuggestion}`);
      if (role === "hm") return deny(`School search is not available for Headmasters. ${hmSuggestion}`);
      return lang === "en"
        ? `🏫 **${match.school_name}**\n• District: ${match.district_name} · Mandal: ${match.mandal_name}\n• Students: ${fmt(match.n_students)} · Flagged: ${fmt(match.n_flagged)}\n• Avg risk: ${pct(match.avg_risk)}`
        : `🏫 **${match.school_name}**\n• జిల్లా: ${match.district_name} · మండలం: ${match.mandal_name}\n• విద్యార్థులు: ${fmt(match.n_students)} · ప్రమాదంలో: ${fmt(match.n_flagged)}`;
    }
    // Top critical schools — district or SED only
    if (role === "teacher") return deny(`School-wide comparisons are not available for Teachers. ${teacherSuggestion}`);
    if (role === "hm") return deny(`School-wide comparisons are not available for Headmasters. ${hmSuggestion}`);
    const lines = d.topSchools.slice(0, 6).map(
      (s, i) => `${i + 1}. ${s.school_name} (${s.district_name}) — ${fmt(s.n_flagged)} flagged`
    ).join("\n");
    return lang === "en"
      ? `Top schools by at-risk count (live):\n${lines}\n\nType a school or mandal name to look up a specific school.`
      : `అత్యధిక ప్రమాద పాఠశాలలు:\n${lines}`;
  }

  // ── 4. Tier / counts ──
  if (/critical|tier|flagged|risk tier|how many flag|ఎంతమంది|క్రిటికల్|రిస్క్ టైర్/.test(lower)) {
    const t = m.tier_counts;
    // Teacher: scope to class — share available data
    if (role === "teacher") {
      const t = m.tier_counts;
      return lang === "en"
        ? `📊 **Risk Tier Reference (Statewide)**\nModel flags students into these risk tiers:\n• 🔴 Critical: **${fmt(t.Critical ?? 0)}** — immediate intervention required\n• 🟠 High: **${fmt(t.High ?? 0)}** — needs monitoring\n• 🟡 Medium: **${fmt(t.Medium ?? 0)}** — watchlist\n• 🟢 Low: **${fmt(t.Low ?? 0)}** — on track\n\nFor your Grade ${userGrade ?? "—"} class students, try "top reasons" for what drives dropout risk or check your dashboard for per-student tier details.`
        : `📊 **రిస్క్ టైర్ సూచన (రాష్ట్ర స్థాయి)**\n• 🔴 క్రిటికల్: **${fmt(t.Critical ?? 0)}** — వెంటనే చర్య\n• 🟠 హై: **${fmt(t.High ?? 0)}** — పర్యవేక్షణ\n• 🟡 మీడియం: **${fmt(t.Medium ?? 0)}** — వాచ్‌లిస్ట్\n• 🟢 లో: **${fmt(t.Low ?? 0)}** — సురక్షితం`;
    }
    // HM: scope to school
    if (role === "hm") {
      return lang === "en"
        ? `📊 **Your School — ${mySchoolRow?.school_name ?? userSchoolName ?? "—"}**\n• Students: ${fmt(mySchoolRow ? mySchoolRow.n_students : 0)}\n• Flagged: **${fmt(mySchoolRow ? mySchoolRow.n_flagged : 0)}** (${mySchoolRow ? pct(mySchoolRow.n_flagged / mySchoolRow.n_students) : "—"})\n• Avg risk: ${mySchoolRow ? pct(mySchoolRow.avg_risk) : "—"}\n\nStatewide reference:\n• 🔴 Critical: ${fmt(t.Critical ?? 0)}\n• 🟠 High: ${fmt(t.High ?? 0)}\n• 🟡 Medium: ${fmt(t.Medium ?? 0)}\n• 🟢 Low: ${fmt(t.Low ?? 0)}`
        : `📊 **మీ పాఠశాల**\n• విద్యార్థులు: ${fmt(mySchoolRow ? mySchoolRow.n_students : 0)}\n• ప్రమాదంలో: **${fmt(mySchoolRow ? mySchoolRow.n_flagged : 0)}**\n\nరాష్ట్ర స్థాయి:\n• 🔴 క్రిటికల్: ${fmt(t.Critical ?? 0)}\n• 🟠 హై: ${fmt(t.High ?? 0)}`;
    }
    // District: scope to district
    if (role === "district" && userDistrict && d.districts[userDistrict]) {
      const ds = d.districts[userDistrict];
      return lang === "en"
        ? `📊 **${userDistrict} District**\n• Schools: ${fmt(ds.nSchools)}\n• Students: ${fmt(ds.nStudents)}\n• Flagged: **${fmt(ds.nFlagged)}** (${ds.pct.toFixed(1)}%)\n• Avg risk: ${pct(ds.avgRisk)}\n• Critical-zone schools: ${ds.nCritical}`
        : `📊 **${userDistrict} జిల్లా**\n• పాఠశాలలు: ${fmt(ds.nSchools)}\n• విద్యార్థులు: ${fmt(ds.nStudents)}\n• ప్రమాదంలో: **${fmt(ds.nFlagged)}**\n• సగటు ప్రమాదం: ${pct(ds.avgRisk)}`;
    }
    // SED / fallback: state-wide
    return lang === "en"
      ? `AY 2024-25 cohort across ${fmt(d.totalSchools)} schools (live):\n• 🔴 Critical: **${fmt(t.Critical ?? 0)}**\n• 🟠 High:     **${fmt(t.High ?? 0)}**\n• 🟡 Medium:   **${fmt(t.Medium ?? 0)}**\n• 🟢 Low:      **${fmt(t.Low ?? 0)}**\n\nTotal flagged: **${fmt(flagged)}** — ${pct(flagged / d.totalStudents)} of ${fmt(d.totalStudents)} enrolled students`
      : `AY 2024-25 — ${fmt(d.totalSchools)} పాఠశాలలు (లైవ్):\n• 🔴 క్రిటికల్: **${fmt(t.Critical ?? 0)}**\n• 🟠 హై: **${fmt(t.High ?? 0)}**\n• 🟡 మీడియం: **${fmt(t.Medium ?? 0)}**\n• 🟢 లో: **${fmt(t.Low ?? 0)}**\n\nమొత్తం: **${fmt(flagged)}** (${pct(flagged / d.totalStudents)})`;
  }

  // ── 5. Model accuracy ──
  if (/accuracy|recall|precision|metric|performance|roc|auc|ఖచ్చితత్వం|రికాల్|మెట్రిక్/.test(lower)) {
    if (role === "teacher") return deny(`Model accuracy metrics are not available for Teachers. ${teacherSuggestion}`);
    const oot = m.test_oot;
    return lang === "en"
      ? `Model performance — AY 2024-25 out-of-time test (live):\n• Recall:    **${(oot.recall * 100).toFixed(1)}%** — ${(oot.recall * 100).toFixed(0)}% of actual dropouts caught early\n• Precision: **${(oot.precision * 100).toFixed(1)}%** — ${fmt(oot.tp)} true dropouts in ${fmt(oot.tp + oot.fp)} flagged\n• PR-AUC:  **${oot.pr_auc.toFixed(3)}**  · ROC-AUC: **${oot.roc_auc.toFixed(3)}**\n• Threshold: p ≥ ${m.threshold_current.toFixed(4)}\n• False negatives (missed): ${fmt(oot.fn)}  · False positives: ${fmt(oot.fp)}\n• Exclusion error: ${(oot.exclusion_error * 100).toFixed(1)}%  · Inclusion error: ${(oot.inclusion_error * 100).toFixed(1)}%`
      : `మోడల్ పనితీరు (లైవ్):\n• రికాల్: **${(oot.recall * 100).toFixed(1)}%**\n• ప్రెసిషన్: **${(oot.precision * 100).toFixed(1)}%**\n• PR-AUC: **${oot.pr_auc.toFixed(3)}** · ROC-AUC: **${oot.roc_auc.toFixed(3)}**\n• థ్రెషోల్డ్: p ≥ ${m.threshold_current.toFixed(4)}`;
  }

  // ── 6. Gender ──
  if (/boys|girls|gender|male|female|అబ్బాయి|అమ్మాయి|లింగ/.test(lower)) {
    if (role === "teacher") return deny(`Gender breakdown data is not available for Teachers. ${teacherSuggestion}`);
    const male   = m.fairness.find(f => f.group === "gender=Male");
    const female = m.fairness.find(f => f.group === "gender=Female");
    if (male && female) {
      return lang === "en"
        ? `Gender-wise at-risk breakdown (live fairness data):\n• 👦 Boys  — enrolled: ${fmt(male.n)}, flagged: **${fmt(male.pos)}**, recall: ${((male.recall ?? 0) * 100).toFixed(1)}%, precision: ${((male.precision ?? 0) * 100).toFixed(1)}%\n• 👧 Girls — enrolled: ${fmt(female.n)}, flagged: **${fmt(female.pos)}**, recall: ${((female.recall ?? 0) * 100).toFixed(1)}%, precision: ${((female.precision ?? 0) * 100).toFixed(1)}%\n\nLower recall for girls means the model misses more girl dropouts — prioritise manual review for at-risk girls.`
        : `లింగ వారీ (లైవ్):\n• 👦 అబ్బాయిలు (${fmt(male.n)}): **${fmt(male.pos)} గుర్తించారు** — రికాల్ ${((male.recall ?? 0) * 100).toFixed(1)}%\n• 👧 అమ్మాయిలు (${fmt(female.n)}): **${fmt(female.pos)} గుర్తించారు** — రికాల్ ${((female.recall ?? 0) * 100).toFixed(1)}%`;
    }
    return lang === "en" ? "Gender fairness data not available yet." : "లింగ డేటా అందుబాటులో లేదు.";
  }

  // ── 7. Top districts (must come before caste — "districts" contains "st") ──
  if (/top district|worst district|highest risk|most dropout|అత్యధిక|top 5|top 10/.test(lower)
      || (/district/.test(lower) && /top|worst|rank|list|all|highest|most/.test(lower))) {
    if (role !== "sed") return deny(`Statewide district comparisons are only available for SED officials. ${role === "teacher" ? teacherSuggestion : role === "hm" ? hmSuggestion : districtSuggestion}`);
    const n   = lower.includes("10") ? 10 : 5;
    const top = Object.entries(d.districts)
      .sort((a, b) => b[1].nFlagged - a[1].nFlagged)
      .slice(0, n);
    const lines = top.map(([name, s], i) =>
      `${i + 1}. **${name}** — ${fmt(s.nFlagged)} flagged / ${fmt(s.nStudents)} students (${s.pct.toFixed(1)}%) · avg risk ${pct(s.avgRisk)}`
    ).join("\n");
    return lang === "en"
      ? `Top ${n} districts by flagged students (live):\n${lines}\n\nAsk "Vizag stats", "Kurnool dropout rate", or any district name for details.`
      : `అత్యధిక ప్రమాద జిల్లాలు (లైవ్):\n${top.map(([name, s], i) => `${i + 1}. **${name}** — ${fmt(s.nFlagged)} (${s.pct.toFixed(1)}%)`).join("\n")}`;
  }

  // ── 8. Caste (word-boundary on sc/st/bc to avoid matching "districts", "district" etc.) ──
  if (/caste|\bsc\b|\bst\b|\bbc\b|tribal|scheduled|కులం|గిరిజన/.test(lower)) {
    if (role === "teacher") return deny(`Caste breakdown data is not available for Teachers. ${teacherSuggestion}`);
    const groups = ["caste=SC", "caste=ST", "caste=BC", "caste=OC"].map(g => m.fairness.find(f => f.group === g));
    const [sc, st, bc, oc] = groups;
    if (sc && st && bc) {
      return lang === "en"
        ? `Caste-wise at-risk breakdown (live fairness data):\n• SC — enrolled: ${fmt(sc.n)}, flagged: **${fmt(sc.pos)}**, recall: ${((sc.recall ?? 0) * 100).toFixed(1)}%\n• ST — enrolled: ${fmt(st.n)}, flagged: **${fmt(st.pos)}**, recall: ${((st.recall ?? 0) * 100).toFixed(1)}%\n• BC — enrolled: ${fmt(bc.n)}, flagged: **${fmt(bc.pos)}**, recall: ${((bc.recall ?? 0) * 100).toFixed(1)}%\n${oc ? `• OC — enrolled: ${fmt(oc.n)}, flagged: **${fmt(oc.pos)}**, recall: ${((oc.recall ?? 0) * 100).toFixed(1)}%` : ""}`
        : `కులం వారీ (లైవ్):\n• SC: **${fmt(sc.pos)}** గుర్తించారు (రికాల్ ${((sc.recall ?? 0) * 100).toFixed(1)}%)\n• ST: **${fmt(st.pos)}** గుర్తించారు (రికాల్ ${((st.recall ?? 0) * 100).toFixed(1)}%)\n• BC: **${fmt(bc.pos)}** గుర్తించారు`;
    }
    return lang === "en" ? "Caste breakdown not available yet." : "కులం డేటా అందుబాటులో లేదు.";
  }

  // ── 8. Migration ──
  if (/migrant|migration|migrate|వలస/.test(lower)) {
    if (role !== "sed") return deny(`Migration risk analysis is only available for SED officials. ${role === "teacher" ? teacherSuggestion : role === "hm" ? hmSuggestion : districtSuggestion}`);
    const migrant    = m.fairness.find(f => f.group === "migration=migrant");
    const nonMigrant = m.fairness.find(f => f.group === "migration=non-migrant");
    if (migrant && nonMigrant) {
      const ratio = (nonMigrant.precision ?? 0) > 0
        ? ((migrant.precision ?? 0) / (nonMigrant.precision ?? 0)).toFixed(1)
        : "—";
      return lang === "en"
        ? `Migration risk comparison (live fairness data):\n• 🚚 Migrants    — enrolled: ${fmt(migrant.n)}, flagged: **${fmt(migrant.pos)}**, recall: ${((migrant.recall ?? 0) * 100).toFixed(1)}%, precision: ${((migrant.precision ?? 0) * 100).toFixed(1)}%\n• 🏠 Non-migrants — enrolled: ${fmt(nonMigrant.n)}, flagged: **${fmt(nonMigrant.pos)}**, recall: ${((nonMigrant.recall ?? 0) * 100).toFixed(1)}%\n\nMigrant students are ${ratio}× more likely to be a true dropout when flagged. Migration is the #1 predictor in the XGBoost model.`
        : `వలస ఆధారిత ప్రమాదం (లైవ్):\n• 🚚 వలస: ${fmt(migrant.n)} లో **${fmt(migrant.pos)} గుర్తించారు** (రికాల్ ${((migrant.recall ?? 0) * 100).toFixed(1)}%)\n• 🏠 స్థిర: ${fmt(nonMigrant.n)} లో **${fmt(nonMigrant.pos)} గుర్తించారు**`;
    }
    return lang === "en" ? "Migration data not in fairness metrics." : "వలస డేటా అందుబాటులో లేదు.";
  }

  // ── 9. Reasons / feature importance ──
  if (/reason|cause|why|dropout reason|factor|top reason|కారణం|ఎందుకు/.test(lower)) {
    const feats = m.feature_importance.slice(0, 7);
    const lines = feats.map((f, i) => `${i + 1}. **${featureLabel(f.feature)}** — ${(f.importance * 100).toFixed(1)}% weight`).join("\n");
    // Teachers see the reasons with class-specific tip
    if (role === "teacher") {
      return lang === "en"
        ? `Top dropout risk factors (live model data):\n${lines}\n\nThese factors apply to all students including your Grade ${userGrade ?? "—"} class. Check the Teacher Dashboard for student-level SHAP explanations.`
        : `డ్రాపౌట్ ప్రమాదానికి అగ్ర కారణాలు:\n${feats.map((f, i) => `${i + 1}. **${featureLabel(f.feature)}** — ${(f.importance * 100).toFixed(1)}%`).join("\n")}`;
    }
    return lang === "en"
      ? `Top dropout risk factors (XGBoost feature importance, live):\n${lines}\n\nMigration and socio-economic factors drive risk — attendance drops are often a symptom, not the root cause.`
      : `డ్రాపౌట్ ప్రమాదానికి అగ్ర కారణాలు (లైవ్):\n${feats.map((f, i) => `${i + 1}. **${featureLabel(f.feature)}** — ${(f.importance * 100).toFixed(1)}%`).join("\n")}`;
  }

  // ── 10. Total students / schools coverage ──
  if (/total students|how many students|enrolled|total school|coverage|మొత్తం విద్యార్థులు|పాఠశాలలు/.test(lower)) {
    // Teacher: scope to class
    if (role === "teacher") {
      const sc = mySchoolRow;
      return lang === "en"
        ? `👩‍🏫 **Your Class (Grade ${userGrade ?? "—"}) at ${sc?.school_name ?? userSchoolName ?? "your school"}**\n\nAs a Teacher, you have access to class-level insights. Here's what I can tell you from the data:\n\n**Top dropout risk factors** apply to all students, including yours:\n${m.feature_importance.slice(0, 5).map((f, i) => `${i + 1}. ${featureLabel(f.feature)} — ${(f.importance * 100).toFixed(1)}%`).join("\n")}\n\nTry asking: "top reasons" for detailed dropout drivers, "schemes" for support programs, or "attendance" for risk impact.`
        : `👩‍🏫 **మీ తరగతి (గ్రేడ్ ${userGrade ?? "—"})**\n\nడ్రాపౌట్ ప్రమాద కారణాలు తెలుసుకోవడానికి "top reasons" అడగండి.`;
    }
    // HM: scope to school
    if (role === "hm") {
      if (mySchoolRow) {
        return lang === "en"
          ? `🏫 **${mySchoolRow.school_name}** — your school\n• Students: **${fmt(mySchoolRow.n_students)}**\n• Flagged: **${fmt(mySchoolRow.n_flagged)}** (${pct(mySchoolRow.n_flagged / mySchoolRow.n_students)})\n• Avg risk: ${pct(mySchoolRow.avg_risk)}`
          : `🏫 **మీ పాఠశాల**\n• విద్యార్థులు: **${fmt(mySchoolRow.n_students)}**\n• ప్రమాదంలో: **${fmt(mySchoolRow.n_flagged)}**`;
      }
      return lang === "en"
        ? `Your school enrollment data is available on the HM Dashboard.`
        : `మీ పాఠశాల డేటా HM డ్యాష్‌బోర్డ్‌లో అందుబాటులో ఉంది.`;
    }
    // District: scope to district
    if (role === "district" && userDistrict && d.districts[userDistrict]) {
      const ds = d.districts[userDistrict];
      return lang === "en"
        ? `📍 **${userDistrict} District** — your district\n• Schools: **${fmt(ds.nSchools)}**\n• Students enrolled: **${fmt(ds.nStudents)}**\n• Flagged at-risk: **${fmt(ds.nFlagged)}** (${ds.pct.toFixed(1)}%)\n• Avg risk: ${pct(ds.avgRisk)}`
        : `📍 **${userDistrict} జిల్లా**\n• పాఠశాలలు: **${fmt(ds.nSchools)}**\n• విద్యార్థులు: **${fmt(ds.nStudents)}**\n• ప్రమాదంలో: **${fmt(ds.nFlagged)}**`;
    }
    // SED: state-wide
    return lang === "en"
      ? `Live coverage — AY 2024-25:\n• **${fmt(d.totalStudents)}** students enrolled\n• **${fmt(d.totalSchools)}** schools across ${Object.keys(d.districts).length} districts\n• **${fmt(d.totalFlagged)}** flagged at-risk (${pct(d.totalFlagged / d.totalStudents)} flag rate)\n• Overall avg dropout risk: ${pct(d.overallAvgRisk)}`
      : `లైవ్ కవరేజ్:\n• **${fmt(d.totalStudents)}** విద్యార్థులు\n• **${fmt(d.totalSchools)}** పాఠశాలలు, ${Object.keys(d.districts).length} జిల్లాలు\n• **${fmt(d.totalFlagged)}** ప్రమాదంలో (${pct(d.totalFlagged / d.totalStudents)})`;
  }

  // ── 12. Schemes ──
  if (/scheme|amma vodi|vodi|scholarship|vidya|kgbv|పథకం/.test(lower)) {
    return lang === "en"
      ? "Government schemes surfaced per student profile:\n• **Amma Vodi** — ₹15,000/yr for enrolled students' mothers\n• **Vidya Kanuka** — free school kit at enrolment\n• **Post-Matric RTF/MTF** — SC/ST/BC scholarship\n• **NTR Vidyonnathi** — higher-education aid\n• **KGBV Residential** — girls in remote/tribal mandals\n• **Samagra Shiksha Transport** — students >3km from school"
      : "పథకాలు:\n• **అమ్మఒడి** — ₹15,000/సంవత్సరం\n• **విద్య కనుక** — ఉచిత కిట్\n• **పోస్ట్-మెట్రిక్ RTF/MTF** — SC/ST/BC స్కాలర్‌షిప్\n• **NTR విద్యోన్నతి** — ఉన్నత విద్య\n• **KGBV** — మారుమూల అమ్మాయిలు";
  }

  // ── 13. SHAP / model explainability ──
  if (/shap|explain|why this|driver|వివరణ/.test(lower)) {
    if (role === "teacher") return deny(`Model explainability details are not available for Teachers. ${teacherSuggestion}`);
    return lang === "en"
      ? "**SHAP (SHapley Additive exPlanations)** decomposes each student's risk score into individual feature contributions. Example: 'migration_flag +34%, attendance_rate +22%'. Every prediction is auditable — teachers can contest any flag through the intervention portal."
      : "**SHAP** ప్రతి విద్యార్థి ప్రమాద స్కోర్‌ను ఫీచర్‌ల సహాయంగా విభజిస్తుంది. మోడల్‌ను పారదర్శకంగా చేస్తుంది.";
  }

  // ── 14. Attendance ──
  if (/attendance|absent|హాజరు|గైర్హాజరు/.test(lower)) {
    if (role === "teacher") {
      return lang === "en"
        ? `Attendance is a **top predictor** of dropout risk for your Grade ${userGrade ?? "—"} students.\n• Students below 50% attendance have 3× higher dropout probability\n• 15+ consecutive absent days triggers a Critical flag regardless of overall rate\n• Attendance rate contributes ${((m.feature_importance.find(f => f.feature === "attendance_rate")?.importance ?? 0) * 100).toFixed(1)}% to the risk model\n\nAttendance data syncs daily from the state LEAP portal. Type "top reasons" to see how attendance compares to other risk factors.`
        : `మీ Grade ${userGrade ?? "—"} విద్యార్థులకు హాజరు ప్రధాన అంచనా కారకం. 50% కంటే తక్కువ హాజరు = 3× అధిక ప్రమాదం.`;
    }
    return lang === "en"
      ? `Attendance is among the **top predictors**. From live data:\n• Flag rate across ${fmt(d.totalSchools)} schools avg risk: ${pct(d.overallAvgRisk)}\n• Students below 50% attendance have 3× higher dropout probability\n• 15+ consecutive absent days triggers Critical flag regardless of overall rate\n• Attendance data syncs daily from state LEAP portal`
      : "హాజరు అగ్ర అంచనా కారకాల్లో ఒకటి. 50% కంటే తక్కువ హాజరు = 3× అధిక ప్రమాదం.";
  }

  // ── 15. LEAP / API ──
  if (/leap|api|integration|విలీనం/.test(lower)) {
    return lang === "en"
      ? "Risk scores are pushed to the **AP LEAP app** via REST API. Interventions logged by teachers sync back daily, closing the feedback loop and retraining the model."
      : "REST API ద్వారా **AP LEAP యాప్**కు ప్రమాద స్కోర్లు పంపిస్తారు. నమోదైన జోక్యాలు మోడల్ పునఃశిక్షణకు ఉపయోగపడతాయి.";
  }

  // ── 16. Privacy / DPDP ──
  if (/dpdp|privacy|aadhaar|secure|గోప్యత/.test(lower)) {
    return lang === "en"
      ? "Data privacy (DPDP Act 2023):\n• Aadhaar SHA-256 hashed at ingest — never stored in plain text\n• Student names not served in browser JSON\n• Role-scoped access: teachers see only their school\n• Full audit trail on every intervention\n• Production: AP State Data Centre, Amaravati"
      : "DPDP 2023: ఆధార్ SHA-256 హ్యాష్, రోల్-స్కోప్డ్ యాక్సెస్, అన్ని జోక్యాలు ఆడిట్ ట్రైల్.";
  }

  // ── fallback ──
  const roleTips: Record<Role, { en: string; te: string }> = {
    teacher: {
      en: `📌 **Your Class Only** (Grade ${userGrade ?? "—"})\n• "my class" — your grade overview\n• "critical students" — at-risk counts in context\n• "top reasons" — why students drop out\n• "attendance" — how attendance affects risk\n• "schemes" — support programs available`,
      te: `📌 **మీ తరగతి మాత్రమే** (గ్రేడ్ ${userGrade ?? "—"})\n• "నా తరగతి" — మీ గ్రేడ్ అవలోకనం\n• "క్రిటికల్ విద్యార్థులు" — ప్రమాదం ఉన్నవారు\n• "డ్రాపౌట్ కారణాలు" — ఎందుకు వదిలేస్తారు\n• "హాజరు" — హాజరు ప్రభావం\n• "పథకాలు" — మద్దతు పథకాలు`,
    },
    hm: {
      en: `📌 **Your School Only**\n• "my school" — full school stats\n• "critical students" — school-wide at-risk overview\n• "top reasons" — dropout drivers\n• "gender breakdown" — equity check\n• "attendance" — attendance & risk link\n• "model accuracy" — prediction reliability`,
      te: `📌 **మీ పాఠశాల మాత్రమే**\n• "నా పాఠశాల" — పూర్తి గణాంకాలు\n• "క్రిటికల్ విద్యార్థులు" — ప్రమాద స్థితి\n• "డ్రాపౌట్ కారణాలు" — కారణాలు\n• "లింగ విభజన" — లింగ సమానత్వం\n• "మోడల్ ఖచ్చితత్వం" — అంచనా విశ్వసనీయత`,
    },
    district: {
      en: `📌 **Your District Only**\n• "my district stats" — your district overview\n• "top mandals" — highest-risk mandals\n• "school-wise performance" — compare schools\n• "gender equity" — gender breakdown\n• "model performance" — accuracy metrics\n• "caste breakdown" — social equity`,
      te: `📌 **మీ జిల్లా మాత్రమే**\n• "నా జిల్లా గణాంకాలు" — మీ జిల్లా అవలోకనం\n• "మండలాలు" — అత్యధిక ప్రమాద మండలాలు\n• "లింగ సమానత్వం" — లింగ విభజన\n• "మోడల్ పనితీరు" — ఖచ్చితత్వం\n• "కులం" — సామాజిక సమానత్వం`,
    },
    sed: {
      en: `📌 **Statewide Analytics**\n• "top 5 districts" — highest-risk districts\n• "total students" — state coverage\n• "model accuracy metrics" — PR-AUC, ROC-AUC\n• "caste breakdown" — social equity statewide\n• "privacy" — DPDP Act compliance\n• "migration impact" — migration risk analysis`,
      te: `📌 **రాష్ట్రస్థాయి విశ్లేషణ**\n• "అగ్ర జిల్లాలు" — అత్యధిక ప్రమాద జిల్లాలు\n• "మొత్తం విద్యార్థులు" — రాష్ట్ర కవరేజ్\n• "మోడల్ ఖచ్చితత్వం" — PR-AUC, ROC-AUC\n• "కులం" — సామాజిక సమానత్వం\n• "గోప్యత" — DPDP చట్టం\n• "వలస" — వలస ప్రమాద విశ్లేషణ`,
    },
  };
  const tips = roleTips[role];
  return lang === "en"
    ? `I can answer using live database data. ${userName ? `${userName}, ` : ""}here's what I can help with as a **${role === "teacher" ? "Teacher" : role === "hm" ? "Head Master" : role === "district" ? "District Officer" : "SED Official"}**:\n\n${tips.en}\n\nType a question or try one of the quick prompts below!`
    : `నేను లైవ్ డేటాతో సమాధానం ఇవ్వగలను. ${roleTips[role].te}`;
}

// ── component ─────────────────────────────────────────────────────────────────
const ROLE_QUICK_PROMPTS: Record<Role, { en: string[]; te: string[] }> = {
  teacher: {
    en: ["My class risk status", "Critical students count", "Top dropout reasons", "How to help at-risk students?", "Attendance alerts"],
    te: ["నా తరగతి ప్రమాద స్థితి", "క్రిటికల్ విద్యార్థులు ఎంతమంది?", "డ్రాపౌట్ కారణాలు", "ప్రమాదంలో ఉన్న విద్యార్థులకు సహాయం?", "హాజరు హెచ్చరికలు"],
  },
  hm: {
    en: ["School-wide risk overview", "Critical students in my school", "Top dropout reasons", "Gender breakdown", "Model accuracy"],
    te: ["పాఠశాల ప్రమాద అవలోకనం", "క్రిటికల్ విద్యార్థులు", "డ్రాపౌట్ కారణాలు", "లింగ విభజన", "మోడల్ ఖచ్చితత్వం"],
  },
  district: {
    en: ["My district stats", "Top mandals by flagged", "School-wise risk comparison", "Gender equity breakdown", "Model performance"],
    te: ["నా జిల్లా గణాంకాలు", "అత్యధిక మండలాలు", "పాఠశాలల పోలిక", "లింగ సమానత్వం", "మోడల్ పనితీరు"],
  },
  sed: {
    en: ["Top 5 districts by flagged", "Model accuracy metrics", "Caste equity breakdown", "Data privacy & DPDP", "Statewide coverage"],
    te: ["అగ్ర 5 జిల్లాలు", "మోడల్ ఖచ్చితత్వం", "కులం విభజన", "డేటా గోప్యత & DPDP", "రాష్ట్ర కవరేజ్"],
  },
};

export default function FloatingChatbot() {
  const { lang } = useLang();
  const { user } = useAuth();
  const role: Role    = user?.role ?? "teacher";
  const [open, setOpen]       = useState(false);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [input, setInput]     = useState("");
  const [typing, setTyping]   = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  const loadData = () => {
    setLoadErr(false);
    Promise.all([
      fetch("/api/schools").then(r => r.ok ? r.json() : Promise.reject(r.status)),
      fetch("/api/mandals").then(r => r.ok ? r.json() : Promise.reject(r.status)),
      fetch("/api/metrics").then(r => r.ok ? r.json() : Promise.reject(r.status)),
    ]).then(([schools, mandals, metrics]: [SchoolRow[], MandalRow[], MetricsData]) => {
      // Aggregate districts from schools (accurate per-school data)
      const distMap = new globalThis.Map<string, DistrictStat>();
      for (const s of schools) {
        const d = s.district_name ?? "Unknown";
        if (!distMap.has(d)) distMap.set(d, { nSchools: 0, nStudents: 0, nFlagged: 0, avgRisk: 0, nCritical: 0, pct: 0 });
        const entry = distMap.get(d)!;
        entry.nSchools  += 1;
        entry.nStudents += s.n_students;
        entry.nFlagged  += s.n_flagged;
        entry.avgRisk   += s.avg_risk;
        if (s.pct_critical > 0.05) entry.nCritical += 1;
      }
      const districts: Record<string, DistrictStat> = {};
      for (const [name, entry] of distMap.entries()) {
        entry.avgRisk = entry.nSchools > 0 ? entry.avgRisk / entry.nSchools : 0;
        entry.pct     = entry.nStudents > 0 ? (entry.nFlagged / entry.nStudents) * 100 : 0;
        districts[name] = entry;
      }

      const totalStudents = schools.reduce((a, s) => a + s.n_students, 0);
      const totalFlagged  = schools.reduce((a, s) => a + s.n_flagged, 0);
      const overallAvgRisk = schools.length > 0
        ? schools.reduce((a, s) => a + s.avg_risk, 0) / schools.length : 0;

      const sortedMandals = [...mandals]
        .filter(m => m.n_students > 0)
        .sort((a, b) => b.n_flagged - a.n_flagged);

      setLiveData({
        totalSchools:   schools.length,
        totalStudents,
        totalFlagged,
        overallAvgRisk,
        districts,
        topSchools:     [...schools].sort((a, b) => b.n_flagged - a.n_flagged).slice(0, 20),
        mandals:        sortedMandals,
        topMandals:     sortedMandals.slice(0, 10),
        metrics,
      });
    }).catch(() => setLoadErr(true));
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (open && msgs.length === 0) {
      const roleLabel = role === "teacher" ? "Teacher" : role === "hm" ? "Head Master" : role === "district" ? "District Officer" : "SED Official";
      const greetingTips: Record<Role, string> = {
        teacher: `Ask about your class (Grade ${user?.grade ?? "—"}), at-risk students in your class, dropout reasons, attendance alerts, or support schemes.`,
        hm:      `Ask about your school's risk overview, critical students, gender/caste breakdown, dropout reasons, attendance, or model accuracy.`,
        district:`Ask about your district stats, mandal-level performance, school comparisons, gender equity, or model performance metrics.`,
        sed:     `Ask about statewide coverage, top districts, model accuracy, caste equity, migration impact, or data privacy compliance.`,
      };
      setMsgs([{
        role: "bot",
        text: lang === "en"
          ? `Hi${user?.name ? " " + user.name : ""}! I'm the **Stay-In School AI** assistant. As a **${roleLabel}**, I've tailored the view for you. ${greetingTips[role]}\n\nTry one of the quick prompts below or type your own question!`
          : role === "teacher"
          ? `నమస్కారం${user?.name ? " " + user.name : ""}! నేను **Stay-In School AI** సహాయకుడిని. **${roleLabel}**గా, మీ తరగతి (గ్రేడ్ ${user?.grade ?? "—"}) గురించి అడగండి.`
          : `నమస్కారం${user?.name ? " " + user.name : ""}! నేను **Stay-In School AI** సహాయకుడిని. **${roleLabel}**గా, మీ కోసం వీక్షణను సర్దుబాటు చేసాను.`,
      }]);
    }
  }, [open, lang, msgs.length, role, user?.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          role,
          userName: user?.name ?? "",
          userDistrict: user?.district ?? "",
          userSchoolName: user?.schoolName ?? "",
          userGrade: user?.grade,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setTyping(false);
      setMsgs(m => [...m, { role: "bot", text: data.reply }]);
    } catch {
      setTyping(false);
      setMsgs(m => [...m, { role: "bot", text: answer(text, lang, liveData, role, user?.name ?? "", user?.district ?? "", user?.schoolName ?? "", user?.grade) }]);
    }
  };

  const statusLabel = (() => {
    if (!liveData) return loadErr
      ? (lang === "en" ? "Data load failed" : "డేటా లోడ్ విఫలమైంది")
      : (lang === "en" ? "Loading live data…" : "లైవ్ డేటా లోడ్ అవుతోంది…");
    const ms = user?.schoolName
      ? liveData.topSchools.find(s => (s.school_name ?? "").toLowerCase() === (user.schoolName ?? "").toLowerCase())
      : null;
    if (role === "teacher") {
      if (ms) {
        return lang === "en" ? `${ms.school_name}` : `${ms.school_name}`;
      }
      return lang === "en" ? `Your school` : `మీ పాఠశాల`;
    }
    if (role === "hm") {
      if (ms) {
        return lang === "en"
          ? `${ms.school_name} · ${ms.n_students.toLocaleString("en-IN")} students · ${ms.n_flagged} flagged`
          : `${ms.school_name} · ${ms.n_students.toLocaleString("en-IN")} విద్యార్థులు · ${ms.n_flagged} ప్రమాదం`;
      }
      return lang === "en"
        ? `Your school · ${liveData.totalStudents.toLocaleString("en-IN")} students`
        : `మీ పాఠశాల · ${liveData.totalStudents.toLocaleString("en-IN")} విద్యార్థులు`;
    }
    if (role === "district" && user?.district) {
      const ds = liveData.districts[user.district];
      if (ds) {
        return lang === "en"
          ? `${user.district} · ${ds.nStudents.toLocaleString("en-IN")} students · ${ds.nSchools} schools`
          : `${user.district} · ${ds.nStudents.toLocaleString("en-IN")} విద్యార్థులు · ${ds.nSchools} పాఠశాలలు`;
      }
    }
    return lang === "en"
      ? `${liveData.totalStudents.toLocaleString("en-IN")} students · ${Object.keys(liveData.districts).length} districts`
      : `${liveData.totalStudents.toLocaleString("en-IN")} విద్యార్థులు · ${Object.keys(liveData.districts).length} జిల్లాలు`;
  })();

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl font-medium text-sm transition-all",
          open ? "bg-zinc-800 text-white" : "bg-[color:var(--ap-navy)] text-white hover:opacity-90"
        )}
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {open ? (lang === "en" ? "Close" : "మూసివేయి") : (lang === "en" ? "Ask AI" : "AI అడగండి")}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[380px] max-h-[580px] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-[color:var(--ap-navy)] px-4 py-3 flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white">Stay-In School AI</div>
              <div className="text-[10px] text-white/60 truncate">{statusLabel}</div>
            </div>
            <div className={cn(
              "h-2 w-2 rounded-full shrink-0",
              liveData ? "bg-emerald-400" : loadErr ? "bg-red-400" : "bg-amber-400 animate-pulse"
            )} />
            {loadErr && (
              <button onClick={loadData} className="ml-1 h-6 w-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition shrink-0" title="Retry">
                <RefreshCw className="h-3 w-3 text-white" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="ml-1 h-6 w-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition shrink-0">
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-50 min-h-[300px] max-h-[420px]">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "bot" && (
                  <div className="h-6 w-6 rounded-full bg-[color:var(--ap-navy)] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={cn(
                  "rounded-2xl px-3 py-2 text-xs leading-relaxed max-w-[84%] whitespace-pre-line",
                  m.role === "user"
                    ? "bg-[color:var(--ap-navy)] text-white rounded-tr-sm"
                    : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm"
                )}>
                  {m.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2 items-start">
                <div className="h-6 w-6 rounded-full bg-[color:var(--ap-navy)] flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts — always visible */}
          <div className="px-3 py-2 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-1.5 shrink-0">
            {ROLE_QUICK_PROMPTS[role][lang].map(p => (
              <button key={p} onClick={() => send(p)}
                className="text-[10px] bg-white border border-zinc-200 text-zinc-600 rounded-full px-2.5 py-1 hover:border-[color:var(--ap-navy)] hover:text-[color:var(--ap-navy)] transition">
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex gap-2 px-3 py-2.5 border-t border-zinc-200 bg-white shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={lang === "en" ? "Ask about any district, gender, reasons…" : "జిల్లా, లింగ, కారణాల గురించి అడగండి…"}
              className="flex-1 text-xs rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]"
              suppressHydrationWarning
            />
            <button type="submit" disabled={!input.trim()}
              className="h-8 w-8 rounded-lg bg-[color:var(--ap-navy)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition shrink-0">
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
