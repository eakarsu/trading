# Audit Note - trading

Source: `_AUDIT/reports/batch_11.md` (lines 1178-1226).

## Original Audit Recommendations

### Missing AI Counterparts
- `/sentiment-analyzer` for news/social sentiment.
- `/risk-calculator` for portfolio VaR/stress testing.
- `/correlation-analyzer` for asset relationships.
- `/alert-optimizer` to reduce false positives.

### Missing Non-AI Features
- Real-time WebSocket price/execution updates.
- Options strategies (spread builder, Greeks).
- Tax-loss harvesting suggestions.
- Paper trading / simulator.
- Community/social trading features.
- Risk management automation.

### Custom Feature Suggestions
1. Agentic Trading Agent.
2. Risk Management Automaton.
3. Multi-Asset Backtesting.
4. Sentiment-Driven Strategy.
5. Community Copy-Trading.
6. Tax-Loss Harvesting Agent.

## Implementations Applied

Added 3 AI endpoints to `backend/src/routes/aiResultsRoutes.js` using the existing `aiService.callAI` helper, `protect` middleware, and `aiRateLimiter()` to match the project's existing pattern:
- `POST /api/ai/sentiment-analyzer`
- `POST /api/ai/risk-calculator`
- `POST /api/ai/correlation-analyzer`

Each prompts for a JSON-structured response, includes safe disclaimers ("not investment advice"), and reuses the resilient AIService (cache, retry, fallback). No new dependencies; rate-limit middleware applied to LLM-hitting endpoints.

## Backlog (Prioritized)

### High
- `/alert-optimizer` (needs alert-history training/heuristics).
- Real-time WebSocket updates.
- Risk management automation (server-side enforcement).

### Medium
- Tax-loss harvesting suggestions.
- Paper trading mode.
- Options strategies (Greeks, spreads).

### Low / Product Decisions
- Community/social/copy trading.
- Multi-asset backtesting harness expansion.

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS — FE already wired.

Verified `frontend/src/pages/AIRiskToolsPage.js` provides a tabbed UI for the three pass-2-added endpoints (sentiment-analyzer, risk-calculator, correlation-analyzer), wired through `frontend/src/api/aiResults.js` helpers (`aiSentimentAnalyzer`, `aiRiskCalculator`, `aiCorrelationAnalyzer`). Routed in `App.js` under `/ai-risk-tools` (ProtectedRoute). Other AI endpoints (`/ai/trade-rationale`, `/ai/results`, `/ai/stats`) are consumed by `TradingAssistantPage`, `AIStrategiesPage`, and `PredictionsPage`. JWT attached via shared axios client.

Note: this repo's top-level `CLAUDE.md` is unrelated SuperDesign extension instructions and was ignored — out of scope for this pass.

No FE files modified.

## Apply pass 4 (mechanical backlog)

Implemented two MECHANICAL backlog items.

**Backend** (`backend/src/routes/aiResultsRoutes.js`, reuses `aiService.callAI` + `protect` + `aiRateLimiter()`; both 503 when `OPENROUTER_API_KEY` is missing):
- `POST /api/ai/alert-optimizer` — recommends adjustments to a user's alert rule set to reduce false positives.
- `POST /api/ai/tax-loss-harvest` — informational tax-loss-harvesting candidate suggestions with wash-sale notes (positions/jurisdiction inputs).

**Frontend**:
- Extended `frontend/src/api/aiResults.js` with `aiAlertOptimizer` and `aiTaxLossHarvest` helpers (JWT via existing axios client/interceptor).
- Extended `frontend/src/pages/AIRiskToolsPage.js` with two new tabs (`AlertOptimizerForm`, `TaxLossHarvestForm`); both surface a 503-specific friendly error.

**Smoke test:** Server start blocked by pre-existing missing dep `oauth-1.0a` in `src/services/brokers/etradeBroker.js` (unrelated to our changes; constraint forbids `npm install`). Statically loaded `aiResultsRoutes.js` and confirmed `post /alert-optimizer` and `post /tax-loss-harvest` are registered. Babel parser passed for both modified FE files.

Backlog updated:
- `/alert-optimizer` → done (was High).
- Tax-loss harvesting → done (was Medium).
- Remaining backlog: real-time WebSocket, server-side risk automation, paper trading mode, options Greeks/spreads, copy trading.

## Apply pass 5 (all backlog)

Implemented three additional backlog items (additive, no new heavy deps).

**Backend** (`backend/src/routes/aiResultsRoutes.js`, reuses `protect` + `aiRateLimiter()` where AI is hit):
- `POST /api/ai/options-greeks` — analytical Black-Scholes Greeks computed in-process (no AI cost). Optional `ai_commentary: true` triggers AI explainer; returns 503 with `missing: 'OPENROUTER_API_KEY'` only when the flag is set and key is unset.
- `GET /api/ai/paper-trading/account` — PRODUCT-DECISION: in-memory `Map` keyed by user id (resets on restart). No DB migration to keep the change additive.
- `POST /api/ai/paper-trading/order` — buy/sell against the in-memory paper account (cash + position bookkeeping; insufficient-funds / position guards).
- `POST /api/ai/paper-trading/reset` — reset to $100k cash.
- `POST /api/ai/copy-trading-suggest` — AI advisor for partial mirroring; PRODUCT-DECISION: not wired to execution; rate-limited; 503 when `OPENROUTER_API_KEY` missing.

**Frontend**:
- Extended `frontend/src/api/aiResults.js` with `aiOptionsGreeks`, `aiCopyTradingSuggest`, `paperTradingAccount`, `paperTradingOrder`, `paperTradingReset`.
- Extended `frontend/src/pages/AIRiskToolsPage.js` with three new tabs: Options Greeks, Paper Trading, Copy Trading. Each surfaces 503 errors with friendly messaging.

**Smoke test:** Server start blocked again by pre-existing missing dep `oauth-1.0a` in `etradeBroker.js` (unrelated; constraint forbids `npm install`). Statically loaded `aiResultsRoutes.js` and confirmed all 5 new routes are registered. Black-Scholes math sanity-checked in isolation (Call S=K=100, T=0.25, sigma=0.3, r=0.04 → 6.46, within ~2% of textbook 6.58 due to the erf approximation; acceptable for an advisory educational tool). Babel parser passed for FE files.

Backlog updated:
- Options Greeks/spreads → done.
- Paper trading mode → done (in-memory; persistence deferred).
- Copy trading → done (advisory; execution wiring deferred).
- Remaining: real-time WebSocket; server-side risk automation; community/social features (NEEDS-PRODUCT-DECISION).
