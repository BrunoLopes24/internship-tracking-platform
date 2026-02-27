/**
 * Daily Log Page — view, edit, delete log entries (with time-based fields).
 */

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config/api';
import type { DailyLog as DailyLogType, InternshipConfig } from '../types';

export default function DailyLog() {
    const [logs, setLogs] = useState<DailyLogType[]>([]);
    const [config, setConfig] = useState<InternshipConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLog, setEditingLog] = useState<DailyLogType | null>(null);
    const [form, setForm] = useState({ logDate: '', startTime: '', endTime: '', lunchStart: '', lunchEnd: '', company: '', tasksPerformed: '', notes: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        try {
            const [data, cfg] = await Promise.all([
                apiFetch<DailyLogType[]>('/logs?order=desc'),
                apiFetch<InternshipConfig>('/config').catch(() => null),
            ]);
            setLogs(data);
            setConfig(cfg);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const openEditModal = (log: DailyLogType) => {
        setEditingLog(log);
        setForm({
            logDate: log.logDate,
            startTime: log.startTime || '',
            endTime: log.endTime || '',
            lunchStart: log.lunchStart || '',
            lunchEnd: log.lunchEnd || '',
            company: log.company,
            tasksPerformed: log.tasksPerformed || '',
            notes: log.notes || '',
        });
        setError('');
        setShowModal(true);
    };

    // Calculate hours for preview
    const calculatedHours = (() => {
        if (!form.startTime || !form.endTime) return 0;
        const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const work = toMin(form.endTime) - toMin(form.startTime);
        const lunch = (form.lunchStart && form.lunchEnd)
            ? toMin(form.lunchEnd) - toMin(form.lunchStart) : 0;
        return Math.round(((work - lunch) / 60) * 100) / 100;
    })();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.startTime || !form.endTime) { setError('Horas de início e fim são obrigatórias'); return; }
        if (!form.tasksPerformed.trim()) { setError('A tarefa é obrigatória'); return; }
        if (calculatedHours <= 0) { setError('As horas calculadas devem ser positivas'); return; }

        setSaving(true);
        try {
            if (editingLog) {
                await apiFetch(`/logs/${editingLog.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        startTime: form.startTime,
                        endTime: form.endTime,
                        lunchStart: form.lunchStart || null,
                        lunchEnd: form.lunchEnd || null,
                        company: form.company,
                        tasksPerformed: form.tasksPerformed,
                        notes: form.notes || null,
                    }),
                });
            }
            setShowModal(false);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/logs/${id}`, { method: 'DELETE' });
            setDeleteConfirm(null);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleExportCsv = async () => {
        try {
            const res = await fetch('/api/logs/export/csv');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'registo_diario.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredLogs = logs.filter((log) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            log.logDate.includes(term) ||
            log.company.toLowerCase().includes(term) ||
            (log.tasksPerformed?.toLowerCase().includes(term)) ||
            (log.notes?.toLowerCase().includes(term))
        );
    });

    const totalHours = logs.reduce((sum, l) => sum + l.hoursCompleted, 0);

    if (loading) {
        return <div className="loading"><div className="spinner" /></div>;
    }

    return (
        <div>
            {/* Header */}
            <div className="page-header-actions">
                <div>
                    <h1 className="page-title">Registo Diário</h1>
                    <p className="page-subtitle">
                        {logs.length} registos · {totalHours.toFixed(1)}h total
                    </p>
                </div>
                <div className="flex gap-sm">
                    <button className="btn btn-secondary" onClick={handleExportCsv}>📥 Exportar CSV</button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Pesquisar por data, empresa, tarefa ou nota..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Logs Table */}
            {filteredLogs.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">📝</div>
                    <div className="empty-state-title">
                        {searchTerm ? 'Nenhum resultado encontrado' : 'Sem registos ainda'}
                    </div>
                    <p>{searchTerm ? 'Tente uma pesquisa diferente' : 'Use o botão "Novo Registo" no Painel para começar'}</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Horário</th>
                                <th>Almoço</th>
                                <th>Horas</th>
                                <th>Empresa</th>
                                <th>Tarefa</th>
                                <th>Notas</th>
                                <th style={{ width: 100 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td>
                                        <strong>
                                            {new Date(log.logDate).toLocaleDateString('pt-PT', {
                                                weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
                                            })}
                                        </strong>
                                    </td>
                                    <td>
                                        <span className={`badge ${log.logType === 'normal' ? 'badge--success' : log.logType === 'holiday' ? 'badge--info' : 'badge--warning'}`}>
                                            {log.logType === 'normal' ? '💼 Normal' : log.logType === 'holiday' ? '🏧 Feriado' : '📋 Falta'}
                                        </span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {log.startTime && log.endTime ? `${log.startTime} – ${log.endTime}` : '—'}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {log.lunchStart && log.lunchEnd ? `${log.lunchStart} – ${log.lunchEnd}` : '—'}
                                    </td>
                                    <td><span className="badge badge--success">{log.hoursCompleted}h</span></td>
                                    <td className="truncate" style={{ maxWidth: 120 }}>{log.company}</td>
                                    <td className="truncate" style={{ maxWidth: 250 }}>{log.tasksPerformed || '—'}</td>
                                    <td className="truncate" style={{ maxWidth: 120, color: 'var(--text-muted)' }}>{log.notes || '—'}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(log)} title="Editar">✏️</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(log.id)} title="Eliminar">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {showModal && editingLog && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Editar Registo</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Data</label>
                                <input type="date" className="form-input" value={form.logDate} disabled />
                            </div>

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
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Empresa</label>
                                <input type="text" className="form-input" value={form.company}
                                    readOnly
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                    title="Definido na configuração" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tarefa *</label>
                                <textarea className="form-textarea" value={form.tasksPerformed}
                                    onChange={(e) => setForm({ ...form, tasksPerformed: e.target.value })} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notas (opcional)</label>
                                <textarea className="form-textarea" value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    style={{ minHeight: 80 }} />
                            </div>

                            {error && <div className="form-error" style={{ marginBottom: 'var(--space-md)' }}>❌ {error}</div>}

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'A guardar...' : 'Atualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Confirmar Eliminação</h2>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <p className="confirm-dialog-text">Tem a certeza que pretende eliminar este registo? Esta ação não pode ser revertida.</p>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
