# Operations runbook

## Deployment sequence

1. Provision an isolated PostgreSQL database and inject secrets through the deployment secret manager.
2. Back up the database with `pg_dump --format=custom --no-owner "$DATABASE_URL" > trading-YYYYMMDD.dump` and verify the dump can be listed with `pg_restore --list`.
3. Run `npm --prefix backend run db:migrate` as a one-shot release task.
4. Start the application only after migration success. `/health` verifies connectivity; `/ready` verifies the paper schema exists.
5. Confirm the UI and API report `PAPER_SIMULATION_ONLY`, `ENABLE_LIVE_TRADING=false`, explicit CORS origins, and the intended licensed-source allowlist.

Never use the integration suite, migration rollback, or restore commands against a shared database. A restore replaces operational state and requires a change record, tested backup, exact target confirmation, maintenance window, and separate authorization.

## Ingestion and reconciliation

Use a dedicated admin identity to ingest. Preserve provider source IDs and timestamps. Reconcile each provider batch using `POST /api/paper-trading/admin/market-data/reconcile`; any missing or unexpected record is an operational exception, not a value to synthesize.

Monitor rejected orders by reason, market-data age, reconciliation exceptions, unbalanced ledger checks, audit-chain verification, and kill-switch changes. Do not log request authorization headers, vendor credentials, or complete audit exports.

## Incident controls

- A user can activate their own kill switch. Activation cancels all approved/open/partially-filled paper orders.
- Only an administrator can release it, using the target-user admin endpoint and a recorded reason.
- For a suspected market-data or accounting issue, activate the kill switch first, stop ingestion, preserve logs/provider IDs, run reconciliation, and export the audit bundle.
- Correct accounting errors through the correction endpoint. Never edit or delete a ledger/audit row.

## Corporate actions

Apply actions only after reconciling the provider record and effective timestamp. Exact source records are safe to replay; conflicting payloads are rejected. Review affected-account counts and run ledger reconciliation afterward.

## Recovery

Restore into an isolated database first, migrate it, run `/ready`, reconciliation, and audit-chain verification, then obtain explicit approval before switching traffic. Recovery point and recovery time objectives depend on the selected PostgreSQL service and must be documented by the operator.
