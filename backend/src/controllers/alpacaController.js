const alpacaService = require('../services/alpacaService');

// ==================== INITIALIZATION ====================

/**
 * Initialize Alpaca with API keys
 * POST /api/alpaca/init
 */
const initializeAlpaca = async (req, res) => {
  try {
    const { apiKey, secretKey, paper = true } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({
        success: false,
        message: 'API key and secret key are required',
      });
    }

    // Trim whitespace from keys
    const trimmedApiKey = apiKey.trim();
    const trimmedSecretKey = secretKey.trim();

    console.log(`Attempting to initialize Alpaca in ${paper ? 'PAPER' : 'LIVE'} mode...`);
    console.log(`API Key starts with: ${trimmedApiKey.substring(0, 4)}...`);
    console.log(`API Key length: ${trimmedApiKey.length}`);

    alpacaService.initialize(trimmedApiKey, trimmedSecretKey, paper);

    // Test connection by getting account
    console.log('Testing connection by fetching account...');
    const account = await alpacaService.getAccount();
    console.log('Alpaca connected successfully!');

    // Resume any strategies that were waiting for Alpaca to reconnect
    const algoTradingService = require('../services/algoTradingService');
    algoTradingService.resumePendingStrategies().catch(err =>
      console.warn('[AlgoTrading] resumePendingStrategies error:', err.message)
    );

    res.json({
      success: true,
      message: `Alpaca initialized in ${paper ? 'PAPER' : 'LIVE'} mode`,
      account: {
        status: account.status,
        currency: account.currency,
        portfolioValue: account.portfolioValue,
      },
    });
  } catch (error) {
    console.error('=== ALPACA ERROR DETAILS ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Status code:', error.statusCode);
    console.error('Full error:', JSON.stringify(error, null, 2));
    console.error('============================');

    // Provide more helpful error messages
    let message = 'Failed to initialize Alpaca';

    if (error.message?.includes('401') || error.statusCode === 401 || error.response?.status === 401) {
      message = 'Invalid API keys. Please check your API Key and Secret Key.';
    } else if (error.message?.includes('403') || error.statusCode === 403) {
      message = 'API keys are valid but access is forbidden. Check if your account is active.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      message = 'Could not connect to Alpaca servers. Check your internet connection.';
    } else if (error.message) {
      message = error.message;
    }

    res.status(500).json({
      success: false,
      message: message,
    });
  }
};

/**
 * Check if Alpaca is initialized
 * GET /api/alpaca/status
 */
const getStatus = (req, res) => {
  res.json({
    success: true,
    initialized: alpacaService.isInitialized,
  });
};

/**
 * Disconnect from Alpaca
 * POST /api/alpaca/disconnect
 */
const disconnectAlpaca = (req, res) => {
  try {
    alpacaService.disconnect();
    res.json({
      success: true,
      message: 'Disconnected from Alpaca',
    });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect',
    });
  }
};

// ==================== ACCOUNT ====================

/**
 * Get account information
 * GET /api/alpaca/account
 */
const getAccount = async (req, res) => {
  try {
    const account = await alpacaService.getAccount();
    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Error getting account:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get account',
    });
  }
};

// ==================== POSITIONS ====================

/**
 * Get all positions
 * GET /api/alpaca/positions
 */
const getPositions = async (req, res) => {
  try {
    const positions = await alpacaService.getPositions();
    res.json({
      success: true,
      data: positions,
      count: positions.length,
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get positions',
    });
  }
};

/**
 * Get position for a specific symbol
 * GET /api/alpaca/positions/:symbol
 */
const getPosition = async (req, res) => {
  try {
    const { symbol } = req.params;
    const position = await alpacaService.getPosition(symbol);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: `No position found for ${symbol}`,
      });
    }

    res.json({
      success: true,
      data: position,
    });
  } catch (error) {
    console.error('Error getting position:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get position',
    });
  }
};

/**
 * Close a position
 * DELETE /api/alpaca/positions/:symbol
 */
const closePosition = async (req, res) => {
  try {
    const { symbol } = req.params;
    const result = await alpacaService.closePosition(symbol);
    res.json({
      success: true,
      message: `Position ${symbol} closed`,
      data: result,
    });
  } catch (error) {
    console.error('Error closing position:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to close position',
    });
  }
};

/**
 * Close all positions
 * DELETE /api/alpaca/positions
 */
const closeAllPositions = async (req, res) => {
  try {
    const result = await alpacaService.closeAllPositions();
    res.json({
      success: true,
      message: 'All positions closed',
      data: result,
    });
  } catch (error) {
    console.error('Error closing all positions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to close all positions',
    });
  }
};

