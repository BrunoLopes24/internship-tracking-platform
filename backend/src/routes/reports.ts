/**
 * Reports API routes.
 * GET  /api/reports         — list reports
 * POST /api/reports         — create a report
 * GET  /api/reports/:id     — get a report
 * PUT  /api/reports/:id     — update report content
 * GET  /api/reports/:id/pdf — download PDF
 */

import { Router, Request, Response } from "express";
import { generateReportPdf } from "../services/pdfService";
import { ReportData, ReportType } from "../models/types";

const router = Router();

// List all reports
router.get("/", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const reports = await service.getReports();
        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new report
router.post("/", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const { reportType } = req.body;

        if (!reportType || !["midterm", "final"].includes(reportType)) {
            res.status(400).json({ error: "reportType must be 'midterm' or 'final'" });
            return;
        }

        const report = await service.createReport(reportType as ReportType);
        res.status(201).json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific report
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const report = await service.getReport(req.params.id);
        if (!report) {
            res.status(404).json({ error: "Report not found" });
            return;
        }
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update report content (before exporting)
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const { content } = req.body;

        if (!content) {
            res.status(400).json({ error: "content is required" });
            return;
        }

        const report = await service.updateReport(req.params.id, content);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Download report as PDF
router.get("/:id/pdf", async (req: Request, res: Response) => {
    try {
        const service = (req as any).internshipService;
        const report = await service.getReport(req.params.id);
        if (!report) {
            res.status(404).json({ error: "Report not found" });
            return;
        }

        const reportData: ReportData = JSON.parse(report.content);
        const pdfBuffer = await generateReportPdf(reportData, report.reportType);

        const filename = report.reportType === "midterm"
            ? "relatorio_intercalar.pdf"
            : "relatorio_final.pdf";

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.send(pdfBuffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
