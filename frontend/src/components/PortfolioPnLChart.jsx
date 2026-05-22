// === Custom Views: VIZ component - Portfolio P&L line chart ===
import React, { useEffect, useState } from 'react';

const API = (import.meta.env.API_BASE_URL || 'http://localhost:3001') + '/api/custom-views';

export default function PortfolioPnLChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/portfolio-pnl`)
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ padding: 12, color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 12 }}>Loading P&L chart...</div>;

  const series = data.series || [];
  const width = 720;
  const height = 280;
  const padding = 40;
  const values = series.map(s => s.pnl);
  const minV = Math.min(...values, 0);
  const maxV = Math.max(...values, 0);
  const range = maxV - minV || 1;
  const stepX = (width - 2 * padding) / Math.max(1, series.length - 1);
  const points = series.map((s, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((s.pnl - minV) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const zeroY = height - padding - ((0 - minV) / range) * (height - 2 * padding);

  return (
    <div data-testid="portfolio-pnl-chart" style={{
      background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 8, border: '1px solid #1e293b'
    }}>
      <h3 style={{ marginTop: 0 }}>{data.title}</h3>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13 }}>
        <span>Total Return: <strong style={{ color: data.summary.totalReturn >= 0 ? '#22c55e' : '#ef4444' }}>
          ${data.summary.totalReturn.toLocaleString()} ({data.summary.totalReturnPct}%)
        </strong></span>
        <span>Best Day: <strong style={{ color: '#22c55e' }}>${data.summary.bestDay}</strong></span>
        <span>Worst Day: <strong style={{ color: '#ef4444' }}>${data.summary.worstDay}</strong></span>
      </div>
      <svg width={width} height={height} style={{ background: '#020617', borderRadius: 6 }}>
        <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#475569" strokeDasharray="4 4" />
        <polyline points={points} fill="none" stroke="#22c55e" strokeWidth="2" />
        <text x={padding} y={20} fill="#94a3b8" fontSize="11">P&L ($)</text>
        <text x={width - padding - 30} y={height - 10} fill="#94a3b8" fontSize="11">Day</text>
      </svg>
    </div>
  );
}
