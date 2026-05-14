const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const ctrl = require('../controllers/aiResultsController');
const aiService = require('../utils/aiService');

// Read endpoints (no AI cost)
router.get('/results', protect, ctrl.list);
router.get('/results/:id', protect, ctrl.getById);
router.get('/stats', protect, ctrl.stats);

// Write endpoints that hit the LLM — rate-limited to 20/hr/user
router.post('/trade-rationale', protect, aiRateLimiter(), ctrl.tradeRationale);

// Sentiment Analyzer - assess news/social sentiment for a symbol or theme
router.post('/sentiment-analyzer', protect, aiRateLimiter(), async (req, res) => {
  try {
    const { symbol, headlines, socialSnippets } = req.body || {};
    if (!symbol && !(headlines || []).length) {
      return res.status(400).json({ message: 'symbol or headlines is required' });
    }
    const systemPrompt = 'You are a markets sentiment analyst. Output structured JSON: { sentimentScore (-1..1), label (bearish/neutral/bullish), drivers, riskFlags, summary }. Avoid making investment recommendations.';
    const prompt = `Symbol: ${symbol || 'unspecified'}\nHeadlines (${(headlines || []).length}):\n${JSON.stringify((headlines || []).slice(0, 30), null, 2)}\nSocial Snippets (${(socialSnippets || []).length}):\n${JSON.stringify((socialSnippets || []).slice(0, 30), null, 2)}\n\nReturn JSON only.`;
    const raw = await aiService.callAI(prompt, { systemPrompt, temperature: 0.3, maxTokens: 800 });
    res.json({ raw, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[sentiment-analyzer] error:', err);
    res.status(500).json({ message: 'Failed to analyze sentiment' });
  }
});

// Risk Calculator - rough portfolio risk/VaR style narrative analysis
router.post('/risk-calculator', protect, aiRateLimiter(), async (req, res) => {
  try {
    const { positions, marketContext, horizonDays } = req.body || {};
    if (!Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ message: 'positions (array) is required' });
    }
    const systemPrompt = 'You are a portfolio risk analyst. Provide a structured narrative + JSON summary of portfolio risk: concentration, sector exposure, volatility-like assessment, drawdown scenarios, suggested hedges. Note this is informational only, not investment advice. Output JSON: { concentration, sectorExposure, scenarioAnalysis, hedgingIdeas, overallRiskLevel, notes }.';
    const prompt = `Positions:\n${JSON.stringify(positions.slice(0, 50), null, 2)}\nMarket Context:\n${JSON.stringify(marketContext || {}, null, 2)}\nHorizon: ${horizonDays || 30} days\n\nReturn JSON only.`;
    const raw = await aiService.callAI(prompt, { systemPrompt, temperature: 0.3, maxTokens: 1200 });
    res.json({ raw, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[risk-calculator] error:', err);
    res.status(500).json({ message: 'Failed to calculate risk' });
  }
});

// Correlation Analyzer - relationships between provided assets/positions
router.post('/correlation-analyzer', protect, aiRateLimiter(), async (req, res) => {
  try {
    const { assets, period } = req.body || {};
    if (!Array.isArray(assets) || assets.length < 2) {
      return res.status(400).json({ message: 'assets (array of at least 2) is required' });
    }
    const systemPrompt = 'You are a quant research assistant. Given a set of assets (and optional historical samples), describe likely correlation relationships, common factor exposures, and diversification implications. State assumptions and that you do not have live market data. Output JSON: { likelyCorrelations: [{a,b,strength,reason}], commonFactors, diversificationGaps, suggestedAdditions, notes }.';
    const prompt = `Period: ${period || 'last 6 months'}\nAssets:\n${JSON.stringify(assets, null, 2)}\n\nReturn JSON only.`;
    const raw = await aiService.callAI(prompt, { systemPrompt, temperature: 0.3, maxTokens: 1200 });
    res.json({ raw, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[correlation-analyzer] error:', err);
    res.status(500).json({ message: 'Failed to analyze correlations' });
  }
});

// Alert Optimizer - reduce false positives in user alert configurations
router.post('/alert-optimizer', protect, aiRateLimiter(), async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ message: 'AI service not configured (missing OPENROUTER_API_KEY)' });
    }
    const { alerts, recentTriggers, falsePositiveExamples } = req.body || {};
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return res.status(400).json({ message: 'alerts (array) is required' });
    }
    const systemPrompt = 'You are an alert-quality engineer for a trading platform. Your job is to reduce noisy/false-positive alerts while preserving signal. Return strict JSON: { recommendations: [{ alertId, action: "tighten"|"loosen"|"merge"|"remove"|"keep", suggestedChanges: object, expectedFalsePositiveReductionPct: number, rationale: string }], summary: string, riskNotes: string }. Informational only.';
    const prompt = `User alert configurations (${alerts.length}):\n${JSON.stringify(alerts.slice(0, 50), null, 2)}\n\nRecent triggers (sample): ${JSON.stringify((recentTriggers || []).slice(0, 50), null, 2)}\nUser-flagged false positives: ${JSON.stringify((falsePositiveExamples || []).slice(0, 30), null, 2)}\n\nReturn JSON only.`;
    const raw = await aiService.callAI(prompt, { systemPrompt, temperature: 0.3, maxTokens: 1200 });
    res.json({ raw, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[alert-optimizer] error:', err);
    res.status(500).json({ message: 'Failed to optimize alerts' });
  }
});

