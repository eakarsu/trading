import axios from 'axios';

const API_BASE_URL = import.meta.env.API_BASE_URL || 'http://localhost:3001';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Portfolio API functions
export const portfolioAPI = {
  // Get user's portfolio
  getPortfolio: async () => {
    try {
      const response = await apiClient.get('/portfolio');
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  },

  // Create a new portfolio for user
  createPortfolio: async (data) => {
    try {
      const response = await apiClient.post('/portfolio', data);
      return response.data;
    } catch (error) {
      console.error('Error creating portfolio:', error);
      throw error;
    }
  },

  // Buy securities
  buySecurities: async (data) => {
    try {
      const response = await apiClient.post('/portfolio/buy', data);
      return response.data;
    } catch (error) {
      console.error('Error buying securities:', error);
      throw error;
    }
  },

  // Sell securities
  sellSecurities: async (data) => {
    try {
      const response = await apiClient.post('/portfolio/sell', data);
      return response.data;
    } catch (error) {
      console.error('Error selling securities:', error);
      throw error;
    }
  },

  // Transfer funds
  transferFunds: async (data) => {
    try {
      const response = await apiClient.post('/portfolio/transfer', data);
      return response.data;
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw error;
    }
  },

  // Get portfolio by ID
  getPortfolioById: async (id) => {
    try {
      const response = await apiClient.get(`/portfolio/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  },

  // Delete portfolio
  deletePortfolio: async (id) => {
    try {
      const response = await apiClient.delete(`/portfolio/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      throw error;
    }
  }
};

// Market Data API functions
export const marketDataAPI = {
  // Get real-time market data
  getRealTimeData: async () => {
    try {
      const response = await apiClient.get('/market-data/real-time');
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time market data:', error);
      throw error;
    }
  },

  // Get historical market data
  getHistoricalData: async (timeframe = '1D') => {
    try {
      const response = await apiClient.get(`/market-data/historical?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching historical market data:', error);
      throw error;
    }
  },

  // Get market sentiment analysis
  getSentiment: async () => {
    try {
      const response = await apiClient.get('/market-data/sentiment');
      return response.data;
    } catch (error) {
      console.error('Error fetching market sentiment:', error);
      throw error;
    }
  },

  // Get AI-powered market predictions
  getPredictions: async (timeframe = '1D') => {
    try {
      const response = await apiClient.get(`/market-data/predictions?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market predictions:', error);
      throw error;
    }
  },

  // Get saved market data for user
  getUserMarketData: async () => {
    try {
      const response = await apiClient.get('/market-data/user-data');
      return response.data;
    } catch (error) {
      console.error('Error fetching user market data:', error);
      throw error;
    }
  },

  // Save market data
  saveMarketData: async (data) => {
    try {
      const response = await apiClient.post('/market-data/save', data);
      return response.data;
    } catch (error) {
      console.error('Error saving market data:', error);
      throw error;
    }
  },

  // Get market data by ID
  getMarketDataById: async (id) => {
    try {
      const response = await apiClient.get(`/market-data/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  },

  // Update market data
  updateMarketData: async (id, data) => {
    try {
      const response = await apiClient.put(`/market-data/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating market data:', error);
      throw error;
    }
  },

  // Delete market data
  deleteMarketData: async (id) => {
    try {
      const response = await apiClient.delete(`/market-data/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting market data:', error);
      throw error;
    }
  }
};

// Predictions API functions
export const predictionsAPI = {
  // Get all predictions
  getAllPredictions: async () => {
    try {
      const response = await apiClient.get('/predictions');
      return response.data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      throw error;
    }
  },

  // Get prediction by ID
  getPredictionById: async (predictionId) => {
    try {
      const response = await apiClient.get(`/predictions/${predictionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prediction:', error);
      throw error;
    }
  },

  // Create new prediction
  createPrediction: async (data) => {
    try {
      const response = await apiClient.post('/predictions', data);
      return response.data;
    } catch (error) {
      console.error('Error creating prediction:', error);
      throw error;
    }
  },

  // Update prediction
  updatePrediction: async (predictionId, data) => {
    try {
      const response = await apiClient.put(`/predictions/${predictionId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating prediction:', error);
      throw error;
    }
  },

  // Delete prediction
  deletePrediction: async (predictionId) => {
    try {
      const response = await apiClient.delete(`/predictions/${predictionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting prediction:', error);
      throw error;
    }
  },

  // Generate new prediction
  generatePrediction: async (data) => {
    try {
      const response = await apiClient.post('/predictions/generate', data);
      return response.data;
    } catch (error) {
      console.error('Error generating prediction:', error);
      throw error;
    }
  },

  // Export prediction report
  exportReport: async (predictionId) => {
    try {
      console.log(`Exporting report for prediction ${predictionId}`);
      
      // If predictionId is 'latest', get all predictions and export them
      let exportUrl = '/predictions/export';
      if (predictionId && predictionId !== 'latest') {
        exportUrl = `/predictions/${predictionId}/export`;
      }
      
      const response = await apiClient.get(exportUrl, {
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a blob and download the file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `predictions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { message: 'Report exported successfully' };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
};

// Market Analysis API functions
export const marketAnalysisAPI = {
  // Get all market analyses
  getAllAnalyses: async () => {
    try {
      const response = await apiClient.get('/analysis');
      return response.data;
    } catch (error) {
      console.error('Error fetching market analyses:', error);
      throw error;
    }
  },

  // Get market analysis by ID
  getAnalysisById: async (analysisId) => {
    try {
      const response = await apiClient.get(`/analysis/${analysisId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market analysis:', error);
      throw error;
    }
  },

  // Create new market analysis
  createAnalysis: async (data) => {
    try {
      const response = await apiClient.post('/analysis', data);
      return response.data;
    } catch (error) {
      console.error('Error creating market analysis:', error);
      throw error;
    }
  },

  // Update market analysis
  updateAnalysis: async (analysisId, data) => {
    try {
      const response = await apiClient.put(`/analysis/${analysisId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating market analysis:', error);
      throw error;
    }
  },

  // Delete market analysis
  deleteAnalysis: async (analysisId) => {
    try {
      const response = await apiClient.delete(`/analysis/${analysisId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting market analysis:', error);
      throw error;
    }
  },

  // Generate new market analysis
  generateAnalysis: async (data) => {
    try {
      const response = await apiClient.post('/analysis/generate', data);
      return response.data;
    } catch (error) {
      console.error('Error generating market analysis:', error);
      throw error;
    }
  },

  // Get trading assistant response
  getAssistantResponse: async (data) => {
    try {
      const response = await apiClient.post('/analysis/assistant', data);
      return response.data;
    } catch (error) {
      console.error('Error getting assistant response:', error);
      throw error;
    }
  },

  // Export analysis report
  exportReport: async (analysisId) => {
    try {
      console.log(`Exporting report for analysis ${analysisId}`);
      
      // If analysisId is 'latest', get all analyses and export them
      let exportUrl = '/analysis/export';
      if (analysisId && analysisId !== 'latest') {
        exportUrl = `/analysis/${analysisId}/export`;
      }
      
      const response = await apiClient.get(exportUrl, {
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a blob and download the file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `market-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { message: 'Analysis report exported successfully' };
    } catch (error) {
      console.error('Error exporting analysis report:', error);
      throw error;
    }
  }
};

// Strategy API functions
export const strategyAPI = {
  // Get all strategies
  getAllStrategies: async () => {
    try {
      const response = await apiClient.get('/strategies');
      return response.data;
    } catch (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }
  },

  // Get strategy details
  getStrategyDetails: async (strategyId) => {
    try {
      const response = await apiClient.get(`/strategies/${strategyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching strategy details:', error);
      throw error;
    }
  },

  // Create a new strategy
  createStrategy: async (data) => {
    try {
      const response = await apiClient.post('/strategies', data);
      return response.data;
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw error;
    }
  },

  // Update a strategy
  updateStrategy: async (strategyId, data) => {
    try {
      const response = await apiClient.put(`/strategies/${strategyId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating strategy:', error);
      throw error;
    }
  },

  // Delete a strategy
  deleteStrategy: async (strategyId) => {
    try {
      const response = await apiClient.delete(`/strategies/${strategyId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting strategy:', error);
      throw error;
    }
  },

  // Activate strategy
  activateStrategy: async (strategyId) => {
    try {
      const response = await apiClient.post(`/strategies/${strategyId}/activate`);
      return response.data;
    } catch (error) {
      console.error('Error activating strategy:', error);
      throw error;
    }
  },

  // Deactivate strategy
  deactivateStrategy: async (strategyId) => {
    try {
      const response = await apiClient.post(`/strategies/${strategyId}/deactivate`);
      return response.data;
    } catch (error) {
      console.error('Error deactivating strategy:', error);
      throw error;
    }
  },

  // Generate new AI strategy
  generateStrategy: async (data) => {
    try {
      const response = await apiClient.post('/strategies/generate', data);
      return response.data;
    } catch (error) {
      console.error('Error generating strategy:', error);
      throw error;
    }
  },

  // Optimize existing strategy
  optimizeStrategy: async (data) => {
    try {
      const response = await apiClient.post('/strategies/optimize', data);
      return response.data;
    } catch (error) {
      console.error('Error optimizing strategy:', error);
      throw error;
    }
  },

  // Get optimization history
  getOptimizations: async () => {
    try {
      const response = await apiClient.get('/strategies/optimizations');
      return response.data;
    } catch (error) {
      console.error('Error fetching optimizations:', error);
      throw error;
    }
  },

  // Get backtesting results
  getBacktestResults: async () => {
    try {
      const response = await apiClient.get('/strategies/backtests');
      return response.data;
    } catch (error) {
      console.error('Error fetching backtest results:', error);
      throw error;
    }
  }
};

export default { marketDataAPI, portfolioAPI, predictionsAPI, marketAnalysisAPI, strategyAPI };
