import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireInternalOrAuth } from "../middleware/internalAuth";

const router = Router();

// GET /api/users?role=teacher&schoolId=28161790952
router.get("/", requireInternalOrAuth, async (req, res) => {
  try {
    const { role, schoolId } = req.query as { role?: string; schoolId?: string };

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (schoolId) where.schoolId = BigInt(schoolId);

    const users = await prisma.user.findMany({ where, orderBy: { name: "asc" } });

    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        schoolId: Number(u.schoolId),
        schoolName: u.schoolName,
        district: u.district,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
