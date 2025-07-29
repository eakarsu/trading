import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">AI Trading Platform</h1>
          <p className="hero-subtitle">
            Harness the power of artificial intelligence for smarter trading decisions
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
              Get Started
            </button>
            <button className="btn btn-secondary btn-large" onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Intelligent Market Analysis</h3>
              <p>Real-time data processing and sentiment analysis for informed decisions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Strategy Generator</h3>
              <p>Create and optimize trading strategies with machine learning algorithms</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Conversational Assistant</h3>
              <p>Chat with our AI assistant for personalized trading insights</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <h3>Predictive Analytics</h3>
              <p>Forecast market trends with advanced predictive models</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="cta-section">
        <div className="container">
          <h2 className="section-title">Ready to Transform Your Trading?</h2>
          <p className="cta-text">
            Join thousands of traders who are already using AI to enhance their trading performance
          </p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
