// === Batch 11 Gaps & Frontend Mounts ===
// Gap features (AI counterparts + Non-AI features) for trading.
// Lazy gap_features table (in-memory), OpenRouter via native fetch.

const express = require('express');
const router = express.Router();

const gapFeatures = new Map();

async function llm(systemPrompt, userMsg, maxTokens = 1400) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { const e = new Error('OPENROUTER_API_KEY not configured'); e.status = 503; throw e; }
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'trading Gap Features' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }], max_tokens: maxTokens }),
  });
  const data = await r.json();
  if (data && data.error) throw new Error(data.error.message || 'LLM error');
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

function track(slug, payload) {
  const list = gapFeatures.get(slug) || [];
  list.push({ at: new Date().toISOString(), payload });
  gapFeatures.set(slug, list);
}

function safe(res, e) { return res.status((e && e.status) || 500).json({ error: (e && e.message) || 'request failed' }); }

// ---- AI Gap Counterparts ----

router.post('/gap-sentiment-analyzer', async (req, res) => {
  try {
    const body = req.body || {};
    const sys = "You analyze news/social sentiment for a ticker.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('sentiment-analyzer', { keys: Object.keys(body) });
    res.json({ sentiment: out });
  } catch (e) { safe(res, e); }
});

router.post('/gap-risk-calculator', async (req, res) => {
  try {
    const body = req.body || {};
    const sys = "You compute portfolio Value-at-Risk and stress test scenarios.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('risk-calculator', { keys: Object.keys(body) });
    res.json({ risk: out });
  } catch (e) { safe(res, e); }
});

router.post('/gap-correlation-analyzer', async (req, res) => {
  try {
    const body = req.body || {};
    const sys = "You analyze correlations across portfolio holdings.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('correlation-analyzer', { keys: Object.keys(body) });
    res.json({ correlations: out });
  } catch (e) { safe(res, e); }
});

router.post('/gap-alert-optimizer', async (req, res) => {
  try {
    const body = req.body || {};
    const sys = "You tune alert thresholds to reduce false positives.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('alert-optimizer', { keys: Object.keys(body) });
    res.json({ tuning: out });
  } catch (e) { safe(res, e); }
});

router.post('/gap-research-summarizer', async (req, res) => {
  try {
    const body = req.body || {};
    const sys = "You summarize 10-K/Q filings and earnings calls.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('research-summarizer', { keys: Object.keys(body) });
    res.json({ summary: out });
  } catch (e) { safe(res, e); }
});

// ---- Non-AI Gap Features ----

router.post('/gap-realtime-websocket', (req, res) => {
  const body = req.body || {};
  const record = { id: 'realtime-websocket_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('realtime-websocket', record);
  res.json({ event: record, status: 'recorded' });
});

router.post('/gap-options-strategies', (req, res) => {
  const body = req.body || {};
  const record = { id: 'options-strategies_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('options-strategies', record);
  res.json({ strategy: record, status: 'recorded' });
});

router.post('/gap-tax-loss-harvesting', (req, res) => {
  const body = req.body || {};
  const record = { id: 'tax-loss-harvesting_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('tax-loss-harvesting', record);
  res.json({ suggestions: record, status: 'recorded' });
});

router.post('/gap-paper-trading-sim', (req, res) => {
  const body = req.body || {};
  const record = { id: 'paper-trading-sim_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('paper-trading-sim', record);
  res.json({ order: record, status: 'recorded' });
});

router.post('/gap-social-trading', (req, res) => {
  const body = req.body || {};
  const record = { id: 'social-trading_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('social-trading', record);
  res.json({ follow: record, status: 'recorded' });
});

router.post('/gap-risk-management-rules', (req, res) => {
  const body = req.body || {};
  const record = { id: 'risk-management-rules_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('risk-management-rules', record);
  res.json({ rule: record, status: 'recorded' });
});

router.get('/gap-features/_audit', (req, res) => {
  const rows = [];
  for (const [k, v] of gapFeatures.entries()) rows.push({ feature: k, events: v.length });
  res.json({ rows });
});

module.exports = router;
