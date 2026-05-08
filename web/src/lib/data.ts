import "server-only";
import type {
  Metrics, Mandal, School, StudentDetail, RosterStudent, CounsellorTemplates,
} from "./types";

// API_URL is required — the app does not fall back to local JSON files.
const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error(
    "API_URL environment variable is not set. " +
    "Set it to the backend URL (e.g. http://localhost:3001) in .env.local."
  );
}

// ─── helper ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(endpoint: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      next: { revalidate: 300 }, // cache 5 min
    });
  } catch (cause) {
    throw new Error(
      `Cannot reach backend at ${API_URL}${endpoint}. ` +
      `Make sure the server is running (cd server && npm run dev). ` +
      `Underlying error: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause }
    );
  }
  if (!res.ok) throw new Error(`API ${endpoint} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getMetrics(): Promise<Metrics> {
  return apiFetch<Metrics>("/api/metrics");
}

export async function getSchools(): Promise<School[]> {
  return apiFetch<School[]>("/api/schools");
}

export async function getSchool(schoolId: number): Promise<School | null> {
  try {
    return await apiFetch<School>(`/api/schools/${schoolId}`);
  } catch {
    return null;
  }
}

export async function getMandals(): Promise<Mandal[]> {
  return apiFetch<Mandal[]>("/api/mandals");
}

export async function getDistricts(): Promise<string[]> {
  return apiFetch<string[]>("/api/districts");
}

export async function getStudent(childSno: number): Promise<StudentDetail | null> {
  try {
    return await apiFetch<StudentDetail>(`/api/students/${childSno}`);
  } catch {
    return null;
  }
}

export async function getRoster(schoolId: number): Promise<RosterStudent[] | null> {
  try {
    return await apiFetch<RosterStudent[]>(`/api/schools/${schoolId}/roster`);
  } catch {
    return null;
  }
}

export async function getFlaggedSchoolIds(): Promise<number[]> {
  return apiFetch<number[]>("/api/schools/flagged");
}

export async function getCounsellorTemplates(): Promise<CounsellorTemplates> {
  return apiFetch<CounsellorTemplates>("/api/counsellor-templates");
}

export function pickCounsellorTemplate(
  topDriverFeature: string,
  templates: CounsellorTemplates
) {
  const keys = [
    "migration_flag",
    "max_consec_absence",
    "attendance_rate",
    "family_income_bracket",
    "parent_literacy",
    "transport_allowance",
  ];
  if (keys.includes(topDriverFeature) && templates.templates[topDriverFeature]) {
    return { key: topDriverFeature, tpl: templates.templates[topDriverFeature] };
  }
  const alias: Record<string, string> = {
    n_absent: "attendance_rate",
    n_present: "attendance_rate",
    n_null_days: "attendance_rate",
    trend_decline: "attendance_rate",
    mom_max_drop: "attendance_rate",
    fa_avg: "attendance_rate",
    sa_avg: "attendance_rate",
    marks_null_count: "attendance_rate",
  };
  if (alias[topDriverFeature] && templates.templates[alias[topDriverFeature]]) {
    return { key: alias[topDriverFeature], tpl: templates.templates[alias[topDriverFeature]] };
  }
  return { key: "default", tpl: templates.templates.default };
}
