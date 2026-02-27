/**
 * Shared TypeScript interfaces for the StageSync backend.
 * These mirror the Prisma models but are decoupled from the ORM
 * for use in service and route layers.
 */

// ─── Configuration ──────────────────────────────────────────────────────────

export interface InternshipConfig {
    id: string;
    startDate: string;
    requiredHours: number;
    dailyHours: number;
    workingDays: number[];
    location: string | null;
    studentName: string | null;
    supervisorName: string | null;
    companyName: string | null;
    courseName: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Daily Log ──────────────────────────────────────────────────────────────

export interface DailyLog {
    id: string;
    logDate: string;
    logType: 'normal' | 'holiday' | 'justified_absence';
    startTime: string | null;
    endTime: string | null;
    lunchStart: string | null;
    lunchEnd: string | null;
    hoursCompleted: number;
    company: string;
    tasksPerformed: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface FileAttachment {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    path: string;
    dailyLogId: string;
    createdAt: Date;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardData {
    totalHours: number;
    remainingHours: number;
    percentageProgress: number;
    estimatedEndDate: string;
    totalWorkingDaysCompleted: number;
    averageHoursPerDay: number;
    weeklyHours: WeeklySummary[];
    monthlyHours: MonthlySummary[];
    nextHoliday?: { name: string; date: string };
    daysUntilMilestone320: number;
    daysUntilMilestone640: number;
}

export interface WeeklySummary {
    week: number;
    year: number;
    hours: number;
    label: string;
}

export interface MonthlySummary {
    month: string;
    hours: number;
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export type AlertType = "skipped_days" | "low_average" | "forecast" | "milestone";

export interface Alert {
    id: string;
    alertType: AlertType;
    title: string;
    description: string;
    dismissed: boolean;
    createdAt: Date;
}

// ─── Reports ────────────────────────────────────────────────────────────────

export type ReportType = "midterm" | "final";

export interface Report {
    id: string;
    reportType: ReportType;
    hoursAtCreation: number;
    content: string;
    exportedAsPdf: boolean;
    pdfPath: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReportData {
    startDate: string;
    reportDate: string;
    hoursCompleted: number;
    requiredHours: number;
    periodCovered: { from: string; to: string };
    activitiesSummary: string;
    skillsDeveloped: string[];
    challengesFaced: string[];
    hoursBreakdown: MonthlySummary[];
    studentName?: string;
    supervisorName?: string;
    companyName?: string;
    courseName?: string;
    location?: string;
}

// ─── Backup ─────────────────────────────────────────────────────────────────

export interface Backup {
    id: string;
    backupName: string;
    backupData: string;
    sizeBytes: number | null;
    createdAt: Date;
}

// ─── Holiday ────────────────────────────────────────────────────────────────

export interface Holiday {
    name: string;
    date: Date;
    namePt: string;
}
