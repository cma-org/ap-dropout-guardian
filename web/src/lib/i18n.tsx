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
  nav: {
    overview: { en: "Model Overview", te: "మోడల్ సారాంశం" },
    map: { en: "District Heatmap", te: "జిల్లా హీట్‌మ్యాప్" },
    teacher: { en: "School Browser", te: "పాఠశాల బ్రౌజర్" },
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
