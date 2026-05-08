import { Request, Response, NextFunction } from "express";

/**
 * Data Retention Policy middleware.
 *
 * Adds policy headers to every API response so that clients (browsers, API consumers)
 * are aware of the data governance rules for student data under DPDP Act 2023.
 *
 * In production this would also trigger background jobs to purge records older than
 * the retention window. For the PoC it is informational / headers only.
 */
export function dataRetentionPolicy(req: Request, res: Response, next: NextFunction) {
  // 7-year retention required by DPDP Act 2023 for government education records
  const RETENTION_DAYS = 7 * 365; // 2555 days

  res.setHeader("X-Data-Retention-Policy", "DPDP-Act-2023");
  res.setHeader("X-Data-Retention-Days", RETENTION_DAYS.toString());
  res.setHeader("X-Data-Classification", "Sensitive-Personal-Data");
  res.setHeader("X-Data-Controller", "AP School Education Department");
  res.setHeader("X-Data-Residency", "AP-State-Data-Centre-Amaravati");

  next();
}
