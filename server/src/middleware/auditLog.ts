import { Request, Response, NextFunction } from "express";

/**
 * Audit-log middleware — logs every inbound API request with timestamp,
 * method, path, authenticated user (if any), and response status/time.
 *
 * In production, replace console.log with a persistent store (e.g., a
 * Postgres `AuditLog` table or a structured logging service).
 */
export function auditLog(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    const user = req.user
      ? `${req.user.email} [${req.user.role}]`
      : "anonymous";

    const entry = {
      ts:       new Date().toISOString(),
      method:   req.method,
      path:     req.path,
      query:    Object.keys(req.query).length ? req.query : undefined,
      user,
      status:   res.statusCode,
      ms:       duration,
    };

    // Structured one-line log — easy to ingest into any log aggregator
    console.log(`[AUDIT] ${JSON.stringify(entry)}`);
  });

  next();
}
