import type { School, Mandal, RosterStudent, Driver, StudentDetail, Metrics } from "@prisma/client";

type SchoolWithRelations = School;
type MandalRecord = Mandal;
type RosterStudentRecord = RosterStudent;
type DriverRecord = Driver;
type StudentWithDrivers = StudentDetail & { drivers: DriverRecord[] };

export function transformSchool(s: SchoolWithRelations) {
  return {
    school_id: Number(s.schoolId),
    school_name: s.schoolName,
    district_name: s.districtName,
    mandal_name: s.mandalName,
    latitude: s.latitude,
    longitude: s.longitude,
    n_students: s.nStudents,
    n_flagged: s.nFlagged,
    avg_risk: s.avgRisk,
    pct_critical: s.pctCritical,
  };
}

export function transformMandal(m: MandalRecord) {
  return {
    mandal_name: m.mandalName,
    district_name: m.districtName,
    n_students: m.nStudents,
    n_flagged: m.nFlagged,
    avg_risk: m.avgRisk,
    latitude: m.latitude,
    longitude: m.longitude,
  };
}

export function transformRosterStudent(r: RosterStudentRecord) {
  return {
    child_sno: r.childSno,
    gender_label: r.genderLabel,
    attendance_rate: r.attendanceRate,
    fa_avg: r.faAvg,
    risk_score: r.riskScore,
    tier: r.tier,
    grade: r.grade ?? undefined,
    migration_flag: r.migrationFlag ?? undefined,
    caste_clean: r.casteClean ?? undefined,
    family_income_bracket: r.familyIncomeBracket ?? undefined,
  };
}

export function transformDriver(d: DriverRecord) {
  return {
    feature: d.feature,
    label_en: d.labelEn,
    label_te: d.labelTe,
    contrib: d.contrib,
    value: d.value,
    sentence_en: d.sentenceEn,
    sentence_te: d.sentenceTe,
  };
}

export function transformStudent(s: StudentWithDrivers) {
  return {
    child_sno: s.childSno,
    school_id: Number(s.schoolId),
    school_name: s.schoolName,
    district_name: s.districtName,
    mandal_name: s.mandalName,
    gender: s.gender,
    gender_label: s.genderLabel,
    caste_clean: s.casteClean,
    age: s.age,
    attendance_rate: s.attendanceRate,
    max_consec_absence: s.maxConsecAbsence,
    fa_avg: s.faAvg,
    sa_avg: s.saAvg,
    migration_flag: s.migrationFlag,
    parent_literacy: s.parentLiteracy,
    family_income_bracket: s.familyIncomeBracket,
    transport_allowance: s.transportAllowance,
    risk_score: s.riskScore,
    tier: s.tier,
    drivers: s.drivers.map(transformDriver),
  };
}
