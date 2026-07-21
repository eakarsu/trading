const express = require('express');
const controller = require('../controllers/paperTradingController');
const { admin, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/account', controller.getAccount);
router.get('/orders', controller.listOrders);
router.post('/orders', controller.placeOrder);
router.post('/orders/:orderId/execute', controller.executeOrder);
router.post('/kill-switch', controller.setOwnKillSwitch);
router.get('/reconcile', controller.reconcile);
router.get('/audit-export', controller.exportAudit);

router.post('/admin/market-data', admin, controller.ingestMarketData);
router.post('/admin/market-data/reconcile', admin, controller.reconcileMarketData);
router.post('/admin/ledger/corrections', admin, controller.correctLedger);
router.post('/admin/corporate-actions', admin, controller.applyCorporateAction);
router.post('/admin/users/:userId/kill-switch', admin, controller.setUserKillSwitch);

module.exports = router;
