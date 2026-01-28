import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/algo`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const algoTradingAPI = {
  // Strategy Templates
  getTemplates: () => api.get('/templates'),

  // Signal Generation
  generateSignals: (symbol, strategy, timeframe = '1Day', lookback = 100) =>
    api.post('/signals', { symbol, strategy, timeframe, lookback }),

  // Technical Indicators
  calculateIndicators: (symbol, indicators, timeframe = '1Day', lookback = 100) =>
    api.post('/indicators', { symbol, indicators, timeframe, lookback }),

  // Backtesting
  runBacktest: (config) => api.post('/backtest', config),

  // Auto Trading
  startAutoTrading: (config) => api.post('/auto-trade/start', config),
  stopAutoTrading: (strategyId) => api.post('/auto-trade/stop', { strategyId }),
  getActiveStrategies: () => api.get('/auto-trade/active'),
  getStrategyStatus: (strategyId) => api.get(`/auto-trade/status/${strategyId}`),

  // Strategy Optimizer - Real-time strategy competition (Day Trading)
  startOptimizer: (symbols, config) => api.post('/optimizer/start', { symbols, config }),
  stopOptimizer: () => api.post('/optimizer/stop'),
  getOptimizerStatus: () => api.get('/optimizer/status'),
  runAnalysis: (symbols, config) => api.post('/optimizer/analyze', { symbols, config }),
  updateOptimizerConfig: (config) => api.put('/optimizer/config', { config }),
  addOptimizerSymbol: (symbol) => api.post('/optimizer/symbols', { symbol }),
  removeOptimizerSymbol: (symbol) => api.delete(`/optimizer/symbols/${symbol}`),
  getStrategyLeaderboard: () => api.get('/optimizer/leaderboard'),
};

export default algoTradingAPI;
