/**
 * Core internship management service.
 * All business logic lives here — routes delegate to this service.
 */

import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { stringify } from "csv-stringify/sync";
import {
    InternshipConfig,
    DailyLog,
    DashboardData,
    Alert,
    AlertType,
    Report,
    ReportType,
    ReportData,
    WeeklySummary,
    MonthlySummary,
} from "../models/types";
import {
    calculateEstimatedEndDate,
    countWorkingDays,
    getHolidaysInRange,
    getPortugueseHolidays,
    isPortugueseHoliday,
} from "../utils/holidays";

export class InternshipService {
    constructor(private db: PrismaClient) { }

    // ─── Configuration ──────────────────────────────────────────────────────

    /** Get the current internship configuration (or null). */
    async getConfig(): Promise<InternshipConfig | null> {
        const row = await this.db.internshipConfig.findFirst();
        if (!row) return null;
        return { ...row, workingDays: row.workingDays.split(",").map(Number) };
    }

    /** Create or update the internship configuration. */
    async setConfig(input: Partial<InternshipConfig>): Promise<InternshipConfig> {
        const existing = await this.getConfig();
        const now = new Date();

        const data = {
            startDate: input.startDate ?? existing?.startDate ?? new Date().toISOString().split("T")[0],
            requiredHours: input.requiredHours ?? existing?.requiredHours ?? 640,
            dailyHours: input.dailyHours ?? existing?.dailyHours ?? 8,
            workingDays: (input.workingDays ?? existing?.workingDays ?? [1, 2, 3, 4, 5]).join(","),
            location: input.location ?? existing?.location ?? null,
            studentName: input.studentName ?? existing?.studentName ?? null,
            supervisorName: input.supervisorName ?? existing?.supervisorName ?? null,
            companyName: input.companyName ?? existing?.companyName ?? null,
            courseName: input.courseName ?? existing?.courseName ?? null,
            updatedAt: now,
        };

        if (existing) {
            const updated = await this.db.internshipConfig.update({
                where: { id: existing.id },
                data,
            });
            return { ...updated, workingDays: updated.workingDays.split(",").map(Number) };
        }

        const created = await this.db.internshipConfig.create({
            data: { id: uuidv4(), ...data, createdAt: now },
        });
        return { ...created, workingDays: created.workingDays.split(",").map(Number) };
    }

    // ─── Daily Logs ─────────────────────────────────────────────────────────

    /** Calculate hours from time strings: (endTime - startTime) - (lunchEnd - lunchStart). */
    static calculateHoursFromTimes(
        startTime: string,
        endTime: string,
        lunchStart: string | null,
        lunchEnd: string | null
    ): number {
        const toMinutes = (t: string) => {
            const [h, m] = t.split(":").map(Number);
            return h * 60 + m;
        };
        const workMinutes = toMinutes(endTime) - toMinutes(startTime);
        const lunchMinutes = (lunchStart && lunchEnd)
            ? toMinutes(lunchEnd) - toMinutes(lunchStart)
            : 0;
        const totalMinutes = workMinutes - lunchMinutes;
        return Math.round((totalMinutes / 60) * 100) / 100;
    }

    /** Add a new daily log entry. Throws if the date already exists. */
    async addDailyLog(
        log: Pick<DailyLog, "logDate" | "logType" | "startTime" | "endTime" | "lunchStart" | "lunchEnd" | "company" | "tasksPerformed" | "notes">
    ): Promise<DailyLog> {
        const existing = await this.db.dailyLog.findUnique({ where: { logDate: log.logDate } });
        if (existing) throw new Error(`A log for ${log.logDate} already exists`);

        const isNormal = log.logType === 'normal';
        const hoursCompleted = isNormal && log.startTime && log.endTime
            ? InternshipService.calculateHoursFromTimes(log.startTime, log.endTime, log.lunchStart, log.lunchEnd)
            : 0;

        const created = await this.db.dailyLog.create({
            data: {
                id: uuidv4(),
                logDate: log.logDate,
                logType: log.logType || 'normal',
                startTime: isNormal ? log.startTime : null,
                endTime: isNormal ? log.endTime : null,
                lunchStart: isNormal ? (log.lunchStart || null) : null,
                lunchEnd: isNormal ? (log.lunchEnd || null) : null,
                hoursCompleted,
                company: log.company,
                tasksPerformed: isNormal ? log.tasksPerformed : null,
                notes: log.notes || null,
            },
        });

        // Generate any new alerts asynchronously (fire-and-forget)
        this.checkAndCreateAlerts().catch(console.error);

        return created;
    }

