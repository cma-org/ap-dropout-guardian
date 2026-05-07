export type RiskTier = "Critical" | "High" | "Medium" | "Low";

export interface School {
  school_id: number;
  school_name: string | null;
  district_name: string | null;
  mandal_name: string | null;
  latitude: number | null;
  longitude: number | null;
  n_students: number;
  n_flagged: number;
  avg_risk: number;
  pct_critical: number;
}

export interface Mandal {
  mandal_name: string | null;
  district_name: string | null;
  n_students: number;
  n_flagged: number;
  avg_risk: number;
  latitude: number | null;
  longitude: number | null;
}

export interface RosterStudent {
  child_sno: number;
  gender_label: string;
  attendance_rate: number;
  fa_avg: number | null;
  risk_score: number;
  tier: RiskTier;
  grade?: number;
  migration_flag?: number;
  caste_clean?: number;
  family_income_bracket?: number;
}

export interface Driver {
  feature: string;
  label_en: string;
  label_te: string;
  contrib: number;
  value: number | null;
  sentence_en: string;
  sentence_te: string;
}

export interface StudentDetail {
  child_sno: number;
  school_id: number;
  school_name: string | null;
  district_name: string | null;
  mandal_name: string | null;
  gender: number;
  gender_label: string;
  caste_clean: number;
  age: number | null;
  attendance_rate: number;
  max_consec_absence: number;
  fa_avg: number | null;
  sa_avg: number | null;
  migration_flag: number;
  parent_literacy: number;
  family_income_bracket: number;
  transport_allowance: number;
  risk_score: number;
  tier: RiskTier;
  drivers: Driver[];
  /** True when only roster-level data is available — full risk analysis is absent */
  partial?: boolean;
}

export interface Metrics {
  threshold: number;
  threshold_current: number;
  train: { recall: number; precision: number; pr_auc: number; roc_auc: number; tp: number; fp: number; fn: number; tn: number };
  test_oot: { recall: number; precision: number; pr_auc: number; roc_auc: number; tp: number; fp: number; fn: number; tn: number; exclusion_error: number; inclusion_error: number };
  fairness: { group: string; n: number; pos: number; recall: number | null; precision: number | null }[];
  feature_importance: { feature: string; importance: number }[];
  pr_curve: { precision: number[]; recall: number[] };
  tier_counts: Record<RiskTier, number>;
  note?: string;
}

export interface CounsellorTemplate {
  parent_sms_en: string;
  parent_sms_te: string;
  teacher_script_en: string;
  teacher_script_te: string;
  schemes: { name: string; benefit: string }[];
}

export interface CounsellorTemplates {
  version: number;
  note: string;
  templates: Record<string, CounsellorTemplate>;
}

export type Language = "en" | "te";

export const TIER_COLORS: Record<RiskTier, string> = {
  Critical: "bg-red-600 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-400 text-black",
  Low: "bg-emerald-600 text-white",
};

export const TIER_BORDER: Record<RiskTier, string> = {
  Critical: "border-red-600",
  High: "border-orange-500",
  Medium: "border-yellow-500",
  Low: "border-emerald-600",
};

export const TIER_BG_SOFT: Record<RiskTier, string> = {
  Critical: "bg-red-50",
  High: "bg-orange-50",
  Medium: "bg-yellow-50",
  Low: "bg-emerald-50",
};
