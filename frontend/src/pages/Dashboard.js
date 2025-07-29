import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="card">
          <h2>Market Overview</h2>
          <p>Current market status and key indicators</p>
        </div>
        <div className="card">
          <h2>Portfolio Performance</h2>
          <p>Your portfolio performance metrics</p>
        </div>
        <div className="card">
          <h2>AI Recommendations</h2>
          <p>Personalized trading recommendations</p>
        </div>
        <div className="card">
          <h2>Recent Activity</h2>
          <p>Your recent trading activities</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
