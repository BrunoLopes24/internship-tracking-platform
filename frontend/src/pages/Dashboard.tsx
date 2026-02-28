/**
 * Dashboard Page — main overview with KPIs, charts, calendar, alerts, and "Novo Registo" button.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { apiFetch } from '../config/api';
import type { DashboardData, Alert, Holiday, InternshipConfig, DailyLog } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [config, setConfig] = useState<InternshipConfig | null>(null);
    const [calMonth, setCalMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [loading, setLoading] = useState(true);
    const [workedDates, setWorkedDates] = useState<Set<string>>(new Set());

    // ─── New Log Modal ──────────────────────────────────
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        logDate: new Date().toISOString().split('T')[0],
        logType: 'normal' as 'normal' | 'holiday' | 'justified_absence',
        startTime: '09:00',
        endTime: '18:00',
        lunchStart: '',
        lunchEnd: '',
        company: '',
        tasksPerformed: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        Promise.all([
            apiFetch<DashboardData>('/dashboard'),
            apiFetch<Alert[]>('/dashboard/alerts'),
            apiFetch<Holiday[]>(`/dashboard/holidays/${new Date().getFullYear()}`),
            apiFetch<DailyLog[]>('/logs?order=asc'),
            apiFetch<InternshipConfig>('/config'),
        ])
            .then(([dashData, alertsData, hols, logs, cfg]) => {
                setData(dashData);
                setAlerts(alertsData);
                setHolidays(hols);
                setConfig(cfg);
                setWorkedDates(new Set(logs.map((l) => l.logDate)));
                // Pre-fill company from config
                if (cfg?.companyName) {
                    setForm((prev) => ({ ...prev, company: cfg.companyName || '' }));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Load holidays when calendar month changes
    useEffect(() => {
        apiFetch<Holiday[]>(`/dashboard/holidays/${calMonth.year}`)
            .then(setHolidays)
            .catch(console.error);
    }, [calMonth.year]);

    const dismissAlert = async (id: string) => {
        try {
            await apiFetch(`/dashboard/alerts/${id}/dismiss`, { method: 'POST' });
            setAlerts((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    // ─── Calculate hours preview ──────────────────────
    const isNormal = form.logType === 'normal';
    const calculatedHours = useMemo(() => {
        if (!isNormal || !form.startTime || !form.endTime) return 0;
        const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const work = toMin(form.endTime) - toMin(form.startTime);
        const lunch = (form.lunchStart && form.lunchEnd)
            ? toMin(form.lunchEnd) - toMin(form.lunchStart) : 0;
        return Math.round(((work - lunch) / 60) * 100) / 100;
    }, [isNormal, form.startTime, form.endTime, form.lunchStart, form.lunchEnd]);

    // ─── Submit new log ────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!form.logDate) { setFormError('A data é obrigatória'); return; }
        if (isNormal) {
            if (!form.startTime || !form.endTime) { setFormError('Hora de início e fim são obrigatórias'); return; }
            if (!form.tasksPerformed.trim()) { setFormError('A tarefa é obrigatória'); return; }
            if (calculatedHours <= 0) { setFormError('As horas calculadas devem ser positivas'); return; }
        }
        if (form.logType === 'justified_absence' && !form.notes.trim()) {
            setFormError('A justificação (notas) é obrigatória para falta justificada');
            return;
        }

        setSaving(true);
        try {
            await apiFetch('/logs', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    logType: form.logType,
                    lunchStart: form.lunchStart || null,
                    lunchEnd: form.lunchEnd || null,
                    startTime: isNormal ? form.startTime : null,
                    endTime: isNormal ? form.endTime : null,
                    tasksPerformed: isNormal ? form.tasksPerformed : null,
                }),
            });
            setShowModal(false);
            // Refresh dashboard
            const [dashData, logs] = await Promise.all([
                apiFetch<DashboardData>('/dashboard'),
                apiFetch<DailyLog[]>('/logs?order=asc'),
            ]);
            setData(dashData);
            setWorkedDates(new Set(logs.map((l) => l.logDate)));
            // Reset form for next use
            setForm({
                logDate: new Date().toISOString().split('T')[0],
                logType: 'normal',
                startTime: '09:00',
                endTime: '18:00',
                lunchStart: '',
                lunchEnd: '',
                company: config?.companyName || '',
                tasksPerformed: '',
                notes: '',
            });
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Calendar computation
    const calendarDays = useMemo(() => {
        const { year, month } = calMonth;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDow = firstDay.getDay() || 7;
        const totalDays = lastDay.getDate();
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const holidayDates = new Set(holidays.filter((h) => {
            const d = new Date(h.date);
            return d.getMonth() === month && d.getFullYear() === year;
        }).map((h) => h.date));

        const days: Array<{ day: number; classes: string; tooltip?: string }> = [];

        for (let i = 1; i < startDow; i++) {
            days.push({ day: 0, classes: 'calendar-day calendar-day--empty' });
        }

        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const date = new Date(year, month, d);
            const dow = date.getDay();
            const classes: string[] = ['calendar-day'];
            let tooltip: string | undefined;

            if (dateStr === todayStr) classes.push('calendar-day--today');
            if (workedDates.has(dateStr)) {
                classes.push('calendar-day--worked');
                tooltip = 'Dia trabalhado';
            }
            if (holidayDates.has(dateStr)) {
                classes.push('calendar-day--holiday');
                const hol = holidays.find((h) => h.date === dateStr);
                tooltip = hol?.namePt || hol?.name || 'Feriado';
            }
            if (dow === 0 || dow === 6) classes.push('calendar-day--weekend');

            days.push({ day: d, classes: classes.join(' '), tooltip });
        }

        return days;
    }, [calMonth, holidays, workedDates]);

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayHeaders = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    if (loading || !data) {
        return <div className="loading"><div className="spinner" /></div>;
    }

    const weeklyChartData = {
        labels: data.weeklyHours.map((w) => w.label),
        datasets: [{
            label: 'Horas',
            data: data.weeklyHours.map((w) => w.hours),
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
            borderRadius: 6,
        }],
    };

    const monthlyChartData = {
        labels: data.monthlyHours.map((m) => m.month),
        datasets: [{
            label: 'Horas',
            data: data.monthlyHours.map((m) => m.hours),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            borderRadius: 6,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
        },
    };

    const alertTypeMapping: Record<string, { icon: string; className: string }> = {
        skipped_days: { icon: '⚠️', className: 'alert-card--warning' },
        low_average: { icon: '📉', className: 'alert-card--danger' },
        forecast: { icon: '📊', className: 'alert-card--info' },
        milestone: { icon: '🎉', className: 'alert-card--success' },
    };

    return (
        <div>
            {/* Page Header (Button Moved) */}
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">O seu progresso de estágio atualizado</p>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="alerts-container">
                    {alerts.map((alert) => {
                        const mapping = alertTypeMapping[alert.alertType] || alertTypeMapping.forecast;
                        return (
                            <div key={alert.id} className={`alert-card ${mapping.className}`}>
                                <span style={{ fontSize: '1.2rem' }}>{mapping.icon}</span>
                                <div className="alert-content">
                                    <div className="alert-title">{alert.title}</div>
                                    <div className="alert-description">{alert.description}</div>
                                </div>
                                <button className="alert-dismiss" onClick={() => dismissAlert(alert.id)} title="Dispensar">✕</button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Next Holiday */}
            {data.nextHoliday && (
                <div className="next-holiday-banner">
                    <span className="next-holiday-icon">🇵🇹</span>
                    <div className="next-holiday-text">
                        <div className="next-holiday-name">Próximo feriado: {data.nextHoliday.name}</div>
                        <div className="next-holiday-date">{new Date(data.nextHoliday.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
            )}

            {/* Main Asymmetric Layout */}
            <div className="dashboard-layout">
                {/* Left Column: Progress Hub & Charts */}
                <div className="dashboard-main">

                    {/* Unified Progress Hub (Replaces 4 KPI Cards + Progress Card) */}
                    <div className="card progress-hub">
                        <div className="progress-hub-top">
                            <div className="progress-hub-metrics">
                                <div className="progress-hub-title">Horas Realizadas</div>
                                <div className="progress-hub-hero">
                                    {data.totalHours.toFixed(1)} <span className="progress-hub-total">/ 640h</span>
                                </div>

                                <div className="progress-hub-secondary">
                                    <div className="hub-stat">
                                        <span className="hub-stat-label">Concluído</span>
                                        <span className="hub-stat-value" style={{ color: 'var(--accent-primary)' }}>{data.percentageProgress.toFixed(1)}%</span>
                                    </div>
                                    <div className="hub-stat">
                                        <span className="hub-stat-label">Restante</span>
                                        <span className="hub-stat-value">{data.remainingHours.toFixed(1)}h</span>
                                    </div>
                                    <div className="hub-stat">
                                        <span className="hub-stat-label">Dias Trabalhados</span>
                                        <span className="hub-stat-value">{data.totalWorkingDaysCompleted} dias <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({data.averageHoursPerDay}h/dia)</span></span>
                                    </div>
                                    <div className="hub-stat">
                                        <span className="hub-stat-label">Fim Previsto</span>
                                        <span className="hub-stat-value">{new Date(data.estimatedEndDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Progress Indicator */}
                        <div className="progress-bar-container mt-md">
                            <div className="progress-track">
                                <div
                                    className={`progress-fill ${data.percentageProgress > 99 ? 'done' : data.percentageProgress > 50 ? 'mid' : ''}`}
                                    style={{ width: `${Math.min(100, data.percentageProgress)}%` }}
                                />
                            </div>
                            <div className="progress-milestones">
                                <span>Início</span>
                                <span style={{ position: 'relative', left: '-10%' }}>Avaliação (320h)</span>
                                <span>Fim (640h)</span>
                            </div>
                        </div>
                    </div>

                    {/* Lighter Charts */}
                    <div className="charts-grid">
                        <div className="chart-card">
                            <div className="chart-title">Resumo Semanal</div>
                            <div style={{ height: 220 }}>
                                {data.weeklyHours.length > 0 ? (
                                    <Bar data={weeklyChartData} options={chartOptions} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados semanais ainda</p></div>
                                )}
                            </div>
                        </div>
                        <div className="chart-card">
                            <div className="chart-title">Resumo Mensal</div>
                            <div style={{ height: 220 }}>
                                {data.monthlyHours.length > 0 ? (
                                    <Bar data={monthlyChartData} options={chartOptions} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados mensais ainda</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Calendar Context */}
                <div className="dashboard-sidebar">

                    {/* Primary Desktop Action */}
                    <div className="desktop-only-cta" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        <button
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', padding: 'var(--space-md)' }}
                            onClick={() => {
                                setFormError('');
                                setShowModal(true);
                            }}
                        >
                            ➕ Registar Horas
                        </button>
                    </div>

                    {/* Compact Calendar */}
                    <div className="calendar-card">
                        <div className="chart-title" style={{ marginBottom: 'var(--space-md)' }}>Atividade Mensal</div>
                        <div className="calendar-nav">
                            <button onClick={() => setCalMonth((prev) => {
                                const m = prev.month - 1;
                                return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
                            })}>← Mês anterior</button>
                            <span className="calendar-month-label">{monthNames[calMonth.month]}</span>
                            <button onClick={() => setCalMonth((prev) => {
                                const m = prev.month + 1;
                                return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m };
                            })}>Mês seguinte →</button>
                        </div>
                        <div className="calendar-grid">
                            {dayHeaders.map((d) => (<div key={d} className="calendar-header">{d}</div>))}
                            {calendarDays.map((cell, i) => (
                                <div key={i} className={cell.classes} title={cell.tooltip}>
                                    {cell.day > 0 ? cell.day : ''}
                                </div>
                            ))}
                        </div>
                        <div className="calendar-legend">
                            <div className="calendar-legend-item"><span className="legend-dot legend-dot--worked" /><span>Trabalho</span></div>
                            <div className="calendar-legend-item"><span className="legend-dot legend-dot--holiday" /><span>Feriado</span></div>
                            <div className="calendar-legend-item"><span className="legend-dot legend-dot--today" /><span>Hoje</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Button */}
            <div className="mobile-sticky-cta">
                <button
                    className="btn btn-primary btn-lg shadow-lg"
                    onClick={() => {
                        setFormError('');
                        setShowModal(true);
                    }}
                >
                    ➕ Registar Horas
                </button>
            </div>

            {/* ─── New Log Modal ─── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Novo Registo Diário</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Data *</label>
                                <input type="date" className="form-input" value={form.logDate}
                                    onChange={(e) => setForm({ ...form, logDate: e.target.value })} required />
                            </div>

                            {/* Log Type Selector */}
                            <div className="form-group">
                                <label className="form-label">Tipo de Registo *</label>
                                <div className="log-type-selector">
                                    {[
                                        { value: 'normal', label: '💼 Trabalho Normal', desc: 'Dia de trabalho regular' },
                                        { value: 'holiday', label: '🏧 Feriado', desc: 'Não conta horas' },
                                        { value: 'justified_absence', label: '📋 Falta Justificada', desc: 'Requer justificação' },
                                    ].map((opt) => (
                                        <label key={opt.value}
                                            className={`log-type-option ${form.logType === opt.value ? 'log-type-option--active' : ''}`}>
                                            <input type="radio" name="logType" value={opt.value}
                                                checked={form.logType === opt.value}
                                                onChange={() => setForm({ ...form, logType: opt.value as typeof form.logType })} />
                                            <div>
                                                <div className="log-type-label">{opt.label}</div>
                                                <div className="log-type-desc">{opt.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Time fields — only for normal */}
                            {isNormal && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Hora Início *</label>
                                            <input type="time" className="form-input" value={form.startTime}
                                                onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Hora Fim *</label>
                                            <input type="time" className="form-input" value={form.endTime}
                                                onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Início Almoço</label>
                                            <input type="time" className="form-input" value={form.lunchStart}
                                                onChange={(e) => setForm({ ...form, lunchStart: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Fim Almoço</label>
                                            <input type="time" className="form-input" value={form.lunchEnd}
                                                onChange={(e) => setForm({ ...form, lunchEnd: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Hours preview */}
                                    <div className="next-holiday-banner" style={{ marginBottom: 'var(--space-md)' }}>
                                        <span style={{ fontSize: '1.3rem' }}>⏱️</span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                Horas calculadas: {calculatedHours > 0 ? `${calculatedHours}h` : '—'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                ({form.startTime} → {form.endTime}){form.lunchStart && form.lunchEnd ? ` − almoço (${form.lunchStart} → ${form.lunchEnd})` : ' (sem almoço)'}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Info banner for non-normal types */}
                            {!isNormal && (
                                <div className="next-holiday-banner" style={{ marginBottom: 'var(--space-md)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>{form.logType === 'holiday' ? '🏧' : '📋'}</span>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {form.logType === 'holiday'
                                            ? 'Feriado: 0 horas contabilizadas, sem tarefas.'
                                            : 'Falta justificada: 0 horas contabilizadas. A justificação nas notas é obrigatória.'}
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Empresa</label>
                                <input type="text" className="form-input" value={form.company}
                                    readOnly
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                    title="Definido na configuração" />
                            </div>

                            {/* Task — only for normal */}
                            {isNormal && (
                                <div className="form-group">
                                    <label className="form-label">Tarefa *</label>
                                    <textarea className="form-textarea" value={form.tasksPerformed}
                                        onChange={(e) => setForm({ ...form, tasksPerformed: e.target.value })}
                                        placeholder="Descreva as tarefas realizadas..." required />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">
                                    {form.logType === 'justified_absence' ? 'Justificação *' : 'Notas (opcional)'}
                                </label>
                                <textarea className="form-textarea" value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder={form.logType === 'justified_absence' ? 'Motivo da falta justificada...' : 'Notas adicionais...'}
                                    required={form.logType === 'justified_absence'}
                                    style={{ minHeight: 80 }} />
                            </div>

                            {formError && (
                                <div className="form-error" style={{ marginBottom: 'var(--space-md)' }}>❌ {formError}</div>
                            )}

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'A guardar...' : '💾 Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
