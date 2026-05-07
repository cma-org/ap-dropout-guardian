import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/counsellor-templates
router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.counsellorTemplate.findMany();

    // Reshape to match the frontend CounsellorTemplates type:
    // { templates: Record<string, CounsellorTemplate> }
    const templates: Record<string, unknown> = {};
    for (const row of rows) {
      templates[row.key] = {
        parent_sms_en: row.parentSmsEn,
        parent_sms_te: row.parentSmsTe,
        teacher_script_en: row.teacherScriptEn,
        teacher_script_te: row.teacherScriptTe,
        schemes: row.schemes,
      };
    }

    res.json({ templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
