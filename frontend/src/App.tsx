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

function App() {
    const { theme, toggleTheme } = useTheme();
    const [isConfigured, setIsConfigured] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <div className="app">
                {/* ─── Navbar ─── */}
                <nav className="navbar">
                    <div className="nav-container">
                        <NavLink to="/" className="nav-logo">
                            📊 StageSync
                        </NavLink>

                        <button
                            className="nav-hamburger"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Menu"
                        >
                            {mobileMenuOpen ? '✕' : '☰'}
                        </button>

                        <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
                            {isConfigured && (
                                <>
                                    <NavLink
                                        to="/"
                                        end
                                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Painel
                                    </NavLink>
                                    <NavLink
                                        to="/log"
                                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Registo Diário
                                    </NavLink>
                                    <NavLink
                                        to="/reports"
                                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Relatórios
                                    </NavLink>
                                </>
                            )}
                            <NavLink
                                to="/config"
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Configuração
                            </NavLink>
                        </div>

                        <div className="nav-actions">
                            <button
                                className="theme-toggle"
                                onClick={toggleTheme}
                                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                            >
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>
                        </div>
                    </div>
                </nav>

                {/* ─── Main content ─── */}
                <main className="main-content">
                    <Routes>
                        {!isConfigured ? (
                            <Route path="*" element={<Configuration onConfigured={() => setIsConfigured(true)} />} />
                        ) : (
                            <>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/log" element={<DailyLog />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/config" element={<Configuration onConfigured={() => setIsConfigured(true)} />} />
                            </>
                        )}
                    </Routes>
                </main>

                {/* ─── Footer ─── */}
                <footer className="footer">
                    <p>© 2026 StageSync. Todos os direitos reservados.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
