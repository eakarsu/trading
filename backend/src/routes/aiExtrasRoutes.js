// AI Extras — Custom Feature Suggestions (batch 11)
// Agentic Trading Agent, Risk Management Automaton, Multi-Asset Backtesting,
// Sentiment-Driven Strategy, Community Copy-Trading, Tax-Loss Harvesting Agent (deeper).

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const aiService = require('../utils/aiService');

// 1) Agentic Trading Agent — multi-step decision loop.
router.post('/agentic-trader', protect, aiRateLimiter(), async (req, res) => {
  try {
    const { symbol, strategy = 'momentum', signals = {}, riskLimits = {} } = req.body || {};
    if (!symbol) return res.status(400).json({ message: 'symbol required' });
    const sys = 'You are an agentic trading decision engine. Given strategy + signals + risk limits, decide: action (buy/sell/hold), size as % of allocation, stop-loss, take-profit, confidence 0-1, and rationale. NEVER execute trades automatically — this is advisory. Output JSON.';
    const prompt = `Symbol: ${symbol}\nStrategy: ${strategy}\nSignals: ${JSON.stringify(signals).slice(0, 3000)}\nRisk limits: ${JSON.stringify(riskLimits)}`;
    const raw = await aiService.callAI(prompt, { systemPrompt: sys, temperature: 0.3, maxTokens: 900 });
    res.json({ raw, advisoryOnly: true, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ message: 'agentic-trader failed', detail: err.message });
  }
});

// 2) Risk Management Automaton — monitor portfolio + enforce limits + suggest hedges.
router.post('/risk-automaton', protect, aiRateLimiter(), async (req, res) => {
  try {
    const { positions = [], hardLimits = {}, marketRegime = 'normal' } = req.body || {};
    if (!Array.isArray(positions) || positions.length === 0) return res.status(400).json({ message: 'positions[] required' });
    const breaches = [];
    const totalNotional = positions.reduce((s, p) => s + Math.abs(Number(p.notional || p.value || 0)), 0);
    if (hardLimits.maxNotionalUSD && totalNotional > hardLimits.maxNotionalUSD) {
      breaches.push({ rule: 'maxNotionalUSD', observed: totalNotional, limit: hardLimits.maxNotionalUSD });
    }
    const concentration = positions.map((p) => ({ symbol: p.symbol, weight: Math.abs(Number(p.notional || p.value || 0)) / Math.max(1, totalNotional) }));
    const tooConcentrated = concentration.filter((c) => hardLimits.maxConcentrationPct && c.weight > hardLimits.maxConcentrationPct);
    if (tooConcentrated.length) breaches.push({ rule: 'maxConcentrationPct', observed: tooConcentrated });

    const sys = 'You are a portfolio risk automaton. From positions, hard limits, breaches, and market regime, propose hedges (instrument + sizing) and rebalance steps. Output JSON: { hedges, rebalanceSteps, urgency }.';
    const prompt = `Positions: ${JSON.stringify(positions.slice(0, 40))}\nRegime: ${marketRegime}\nBreaches: ${JSON.stringify(breaches)}`;
    const raw = await aiService.callAI(prompt, { systemPrompt: sys, temperature: 0.3, maxTokens: 1200 });
    res.json({ breaches, totalNotional, concentration, raw });
  } catch (err) {
    res.status(500).json({ message: 'risk-automaton failed', detail: err.message });
  }
});

// 3) Multi-Asset Backtesting — replay strategies across assets/regimes.
router.post('/multi-asset-backtest', protect, aiRateLimiter(), async (req, res) => {
  try {
    const { strategies = [], assets = [], horizon = '5y', crashScenario } = req.body || {};
    if (!strategies.length || !assets.length) return res.status(400).json({ message: 'strategies[] and assets[] required' });
    const sys = 'You are a backtesting analyst. For each (strategy, asset) pair, narrate expected behavior over the horizon, including stress in the named crash scenario. Output JSON: { matrix: [{ strategy, asset, expectedCAGR, maxDrawdown, sharpe, comments }], summary }. Note: this is qualitative reasoning, not a real Monte Carlo run.';
    const prompt = `Strategies: ${JSON.stringify(strategies)}\nAssets: ${JSON.stringify(assets)}\nHorizon: ${horizon}\nCrashScenario: ${crashScenario || 'none'}`;
    const raw = await aiService.callAI(prompt, { systemPrompt: sys, temperature: 0.3, maxTokens: 1800 });
    res.json({ raw, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ message: 'multi-asset-backtest failed', detail: err.message });
  }
});

