/**
 * Broker Controller
 * Handles API requests for multi-broker functionality
 */
const brokerManager = require('../services/brokers/brokerManager');

// ==================== BROKER MANAGEMENT ====================

/**
 * Get list of available brokers
 * GET /api/brokers/available
 */
const getAvailableBrokers = async (req, res) => {
  try {
    const brokers = brokerManager.getAvailableBrokers();
    res.json({
      success: true,
      data: brokers,
    });
  } catch (error) {
    console.error('Error getting available brokers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Connect to a broker
 * POST /api/brokers/connect
 */
const connectBroker = async (req, res) => {
  try {
    const { brokerId, credentials, paper = true } = req.body;

    if (!brokerId) {
      return res.status(400).json({
        success: false,
        message: 'Broker ID is required',
      });
    }

    if (!credentials) {
      return res.status(400).json({
        success: false,
        message: 'Credentials are required',
      });
    }

    const result = await brokerManager.initializeBroker(brokerId, credentials, paper);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error connecting broker:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Disconnect from a broker
 * POST /api/brokers/disconnect
 */
const disconnectBroker = async (req, res) => {
  try {
    const { brokerId } = req.body;

    if (!brokerId) {
      return res.status(400).json({
        success: false,
        message: 'Broker ID is required',
      });
    }

    const result = brokerManager.disconnectBroker(brokerId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error disconnecting broker:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Disconnect all brokers
 * POST /api/brokers/disconnect-all
 */
const disconnectAll = async (req, res) => {
  try {
    const result = brokerManager.disconnectAll();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error disconnecting all brokers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get broker status
 * GET /api/brokers/status
 */
const getBrokerStatus = async (req, res) => {
  try {
    const status = brokerManager.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting broker status:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Set active broker
 * POST /api/brokers/set-active
 */
const setActiveBroker = async (req, res) => {
  try {
    const { brokerId } = req.body;

    if (!brokerId) {
      return res.status(400).json({
        success: false,
        message: 'Broker ID is required',
      });
    }

    const result = brokerManager.setActiveBroker(brokerId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error setting active broker:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== ACCOUNT ====================

/**
 * Get account from active broker
 * GET /api/brokers/account
 */
const getAccount = async (req, res) => {
  try {
    const account = await brokerManager.getAccount();
    res.json({
      success: true,
      data: account,
      broker: brokerManager.activeBrokerName,
    });
  } catch (error) {
    console.error('Error getting account:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get accounts from all connected brokers
 * GET /api/brokers/accounts/all
 */
const getAllAccounts = async (req, res) => {
  try {
    const accounts = await brokerManager.getAllAccounts();
    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Error getting all accounts:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get total portfolio value across all brokers
 * GET /api/brokers/portfolio/total
 */
const getTotalPortfolioValue = async (req, res) => {
  try {
    const total = await brokerManager.getTotalPortfolioValue();
    res.json({
      success: true,
      data: total,
    });
  } catch (error) {
    console.error('Error getting total portfolio:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== POSITIONS ====================

/**
 * Get positions from active broker
 * GET /api/brokers/positions
 */
const getPositions = async (req, res) => {
  try {
    const positions = await brokerManager.getPositions();
    res.json({
      success: true,
      data: positions,
      broker: brokerManager.activeBrokerName,
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get positions from all connected brokers
 * GET /api/brokers/positions/all
 */
const getAllPositions = async (req, res) => {
  try {
    const positions = await brokerManager.getAllPositions();
    res.json({
      success: true,
      data: positions,
    });
  } catch (error) {
    console.error('Error getting all positions:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Close a position
 * POST /api/brokers/positions/close
 */
const closePosition = async (req, res) => {
  try {
    const { symbol, brokerId } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required',
      });
    }

    let result;
    if (brokerId) {
      const broker = brokerManager.getBroker(brokerId);
      result = await broker.closePosition(symbol);
    } else {
      result = await brokerManager.closePosition(symbol);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error closing position:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== ORDERS ====================

/**
 * Place an order
 * POST /api/brokers/orders
 */
const placeOrder = async (req, res) => {
  try {
    const { symbol, qty, side, type, timeInForce, limitPrice, stopPrice, brokerId } = req.body;

    if (!symbol || !qty || !side) {
      return res.status(400).json({
        success: false,
        message: 'Symbol, quantity, and side are required',
      });
    }

    const orderParams = { symbol, qty, side, type, timeInForce, limitPrice, stopPrice };

    let result;
    if (brokerId) {
      const broker = brokerManager.getBroker(brokerId);
      result = await broker.placeOrder(orderParams);
    } else {
      result = await brokerManager.placeOrder(orderParams);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get orders
 * GET /api/brokers/orders
 */
const getOrders = async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const orders = await brokerManager.getOrders(status);
    res.json({
      success: true,
      data: orders,
      broker: brokerManager.activeBrokerName,
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancel an order
 * DELETE /api/brokers/orders/:orderId
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await brokerManager.cancelOrder(orderId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancel all orders
 * DELETE /api/brokers/orders
 */
const cancelAllOrders = async (req, res) => {
  try {
    const result = await brokerManager.cancelAllOrders();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error canceling all orders:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== MARKET DATA ====================

/**
 * Get quote
 * GET /api/brokers/quote/:symbol
 */
const getQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await brokerManager.getQuote(symbol);
    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Error getting quote:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get historical bars
 * GET /api/brokers/bars/:symbol
 */
const getBars = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1Day', start, end, limit = 100 } = req.query;
    const bars = await brokerManager.getBars(symbol, timeframe, start, end, parseInt(limit));
    res.json({
      success: true,
      data: bars,
    });
  } catch (error) {
    console.error('Error getting bars:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Check if market is open
 * GET /api/brokers/market/status
 */
const getMarketStatus = async (req, res) => {
  try {
    const isOpen = await brokerManager.isMarketOpen();
    res.json({
      success: true,
      data: { isOpen },
    });
  } catch (error) {
    console.error('Error checking market status:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  // Broker Management
  getAvailableBrokers,
  connectBroker,
  disconnectBroker,
  disconnectAll,
  getBrokerStatus,
  setActiveBroker,
  // Account
  getAccount,
  getAllAccounts,
  getTotalPortfolioValue,
  // Positions
  getPositions,
  getAllPositions,
  closePosition,
  // Orders
  placeOrder,
  getOrders,
  cancelOrder,
  cancelAllOrders,
  // Market Data
  getQuote,
  getBars,
  getMarketStatus,
};
