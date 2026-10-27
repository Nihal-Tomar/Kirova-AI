import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import path from "path";
import fs from "fs";

import { requireAuth, requireRole } from "./middleware/auth";
import * as authCtrl from "./controllers/auth";
import * as googleAuthCtrl from "./controllers/googleAuth";
import * as reportsCtrl from "./controllers/reports";
import * as workOrdersCtrl from "./controllers/work_orders";
import * as intelCtrl from "./controllers/intelligence";
import * as evalCtrl from "./controllers/evaluation";

export function createApp(): express.Application {
  const app = express();

  // Create uploads directory
  const uploadsDir = path.resolve(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Multer config for voice recordings
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".wav";
      cb(null, `rec-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
    }
  });
  const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit
  });

  // Global Middleware
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS — robust allowlist for local dev, Vercel frontend, and Render domains
  const customAllowed = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim().replace(/\/$/, ""))
    : [];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow same-origin / server-to-server (no origin header)
      if (!origin) {
        return callback(null, true);
      }
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        customAllowed.includes(cleanOrigin) ||
        cleanOrigin === "https://kirova-ai.vercel.app" ||
        cleanOrigin.endsWith(".vercel.app") ||
        cleanOrigin.endsWith(".onrender.com") ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(uploadsDir));

  // Serve React production build (when deployed as single process)
  const clientDist = path.resolve(__dirname, "../../client/dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
  }

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "kirova-api", timestamp: new Date().toISOString() });
  });

  // Seed trigger endpoint (allows on-demand database seeding in production / demo)
  app.post("/api/seed", async (_req, res) => {
    try {
      const { seedDatabase } = await import("./scripts/seed.js");
      await seedDatabase();
      res.json({ success: true, message: "Database seeded successfully with demo users, machines, and work orders." });
    } catch (err: any) {
      console.error("Seed endpoint error:", err);
      res.status(500).json({ error: "SEED_FAILED", message: err.message });
    }
  });

  // --- Auth Routes ---
  app.post("/api/auth/login", authCtrl.login);
  app.post("/api/auth/google", googleAuthCtrl.googleSignIn);
  app.get("/api/auth/me", requireAuth, authCtrl.getCurrentUser);
  app.get("/api/auth/demo-accounts", requireAuth, authCtrl.getDemoAccounts);

  // --- Incident Reporting Routes (PRD Section 10) ---
  app.post("/api/reports", requireAuth, upload.single("audio"), reportsCtrl.createReport);
  app.post("/api/reports/:id/transcribe", requireAuth, reportsCtrl.transcribeReport);
  app.patch("/api/reports/:id/transcript", requireAuth, reportsCtrl.updateTranscript);
  app.post("/api/reports/:id/extract", requireAuth, reportsCtrl.extractReport);
  app.post("/api/reports/:id/clarify", requireAuth, reportsCtrl.clarifyReport);
  app.get("/api/reports/:id", requireAuth, reportsCtrl.getReportById);
  app.get("/api/reports", requireAuth, reportsCtrl.getReports);

  // --- Work Order Routes (PRD Section 10) ---
  app.post("/api/work-orders", requireAuth, requireRole(["SUPERVISOR"]), workOrdersCtrl.createWorkOrder);
  app.post("/api/work-orders/:id/approve", requireAuth, requireRole(["SUPERVISOR"]), workOrdersCtrl.approveWorkOrder);
  app.post("/api/work-orders/:id/reject", requireAuth, requireRole(["SUPERVISOR"]), workOrdersCtrl.rejectWorkOrder);
  app.post("/api/work-orders/:id/return", requireAuth, requireRole(["SUPERVISOR"]), workOrdersCtrl.returnWorkOrder);
  app.post("/api/work-orders/:id/assign", requireAuth, requireRole(["SUPERVISOR"]), workOrdersCtrl.assignWorkOrder);
  app.post("/api/work-orders/:id/status", requireAuth, workOrdersCtrl.updateWorkOrderStatus);
  app.post("/api/work-orders/:id/verify-close", requireAuth, requireRole(["SUPERVISOR"]), workOrdersCtrl.verifyCloseWorkOrder);
  app.get("/api/work-orders", requireAuth, workOrdersCtrl.getWorkOrders);
  app.get("/api/work-orders/assigned", requireAuth, workOrdersCtrl.getAssignedWorkOrders);
  app.get("/api/work-orders/:id/history", requireAuth, workOrdersCtrl.getWorkOrderHistory);
  app.get("/api/work-orders/:id", requireAuth, workOrdersCtrl.getWorkOrderById);

  // --- Intelligence & Asset History Routes ---
  app.get("/api/machines/:id/history", requireAuth, intelCtrl.getMachineHistory);
  app.get("/api/machines", requireAuth, intelCtrl.getMachines);
  app.get("/api/graph/recurring", requireAuth, intelCtrl.getRecurringFaults);
  app.get("/api/incidents/:id/decision-support", requireAuth, intelCtrl.getIncidentDecisionSupport);
  app.get("/api/incidents/:id/evidence-graph", requireAuth, intelCtrl.getIncidentEvidenceGraph);
  app.get("/api/dashboard", requireAuth, requireRole(["SUPERVISOR"]), intelCtrl.getDashboardMetrics);
  app.get("/api/audit-logs", requireAuth, requireRole(["SUPERVISOR"]), intelCtrl.getAuditLogsController);
  app.get("/api/search", requireAuth, intelCtrl.searchRecords);
  app.get("/api/notifications", requireAuth, intelCtrl.getNotifications);

  // --- Quantitative Evaluation Benchmark Route ---
  app.post("/api/evaluation/run", requireAuth, evalCtrl.runEvaluation);

  // SPA catch-all — serve React's index.html for any non-API route (production)
  if (fs.existsSync(clientDist)) {
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(err.status || 500).json({
      error: err.name || "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred"
    });
  });

  return app;
}
