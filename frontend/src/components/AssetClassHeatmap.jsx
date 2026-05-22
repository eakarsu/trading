// === Custom Views: VIZ component - Asset class heatmap ===
import React, { useEffect, useState } from 'react';

const API = (import.meta.env.API_BASE_URL || 'http://localhost:3001') + '/api/custom-views';

export default function AssetClassHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/asset-heatmap`)
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ padding: 12, color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 12 }}>Loading heatmap...</div>;

  const cellMap = {};
  data.cells.forEach(c => { cellMap[`${c.asset}|${c.period}`] = c; });

  const colorFor = (cell) => {
    if (!cell) return '#1e293b';
    const intensity = Math.min(1, Math.abs(cell.return) / 8);
    if (cell.return >= 0) {
      const g = Math.round(80 + intensity * 175);
      return `rgb(0, ${g}, 80)`;
    } else {
      const r = Math.round(80 + intensity * 175);
      return `rgb(${r}, 30, 30)`;
    }
  };

  return (
    <div data-testid="asset-class-heatmap" style={{
      background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 8, border: '1px solid #1e293b'
    }}>
      <h3 style={{ marginTop: 0 }}>{data.title}</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #334155' }}>Asset Class</th>
            {data.periods.map(p => (
              <th key={p} style={{ padding: 8, textAlign: 'center', borderBottom: '1px solid #334155' }}>{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.assets.map(a => (
            <tr key={a}>
              <td style={{ padding: 8, fontWeight: 600 }}>{a}</td>
              {data.periods.map(p => {
                const c = cellMap[`${a}|${p}`];
                return (
                  <td key={p} style={{
                    background: colorFor(c),
                    color: '#fff',
                    textAlign: 'center',
                    padding: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid #0f172a'
                  }}>
                    {c ? `${c.return > 0 ? '+' : ''}${c.return}%` : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
