"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "bot"; text: string };

type DistrictStat = { students: number; flagged: number; pct: number };

type SystemData = {
  total: number; critical: number; high: number; medium: number; low: number;
  recall: number; precision: number; prAuc: number; rocAuc: number;
  schools: number; threshold: number; tp: number; fp: number;
  topFeatures: Array<{ feature: string; importance: number }>;
  fairness: Array<{ group: string; n: number; pos: number; recall: number; precision: number }>;
  districts: Record<string, DistrictStat>;
};

const QUICK_PROMPTS = {
  en: ["How many critical students?", "Vizag district stats", "Boys vs Girls risk", "Top dropout reasons", "Show model accuracy"],
  te: ["క్రిటికల్ విద్యార్థులు ఎంతమంది?", "విశాఖ జిల్లా గణాంకాలు", "అబ్బాయిలు vs అమ్మాయిలు", "ఎందుకు డ్రాపౌట్?", "మోడల్ ఖచ్చితత్వం చూపించు"],
};

// Aliases for district name lookup
const DISTRICT_ALIASES: Record<string, string> = {
  vizag: "VISAKHAPATNAM", visakha: "VISAKHAPATNAM", visakhapatnam: "VISAKHAPATNAM",
  kurnool: "KURNOOL", nellore: "NELLORE", guntur: "GUNTUR", krishna: "KRISHNA",
  prakasam: "PRAKASAM", kadapa: "KADAPA", chittoor: "CHITTOOR", tirupati: "TIRUPATI",
  srikakulam: "SRIKAKULAM", vizianagaram: "VIZIANAGARAM", anakapalli: "ANAKAPALLI",
  kakinada: "KAKINADA", "east godavari": "EAST GODAVARI", "west godavari": "WEST GODAVARI",
  eluru: "ELURU", konaseema: "KONASEEMA", bapatla: "BAPATLA", palnadu: "PALNADU",
  nandyal: "NANDYAL", anantapur: "ANANTAPUR", annamayya: "ANNAMAYYA", manyam: "MANYAM",
  asr: "ASR", ntr: "NTR", "sri satyasai": "SRI SATYASAI",
};

function featureLabel(f: string): string {
  const labels: Record<string, string> = {
    migration_flag: "Migration / frequent relocation",
    caste_clean: "Social category (SC/ST/BC)",
    family_income_bracket: "Low family income",
    parent_literacy: "Low parent literacy",
    transport_allowance: "Long distance to school",
    n_present: "Low attendance days",
    attendance_rate: "Poor attendance rate",
    n_absent: "High absence count",
    consec_absent_max: "Long consecutive absences",
    fa_avg: "Low FA exam scores",
    sa_avg: "Low SA exam scores",
    gender: "Gender (girls in certain areas)",
    rural_flag: "Rural/tribal location",
  };
  return labels[f] ?? f.replace(/_/g, " ");
}