    /** Update an existing daily log. */
    async updateDailyLog(id: string, updates: Partial<DailyLog>): Promise<DailyLog> {
        const existing = await this.db.dailyLog.findUnique({ where: { id } });
        if (!existing) throw new Error(`Daily log ${id} not found`);

        const logType = updates.logType ?? existing.logType ?? 'normal';
        const isNormal = logType === 'normal';

        const startTime = isNormal ? (updates.startTime ?? existing.startTime) : null;
        const endTime = isNormal ? (updates.endTime ?? existing.endTime) : null;
        const lunchStart = isNormal ? (updates.lunchStart ?? existing.lunchStart) : null;
        const lunchEnd = isNormal ? (updates.lunchEnd ?? existing.lunchEnd) : null;
        const hoursCompleted = isNormal && startTime && endTime
            ? InternshipService.calculateHoursFromTimes(startTime, endTime, lunchStart, lunchEnd)
            : 0;

        const updated = await this.db.dailyLog.update({
            where: { id },
            data: {
                logType,
                startTime,
                endTime,
                lunchStart,
                lunchEnd,
                hoursCompleted,
                company: updates.company ?? existing.company,
                tasksPerformed: isNormal ? (updates.tasksPerformed ?? existing.tasksPerformed) : null,
                notes: updates.notes ?? existing.notes,
            },
        });

        this.checkAndCreateAlerts().catch(console.error);
        return updated;
    }

    /** Get all daily logs sorted by date. */
    async getDailyLogs(order: "asc" | "desc" = "desc"): Promise<DailyLog[]> {
        return this.db.dailyLog.findMany({ orderBy: { logDate: order } });
    }

    /** Delete a daily log and its attachments. */
    async deleteDailyLog(id: string): Promise<void> {
        await this.db.dailyLog.delete({ where: { id } });
        this.checkAndCreateAlerts().catch(console.error);
    }

    /** Sum of all logged hours. */
    async getTotalHoursCompleted(): Promise<number> {
        const result = await this.db.dailyLog.aggregate({ _sum: { hoursCompleted: true } });
        return result._sum.hoursCompleted || 0;
    }

    // ─── Dashboard ──────────────────────────────────────────────────────────

    /** Compute all dashboard metrics. */
    async getDashboardData(): Promise<DashboardData> {
        const config = await this.getConfig();
        if (!config) throw new Error("Internship not configured");

        const totalHours = await this.getTotalHoursCompleted();
        const logs = await this.getDailyLogs("asc");
        const remainingHours = Math.max(0, config.requiredHours - totalHours);

        // Estimated end date from today
        const today = new Date();
        const estimatedEndDate = calculateEstimatedEndDate(
            today,
            config.requiredHours,
            config.dailyHours,
            config.workingDays,
            totalHours
        );

        // Working days completed (only days with hours > 0)
        const workingLogs = logs.filter((l) => l.hoursCompleted > 0);
        const totalWorkingDaysCompleted = workingLogs.length;
        const averageHoursPerDay =
            totalWorkingDaysCompleted > 0 ? totalHours / totalWorkingDaysCompleted : 0;

        // Summaries
        const weeklyHours = this.calculateWeeklySummary(logs);
        const monthlyHours = this.calculateMonthlySummary(logs);

        // Next holiday
        const nextYear = new Date(today.getFullYear() + 1, 11, 31);
        const holidays = getHolidaysInRange(today, nextYear);
        const nextHoliday = holidays.find((h) => h.date > today);

        // Milestone counters
        const daysUntilMilestone320 =
            totalHours >= 320 ? 0 : Math.ceil((320 - totalHours) / config.dailyHours);
        const daysUntilMilestone640 =
            totalHours >= 640 ? 0 : Math.ceil((640 - totalHours) / config.dailyHours);

        return {
            totalHours,
            remainingHours,
            percentageProgress: Math.min(100, (totalHours / config.requiredHours) * 100),
            estimatedEndDate: estimatedEndDate.toISOString().split("T")[0],
            totalWorkingDaysCompleted,
            averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
            weeklyHours,
            monthlyHours,
            nextHoliday: nextHoliday
                ? { name: `${nextHoliday.namePt} (${nextHoliday.name})`, date: nextHoliday.date.toISOString().split("T")[0] }
                : undefined,
            daysUntilMilestone320,
            daysUntilMilestone640,
        };
    }

