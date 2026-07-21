import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/components/Navigation.css';

const Navigation = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem('token') && localStorage.getItem('user')));
  }, [location]);

  if (['/', '/login', '/register'].includes(location.pathname) || !isAuthenticated) return null;

  const link = (path, icon, label) => (
    <li className="nav-item">
      <Link to={path} className={`nav-link ${location.pathname === path ? 'active' : ''}`}>
        <span className="nav-icon">{icon}</span><span className="nav-text">{label}</span>
      </Link>
    </li>
  );

  return (
    <aside className="sidebar">
      <nav className="nav-section">
        <h3 className="nav-section-title">Paper simulation</h3>
        <ul className="nav-menu">{link('/paper-trading', '🧾', 'Orders & Ledger')}</ul>
      </nav>
      <nav className="nav-section">
        <h3 className="nav-section-title">Account</h3>
        <ul className="nav-menu">{link('/profile', '👤', 'Profile')}</ul>
      </nav>
    </aside>
  );
};

export default Navigation;