// 4) Sentiment-Driven Strategy — adjust position sizes from sentiment swings.
// TODO: configure credentials — TWITTER_BEARER_TOKEN, REDDIT_CLIENT_ID for live ingest.
router.post('/sentiment-strategy', protect, aiRateLimiter(), async (req, res) => {
  try {
    const { symbols = [], horizonDays = 5, sentimentFeed = [] } = req.body || {};
    if (!symbols.length) return res.status(400).json({ message: 'symbols[] required' });
    const sys = 'You are a sentiment-driven portfolio assistant. From symbol-level sentiment + recent swings, recommend size adjustments (-100%..+100% delta to baseline), stop-loss adjustments, and entry timing. Output JSON.';
    const prompt = `Symbols: ${JSON.stringify(symbols)}\nHorizon: ${horizonDays}d\nSentiment feed: ${JSON.stringify(sentimentFeed).slice(0, 4000)}`;
    const raw = await aiService.callAI(prompt, { systemPrompt: sys, temperature: 0.3, maxTokens: 1200 });
    res.json({ raw, feedConfigured: !!(process.env.TWITTER_BEARER_TOKEN || process.env.REDDIT_CLIENT_ID) });
  } catch (err) {
    res.status(500).json({ message: 'sentiment-strategy failed', detail: err.message });
  }
});

// 5) Community Copy-Trading — publish + subscribe strategies; commission share.
const publishedStrategies = new Map();
const subscriptions = new Map();
router.post('/copy-trading/publish', protect, async (req, res) => {
  const { authorId, strategyName, description, commissionPct = 0.1 } = req.body || {};
  if (!authorId || !strategyName) return res.status(400).json({ message: 'authorId and strategyName required' });
  const id = `strat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  publishedStrategies.set(id, { id, authorId, strategyName, description, commissionPct, publishedAt: new Date().toISOString(), subscribers: 0 });
  res.json({ strategy: publishedStrategies.get(id) });
});
router.post('/copy-trading/subscribe', protect, async (req, res) => {
  const { subscriberId, strategyId, allocationUSD } = req.body || {};
  const s = publishedStrategies.get(strategyId);
  if (!s) return res.status(404).json({ message: 'strategy not found' });
  const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  subscriptions.set(subId, { subId, subscriberId, strategyId, allocationUSD, subscribedAt: new Date().toISOString() });
  s.subscribers += 1;
  res.json({ subscription: subscriptions.get(subId) });
});
router.get('/copy-trading/leaderboard', protect, (_req, res) => {
  const all = [...publishedStrategies.values()].sort((a, b) => b.subscribers - a.subscribers).slice(0, 20);
  res.json({ leaderboard: all });
});

// 6) Tax-Loss Harvesting Agent — identify losses + replacements + tax impact.
router.post('/tax-loss-harvest-agent', protect, aiRateLimiter(), async (req, res) => {
  try {
    const { positions = [], washSaleWindowDays = 30, taxBracketUSD = 0.32, jurisdiction = 'US' } = req.body || {};
    if (!positions.length) return res.status(400).json({ message: 'positions[] required' });
    const sys = `You are a tax-loss harvesting strategist (jurisdiction: ${jurisdiction}). Identify losing positions worth harvesting. Suggest substitutes that maintain factor exposure while respecting the ${washSaleWindowDays}-day wash sale window. Estimate tax savings using marginal bracket. Output JSON: { harvestable: [...], substitutes: [...], estTaxSavingsUSD, warnings }.`;
    const prompt = `Positions: ${JSON.stringify(positions.slice(0, 40))}\nBracket: ${taxBracketUSD}\nWindow: ${washSaleWindowDays}d`;
    const raw = await aiService.callAI(prompt, { systemPrompt: sys, temperature: 0.3, maxTokens: 1500 });
    res.json({ raw, jurisdiction });
  } catch (err) {
    res.status(500).json({ message: 'tax-loss-harvest-agent failed', detail: err.message });
  }
});

module.exports = router;