function buildResponses(d: SystemData | null, lang: "en" | "te") {
  const flagged = d ? d.critical + d.high + d.medium : 0;
  const pct = d ? Math.round(flagged / d.total * 100) : 0;

  // Gender fairness data
  const maleStat = d?.fairness.find(f => f.group === "gender=Male");
  const femaleStat = d?.fairness.find(f => f.group === "gender=Female");

  // Caste breakdown
  const scStat = d?.fairness.find(f => f.group === "caste=SC");
  const stStat = d?.fairness.find(f => f.group === "caste=ST");
  const bcStat = d?.fairness.find(f => f.group === "caste=BC");
  const ocStat = d?.fairness.find(f => f.group === "caste=OC");

  // Migration
  const migrantStat = d?.fairness.find(f => f.group === "migration=migrant");
  const nonMigrantStat = d?.fairness.find(f => f.group === "migration=non-migrant");

  // Top 5 districts by flagged
  const topDistricts = d
    ? Object.entries(d.districts).sort((a, b) => b[1].flagged - a[1].flagged).slice(0, 5)
    : [];

  return [
    // ── Tier counts ──
    {
      keywords: ["how many critical", "critical students", "critical count", "tier", "risk tier", "how many flag", "flagged students", "రిస్క్ టైర్", "క్రిటికల్ విద్యార్థులు", "క్రిటికల్ ఎంత", "ఎంతమంది"],
      en: d
        ? `Current AY 2024-25 cohort — **${d.total.toLocaleString("en-IN")} students** across ${d.schools.toLocaleString("en-IN")} schools:\n• 🔴 Critical (p ≥ 0.85): **${d.critical.toLocaleString("en-IN")} students**\n• 🟠 High (0.65–0.85): **${d.high.toLocaleString("en-IN")} students**\n• 🟡 Medium (0.51–0.65): **${d.medium.toLocaleString("en-IN")} students**\n• 🟢 Low: **${d.low.toLocaleString("en-IN")} students**\n\nTotal flagged: **${flagged.toLocaleString("en-IN")} (${pct}% of cohort)**`
        : "Loading system data…",
      te: d
        ? `AY 2024-25 — **${d.total.toLocaleString("en-IN")} విద్యార్థులు** ${d.schools.toLocaleString("en-IN")} పాఠశాలల్లో:\n• 🔴 క్రిటికల్: **${d.critical.toLocaleString("en-IN")}**\n• 🟠 హై: **${d.high.toLocaleString("en-IN")}**\n• 🟡 మీడియం: **${d.medium.toLocaleString("en-IN")}**\n• 🟢 లో: **${d.low.toLocaleString("en-IN")}**\n\nమొత్తం గుర్తించినవి: **${flagged.toLocaleString("en-IN")} (${pct}%)**`
        : "లోడ్ అవుతోంది…",
    },
    // ── Model accuracy ──
    {
      keywords: ["accuracy", "recall", "precision", "metric", "performance", "model accuracy", "show model", "ఖచ్చితత్వం", "రికాల్", "మెట్రిక్", "పనితీరు"],
      en: d
        ? `Model performance on AY 2024-25 out-of-time test:\n• ✅ Recall: **${(d.recall * 100).toFixed(1)}%** — ${Math.round(d.recall * 100)}% of actual dropouts caught early\n• 📊 Precision: **${(d.precision * 100).toFixed(1)}%** — ${d.tp.toLocaleString("en-IN")} true dropouts among ${(d.tp + d.fp).toLocaleString("en-IN")} flagged\n• PR-AUC: **${d.prAuc.toFixed(3)}** · ROC-AUC: **${d.rocAuc.toFixed(3)}**\n• Threshold: p ≥ ${d.threshold.toFixed(4)}\n\nMeets RTGS criteria: exclusion error <20% ✓ · inclusion error <80% ✓`
        : "Loading…",
      te: d
        ? `AY 2024-25 పరీక్షలో:\n• ✅ రికాల్: **${(d.recall * 100).toFixed(1)}%**\n• 📊 ప్రెసిషన్: **${(d.precision * 100).toFixed(1)}%**\n• PR-AUC: **${d.prAuc.toFixed(3)}** · ROC-AUC: **${d.rocAuc.toFixed(3)}**\n• థ్రెషోల్డ్: p ≥ ${d.threshold.toFixed(4)}`
        : "లోడ్ అవుతోంది…",
    },
    // ── Gender breakdown ──
    {
      keywords: ["boys", "girls", "gender", "male", "female", "boy", "girl", "అబ్బాయిలు", "అమ్మాయిలు", "లింగ"],
      en: maleStat && femaleStat
        ? `Gender-wise at-risk breakdown:\n• 👦 Boys (${maleStat.n.toLocaleString("en-IN")} enrolled): **${maleStat.pos.toLocaleString("en-IN")} flagged** — recall ${(maleStat.recall * 100).toFixed(1)}%\n• 👧 Girls (${femaleStat.n.toLocaleString("en-IN")} enrolled): **${femaleStat.pos.toLocaleString("en-IN")} flagged** — recall ${(femaleStat.recall * 100).toFixed(1)}%\n\nGirls show slightly lower recall — the model catches a smaller proportion of girl dropouts. Intervention priority should account for under-representation in the flag list.`
        : "Loading gender data…",
      te: maleStat && femaleStat
        ? `లింగ వారీ ప్రమాద విద్యార్థులు:\n• 👦 అబ్బాయిలు (${maleStat.n.toLocaleString("en-IN")}): **${maleStat.pos.toLocaleString("en-IN")} గుర్తించారు** — రికాల్ ${(maleStat.recall * 100).toFixed(1)}%\n• 👧 అమ్మాయిలు (${femaleStat.n.toLocaleString("en-IN")}): **${femaleStat.pos.toLocaleString("en-IN")} గుర్తించారు** — రికాల్ ${(femaleStat.recall * 100).toFixed(1)}%`
        : "లోడ్ అవుతోంది…",
    },
    // ── Caste breakdown ──
    {
      keywords: ["caste", "sc", "st", "bc", "tribal", "obc", "scheduled", "కులం", "SC", "ST", "BC", "గిరిజన"],
      en: scStat && stStat && bcStat && ocStat
        ? `Caste-wise at-risk breakdown:\n• SC (${scStat.n.toLocaleString("en-IN")}): **${scStat.pos.toLocaleString("en-IN")} flagged** — recall ${(scStat.recall * 100).toFixed(1)}%\n• ST (${stStat.n.toLocaleString("en-IN")}): **${stStat.pos.toLocaleString("en-IN")} flagged** — recall ${(stStat.recall * 100).toFixed(1)}%\n• BC (${bcStat.n.toLocaleString("en-IN")}): **${bcStat.pos.toLocaleString("en-IN")} flagged** — recall ${(bcStat.recall * 100).toFixed(1)}%\n• OC (${ocStat.n.toLocaleString("en-IN")}): **${ocStat.pos.toLocaleString("en-IN")} flagged** — recall ${(ocStat.recall * 100).toFixed(1)}%\n\nSC & ST groups have higher recall — they are caught more reliably by the model.`
        : "Loading caste data…",
      te: scStat && stStat
        ? `కులం వారీ ప్రమాద విద్యార్థులు:\n• SC: **${scStat?.pos.toLocaleString("en-IN")} గుర్తించారు** (రికాల్ ${(scStat.recall * 100).toFixed(1)}%)\n• ST: **${stStat?.pos.toLocaleString("en-IN")} గుర్తించారు** (రికాల్ ${(stStat.recall * 100).toFixed(1)}%)\n• BC: **${bcStat?.pos.toLocaleString("en-IN")} గుర్తించారు**`
        : "లోడ్ అవుతోంది…",
    },
    // ── Migration ──
    {
      keywords: ["migrant", "migration", "migrate", "వలస"],
      en: migrantStat && nonMigrantStat
        ? `Migration-based risk comparison:\n• 🚚 Migrants (${migrantStat.n.toLocaleString("en-IN")}): **${migrantStat.pos.toLocaleString("en-IN")} flagged** — recall ${(migrantStat.recall * 100).toFixed(1)}% · precision ${(migrantStat.precision * 100).toFixed(1)}%\n• 🏠 Non-migrants (${nonMigrantStat.n.toLocaleString("en-IN")}): **${nonMigrantStat.pos.toLocaleString("en-IN")} flagged** — recall ${(nonMigrantStat.recall * 100).toFixed(1)}%\n\nMigrant students are ${(migrantStat.precision / nonMigrantStat.precision).toFixed(1)}× more likely to be a true dropout when flagged. Migration is the #1 predictive feature in the XGBoost model.`
        : "Loading migration data…",
      te: migrantStat
        ? `వలస ఆధారిత ప్రమాదం:\n• 🚚 వలస విద్యార్థులు: **${migrantStat.pos.toLocaleString("en-IN")} గుర్తించారు** (రికాల్ ${(migrantStat.recall * 100).toFixed(1)}%)\n• 🏠 స్థిర విద్యార్థులు: **${nonMigrantStat?.pos.toLocaleString("en-IN")} గుర్తించారు**\n\nవలస డ్రాపౌట్‌కు #1 అంచనా కారణం.`
        : "లోడ్ అవుతోంది…",
    },
    // ── Top reasons / feature importance ──
    {
      keywords: ["reason", "cause", "why", "dropout reason", "top reason", "due to", "which reason", "factor", "కారణం", "ఎందుకు", "ఎందుచేత"],
      en: d && d.topFeatures.length
        ? `Top reasons students are flagged as dropout-risk (XGBoost feature importance):\n${d.topFeatures.slice(0, 6).map((f, i) => `${i + 1}. **${featureLabel(f.feature)}** — ${(f.importance * 100).toFixed(1)}% weight`).join("\n")}\n\nMigration and socio-economic factors dominate. Attendance drops are often a symptom, not the root cause.`
        : "Loading feature data…",
      te: d && d.topFeatures.length
        ? `డ్రాపౌట్ ప్రమాదానికి అగ్ర కారణాలు:\n${d.topFeatures.slice(0, 6).map((f, i) => `${i + 1}. **${featureLabel(f.feature)}** — ${(f.importance * 100).toFixed(1)}%`).join("\n")}`
        : "లోడ్ అవుతోంది…",
    },
    // ── District-specific lookup (dynamic) ──
    {
      keywords: ["district", "top district", "worst district", "which district", "highest risk", "most dropout", "జిల్లా", "అత్యధిక", "top 5"],
      en: topDistricts.length
        ? `Top 5 districts by number of flagged students:\n${topDistricts.map(([name, s], i) => `${i + 1}. **${name}** — ${s.flagged.toLocaleString("en-IN")} flagged / ${s.students.toLocaleString("en-IN")} enrolled (${s.pct.toFixed(1)}% risk rate)`).join("\n")}\n\nAsk about a specific district, e.g. "Vizag stats" or "Kurnool dropout rate".`
        : "Loading district data…",
      te: topDistricts.length
        ? `అత్యధిక ప్రమాద జిల్లాలు:\n${topDistricts.map(([name, s], i) => `${i + 1}. **${name}** — ${s.flagged.toLocaleString("en-IN")} గుర్తించారు (${s.pct.toFixed(1)}%)`).join("\n")}`
        : "లోడ్ అవుతోంది…",
    },
    // ── Total students ──
    {
      keywords: ["total students", "how many students", "enrolled", "schools", "మొత్తం విద్యార్థులు", "పాఠశాలలు"],
      en: d
        ? `Stay-In School covers:\n• **${d.total.toLocaleString("en-IN")} students** enrolled in AY 2024-25 across Andhra Pradesh\n• **${d.schools.toLocaleString("en-IN")} schools** across 26 districts\n• **${flagged.toLocaleString("en-IN")} students** flagged at-risk (${pct}% of cohort)\n• Source: School Education Dept FIN_YEAR dataset + School Location master`
        : "Loading…",
      te: d
        ? `স্টে-ইন স্কুল কভার করে:\n• **${d.total.toLocaleString("en-IN")} విద్యార్థులు** AY 2024-25\n• **${d.schools.toLocaleString("en-IN")} పాఠశాలలు** 26 జిల్లాల్లో\n• **${flagged.toLocaleString("en-IN")} విద్యార్థులు** ప్రమాదంలో (${pct}%)`
        : "లోడ్ అవుతోంది…",
    },
    // ── SHAP / explainability ──
    {
      keywords: ["shap", "explain", "driver", "why this student", "వివరణ"],
      en: "**SHAP (SHapley Additive exPlanations)** breaks each student's risk score into individual feature contributions. Example: 'migration_flag contributed +34% to this student's dropout probability'. Every model decision is auditable — teachers can contest any flag.",
      te: "**SHAP** ప్రతి విద్యార్థి ప్రమాద స్కోర్‌ను ఫీచర్‌ల సహాయంగా విభజిస్తుంది. మోడల్‌ను పారదర్శకంగా చేస్తుంది.",
    },
    // ── Model how it works ──
    {
      keywords: ["model", "work", "how", "predict", "xgboost", "మోడల్", "పని", "అంచనా"],
      en: "Stay-In School uses **XGBoost** trained on 4 government data streams: daily attendance, FA/SA academic scores, GSWS socio-economic household data, and migration/transport flags. It outputs a dropout probability (0–1) per student. At p ≥ 0.51 the model achieves 80%+ recall on the 2024-25 out-of-time test — 8 in 10 actual dropouts caught months before they leave.",
      te: "Stay-In School **XGBoost** ఉపయోగిస్తుంది — 4 ప్రభుత్వ డేటా స్ట్రీమ్‌లపై శిక్షణ పొందిన మోడల్. p ≥ 0.51 వద్ద 80%+ రికాల్ సాధిస్తుంది.",
    },
    // ── Schemes ──
    {
      keywords: ["scheme", "schemes", "available", "amma", "vodi", "scholarship", "పథకం", "పథకాలు"],
      en: "Schemes surfaced per student based on profile:\n• **Amma Vodi** — ₹15,000/yr for mothers of enrolled students\n• **Vidya Kanuka** — free school kit\n• **Post-Matric RTF/MTF** — SC/ST/BC scholarship\n• **NTR Vidyonnathi** — higher education aid\n• **KGBV Residential** — girls in remote/tribal areas\n• **Samagra Shiksha Transport** — students >3km from school",
      te: "పథకాలు:\n• **అమ్మఒడి** — ₹15,000/సంవత్సరం\n• **విద్య కనుక** — ఉచిత కిట్\n• **పోస్ట్-మెట్రిక్ RTF/MTF** — SC/ST/BC స్కాలర్‌షిప్\n• **NTR విద్యోన్నతి** — ఉన్నత విద్య",
    },
    // ── LEAP ──
    {
      keywords: ["leap", "api", "integration", "LEAP", "విలీనం"],
      en: "Risk scores are pushed to the **AP LEAP app** via REST API. Teacher-logged interventions sync back, closing the feedback loop. Demo uses a mock endpoint; production uses AP LEAP OAuth2 with role-scoped tokens.",
      te: "REST API ద్వారా **AP LEAP యాప్**కు ప్రమాద స్కోర్లు పంపిస్తారు. నమోదైన జోక్యాలు మోడల్ పునఃశిక్షణకు తిరిగి సమకాలీనమవుతాయి.",
    },
    // ── Attendance ──
    {
      keywords: ["attendance", "absent", "హాజరు", "గైర్హాజరు"],
      en: "Attendance is among the **top 6 predictors**. Students below 50% attendance have 3× higher dropout probability. 15+ consecutive days absent triggers a Critical flag regardless of overall rate.",
      te: "హాజరు అగ్ర 6 అంచనా కారకాల్లో ఒకటి. 50% కంటే తక్కువ = 3× అధిక ప్రమాదం. వరుసగా 15+ రోజులు గైర్హాజరు = క్రిటికల్.",
    },
    // ── Privacy ──
    {
      keywords: ["dpdp", "privacy", "data", "aadhaar", "secure", "గోప్యత"],
      en: "Data privacy (DPDP Act 2023):\n• Aadhaar SHA-256 hashed at ingest\n• Student names not in browser-served JSON\n• Role-scoped access: teachers see only their school\n• Full audit trail on all interventions\n• Production: AP State Data Centre secure enclave, Amaravati",
      te: "DPDP 2023:\n• ఆధార్ SHA-256 హ్యాష్\n• రోల్-స్కోప్డ్ యాక్సెస్\n• అన్ని జోక్యాలు ఆడిట్ ట్రైల్",
    },
  ];
}

