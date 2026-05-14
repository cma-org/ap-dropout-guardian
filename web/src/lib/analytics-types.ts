export interface DistrictAnalytics {
  overview: {
    totalSchools: number;
    totalStudents: number;
    totalFlagged: number;
    atRiskPercent: number;
    avgRisk: number;
    avgAttendance: number;
    criticalSchools: number;
    highRiskSchools: number;
  };
  interventionStats: {
    initiated: number;
    completed: number;
    in_progress: number;
    total: number;
    completionRate: number;
  };
  tierDistribution: { tier: string; count: number }[];
  genderDistribution: { label: string; count: number; avgRisk: number; flagged: number }[];
  topDrivers: { feature: string; labelEn: string; labelTe: string; contribution: number; count: number }[];
  incomeCorrelation: { bracket: string; count: number; avgRisk: number }[];
  attendanceCorrelation: { range: string; total: number; atRisk: number; rate: number }[];
  gradeDistribution: { grade: number; total: number; flagged: number; rate: number }[];
  mandals: MandalAnalytics[];
  schools: SchoolAnalytics[];
  topAreas: TopArea[];
  trends: TrendPoint[];
  districtName: string;
}

export interface MandalAnalytics {
  name: string;
  schoolCount: number;
  totalStudents: number;
  totalFlagged: number;
  avgRisk: number;
  flagRate: number;
  criticalSchools: number;
}

export interface SchoolAnalytics {
  schoolId: number;
  schoolName: string;
  mandalName: string;
  totalStudents: number;
  totalFlagged: number;
  pctFlagged: number;
  avgRisk: number;
  avgAttendance: number;
  pctCritical: number;
  maleCount: number;
  femaleCount: number;
}

export interface TopArea {
  name: string;
  flagged: number;
  rate: number;
  schools: number;
}

export interface TrendPoint {
  month: string;
  flagged: number;
  interventions: number;
}
