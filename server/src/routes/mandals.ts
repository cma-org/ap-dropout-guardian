import { Router } from "express";
import { prisma } from "../lib/prisma";
import { transformMandal } from "../lib/transform";

const router = Router();

// GET /api/mandals?district=NTR
router.get("/", async (req, res) => {
  try {
    const { district } = req.query as { district?: string };
    const where = district ? { districtName: district } : {};

    const mandals = await prisma.mandal.findMany({
      where,
      orderBy: { mandalName: "asc" },
    });

    res.json(mandals.map(transformMandal));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
