import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            <span className="hero-badge-text">Algorithmic Trading Platform</span>
          </div>

          <h1 className="hero-title">
            Automate Your Trading with{' '}
            <span className="hero-title-gradient">25 Proven Strategies</span>
          </h1>

          <p className="hero-subtitle">
            Build, backtest, and deploy algorithmic trading strategies across multiple brokers.
            Powered by technical analysis, consensus-based signals, and real-time market data.
          </p>

          <div className="hero-buttons">
            <button
              className="btn-hero-primary"
              onClick={() => navigate('/register')}
            >
              Start Trading Free
            </button>
            <button
              className="btn-hero-secondary"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">
                <span className="gradient">25</span>
              </div>
              <div className="hero-stat-label">Trading Strategies</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">
                <span className="gradient">4</span>
              </div>
              <div className="hero-stat-label">Broker Integrations</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">
                <span className="gradient">50+</span>
              </div>
              <div className="hero-stat-label">Major Stocks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Professional Algorithmic Trading Tools</h2>
            <p className="section-subtitle">
              Everything you need to develop, test, and execute automated trading strategies
              with confidence and precision.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <h3>Strategy Builder</h3>
              <p>Build custom trading strategies using 25+ technical indicators including RSI, MACD, Bollinger Bands, Ichimoku, SuperTrend, and more.</p>
              <div className="feature-tags">
                <span className="feature-tag">25 Strategies</span>
                <span className="feature-tag">Signal Generation</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
              </div>
              <h3>Backtesting Engine</h3>
              <p>Test your strategies against historical data. Compare all 25 strategies at once to find the best performing approach for any stock.</p>
              <div className="feature-tags">
                <span className="feature-tag">Historical Data</span>
                <span className="feature-tag">Strategy Comparison</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M7 7h.01"/>
                  <path d="M17 7h.01"/>
                  <path d="M7 17h.01"/>
                  <path d="M17 17h.01"/>
                </svg>
              </div>
              <h3>Auto Trading</h3>
              <p>Deploy automated trading with configurable position sizes, stop losses, and take profits. Execute trades automatically based on strategy signals.</p>
              <div className="feature-tags">
                <span className="feature-tag">Automated Execution</span>
                <span className="feature-tag">Risk Management</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3>Strategy Optimizer</h3>
              <p>Real-time consensus-based analysis across all strategies. Find stocks where multiple strategies agree for higher confidence trades.</p>
              <div className="feature-tags">
                <span className="feature-tag">Consensus Signals</span>
                <span className="feature-tag">Real-time Updates</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>Multi-Broker Support</h3>
              <p>Connect to Alpaca, Interactive Brokers, Tradier, or E*TRADE. Trade with your preferred broker through a unified interface.</p>
              <div className="feature-tags">
                <span className="feature-tag">4 Brokers</span>
                <span className="feature-tag">Paper Trading</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <h3>Technical Indicators</h3>
              <p>Access RSI, MACD, SMA, EMA, Bollinger Bands, Stochastic, OBV, Fibonacci, Pivot Points, and 15+ more professional indicators.</p>
              <div className="feature-tags">
                <span className="feature-tag">25+ Indicators</span>
                <span className="feature-tag">Real-time Calc</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategies Section */}
      <section className="trusted-section">
        <p className="trusted-title">25 Proven Trading Strategies</p>
        <div className="trusted-logos">
          <span className="trusted-logo">RSI</span>
          <span className="trusted-logo">MACD</span>
          <span className="trusted-logo">Bollinger</span>
          <span className="trusted-logo">Ichimoku</span>
          <span className="trusted-logo">SuperTrend</span>
          <span className="trusted-logo">Fibonacci</span>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Automate Your Trading?</h2>
          <p className="cta-text">
            Join traders who are using algorithmic strategies to make data-driven
            trading decisions. Start backtesting and deploying strategies today.
          </p>

          <div className="cta-buttons">
            <button
              className="btn-hero-primary animate-glow"
              onClick={() => navigate('/register')}
            >
              Create Free Account
            </button>
          </div>

          <div className="cta-features">
            <div className="cta-feature">
              <span className="cta-feature-icon">&#10003;</span>
              <span>Paper trading included</span>
            </div>
            <div className="cta-feature">
              <span className="cta-feature-icon">&#10003;</span>
              <span>All 25 strategies free</span>
            </div>
            <div className="cta-feature">
              <span className="cta-feature-icon">&#10003;</span>
              <span>Multi-broker support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">AlgoTrader</div>
          <div className="footer-links">
            <a href="#" className="footer-link">Features</a>
            <a href="#" className="footer-link">Strategies</a>
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
          </div>
          <div className="footer-copyright">
            &copy; 2024 AlgoTrader. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
