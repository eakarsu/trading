const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

// Portfolio routes
router.get('/', protect, portfolioController.getPortfolio);
router.get('/:id', protect, portfolioController.getPortfolioById);
router.post('/', protect, portfolioController.createPortfolio);
router.put('/', protect, portfolioController.updatePortfolio);
router.delete('/:id', protect, portfolioController.deletePortfolio);
router.post('/buy', protect, portfolioController.buySecurities);
router.post('/sell', protect, portfolioController.sellSecurities);
router.post('/transfer', protect, portfolioController.transferFunds);

module.exports = router;
