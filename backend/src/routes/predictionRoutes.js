const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

// Prediction routes
router.get('/', protect, predictionController.getPredictions);
router.post('/', protect, predictionController.createPrediction);
router.post('/generate', protect, predictionController.generatePrediction);
router.get('/export', protect, predictionController.exportPrediction);
router.get('/:id', protect, predictionController.getPredictionById);
router.put('/:id', protect, predictionController.updatePrediction);
router.delete('/:id', protect, predictionController.deletePrediction);
router.get('/:id/export', protect, predictionController.exportPrediction);
router.post('/:id/export', protect, predictionController.exportPrediction);

module.exports = router;
