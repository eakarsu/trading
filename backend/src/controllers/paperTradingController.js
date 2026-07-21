const models = require('../models');
const { DomainError, uuid } = require('../domain/tradingValidation');
const { MarketDataIngestionService } = require('../services/marketDataIngestionService');
const { PaperTradingService } = require('../services/paperTradingService');

const trading = new PaperTradingService(models);
const marketData = new MarketDataIngestionService(models);
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const getAccount = asyncHandler(async (req, res) => {
  res.json(await trading.accountSummary(req.user.id));
});

const placeOrder = asyncHandler(async (req, res) => {
  const result = await trading.placeOrder(req.user.id, req.body, req.user.id);
  const status = result.idempotentReplay ? 200 : result.order.status === 'REJECTED' ? 422 : 201;
  res.status(status).json({ ...result, custodyBoundary: 'PAPER_SIMULATION_ONLY' });
});

const executeOrder = asyncHandler(async (req, res) => {
  res.json(await trading.executeOrder(req.user.id, req.params.orderId, req.user.id));
});

const listOrders = asyncHandler(async (req, res) => {
  res.json({ orders: await trading.listOrders(req.user.id, req.query.limit), custodyBoundary: 'PAPER_SIMULATION_ONLY' });
});

const setOwnKillSwitch = asyncHandler(async (req, res) => {
  // Users may always stop their own account; releasing requires an admin actor.
  res.json(await trading.setKillSwitch(req.user.id, req.body, req.user));
});

const setUserKillSwitch = asyncHandler(async (req, res) => {
  res.json(await trading.setKillSwitch(req.params.userId, req.body, req.user));
});

const reconcile = asyncHandler(async (req, res) => {
  const result = await trading.reconcile(req.user.id);
  res.status(result.valid ? 200 : 409).json(result);
});

const exportAudit = asyncHandler(async (req, res) => {
  const result = await trading.auditExport(req.user.id);
  res.set('Content-Disposition', `attachment; filename="paper-trading-audit-${req.user.id}.json"`);
  res.json(result);
});

const ingestMarketData = asyncHandler(async (req, res) => {
  const result = await marketData.ingest(req.body);
  res.status(result.idempotentReplay ? 200 : 201).json(result);
});

const reconcileMarketData = asyncHandler(async (req, res) => {
  const result = await marketData.reconcile(req.body);
  res.status(result.missing.length || result.unexpected.length ? 409 : 200).json(result);
});

const correctLedger = asyncHandler(async (req, res) => {
  const userId = uuid(req.body.userId, 'userId');
  res.status(201).json(await trading.correctLedger(userId, req.body, req.user.id));
});

const applyCorporateAction = asyncHandler(async (req, res) => {
  const result = await trading.applyCorporateAction(req.body, req.user.id);
  res.status(result.idempotentReplay ? 200 : 201).json(result);
});

module.exports = {
  applyCorporateAction, correctLedger, executeOrder, exportAudit, getAccount, ingestMarketData,
  listOrders, placeOrder, reconcile, reconcileMarketData, setOwnKillSwitch, setUserKillSwitch,
};