// Tax-Loss Harvest - recommend tax-loss-harvesting opportunities (informational)
router.post('/tax-loss-harvest', protect, aiRateLimiter(), async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ message: 'AI service not configured (missing OPENROUTER_API_KEY)' });
    }
    const { positions, ytdRealizedGains, jurisdiction, washSaleSensitivity } = req.body || {};
    if (!Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ message: 'positions (array) is required' });
    }
    const systemPrompt = 'You are a tax-aware portfolio analyst. Suggest tax-loss-harvesting candidates and replacement ideas. Respect wash-sale rules where indicated. Output strict JSON: { harvestCandidates: [{ symbol, unrealizedLoss, suggestedReplacement, washSaleRiskNotes, projectedTaxBenefit }], summary, disclaimers }. This is informational, not tax or investment advice.';
    const prompt = `Positions:\n${JSON.stringify(positions.slice(0, 100), null, 2)}\nYTD realized gains: ${JSON.stringify(ytdRealizedGains || 0)}\nJurisdiction: ${jurisdiction || 'US'}\nWash-sale sensitivity: ${washSaleSensitivity || 'standard'}\n\nReturn JSON only.`;
    const raw = await aiService.callAI(prompt, { systemPrompt, temperature: 0.3, maxTokens: 1500 });
    res.json({ raw, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[tax-loss-harvest] error:', err);
    res.status(500).json({ message: 'Failed to compute tax-loss-harvest suggestions' });
  }
});

