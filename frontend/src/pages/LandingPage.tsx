/**
 * StageSync — Landing Page
 * A product-first dark landing page that feels like the front door
 * of the internship tracking dashboard.
 */

import React, { useState, useEffect, useRef } from 'react';

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return value;
}

// ─── Intersection Observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.2) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, inView };
}

// ─── Mini Dashboard Mockup component ────────────────────────────────────────
function DashboardMockup() {
    const { ref, inView } = useInView(0.3);
    const hours = useCountUp(312, 1600, inView);

    const barData = [
        { label: 'Seg', h: 8 },
        { label: 'Ter', h: 7.5 },
        { label: 'Qua', h: 8 },
        { label: 'Qui', h: 6 },
        { label: 'Sex', h: 7 },
    ];
    const maxH = 8;

    return (
        <div ref={ref} className="lp-mockup-wrapper">
            {/* Glow blob behind mockup */}
            <div className="lp-mockup-glow" />

            <div className="lp-mockup">
                {/* Mockup top bar */}
                <div className="lp-mockup-topbar">
                    <div className="lp-mockup-dots">
                        <span className="lp-dot lp-dot--red" />
                        <span className="lp-dot lp-dot--yellow" />
                        <span className="lp-dot lp-dot--green" />
                    </div>
                    <span className="lp-mockup-title">StageSync — Dashboard</span>
                </div>

                {/* Progress hub */}
                <div className="lp-mock-section">
                    <div className="lp-mock-label">HORAS REALIZADAS</div>
                    <div className="lp-mock-hero">
                        {hours}h
                        <span className="lp-mock-total">/ 640h</span>
                    </div>
                    <div className="lp-mock-stats-row">
                        <div className="lp-mock-stat">
                            <span className="lp-mock-stat-label">Concluído</span>
                            <span className="lp-mock-stat-value lp-accent">48.8%</span>
                        </div>
                        <div className="lp-mock-stat">
                            <span className="lp-mock-stat-label">Restante</span>
                            <span className="lp-mock-stat-value">328h</span>
                        </div>
                        <div className="lp-mock-stat">
                            <span className="lp-mock-stat-label">Fim Previsto</span>
                            <span className="lp-mock-stat-value">Jun 2026</span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="lp-progress-track">
                        <div
                            className="lp-progress-fill"
                            style={{ width: inView ? '48.8%' : '0%' }}
                        />
                    </div>
                    <div className="lp-progress-labels">
                        <span>Início</span>
                        <span>Avaliação (320h)</span>
                        <span>Fim</span>
                    </div>
                </div>

                {/* Bar chart strip */}
                <div className="lp-mock-section lp-mock-section--chart">
                    <div className="lp-mock-label">RESUMO SEMANAL</div>
                    <div className="lp-mock-chart">
                        {barData.map((b) => (
                            <div key={b.label} className="lp-mock-bar-col">
                                <div
                                    className="lp-mock-bar"
                                    style={{ height: inView ? `${(b.h / maxH) * 100}%` : '0%' }}
                                />
                                <span className="lp-mock-bar-label">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendar strip */}
                <div className="lp-mock-section lp-mock-section--calendar">
                    <div className="lp-mock-label">FEVEREIRO 2026</div>
                    <div className="lp-mock-cal-grid">
                        {Array.from({ length: 28 }, (_, i) => {
                            const day = i + 1;
                            const worked = [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21].includes(day);
                            const today = day === 28;
                            return (
                                <div
                                    key={day}
                                    className={`lp-mock-cal-day ${worked ? 'lp-mock-cal-day--worked' : ''} ${today ? 'lp-mock-cal-day--today' : ''}`}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab component for Audience section ─────────────────────────────────────
function AudienceTabs() {
    const [active, setActive] = useState<'students' | 'supervisors' | 'institutions'>('students');

    const tabs = [
        { id: 'students', label: 'Estudantes', icon: '🎓' },
        { id: 'supervisors', label: 'Supervisores', icon: '👤' },
        { id: 'institutions', label: 'Instituições', icon: '🏛️' },
    ] as const;

    const content = {
        students: {
            headline: 'Foco total no teu progresso',
            points: [
                'Visualiza exatamente quantas horas completaste',
                'Recebe alertas antes de ficar para trás',
                'Exporta relatórios prontos para o orientador',
                'Calendário de atividade integrado',
            ],
        },
        supervisors: {
            headline: 'Acompanha sem overhead',
            points: [
                'Vê o progresso do estagiário em tempo real',
                'Recebe relatórios automáticos de progresso',
                'Identifica desvios antes de se tornarem problemas',
                'Sem formulários em papel',
            ],
        },
        institutions: {
            headline: 'Conformidade académica garantida',
            points: [
                'Monitorização central de todos os estágios',
                'Dados de conclusão auditáveis',
                'Conformidade com horas e calendário académico',
                'Relatórios exportáveis por turma',
            ],
        },
    };

    const current = content[active];

    return (
        <div className="lp-audience-widget">
            <div className="lp-tab-row">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        className={`lp-tab-btn ${active === t.id ? 'lp-tab-btn--active' : ''}`}
                        onClick={() => setActive(t.id)}
                    >
                        <span>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>
            <div className="lp-tab-content">
                <h3 className="lp-tab-headline">{current.headline}</h3>
                <ul className="lp-tab-list">
                    {current.points.map((p, i) => (
                        <li key={i} className="lp-tab-list-item">
                            <span className="lp-check">✓</span>
                            {p}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="lp-root">
            {/* ─── Navbar ───────────────────────────────────────────── */}
            <header className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <div className="lp-nav-logo">
                        <span className="lp-logo-icon">◈</span>
                        StageSync
                    </div>
                    <nav className="lp-nav-links">
                        <button onClick={() => scrollTo('how-it-works')} className="lp-nav-link">Como funciona</button>
                        <button onClick={() => scrollTo('features')} className="lp-nav-link">Funcionalidades</button>
                        <button onClick={() => scrollTo('audience')} className="lp-nav-link">Para quem</button>
                    </nav>
                    <div className="lp-nav-ctas">
                        <a href="/config" className="lp-btn lp-btn--ghost">Entrar</a>
                        <a href="/config" className="lp-btn lp-btn--primary">Começar →</a>
                    </div>
                </div>
            </header>

            {/* ─── Hero ─────────────────────────────────────────────── */}
            <section className="lp-hero">
                <div className="lp-hero-bg" aria-hidden>
                    <div className="lp-hero-orb lp-hero-orb--1" />
                    <div className="lp-hero-orb lp-hero-orb--2" />
                    <div className="lp-hero-grid" />
                </div>

                <div className="lp-hero-inner">
                    <div className="lp-hero-left">
                        <div className="lp-hero-badge">
                            <span className="lp-badge-dot" />
                            Plataforma de estágio académico
                        </div>

                        <h1 className="lp-hero-headline">
                            Controlo total do
                            <span className="lp-headline-accent"> teu estágio</span>,
                            <br />em tempo real.
                        </h1>

                        <p className="lp-hero-sub">
                            StageSync é a plataforma de acompanhamento de estágios para ensino superior.
                            Regista horas, monitoriza o progresso e mantém-te alinhado com os requisitos
                            académicos — sem complicações.
                        </p>

                        <div className="lp-hero-actions">
                            <a href="/config" className="lp-btn lp-btn--primary lp-btn--lg">
                                Começar a rastrear
                            </a>
                            <button
                                onClick={() => scrollTo('how-it-works')}
                                className="lp-btn lp-btn--soft lp-btn--lg"
                            >
                                Ver como funciona
                            </button>
                        </div>

                        <div className="lp-hero-trust">
                            <div className="lp-trust-item">
                                <span className="lp-trust-value">640h</span>
                                <span className="lp-trust-label">limite configurável</span>
                            </div>
                            <div className="lp-trust-divider" />
                            <div className="lp-trust-item">
                                <span className="lp-trust-value">100%</span>
                                <span className="lp-trust-label">visibilidade</span>
                            </div>
                            <div className="lp-trust-divider" />
                            <div className="lp-trust-item">
                                <span className="lp-trust-value">0</span>
                                <span className="lp-trust-label">surpresas</span>
                            </div>
                        </div>
                    </div>

                    <div className="lp-hero-right">
                        <DashboardMockup />
                    </div>
                </div>
            </section>

            {/* ─── Core Value Section ───────────────────────────────── */}
            <section className="lp-section lp-section--value">
                <div className="lp-container">
                    <div className="lp-value-grid">
                        {[
                            {
                                icon: '⏱',
                                title: 'Regista horas sem esforço',
                                desc: 'Um formulário simples para cada dia de trabalho. Entrada, saída, almoço — calculado automaticamente.',
                                color: 'indigo',
                            },
                            {
                                icon: '🎓',
                                title: 'Alinhado com os requisitos académicos',
                                desc: 'Feriados, dias úteis e metas académicas integrados. Sempre sabes se estás no caminho certo.',
                                color: 'blue',
                            },
                            {
                                icon: '📊',
                                title: 'Progresso em tempo real',
                                desc: 'Dashboard em directo com previsão de conclusão, médias e alertas inteligentes.',
                                color: 'emerald',
                            },
                        ].map((p) => (
                            <div key={p.title} className={`lp-value-card lp-value-card--${p.color}`}>
                                <div className="lp-value-icon">{p.icon}</div>
                                <h3 className="lp-value-title">{p.title}</h3>
                                <p className="lp-value-desc">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ─────────────────────────────────────── */}
            <section id="how-it-works" className="lp-section">
                <div className="lp-container">
                    <div className="lp-section-header">
                        <div className="lp-section-label">COMO FUNCIONA</div>
                        <h2 className="lp-section-title">Do registo à conclusão</h2>
                        <p className="lp-section-sub">Três passos simples. Sem formulários em papel.</p>
                    </div>

                    <div className="lp-steps">
                        {[
                            {
                                n: '01',
                                title: 'Regista a atividade diária',
                                desc: 'Abre o StageSync, introduz a hora de entrada e saída. O sistema calcula as horas líquidas e guarda tudo.',
                                tag: 'Registo diário',
                            },
                            {
                                n: '02',
                                title: 'Monitoriza as horas acumuladas',
                                desc: 'O dashboard atualiza em tempo real — vê o progresso, a média diária e a data de conclusão prevista.',
                                tag: 'Dashboard',
                            },
                            {
                                n: '03',
                                title: 'Conclui o estágio com confiança',
                                desc: 'Alertas automáticos garantem que nunca ficas para trás. Exporta o relatório final pronto a entregar.',
                                tag: 'Conclusão',
                            },
                        ].map((s, i) => (
                            <React.Fragment key={s.n}>
                                <div className="lp-step">
                                    <div className="lp-step-num">{s.n}</div>
                                    <div className="lp-step-tag">{s.tag}</div>
                                    <h3 className="lp-step-title">{s.title}</h3>
                                    <p className="lp-step-desc">{s.desc}</p>
                                </div>
                                {i < 2 && <div className="lp-step-connector" aria-hidden />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Feature Highlight ────────────────────────────────── */}
            <section id="features" className="lp-section lp-section--alt">
                <div className="lp-container">
                    <div className="lp-section-header">
                        <div className="lp-section-label">FUNCIONALIDADES</div>
                        <h2 className="lp-section-title">Tudo o que precisas, nada do que não usas</h2>
                    </div>

                    <div className="lp-features-grid">
                        {[
                            {
                                icon: '📈',
                                title: 'Rastreio de progresso',
                                desc: 'Barra de progresso visual com marcos académicos. Vê sempre onde estás em relação ao objectivo.',
                                size: 'large',
                            },
                            {
                                icon: '🗓',
                                title: 'Calendário integrado',
                                desc: 'Dias trabalhados, feriados e dias de ausência num só calendário interactivo.',
                                size: 'normal',
                            },
                            {
                                icon: '🎉',
                                title: 'Feriados automáticos',
                                desc: 'Base de dados de feriados nacionais integrada. Sem cálculos manuais.',
                                size: 'normal',
                            },
                            {
                                icon: '📅',
                                title: 'Resumo semanal & mensal',
                                desc: 'Gráficos de barras limpos com o teu padrão de trabalho ao longo do tempo.',
                                size: 'normal',
                            },
                            {
                                icon: '🔔',
                                title: 'Alertas inteligentes',
                                desc: 'Notificações automáticas quando desvias do ritmo necessário. Age antes que seja tarde.',
                                size: 'large',
                            },
                            {
                                icon: '📄',
                                title: 'Relatórios exportáveis',
                                desc: 'Gera relatórios prontos para o orientador e para a instituição.',
                                size: 'normal',
                            },
                        ].map((f) => (
                            <div key={f.title} className={`lp-feature-card ${f.size === 'large' ? 'lp-feature-card--wide' : ''}`}>
                                <div className="lp-feature-icon">{f.icon}</div>
                                <h4 className="lp-feature-title">{f.title}</h4>
                                <p className="lp-feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Audience Section ─────────────────────────────────── */}
            <section id="audience" className="lp-section">
                <div className="lp-container lp-audience-layout">
                    <div className="lp-audience-left">
                        <div className="lp-section-label">PARA QUEM</div>
                        <h2 className="lp-section-title lp-section-title--left">
                            Para toda a cadeia do estágio
                        </h2>
                        <p className="lp-section-sub lp-section-sub--left">
                            StageSync serve estudantes, supervisores e instituições.
                            Uma plataforma, três perspectivas.
                        </p>
                    </div>
                    <div className="lp-audience-right">
                        <AudienceTabs />
                    </div>
                </div>
            </section>

            {/* ─── Product Preview ──────────────────────────────────── */}
            <section className="lp-section lp-section--alt">
                <div className="lp-container">
                    <div className="lp-section-header">
                        <div className="lp-section-label">PRODUTO</div>
                        <h2 className="lp-section-title">O dashboard que fala por si</h2>
                        <p className="lp-section-sub">Tudo o que importa à vista de olhos.</p>
                    </div>

                    <div className="lp-preview-grid">
                        {[
                            { label: 'Horas Concluídas', value: '312h', sub: 'de 640h totais', accent: 'indigo' },
                            { label: 'Fim Previsto', value: 'Jun 2026', sub: 'ao ritmo actual', accent: 'blue' },
                            { label: 'Dias Trabalhados', value: '39 dias', sub: '8h/dia em média', accent: 'emerald' },
                            { label: 'Esta Semana', value: '36.5h', sub: '+2.5h acima da meta', accent: 'purple' },
                        ].map((s) => (
                            <div key={s.label} className={`lp-preview-card lp-preview-card--${s.accent}`}>
                                <div className="lp-preview-label">{s.label}</div>
                                <div className="lp-preview-value">{s.value}</div>
                                <div className="lp-preview-sub">{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    <div className="lp-preview-note">
                        <span className="lp-preview-note-dot" />
                        Dados reais extraídos do teu registo diário — actualizados a cada entrada.
                    </div>
                </div>
            </section>

            {/* ─── Final CTA ────────────────────────────────────────── */}
            <section className="lp-section lp-cta-section">
                <div className="lp-cta-bg" aria-hidden>
                    <div className="lp-cta-orb" />
                </div>
                <div className="lp-container lp-cta-inner">
                    <div className="lp-cta-badge">Grátis para começar</div>
                    <h2 className="lp-cta-headline">O teu estágio começa agora.</h2>
                    <p className="lp-cta-sub">
                        Configura em minutos. Rastreia desde o primeiro dia.
                    </p>
                    <a href="/config" className="lp-btn lp-btn--primary lp-btn--xl">
                        Começar a rastrear →
                    </a>
                </div>
            </section>

            {/* ─── Footer ───────────────────────────────────────────── */}
            <footer className="lp-footer">
                <div className="lp-container lp-footer-inner">
                    <div className="lp-footer-logo">
                        <span className="lp-logo-icon">◈</span>
                        StageSync
                    </div>
                    <p className="lp-footer-text">
                        Plataforma académica de rastreio de estágios para o ensino superior.
                    </p>
                    <p className="lp-footer-copy">© 2026 StageSync. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
