/**
 * Daily logs API routes.
 * GET    /api/logs            — list all logs
 * POST   /api/logs            — create a log
 * PUT    /api/logs/:id        — update a log
 * DELETE /api/logs/:id        — delete a log
 * GET    /api/logs/export/csv — export as CSV
 */

import { Router, Request, Response } from "express";

const router = Router();

// List all logs
router.get("/", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const order = (req.query.order as "asc" | "desc") || "desc";
        const logs = await service.getDailyLogs(order);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// CSV export (must be before /:id to avoid conflict)
router.get("/export/csv", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const csv = await service.exportLogsAsCsv();
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=registo_diario.csv");
        res.send(csv);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new log
router.post("/", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const { logDate, logType, startTime, endTime, lunchStart, lunchEnd, company, tasksPerformed, notes } = req.body;

        // Validation
        if (!logDate) {
            res.status(400).json({ error: "logDate is required" });
            return;
        }
        const type = logType || 'normal';

        if (type === 'normal') {
            if (!startTime || !endTime) {
                res.status(400).json({ error: "startTime and endTime are required for normal work" });
                return;
            }
            if (!tasksPerformed || !tasksPerformed.trim()) {
                res.status(400).json({ error: "tasksPerformed is required for normal work" });
                return;
            }
        }

        if (type === 'justified_absence' && (!notes || !notes.trim())) {
            res.status(400).json({ error: "notes (justification) is required for justified absence" });
            return;
        }

        const log = await service.addDailyLog({
            logDate,
            logType: type,
            startTime: type === 'normal' ? startTime : null,
            endTime: type === 'normal' ? endTime : null,
            lunchStart: type === 'normal' ? (lunchStart || null) : null,
            lunchEnd: type === 'normal' ? (lunchEnd || null) : null,
            company: company || '',
            tasksPerformed: type === 'normal' ? tasksPerformed : null,
            notes: notes || null,
        });

        res.status(201).json(log);
    } catch (error: any) {
        if (error.message.includes("already exists")) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Update a log
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const { startTime, endTime, lunchStart, lunchEnd, company, tasksPerformed, notes } = req.body;

        const log = await service.updateDailyLog(req.params.id, {
            startTime,
            endTime,
            lunchStart,
            lunchEnd,
            company,
            tasksPerformed,
            notes,
        });

        res.json(log);
    } catch (error: any) {
        if (error.message.includes("not found")) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete a log
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        await service.deleteDailyLog(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
