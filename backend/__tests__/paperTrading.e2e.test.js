const enabled = process.env.RUN_DB_INTEGRATION === 'true';
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase('authenticated paper trading API', () => {
  let models;
  let token;
  let request;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-jwt-secret-at-least-32-characters';
    models = require('../src/models');
    const user = await models.User.create({ username: `api-${Date.now()}`.slice(0, 30), email: `api-${Date.now()}@example.test`, password: 'integration-password-123', firstName: 'API', lastName: 'Test' });
    token = require('jsonwebtoken').sign({ id: user.id }, process.env.JWT_SECRET);
    request = require('supertest')(require('../server').app);
  });

  afterAll(async () => { if (models) await models.sequelize.close(); });

  test('requires authentication and exposes the explicit custody boundary', async () => {
    await request.get('/api/paper-trading/account').expect(401);
    const response = await request.get('/api/paper-trading/account').set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.body.custodyBoundary).toBe('PAPER_SIMULATION_ONLY');
    expect(response.body.liveTradingEnabled).toBe(false);
  });

  test('registers a first-time user and opens a ledger-backed paper account', async () => {
    const suffix = Date.now();
    const registration = await request.post('/api/users/register').send({
      username: `new-${suffix}`.slice(0, 30), email: `new-${suffix}@example.test`,
      password: 'first-time-password-123', firstName: 'First', lastName: 'User',
    }).expect(201);
    const account = await request.get('/api/paper-trading/account')
      .set('Authorization', `Bearer ${registration.body.token}`).expect(200);
    expect(account.body).toMatchObject({ custodyBoundary: 'PAPER_SIMULATION_ONLY', liveTradingEnabled: false });
    const openingEntries = await models.LedgerEntry.findAll({ where: { userId: registration.body.id } });
    expect(openingEntries).toHaveLength(2);
  });

  test('returns a structured deterministic rejection when market data is unavailable', async () => {
    const response = await request.post('/api/paper-trading/orders').set('Authorization', `Bearer ${token}`).send({
      clientOrderId: 'e2e-no-data', symbol: 'NONE', side: 'BUY', orderType: 'MARKET', quantity: 1,
    }).expect(422);
    expect(response.body).toMatchObject({ code: 'MARKET_DATA_MISSING' });
  });
});
