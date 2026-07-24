const router = require('express').Router();
const { randomUUID } = require('crypto');
const { protect } = require('../middleware/authMiddleware');
const { sequelize } = require('../config/database');

router.post('/recommendation', protect, async (req, res, next) => {
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt || prompt.length > 4000) return res.status(400).json({ code: 'INVALID_PROMPT', message: 'Prompt must contain 1-4000 characters' });
    const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
    const model = String(process.env.OPENROUTER_MODEL || '').trim();
    const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
    if (!apiKey || !model || !baseUrl) return res.status(503).json({ code: 'AI_NOT_CONFIGURED', message: 'AI provider is not configured' });
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Give concise educational paper-trading analysis. Do not present financial advice or enable live execution.' }, { role: 'user', content: prompt }], max_tokens: 180 }),
      signal: AbortSignal.timeout(45000),
    });
    const payload = await response.json().catch(() => ({}));
    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !payload.id || !content) throw Object.assign(new Error(`OpenRouter request failed with HTTP ${response.status}`), { code: 'AI_PROVIDER_FAILURE' });
    const providerRequestId = String(payload.id);
    const providerModel = String(payload.model || model);
    const [rows] = await sequelize.query(
      `INSERT INTO ai_provider_receipts (id,"userId",provider,"providerRequestId",model,prompt,content,"createdAt","updatedAt")
       VALUES (:id,:userId,'openrouter',:providerRequestId,:model,:prompt,:content,NOW(),NOW())
       RETURNING id,provider,"providerRequestId",model,"createdAt"`,
      { replacements: { id: randomUUID(), userId: req.user.id, providerRequestId, model: providerModel, prompt, content } },
    );
    res.json({ content, receipt: rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;
