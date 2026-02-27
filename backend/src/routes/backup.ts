/**
 * Backup & restore API routes.
 * POST /api/backup    — create a backup
 * POST /api/restore   — restore from backup
 * GET  /api/backups   — list backups
 */

import { Router, Request, Response } from "express";

const router = Router();

// Create backup
router.post("/backup", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const { name } = req.body;
        const result = await service.createBackup(name);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Restore from backup
router.post("/restore", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const { backupId } = req.body;

        if (!backupId) {
            res.status(400).json({ error: "backupId is required" });
            return;
        }

        await service.restoreBackup(backupId);
        res.json({ success: true, message: "Backup restored successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// List backups
router.get("/backups", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const backups = await service.getBackups();
        res.json(backups);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
