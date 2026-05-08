import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "./auth";

/**
 * Accepts either:
 *  1. A valid JWT Bearer token (real user auth), OR
 *  2. An X-Internal-Key header matching INTERNAL_API_KEY (server-to-server calls from Next.js)
 *
 * When using the internal key, req.user is populated with a synthetic service-account payload.
 */
export function requireInternalOrAuth(req: Request, res: Response, next: NextFunction) {
  const internalKey = req.headers["x-internal-key"];
  const expectedKey = process.env.INTERNAL_API_KEY;

  // Allow server-to-server calls with the internal key
  if (expectedKey && internalKey === expectedKey) {
    req.user = {
      id: 0,
      email: "system@ap-dropout-guardian",
      name: "System Service",
      role: "teacher", // least-privilege default
    } as AuthPayload;
    next();
    return;
  }

  // Fall back to JWT auth
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
