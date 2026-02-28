/**
 * Main App component — routing, navbar, and layout.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import { apiFetch } from './config/api';
import Dashboard from './pages/Dashboard';
import Configuration from './pages/Configuration';
import DailyLog from './pages/DailyLog';
import Reports from './pages/Reports';
import LandingPage from './pages/LandingPage';

function App() {
    const { theme, toggleTheme } = useTheme();
    const [isConfigured, setIsConfigured] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        apiFetch('/config')
            .then(() => setIsConfigured(true))
            .catch(() => setIsConfigured(false))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading" style={{ minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* Landing page is always accessible at "/" */}
                <Route path="/" element={<LandingPage />} />

                {/* App shell routes */}
                <Route
                    path="/*"
                    element={
                        <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

                            {/* ─── Mobile Header ─── */}
                            <div className="mobile-header">
                                <span className="mobile-logo">📊 StageSync</span>
                                <button
                                    className="nav-hamburger"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    aria-label="Menu"
                                >
                                    {mobileMenuOpen ? '✕' : '☰'}
                                </button>
                            </div>

                            {/* Mobile Overlay */}
                            {mobileMenuOpen && (
                                <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
                            )}

                            {/* ─── Lateral Sidebar ─── */}
                            <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                                <nav className="sidebar-nav">
                                    {isConfigured && (
                                        <>
                                            <NavLink
                                                to="/dashboard"
                                                end
                                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                                title={isSidebarCollapsed ? "Painel" : ""}
                                            >
                                                <span className="sidebar-icon">📊</span>
                                                <span className="sidebar-text">Painel</span>
                                            </NavLink>
                                            <NavLink
                                                to="/log"
                                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                                title={isSidebarCollapsed ? "Registo Diário" : ""}
                                            >
                                                <span className="sidebar-icon">📝</span>
                                                <span className="sidebar-text">Registo Diário</span>
                                            </NavLink>
                                            <NavLink
                                                to="/reports"
                                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                                title={isSidebarCollapsed ? "Relatórios" : ""}
                                            >
                                                <span className="sidebar-icon">📄</span>
                                                <span className="sidebar-text">Relatórios</span>
                                            </NavLink>
                                        </>
                                    )}
                                    <NavLink
                                        to="/config"
                                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        title={isSidebarCollapsed ? "Configuração" : ""}
                                    >
                                        <span className="sidebar-icon">⚙️</span>
                                        <span className="sidebar-text">Configuração</span>
                                    </NavLink>

                                    {/* Collapse Toggle */}
                                    <div style={{ marginTop: 'var(--space-md)', padding: '0 var(--space-md)', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            className="sidebar-toggle desktop-only"
                                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                            title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
                                        >
                                            {isSidebarCollapsed ? '»' : '«'}
                                        </button>
                                    </div>
                                </nav>
                            </aside>

                            {/* ─── Main Content Wrapper ─── */}
                            <div className="main-wrapper">
                                {/* ─── Top Navbar (Desktop only) ─── */}
                                <div className="desktop-topbar">
                                    <span className="topbar-logo">StageSync</span>
                                </div>

                                <main className="main-content">
                                    <Routes>
                                        {!isConfigured ? (
                                            <Route path="*" element={<Configuration onConfigured={() => setIsConfigured(true)} />} />
                                        ) : (
                                            <>
                                                <Route path="/dashboard" element={<Dashboard />} />
                                                <Route path="/log" element={<DailyLog />} />
                                                <Route path="/reports" element={<Reports />} />
                                                <Route path="/config" element={<Configuration onConfigured={() => setIsConfigured(true)} />} />
                                                <Route path="*" element={<Dashboard />} />
                                            </>
                                        )}
                                    </Routes>
                                </main>

                                {/* ─── Footer ─── */}
                                <footer className="footer">
                                    <p>© 2026 StageSync. Todos os direitos reservados.</p>
                                </footer>
                            </div>
                        </div>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
