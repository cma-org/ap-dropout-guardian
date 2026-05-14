import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireInternalOrAuth } from "../middleware/internalAuth";

const router = Router();

// GET /api/interventions?childSno=123
router.get("/", requireInternalOrAuth, async (req, res) => {
  try {
    const { childSno } = req.query as { childSno?: string };
    const where = childSno ? { childSno: parseInt(childSno, 10) } : {};

    const interventions = await prisma.intervention.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.json(interventions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function ensureStudentDetail(childSno: number) {
  const existing = await prisma.studentDetail.findUnique({ where: { childSno } });
  if (existing) return existing;

  const roster = await prisma.rosterStudent.findFirst({
    where: { childSno },
    include: { school: true },
  });
  if (!roster) throw new Error(`Student ${childSno} not found in either StudentDetail or RosterStudent`);

  const genderMap: Record<string, number> = { Male: 1, Female: 2, male: 1, female: 2 };
  const gender = genderMap[roster.genderLabel] ?? 0;

  return prisma.studentDetail.create({
    data: {
      childSno,
      schoolId: roster.schoolId,
      schoolName: roster.school.schoolName,
      districtName: roster.school.districtName,
      mandalName: roster.school.mandalName,
      gender,
      genderLabel: roster.genderLabel,
      casteClean: roster.casteClean ?? 1,
      age: null,
      attendanceRate: roster.attendanceRate,
      maxConsecAbsence: 0,
      faAvg: roster.faAvg,
      saAvg: null,
      migrationFlag: roster.migrationFlag ?? 0,
      parentLiteracy: 0,
      familyIncomeBracket: roster.familyIncomeBracket ?? 0,
      transportAllowance: 0,
      riskScore: roster.riskScore,
      tier: roster.tier,
    },
  });
}

// POST /api/interventions
router.post("/", requireInternalOrAuth, async (req, res) => {
  try {
    const { childSno, actionType, status, assignedTo, notes } = req.body as {
      childSno?: number;
      actionType?: string;
      status?: string;
      assignedTo?: string;
      notes?: string;
    };

    if (!childSno || !actionType || !assignedTo) {
      res.status(400).json({ error: "childSno, actionType and assignedTo are required" });
      return;
    }

    await ensureStudentDetail(childSno);

    const intervention = await prisma.intervention.create({
      data: {
        childSno,
        actionType,
        status: status ?? "pending",
        assignedTo,
        notes: notes ?? null,
        createdBy: req.user && req.user.id > 0 ? req.user.id : null,
      },
    });

    res.status(201).json(intervention);
  } catch (err) {
    console.error("POST /api/interventions error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

// PUT /api/interventions/:id
router.put("/:id", requireInternalOrAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { actionType, status, assignedTo, notes, completedAt } = req.body as {
      actionType?: string;
      status?: string;
      assignedTo?: string;
      notes?: string;
      completedAt?: string;
    };

    const existing = await prisma.intervention.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Intervention not found" });
      return;
    }

    const updated = await prisma.intervention.update({
      where: { id },
      data: {
        ...(actionType !== undefined && { actionType }),
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(notes !== undefined && { notes }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/interventions/:id
router.delete("/:id", requireInternalOrAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await prisma.intervention.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
