import { Router } from "express";
import { prisma } from "../lib/prisma";
import { transformMandal } from "../lib/transform";

const router = Router();

// GET /api/mandals?district=NTR&academicYear=2024-25
router.get("/", async (req, res) => {
  try {
    const { district, academicYear = "2024-25" } = req.query as { district?: string; academicYear?: string };
    const where: Record<string, unknown> = { academicYear };
    if (district) where.districtName = district;

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