    // ─── Alerts ─────────────────────────────────────────────────────────────

    /** Get all active (non-dismissed) alerts. */
    async getAlerts(): Promise<Alert[]> {
        const rows = await this.db.alert.findMany({
            where: { dismissed: false },
            orderBy: { createdAt: "desc" },
        });
        return rows.map((r) => ({ ...r, alertType: r.alertType as AlertType }));
    }

    /** Dismiss an alert by ID. */
    async dismissAlert(id: string): Promise<void> {
        await this.db.alert.update({ where: { id }, data: { dismissed: true } });
    }

    /** Evaluate alerting rules and create new alerts if needed. */
    private async checkAndCreateAlerts(): Promise<void> {
        const config = await this.getConfig();
        if (!config) return;

        const totalHours = await this.getTotalHoursCompleted();
        const logs = await this.getDailyLogs("asc");

        // 1. Skipped working days
        await this.checkSkippedDays(config, logs);

        // 2. Low average hours
        const workingLogs = logs.filter((l) => l.hoursCompleted > 0);
        if (workingLogs.length > 0) {
            const avg = totalHours / workingLogs.length;
            if (avg < config.dailyHours * 0.8) {
                await this.upsertAlert({
                    id: "low-average-hours",
                    alertType: "low_average",
                    title: "Média de horas baixa",
                    description: `A sua média diária (${avg.toFixed(1)}h) está abaixo do planeado (${config.dailyHours}h). Considere aumentar as horas de trabalho.`,
                    dismissed: false,
                    createdAt: new Date(),
                });
            }
        }

        // 3. Milestone alerts
        if (totalHours >= 320 && totalHours < 640) {
            await this.upsertAlert({
                id: "milestone-320",
                alertType: "milestone",
                title: "Marco de 320 horas atingido!",
                description: "Pode criar o relatório intercalar na secção de relatórios.",
                dismissed: false,
                createdAt: new Date(),
            });
        }
        if (totalHours >= 640) {
            await this.upsertAlert({
                id: "milestone-640",
                alertType: "milestone",
                title: "Marco de 640 horas atingido!",
                description: "Parabéns! Pode agora gerar o relatório final.",
                dismissed: false,
                createdAt: new Date(),
            });
        }
    }

    private async checkSkippedDays(config: InternshipConfig, logs: DailyLog[]): Promise<void> {
        const startDate = new Date(config.startDate);
        const now = new Date();
        const logDates = new Set(logs.map((l) => l.logDate));

        let current = new Date(startDate);
        let skippedCount = 0;

        while (current < now) {
            const dow = current.getDay();
            const dateStr = current.toISOString().split("T")[0];
            if (
                config.workingDays.includes(dow) &&
                !isPortugueseHoliday(current) &&
                !logDates.has(dateStr)
            ) {
                skippedCount++;
            }
            current.setDate(current.getDate() + 1);
        }

        if (skippedCount > 3) {
            await this.upsertAlert({
                id: "skipped-days",
                alertType: "skipped_days",
                title: "Dias úteis sem registo",
                description: `Tem ${skippedCount} dias úteis sem registo de horas. Não se esqueça de registar!`,
                dismissed: false,
                createdAt: new Date(),
            });
        }
    }

