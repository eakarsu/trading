const { RiskEngine } = require('../src/services/riskEngine');

const now = new Date('2026-07-20T12:00:00.000Z');
const account = {
  cashBalance: 100000, dailyRealizedPnl: 0, killSwitchActive: false,
  maxOrderNotional: 25000, maxSymbolExposure: 50000, maxGrossExposure: 100000,
  maxDailyLoss: 5000, maxParticipationPercent: 5, maxMarketDataAgeSeconds: 30,
};
const snapshot = { bid: 99, ask: 100, last: 99.5, volume: 100, sourceTimestamp: new Date(now.getTime() - 5000) };
const order = { symbol: 'AAPL', side: 'BUY', orderType: 'MARKET', quantity: 2, limitPrice: null };

describe('RiskEngine deterministic policy', () => {
  test('approves a bounded order and publishes the executable liquidity cap', () => {
    const result = new RiskEngine().evaluate({ account, order, snapshot, positions: [], now });
    expect(result.approved).toBe(true);
    expect(result.policy).toBe('paper-risk-v1');
    expect(result.metrics.maxExecutableQuantity).toBe(5);
  });

  test('permits a larger order but identifies that execution must be partial', () => {
    const result = new RiskEngine().evaluate({ account, order: { ...order, quantity: 10 }, snapshot, positions: [], now });
    expect(result.approved).toBe(true);
    expect(result.metrics.liquidityCapped).toBe(true);
  });

  test.each([
    ['KILL_SWITCH_ACTIVE', { account: { ...account, killSwitchActive: true } }],
    ['MARKET_DATA_STALE', { snapshot: { ...snapshot, sourceTimestamp: new Date(now.getTime() - 31000) } }],
    ['ORDER_NOTIONAL_LIMIT', { order: { ...order, quantity: 251 } }],
    ['DAILY_LOSS_LIMIT', { account: { ...account, dailyRealizedPnl: -5000 } }],
    ['LIQUIDITY_UNAVAILABLE', { snapshot: { ...snapshot, volume: 0 } }],
    ['INSUFFICIENT_PAPER_CASH', { account: { ...account, cashBalance: 100 } }],
  ])('rejects %s independently of AI output', (reason, overrides) => {
    const result = new RiskEngine().evaluate({
      account: overrides.account || account,
      order: overrides.order || order,
      snapshot: overrides.snapshot || snapshot,
      positions: [], now,
    });
    expect(result.approved).toBe(false);
    expect(result.reasons).toContain(reason);
  });

  test('enforces symbol and gross exposure and prevents short paper positions', () => {
    const positions = [{ symbol: 'AAPL', quantity: 1, marketValue: 49950 }, { symbol: 'MSFT', quantity: 10, marketValue: 49900 }];
    const buy = new RiskEngine().evaluate({ account, order, snapshot, positions, now });
    expect(buy.reasons).toEqual(expect.arrayContaining(['SYMBOL_EXPOSURE_LIMIT', 'GROSS_EXPOSURE_LIMIT']));
    const sell = new RiskEngine().evaluate({ account, order: { ...order, side: 'SELL', quantity: 2 }, snapshot, positions: [{ symbol: 'AAPL', quantity: 1, marketValue: 99.5 }], now });
    expect(sell.reasons).toContain('INSUFFICIENT_PAPER_POSITION');
  });
});
