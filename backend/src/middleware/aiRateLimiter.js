/**
 * aiRateLimiter — per-user (or IP) hourly limiter for AI endpoints.
 *
 * Default: 20 requests / hour / user. Sliding-window in-memory store.
 * For multi-instance deployments, swap the in-memory map for Redis.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_LIMIT = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '20', 10);

const buckets = new Map(); // key -> array of timestamps

function pruneOld(timestamps, now) {
  // Mutates in-place: remove timestamps older than WINDOW_MS
  while (timestamps.length > 0 && now - timestamps[0] > WINDOW_MS) {
    timestamps.shift();
  }
}

function aiRateLimiter({ limit = DEFAULT_LIMIT, keyFn } = {}) {
  return function (req, res, next) {
    const key = keyFn
      ? keyFn(req)
      : (req.user && req.user.id) || req.ip || 'anonymous';

    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }
    pruneOld(bucket, now);

    if (bucket.length >= limit) {
      const retryAfterMs = WINDOW_MS - (now - bucket[0]);
      res.set('X-RateLimit-Limit', String(limit));
      res.set('X-RateLimit-Remaining', '0');
      res.set('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `AI rate limit exceeded: ${limit}/hour. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`,
        retryAfter: Math.ceil(retryAfterMs / 1000)
      });
    }

    bucket.push(now);
    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.length)));
    next();
  };
}

// Test-only helper to reset state between tests
function _resetRateLimiter() {
  buckets.clear();
}

module.exports = { aiRateLimiter, _resetRateLimiter };