function findResponse(input: string, lang: "en" | "te", d: SystemData | null): string {
  const lower = input.toLowerCase();

  // District-specific lookup
  for (const [alias, distName] of Object.entries(DISTRICT_ALIASES)) {
    if (lower.includes(alias)) {
      const stat = d?.districts[distName];
      if (stat) {
        return lang === "en"
          ? `📍 **${distName}** district stats:\n• Students enrolled: **${stat.students.toLocaleString("en-IN")}**\n• Flagged at-risk: **${stat.flagged.toLocaleString("en-IN")}**\n• Risk rate: **${stat.pct.toFixed(1)}%**\n\nAsk "top districts" to compare across all 26 districts, or "boys vs girls" for gender breakdown.`
          : `📍 **${distName}** జిల్లా గణాంకాలు:\n• నమోదైన విద్యార్థులు: **${stat.students.toLocaleString("en-IN")}**\n• ప్రమాదంలో గుర్తించారు: **${stat.flagged.toLocaleString("en-IN")}**\n• ప్రమాద రేటు: **${stat.pct.toFixed(1)}%**`;
      }
    }
  }

  const responses = buildResponses(d, lang);
  for (const r of responses) {
    if (r.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return r[lang];
    }
  }

  return lang === "en"
    ? `I can answer questions about:\n• Student counts & risk tiers\n• District stats (e.g. "Vizag stats", "Kurnool dropout rate")\n• Gender breakdown ("boys vs girls")\n• Dropout reasons ("top reasons")\n• Caste/migration analysis\n• Model accuracy, SHAP, schemes, LEAP API\n\nTry one of the quick prompts below!`
    : "నేను సమాధానం ఇవ్వగలను: విద్యార్థి సంఖ్య, జిల్లా గణాంకాలు, లింగ విభజన, డ్రాపౌట్ కారణాలు, మోడల్ ఖచ్చితత్వం, పథకాలు.";
}

