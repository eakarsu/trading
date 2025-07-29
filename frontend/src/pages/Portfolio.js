import React from 'react';
import './Portfolio.css';

const Portfolio = () => {
  return (
    <div className="portfolio">
      <h1>Portfolio Management</h1>
      <div className="portfolio-content">
        <div className="card">
          <h2>Portfolio Overview</h2>
          <p>Comprehensive view of your investment portfolio</p>
        </div>
        <div className="card">
          <h2>Asset Allocation</h2>
          <p>Detailed breakdown of your asset distribution</p>
        </div>
        <div className="card">
          <h2>Performance Metrics</h2>
          <p>Key performance indicators and analytics</p>
        </div>
        <div className="card">
          <h2>Risk Analysis</h2>
          <p>Portfolio risk assessment and diversification</p>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
