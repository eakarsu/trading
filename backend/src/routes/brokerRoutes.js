/**
 * Broker Routes
 * API endpoints for multi-broker functionality
 */
const express = require('express');
const router = express.Router();
const brokerController = require('../controllers/brokerController');

// ==================== BROKER MANAGEMENT ====================

// Get available brokers
router.get('/available', brokerController.getAvailableBrokers);

// Connect to a broker
router.post('/connect', brokerController.connectBroker);

// Disconnect from a broker
router.post('/disconnect', brokerController.disconnectBroker);

// Disconnect all brokers
router.post('/disconnect-all', brokerController.disconnectAll);

// Get broker status
router.get('/status', brokerController.getBrokerStatus);

// Set active broker
router.post('/set-active', brokerController.setActiveBroker);

// ==================== ACCOUNT ====================

// Get account from active broker
router.get('/account', brokerController.getAccount);

// Get accounts from all connected brokers
router.get('/accounts/all', brokerController.getAllAccounts);

// Get total portfolio value
router.get('/portfolio/total', brokerController.getTotalPortfolioValue);

// ==================== POSITIONS ====================

// Get positions from active broker
router.get('/positions', brokerController.getPositions);

// Get positions from all brokers
router.get('/positions/all', brokerController.getAllPositions);

// Close a position
router.post('/positions/close', brokerController.closePosition);

// ==================== ORDERS ====================

// Place an order
router.post('/orders', brokerController.placeOrder);

// Get orders
router.get('/orders', brokerController.getOrders);

// Cancel a specific order
router.delete('/orders/:orderId', brokerController.cancelOrder);

// Cancel all orders
router.delete('/orders', brokerController.cancelAllOrders);

// ==================== MARKET DATA ====================

// Get quote
router.get('/quote/:symbol', brokerController.getQuote);

// Get historical bars
router.get('/bars/:symbol', brokerController.getBars);

// Get market status
router.get('/market/status', brokerController.getMarketStatus);

module.exports = router;
