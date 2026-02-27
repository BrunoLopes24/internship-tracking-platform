/**
 * Portuguese Holiday Calculator
 *
 * Calculates all Portuguese national holidays algorithmically, including
 * movable holidays that depend on Easter. No year is hardcoded.
 *
 * Fixed holidays (9):
 *   Jan 1   — Ano Novo (New Year)
 *   Apr 25  — Dia da Liberdade (Freedom Day)
 *   May 1   — Dia do Trabalhador (Labour Day)
 *   Jun 10  — Dia de Portugal (Portugal Day)
 *   Aug 15  — Assunção de Maria (Assumption of Mary)
 *   Oct 5   — Dia da República (Republic Day)
 *   Nov 1   — Dia de Todos os Santos (All Saints' Day)
 *   Dec 1   — Restauração da Independência (Independence Restoration Day)
 *   Dec 25  — Natal (Christmas)
 *
 * Movable holidays (3):
 *   Good Friday    — 2 days before Easter Sunday
 *   Easter Sunday  — computed via Meeus/Jones/Butcher algorithm
 *   Corpus Christi — 60 days after Easter Sunday (Thursday)
 */

import { Holiday } from "../models/types";

// ─── Easter calculation (Meeus / Jones / Butcher) ───────────────────────────

/**
 * Compute Easter Sunday for any Gregorian year.
 * Algorithm: Meeus/Jones/Butcher — accurate for all years in the
 * Gregorian calendar and correctly handles edge cases and leap years.
 */
export function computeEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

// ─── Holiday lists ──────────────────────────────────────────────────────────

/**
 * Return every Portuguese national holiday for the given year.
 */
export function getPortugueseHolidays(year: number): Holiday[] {
    const holidays: Holiday[] = [];

    // --- Fixed holidays ---
    const fixed: Array<{ month: number; day: number; name: string; namePt: string }> = [
        { month: 0, day: 1, name: "New Year's Day", namePt: "Ano Novo" },
        { month: 3, day: 25, name: "Freedom Day", namePt: "Dia da Liberdade" },
        { month: 4, day: 1, name: "Labour Day", namePt: "Dia do Trabalhador" },
        { month: 5, day: 10, name: "Portugal Day", namePt: "Dia de Portugal" },
        { month: 7, day: 15, name: "Assumption of Mary", namePt: "Assunção de Nossa Senhora" },
        { month: 9, day: 5, name: "Republic Day", namePt: "Implantação da República" },
        { month: 10, day: 1, name: "All Saints' Day", namePt: "Dia de Todos os Santos" },
        { month: 11, day: 1, name: "Independence Restoration Day", namePt: "Restauração da Independência" },
        { month: 11, day: 25, name: "Christmas Day", namePt: "Natal" },
    ];

    for (const h of fixed) {
        holidays.push({
            name: h.name,
            namePt: h.namePt,
            date: new Date(year, h.month, h.day),
        });
    }

    // --- Movable holidays (derived from Easter) ---
    const easter = computeEaster(year);
    const easterMs = easter.getTime();
    const DAY_MS = 86_400_000; // 24 h in milliseconds

    // Good Friday — 2 days before Easter
    holidays.push({
        name: "Good Friday",
        namePt: "Sexta-feira Santa",
        date: new Date(easterMs - 2 * DAY_MS),
    });

    // Easter Sunday
    holidays.push({
        name: "Easter Sunday",
        namePt: "Domingo de Páscoa",
        date: easter,
    });

    // Corpus Christi — 60 days after Easter Sunday
    holidays.push({
        name: "Corpus Christi",
        namePt: "Corpo de Deus",
        date: new Date(easterMs + 60 * DAY_MS),
    });

    return holidays;
}

// ─── Query helpers ──────────────────────────────────────────────────────────

/** Check whether a date falls on a Portuguese national holiday. */
export function isPortugueseHoliday(date: Date): boolean {
    const holidays = getPortugueseHolidays(date.getFullYear());
    return holidays.some(
        (h) =>
            h.date.getDate() === date.getDate() &&
            h.date.getMonth() === date.getMonth() &&
            h.date.getFullYear() === date.getFullYear()
    );
}

/** Return all holidays that fall within [startDate, endDate] (inclusive). */
export function getHolidaysInRange(startDate: Date, endDate: Date): Holiday[] {
    const holidays: Holiday[] = [];
    for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
        const yearHolidays = getPortugueseHolidays(year);
        holidays.push(...yearHolidays.filter((h) => h.date >= startDate && h.date <= endDate));
    }
    return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─── Working-day arithmetic ─────────────────────────────────────────────────

/**
 * Count working days between two dates (inclusive), excluding weekends
 * and Portuguese public holidays.
 *
 * @param workingDays  Day-of-week numbers that are working days.
 *                     0 = Sunday, 1 = Monday, …, 6 = Saturday.
 *                     Default: [1,2,3,4,5] (Mon–Fri).
 */
export function countWorkingDays(
    startDate: Date,
    endDate: Date,
    workingDays: number[] = [1, 2, 3, 4, 5]
): number {
    let count = 0;
    const current = new Date(startDate);
    const holidays = getHolidaysInRange(startDate, endDate);

    while (current <= endDate) {
        const dow = current.getDay();
        const isHoliday = holidays.some(
            (h) =>
                h.date.getDate() === current.getDate() &&
                h.date.getMonth() === current.getMonth() &&
                h.date.getFullYear() === current.getFullYear()
        );

        if (workingDays.includes(dow) && !isHoliday) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

/**
 * Estimate the internship end date by counting forward from a start date,
 * skipping weekends and public holidays, until enough working days have
 * been accumulated to cover the remaining hours.
 */
export function calculateEstimatedEndDate(
    startDate: Date,
    requiredHours: number = 640,
    dailyHours: number = 8,
    workingDays: number[] = [1, 2, 3, 4, 5],
    completedHours: number = 0
): Date {
    const remainingHours = Math.max(0, requiredHours - completedHours);
    const remainingWorkDays = Math.ceil(remainingHours / dailyHours);

    if (remainingWorkDays === 0) return new Date(startDate);

    let count = 0;
    const current = new Date(startDate);

    // We generate holidays year-by-year on demand to avoid scanning to 2100
    while (count < remainingWorkDays) {
        const dow = current.getDay();
        const isHoliday = isPortugueseHoliday(current);

        if (workingDays.includes(dow) && !isHoliday) {
            count++;
        }

        if (count < remainingWorkDays) {
            current.setDate(current.getDate() + 1);
        }
    }

    return current;
}
