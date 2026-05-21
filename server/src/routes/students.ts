import { Router } from "express";
import { prisma } from "../lib/prisma";
import { transformStudent } from "../lib/transform";

const router = Router();

// GET /api/students?schoolId=&tier=&district=&academicYear=2024-25&limit=100&offset=0
router.get("/", async (req, res) => {
  try {
    const {
      schoolId,
      tier,
      district,
      academicYear = "2024-25",
      limit = "100",
      offset = "0",
    } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { academicYear };
    if (schoolId) where.schoolId = BigInt(schoolId);
    if (tier) where.tier = tier;
    if (district) where.districtName = district;

    const [students, total] = await Promise.all([
      prisma.studentDetail.findMany({
        where,
        include: { drivers: { orderBy: { contrib: "desc" } } },
        orderBy: { riskScore: "desc" },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.studentDetail.count({ where }),
    ]);

    res.json({ students: students.map(transformStudent), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/students/:childSno?academicYear=2024-25
router.get("/:childSno", async (req, res) => {
  try {
    const childSno = parseInt(req.params.childSno, 10);
    const academicYear = (req.query.academicYear as string) ?? "2024-25";

    if (isNaN(childSno)) {
      res.status(400).json({ error: "Invalid student ID" });
      return;
    }

    const student = await prisma.studentDetail.findUnique({
      where: { childSno_academicYear: { childSno, academicYear } },
      include: { drivers: { orderBy: { contrib: "desc" } } },
    });

    if (!student) {
      // Fallback: synthesize a partial profile from roster data
      const roster = await prisma.rosterStudent.findFirst({
        where: { childSno, academicYear },
        include: { school: true },
      });
      if (!roster) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json({
        child_sno: roster.childSno,
        school_id: Number(roster.schoolId),
        school_name: roster.school.schoolName,
        district_name: roster.school.districtName,
        mandal_name: roster.school.mandalName,
        gender: roster.genderLabel === "Male" ? 1 : 2,
        gender_label: roster.genderLabel,
        caste_clean: roster.casteClean ?? 0,
        age: null,
        attendance_rate: roster.attendanceRate,
        max_consec_absence: 0,
        fa_avg: roster.faAvg,
        sa_avg: null,
        migration_flag: roster.migrationFlag ?? 0,
        parent_literacy: 0,
        family_income_bracket: roster.familyIncomeBracket ?? 0,
        transport_allowance: 0,
        risk_score: roster.riskScore,
        tier: roster.tier,
        drivers: [],
        partial: true,
      });
      return;
    }

    res.json(transformStudent(student));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
