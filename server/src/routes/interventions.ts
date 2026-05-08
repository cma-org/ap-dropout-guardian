import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
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

    const intervention = await prisma.intervention.create({
      data: {
        childSno,
        actionType,
        status: status ?? "pending",
        assignedTo,
        notes: notes ?? null,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json(intervention);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/interventions/:id
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes, completedAt } = req.body as {
      status?: string;
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
        ...(status && { status }),
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
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.intervention.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
