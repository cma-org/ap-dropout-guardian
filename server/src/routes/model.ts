import { Router } from "express";

const router = Router();

/**
 * GET /api/model/version
 *
 * Returns metadata about the currently deployed model version.
 * In production this would read from a model registry (MLflow, W&B, etc.).
 * For the PoC, this is static metadata matching the training artefacts.
 */
router.get("/version", (_req, res) => {
  res.json({
    version: "1.0.0",
    algorithm: "XGBoost (gradient-boosted trees)",
    trainedOn: "2023-24 academic year",
    trainingStudents: 408000,
    trainingDropouts: 6536,
    evaluatedOn: "2024-25 OOT (out-of-time) test set",
    testStudents: 395000,
    testDropouts: 5186,
    metrics: {
      rocAuc: 0.9413,
      prAuc: 0.4832,
      recall: 0.8012,
      precision: 0.2143,
      threshold: 0.3721,
    },
    features: {
      total: 47,
      topFeatures: [
        "attendance_rate",
        "max_consec_absence",
        "migration_flag",
        "family_income_bracket",
        "fa_avg",
        "sa_avg",
        "parent_literacy",
        "transport_allowance",
      ],
    },
    explainability: "SHAP TreeExplainer",
    biasAudit: {
      subgroups: ["ST", "Girls", "Migrant"],
      minRecall: 0.76,
      status: "passed",
    },
    deployedAt: "2025-06-01T00:00:00Z",
    nextRetrainingScheduled: "2026-06-01T00:00:00Z",
    retrainingCadence: "annual (after academic year close)",
    modelFile: "xgboost_v1_2024.pkl",
    shapFile: "shap_explainer_v1_2024.pkl",
    dataRetentionDays: 2555, // 7 years per DPDP Act
    complianceFramework: "DPDP Act 2023 (India)",
  });
});

/**
 * GET /api/model/changelog
 *
 * Returns version history / changelog for model iterations.
 */
router.get("/changelog", (_req, res) => {
  res.json([
    {
      version: "1.0.0",
      date: "2025-06-01",
      changes: [
        "Initial production deployment",
        "Trained on 2023-24 data (408K students, 6,536 dropouts)",
        "XGBoost with 47 features across 4 data sources",
        "SHAP explainability integrated",
        "Fairness audit passed (ST, Girls, Migrant subgroups)",
      ],
      metrics: { rocAuc: 0.9413, prAuc: 0.4832, recall: 0.8012 },
    },
    {
      version: "0.9.0-beta",
      date: "2025-03-15",
      changes: [
        "Beta evaluation with NTR district pilot",
        "Added transport allowance feature",
        "Improved FA/SA marks feature engineering",
      ],
      metrics: { rocAuc: 0.928, prAuc: 0.461, recall: 0.782 },
    },
    {
      version: "0.8.0-alpha",
      date: "2024-12-01",
      changes: [
        "Initial PoC model — attendance + socio-economic features only",
        "3-district training dataset",
      ],
      metrics: { rocAuc: 0.901, prAuc: 0.389, recall: 0.741 },
    },
  ]);
});

export default router;
