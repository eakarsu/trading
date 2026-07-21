const { MarketDataIngestionService } = require('../src/services/marketDataIngestionService');

const rows = [];
const model = {
  findOne: jest.fn(async ({ where }) => rows.find(row => row.source === where.source && row.sourceRecordId === where.sourceRecordId) || null),
  findByPk: jest.fn(async id => rows.find(row => row.id === id) || null),
  create: jest.fn(async value => { const row = { id: `snapshot-${rows.length + 1}`, ...value }; rows.push(row); return row; }),
  findAll: jest.fn(async () => rows.map(({ sourceRecordId }) => ({ sourceRecordId }))),
};
const base = {
  source: 'test-feed', sourceRecordId: 'quote-1', symbol: 'AAPL', bid: 99, ask: 100,
  last: 99.5, volume: 1000, sourceTimestamp: new Date(Date.now() - 1000).toISOString(), licenseScope: 'paper-display', metadata: {},
};

describe('MarketDataIngestionService', () => {
  beforeAll(() => { process.env.LICENSED_MARKET_DATA_SOURCES = 'test-feed'; });
  beforeEach(() => { rows.length = 0; jest.clearAllMocks(); });

  test('persists source time and treats an exact source-record replay idempotently', async () => {
    const service = new MarketDataIngestionService({ MarketSnapshot: model });
    const first = await service.ingest(base);
    const second = await service.ingest(base);
    expect(first.idempotentReplay).toBe(false);
    expect(second.idempotentReplay).toBe(true);
    expect(second.snapshot.id).toBe(first.snapshot.id);
    expect(first.snapshot.sourceTimestamp.toISOString()).toBe(base.sourceTimestamp);
    expect(model.create).toHaveBeenCalledTimes(1);
  });

  test('rejects conflicting duplicates and unlicensed sources', async () => {
    const service = new MarketDataIngestionService({ MarketSnapshot: model });
    await service.ingest(base);
    await expect(service.ingest({ ...base, ask: 101 })).rejects.toMatchObject({ code: 'SOURCE_RECORD_CONFLICT', status: 409 });
    await expect(service.ingest({ ...base, source: 'unknown' })).rejects.toMatchObject({ code: 'UNLICENSED_MARKET_SOURCE', status: 403 });
  });

  test('reports missing and unexpected provider records during reconciliation', async () => {
    const service = new MarketDataIngestionService({ MarketSnapshot: model });
    await service.ingest(base);
    const result = await service.reconcile({ source: 'test-feed', sourceRecordIds: ['quote-1', 'quote-2'] });
    expect(result.missing).toEqual(['quote-2']);
    expect(result.unexpected).toEqual([]);
  });
});