    private async upsertAlert(alert: Alert): Promise<void> {
        const existing = await this.db.alert.findUnique({ where: { id: alert.id } });
        if (!existing) {
            await this.db.alert.create({
                data: {
                    id: alert.id,
                    alertType: alert.alertType,
                    title: alert.title,
                    description: alert.description,
                    dismissed: false,
                },
            });
        } else if (existing.dismissed) {
            // Re-open if it was dismissed and condition is still true
            await this.db.alert.update({
                where: { id: alert.id },
                data: { dismissed: false, title: alert.title, description: alert.description },
            });
        }
    }

    // ─── Reports ────────────────────────────────────────────────────────────

    /** Create a new report. */
    async createReport(reportType: ReportType): Promise<Report> {
        const config = await this.getConfig();
        if (!config) throw new Error("Internship not configured");

        const totalHours = await this.getTotalHoursCompleted();
        const logs = await this.getDailyLogs("asc");

        const reportData: ReportData = {
            startDate: config.startDate,
            reportDate: new Date().toISOString().split("T")[0],
            hoursCompleted: totalHours,
            requiredHours: reportType === "midterm" ? 320 : 640,
            periodCovered: {
                from: config.startDate,
                to: new Date().toISOString().split("T")[0],
            },
            activitiesSummary: "",
            skillsDeveloped: [],
            challengesFaced: [],
            hoursBreakdown: this.calculateMonthlySummary(logs),
            studentName: config.studentName || undefined,
            supervisorName: config.supervisorName || undefined,
            companyName: config.companyName || undefined,
            courseName: config.courseName || undefined,
            location: config.location || undefined,
        };

        const report = await this.db.report.create({
            data: {
                id: uuidv4(),
                reportType,
                hoursAtCreation: Math.round(totalHours),
                content: JSON.stringify(reportData),
                exportedAsPdf: false,
            },
        });

        return { ...report, reportType: report.reportType as ReportType };
    }

    /** Get all reports. */
    async getReports(): Promise<Report[]> {
        const rows = await this.db.report.findMany({ orderBy: { createdAt: "desc" } });
        return rows.map((r) => ({ ...r, reportType: r.reportType as ReportType }));
    }

    /** Get a single report by ID. */
    async getReport(id: string): Promise<Report | null> {
        const row = await this.db.report.findUnique({ where: { id } });
        if (!row) return null;
        return { ...row, reportType: row.reportType as ReportType };
    }

    /** Update a report's content. */
    async updateReport(id: string, content: string): Promise<Report> {
        const updated = await this.db.report.update({ where: { id }, data: { content } });
        return { ...updated, reportType: updated.reportType as ReportType };
    }

    // ─── CSV Export ─────────────────────────────────────────────────────────

    /** Export all daily logs as a CSV string. */
    async exportLogsAsCsv(): Promise<string> {
        const logs = await this.db.dailyLog.findMany({ orderBy: { logDate: "asc" } });
        const config = await this.getConfig();

        const records = logs.map((log) => {
            const d = new Date(log.logDate);
            return {
                Data: `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`,
                "Hora Início": log.startTime,
                "Hora Fim": log.endTime,
                "Início Almoço": log.lunchStart,
                "Fim Almoço": log.lunchEnd,
                Horas: log.hoursCompleted,
                Empresa: log.company,
                Tarefas: log.tasksPerformed,
                Notas: log.notes || "",
            };
        });

        return stringify(records, {
            header: true,
            columns: ["Data", "Hora Início", "Hora Fim", "Início Almoço", "Fim Almoço", "Horas", "Empresa", "Tarefas", "Notas"],
            bom: true,
        });
    }

    // ─── Backup / Restore ──────────────────────────────────────────────────

