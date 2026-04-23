"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Language } from "./types";

type Ctx = { lang: Language; setLang: (l: Language) => void; toggle: () => void };
const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, toggle: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  useEffect(() => {
    const stored = localStorage.getItem("lang") as Language | null;
    if (stored === "en" || stored === "te") setLang(stored);
  }, []);
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);
  const toggle = () => setLang((l) => (l === "en" ? "te" : "en"));
  return <LangCtx.Provider value={{ lang, setLang, toggle }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

export const T = {
  appName: { en: "AP Dropout Guardian", te: "AP డ్రాపౌట్ గార్డియన్" },
  subtitle: {
    en: "Early-warning system for secondary school dropouts — RTGS / School Education Dept, Govt of Andhra Pradesh",
    te: "సెకండరీ పాఠశాల డ్రాపౌట్‌ల ముందస్తు హెచ్చరిక వ్యవస్థ — RTGS / పాఠశాల విద్యా శాఖ, ఆంధ్రప్రదేశ్ ప్రభుత్వం",
  },
  showing: { en: "Showing", te: "చూపిస్తున్నాము" },
  of: { en: "of", te: "మొత్తం" },
  students: { en: "students", te: "విద్యార్థులు" },
  page: { en: "Page", te: "పేజీ" },
  all: { en: "All", te: "అన్నీ" },
  male: { en: "Male", te: "పురుషుడు" },
  female: { en: "Female", te: "స్త్రీ" },
  tier: { en: "Tier", te: "శ్రేణి" },
  common: {
    home: { en: "Home", te: "హోమ్" },
    myDashboard: { en: "My Dashboard", te: "నా డ్యాష్‌బోర్డ్" },
    signOut: { en: "Sign out", te: "సైన్ అవుట్" },
    signIn: { en: "Sign in", te: "సైన్ ఇన్" },
    systemStatus: { en: "System Status", te: "సిస్టమ్ స్థితి" },
    liveDataFeed: { en: "Live Data Feed", te: "లైవ్ డేటా ఫీడ్" },
    totalStudents: { en: "Total Students", te: "మొత్తం విద్యార్థులు" },
    flagged: { en: "Flagged", te: "గుర్తించినవి" },
    avgRisk: { en: "Avg Risk", te: "సగటు ప్రమాదం" },
    search: { en: "Search", te: "వెతకండి" },
    filter: { en: "Filter", te: "ఫిల్టర్" },
    export: { en: "Export", te: "ఎగుమతి" },
    upload: { en: "Upload CSV", te: "CSV అప్‌లోడ్" },
    uploading: { en: "Uploading...", te: "అప్‌లోడ్ అవుతోంది..." },
    uploaded: { en: "Uploaded", te: "అప్‌లోడ్ అయింది" },
    upToDate: { en: "Up to date", te: "తాజా సమాచారం" },
    updateRequired: { en: "Update Required", te: "అప్‌డేట్ అవసరం" },
    lastUpdated: { en: "Last updated", te: "చివరిగా అప్‌డేట్ చేయబడింది" },
    privacyNotice: { en: "Data Privacy Notice", te: "డేటా గోప్యతా నోటీసు" },
    privacyContent: {
      en: "All uploaded data is encrypted and processed according to DPDP guidelines. Personally Identifiable Information (PII) is masked before being used for AI model training.",
      te: "అప్‌లోడ్ చేసిన మొత్తం డేటా ఎన్‌క్రిప్ట్ చేయబడింది మరియు DPDP మార్గదర్శకాల ప్రకారం ప్రాసెస్ చేయబడుతుంది. AI మోడల్ శిక్షణ కోసం ఉపయోగించే ముందు వ్యక్తిగత గుర్తింపు సమాచారం (PII) మాస్క్ చేయబడుతుంది.",
    },
    ay: { en: "AY 2024-25", te: "విద్యా సంవత్సరం 2024-25" },
    loggedInAs: { en: "Logged in as", te: "లాగిన్ అయ్యారు" },
    attShort: { en: "att.", te: "హాజరు" },
    marksShort: { en: "marks", te: "మార్కులు" },
    cancel: { en: "Cancel", te: "రద్దు" },
    save: { en: "Save", te: "సేవ్" },
    saved: { en: "Saved!", te: "సేవ్ చేయబడింది!" },
  },
  nav: {
    overview: { en: "Model Overview", te: "మోడల్ సారాంశం" },
    map: { en: "District Heatmap", te: "జిల్లా హీట్‌మ్యాప్" },
    teacher: { en: "School Browser", te: "పాఠశాల బ్రౌజర్" },
    students: { en: "Students List", te: "విద్యార్థుల జాబితా" },
    data: { en: "Data Management", te: "డేటా నిర్వహణ" },
  },
  overview: {
    title: { en: "Model Performance & System Overview", te: "మోడల్ పనితీరు మరియు వ్యవస్థ సారాంశం" },
    recall: { en: "Recall (Exclusion protection)", te: "రికాల్ (మిస్ అయిన డ్రాపౌట్‌లు నుండి రక్షణ)" },
    precision: { en: "Precision", te: "ప్రెసిషన్" },
    prAuc: { en: "PR-AUC", te: "PR-AUC" },
    rocAuc: { en: "ROC-AUC", te: "ROC-AUC" },
    pr: { en: "Precision–Recall curve (test 2024-25)", te: "ప్రెసిషన్–రికాల్ కర్వ్ (పరీక్ష 2024-25)" },
    tiers: { en: "Student risk tiers", te: "విద్యార్థుల ప్రమాద శ్రేణులు" },
    fairness: { en: "Fairness audit (by subgroup)", te: "న్యాయం ఆడిట్ (ఉపసమూహం వారీగా)" },
    importance: { en: "Top feature importances", te: "ముఖ్య ఫీచర్ల ప్రాముఖ్యత" },
  },
  tier: {
    Critical: { en: "Critical", te: "అత్యవసరం" },
    High: { en: "High", te: "అధిక" },
    Medium: { en: "Medium", te: "మధ్యస్థ" },
    Low: { en: "Low", te: "తక్కువ" },
  },
  student: {
    riskScore: { en: "Dropout risk score", te: "డ్రాపౌట్ ప్రమాద స్కోర్" },
    profile: { en: "Student profile", te: "విద్యార్థి ప్రొఫైల్" },
    drivers: { en: "Why this student is flagged", te: "ఈ విద్యార్థిని ఎందుకు గుర్తించారు" },
    counsellor: { en: "Counsellor Assist", te: "సలహాదారు సహాయం" },
    schemes: { en: "Recommended support schemes", te: "సూచించిన సహాయ పథకాలు" },
    parentSms: { en: "Parent SMS / WhatsApp", te: "తల్లిదండ్రుల SMS / WhatsApp" },
    teacherScript: { en: "Teacher conversation guide", te: "ఉపాధ్యాయ సంభాషణ మార్గదర్శి" },
    logIntervention: { en: "Log intervention", te: "జోక్యం నమోదు" },
    loggedIntervention: { en: "Intervention logged ✓", te: "జోక్యం నమోదైంది ✓" },
    attendance: { en: "Attendance rate", te: "హాజరు శాతం" },
    marks: { en: "Marks (FA avg)", te: "మార్కులు (FA సగటు)" },
    gender: { en: "Gender", te: "లింగం" },
    age: { en: "Age", te: "వయస్సు" },
    school: { en: "School", te: "పాఠశాల" },
    district: { en: "District", te: "జిల్లా" },
    mandal: { en: "Mandal", te: "మండలం" },
    household: { en: "Household context", te: "కుటుంబ సందర్భం" },
    householdSynthNote: {
      en: "(Fields below are DPDP-restricted — shown here as stand-ins calibrated to AP demographic studies.)",
      te: "(క్రింది ఫీల్డ్‌లు DPDP-పరిమితం — AP జనాభా అధ్యయనాలకు అనుగుణంగా ప్రతిరూపాలుగా చూపబడ్డాయి.)",
    },
    migration: { en: "Seasonal migration", te: "కాలానుగుణ వలస" },
    parentLit: { en: "Parent literacy", te: "తల్లిదండ్రుల అక్షరాస్యత" },
    income: { en: "Income bracket", te: "ఆదాయ వర్గం" },
    transport: { en: "Transport allowance", te: "రవాణా భత్యం" },
    yes: { en: "Yes", te: "అవును" },
    no: { en: "No", te: "లేదు" },
    litLevels: {
      en: ["—", "None", "Primary", "Secondary", "Higher"],
      te: ["—", "లేదు", "ప్రాథమిక", "సెకండరీ", "ఉన్నత"],
    },
    incLevels: {
      en: ["—", "< ₹1L", "₹1–2L", "₹2–5L", "> ₹5L"],
      te: ["—", "< ₹1L", "₹1–2L", "₹2–5L", "> ₹5L"],
    },
  },
  teacherView: {
    title: { en: "Teacher dashboard", te: "ఉపాధ్యాయ డ్యాష్‌బోర్డ్" },
    selectSchool: { en: "Select school", te: "పాఠశాలను ఎంచుకోండి" },
    roster: { en: "Class roster (highest risk first)", te: "తరగతి జాబితా (అత్యధిక ప్రమాదం ముందు)" },
    noFlags: { en: "No flagged students — school is performing well", te: "గుర్తించిన విద్యార్థులు లేరు — పాఠశాల బాగా పనిచేస్తోంది" },
    searchById: { en: "Search by student ID…", te: "విద్యార్థి ID ద్వారా వెతకండి…" },
    noStudentsFound: { en: "No students found", te: "విద్యార్థులు ఎవరూ కనుగొనబడలేదు" },
  },
  teacherDashboard: {
    criticalAlert: {
      en: "student(s) at Critical risk require immediate attention",
      te: "అత్యవసర ప్రమాదంలో ఉన్న విద్యార్థులపై తక్షణ దృష్టి అవసరం",
    },
    criticalAlertSub: {
      en: "Review their profiles below and log interventions today. System will re-evaluate after 30 days.",
      te: "క్రింద వారి ప్రొఫైల్‌లను సమీక్షించండి మరియు ఈరోజే జోక్యాలను నమోదు చేయండి. సిస్టమ్ 30 రోజుల తర్వాత మళ్లీ మూల్యాంకనం చేస్తుంది.",
    },
    trendTitle: { en: "Monthly attendance & flagged count trend", te: "నెలవారీ హాజరు మరియు గుర్తించిన విద్యార్థుల సంఖ్య ధోరణి" },
    simulated: { en: "Simulated for demo", te: "డెమో కోసం అనుకరించబడింది" },
    attendanceLabel: { en: "Attendance %", te: "హాజరు %" },
    flaggedLabel: { en: "Flagged students", te: "గుర్తించిన విద్యార్థులు" },
    rosterTitle: { en: "Class roster — highest risk first", te: "తరగతి జాబితా — అత్యధిక ప్రమాదం ముందు" },
    reviewTop: { en: "Review top critical student", te: "అగ్ర అత్యవసర విద్యార్థిని సమీక్షించండి" },
    reviewTopSub: { en: "See SHAP drivers + counsellor assist", te: "SHAP డ్రైవర్లు + కౌన్సిలర్ సహాయం చూడండి" },
    fullBrowser: { en: "Full school browser", te: "పూర్తి పాఠశాల బ్రౌజర్" },
    fullBrowserSub: { en: "Switch schools, search all students", te: "పాఠశాలలను మార్చండి, విద్యార్థులందరినీ వెతకండి" },
    showingTop: { en: "Showing top 30 of", te: "మొత్తం {count} లో మొదటి 30 చూపిస్తున్నాము" },
    seeFullRoster: { en: "See full roster", te: "పూర్తి జాబితాను చూడండి" },
  },
  dataMgmt: {
    title: { en: "Data Management", te: "డేటా నిర్వహణ" },
    subtitle: { en: "Upload and manage school records to keep the AI risk model updated.", te: "AI ప్రమాద నమూనాను తాజాగా ఉంచడానికి పాఠశాల రికార్డులను అప్‌లోడ్ చేయండి మరియు నిర్వహించండి." },
    attendanceTitle: { en: "Attendance Records", te: "హాజరు రికార్డులు" },
    attendanceDesc: { en: "Daily and monthly attendance data for all students.", te: "విద్యార్థులందరికీ రోజువారీ మరియు నెలవారీ హాజరు డేటా." },
    dropoutsTitle: { en: "Dropouts List", te: "డ్రాపౌట్ల జాబితా" },
    dropoutsDesc: { en: "Official list of students who have discontinued studies.", te: "చదువు మానేసిన విద్యార్థుల అధికారిక జాబితా." },
    economicsTitle: { en: "Family Economics Data", te: "కుటుంబ ఆర్థిక డేటా" },
    economicsDesc: { en: "Household income, occupation, and migration status.", te: "కుటుంబ ఆదాయం, వృత్తి మరియు వలస స్థితి." },
    academicTitle: { en: "Academic Scores", te: "అకడమిక్ స్కోర్లు" },
    academicDesc: { en: "FA/SA exam marks and formative assessment results.", te: "FA/SA పరీక్ష మార్కులు మరియు ఫార్మేటివ్ అసెస్‌మెంట్ ఫలితాలు." },
  },
  interventions: {
    logTitle: { en: "Log Intervention — Student #{id}", te: "జోక్యాన్ని నమోదు చేయండి — విద్యార్థి #{id}" },
    prevIv: { en: "Previous interventions", te: "మునుపటి జోక్యాలు" },
    newIv: { en: "New intervention", te: "కొత్త జోక్యం" },
    actionType: { en: "Action type", te: "చర్య రకం" },
    status: { en: "Status", te: "స్థితి" },
    assignedTo: { en: "Assigned to", te: "కేటాయించబడింది" },
    notes: { en: "Notes", te: "గమనికలు" },
    saveIv: { en: "Save intervention", te: "జోక్యాన్ని సేవ్ చేయండి" },
    feedbackNote: { en: "Feeds closed-loop retraining pipeline → monthly model refresh", te: "క్లోజ్డ్-లూప్ రీట్రైనింగ్ పైప్‌లైన్‌కు ఫీడ్ చేస్తుంది → నెలవారీ మోడల్ రిఫ్రెష్" },
    placeholderNotes: { en: "What was discussed, next steps, parent response…", te: "ఏమి చర్చించారు, తదుపరి దశలు, తల్లిదండ్రుల స్పందన…" },
    placeholderAssign: { en: "Teacher / counsellor name", te: "ఉపాధ్యాయుడు / కౌన్సిలర్ పేరు" },
    types: {
      "Home visit": { en: "Home visit", te: "ఇంటి సందర్శన" },
      "Parent meeting": { en: "Parent meeting", te: "తల్లిదండ్రుల సమావేశం" },
      "Counselling session": { en: "Counselling session", te: "కౌన్సెలింగ్ సెషన్" },
      "Academic support": { en: "Academic support", te: "విద్యా సహాయం" },
      "Financial aid referral": { en: "Financial aid referral", te: "ఆర్థిక సహాయం రిఫరల్" },
      "Transport support": { en: "Transport support", te: "రవాణా సహాయం" },
      "Scheme enrollment (Amma Vodi / Post-Matric Scholarship RTF+MTF / NTR Vidyonnathi)": {
        en: "Scheme enrollment (Amma Vodi / Post-Matric Scholarship RTF+MTF / NTR Vidyonnathi)",
        te: "పథకంలో నమోదు (అమ్మ ఒడి / పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ RTF+MTF / NTR విద్యోన్నతి)",
      },
      "Other": { en: "Other", te: "ఇతర" },
    },
    statuses: {
      pending: { en: "Pending", te: "పెండింగ్‌లో ఉంది" },
      in_progress: { en: "In progress", te: "కొనసాగుతోంది" },
      completed: { en: "Completed", te: "పూర్తయింది" },
    },
  },
  map: {
    title: { en: "Statewide school risk heatmap", te: "రాష్ట్రవ్యాప్తంగా పాఠశాల ప్రమాద హీట్‌మ్యాప్" },
    hint: { en: "Each dot is a school. Colour = average dropout risk. Size = flagged count.", te: "ప్రతి బిందువు ఒక పాఠశాల. రంగు = సగటు డ్రాపౌట్ ప్రమాదం. పరిమాణం = గుర్తించిన సంఖ్య." },
    topMandals: { en: "Mandals with highest dropout risk", te: "అత్యధిక డ్రాపౌట్ ప్రమాదం గల మండలాలు" },
  },
} as const;

export function tr<K extends keyof typeof T>(lang: Language, key: K, sub: keyof (typeof T)[K]): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (T[key] as any)[sub][lang];
}
