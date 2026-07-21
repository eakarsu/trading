const enabled = process.env.RUN_DB_INTEGRATION === 'true';
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase('paper trading persistence and failure scenarios', () => {
  let models;
  let trading;
  let ingest;
  let user;

  beforeAll(async () => {
    process.env.LICENSED_MARKET_DATA_SOURCES = 'integration-feed';
    models = require('../src/models');
    const { PaperTradingService } = require('../src/services/paperTradingService');
    const { MarketDataIngestionService } = require('../src/services/marketDataIngestionService');
    trading = new PaperTradingService(models);
    ingest = new MarketDataIngestionService(models);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    user = await models.User.create({ username: `it-${suffix}`.slice(0, 30), email: `it-${suffix}@example.test`, password: 'integration-password-123', firstName: 'Integration', lastName: 'Test' });
  });

  afterAll(async () => { if (models) await models.sequelize.close(); });

  const quote = (sourceRecordId, symbol, volume, ageMs = 0) => ({
    source: 'integration-feed', sourceRecordId, symbol, bid: 99, ask: 100, last: 99.5, volume,
    sourceTimestamp: new Date(Date.now() - ageMs).toISOString(), licenseScope: 'paper-test',
  });

  test('handles partial fills, exact duplicate orders, stale data, corrections, and corporate actions', async () => {
    await ingest.ingest(quote('aapl-1', 'AAPL', 100));
    const request = { clientOrderId: 'order-partial', symbol: 'AAPL', side: 'BUY', orderType: 'MARKET', quantity: 10 };
    const first = await trading.placeOrder(user.id, request);
    expect(first.order.status).toBe('PARTIALLY_FILLED');
    expect(Number(first.order.filledQuantity)).toBe(5);

    const replay = await trading.placeOrder(user.id, request);
    expect(replay.idempotentReplay).toBe(true);
    await expect(trading.placeOrder(user.id, { ...request, quantity: 11 })).rejects.toMatchObject({ code: 'CLIENT_ORDER_ID_CONFLICT' });

    await ingest.ingest(quote('aapl-2', 'AAPL', 200));
    const completed = await trading.executeOrder(user.id, first.order.id);
    expect(completed.order.status).toBe('FILLED');
    expect(Number(completed.order.filledQuantity)).toBe(10);

    await ingest.ingest(quote('stale-1', 'STALE', 1000, 60000));
    const stale = await trading.placeOrder(user.id, { clientOrderId: 'order-stale', symbol: 'STALE', side: 'BUY', orderType: 'MARKET', quantity: 1 });
    expect(stale.order.status).toBe('REJECTED');
    expect(stale.order.rejectionCode).toBe('MARKET_DATA_STALE');

    const ledgerEntry = await models.LedgerEntry.findOne({ where: { userId: user.id } });
    const correction = await trading.correctLedger(user.id, { eventGroupId: ledgerEntry.eventGroupId, reason: 'integration reversal' }, user.id);
    expect(correction.entries).toHaveLength(4);
    await expect(models.LedgerEntry.update({ description: 'forbidden mutation' }, { where: { id: ledgerEntry.id } })).rejects.toThrow(/append-only/);

    const action = await trading.applyCorporateAction({
      source: 'integration-feed', sourceRecordId: 'split-1', symbol: 'AAPL', actionType: 'SPLIT', ratio: 2,
      effectiveAt: new Date().toISOString(),
    }, user.id);
    expect(action.affectedAccounts).toBe(1);
    const actionReplay = await trading.applyCorporateAction({
      source: 'integration-feed', sourceRecordId: 'split-1', symbol: 'AAPL', actionType: 'SPLIT', ratio: 2,
      effectiveAt: action.action.effectiveAt.toISOString(),
    }, user.id);
    expect(actionReplay.idempotentReplay).toBe(true);

    const dividend = await trading.applyCorporateAction({
      source: 'integration-feed', sourceRecordId: 'dividend-1', symbol: 'AAPL', actionType: 'DIVIDEND', cashAmount: 0.5,
      effectiveAt: new Date().toISOString(),
    }, user.id);
    expect(dividend.affectedAccounts).toBe(1);

    const reconciliation = await trading.reconcile(user.id);
    expect(reconciliation).toMatchObject({ valid: true, exceptions: [] });
    const audit = await trading.auditExport(user.id);
    expect(audit.auditChain.valid).toBe(true);
    expect(audit.checksum).toMatch(/^[a-f0-9]{64}$/);
    const auditEvent = await models.TradingAuditEvent.findOne({ where: { userId: user.id } });
    await expect(models.TradingAuditEvent.update({ eventType: 'FORBIDDEN' }, { where: { id: auditEvent.id } })).rejects.toThrow(/append-only/);
  });

  test('kill switch cancels resting orders and blocks subsequent approval', async () => {
    await ingest.ingest(quote('msft-1', 'MSFT', 1000));
    const resting = await trading.placeOrder(user.id, { clientOrderId: 'resting', symbol: 'MSFT', side: 'BUY', orderType: 'LIMIT', limitPrice: 90, quantity: 1 });
    expect(resting.order.status).toBe('OPEN');
    const stopped = await trading.setKillSwitch(user.id, { active: true, reason: 'scenario stop' }, { id: user.id, role: 'user' });
    expect(stopped.cancelledOrders).toBe(1);
    const blocked = await trading.placeOrder(user.id, { clientOrderId: 'after-stop', symbol: 'MSFT', side: 'BUY', orderType: 'MARKET', quantity: 1 });
    expect(blocked.order.rejectionCode).toBe('KILL_SWITCH_ACTIVE');
  });
});
