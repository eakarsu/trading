import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/components/Navigation.css';

const Navigation = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
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

      <nav className="nav-section">
        <h3 className="nav-section-title">Analysis</h3>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link 
              to="/market-analysis" 
              className={`nav-link ${location.pathname === '/market-analysis' ? 'active' : ''}`}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-text">Market Analysis</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/market-data" 
              className={`nav-link ${location.pathname === '/market-data' ? 'active' : ''}`}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-text">Market Data</span>
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
        </ul>
      </nav>

      <nav className="nav-section">
        <h3 className="nav-section-title">AI Tools</h3>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link 
              to="/strategies" 
              className={`nav-link ${location.pathname === '/strategies' ? 'active' : ''}`}
            >
              <span className="nav-icon">🤖</span>
              <span className="nav-text">AI Strategies</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/assistant" 
              className={`nav-link ${location.pathname === '/assistant' ? 'active' : ''}`}
            >
              <span className="nav-icon">💬</span>
              <span className="nav-text">Trading Assistant</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/stock-picks" 
              className={`nav-link ${location.pathname === '/stock-picks' ? 'active' : ''}`}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-text">AI Stock Picks</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Navigation;
