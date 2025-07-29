import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import MarketAnalysisPage from './pages/MarketAnalysisPage';
import AIStrategiesPage from './pages/AIStrategiesPage';
import TradingAssistantPage from './pages/TradingAssistantPage';
import PredictionsPage from './pages/PredictionsPage';
import PortfolioPage from './pages/PortfolioPage';
import MarketDataPage from './pages/MarketDataPage';
import StrategyPage from './pages/StrategyPage';
import StockPicksPage from './pages/StockPicksPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/market-analysis" 
            element={
              <ProtectedRoute>
                <MarketAnalysisPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/market-data" 
            element={
              <ProtectedRoute>
                <MarketDataPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/strategies" 
            element={
              <ProtectedRoute>
                <AIStrategiesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/strategies/:id" 
            element={
              <ProtectedRoute>
                <StrategyPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assistant" 
            element={
              <ProtectedRoute>
                <TradingAssistantPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/predictions" 
            element={
              <ProtectedRoute>
                <PredictionsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/portfolio" 
            element={
              <ProtectedRoute>
                <PortfolioPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stock-picks" 
            element={
              <ProtectedRoute>
                <StockPicksPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
