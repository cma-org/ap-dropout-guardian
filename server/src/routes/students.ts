import { Router } from "express";
import { prisma } from "../lib/prisma";
import { transformStudent } from "../lib/transform";

const router = Router();

// GET /api/students?schoolId=&tier=&district=&limit=100&offset=0
router.get("/", async (req, res) => {
  try {
    const {
      schoolId,
      tier,
      district,
      limit = "100",
      offset = "0",
    } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
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

// GET /api/students/:childSno
router.get("/:childSno", async (req, res) => {
  try {
    const childSno = parseInt(req.params.childSno, 10);
    if (isNaN(childSno)) {
      res.status(400).json({ error: "Invalid student ID" });
      return;
    }

    const student = await prisma.studentDetail.findUnique({
      where: { childSno },
      include: { drivers: { orderBy: { contrib: "desc" } } },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json(transformStudent(student));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
