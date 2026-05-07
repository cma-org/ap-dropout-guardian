import "server-only"; // prevents Turbopack from statically tracing public/data/** into the client bundle
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Metrics, Mandal, School, StudentDetail, RosterStudent, CounsellorTemplates,
} from "./types";

// When API_URL is set the backend handles data; otherwise fall back to static JSON files.
const API_URL = process.env.API_URL;
const PUBLIC = path.join(process.cwd(), "public", "data");

// ─── helpers ─────────────────────────────────────────────────────────────────

async function readJson<T>(p: string): Promise<T> {
  const buf = await fs.readFile(path.join(PUBLIC, p), "utf8");
  return JSON.parse(buf) as T;
}

async function apiFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    next: { revalidate: 300 }, // cache 5 min
  });
  if (!res.ok) throw new Error(`API ${endpoint} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getMetrics(): Promise<Metrics> {
  if (API_URL) return apiFetch<Metrics>("/api/metrics");
  return readJson<Metrics>("metrics_full.json");
}

export async function getSchools(): Promise<School[]> {
  if (API_URL) return apiFetch<School[]>("/api/schools");
  return readJson<School[]>("schools.json");
}

export async function getMandals(): Promise<Mandal[]> {
  if (API_URL) return apiFetch<Mandal[]>("/api/mandals");
  return readJson<Mandal[]>("mandal_aggregates.json");
}

export async function getDistricts(): Promise<string[]> {
  if (API_URL) return apiFetch<string[]>("/api/districts");
  return readJson<string[]>("districts.json");
}

export async function getStudent(childSno: number): Promise<StudentDetail | null> {
  if (API_URL) {
    try {
      return await apiFetch<StudentDetail>(`/api/students/${childSno}`);
    } catch {
      return null;
    }
  }
  try {
    return await readJson<StudentDetail>(`students/${childSno}.json`);
  } catch {
    return null;
  }
}

export async function getRoster(schoolId: number): Promise<RosterStudent[] | null> {
  if (API_URL) {
    try {
      return await apiFetch<RosterStudent[]>(`/api/schools/${schoolId}/roster`);
    } catch {
      return null;
    }
  }
  try {
    return await readJson<RosterStudent[]>(`roster/${schoolId}.json`);
  } catch {
    return null;
  }
}

export async function getFlaggedSchoolIds(): Promise<number[]> {
  if (API_URL) return apiFetch<number[]>("/api/schools/flagged");
  const files = await fs.readdir(path.join(PUBLIC, "roster"));
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => parseInt(f.replace(".json", ""), 10));
}

export async function getCounsellorTemplates(): Promise<CounsellorTemplates> {
  if (API_URL) return apiFetch<CounsellorTemplates>("/api/counsellor-templates");
  return readJson<CounsellorTemplates>("counsellor_templates.json");
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
