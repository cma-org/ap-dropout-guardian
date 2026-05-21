import { Router } from "express";
import bcrypt from "bcrypt";
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

// POST /api/users — create a teacher account (HM only)
router.post("/", requireInternalOrAuth, async (req, res) => {
  try {
    const { name, email, password, schoolId, schoolName, district } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      schoolId?: string | number;
      schoolName?: string;
      district?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "teacher",
        schoolId: schoolId ? BigInt(schoolId) : null,
        schoolName: schoolName ?? null,
        district: district ?? null,
      },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ? Number(user.schoolId) : null,
      schoolName: user.schoolName,
      district: user.district,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
