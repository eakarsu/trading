import React, { useEffect, useState } from 'react';
import Pagination from '../components/Pagination';
import RecordDialog from '../components/RecordDialog';
import JsonReport from '../components/JsonReport';
import NativeAIControls from '../components/NativeAIControls';
import { listAIResults, generateTradeRationale } from '../api/aiResults';

/**
 * TradeJournalPage — implements audit proposal #1:
 * "Strategy explanation + post-trade journal".
 *
 * Lists every AI-generated trade rationale (paginated), with filters by symbol.
 * Includes a quick-action form to request a rationale for a fresh trade.
 */
export default function TradeJournalPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [data, setData] = useState({ data: [], pagination: { totalPages: 1, total: 0 } });
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // form state
  const [form, setForm] = useState({
    symbol: '', side: 'buy', qty: 100, price: 0,
    rsi: '', macd: '', ema10: '', ema20: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const examples = [
    { symbol: 'AAPL', side: 'buy', qty: 25, price: 195.50, rsi: 43, macd: 0.32, ema10: 194.8, ema20: 193.6 },
    { symbol: 'MSFT', side: 'sell', qty: 10, price: 415.30, rsi: 68, macd: -0.24, ema10: 414.2, ema20: 416.1 },
    { symbol: 'NVDA', side: 'buy', qty: 15, price: 125.75, rsi: 51, macd: 0.11, ema10: 124.9, ema20: 123.8 },
  ];
  const presets = examples.map((value, index) => ({
    name: ['Example buy', 'Example sell', 'Example momentum'][index],
    fill: () => { setForm(value); return { filled: Object.keys(value).length, manual: [] }; },
  }));

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const res = await listAIResults({ page, pageSize, feature: 'trade_rationale', symbol: symbol || undefined });
      setData({
        data: Array.isArray(res?.data) ? res.data : [],
        pagination: res?.pagination || { totalPages: 1, total: 0 },
      });
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page, symbol]);

  async function submit(e) {
    e.preventDefault();
    if (!form.symbol || !form.price) return;
    setSubmitting(true); setError(null);
    try {
      const signals = {};
      if (form.rsi) signals.rsi = Number(form.rsi);
      if (form.macd) signals.macd = Number(form.macd);
      if (form.ema10) signals.ema10 = Number(form.ema10);
      if (form.ema20) signals.ema20 = Number(form.ema20);
      await generateTradeRationale({
        symbol: form.symbol.toUpperCase(),
        side: form.side,
        qty: Number(form.qty),
        price: Number(form.price),
        signals
      });
      setPage(1);
      await fetchData();
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const updateResult = updated => {
    setData(prev => ({ ...prev, data: prev.data.map(row => (row.id === updated.id ? { ...row, ...updated } : row)) }));
  };

  const removeResult = record => {
    setData(prev => ({
      ...prev,
      data: prev.data.filter(row => row.id !== record.id),
      pagination: prev.pagination ? { ...prev.pagination, total: Math.max(0, (prev.pagination.total || 0) - 1) } : prev.pagination,
    }));
  };

  return (
    <div className="trade-journal-page" style={{ padding: '1rem' }}>
      <h1>Trade Journal</h1>
      <p style={{ color: '#666' }}>
        AI-generated rationale for every executed trade. Filter by symbol or request a new rationale below.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Filter by symbol (e.g. AAPL)"
          value={symbol}
          onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setPage(1); }}
          style={{ padding: '0.5rem' }}
        />
        <button onClick={fetchData} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>Error: {error}</div>}

      <details style={{ marginBottom: '1rem' }}>
        <summary>+ Generate rationale for a new trade</summary>
        <NativeAIControls presets={presets} context="trade rationale">
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input placeholder="Symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} required />
          <select value={form.side} onChange={e => setForm({ ...form, side: e.target.value })}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <input placeholder="Qty" type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} />
          <input placeholder="Price" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <input placeholder="RSI" value={form.rsi} onChange={e => setForm({ ...form, rsi: e.target.value })} />
          <input placeholder="MACD" value={form.macd} onChange={e => setForm({ ...form, macd: e.target.value })} />
          <input placeholder="EMA10" value={form.ema10} onChange={e => setForm({ ...form, ema10: e.target.value })} />
          <input placeholder="EMA20" value={form.ema20} onChange={e => setForm({ ...form, ema20: e.target.value })} />
          <button type="submit" disabled={submitting} style={{ gridColumn: 'span 4' }}>
            {submitting ? 'Generating…' : 'Generate rationale'}
          </button>
        </form>
        </NativeAIControls>
      </details>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>When</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Symbol</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Side</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Summary</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {data.data.length === 0 && !loading && (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No trade rationales yet.</td></tr>
          )}
          {data.data.map((row) => {
            const r = row.ai_results || {};
            const trade = r.trade || {};
            return (
              <tr
                key={row.id}
                className="record-row"
                tabIndex={0}
                role="button"
                aria-label={`View trade rationale for ${row.symbol}`}
                onClick={() => setSelectedRow(row)}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedRow(row); } }}
                style={{ borderTop: '1px solid #eee', cursor: 'pointer' }}
              >
                <td style={{ padding: '0.5rem' }}>{new Date(row.createdAt).toLocaleString()}</td>
                <td style={{ padding: '0.5rem' }}>{row.symbol}</td>
                <td style={{ padding: '0.5rem' }}>{trade.side || '-'}</td>
                <td style={{ padding: '0.5rem' }}>{r.summary || '—'}</td>
                <td style={{ padding: '0.5rem' }}>{r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#666' }}>{data.pagination.total} total</span>
        <Pagination
          page={page}
          totalPages={data.pagination.totalPages || 1}
          onPageChange={setPage}
        />
      </div>

      {selectedRow && (
        <RecordDialog
          key={selectedRow.id}
          title={`Trade rationale · ${selectedRow.symbol || ''}`.trim()}
          item={selectedRow}
          fields={['id', 'symbol', 'feature', 'model', 'createdAt']}
          onClose={() => setSelectedRow(null)}
          onSave={updateResult}
          onDelete={removeResult}
        >
          <JsonReport data={selectedRow.ai_results} title="AI trade rationale" model={selectedRow.ai_results?.model || selectedRow.model} />
        </RecordDialog>
      )}
    </div>
  );
}
