import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with auth header
const alpacaApi = axios.create({
  baseURL: `${API_BASE_URL}/alpaca`,
});

// Add auth token to requests
alpacaApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
alpacaApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const alpacaAPI = {
  // ==================== INITIALIZATION ====================

  /**
   * Initialize Alpaca with API keys
   */
  initialize: async (apiKey, secretKey, paper = true) => {
    const response = await alpacaApi.post('/init', { apiKey, secretKey, paper });
    return response.data;
  },

  /**
   * Check if Alpaca is initialized
   */
  getStatus: async () => {
    const response = await alpacaApi.get('/status');
    return response.data;
  },

  /**
   * Disconnect from Alpaca
   */
  disconnect: async () => {
    const response = await alpacaApi.post('/disconnect');
    return response.data;
  },

  // ==================== ACCOUNT ====================

  /**
   * Get account information
   */
  getAccount: async () => {
    const response = await alpacaApi.get('/account');
    return response.data;
  },

  // ==================== POSITIONS ====================

  /**
   * Get all positions
   */
  getPositions: async () => {
    const response = await alpacaApi.get('/positions');
    return response.data;
  },

  /**
   * Get position for a specific symbol
   */
  getPosition: async (symbol) => {
    const response = await alpacaApi.get(`/positions/${symbol}`);
    return response.data;
  },

  /**
   * Close a position
   */
  closePosition: async (symbol) => {
    const response = await alpacaApi.delete(`/positions/${symbol}`);
    return response.data;
  },

  /**
   * Close all positions
   */
  closeAllPositions: async () => {
    const response = await alpacaApi.delete('/positions');
    return response.data;
  },

  // ==================== ORDERS ====================

  /**
   * Get orders
   */
  getOrders: async (status = 'all', limit = 100) => {
    const response = await alpacaApi.get('/orders', { params: { status, limit } });
    return response.data;
  },

  /**
   * Get a specific order
   */
  getOrder: async (orderId) => {
    const response = await alpacaApi.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Place a new order
   */
  placeOrder: async (orderParams) => {
    const response = await alpacaApi.post('/orders', orderParams);
    return response.data;
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (orderId) => {
    const response = await alpacaApi.delete(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Cancel all orders
   */
  cancelAllOrders: async () => {
    const response = await alpacaApi.delete('/orders');
    return response.data;
  },

  // ==================== MARKET DATA ====================

  /**
   * Get quote for a symbol
   */
  getQuote: async (symbol) => {
    const response = await alpacaApi.get(`/quote/${symbol}`);
    return response.data;
  },

  /**
   * Get latest trade for a symbol
   */
  getLatestTrade: async (symbol) => {
    const response = await alpacaApi.get(`/trade/${symbol}`);
    return response.data;
  },

  /**
   * Get historical bars
   */
  getBars: async (symbol, timeframe = '1Day', start, end, limit = 100) => {
    const response = await alpacaApi.get(`/bars/${symbol}`, {
      params: { timeframe, start, end, limit },
    });
    return response.data;
  },

  /**
   * Get snapshots for multiple symbols
   */
  getSnapshots: async (symbols) => {
    const response = await alpacaApi.post('/snapshots', { symbols });
    return response.data;
  },

  // ==================== ASSETS ====================

  /**
   * Get asset info
   */
  getAsset: async (symbol) => {
    const response = await alpacaApi.get(`/assets/${symbol}`);
    return response.data;
  },

  /**
   * Search assets
   */
  searchAssets: async (query) => {
    const response = await alpacaApi.get(`/assets/search/${query}`);
    return response.data;
  },

  // ==================== CLOCK & CALENDAR ====================

  /**
   * Get market clock
   */
  getClock: async () => {
    const response = await alpacaApi.get('/clock');
    return response.data;
  },

  /**
   * Get market calendar
   */
  getCalendar: async (start, end) => {
    const response = await alpacaApi.get('/calendar', { params: { start, end } });
    return response.data;
  },
};

export default alpacaAPI;
