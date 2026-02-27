/**
 * Reports Page — mid-term (320h) and final (640h) report management.
 */

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config/api';
import type { Report, DashboardData } from '../types';

export default function Reports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingReport, setEditingReport] = useState<Report | null>(null);
    const [editContent, setEditContent] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            apiFetch<Report[]>('/reports'),
            apiFetch<DashboardData>('/dashboard'),
        ])
            .then(([reps, dash]) => {
                setReports(reps);
                setDashboard(dash);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const createReport = async (type: 'midterm' | 'final') => {
        try {
            setSaving(true);
            const report = await apiFetch<Report>('/reports', {
                method: 'POST',
                body: JSON.stringify({ reportType: type }),
            });
            setReports((prev) => [report, ...prev]);
            openEditModal(report);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (report: Report) => {
        setEditingReport(report);
        try {
            setEditContent(JSON.parse(report.content));
        } catch {
            setEditContent({});
        }
    };

    const saveReport = async () => {
        if (!editingReport || !editContent) return;
        setSaving(true);
        try {
            const updated = await apiFetch<Report>(`/reports/${editingReport.id}`, {
                method: 'PUT',
                body: JSON.stringify({ content: JSON.stringify(editContent) }),
            });
            setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setEditingReport(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const downloadPdf = async (report: Report) => {
        try {
            const res = await fetch(`/api/reports/${report.id}/pdf`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = report.reportType === 'midterm' ? 'relatorio_intercalar.pdf' : 'relatorio_final.pdf';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        }
    };

    const totalHours = dashboard?.totalHours || 0;
    const hasMidterm = reports.some((r) => r.reportType === 'midterm');
    const hasFinal = reports.some((r) => r.reportType === 'final');

    if (loading) {
        return <div className="loading"><div className="spinner" /></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Relatórios</h1>
                <p className="page-subtitle">Gere relatórios intercalares e finais do seu estágio</p>
            </div>

            {/* Report Cards */}
            <div className="report-cards">
                {/* Mid-term */}
                <div className="card report-card">
                    <div className="report-card-badge">
                        {totalHours >= 320 ? (
                            <span className="badge badge--success">✓ Elegível</span>
                        ) : (
                            <span className="badge badge--warning">{Math.round(320 - totalHours)}h restantes</span>
                        )}
                    </div>
                    <div className="report-card-icon">📋</div>
                    <h3 className="report-card-title">Relatório Intercalar</h3>
                    <p className="report-card-description">
                        Gerado aos 320h. Inclui resumo de atividades, competências e desafios.
                    </p>
                    {hasMidterm ? (
                        <div className="flex gap-sm">
                            {reports.filter((r) => r.reportType === 'midterm').map((r) => (
                                <React.Fragment key={r.id}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(r)}>
                                        ✏️ Editar
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={() => downloadPdf(r)}>
                                        📥 PDF
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={() => createReport('midterm')}
                            disabled={totalHours < 320 || saving}
                        >
                            {totalHours < 320 ? '🔒 Bloqueado' : '📄 Criar Relatório'}
                        </button>
                    )}
                </div>

                {/* Final */}
                <div className="card report-card">
                    <div className="report-card-badge">
                        {totalHours >= 640 ? (
                            <span className="badge badge--success">✓ Elegível</span>
                        ) : (
                            <span className="badge badge--warning">{Math.round(640 - totalHours)}h restantes</span>
                        )}
                    </div>
                    <div className="report-card-icon">🏆</div>
                    <h3 className="report-card-title">Relatório Final</h3>
                    <p className="report-card-description">
                        Gerado aos 640h. Relatório completo com secção de avaliação do orientador.
                    </p>
                    {hasFinal ? (
                        <div className="flex gap-sm">
                            {reports.filter((r) => r.reportType === 'final').map((r) => (
                                <React.Fragment key={r.id}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(r)}>
                                        ✏️ Editar
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={() => downloadPdf(r)}>
                                        📥 PDF
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={() => createReport('final')}
                            disabled={totalHours < 640 || saving}
                        >
                            {totalHours < 640 ? '🔒 Bloqueado' : '📄 Criar Relatório'}
                        </button>
                    )}
                </div>
            </div>

            {/* Existing Reports List */}
            {reports.length > 0 && (
                <div style={{ marginTop: 'var(--space-xl)' }}>
                    <h2 className="section-header">📑 Relatórios Gerados</h2>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Horas</th>
                                    <th>Data de Criação</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((r) => (
                                    <tr key={r.id}>
                                        <td>
                                            <span className={`badge ${r.reportType === 'midterm' ? 'badge--info' : 'badge--success'}`}>
                                                {r.reportType === 'midterm' ? 'Intercalar' : 'Final'}
                                            </span>
                                        </td>
                                        <td>{r.hoursAtCreation}h</td>
                                        <td>{new Date(r.createdAt).toLocaleDateString('pt-PT')}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(r)}>✏️</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => downloadPdf(r)}>📥</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingReport && editContent && (
                <div className="modal-overlay" onClick={() => setEditingReport(null)}>
                    <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                Editar {editingReport.reportType === 'midterm' ? 'Relatório Intercalar' : 'Relatório Final'}
                            </h2>
                            <button className="modal-close" onClick={() => setEditingReport(null)}>✕</button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Resumo das Atividades</label>
                            <textarea
                                className="form-textarea"
                                value={editContent.activitiesSummary || ''}
                                onChange={(e) => setEditContent({ ...editContent, activitiesSummary: e.target.value })}
                                placeholder="Descreva as atividades realizadas durante o período..."
                                style={{ minHeight: 150 }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Competências Desenvolvidas (uma por linha)</label>
                            <textarea
                                className="form-textarea"
                                value={(editContent.skillsDeveloped || []).join('\n')}
                                onChange={(e) => setEditContent({
                                    ...editContent,
                                    skillsDeveloped: e.target.value.split('\n').filter((s: string) => s.trim()),
                                })}
                                placeholder="ex: Programação em TypeScript&#10;Trabalho em equipa&#10;Gestão de projectos"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Desafios Enfrentados (um por linha)</label>
                            <textarea
                                className="form-textarea"
                                value={(editContent.challengesFaced || []).join('\n')}
                                onChange={(e) => setEditContent({
                                    ...editContent,
                                    challengesFaced: e.target.value.split('\n').filter((s: string) => s.trim()),
                                })}
                                placeholder="ex: Integração com sistema legado&#10;Prazos apertados"
                            />
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setEditingReport(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={saveReport} disabled={saving}>
                                {saving ? 'A guardar...' : '💾 Guardar'}
                            </button>
                            <button className="btn btn-success" onClick={() => downloadPdf(editingReport)}>
                                📥 Exportar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
