/**
 * Configuration Page — set up internship parameters.
 */

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config/api';
import type { InternshipConfig } from '../types';

interface Props {
    onConfigured: () => void;
}

const DAY_LABELS = [
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
];

export default function Configuration({ onConfigured }: Props) {
    const [form, setForm] = useState({
        startDate: '',
        requiredHours: 640,
        dailyHours: 8,
        workingDays: [1, 2, 3, 4, 5] as number[],
        studentName: '',
        supervisorName: '',
        companyName: '',
        courseName: '',
        location: '',
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isEdit, setIsEdit] = useState(false);

    // Load existing config
    useEffect(() => {
        apiFetch<InternshipConfig>('/config')
            .then((config) => {
                setForm({
                    startDate: config.startDate,
                    requiredHours: config.requiredHours,
                    dailyHours: config.dailyHours,
                    workingDays: config.workingDays,
                    studentName: config.studentName || '',
                    supervisorName: config.supervisorName || '',
                    companyName: config.companyName || '',
                    courseName: config.courseName || '',
                    location: config.location || '',
                });
                setIsEdit(true);
            })
            .catch(() => {
                // Not configured yet
            });
    }, []);

    const toggleDay = (day: number) => {
        setForm((prev) => ({
            ...prev,
            workingDays: prev.workingDays.includes(day)
                ? prev.workingDays.filter((d) => d !== day)
                : [...prev.workingDays, day].sort(),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!form.startDate) {
            setError('A data de início é obrigatória');
            return;
        }
        if (form.workingDays.length === 0) {
            setError('Selecione pelo menos um dia de trabalho');
            return;
        }

        setSaving(true);
        try {
            await apiFetch('/config', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            setSuccess(true);
            setIsEdit(true);
            onConfigured();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Estimated working days calculation (client-side preview)
    const estimatedWorkDays = form.requiredHours > 0 && form.dailyHours > 0
        ? Math.ceil(form.requiredHours / form.dailyHours)
        : 0;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Configuração do Estágio' : 'Configurar Estágio'}</h1>
                <p className="page-subtitle">
                    {isEdit
                        ? 'Atualize os dados do seu estágio'
                        : 'Configure os dados iniciais para começar a registar horas'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h2 className="section-header">📋 Dados do Estágio</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nome do Aluno(a)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.studentName}
                                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                                placeholder="Nome completo"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Orientador</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.supervisorName}
                                onChange={(e) => setForm({ ...form, supervisorName: e.target.value })}
                                placeholder="Nome do orientador"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Empresa</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.companyName}
                                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                placeholder="Nome da empresa"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Curso</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.courseName}
                                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                                placeholder="Nome do curso"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Local de Estágio</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            placeholder="Ex: Lisboa, Portugal"
                        />
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <h2 className="section-header">⚙️ Horário e Duração</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Data de Início *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={form.startDate}
                                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Horas Totais Necessárias</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.requiredHours}
                                onChange={(e) => setForm({ ...form, requiredHours: Number(e.target.value) })}
                                min={1}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Horas Diárias Planeadas</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.dailyHours}
                                onChange={(e) => setForm({ ...form, dailyHours: Number(e.target.value) })}
                                min={0.5}
                                step={0.5}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Dias de Trabalho</label>
                        <div className="checkbox-grid">
                            {DAY_LABELS.map((day) => (
                                <label
                                    key={day.value}
                                    className={`checkbox-item ${form.workingDays.includes(day.value) ? 'checked' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.workingDays.includes(day.value)}
                                        onChange={() => toggleDay(day.value)}
                                    />
                                    {day.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    {form.startDate && estimatedWorkDays > 0 && (
                        <div className="next-holiday-banner" style={{ marginTop: 'var(--space-md)', marginBottom: 0 }}>
                            <span style={{ fontSize: '1.5rem' }}>📊</span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                    Estimativa: ~{estimatedWorkDays} dias úteis necessários
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {form.requiredHours}h ÷ {form.dailyHours}h/dia = {estimatedWorkDays} dias (excluindo feriados e fins de semana)
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error / Success */}
                {error && (
                    <div className="alert-card alert-card--danger" style={{ marginBottom: 'var(--space-md)' }}>
                        <span>❌</span>
                        <div className="alert-content">
                            <div className="alert-title">Erro</div>
                            <div className="alert-description">{error}</div>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="alert-card alert-card--success" style={{ marginBottom: 'var(--space-md)' }}>
                        <span>✅</span>
                        <div className="alert-content">
                            <div className="alert-title">Configuração guardada com sucesso!</div>
                        </div>
                    </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                    {saving ? 'A guardar...' : isEdit ? '💾 Atualizar Configuração' : '🚀 Iniciar Estágio'}
                </button>
            </form>
        </div>
    );
}
