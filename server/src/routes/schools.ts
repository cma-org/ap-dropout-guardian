import { Router } from "express";
import { prisma } from "../lib/prisma";
import { transformSchool, transformRosterStudent } from "../lib/transform";

const router = Router();

// GET /api/schools?district=NTR
router.get("/", async (req, res) => {
  try {
    const { district } = req.query as { district?: string };
    const where = district ? { districtName: district } : {};

    const schools = await prisma.school.findMany({
      where,
      orderBy: { schoolName: "asc" },
    });

    res.json(schools.map(transformSchool));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/schools/flagged  — must be declared before /:schoolId
router.get("/flagged", async (_req, res) => {
  try {
    const schools = await prisma.school.findMany({
      where: { nFlagged: { gt: 0 } },
      select: { schoolId: true },
    });
    res.json(schools.map((s) => Number(s.schoolId)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/schools/:schoolId
router.get("/:schoolId", async (req, res) => {
  try {
    const school = await prisma.school.findUnique({
      where: { schoolId: BigInt(req.params.schoolId) },
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

// GET /api/schools/:schoolId/roster
router.get("/:schoolId/roster", async (req, res) => {
  try {
    const roster = await prisma.rosterStudent.findMany({
      where: { schoolId: BigInt(req.params.schoolId) },
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
