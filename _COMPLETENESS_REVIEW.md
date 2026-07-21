# Completeness Review: trading

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 247 project files (141 source files), 4 manifest(s), 2 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished finance/trading application, not just an empty scaffold. Inspection found 141 source files across `frontend/`, `backend/`, `mongo-data/`, `database-exports/` using Next.js, React, Express, Python; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- Only 2 test-like file(s) were found, too little evidence for the breadth of the implemented workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Integrate licensed market/bank/broker data with idempotent ingestion, reconciliation, and explicit source timestamps.
2. Add deterministic exposure, liquidity, loss, approval, and kill-switch limits outside any LLM decision path.
3. Implement ledger-grade transaction history, corporate-action/error correction, custody boundaries, and audit exports.
4. Backtest and paper-trade realistic failure, stale-data, duplicate-order, and partial-fill scenarios before live use.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Weak/fallback secret patterns can permit forged sessions or accidental insecure deployments.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.

## Evidence inspected

- `README.md`
- `IMPLEMENTATION_PLAN.md:39`
- `frontend/src/App.js:44`
- `backend/server.js`
- `backend/__tests__/aiRateLimiter.test.js`
- `package.json`

## Recommended next action

Choose one real finance/trading journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-20)

Implemented the supported journey as a hard-bounded paper-trading release:

- Added licensed-source allowlisting, source-record idempotency/conflict handling, explicit source timestamps, corrections, and provider-batch reconciliation.
- Added persistent paper accounts, orders, fills, positions, per-snapshot consumed liquidity, resting/partial fills, daily loss sessions, deterministic exposure/notional/cash/position/staleness/liquidity checks, and a user/admin kill switch outside all AI paths.
- Added opening-balance and fill double-entry accounting, realized P&L, append-only database enforcement, linked reversal-and-repost corrections, split/dividend processing, cash/securities/order reconciliation, hash-chained audit events, and checksummed audit exports under a `PAPER_*` custody namespace.
- Added chronological historical scenario replay for duplicate, stale, exhausted-liquidity, partial-fill, and kill-switch cases. Live trading, legacy product routes, and experimental AI routes are refused by this release; the frontend exposes only the supported paper journey and profile/authentication paths.
- Added an idempotent migration runner, PostgreSQL migration, readiness checks, migration-gated/read-only containers, strict production runtime validation, explicit CORS, safe startup/shutdown, operational/data-contract/security documentation, and CI for migration up/down/up, unit, integration, authenticated API end-to-end, dependency audits, secret scanning, frontend build, and production image build.
- Removed tracked credential-like files and unsafe token/seed/sample helpers (`alpace_keys.xtt`, `apaca.txt`, `users.txt`, `update-token.js`, `backend/generate-test-token.js`, `backend/seed.js`, and `backend/saveSampleMarketData.js`). A full-history scan identifies a legacy API-key example and JWT in commit `2355c54`; the owner must rotate/revoke them and clean history before treating repository history as credential-safe. Ignored local environment files were deliberately left untouched; their secrets must meet the new runtime requirements.

Fresh verification completed on 2026-07-20: 25 unit/scenario tests passed; 5 PostgreSQL integration/API tests passed after migration up/down/up in a newly created isolated database; append-only mutation failures, duplicate/stale/partial-fill/kill-switch paths, corrections, split/dividend actions, reconciliation, and audit-chain verification passed. The frontend production build passed, backend and frontend dependency audits reported zero vulnerabilities at the low-severity threshold, all checked JavaScript parsed, `git diff --check` and shell syntax checks passed, `docker compose config --quiet` passed, and the supported current tree passed Gitleaks after the final tracked JWT helper was removed. CI generates its authentication secret per run and rejects new working-tree secret findings; the two documented historical findings remain a rotation/history-remediation release gate. Each isolated verification database was removed afterward. A local image build was not run because the Docker daemon was unavailable; the checked-in CI performs that build.

## Runtime acceptance verification (2026-07-20)

`start.sh` now directly launches prepared backend and production frontend artifacts, honors explicit loopback hosts and ports, refuses occupied ports, and leaves Docker/database orchestration and migration to explicit operator steps. Production still requires its licensed-source allowlist; the validator's `NODE_ENV=test` acceptance path does not invent production market-data authorization. A disposable-loopback-only `create-admin` command provisions the acceptance identity through the real Sequelize user model and password hashing hooks. Canonical `/api/auth/login` and `/api/auth/me` aliases reuse the existing controllers and database-backed authentication middleware.

The shared non-suite validator applied the checked-in migration to a fresh disposable PostgreSQL database and launched both services on the project's unique triple (`55705` database, `6210` API, `6211` UI). The real password login returned HTTP 200 and `/api/auth/me` reloaded the authenticated user from PostgreSQL, recording `API_VERIFIED startup_login_session_api` on the first attempt.

After listener release, migration up/down/up, all 25 unit/scenario tests, all 5 PostgreSQL integration/API tests, the Vite production build, launcher syntax, and changed-JavaScript syntax passed. All assigned ports were released afterward.
