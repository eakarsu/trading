const { aiRateLimiter, _resetRateLimiter } = require('../src/middleware/aiRateLimiter');

function mkRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    set(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; }
  };
}

beforeEach(() => _resetRateLimiter());

describe('aiRateLimiter', () => {
  test('allows requests under the limit', () => {
    const mw = aiRateLimiter({ limit: 3 });
    const req = { user: { id: 'u1' } };
    let calls = 0;
    for (let i = 0; i < 3; i++) {
      const res = mkRes();
      mw(req, res, () => calls++);
      expect(res.statusCode).toBe(200);
    }
    expect(calls).toBe(3);
  });

  test('blocks the 21st request in default 20/hr config', () => {
    const mw = aiRateLimiter({ limit: 20 });
    const req = { user: { id: 'u-burst' } };
    for (let i = 0; i < 20; i++) mw(req, mkRes(), () => {});
    const res = mkRes();
    let nextCalled = false;
    mw(req, res, () => { nextCalled = true; });
    expect(res.statusCode).toBe(429);
    expect(nextCalled).toBe(false);
    expect(res.body.error).toMatch(/Too Many Requests/);
    expect(res.headers['Retry-After']).toBeDefined();
  });

  test('separate keys do not share buckets', () => {
    const mw = aiRateLimiter({ limit: 1 });
    mw({ user: { id: 'a' } }, mkRes(), () => {});
    const res = mkRes();
    let nextCalled = false;
    mw({ user: { id: 'b' } }, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  test('falls back to req.ip when no user', () => {
    const mw = aiRateLimiter({ limit: 1 });
    mw({ ip: '1.1.1.1' }, mkRes(), () => {});
    const res = mkRes();
    mw({ ip: '1.1.1.1' }, res, () => {});
    expect(res.statusCode).toBe(429);
  });
});
