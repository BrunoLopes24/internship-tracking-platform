/** Frontend TypeScript types mirroring the backend API responses. */

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
    createdAt: string;
    updatedAt: string;
}

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
    createdAt: string;
    updatedAt: string;
}

export interface DashboardData {
    totalHours: number;
    remainingHours: number;
    percentageProgress: number;
    estimatedEndDate: string;
    totalWorkingDaysCompleted: number;
    averageHoursPerDay: number;
    weeklyHours: { week: number; year: number; hours: number; label: string }[];
    monthlyHours: { month: string; hours: number }[];
    nextHoliday?: { name: string; date: string };
    daysUntilMilestone320: number;
    daysUntilMilestone640: number;
}

export interface Alert {
    id: string;
    alertType: 'skipped_days' | 'low_average' | 'forecast' | 'milestone';
    title: string;
    description: string;
    dismissed: boolean;
    createdAt: string;
}

export interface Report {
    id: string;
    reportType: 'midterm' | 'final';
    hoursAtCreation: number;
    content: string;
    exportedAsPdf: boolean;
    pdfPath: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Holiday {
    name: string;
    namePt: string;
    date: string;
}
