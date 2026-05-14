import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/components/Navigation.css';

const Navigation = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsAuthenticated(!!(token && userData));
  }, [location]);

  // Don't show navigation on auth pages or landing page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';

  if (isAuthPage || !isAuthenticated) {
    return null;
  }

  return (
    <aside className="sidebar">
      {/* Dashboard */}
      <nav className="nav-section">
        <h3 className="nav-section-title">Overview</h3>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              to="/dashboard"
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/portfolio"
              className={`nav-link ${location.pathname === '/portfolio' ? 'active' : ''}`}
            >
              <span className="nav-icon">💼</span>
              <span className="nav-text">Portfolio</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Trading */}
      <nav className="nav-section">
        <h3 className="nav-section-title">Trading</h3>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              to="/command-center"
              className={`nav-link ${location.pathname === '/command-center' ? 'active' : ''}`}
            >
              <span className="nav-icon">🔗</span>
              <span className="nav-text">Command Center</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/trade-history"
              className={`nav-link ${location.pathname === '/trade-history' ? 'active' : ''}`}
            >
              <span className="nav-icon">📜</span>
              <span className="nav-text">Trade History</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/alerts"
              className={`nav-link ${location.pathname === '/alerts' ? 'active' : ''}`}
            >
              <span className="nav-icon">🔔</span>
              <span className="nav-text">Price Alerts</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/analytics"
              className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-text">Analytics</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/charts"
              className={`nav-link ${location.pathname === '/charts' ? 'active' : ''}`}
            >
              <span className="nav-icon">📉</span>
              <span className="nav-text">Charts</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Strategy Development */}
      <nav className="nav-section">
        <h3 className="nav-section-title">Strategy</h3>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              to="/strategy-builder"
              className={`nav-link ${location.pathname === '/strategy-builder' ? 'active' : ''}`}
            >
              <span className="nav-icon">🛠️</span>
              <span className="nav-text">Strategy Builder</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/ai-strategies"
              className={`nav-link ${location.pathname === '/ai-strategies' ? 'active' : ''}`}
            >
              <span className="nav-icon">🧠</span>
              <span className="nav-text">AI Strategies</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/ai-risk-tools"
              className={`nav-link ${location.pathname === '/ai-risk-tools' ? 'active' : ''}`}
            >
              <span className="nav-icon">⚠️</span>
              <span className="nav-text">AI Risk Tools</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/backtesting"
              className={`nav-link ${location.pathname === '/backtesting' ? 'active' : ''}`}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Backtesting</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Automated Trading */}
      <nav className="nav-section">
        <h3 className="nav-section-title">Auto Trading</h3>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              to="/auto-trading"
              className={`nav-link ${location.pathname === '/auto-trading' ? 'active' : ''}`}
            >
              <span className="nav-icon">🤖</span>
              <span className="nav-text">Auto Trading</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/strategy-optimizer"
              className={`nav-link ${location.pathname === '/strategy-optimizer' ? 'active' : ''}`}
            >
              <span className="nav-icon">⚡</span>
              <span className="nav-text">Strategy Optimizer</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* AI & Analysis */}
      <nav className="nav-section">
        <h3 className="nav-section-title">AI & Analysis</h3>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              to="/market-analysis"
              className={`nav-link ${location.pathname === '/market-analysis' ? 'active' : ''}`}
            >
              <span className="nav-icon">🔬</span>
              <span className="nav-text">Market Analysis</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/predictions"
              className={`nav-link ${location.pathname === '/predictions' ? 'active' : ''}`}
            >
              <span className="nav-icon">🔮</span>
              <span className="nav-text">Predictions</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/stock-picks"
              className={`nav-link ${location.pathname === '/stock-picks' ? 'active' : ''}`}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-text">Stock Picks</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/trading-assistant"
              className={`nav-link ${location.pathname === '/trading-assistant' ? 'active' : ''}`}
            >
              <span className="nav-icon">💬</span>
              <span className="nav-text">Trading Assistant</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Profile */}
      <nav className="nav-section">
        <h3 className="nav-section-title">Account</h3>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              to="/profile"
              className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">Profile</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Navigation;