    /** Create a full data backup stored in the database. */
    async createBackup(name?: string): Promise<{ id: string; backupName: string }> {
        const config = await this.getConfig();
        const logs = await this.getDailyLogs("asc");
        const alerts = await this.db.alert.findMany();
        const reports = await this.db.report.findMany();

        const data = JSON.stringify({ config, logs, alerts, reports }, null, 2);
        const backupName = name || `backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;

        const backup = await this.db.backup.create({
            data: {
                id: uuidv4(),
                backupName,
                backupData: data,
                sizeBytes: Buffer.byteLength(data, "utf8"),
            },
        });

        return { id: backup.id, backupName: backup.backupName };
    }

    /** Restore data from a backup (clears existing data first). */
    async restoreBackup(id: string): Promise<void> {
        const backup = await this.db.backup.findUnique({ where: { id } });
        if (!backup) throw new Error("Backup not found");

        const data = JSON.parse(backup.backupData);

        // Clear current data
        await this.db.fileAttachment.deleteMany();
        await this.db.dailyLog.deleteMany();
        await this.db.alert.deleteMany();
        await this.db.report.deleteMany();
        await this.db.internshipConfig.deleteMany();

        // Restore config
        if (data.config) {
            await this.db.internshipConfig.create({
                data: {
                    id: data.config.id || uuidv4(),
                    startDate: data.config.startDate,
                    requiredHours: data.config.requiredHours,
                    dailyHours: data.config.dailyHours,
                    workingDays: Array.isArray(data.config.workingDays)
                        ? data.config.workingDays.join(",")
                        : data.config.workingDays,
                    location: data.config.location,
                    studentName: data.config.studentName,
                    supervisorName: data.config.supervisorName,
                    companyName: data.config.companyName,
                    courseName: data.config.courseName,
                },
            });
        }

        // Restore logs
        if (data.logs?.length) {
            for (const log of data.logs) {
                await this.db.dailyLog.create({
                    data: {
                        id: log.id || uuidv4(),
                        logDate: log.logDate,
                        startTime: log.startTime || "09:00",
                        endTime: log.endTime || "18:00",
                        lunchStart: log.lunchStart || "13:00",
                        lunchEnd: log.lunchEnd || "14:00",
                        hoursCompleted: log.hoursCompleted,
                        company: log.company || "",
                        tasksPerformed: log.tasksPerformed,
                        notes: log.notes,
                    },
                });
            }
        }

        // Restore reports
        if (data.reports?.length) {
            for (const report of data.reports) {
                await this.db.report.create({
                    data: {
                        id: report.id || uuidv4(),
                        reportType: report.reportType,
                        hoursAtCreation: report.hoursAtCreation,
                        content: report.content,
                        exportedAsPdf: report.exportedAsPdf || false,
                        pdfPath: report.pdfPath,
                    },
                });
            }
        }
    }

    /** List all available backups. */
    async getBackups() {
        return this.db.backup.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, backupName: true, sizeBytes: true, createdAt: true },
        });
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private calculateWeeklySummary(logs: DailyLog[]): WeeklySummary[] {
        const summary = new Map<string, { week: number; year: number; hours: number }>();

        for (const log of logs) {
            const d = new Date(log.logDate);
            const { week, year } = this.getISOWeek(d);
            const key = `${year}-W${week}`;
            const entry = summary.get(key) || { week, year, hours: 0 };
            entry.hours += log.hoursCompleted;
            summary.set(key, entry);
        }

        return Array.from(summary.entries())
            .map(([key, val]) => ({
                week: val.week,
                year: val.year,
                hours: Math.round(val.hours * 100) / 100,
                label: `S${val.week}`,
            }))
            .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.week - b.week));
    }

    private calculateMonthlySummary(logs: DailyLog[]): MonthlySummary[] {
        const months = [
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez",
        ];
        const summary = new Map<string, number>();

        for (const log of logs) {
            const d = new Date(log.logDate);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            summary.set(key, (summary.get(key) || 0) + log.hoursCompleted);
        }

        return Array.from(summary.entries())
            .map(([month, hours]) => ({ month, hours: Math.round(hours * 100) / 100 }))
            .sort((a, b) => {
                const da = new Date(a.month);
                const db = new Date(b.month);
                return da.getTime() - db.getTime();
            });
    }

    /** ISO 8601 week number and year. */
    private getISOWeek(date: Date): { week: number; year: number } {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        return { week, year: d.getUTCFullYear() };
    }
}
