const express = require('express');
const router = express.Router();
const marketDataController = require('../controllers/marketDataController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/', (req, res) => {
  res.json({ 
    message: 'Market Data API', 
    endpoints: [
      'GET /',
      'GET /real-time',
      'GET /historical',
      'GET /sentiment',
      'GET /predictions'
    ]
  });
});

// Protected routes (authentication required)
router.get('/real-time', protect, marketDataController.getRealTimeData);
router.get('/historical', protect, marketDataController.getHistoricalData);
router.get('/sentiment', protect, marketDataController.getSentiment);
router.get('/predictions', protect, marketDataController.getPredictions);
router.post('/save', protect, marketDataController.saveMarketData);
router.get('/user-data', protect, marketDataController.getUserMarketData);

// CRUD routes for market data
router.get('/:id', protect, marketDataController.getMarketDataById);
router.put('/:id', protect, marketDataController.updateMarketData);
router.delete('/:id', protect, marketDataController.deleteMarketData);

module.exports = router;
