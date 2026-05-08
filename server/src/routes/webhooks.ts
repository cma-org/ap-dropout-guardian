import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * POST /api/webhooks/sync
 *
 * Data-sync webhook endpoint.  An upstream ETL pipeline or government data source
 * calls this to notify the system that fresh student data is available.
 *
 * In production this would trigger an async reprocessing job.
 * For the PoC we log the event and return an acknowledgement.
 *
 * Auth: validated via X-Webhook-Secret header.
 */
router.post("/sync", async (req, res) => {
  const secret = req.headers["x-webhook-secret"];
  const expectedSecret = process.env.WEBHOOK_SECRET ?? "ap-dropout-webhook-2024";

  if (secret !== expectedSecret) {
    res.status(401).json({ error: "Invalid webhook secret" });
    return;
  }

  const { source, academicYear, district, recordCount, timestamp } = req.body as {
    source?: string;
    academicYear?: string;
    district?: string;
    recordCount?: number;
    timestamp?: string;
  };

  const event = {
    receivedAt: new Date().toISOString(),
    source: source ?? "unknown",
    academicYear: academicYear ?? "unknown",
    district: district ?? "all",
    recordCount: recordCount ?? 0,
    timestamp: timestamp ?? new Date().toISOString(),
    status: "acknowledged",
    message: "Data sync event received. Reprocessing pipeline will be triggered in production.",
  };

  console.log(`[WEBHOOK] sync event received: ${JSON.stringify(event)}`);

  res.json(event);
});

/**
 * GET /api/webhooks/health
 * Simple health check for webhook endpoint availability.
 */
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    endpoint: "/api/webhooks/sync",
    authHeader: "X-Webhook-Secret",
    supportedEvents: ["sync"],
    timestamp: new Date().toISOString(),
  });
});

export default router;
