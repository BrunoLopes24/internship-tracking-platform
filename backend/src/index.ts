/**
 * Main Express server entry point.
 * Bootstraps middleware, mounts routes, and starts the HTTP server.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { initializeDatabase, getPrismaClient, closeDatabase } from "./config/database";
import { InternshipService } from "./services/internshipService";
import configRoutes from "./routes/config";
import logsRoutes from "./routes/logs";
import dashboardRoutes from "./routes/dashboard";
import reportsRoutes from "./routes/reports";
import backupRoutes from "./routes/backup";

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Core middleware ────────────────────────────────────────────────────────

app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || true
        : true,
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// ─── Inject service into every request ──────────────────────────────────────

app.use(async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const db = getPrismaClient();
        (req as any).db = db;
        (req as any).internshipService = new InternshipService(db);
        next();
    } catch (error) {
        next(error);
    }
});

// ─── API routes ─────────────────────────────────────────────────────────────

app.use("/api/config", configRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api", backupRoutes);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Centralised error handler ──────────────────────────────────────────────

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
    });
});

// ─── Server bootstrap ──────────────────────────────────────────────────────

async function start() {
    try {
        await initializeDatabase();
        console.log("✓ Database connected");

        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ API available at http://localhost:${PORT}/api`);
            console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log("\nShutting down gracefully...");
            await closeDatabase();
            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

start();

export default app;
