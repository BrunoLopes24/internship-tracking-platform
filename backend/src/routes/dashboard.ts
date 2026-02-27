/**
 * Dashboard API routes.
 * GET  /api/dashboard                     — dashboard metrics
 * GET  /api/dashboard/alerts              — active alerts
 * POST /api/dashboard/alerts/:id/dismiss  — dismiss an alert
 * GET  /api/dashboard/holidays/:year      — holidays for a year
 * GET  /api/dashboard/holidays            — holidays in date range
 */

import { Router, Request, Response } from "express";
import { getPortugueseHolidays, getHolidaysInRange } from "../utils/holidays";

const router = Router();

// Dashboard data
router.get("/", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const data = await service.getDashboardData();
        res.json(data);
    } catch (error: any) {
        if (error.message.includes("not configured")) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Active alerts
router.get("/alerts", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const alerts = await service.getAlerts();
        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Dismiss alert
router.post("/alerts/:id/dismiss", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        await service.dismissAlert(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Holidays for a specific year
router.get("/holidays/:year", (req: Request, res: Response) => {
    try {
        const year = parseInt(req.params.year);
        if (isNaN(year)) {
            res.status(400).json({ error: "Invalid year" });
            return;
        }
        const holidays = getPortugueseHolidays(year);
        res.json(
            holidays.map((h) => ({
                name: h.name,
                namePt: h.namePt,
                date: h.date.toISOString().split("T")[0],
            }))
        );
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Holidays in a date range
router.get("/holidays", (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            res.status(400).json({ error: "start and end query parameters required" });
            return;
        }
        const holidays = getHolidaysInRange(new Date(start as string), new Date(end as string));
        res.json(
            holidays.map((h) => ({
                name: h.name,
                namePt: h.namePt,
                date: h.date.toISOString().split("T")[0],
            }))
        );
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