// Options Analyzer — computes Black-Scholes Greeks locally (no AI cost) plus optional AI commentary.
// PRODUCT-DECISION: Greeks are computed in-process (analytical Black-Scholes for European options).
// Volatility & risk-free rate must be supplied by client; no live market-data feed integration.
// AI commentary is optional and only invoked when OPENROUTER_API_KEY is present (else 503).
router.post('/options-greeks', protect, async (req, res) => {
  try {
    const {
      spot, strike, time_to_expiry_years, volatility, risk_free_rate,
      option_type, dividend_yield, ai_commentary,
    } = req.body || {};
    const S = parseFloat(spot), K = parseFloat(strike), T = parseFloat(time_to_expiry_years);
    const sigma = parseFloat(volatility), r = parseFloat(risk_free_rate);
    const q = Number.isFinite(parseFloat(dividend_yield)) ? parseFloat(dividend_yield) : 0;
    const type = (option_type || 'call').toLowerCase();
    if (![S, K, T, sigma, r].every(Number.isFinite) || T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
      return res.status(400).json({ message: 'spot, strike, time_to_expiry_years, volatility, risk_free_rate are required and must be > 0' });
    }
    if (!['call', 'put'].includes(type)) return res.status(400).json({ message: "option_type must be 'call' or 'put'" });

    // Standard normal pdf/cdf
    const pdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    const cdf = (x) => {
      // Abramowitz & Stegun 7.1.26
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
      const sign = x < 0 ? -1 : 1;
      const ax = Math.abs(x) / Math.sqrt(2);
      const t = 1.0 / (1.0 + p * ax);
      const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
      return 0.5 * (1.0 + sign * y);
    };

    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    const Nd1 = cdf(d1), Nd2 = cdf(d2);

    let price, delta, theta;
    if (type === 'call') {
      price = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2;
      delta = Math.exp(-q * T) * Nd1;
      theta = -(S * Math.exp(-q * T) * pdf(d1) * sigma) / (2 * Math.sqrt(T))
              - r * K * Math.exp(-r * T) * Nd2 + q * S * Math.exp(-q * T) * Nd1;
    } else {
      price = K * Math.exp(-r * T) * cdf(-d2) - S * Math.exp(-q * T) * cdf(-d1);
      delta = -Math.exp(-q * T) * cdf(-d1);
      theta = -(S * Math.exp(-q * T) * pdf(d1) * sigma) / (2 * Math.sqrt(T))
              + r * K * Math.exp(-r * T) * cdf(-d2) - q * S * Math.exp(-q * T) * cdf(-d1);
    }
    const gamma = (Math.exp(-q * T) * pdf(d1)) / (S * sigma * Math.sqrt(T));
    const vega = S * Math.exp(-q * T) * pdf(d1) * Math.sqrt(T) / 100; // per 1% vol change
    const rho = (type === 'call' ? 1 : -1) * K * T * Math.exp(-r * T) * (type === 'call' ? Nd2 : cdf(-d2)) / 100;
    const greeks = {
      price: round(price), delta: round(delta), gamma: round(gamma),
      vega: round(vega), theta: round(theta / 365), // per-day
      rho: round(rho),
    };

    let commentary = null;
    if (ai_commentary) {
      if (!process.env.OPENROUTER_API_KEY) {
        return res.status(503).json({ message: 'AI commentary unavailable (missing OPENROUTER_API_KEY)', greeks });
      }
      const systemPrompt = 'You are an options strategist. Given Black-Scholes inputs and computed Greeks, explain the risk profile in plain English. Educational only, not investment advice. Output strict JSON: { riskProfile, hedgingNotes, scenarioMoves, disclaimers }.';
      const prompt = `Inputs: ${JSON.stringify({ S, K, T, sigma, r, q, type })}\nGreeks: ${JSON.stringify(greeks)}\n\nReturn JSON only.`;
      try {
        commentary = await aiService.callAI(prompt, { systemPrompt, temperature: 0.3, maxTokens: 800 });
      } catch (e) { commentary = null; }
    }

    res.json({ greeks, inputs: { S, K, T, sigma, r, q, type }, commentary, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[options-greeks] error:', err);
    res.status(500).json({ message: 'Failed to compute options Greeks' });
  }
});

function round(x) { return Math.round(x * 1e6) / 1e6; }

// Paper Trading — in-memory simulator. PRODUCT-DECISION: in-process Map keyed by user id.
// Resets on server restart. No persistence to keep change additive (matches "in-memory stubs"
// guidance). Real persistence would need a `paper_accounts` table + migration.
const paperAccounts = new Map();
function getPaperAccount(userId) {
  if (!paperAccounts.has(userId)) {
    paperAccounts.set(userId, { cash: 100000, positions: {}, history: [], createdAt: new Date().toISOString() });
  }
  return paperAccounts.get(userId);
}

router.get('/paper-trading/account', protect, (req, res) => {
  const acct = getPaperAccount(req.user.id);
  res.json({ account: acct });
});

router.post('/paper-trading/order', protect, (req, res) => {
  try {
    const { symbol, side, quantity, price } = req.body || {};
    if (!symbol || !['buy', 'sell'].includes((side || '').toLowerCase())) {
      return res.status(400).json({ message: "symbol and side ('buy'|'sell') required" });
    }
    const qty = parseInt(quantity);
    const px = parseFloat(price);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(px) || px <= 0) {
      return res.status(400).json({ message: 'quantity and price must be > 0' });
    }
    const acct = getPaperAccount(req.user.id);
    const sideLower = side.toLowerCase();
    const cost = qty * px;
    if (sideLower === 'buy') {
      if (acct.cash < cost) return res.status(400).json({ message: 'Insufficient paper cash' });
      acct.cash -= cost;
      const cur = acct.positions[symbol] || { qty: 0, avg_cost: 0 };
      const newQty = cur.qty + qty;
      acct.positions[symbol] = { qty: newQty, avg_cost: ((cur.qty * cur.avg_cost) + cost) / newQty };
    } else {
      const cur = acct.positions[symbol];
      if (!cur || cur.qty < qty) return res.status(400).json({ message: 'Insufficient paper position' });
      acct.cash += cost;
      cur.qty -= qty;
      if (cur.qty === 0) delete acct.positions[symbol];
    }
    const fill = { id: acct.history.length + 1, symbol: symbol.toUpperCase(), side: sideLower, qty, price: px, ts: new Date().toISOString() };
    acct.history.unshift(fill);
    res.json({ fill, account: acct });
  } catch (err) {
    console.error('[paper-trading/order] error:', err);
    res.status(500).json({ message: 'Failed to place paper order' });
  }
});

router.post('/paper-trading/reset', protect, (req, res) => {
  paperAccounts.delete(req.user.id);
  const acct = getPaperAccount(req.user.id);
  res.json({ message: 'Paper account reset', account: acct });
});

// Copy-Trading suggestions (advisory, AI). PRODUCT-DECISION: real "follow another trader"
// flow needs explicit consent + execution wiring; this endpoint just suggests adjustments
// to mirror a target trader's style based on described characteristics + user constraints.
router.post('/copy-trading-suggest', protect, aiRateLimiter(), async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ message: 'AI service not configured', missing: 'OPENROUTER_API_KEY' });
    }
    const { target_trader_profile, my_positions, my_constraints } = req.body || {};
    if (!target_trader_profile) return res.status(400).json({ message: 'target_trader_profile is required' });
    const systemPrompt = 'You are a portfolio coach. Suggest how to *partially* mirror a target trader strategy while respecting the user constraints. Educational only, not investment advice. Output strict JSON: { mirroringPlan: [{ action, symbol, rationale, sizing_pct, risk_note }], divergences, suitabilityScore, disclaimers }.';
    const prompt = `Target Trader Profile:\n${JSON.stringify(target_trader_profile, null, 2)}\nMy Positions:\n${JSON.stringify((my_positions || []).slice(0, 50), null, 2)}\nMy Constraints:\n${JSON.stringify(my_constraints || {}, null, 2)}\n\nReturn JSON only.`;
    const raw = await aiService.callAI(prompt, { systemPrompt, temperature: 0.4, maxTokens: 1200 });
    res.json({ raw, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[copy-trading-suggest] error:', err);
    res.status(500).json({ message: 'Failed to generate copy-trading suggestion' });
  }
});

module.exports = router;
