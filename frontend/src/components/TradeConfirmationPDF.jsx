// === Custom Views: NON-VIZ component - Trade confirmation PDF generator ===
import React, { useState } from 'react';

const API = (import.meta.env.API_BASE_URL || 'http://localhost:3001') + '/api/custom-views';

export default function TradeConfirmationPDF() {
  const [form, setForm] = useState({
    symbol: 'AAPL', qty: 100, price: 185.50, side: 'BUY'
  });
  const [lastUrl, setLastUrl] = useState(null);
  const [status, setStatus] = useState('');

  const onChange = (k, v) => setForm({ ...form, [k]: v });

  const generate = async () => {
    setStatus('Generating PDF...');
    const tradeId = `TRD-${Date.now()}`;
    const url = `${API}/trade-confirmation/${tradeId}?symbol=${encodeURIComponent(form.symbol)}&qty=${form.qty}&price=${form.price}&side=${form.side}`;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      setLastUrl(blobUrl);
      setStatus(`PDF generated for ${tradeId} (${blob.size} bytes)`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div data-testid="trade-confirmation-pdf" style={{
      background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 8, border: '1px solid #1e293b'
    }}>
      <h3 style={{ marginTop: 0 }}>Trade Confirmation PDF</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <label style={{ fontSize: 12 }}>Symbol
          <input value={form.symbol} onChange={e => onChange('symbol', e.target.value)}
            style={{ width: '100%', padding: 6, marginTop: 4, background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: 4 }} />
        </label>
        <label style={{ fontSize: 12 }}>Quantity
          <input type="number" value={form.qty} onChange={e => onChange('qty', e.target.value)}
            style={{ width: '100%', padding: 6, marginTop: 4, background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: 4 }} />
        </label>
        <label style={{ fontSize: 12 }}>Price
          <input type="number" step="0.01" value={form.price} onChange={e => onChange('price', e.target.value)}
            style={{ width: '100%', padding: 6, marginTop: 4, background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: 4 }} />
        </label>
        <label style={{ fontSize: 12 }}>Side
          <select value={form.side} onChange={e => onChange('side', e.target.value)}
            style={{ width: '100%', padding: 6, marginTop: 4, background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: 4 }}>
            <option>BUY</option><option>SELL</option>
          </select>
        </label>
      </div>
      <button onClick={generate} style={{
        background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer'
      }}>Generate PDF</button>
      {lastUrl && (
        <a href={lastUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 12, color: '#60a5fa' }}>Open PDF</a>
      )}
      {status && <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>{status}</div>}
    </div>
  );
}
