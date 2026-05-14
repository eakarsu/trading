// === Batch 11 Gaps & Frontend Mounts ===
import GapSentimentAnalyzerPage from './pages/gap/GapSentimentAnalyzerPage'
import GapRiskCalculatorPage from './pages/gap/GapRiskCalculatorPage'
import GapCorrelationAnalyzerPage from './pages/gap/GapCorrelationAnalyzerPage'
import GapAlertOptimizerPage from './pages/gap/GapAlertOptimizerPage'
import GapResearchSummarizerPage from './pages/gap/GapResearchSummarizerPage'
import GapRealtimeWebsocketPage from './pages/gap/GapRealtimeWebsocketPage'
import GapOptionsStrategiesPage from './pages/gap/GapOptionsStrategiesPage'
import GapTaxLossHarvestingPage from './pages/gap/GapTaxLossHarvestingPage'
import GapPaperTradingSimPage from './pages/gap/GapPaperTradingSimPage'
import GapSocialTradingPage from './pages/gap/GapSocialTradingPage'
import GapRiskManagementRulesPage from './pages/gap/GapRiskManagementRulesPage'
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
import PortfolioPage from './pages/PortfolioPage';
import MarketAnalysisPage from './pages/MarketAnalysisPage';
import PredictionsPage from './pages/PredictionsPage';
import AIStrategiesPage from './pages/AIStrategiesPage';
import StockPicksPage from './pages/StockPicksPage';
import TradingAssistantPage from './pages/TradingAssistantPage';
import ProfilePage from './pages/ProfilePage';
import TradeJournalPage from './pages/TradeJournalPage';
import AIRiskToolsPage from './pages/AIRiskToolsPage';

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

          {/* Protected Routes - Portfolio */}
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <PortfolioPage />
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

          {/* Protected Routes - AI Strategies */}
          <Route
            path="/ai-strategies"
            element={
              <ProtectedRoute>
                <AIStrategiesPage />
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

          {/* Protected Routes - AI & Analysis */}
          <Route
            path="/market-analysis"
            element={
              <ProtectedRoute>
                <MarketAnalysisPage />
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
            path="/stock-picks"
            element={
              <ProtectedRoute>
                <StockPicksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trading-assistant"
            element={
              <ProtectedRoute>
                <TradingAssistantPage />
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

          {/* Protected Routes - Trade Journal (AI-generated rationale per trade) */}
          <Route
            path="/trade-journal"
            element={
              <ProtectedRoute>
                <TradeJournalPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - AI Risk Tools */}
          <Route
            path="/ai-risk-tools"
            element={
              <ProtectedRoute>
                <AIRiskToolsPage />
              </ProtectedRoute>
            }
          />
          {/* === Batch 11 Gaps & Frontend Mounts === */}
          <Route path="/gap/sentiment-analyzer" element={<GapSentimentAnalyzerPage />} />
          <Route path="/gap/risk-calculator" element={<GapRiskCalculatorPage />} />
          <Route path="/gap/correlation-analyzer" element={<GapCorrelationAnalyzerPage />} />
          <Route path="/gap/alert-optimizer" element={<GapAlertOptimizerPage />} />
          <Route path="/gap/research-summarizer" element={<GapResearchSummarizerPage />} />
          <Route path="/gap/realtime-websocket" element={<GapRealtimeWebsocketPage />} />
          <Route path="/gap/options-strategies" element={<GapOptionsStrategiesPage />} />
          <Route path="/gap/tax-loss-harvesting" element={<GapTaxLossHarvestingPage />} />
          <Route path="/gap/paper-trading-sim" element={<GapPaperTradingSimPage />} />
          <Route path="/gap/social-trading" element={<GapSocialTradingPage />} />
          <Route path="/gap/risk-management-rules" element={<GapRiskManagementRulesPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
