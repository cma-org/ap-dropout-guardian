import "dotenv/config";
import express from "express";
import cors from "cors";

import authRouter from "./routes/auth";
import schoolsRouter from "./routes/schools";
import studentsRouter from "./routes/students";
import mandalsRouter from "./routes/mandals";
import districtsRouter from "./routes/districts";
import metricsRouter from "./routes/metrics";
import interventionsRouter from "./routes/interventions";
import analyticsRouter from "./routes/analytics";
import counsellorRouter from "./routes/counsellor";
import webhooksRouter from "./routes/webhooks";
import modelRouter from "./routes/model";
import chatRouter from "./routes/chat";
import schemesRouter from "./routes/schemes";
import usersRouter from "./routes/users";
import { uploadRouter } from "./routes/upload";
import { auditLog } from "./middleware/auditLog";
import { dataRetentionPolicy } from "./middleware/dataRetention";

// Prisma returns BigInt for schoolId — serialize as number (all IDs fit in MAX_SAFE_INTEGER)
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(auditLog);
app.use(dataRetentionPolicy);

app.use("/api/auth", authRouter);
app.use("/api/districts", districtsRouter);
app.use("/api/schools", schoolsRouter);
app.use("/api/mandals", mandalsRouter);
app.use("/api/students", studentsRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/counsellor-templates", counsellorRouter);
app.use("/api/interventions", interventionsRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/model", modelRouter);
app.use("/api/users", usersRouter);
app.use("/api/chat", chatRouter);
app.use("/api/schemes", schemesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/upload", uploadRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AP Dropout Guardian API running on http://localhost:${PORT}`);
});
