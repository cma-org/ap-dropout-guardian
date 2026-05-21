import { Router } from "express";
import { prisma } from "../lib/prisma";
import { transformSchool, transformRosterStudent } from "../lib/transform";

const router = Router();

// GET /api/schools?district=NTR&academicYear=2024-25
router.get("/", async (req, res) => {
  try {
    const { district, academicYear = "2024-25" } = req.query as { district?: string; academicYear?: string };
    const where: Record<string, unknown> = { academicYear };
    if (district) where.districtName = district;

    const schools = await prisma.school.findMany({
      where,
      orderBy: { schoolName: "asc" },
      include: { _count: { select: { rosterStudents: true } } },
    });

    res.json(schools.map((s) => ({
      ...transformSchool(s),
      has_roster: s._count.rosterStudents > 0,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/schools/flagged?academicYear=2024-25  — must be declared before /:schoolId
router.get("/flagged", async (req, res) => {
  try {
    const { academicYear = "2024-25" } = req.query as { academicYear?: string };
    const schools = await prisma.school.findMany({
      where: { nFlagged: { gt: 0 }, academicYear },
      select: { schoolId: true },
    });
    res.json(schools.map((s) => Number(s.schoolId)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/schools/:schoolId?academicYear=2024-25
router.get("/:schoolId", async (req, res) => {
  try {
    const { academicYear = "2024-25" } = req.query as { academicYear?: string };
    const school = await prisma.school.findUnique({
      where: { schoolId_academicYear: { schoolId: BigInt(req.params.schoolId), academicYear } },
    });
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }
    res.json(transformSchool(school));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/schools/:schoolId/roster?academicYear=2024-25
router.get("/:schoolId/roster", async (req, res) => {
  try {
    const { academicYear = "2024-25" } = req.query as { academicYear?: string };
    const roster = await prisma.rosterStudent.findMany({
      where: { schoolId: BigInt(req.params.schoolId), academicYear },
      orderBy: { riskScore: "desc" },
    });
    if (!roster.length) {
      res.status(404).json({ error: "No roster found for this school" });
      return;
    }
    res.json(roster.map(transformRosterStudent));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
