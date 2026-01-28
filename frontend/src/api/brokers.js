/**
 * Broker API - Frontend service for multi-broker management
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/brokers`,
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

export const brokersAPI = {
  // ==================== BROKER MANAGEMENT ====================

  /**
   * Get list of available brokers
   */
  async getAvailableBrokers() {
    const response = await api.get('/available');
    return response.data;
  },

  /**
   * Connect to a broker
   */
  async connectBroker(brokerId, credentials, paper = true) {
    const response = await api.post('/connect', { brokerId, credentials, paper });
    return response.data;
  },

  /**
   * Disconnect from a broker
   */
  async disconnectBroker(brokerId) {
    const response = await api.post('/disconnect', { brokerId });
    return response.data;
  },

  /**
   * Disconnect all brokers
   */
  async disconnectAll() {
    const response = await api.post('/disconnect-all');
    return response.data;
  },

  /**
   * Get broker connection status
   */
  async getStatus() {
    const response = await api.get('/status');
    return response.data;
  },

  /**
   * Set active broker
   */
  async setActiveBroker(brokerId) {
    const response = await api.post('/set-active', { brokerId });
    return response.data;
  },

  // ==================== ACCOUNT ====================

  /**
   * Get account from active broker
   */
  async getAccount() {
    const response = await api.get('/account');
    return response.data;
  },

  /**
   * Get accounts from all connected brokers
   */
  async getAllAccounts() {
    const response = await api.get('/accounts/all');
    return response.data;
  },

  /**
   * Get total portfolio value across all brokers
   */
  async getTotalPortfolioValue() {
    const response = await api.get('/portfolio/total');
    return response.data;
  },

  // ==================== POSITIONS ====================

  /**
   * Get positions from active broker
   */
  async getPositions() {
    const response = await api.get('/positions');
    return response.data;
  },

  /**
   * Get positions from all brokers
   */
  async getAllPositions() {
    const response = await api.get('/positions/all');
    return response.data;
  },

  /**
   * Close a position
   */
  async closePosition(symbol, brokerId = null) {
    const response = await api.post('/positions/close', { symbol, brokerId });
    return response.data;
  },

  // ==================== ORDERS ====================

  /**
   * Place an order
   */
  async placeOrder(orderParams) {
    const response = await api.post('/orders', orderParams);
    return response.data;
  },

  /**
   * Get orders
   */
  async getOrders(status = 'all') {
    const response = await api.get('/orders', { params: { status } });
    return response.data;
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Cancel all orders
   */
  async cancelAllOrders() {
    const response = await api.delete('/orders');
    return response.data;
  },

  // ==================== MARKET DATA ====================

  /**
   * Get quote
   */
  async getQuote(symbol) {
    const response = await api.get(`/quote/${symbol}`);
    return response.data;
  },

  /**
   * Get historical bars
   */
  async getBars(symbol, timeframe = '1Day', start, end, limit = 100) {
    const params = { timeframe, limit };
    if (start) params.start = start;
    if (end) params.end = end;
    const response = await api.get(`/bars/${symbol}`, { params });
    return response.data;
  },

  /**
   * Check if market is open
   */
  async getMarketStatus() {
    const response = await api.get('/market/status');
    return response.data;
  },
};

export default brokersAPI;
