/**
 * AI Results controller — paginated list, get-by-id, post-trade rationale.
 *
 * Implements:
 *  - Audit proposal #1 (Strategy explanation + post-trade journal):
 *    POST /api/ai/trade-rationale generates and persists an LLM-written
 *    rationale for a given trade/strategy event.
 *  - Generic paginated AI-result history endpoint scoped to req.user.id.
 */

const { AIResult, ActiveStrategy } = require('../models');
const aiService = require('../utils/aiService');
const { parseAIJson } = require('../utils/parseAIJson');

const MAX_PAGE_SIZE = 100;

// GET /api/ai/results?page=1&pageSize=20&feature=trade_rationale&symbol=AAPL
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const where = { userId: req.user.id };
    if (req.query.feature) where.feature = String(req.query.feature);
    if (req.query.symbol) where.symbol = String(req.query.symbol).toUpperCase();

    const { rows, count } = await AIResult.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    return res.json({
      data: rows,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (err) {
    console.error('[aiResults.list] error:', err);
    return res.status(500).json({ message: 'Failed to fetch AI results' });
  }
};

// GET /api/ai/results/:id
exports.getById = async (req, res) => {
  try {
    const row = await AIResult.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ message: 'AI result not found' });
    return res.json(row);
  } catch (err) {
    console.error('[aiResults.getById] error:', err);
    return res.status(500).json({ message: 'Failed to fetch AI result' });
  }
};

// GET /api/ai/stats — request/error/cache stats
exports.stats = async (req, res) => {
  return res.json(aiService.getStats());
};

/**
 * POST /api/ai/trade-rationale
 *  body: { strategyId?, symbol, side, qty, price, signals: {rsi,macd,...}, marketContext? }
 *  Generates an AI-written rationale for the trade and persists it as an AIResult
 *  with feature="trade_rationale". Designed for the post-trade journal UI.
 */
exports.tradeRationale = async (req, res) => {
  const start = Date.now();
  try {
    const { strategyId, symbol, side, qty, price, signals = {}, marketContext = {} } = req.body || {};
    if (!symbol || !side || qty == null || price == null) {
      return res.status(400).json({ message: 'symbol, side, qty, price are required' });
    }

    const prompt = `You are a senior quant analyst. Explain the following trade in plain English and JSON.
Trade:
- symbol: ${symbol}
- side: ${side}
- qty: ${qty}
- price: ${price}

Signals fired: ${JSON.stringify(signals)}
Market context: ${JSON.stringify(marketContext)}

Return strict JSON:
{
  "summary": "1-2 sentence rationale",
  "primary_signals": ["RSI", "MACD", ...],
  "confidence": 0.0,
  "risks": ["..."],
  "alt_action": "what a more conservative analyst might do"
}`;

    let parsed = null;
    let raw = null;
    let model = aiService.defaultModel;
    let errMsg = null;

    try {
      const out = await aiService.callAIJson(prompt, {
        systemPrompt: 'You are an expert quantitative trading analyst. Always respond in valid JSON.',
        temperature: 0.3,
        maxTokens: 600
      });
      raw = out.raw;
      parsed = out.parsed || parseAIJson(raw, { fallback: { summary: raw } });
    } catch (e) {
      errMsg = e.message;
      parsed = {
        summary: `Trade rationale unavailable (AI error). Signals: ${Object.keys(signals).join(', ')}`,
        primary_signals: Object.keys(signals),
        confidence: 0,
        risks: ['AI service unavailable'],
        alt_action: 'Wait for confirmation from at least one additional indicator.'
      };
    }

    const record = await AIResult.create({
      userId: req.user.id,
      feature: 'trade_rationale',
      symbol: String(symbol).toUpperCase(),
      model,
      latencyMs: Date.now() - start,
      cacheHit: false,
      ai_results: {
        ...parsed,
        trade: { strategyId, symbol, side, qty, price },
        signals
      },
      rawResponse: raw,
      error: errMsg
    });

    return res.status(201).json(record);
  } catch (err) {
    console.error('[aiResults.tradeRationale] error:', err);
    return res.status(500).json({ message: 'Failed to generate trade rationale' });
  }
};