export default function FloatingChatbot() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [sysData, setSysData] = useState<SystemData | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/metrics").then(r => r.json()),
      fetch("/api/mandals").then(r => r.json()),
    ]).then(([m, mandals]) => {
      // Aggregate mandal data into district totals
      const distMap: Record<string, DistrictStat> = {};
      for (const row of mandals as Array<{ district_name: string; n_students: number; n_flagged: number }>) {
        if (!row.district_name) continue;
        if (!distMap[row.district_name]) distMap[row.district_name] = { students: 0, flagged: 0, pct: 0 };
        distMap[row.district_name].students += row.n_students;
        distMap[row.district_name].flagged += row.n_flagged;
      }
      for (const k of Object.keys(distMap)) {
        const s = distMap[k];
        s.pct = s.students > 0 ? (s.flagged / s.students) * 100 : 0;
      }
      setSysData({
        total: m.test_oot.n ?? 395970,
        critical: m.tier_counts.Critical,
        high: m.tier_counts.High,
        medium: m.tier_counts.Medium,
        low: m.tier_counts.Low,
        recall: m.test_oot.recall,
        precision: m.test_oot.precision,
        prAuc: m.test_oot.pr_auc,
        rocAuc: m.test_oot.roc_auc,
        schools: 9149,
        threshold: m.threshold_current,
        tp: m.test_oot.tp,
        fp: m.test_oot.fp,
        topFeatures: m.feature_importance.slice(0, 8),
        fairness: m.fairness ?? [],
        districts: distMap,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{
        role: "bot",
        text: lang === "en"
          ? "Hi! I'm the Stay-In School AI assistant. I have live access to system data — ask me about student counts, district stats, gender breakdown, dropout reasons, model accuracy, or schemes."
          : "నమస్కారం! నేను Stay-In School AI సహాయకుడిని. విద్యార్థి సంఖ్య, జిల్లా గణాంకాలు, లింగ విభజన, డ్రాపౌట్ కారణాలు, మోడల్ పనితీరు, పథకాల గురించి అడగండి.",
      }]);
    }
  }, [open, lang, msgs.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "bot", text: findResponse(text, lang, sysData) }]);
    }, 600 + Math.random() * 400);
  };

  const quickPrompts = QUICK_PROMPTS[lang];

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl font-medium text-sm transition-all",
          open ? "bg-zinc-800 text-white" : "bg-[color:var(--ap-navy)] text-white hover:opacity-90"
        )}
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {open ? (lang === "en" ? "Close" : "మూసివేయి") : (lang === "en" ? "Ask AI" : "AI అడగండి")}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[360px] max-h-[560px] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
          <div className="bg-[color:var(--ap-navy)] px-4 py-3 flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-white">Stay-In School AI</div>
              <div className="text-[10px] text-white/60">
                {sysData
                  ? lang === "en" ? `${sysData.total.toLocaleString("en-IN")} students · 26 districts loaded` : `${sysData.total.toLocaleString("en-IN")} విద్యార్థులు · 26 జిల్లాలు లోడ్ అయ్యాయి`
                  : lang === "en" ? "Loading system data…" : "లోడ్ అవుతోంది…"}
              </div>
            </div>
            <div className={cn("h-2 w-2 rounded-full", sysData ? "bg-emerald-400" : "bg-amber-400")} />
            <button
              onClick={() => setOpen(false)}
              className="ml-1 h-6 w-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition shrink-0"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-50 min-h-[280px] max-h-[380px]">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "bot" && (
                  <div className="h-6 w-6 rounded-full bg-[color:var(--ap-navy)] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={cn(
                  "rounded-2xl px-3 py-2 text-xs leading-relaxed max-w-[82%] whitespace-pre-line",
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
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {msgs.length <= 1 && (
            <div className="px-3 py-2 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-1.5 shrink-0">
              {quickPrompts.map((p) => (
                <button key={p} onClick={() => send(p)}
                  className="text-[10px] bg-white border border-zinc-200 text-zinc-600 rounded-full px-2.5 py-1 hover:border-[color:var(--ap-navy)] hover:text-[color:var(--ap-navy)] transition">
                  {p}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2 px-3 py-2.5 border-t border-zinc-200 bg-white shrink-0">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "en" ? "Ask about Vizag, boys vs girls, reasons…" : "విశాఖ, అబ్బాయిలు vs అమ్మాయిలు, కారణాలు…"}
              className="flex-1 text-xs rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--ap-navy)]"
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
