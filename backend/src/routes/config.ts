/**
 * Configuration API routes.
 * GET  /api/config — retrieve current config
 * POST /api/config — create or update config
 */

import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const config = await service.getConfig();
        if (!config) {
            res.status(404).json({ error: "Internship not configured" });
            return;
        }
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const { startDate, requiredHours, dailyHours, workingDays, location, studentName, supervisorName, companyName, courseName } = req.body;

        if (!startDate) {
            res.status(400).json({ error: "startDate is required" });
            return;
        }

        const config = await service.setConfig({
            startDate,
            requiredHours: requiredHours ? Number(requiredHours) : undefined,
            dailyHours: dailyHours ? Number(dailyHours) : undefined,
            workingDays: workingDays ? workingDays.map(Number) : undefined,
            location,
            studentName,
            supervisorName,
            companyName,
            courseName,
        });

        res.json(config);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
