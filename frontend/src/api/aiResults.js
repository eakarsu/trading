import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.API_BASE_URL || 'http://localhost:3001'}/api`,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function listAIResults({ page = 1, pageSize = 20, feature, symbol } = {}) {
  const params = { page, pageSize };
  if (feature) params.feature = feature;
  if (symbol) params.symbol = symbol;
  const res = await api.get('/ai/results', { params });
  return res.data;
}

export async function getAIResult(id) {
  const res = await api.get(`/ai/results/${id}`);
  return res.data;
}

export async function getAIStats() {
  const res = await api.get('/ai/stats');
  return res.data;
}

export async function generateTradeRationale(payload) {
  const res = await api.post('/ai/trade-rationale', payload);
  return res.data;
}

export async function aiSentimentAnalyzer(payload) {
  const res = await api.post('/ai/sentiment-analyzer', payload);
  return res.data;
}

export async function aiRiskCalculator(payload) {
  const res = await api.post('/ai/risk-calculator', payload);
  return res.data;
}

export async function aiCorrelationAnalyzer(payload) {
  const res = await api.post('/ai/correlation-analyzer', payload);
  return res.data;
}

export async function aiAlertOptimizer(payload) {
  const res = await api.post('/ai/alert-optimizer', payload);
  return res.data;
}

export async function aiTaxLossHarvest(payload) {
  const res = await api.post('/ai/tax-loss-harvest', payload);
  return res.data;
}

export async function aiOptionsGreeks(payload) {
  const res = await api.post('/ai/options-greeks', payload);
  return res.data;
}

export async function aiCopyTradingSuggest(payload) {
  const res = await api.post('/ai/copy-trading-suggest', payload);
  return res.data;
}

export async function paperTradingAccount() {
  const res = await api.get('/ai/paper-trading/account');
  return res.data;
}

export async function paperTradingOrder(payload) {
  const res = await api.post('/ai/paper-trading/order', payload);
  return res.data;
}

export async function paperTradingReset() {
  const res = await api.post('/ai/paper-trading/reset', {});
  return res.data;
}
