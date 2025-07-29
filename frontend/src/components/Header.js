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
        <h1 className="logo">AI Trading Platform</h1>
        {!isAuthPage && (
          <div className="user-actions">
            {user ? (
              <>
                <span className="user-welcome">Welcome, {user.username}</span>
                <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
                  Profile
                </button>
                <button className="btn btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                  Login
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/register')}>
                  Register
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
