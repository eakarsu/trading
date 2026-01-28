import React, { useState, useEffect } from 'react';
import { algoTradingAPI } from '../api/algoTrading';
import { brokersAPI } from '../api/brokers';
import '../styles/pages/AlgoTradingPage.css';

const BacktestingPage = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customStrategy, setCustomStrategy] = useState({
    type: 'rsi',
    params: {},
  });
  const [symbol, setSymbol] = useState('AAPL');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [timeframe, setTimeframe] = useState('1Day');
  const [isAlpacaConnected, setIsAlpacaConnected] = useState(false);
  const [error, setError] = useState(null);

  // Backtest state
  const [backtestConfig, setBacktestConfig] = useState({
    startDate: '',
    endDate: '',
    initialCapital: 10000,
    positionSize: 0.1,
  });
  const [backtestResults, setBacktestResults] = useState(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Compare all strategies state
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState({ current: 0, total: 0, currentStrategy: '' });

  // Top 50 Major Stocks
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'AVGO', name: 'Broadcom Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'KO', name: 'Coca-Cola Co.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
  ];

  const filteredStocks = popularStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      stock.name.toLowerCase().includes(symbolSearch.toLowerCase())
  );

  useEffect(() => {
    loadTemplates();
    checkAlpacaStatus();

    // Set default dates
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);

    setBacktestConfig((prev) => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }));
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await algoTradingAPI.getTemplates();
      setTemplates(response.data.data);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const checkAlpacaStatus = async () => {
    try {
      const response = await brokersAPI.getStatus();
      setIsAlpacaConnected(response?.success && response?.data?.totalConnected > 0);
    } catch (err) {
      setIsAlpacaConnected(false);
    }
  };

  const handleSelectSymbol = (selectedSymbol) => {
    setSymbol(selectedSymbol);
    setSymbolSearch('');
    setShowSymbolDropdown(false);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setCustomStrategy({
      type: template.type,
      params: { ...template.params },
    });
  };

  // Run backtest
  const handleRunBacktest = async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to a broker in Command Center first');
      return;
    }

    // Validate dates
    const today = new Date().toISOString().split('T')[0];
    if (backtestConfig.endDate > today) {
      setError(`End date cannot be in the future. Today is ${today}`);
      return;
    }
    if (backtestConfig.startDate >= backtestConfig.endDate) {
      setError('Start date must be before end date');
      return;
    }

    setIsBacktesting(true);
    setError(null);
    setBacktestResults(null);

    try {
      const strategy = {
        type: customStrategy.type || selectedTemplate?.type,
        params: { ...customStrategy.params },
      };
      const response = await algoTradingAPI.runBacktest({
        symbol,
        strategy,
        startDate: backtestConfig.startDate,
        endDate: backtestConfig.endDate,
        initialCapital: backtestConfig.initialCapital,
        positionSize: backtestConfig.positionSize,
        timeframe,
      });

      const data = response.data.data;
      setBacktestResults({
        finalValue: data.finalCapital,
        totalReturn: (data.finalCapital - data.initialCapital) / data.initialCapital,
        totalTrades: data.metrics?.totalTrades || 0,
        winRate: (data.metrics?.winRate || 0) / 100,
        profitFactor: data.metrics?.profitFactor || 0,
        sharpeRatio: data.metrics?.sharpeRatio || 0,
        maxDrawdown: (data.metrics?.maxDrawdown || 0) / 100,
        avgTradeReturn: data.metrics?.totalReturn ? (data.metrics.totalReturn / (data.metrics.totalTrades || 1)) / 100 : 0,
        trades: data.trades?.map(t => ({
          date: t.date,
          side: t.type?.toLowerCase(),
          price: t.price,
          qty: t.shares,
          pnl: t.pnl || 0,
        })) || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run backtest');
    } finally {
      setIsBacktesting(false);
    }
  };

  // Compare all strategies
  const handleCompareAllStrategies = async () => {
    if (!backtestConfig.startDate || !backtestConfig.endDate) {
      setError('Please select start and end dates');
      return;
    }

    setIsComparing(true);
    setError(null);
    setComparisonResults(null);
    setComparisonProgress({ current: 0, total: templates.length, currentStrategy: '' });

    const results = [];

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      setComparisonProgress({
        current: i + 1,
        total: templates.length,
        currentStrategy: template.name,
      });

      try {
        const strategy = {
          type: template.type,
          params: { ...template.params },
        };

        const response = await algoTradingAPI.runBacktest({
          symbol,
          strategy,
          startDate: backtestConfig.startDate,
          endDate: backtestConfig.endDate,
          initialCapital: backtestConfig.initialCapital,
          positionSize: backtestConfig.positionSize,
          timeframe,
        });

        const data = response.data.data;
        results.push({
          id: template.id,
          name: template.name,
          type: template.type,
          riskLevel: template.riskLevel,
          totalReturn: ((data.finalCapital - data.initialCapital) / data.initialCapital) * 100,
          finalValue: data.finalCapital,
          totalTrades: data.metrics?.totalTrades || 0,
          winRate: data.metrics?.winRate || 0,
          profitFactor: data.metrics?.profitFactor || 0,
          sharpeRatio: data.metrics?.sharpeRatio || 0,
          maxDrawdown: data.metrics?.maxDrawdown || 0,
          success: true,
        });
      } catch (err) {
        results.push({
          id: template.id,
          name: template.name,
          type: template.type,
          riskLevel: template.riskLevel,
          totalReturn: 0,
          finalValue: backtestConfig.initialCapital,
          totalTrades: 0,
          winRate: 0,
          profitFactor: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          success: false,
          error: err.response?.data?.message || 'Failed',
        });
      }
    }

    // Sort by total return (best first)
    results.sort((a, b) => b.totalReturn - a.totalReturn);
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    setComparisonResults(results);
    setIsComparing(false);
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format percent
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0.00%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="algo-trading-page">
      <div className="page-header">
        <h1>Backtesting</h1>
        <p>Test strategies against historical data and compare performance</p>
        <span className={`connection-badge ${isAlpacaConnected ? 'connected' : 'disconnected'}`}>
          {isAlpacaConnected ? 'Broker Connected' : 'Broker Disconnected'}
        </span>
      </div>

      {!isAlpacaConnected && (
        <div className="alert alert-warning">
          Please connect to a broker in Command Center to use backtesting.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="backtest-grid">
        {/* Configuration */}
        <div className="builder-card">
          <h2>Backtest Configuration</h2>
          <div className="config-section">
            <div className="form-row">
              <div className="form-group symbol-search-group">
                <label>Symbol</label>
                <div className="symbol-search-container">
                  <input
                    type="text"
                    value={symbolSearch || symbol}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSymbolSearch(val);
                      setSymbol(val);
                      setShowSymbolDropdown(true);
                    }}
                    onFocus={() => setShowSymbolDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
                    placeholder="Search or type symbol..."
                  />
                  <span className="selected-symbol-badge">{symbol}</span>
                  {showSymbolDropdown && (
                    <div className="symbol-dropdown">
                      <div className="dropdown-header">Major Stocks</div>
                      {filteredStocks.slice(0, 15).map((stock) => (
                        <div
                          key={stock.symbol}
                          className={`dropdown-item ${symbol === stock.symbol ? 'selected' : ''}`}
                          onClick={() => handleSelectSymbol(stock.symbol)}
                        >
                          <span className="stock-symbol">{stock.symbol}</span>
                          <span className="stock-name">{stock.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Timeframe</label>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                  <option value="1Day">1 Day</option>
                  <option value="1Hour">1 Hour</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={backtestConfig.startDate}
                  onChange={(e) =>
                    setBacktestConfig((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={backtestConfig.endDate}
                  onChange={(e) =>
                    setBacktestConfig((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Initial Capital ($)</label>
                <input
                  type="number"
                  value={backtestConfig.initialCapital}
                  onChange={(e) =>
                    setBacktestConfig((prev) => ({
                      ...prev,
                      initialCapital: parseFloat(e.target.value),
                    }))
                  }
                  min="1000"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label>Position Size (%)</label>
                <input
                  type="number"
                  value={backtestConfig.positionSize * 100}
                  onChange={(e) =>
                    setBacktestConfig((prev) => ({
                      ...prev,
                      positionSize: parseFloat(e.target.value) / 100,
                    }))
                  }
                  min="1"
                  max="100"
                  step="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Strategy</label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) {
                    handleSelectTemplate(template);
                  }
                }}
              >
                <option value="">Select a strategy...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="selected-strategy">
                <span className="label">Strategy:</span>
                <span className="value">{selectedTemplate.name}</span>
                <span className="description">{selectedTemplate.description}</span>
              </div>
            )}

            <div className="backtest-buttons">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleRunBacktest}
                disabled={isBacktesting || isComparing || !symbol || !selectedTemplate || !isAlpacaConnected}
              >
                {isBacktesting ? 'Running Backtest...' : 'Run Backtest'}
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={handleCompareAllStrategies}
                disabled={isBacktesting || isComparing || !symbol || !isAlpacaConnected}
              >
                {isComparing
                  ? `Comparing ${comparisonProgress.current}/${comparisonProgress.total}...`
                  : 'Compare All Strategies'}
              </button>
            </div>
            {isComparing && (
              <div className="comparison-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(comparisonProgress.current / comparisonProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p>Testing: {comparisonProgress.currentStrategy}</p>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Results */}
        {comparisonResults && (
          <div className="builder-card comparison-card">
            <h2>Strategy Comparison Results</h2>
            <p className="comparison-subtitle">
              Tested {comparisonResults.length} strategies on {symbol} from {backtestConfig.startDate} to {backtestConfig.endDate}
            </p>
            <div className="comparison-table">
              <div className="table-header">
                <span>Rank</span>
                <span>Strategy</span>
                <span>Return</span>
                <span>Trades</span>
                <span>Win Rate</span>
                <span>Sharpe</span>
                <span>Max DD</span>
                <span>Risk</span>
              </div>
              {comparisonResults.map((result) => (
                <div
                  key={result.id}
                  className={`table-row ${result.rank === 1 ? 'best' : ''} ${!result.success ? 'failed' : ''}`}
                  onClick={() => {
                    const template = templates.find(t => t.id === result.id);
                    if (template) {
                      handleSelectTemplate(template);
                    }
                  }}
                >
                  <span className="rank">{result.rank}</span>
                  <span className="strategy-name">{result.name}</span>
                  <span className={`return ${result.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                    {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                  </span>
                  <span>{result.totalTrades}</span>
                  <span>{result.winRate.toFixed(1)}%</span>
                  <span>{result.sharpeRatio.toFixed(2)}</span>
                  <span className="negative">-{result.maxDrawdown.toFixed(1)}%</span>
                  <span className={`risk ${result.riskLevel}`}>{result.riskLevel}</span>
                </div>
              ))}
            </div>
            <p className="comparison-tip">Click on a strategy to select it for detailed backtest</p>
          </div>
        )}

        {/* Results */}
        <div className="builder-card results-card">
          <h2>Backtest Results</h2>
          {backtestResults ? (
            <div className="results-content">
              <div className="results-summary">
                <div className="result-item primary">
                  <span className="result-label">Final Value</span>
                  <span className="result-value">{formatCurrency(backtestResults.finalValue)}</span>
                </div>
                <div className={`result-item ${backtestResults.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                  <span className="result-label">Total Return</span>
                  <span className="result-value">{formatPercent(backtestResults.totalReturn)}</span>
                </div>
              </div>

              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">Total Trades</span>
                  <span className="metric-value">{backtestResults.totalTrades}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Win Rate</span>
                  <span className="metric-value">{(backtestResults.winRate * 100).toFixed(1)}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Profit Factor</span>
                  <span className="metric-value">{backtestResults.profitFactor.toFixed(2)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Sharpe Ratio</span>
                  <span className="metric-value">{backtestResults.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Max Drawdown</span>
                  <span className="metric-value negative">
                    {formatPercent(-backtestResults.maxDrawdown)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg Trade Return</span>
                  <span className="metric-value">{formatPercent(backtestResults.avgTradeReturn)}</span>
                </div>
              </div>

              {backtestResults.trades && backtestResults.trades.length > 0 && (
                <div className="trades-section">
                  <h3>Recent Trades</h3>
                  <div className="trades-table">
                    <div className="table-header">
                      <span>Date</span>
                      <span>Side</span>
                      <span>Price</span>
                      <span>Qty</span>
                      <span>P&L</span>
                    </div>
                    {backtestResults.trades.slice(-10).map((trade, idx) => (
                      <div key={idx} className="table-row">
                        <span>{new Date(trade.date).toLocaleDateString()}</span>
                        <span className={`side ${trade.side}`}>{trade.side?.toUpperCase()}</span>
                        <span>{formatCurrency(trade.price)}</span>
                        <span>{trade.qty}</span>
                        <span className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(trade.pnl)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>Configure your backtest and click "Run Backtest" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacktestingPage;
