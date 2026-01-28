const express = require('express');
const router = express.Router();
const algoTradingController = require('../controllers/algoTradingController');

// Strategy Templates
router.get('/templates', algoTradingController.getStrategyTemplates);

// Signal Generation
router.post('/signals', algoTradingController.generateSignals);

// Technical Indicators
router.post('/indicators', algoTradingController.calculateIndicators);

// Backtesting
router.post('/backtest', algoTradingController.runBacktest);

// Auto Trading
router.post('/auto-trade/start', algoTradingController.startAutoTrading);
router.post('/auto-trade/stop', algoTradingController.stopAutoTrading);
router.get('/auto-trade/active', algoTradingController.getActiveStrategies);
router.get('/auto-trade/status/:strategyId', algoTradingController.getStrategyStatus);

// Strategy Optimizer - Real-time strategy competition
router.post('/optimizer/start', algoTradingController.startOptimizer);
router.post('/optimizer/stop', algoTradingController.stopOptimizer);
router.get('/optimizer/status', algoTradingController.getOptimizerStatus);
router.post('/optimizer/analyze', algoTradingController.runAnalysis);
router.put('/optimizer/config', algoTradingController.updateOptimizerConfig);
router.post('/optimizer/symbols', algoTradingController.addOptimizerSymbol);
router.delete('/optimizer/symbols/:symbol', algoTradingController.removeOptimizerSymbol);
router.get('/optimizer/leaderboard', algoTradingController.getStrategyLeaderboard);

module.exports = router;
