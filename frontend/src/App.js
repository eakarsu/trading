import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CommandCenterPage from './pages/CommandCenterPage';
import StrategyBuilderPage from './pages/StrategyBuilderPage';
import BacktestingPage from './pages/BacktestingPage';
import AutoTradingPage from './pages/AutoTradingPage';
import StrategyOptimizerPage from './pages/StrategyOptimizerPage';
import TradeHistoryPage from './pages/TradeHistoryPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ChartsPage from './pages/ChartsPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes - Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Broker Management */}
          <Route
            path="/command-center"
            element={
              <ProtectedRoute>
                <CommandCenterPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Strategy */}
          <Route
            path="/strategy-builder"
            element={
              <ProtectedRoute>
                <StrategyBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/backtesting"
            element={
              <ProtectedRoute>
                <BacktestingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Auto Trading */}
          <Route
            path="/auto-trading"
            element={
              <ProtectedRoute>
                <AutoTradingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategy-optimizer"
            element={
              <ProtectedRoute>
                <StrategyOptimizerPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - History & Monitoring */}
          <Route
            path="/trade-history"
            element={
              <ProtectedRoute>
                <TradeHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/charts"
            element={
              <ProtectedRoute>
                <ChartsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
