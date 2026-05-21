import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/district/:districtName", async (req, res) => {
  try {
    const districtName = req.params.districtName as string;
    const { academicYear = "2024-25" } = req.query as { academicYear?: string };

    const schools = await prisma.school.findMany({ where: { districtName, academicYear } });

    const studentAggr = await prisma.rosterStudent.aggregate({
      where: { school: { districtName, academicYear } },
      _count: { childSno: true },
      _avg: { attendanceRate: true, riskScore: true },
    });

    const tierGroups = await prisma.rosterStudent.groupBy({
      by: ["tier"],
      where: { school: { districtName, academicYear } },
      _count: { childSno: true },
    });

    const genderGroups = await prisma.rosterStudent.groupBy({
      by: ["genderLabel"],
      where: { school: { districtName, academicYear } },
      _count: { genderLabel: true },
      _avg: { riskScore: true },
    });

    const driverGroups = await prisma.driver.groupBy({
      by: ["feature", "labelEn", "labelTe"],
      where: { student: { districtName, academicYear } },
      _avg: { contrib: true },
      _count: { feature: true },
      orderBy: { _avg: { contrib: "desc" as const } },
      take: 10,
    });

    const interventionGroups = await prisma.intervention.groupBy({
      by: ["status"],
      where: { student: { districtName, academicYear } },
      _count: { status: true },
    });

    const incomeGroups = await prisma.rosterStudent.groupBy({
      by: ["familyIncomeBracket"],
      where: { school: { districtName, academicYear } },
      _count: { childSno: true },
      _avg: { riskScore: true },
    });

    const buckets = [
      { gte: 0, lt: 0.5, label: "<50%" },
      { gte: 0.5, lt: 0.75, label: "50-75%" },
      { gte: 0.75, lt: 0.9, label: "75-90%" },
      { gte: 0.9, lt: 1.1, label: "≥90%" },
    ];
    const attendanceAggs = [];
    for (const b of buckets) {
      const [total, atRisk] = await Promise.all([
        prisma.rosterStudent.count({ where: { school: { districtName, academicYear }, attendanceRate: { gte: b.gte, lt: b.lt } } }),
        prisma.rosterStudent.count({
          where: { school: { districtName, academicYear }, attendanceRate: { gte: b.gte, lt: b.lt }, tier: { in: ["Critical", "High"] } },
        }),
      ]);
      attendanceAggs.push({ ...b, total, atRisk });
    }

    const ageGroups = await prisma.studentDetail.groupBy({
      by: ["age"],
      where: { districtName, academicYear, age: { not: null } },
      _count: { _all: true },
    });

    const totalRosterCount = await prisma.rosterStudent.count({
      where: { school: { districtName, academicYear } }
    });

    const activeAges = ageGroups.map(g => g.age).filter(a => a !== null) as number[];
    const numGrades = activeAges.length || 1;
    const estimatedTotalPerGrade = Math.round(totalRosterCount / numGrades);

    const gradeAggs = [];
    for (const group of ageGroups) {
      const age = group.age as number;
      const grade = age - 6;
      if (grade < 1 || grade > 12) continue;

      const flagged = await prisma.studentDetail.count({
        where: { districtName, academicYear, age, tier: { in: ["Critical", "High"] } }
      });

      const total = estimatedTotalPerGrade;
      gradeAggs.push({ grade, total, flagged, rate: total > 0 ? flagged / total : 0 });
    }
    gradeAggs.sort((a, b) => a.grade - b.grade);

    const allStudents = (await prisma.rosterStudent.findMany({
      where: { school: { districtName, academicYear } },
      select: {
        childSno: true, attendanceRate: true, riskScore: true,
        tier: true, genderLabel: true, schoolId: true,
        school: { select: { mandalName: true } }
      },
    })).map(s => ({
      ...s,
      mandalName: s.school?.mandalName ?? "Unknown"
    }));

    const totalStudents = schools.reduce((s, sch) => s + sch.nStudents, 0);
    const totalFlagged = schools.reduce((s, sch) => s + sch.nFlagged, 0);
    const totalSchools = schools.length;

    const nCritical = Math.round(schools.reduce((s, sch) => s + (sch.nStudents * (sch.pctCritical || 0) / 100), 0));
    const nHigh = totalFlagged - nCritical;
    const nOther = totalStudents - totalFlagged;

    const mediumInRoster = (tierGroups as any[]).find((t: any) => t.tier === "Medium")?._count?.childSno ?? 0;
    const lowInRoster = (tierGroups as any[]).find((t: any) => t.tier === "Low")?._count?.childSno ?? 0;
    const otherInRoster = mediumInRoster + lowInRoster;

    const nMedium = otherInRoster > 0 ? Math.round(nOther * (mediumInRoster / otherInRoster)) : Math.round(nOther * 0.15);
    const nLow = nOther - nMedium;

    const tierDistribution = [
      { tier: "Critical", count: nCritical },
      { tier: "High", count: nHigh },
      { tier: "Medium", count: nMedium },
      { tier: "Low", count: nLow },
    ];

    const genderDistribution = (genderGroups as any[]).map(g => ({
      label: g.genderLabel as string,
      count: g._count?.genderLabel as number ?? 0,
      avgRisk: (g._avg?.riskScore as number) ?? 0,
    }));

    const genderFlagged = await Promise.all(
      genderDistribution.map(async (g) => {
        const flagged = await prisma.rosterStudent.count({
          where: { school: { districtName, academicYear }, genderLabel: g.label, tier: { in: ["Critical", "High"] } },
        });
        return { ...g, flagged };
      })
    );

    const topDrivers = (driverGroups as any[]).map(d => ({
      feature: d.feature as string,
      labelEn: d.labelEn as string,
      labelTe: d.labelTe as string,
      contribution: Math.round(((d._avg?.contrib as number) ?? 0) * 10000) / 10000,
      count: d._count?.feature as number ?? 0,
    }));

    const interventionMap: Record<string, number> = {};
    (interventionGroups as any[]).forEach((i: any) => { interventionMap[i.status as string] = i._count?.status as number ?? 0; });
    const interventionStats = {
      initiated: interventionMap.pending ?? 0,
      completed: interventionMap.completed ?? 0,
      in_progress: interventionMap["in_progress"] ?? 0,
      total: Object.values(interventionMap).reduce((a, b) => a + b, 0),
      completionRate: (() => {
        const total = Object.values(interventionMap).reduce((a, b) => a + b, 0);
        return total > 0 ? (interventionMap.completed ?? 0) / total : 0;
      })(),
    };

    const incomeCorrelation = (incomeGroups as any[]).map((i: any) => ({
      bracket: `Bracket ${i.familyIncomeBracket as number}`,
      count: i._count?.childSno as number ?? 0,
      avgRisk: (i._avg?.riskScore as number) ?? 0,
    })).sort((a: any, b: any) => a.bracket.localeCompare(b.bracket));

    const attendanceCorrelation = attendanceAggs.map(a => ({
      range: a.label,
      total: a.total,
      atRisk: a.atRisk,
      rate: a.total > 0 ? a.atRisk / a.total : 0,
    }));

    const gradeDistribution = gradeAggs;

    const mandalMap = new Map<string, { schoolList: typeof schools; students: number; flagged: number; riskSum: number }>();
    for (const s of schools) {
      const key = s.mandalName ?? "Unknown";
      if (!mandalMap.has(key)) mandalMap.set(key, { schoolList: [], students: 0, flagged: 0, riskSum: 0 });
      const m = mandalMap.get(key)!;
      m.schoolList.push(s);
      m.students += s.nStudents;
      m.flagged += s.nFlagged;
      m.riskSum += s.avgRisk;
    }
    const mandals = Array.from(mandalMap.entries()).map(([name, data]) => ({
      name,
      schoolCount: data.schoolList.length,
      totalStudents: data.students,
      totalFlagged: data.flagged,
      avgRisk: data.schoolList.length > 0 ? data.riskSum / data.schoolList.length : 0,
      flagRate: data.students > 0 ? data.flagged / data.students : 0,
      criticalSchools: data.schoolList.filter(s => s.pctCritical > 0.05).length,
    })).sort((a, b) => b.flagRate - a.flagRate);

    const schoolData = schools.map(s => {
      const schoolStudents = allStudents.filter(st => Number(st.schoolId) === Number(s.schoolId));
      const avgAtt = schoolStudents.length > 0
        ? schoolStudents.reduce((sum, st) => sum + st.attendanceRate, 0) / schoolStudents.length
        : 0;
      return {
        schoolId: Number(s.schoolId),
        schoolName: s.schoolName ?? "Unknown",
        mandalName: s.mandalName ?? "Unknown",
        totalStudents: s.nStudents,
        totalFlagged: s.nFlagged,
        pctFlagged: s.nStudents > 0 ? s.nFlagged / s.nStudents : 0,
        avgRisk: s.avgRisk,
        avgAttendance: avgAtt,
        pctCritical: s.pctCritical,
        maleCount: schoolStudents.filter(st => st.genderLabel === "Male").length,
        femaleCount: schoolStudents.filter(st => st.genderLabel === "Female").length,
      };
    }).sort((a, b) => b.pctFlagged - a.pctFlagged);

    const areaMap = new Map<string, { flagged: number; total: number; schoolSet: Set<number> }>();
    for (const s of schools) {
      const key = s.mandalName ?? "Unknown";
      if (!areaMap.has(key)) areaMap.set(key, { flagged: 0, total: 0, schoolSet: new Set() });
      const a = areaMap.get(key)!;
      a.flagged += s.nFlagged;
      a.total += s.nStudents;
      a.schoolSet.add(Number(s.schoolId));
    }
    const topAreasData = Array.from(areaMap.entries()).map(([name, data]) => ({
      name,
      flagged: data.flagged,
      rate: data.total > 0 ? data.flagged / data.total : 0,
      schools: data.schoolSet.size,
    })).sort((a, b) => b.rate - a.rate);

    const trendMonths = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const allInterventions = await prisma.intervention.findMany({
      where: { student: { districtName, academicYear } },
      select: { createdAt: true },
    });
    const interventionsPerMonth: Record<string, number> = {};
    for (const iv of allInterventions) {
      const m = iv.createdAt.toLocaleString("en-US", { month: "short" });
      interventionsPerMonth[m] = (interventionsPerMonth[m] ?? 0) + 1;
    }
    const trends = trendMonths.map((month) => ({
      month,
      flagged: totalFlagged,
      interventions: interventionsPerMonth[month] ?? 0,
    }));

    res.json({
      overview: {
        totalSchools,
        totalStudents,
        totalFlagged,
        atRiskPercent: totalStudents > 0 ? totalFlagged / totalStudents : 0,
        avgRisk: studentAggr._avg?.riskScore ?? 0,
        avgAttendance: studentAggr._avg?.attendanceRate ?? 0,
        criticalSchools: schools.filter(s => s.pctCritical > 0.05).length,
        highRiskSchools: schools.filter(s => s.avgRisk > 0.1).length,
      },
      interventionStats,
      tierDistribution,
      genderDistribution: genderFlagged,
      topDrivers,
      incomeCorrelation,
      attendanceCorrelation,
      gradeDistribution,
      mandals,
      schools: schoolData,
      topAreas: topAreasData,
      trends,
      districtName,
      academicYear,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
