const { ScenarioReplayService } = require('../src/services/scenarioReplayService');

describe('historical scenario replay', () => {
  test('replays duplicate, partial-fill, stale-data, and kill-switch failures without wall-clock dependence', () => {
    const report = new ScenarioReplayService().run({ events: [
      { type: 'SNAPSHOT', at: '2025-01-02T14:30:00Z', sourceTimestamp: '2025-01-02T14:30:00Z', symbol: 'AAPL', bid: 99, ask: 100, last: 99.5, volume: 100 },
      { type: 'ORDER', at: '2025-01-02T14:30:01Z', clientOrderId: 'backtest-1', symbol: 'AAPL', side: 'BUY', orderType: 'MARKET', quantity: 10 },
      { type: 'ORDER', at: '2025-01-02T14:30:02Z', clientOrderId: 'backtest-1', symbol: 'AAPL', side: 'BUY', orderType: 'MARKET', quantity: 10 },
      { type: 'EXECUTE', at: '2025-01-02T14:30:03Z', clientOrderId: 'backtest-1' },
      { type: 'SNAPSHOT', at: '2025-01-02T14:31:00Z', sourceTimestamp: '2025-01-02T14:31:00Z', symbol: 'AAPL', bid: 100, ask: 101, last: 100.5, volume: 200 },
      { type: 'EXECUTE', at: '2025-01-02T14:31:01Z', clientOrderId: 'backtest-1' },
      { type: 'SNAPSHOT', at: '2025-01-02T14:32:00Z', sourceTimestamp: '2025-01-02T14:30:00Z', symbol: 'STALE', bid: 49, ask: 50, last: 49.5, volume: 1000 },
      { type: 'ORDER', at: '2025-01-02T14:32:01Z', clientOrderId: 'backtest-stale', symbol: 'STALE', side: 'BUY', orderType: 'MARKET', quantity: 1 },
      { type: 'KILL_SWITCH', at: '2025-01-02T14:33:00Z', active: true },
      { type: 'ORDER', at: '2025-01-02T14:33:01Z', clientOrderId: 'backtest-stopped', symbol: 'AAPL', side: 'BUY', orderType: 'MARKET', quantity: 1 },
    ] });

    expect(report.eventResults).toEqual(expect.arrayContaining([
      expect.objectContaining({ clientOrderId: 'backtest-1', status: 'PARTIALLY_FILLED', fillQuantity: 5 }),
      expect.objectContaining({ clientOrderId: 'backtest-1', status: 'IDEMPOTENT_REPLAY' }),
      expect.objectContaining({ clientOrderId: 'backtest-1', status: 'PARTIALLY_FILLED', code: 'WAITING_FOR_LIQUIDITY' }),
      expect.objectContaining({ clientOrderId: 'backtest-1', status: 'FILLED', fillQuantity: 5 }),
      expect.objectContaining({ clientOrderId: 'backtest-stale', code: 'MARKET_DATA_STALE' }),
      expect.objectContaining({ clientOrderId: 'backtest-stopped', code: 'KILL_SWITCH_ACTIVE' }),
    ]));
    expect(report.orders.find(order => order.clientOrderId === 'backtest-1').filledQuantity).toBe(10);
    expect(report.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  test('rejects conflicting duplicate payloads deterministically', () => {
    const report = new ScenarioReplayService().run({ events: [
      { type: 'SNAPSHOT', at: '2025-01-02T14:30:00Z', sourceTimestamp: '2025-01-02T14:30:00Z', symbol: 'AAPL', bid: 99, ask: 100, last: 99.5, volume: 1000 },
      { type: 'ORDER', at: '2025-01-02T14:30:01Z', clientOrderId: 'duplicate', symbol: 'AAPL', side: 'BUY', orderType: 'MARKET', quantity: 1 },
      { type: 'ORDER', at: '2025-01-02T14:30:02Z', clientOrderId: 'duplicate', symbol: 'AAPL', side: 'BUY', orderType: 'MARKET', quantity: 2 },
    ] });
    expect(report.eventResults.at(-1)).toMatchObject({ status: 'REJECTED', code: 'CLIENT_ORDER_ID_CONFLICT' });
  });
});
