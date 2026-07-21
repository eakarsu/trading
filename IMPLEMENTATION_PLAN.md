# Supported implementation scope

The earlier live-broker redesign proposal has been retired. The supported release boundary is deterministic paper execution only.

Acceptance criteria are checked in as code and CI:

1. An administrator can idempotently ingest only configured licensed sources, including provider IDs and source timestamps, and reconcile an expected provider batch.
2. A user can submit a paper order once under a stable client order ID. A different payload under the same ID conflicts.
3. Deterministic policy blocks stale/missing data, kill-switch state, daily loss, cash/position, order notional, and exposure breaches. Participation limits cap fills and create realistic partial fills.
4. Every fill creates balanced `PAPER_*` ledger entries. Ledger and audit rows are append-only. Corrections reverse prior entries; they never mutate history.
5. Splits and dividends are source-idempotent corporate actions. Audits export with a verifiable hash chain and explicit paper custody boundary.
6. Startup authenticates to an already migrated database and never syncs, seeds, drops data, or kills local processes.
7. CI exercises migration up/down/up, deterministic units, PostgreSQL scenarios, authenticated API behavior, the frontend build, dependency audit, secret scanning, and the production image build.

Live trading requires a separate reviewed architecture, broker/custody contracts, authorization model, operational controls, and certification. This release refuses `ENABLE_LIVE_TRADING=true`.
