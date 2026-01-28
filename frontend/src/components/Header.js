import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api/auth';
import '../styles/components/Header.css';

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        // If parsing fails, remove invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  // Don't show login/register buttons on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo" onClick={() => navigate('/')}>
          <span className="logo-icon">📈</span>
          <span className="logo-text">TradingAI</span>
        </h1>
        {!isAuthPage && (
          <div className="user-actions">
            {user ? (
              <>
                <div className="user-welcome">
                  <span className="user-avatar">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <span className="user-name">{user.username}</span>
                </div>
                <span className="header-divider"></span>
                <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
                  Profile
                </button>
                <button className="btn btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                  Sign In
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/register')}>
                  Get Started
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
