const express = require('express');
const router = express.Router();
const stockPicksController = require('../controllers/stockPicksController');
const { protect } = require('../middleware/authMiddleware');

// Generate AI stock picks
router.post('/generate', protect, stockPicksController.generateStockPicks);

// Get stock picks history
router.get('/history', protect, stockPicksController.getStockPicksHistory);

module.exports = router;
