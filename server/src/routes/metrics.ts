import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/metrics
router.get("/", async (_req, res) => {
  try {
    const record = await prisma.metrics.findFirst({
      where: { version: "default" },
    });

    if (!record) {
      res.status(404).json({ error: "Metrics not found" });
      return;
    }

    // Reshape to match the frontend Metrics type
    res.json({
      threshold: record.threshold,
      threshold_current: record.thresholdCurrent,
      train: record.trainData,
      test_oot: record.testOotData,
      fairness: record.fairnessData,
      feature_importance: record.featureImportance,
      pr_curve: record.prCurve,
      tier_counts: record.tierCounts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
