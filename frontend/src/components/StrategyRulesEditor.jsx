// === Custom Views: NON-VIZ component - Trading Strategy Rules editor (CRUD) ===
import React, { useEffect, useState } from 'react';

const API = (import.meta.env.API_BASE_URL || 'http://localhost:3001') + '/api/custom-views';

const empty = { name: '', asset: 'SPY', entryThreshold: 2.0, exitThreshold: -1.0, stopLoss: 5.0, takeProfit: 10.0, enabled: true };

export default function StrategyRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      const r = await fetch(`${API}/strategy-rules`);
      const j = await r.json();
      setRules(j.rules || []);
    } catch (e) { setStatus(`Load error: ${e.message}`); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      const url = editingId ? `${API}/strategy-rules/${editingId}` : `${API}/strategy-rules`;
      const method = editingId ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setStatus(`Saved rule (${method})`);
      setForm(empty); setEditingId(null);
      load();
    } catch (e) { setStatus(`Save error: ${e.message}`); }
  };

  const edit = (r) => { setForm(r); setEditingId(r.id); };
  const del = async (id) => {
    try {
      const r = await fetch(`${API}/strategy-rules/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setStatus(`Deleted ${id}`);
      load();
    } catch (e) { setStatus(`Delete error: ${e.message}`); }
  };

  const inp = { padding: 6, background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: 4, width: '100%' };

  return (
    <div data-testid="strategy-rules-editor" style={{
      background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 8, border: '1px solid #1e293b'
    }}>
      <h3 style={{ marginTop: 0 }}>Strategy Rules Editor</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <label style={{ fontSize: 12 }}>Name<input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label style={{ fontSize: 12 }}>Asset<input style={inp} value={form.asset} onChange={e => setForm({ ...form, asset: e.target.value })} /></label>
        <label style={{ fontSize: 12 }}>Entry Threshold (%)<input type="number" step="0.1" style={inp} value={form.entryThreshold} onChange={e => setForm({ ...form, entryThreshold: parseFloat(e.target.value) })} /></label>
        <label style={{ fontSize: 12 }}>Exit Threshold (%)<input type="number" step="0.1" style={inp} value={form.exitThreshold} onChange={e => setForm({ ...form, exitThreshold: parseFloat(e.target.value) })} /></label>
        <label style={{ fontSize: 12 }}>Stop Loss (%)<input type="number" step="0.1" style={inp} value={form.stopLoss} onChange={e => setForm({ ...form, stopLoss: parseFloat(e.target.value) })} /></label>
        <label style={{ fontSize: 12 }}>Take Profit (%)<input type="number" step="0.1" style={inp} value={form.takeProfit} onChange={e => setForm({ ...form, takeProfit: parseFloat(e.target.value) })} /></label>
        <label style={{ fontSize: 12, alignSelf: 'end' }}>
          <input type="checkbox" checked={!!form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} /> Enabled
        </label>
        <div style={{ alignSelf: 'end', display: 'flex', gap: 8 }}>
          <button onClick={submit} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button onClick={() => { setForm(empty); setEditingId(null); }} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          )}
        </div>
      </div>

      {status && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{status}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #334155' }}>
            <th style={{ padding: 6, textAlign: 'left' }}>Name</th>
            <th style={{ padding: 6 }}>Asset</th>
            <th style={{ padding: 6 }}>Entry</th>
            <th style={{ padding: 6 }}>Exit</th>
            <th style={{ padding: 6 }}>SL</th>
            <th style={{ padding: 6 }}>TP</th>
            <th style={{ padding: 6 }}>Enabled</th>
            <th style={{ padding: 6 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: 6 }}>{r.name}</td>
              <td style={{ padding: 6, textAlign: 'center' }}>{r.asset}</td>
              <td style={{ padding: 6, textAlign: 'center' }}>{r.entryThreshold}%</td>
              <td style={{ padding: 6, textAlign: 'center' }}>{r.exitThreshold}%</td>
              <td style={{ padding: 6, textAlign: 'center' }}>{r.stopLoss}%</td>
              <td style={{ padding: 6, textAlign: 'center' }}>{r.takeProfit}%</td>
              <td style={{ padding: 6, textAlign: 'center' }}>{r.enabled ? 'YES' : 'NO'}</td>
              <td style={{ padding: 6, textAlign: 'center' }}>
                <button onClick={() => edit(r)} style={{ marginRight: 6, background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => del(r.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
