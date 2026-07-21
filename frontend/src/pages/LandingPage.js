import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/LandingPage.css';

const features = [
  ['Timestamped inputs', 'Only configured, licensed source identifiers can enter the paper engine. Provider record IDs are idempotent and reconcilable.'],
  ['Deterministic approval', 'Stale data, exposure, cash, position, daily loss, order size, and kill-switch checks run in code—not in an LLM.'],
  ['Realistic paper fills', 'Quote-side pricing, fixed paper slippage, limit behavior, and per-snapshot participation caps produce resting and partial orders.'],
  ['Append-only ledger', 'Every paper fill is represented by balanced PAPER_* entries. Database controls reject history updates and deletion.'],
  ['Corrections and actions', 'Errors are reversed with linked entries. Source-idempotent splits and dividends preserve an inspectable history.'],
  ['Verifiable exports', 'Account, positions, orders, fills, ledger, and a hash-chained audit trail export with a canonical checksum.'],
];

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge"><span className="hero-badge-dot" /><span className="hero-badge-text">PAPER SIMULATION ONLY · NO BROKER OR CUSTODY ACCESS</span></div>
          <h1 className="hero-title">Practice execution with <span className="hero-title-gradient">deterministic controls</span></h1>
          <p className="hero-subtitle">A bounded paper-order journey backed by timestamped market records, liquidity-aware fills, double-entry accounting, and verifiable audit history.</p>
          <div className="hero-buttons">
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>Create paper account</button>
            <button className="btn-hero-secondary" onClick={() => navigate('/login')}>Sign in</button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="hero-stat-value"><span className="gradient">0</span></div><div className="hero-stat-label">Broker connections</div></div>
            <div className="hero-stat"><div className="hero-stat-value"><span className="gradient">100%</span></div><div className="hero-stat-label">Code-based approval</div></div>
            <div className="hero-stat"><div className="hero-stat-value"><span className="gradient">SHA-256</span></div><div className="hero-stat-label">Audit verification</div></div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Supported journey</span>
            <h2 className="section-title">Paper trading you can reconcile</h2>
            <p className="section-subtitle">The application deliberately focuses on one end-to-end simulation path. It will not enable live execution.</p>
          </div>
          <div className="features-grid">
            {features.map(([title, description], index) => (
              <div className="feature-card" key={title}>
                <div className="feature-icon" aria-hidden="true">{index + 1}</div>
                <h3>{title}</h3><p>{description}</p>
                <div className="feature-tags"><span className="feature-tag">Paper boundary</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to run a paper scenario?</h2>
          <p className="cta-text">Create an account, then place orders after an administrator has reconciled an approved data feed.</p>
          <div className="cta-buttons"><button className="btn-hero-primary" onClick={() => navigate('/register')}>Start paper simulation</button></div>
          <div className="cta-features">
            <div className="cta-feature"><span className="cta-feature-icon">✓</span><span>No bank connection</span></div>
            <div className="cta-feature"><span className="cta-feature-icon">✓</span><span>No broker execution</span></div>
            <div className="cta-feature"><span className="cta-feature-icon">✓</span><span>No AI approval</span></div>
          </div>
        </div>
      </section>
      <footer className="landing-footer"><div className="footer-content"><div className="footer-logo">Paper Ledger</div><div className="footer-copyright">Simulation outputs are not investment advice or executable prices.</div></div></footer>
    </div>
  );
};

export default LandingPage;
