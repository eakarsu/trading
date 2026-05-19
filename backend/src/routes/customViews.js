// === Custom Views: 4 endpoints (2 VIZ + 2 NON-VIZ) ===
// Mounted at /api/custom-views BEFORE the 404 handler
const express = require('express');
const router = express.Router();

// In-memory store for trading strategy rules
const STRATEGY_RULES = [
  {
    id: 'rule-1',
    name: 'Conservative Momentum',
    entryThreshold: 2.5,
    exitThreshold: -1.0,
    stopLoss: 5.0,
    takeProfit: 8.0,
    asset: 'AAPL',
    enabled: true,
    createdAt: new Date('2025-12-01').toISOString()
  },
  {
    id: 'rule-2',
    name: 'Aggressive Tech',
    entryThreshold: 3.0,
    exitThreshold: -2.5,
    stopLoss: 7.5,
    takeProfit: 15.0,
    asset: 'NVDA',
    enabled: true,
    createdAt: new Date('2026-01-15').toISOString()
  },
  {
    id: 'rule-3',
    name: 'Defensive Bonds',
    entryThreshold: 1.0,
    exitThreshold: -0.5,
    stopLoss: 2.0,
    takeProfit: 4.0,
    asset: 'TLT',
    enabled: false,
    createdAt: new Date('2026-02-10').toISOString()
  }
];

// ===== VIZ 1: Portfolio P&L line chart =====
router.get('/portfolio-pnl', (req, res) => {
  const days = 30;
  const series = [];
  let cumulative = 100000;
  const start = new Date();
  start.setDate(start.getDate() - days);
  for (let i = 0; i <= days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    // Deterministic-ish wave for realistic P&L curve
    const dailyChange = Math.sin(i / 3) * 800 + Math.cos(i / 5) * 600 + (i * 120);
    cumulative += dailyChange;
    series.push({
      date: d.toISOString().split('T')[0],
      pnl: Math.round(cumulative - 100000),
      portfolioValue: Math.round(cumulative),
      dailyChange: Math.round(dailyChange)
    });
  }
  res.status(200).json({
    success: true,
    title: 'Portfolio P&L (30 days)',
    baseline: 100000,
    series,
    summary: {
      totalReturn: series[series.length - 1].pnl,
      totalReturnPct: ((series[series.length - 1].pnl / 100000) * 100).toFixed(2),
      bestDay: Math.max(...series.map(s => s.dailyChange)),
      worstDay: Math.min(...series.map(s => s.dailyChange))
    }
  });
});

// ===== VIZ 2: Asset Class Heatmap (asset x return periods) =====
router.get('/asset-heatmap', (req, res) => {
  const assets = ['Equities US', 'Equities EU', 'Bonds', 'Commodities', 'Crypto', 'Real Estate', 'Cash'];
  const periods = ['1D', '1W', '1M', '3M', 'YTD', '1Y'];
  const cells = [];
  assets.forEach((asset, ai) => {
    periods.forEach((period, pi) => {
      // Deterministic spread of returns
      const base = Math.sin((ai + 1) * (pi + 1)) * 5 + Math.cos(ai * 2 + pi) * 3;
      const ret = Number(base.toFixed(2));
      cells.push({
        asset,
        period,
        return: ret,
        intensity: Math.min(1, Math.abs(ret) / 10),
        positive: ret >= 0
      });
    });
  });
  res.status(200).json({
    success: true,
    title: 'Asset Class Return Heatmap',
    assets,
    periods,
    cells,
    generatedAt: new Date().toISOString()
  });
});

// ===== NON-VIZ 1: Trade Confirmation PDF =====
router.get('/trade-confirmation/:tradeId?', (req, res) => {
  const tradeId = req.params.tradeId || `TRD-${Date.now()}`;
  const symbol = req.query.symbol || 'AAPL';
  const qty = parseInt(req.query.qty || '100', 10);
  const price = parseFloat(req.query.price || '185.50');
  const side = (req.query.side || 'BUY').toUpperCase();
  const total = (qty * price).toFixed(2);
  const commission = (qty * price * 0.0005).toFixed(2);
  const settlement = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Minimal valid PDF (text-based, single page)
  const lines = [
    'TRADE CONFIRMATION',
    `Trade ID: ${tradeId}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
    `Side: ${side}`,
    `Symbol: ${symbol}`,
    `Quantity: ${qty}`,
    `Price: $${price.toFixed(2)}`,
    `Gross Amount: $${total}`,
    `Commission: $${commission}`,
    `Net Amount: $${(parseFloat(total) + parseFloat(commission)).toFixed(2)}`,
    `Settlement Date: ${settlement}`,
    'Status: CONFIRMED',
    'Broker: TradingAI Platform'
  ];

  // Build a simple PDF
  const escapePdf = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let content = 'BT\n/F1 12 Tf\n50 780 Td\n14 TL\n';
  lines.forEach((line, idx) => {
    if (idx === 0) {
      content += `(${escapePdf(line)}) Tj\nT*\nT*\n`;
    } else {
      content += `(${escapePdf(line)}) Tj\nT*\n`;
    }
  });
  content += 'ET';

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
  objects.push(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  res.status(200);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="trade-confirmation-${tradeId}.pdf"`);
  res.send(Buffer.from(pdf, 'binary'));
});

// ===== NON-VIZ 2: Trading Strategy Rules Editor (CRUD entry/exit thresholds) =====
router.get('/strategy-rules', (req, res) => {
  res.status(200).json({
    success: true,
    count: STRATEGY_RULES.length,
    rules: STRATEGY_RULES
  });
});

router.post('/strategy-rules', (req, res) => {
  const body = req.body || {};
  const rule = {
    id: `rule-${Date.now()}`,
    name: body.name || 'New Strategy',
    entryThreshold: Number(body.entryThreshold ?? 2.0),
    exitThreshold: Number(body.exitThreshold ?? -1.0),
    stopLoss: Number(body.stopLoss ?? 5.0),
    takeProfit: Number(body.takeProfit ?? 10.0),
    asset: body.asset || 'SPY',
    enabled: body.enabled !== false,
    createdAt: new Date().toISOString()
  };
  STRATEGY_RULES.push(rule);
  res.status(200).json({ success: true, rule });
});

router.put('/strategy-rules/:id', (req, res) => {
  const idx = STRATEGY_RULES.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Rule not found' });
  }
  STRATEGY_RULES[idx] = { ...STRATEGY_RULES[idx], ...req.body, id: STRATEGY_RULES[idx].id };
  res.status(200).json({ success: true, rule: STRATEGY_RULES[idx] });
});

router.delete('/strategy-rules/:id', (req, res) => {
  const idx = STRATEGY_RULES.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Rule not found' });
  }
  const [removed] = STRATEGY_RULES.splice(idx, 1);
  res.status(200).json({ success: true, removed });
});

module.exports = router;
