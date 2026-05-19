// === Custom Views Page: Trade Views ===
import React from 'react';
import PortfolioPnLChart from '../components/PortfolioPnLChart';
import AssetClassHeatmap from '../components/AssetClassHeatmap';
import TradeConfirmationPDF from '../components/TradeConfirmationPDF';
import StrategyRulesEditor from '../components/StrategyRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" style={{ padding: 20, color: '#e2e8f0', background: '#020617', minHeight: '100vh' }}>
      <h1 style={{ marginTop: 0 }}>Trade Views</h1>
      <p style={{ color: '#94a3b8', marginBottom: 20 }}>
        Custom trading dashboards: portfolio performance, asset returns, trade confirmations, and strategy rules.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <PortfolioPnLChart />
        <AssetClassHeatmap />
        <TradeConfirmationPDF />
        <StrategyRulesEditor />
      </div>
    </div>
  );
}
