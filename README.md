# Trading — deterministic paper execution

This repository now has one supported end-to-end journey: authenticated, deterministic **paper trading** against licensed, timestamped market snapshots. It does not connect the supported order path to a bank, broker, or custodian. `ENABLE_LIVE_TRADING=true` is rejected at startup.

The paper path provides:

- idempotent market ingestion and provider-record reconciliation;
- deterministic stale-data, notional, exposure, cash/position, loss, participation, approval, and kill-switch controls;
- liquidity-capped partial fills, resting limit orders, positions, and paper cash;
- historical scenario replay for duplicate, stale, kill-switch, exhausted-liquidity, and partial-fill behavior;
- append-only double-entry ledger events, reversible corrections, corporate actions, and hash-chained audit exports;
- a protected `/paper-trading` UI with an explicit simulation/custody boundary;
- repeatable migrations plus unit, PostgreSQL integration, API end-to-end, and failure-scenario CI.

Legacy strategy, portfolio, and AI routes are off by default. Older broker endpoints remain hard-disabled in this release and are not launch-approved.

## Local development

Requirements: Node.js 20+, npm, and PostgreSQL 16+.

```bash
cp .env.example .env
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run db:migrate
npm start
```

The frontend runs on `http://localhost:5173`; the API runs on `http://localhost:3001`. Create an administrator through a controlled database/admin process, then ingest data with `POST /api/paper-trading/admin/market-data`. Approved source identifiers must exactly match `LICENSED_MARKET_DATA_SOURCES`.

## Verification

```bash
npm test
RUN_DB_INTEGRATION=true npm --prefix backend run test:integration
```

The integration suite requires an isolated migrated database through `DATABASE_URL`. Never point it at shared or production data.

## Containers

Set `POSTGRES_PASSWORD`, `JWT_SECRET`, `CORS_ORIGINS`, and `LICENSED_MARKET_DATA_SOURCES`, then run:

```bash
./start.sh
```

Compose waits for PostgreSQL, applies migrations as a one-shot service, and starts the read-only application container only after migration success.

See [operations](docs/OPERATIONS.md), [security](SECURITY.md), and the [paper data contract](docs/PAPER_TRADING_CONTRACT.md).
