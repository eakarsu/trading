# Paper trading contract

## Market snapshots

`POST /api/paper-trading/admin/market-data` accepts an authenticated administrator request with:

```json
{
  "source": "contracted-feed-id",
  "sourceRecordId": "provider-unique-record-id",
  "symbol": "AAPL",
  "bid": 199.9,
  "ask": 200.1,
  "last": 200,
  "volume": 10000,
  "sourceTimestamp": "2026-07-20T12:00:00.000Z",
  "licenseScope": "paper-display"
}
```

`source` must be configured in `LICENSED_MARKET_DATA_SOURCES`. `(source, sourceRecordId)` is idempotent: an exact replay returns the original row and a changed replay returns `409 SOURCE_RECORD_CONFLICT`. Corrections create a new record and reference `correctionOfId`; history is not overwritten. Reconciliation compares up to 5,000 expected provider IDs with persisted IDs for a source/time window.

## Orders and execution

`POST /api/paper-trading/orders` requires `clientOrderId`, `symbol`, `side`, `orderType`, and positive `quantity`; limit orders also require `limitPrice`. `(userId, clientOrderId)` is the order idempotency boundary.

The synchronous policy is code-only and emits stable reason codes. Missing/stale data, kill-switch state, notional, symbol/gross exposure, daily loss, paper cash, owned position, and zero liquidity can reject. The configured participation percentage determines maximum quantity per snapshot; remaining quantity stays `PARTIALLY_FILLED`. Limit orders that do not cross the quote remain `OPEN`.

Fill pricing uses the correct quote side plus deterministic one-basis-point paper slippage, capped by a limit price. It is a simulation convention, not a claim of historical or attainable execution.

The pure `ScenarioReplayService` runs the same deterministic policy against chronological historical events. It tracks per-snapshot consumed liquidity and is exercised in CI for stale inputs, exact/conflicting duplicates, partial fills, exhausted quote liquidity, and kill-switch behavior without relying on wall-clock time.

## Ledger, corrections, and actions

Fills produce balanced `PAPER_CASH`, `PAPER_SECURITIES`, and when applicable `PAPER_REALIZED_PNL` entries. Database triggers reject update/delete on ledger and audit tables. An error correction appends direction-reversed entries pointing to the originals and a corrected repost, preserving economic balances without rewriting history.

Corporate actions require an approved source and source record. Splits adjust paper quantity/cost; dividends adjust paper cash and create balanced ledger events. Exact actions replay idempotently.

`GET /api/paper-trading/reconcile` checks order/fill quantities, event-group balance, paper cash against the cash ledger, position carrying cost against the securities ledger, and the `PAPER_*` custody namespace. `GET /api/paper-trading/audit-export` includes account, positions, fills, ledger, audit chain result, and a canonical SHA-256 checksum.
