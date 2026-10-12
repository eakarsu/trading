import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/auth';
import '../styles/pages/AuthPage.css';

export const configuredDemo = env => env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true'
  && Boolean(env.VITE_DEMO_EMAIL && env.VITE_DEMO_PASSWORD);
export const demoFields = env => configuredDemo(env)
  ? { email: env.VITE_DEMO_EMAIL, password: env.VITE_DEMO_PASSWORD }
  : null;

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const demoAvailable = configuredDemo(import.meta.env);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.login({ email, password });
      navigate('/paper-trading');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <span className="auth-logo-icon">📈</span>
        </div>
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your Paper Ledger account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="button"
            onClick={() => { const demo = demoFields(import.meta.env); if (demo) { setEmail(demo.email); setPassword(demo.password); } }}
            disabled={!demoAvailable || loading}
            aria-label="Fill Demo Credentials"
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
          >
            Fill Demo Credentials
          </button>
          {!demoAvailable && <p className="auth-subtitle">Demo credentials are not configured for this session.</p>}
          <button type="submit" className="btn btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
