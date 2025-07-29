const express = require('express');
const router = express.Router();
const marketAnalysisController = require('../controllers/marketAnalysisController');
const { protect } = require('../middleware/authMiddleware');

// Market Analysis routes
router.get('/', protect, marketAnalysisController.getMarketAnalyses);
router.post('/', protect, marketAnalysisController.createMarketAnalysis);
router.post('/generate', protect, marketAnalysisController.generateMarketAnalysis);
router.post('/assistant', protect, marketAnalysisController.getTradingAssistantResponse);
router.get('/export', protect, marketAnalysisController.exportAnalysis);
router.post('/stock-picks', protect, marketAnalysisController.generateStockPicks);
router.get('/:id', protect, marketAnalysisController.getMarketAnalysisById);
router.put('/:id', protect, marketAnalysisController.updateMarketAnalysis);
router.delete('/:id', protect, marketAnalysisController.deleteMarketAnalysis);
router.get('/:id/export', protect, marketAnalysisController.exportAnalysis);

module.exports = router;
