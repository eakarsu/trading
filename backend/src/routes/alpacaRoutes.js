const express = require('express');
const router = express.Router();
const alpacaController = require('../controllers/alpacaController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ==================== INITIALIZATION ====================
router.post('/init', alpacaController.initializeAlpaca);
router.post('/disconnect', alpacaController.disconnectAlpaca);
router.get('/status', alpacaController.getStatus);

// ==================== ACCOUNT ====================
router.get('/account', alpacaController.getAccount);

// ==================== POSITIONS ====================
router.get('/positions', alpacaController.getPositions);
router.get('/positions/:symbol', alpacaController.getPosition);
router.delete('/positions/:symbol', alpacaController.closePosition);
router.delete('/positions', alpacaController.closeAllPositions);

// ==================== ORDERS ====================
router.get('/orders', alpacaController.getOrders);
router.get('/orders/:orderId', alpacaController.getOrder);
router.post('/orders', alpacaController.placeOrder);
router.delete('/orders/:orderId', alpacaController.cancelOrder);
router.delete('/orders', alpacaController.cancelAllOrders);

// ==================== MARKET DATA ====================
router.get('/quote/:symbol', alpacaController.getQuote);
router.get('/trade/:symbol', alpacaController.getLatestTrade);
router.get('/bars/:symbol', alpacaController.getBars);
router.post('/snapshots', alpacaController.getSnapshots);

// ==================== ASSETS ====================
router.get('/assets/search/:query', alpacaController.searchAssets);
router.get('/assets/:symbol', alpacaController.getAsset);

// ==================== CLOCK & CALENDAR ====================
router.get('/clock', alpacaController.getClock);
router.get('/calendar', alpacaController.getCalendar);

module.exports = router;
