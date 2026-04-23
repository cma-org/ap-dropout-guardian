import { promises as fs } from "fs";
import path from "path";
import type {
  Metrics, Mandal, School, StudentDetail, RosterStudent, CounsellorTemplates,
} from "./types";

const PUBLIC = path.join(process.cwd(), "public", "data");

async function readJson<T>(p: string): Promise<T> {
  const buf = await fs.readFile(path.join(PUBLIC, p), "utf8");
  return JSON.parse(buf) as T;
}

export async function getMetrics(): Promise<Metrics> {
  return readJson<Metrics>("metrics_full.json");
}

export async function getSchools(): Promise<School[]> {
  return readJson<School[]>("schools.json");
}

export async function getMandals(): Promise<Mandal[]> {
  return readJson<Mandal[]>("mandal_aggregates.json");
}

export async function getDistricts(): Promise<string[]> {
  return readJson<string[]>("districts.json");
}

export async function getStudent(childSno: number): Promise<StudentDetail | null> {
  try {
    return await readJson<StudentDetail>(`students/${childSno}.json`);
  } catch {
    return null;
  }
}

export async function getRoster(schoolId: number): Promise<RosterStudent[] | null> {
  try {
    return await readJson<RosterStudent[]>(`roster/${schoolId}.json`);
  } catch {
    return null;
  }
}

export async function getFlaggedSchoolIds(): Promise<number[]> {
  const files = await fs.readdir(path.join(PUBLIC, "roster"));
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => parseInt(f.replace(".json", ""), 10));
}

export async function getCounsellorTemplates(): Promise<CounsellorTemplates> {
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
  // alias some features to nearby templates
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