// ==================== ORDERS ====================

/**
 * Get orders
 * GET /api/alpaca/orders
 */
const getOrders = async (req, res) => {
  try {
    const { status = 'all', limit = 100 } = req.query;
    const orders = await alpacaService.getOrders(status, parseInt(limit));
    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get orders',
    });
  }
};

/**
 * Get a specific order
 * GET /api/alpaca/orders/:orderId
 */
const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await alpacaService.getOrder(orderId);
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get order',
    });
  }
};

/**
 * Place a new order
 * POST /api/alpaca/orders
 */
const placeOrder = async (req, res) => {
  try {
    const orderParams = req.body;
    const order = await alpacaService.placeOrder(orderParams);
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to place order',
    });
  }
};

/**
 * Cancel an order
 * DELETE /api/alpaca/orders/:orderId
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await alpacaService.cancelOrder(orderId);
    res.json({
      success: true,
      message: 'Order canceled',
      data: result,
    });
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order',
    });
  }
};

/**
 * Cancel all orders
 * DELETE /api/alpaca/orders
 */
const cancelAllOrders = async (req, res) => {
  try {
    const result = await alpacaService.cancelAllOrders();
    res.json({
      success: true,
      message: 'All orders canceled',
      data: result,
    });
  } catch (error) {
    console.error('Error canceling all orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel all orders',
    });
  }
};

// ==================== MARKET DATA ====================

/**
 * Get quote for a symbol
 * GET /api/alpaca/quote/:symbol
 */
const getQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await alpacaService.getQuote(symbol);
    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Error getting quote:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get quote',
    });
  }
};

/**
 * Get latest trade for a symbol
 * GET /api/alpaca/trade/:symbol
 */
const getLatestTrade = async (req, res) => {
  try {
    const { symbol } = req.params;
    const trade = await alpacaService.getLatestTrade(symbol);
    res.json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error('Error getting trade:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get trade',
    });
  }
};

/**
 * Get historical bars for a symbol
 * GET /api/alpaca/bars/:symbol
 */
const getBars = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1Day', start, end, limit = 100 } = req.query;
    const bars = await alpacaService.getBars(symbol, timeframe, start, end, parseInt(limit));
    res.json({
      success: true,
      data: bars,
      count: bars.length,
    });
  } catch (error) {
    console.error('Error getting bars:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get bars',
    });
  }
};

/**
 * Get snapshots for multiple symbols
 * POST /api/alpaca/snapshots
 */
const getSnapshots = async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required',
      });
    }

    const snapshots = await alpacaService.getSnapshots(symbols);
    res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error('Error getting snapshots:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get snapshots',
    });
  }
};

// ==================== ASSETS ====================

/**
 * Get asset info
 * GET /api/alpaca/assets/:symbol
 */
const getAsset = async (req, res) => {
  try {
    const { symbol } = req.params;
    const asset = await alpacaService.getAsset(symbol);
    res.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error('Error getting asset:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get asset',
    });
  }
};

/**
 * Search assets
 * GET /api/alpaca/assets/search/:query
 */
const searchAssets = async (req, res) => {
  try {
    const { query } = req.params;
    const assets = await alpacaService.searchAssets(query);
    res.json({
      success: true,
      data: assets,
      count: assets.length,
    });
  } catch (error) {
    console.error('Error searching assets:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search assets',
    });
  }
};

// ==================== CLOCK & CALENDAR ====================

/**
 * Get market clock
 * GET /api/alpaca/clock
 */
const getClock = async (req, res) => {
  try {
    const clock = await alpacaService.getClock();
    res.json({
      success: true,
      data: clock,
    });
  } catch (error) {
    console.error('Error getting clock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get clock',
    });
  }
};

/**
 * Get market calendar
 * GET /api/alpaca/calendar
 */
const getCalendar = async (req, res) => {
  try {
    const { start, end } = req.query;
    const calendar = await alpacaService.getCalendar(start, end);
    res.json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    console.error('Error getting calendar:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get calendar',
    });
  }
};

module.exports = {
  initializeAlpaca,
  disconnectAlpaca,
  getStatus,
  getAccount,
  getPositions,
  getPosition,
  closePosition,
  closeAllPositions,
  getOrders,
  getOrder,
  placeOrder,
  cancelOrder,
  cancelAllOrders,
  getQuote,
  getLatestTrade,
  getBars,
  getSnapshots,
  getAsset,
  searchAssets,
  getClock,
  getCalendar,
};
