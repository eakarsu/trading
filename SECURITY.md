# Security policy

## Credentials

No real secret belongs in this repository, fixtures, logs, frontend variables, container layers, or support exports. Production startup requires a minimum 32-character `JWT_SECRET`, an explicit non-wildcard CORS allowlist, and a database URL supplied at runtime.

Credential-like text artifacts and token-printing/seed helpers formerly tracked in this repository have been removed. Because deletion does not erase Git history, maintainers must inspect the full history and rotate every broker key, database password, JWT/session secret, token, and user password that may ever have appeared. Do not treat the current-tree cleanup as proof that an exposed credential is safe.

`VITE_*` values are public browser configuration and must never contain secrets. Market-data source IDs are identifiers, not credentials; vendor credentials should be injected into a future dedicated ingestion adapter through a secret manager.

## Supported boundary

The supported order engine is `PAPER_SIMULATION_ONLY`. It has no broker, bank, or custodian adapter. The server rejects any request to enable live trading. AI/LLM output is not part of order approval, sizing, risk, or execution.

## Reporting

Report a suspected vulnerability privately to the repository maintainers. Include affected revision, reproduction steps, impact, and whether credentials or personal data may be involved. Do not include live credentials in the report.
