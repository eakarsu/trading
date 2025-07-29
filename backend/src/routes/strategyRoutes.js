const express = require('express');
const router = express.Router();
const strategyController = require('../controllers/strategyController');
const { protect } = require('../middleware/authMiddleware');

// AI Strategy routes (must come before parameterized routes)
router.post('/generate', protect, strategyController.generateAIStrategy);
router.post('/optimize', protect, strategyController.optimizeStrategy);
router.get('/optimizations', protect, strategyController.getOptimizations);
router.get('/backtests', protect, strategyController.getBacktestResults);

// Strategy routes
router.get('/', protect, strategyController.getStrategies);
router.get('/:id', protect, strategyController.getStrategyById);
router.post('/', protect, strategyController.createStrategy);
router.put('/:id', protect, strategyController.updateStrategy);
router.delete('/:id', protect, strategyController.deleteStrategy);
router.post('/:id/activate', protect, strategyController.activateStrategy);
router.post('/:id/deactivate', protect, strategyController.deactivateStrategy);
router.post('/:id/trades', protect, strategyController.addTrade);
router.post('/:id/backtest', protect, strategyController.updateBacktestResults);

module.exports = router;
