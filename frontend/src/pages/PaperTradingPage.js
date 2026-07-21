import React, { useCallback, useEffect, useMemo, useState } from 'react';
import paperTradingAPI from '../api/paperTrading';
import '../styles/pages/PaperTradingPage.css';

const newClientOrderId = () => window.crypto?.randomUUID?.() || `paper-${Date.now()}`;
const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
const decimal = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 8 });

const PaperTradingPage = () => {
  const [account, setAccount] = useState(null);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ clientOrderId: newClientOrderId(), symbol: '', side: 'BUY', orderType: 'MARKET', quantity: '', limitPrice: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [accountResult, orderResult] = await Promise.all([paperTradingAPI.account(), paperTradingAPI.orders()]);
      setAccount(accountResult);
      setOrders(orderResult.orders || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to load the paper account.' });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const lastDecision = useMemo(() => orders.find(order => order.riskDecision)?.riskDecision, [orders]);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, symbol: form.symbol.toUpperCase(), quantity: Number(form.quantity) };
      if (form.orderType === 'MARKET') delete payload.limitPrice;
      else payload.limitPrice = Number(form.limitPrice);
      const result = await paperTradingAPI.placeOrder(payload);
      setMessage({ type: 'success', text: `${result.order.status}: ${result.order.clientOrderId}${result.idempotentReplay ? ' (idempotent replay)' : ''}` });
      setForm(current => ({ ...current, clientOrderId: newClientOrderId(), quantity: '', limitPrice: '' }));
      await refresh();
    } catch (error) {
      const body = error.response?.data;
      setMessage({ type: 'error', text: `${body?.code || 'ORDER_FAILED'}: ${body?.message || 'Paper order failed.'}` });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const activateKillSwitch = async () => {
    const reason = window.prompt('Reason for stopping paper execution:');
    if (!reason) return;
    setBusy(true);
    try {
      await paperTradingAPI.activateKillSwitch(reason);
      setMessage({ type: 'success', text: 'Kill switch activated; all executable paper orders were cancelled.' });
      await refresh();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Could not activate the kill switch.' });
    } finally { setBusy(false); }
  };

  const exportAudit = async () => {
    const report = await paperTradingAPI.auditExport();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    link.download = `paper-trading-audit-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const risk = account?.account;
  return (
    <div className="paper-page">
      <header className="paper-header">
        <div>
          <span className="paper-boundary">PAPER SIMULATION · NO BROKER OR CUSTODY ACCESS</span>
          <h1>Paper Trading</h1>
          <p>Orders use licensed, timestamped snapshots and deterministic risk checks. AI output cannot approve or execute an order.</p>
        </div>
        <div className="paper-actions">
          <button className="btn btn-secondary" onClick={exportAudit} disabled={busy}>Export audit</button>
          <button className="btn paper-stop" onClick={activateKillSwitch} disabled={busy || risk?.killSwitchActive}>Stop execution</button>
        </div>
      </header>

      {message && <div className={`paper-message ${message.type}`}>{message.text}</div>}
      {risk?.killSwitchActive && <div className="paper-message error">Execution stopped: {risk.killSwitchReason}</div>}

      <section className="paper-metrics" aria-label="Paper account limits">
        <article><span>Paper cash</span><strong>{currency(risk?.cashBalance)}</strong></article>
        <article><span>Gross exposure</span><strong>{currency(account?.grossExposure)}</strong></article>
        <article><span>Daily realized P&amp;L</span><strong>{currency(risk?.dailyRealizedPnl)}</strong></article>
        <article><span>Max order</span><strong>{currency(risk?.maxOrderNotional)}</strong></article>
        <article><span>Data age limit</span><strong>{risk?.maxMarketDataAgeSeconds || '—'}s</strong></article>
        <article><span>Participation cap</span><strong>{risk?.maxParticipationPercent || '—'}%</strong></article>
      </section>

      <div className="paper-grid">
        <section className="paper-card">
          <h2>Submit a paper order</h2>
          <form className="paper-form" onSubmit={submit}>
            <label>Symbol<input value={form.symbol} onChange={event => setForm({ ...form, symbol: event.target.value })} placeholder="AAPL" maxLength="16" required /></label>
            <label>Side<select value={form.side} onChange={event => setForm({ ...form, side: event.target.value })}><option>BUY</option><option>SELL</option></select></label>
            <label>Type<select value={form.orderType} onChange={event => setForm({ ...form, orderType: event.target.value })}><option>MARKET</option><option>LIMIT</option></select></label>
            <label>Quantity<input type="number" min="0.00000001" step="0.00000001" value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })} required /></label>
            {form.orderType === 'LIMIT' && <label>Limit price<input type="number" min="0.00000001" step="0.00000001" value={form.limitPrice} onChange={event => setForm({ ...form, limitPrice: event.target.value })} required /></label>}
            <label className="paper-id">Client order ID<input value={form.clientOrderId} onChange={event => setForm({ ...form, clientOrderId: event.target.value })} maxLength="120" required /></label>
            <button className="btn btn-primary" disabled={busy || risk?.killSwitchActive}>{busy ? 'Checking…' : 'Run checks and submit'}</button>
          </form>
          {lastDecision && <div className="paper-decision"><strong>Latest deterministic decision:</strong> {lastDecision.approved ? 'APPROVED' : lastDecision.reasons?.join(', ')} · policy {lastDecision.policy}</div>}
        </section>

        <section className="paper-card">
          <h2>Positions</h2>
          {!account?.positions?.length ? <p className="paper-empty">No paper positions.</p> : (
            <div className="paper-table-wrap"><table><thead><tr><th>Symbol</th><th>Quantity</th><th>Avg cost</th><th>Mark</th><th>Value</th></tr></thead><tbody>
              {account.positions.map(position => <tr key={position.id}><td>{position.symbol}</td><td>{decimal(position.quantity)}</td><td>{currency(position.averageCost)}</td><td>{currency(position.markPrice)}</td><td>{currency(position.marketValue)}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>

      <section className="paper-card paper-orders">
        <div className="paper-section-title"><h2>Order and fill record</h2><button className="btn btn-secondary" onClick={refresh} disabled={busy}>Refresh</button></div>
        {!orders.length ? <p className="paper-empty">No paper orders yet. An administrator must ingest an approved market snapshot before the first order.</p> : (
          <div className="paper-table-wrap"><table><thead><tr><th>Time</th><th>Order ID</th><th>Symbol</th><th>Side</th><th>Requested</th><th>Filled</th><th>Avg fill</th><th>Status</th><th>Risk</th></tr></thead><tbody>
            {orders.map(order => <tr key={order.id}><td>{new Date(order.createdAt).toLocaleString()}</td><td title={order.id}>{order.clientOrderId}</td><td>{order.symbol}</td><td>{order.side}</td><td>{decimal(order.quantity)}</td><td>{decimal(order.filledQuantity)}</td><td>{order.averageFillPrice ? currency(order.averageFillPrice) : '—'}</td><td><span className={`paper-status ${order.status.toLowerCase()}`}>{order.status}</span></td><td>{order.rejectionCode || order.riskDecision?.policy || '—'}</td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
};

export default PaperTradingPage;
