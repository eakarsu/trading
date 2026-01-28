import React, { useState, useEffect } from 'react';
import { algoTradingAPI } from '../api/algoTrading';
import { brokersAPI } from '../api/brokers';
import '../styles/pages/AlgoTradingPage.css';

const AutoTradingPage = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customStrategy, setCustomStrategy] = useState({
    type: 'rsi',
    params: {},
  });
  const [symbol, setSymbol] = useState('AAPL');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [isAlpacaConnected, setIsAlpacaConnected] = useState(false);
  const [error, setError] = useState(null);

  // Auto-trading state
  const [autoTradeConfig, setAutoTradeConfig] = useState({
    strategyId: '',
    positionSize: 0.1,
    maxPositions: 3,
    stopLoss: 0.02,
    takeProfit: 0.05,
  });
  const [activeStrategies, setActiveStrategies] = useState([]);
  const [isStartingAutoTrade, setIsStartingAutoTrade] = useState(false);

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
    loadActiveStrategies();
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

  const loadActiveStrategies = async () => {
    try {
      const response = await algoTradingAPI.getActiveStrategies();
      setActiveStrategies(response.data.data || []);
    } catch (err) {
      console.error('Error loading active strategies:', err);
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
    setAutoTradeConfig((prev) => ({ ...prev, strategyId: template.id }));
  };

  // Start auto trading
  const handleStartAutoTrade = async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to a broker in Command Center first');
      return;
    }

    if (!autoTradeConfig.strategyId) {
      setError('Please select a strategy');
      return;
    }

    setIsStartingAutoTrade(true);
    setError(null);

    try {
      const strategy = {
        type: selectedTemplate?.type || customStrategy.type,
        params: selectedTemplate?.params || customStrategy.params || {},
      };
      const strategyId = `${autoTradeConfig.strategyId}_${Date.now()}`;

      await algoTradingAPI.startAutoTrading({
        strategyId,
        symbol,
        strategy,
        positionSize: autoTradeConfig.positionSize,
        maxPositions: autoTradeConfig.maxPositions,
        stopLoss: autoTradeConfig.stopLoss,
        takeProfit: autoTradeConfig.takeProfit,
      });

      await loadActiveStrategies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start auto trading');
    } finally {
      setIsStartingAutoTrade(false);
    }
  };

  // Stop auto trading
  const handleStopAutoTrade = async (strategyId) => {
    try {
      await algoTradingAPI.stopAutoTrading(strategyId);
      await loadActiveStrategies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop auto trading');
    }
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

  return (
    <div className="algo-trading-page">
      <div className="page-header">
        <h1>Auto Trading</h1>
        <p>Configure and monitor automated trading strategies</p>
        <span className={`connection-badge ${isAlpacaConnected ? 'connected' : 'disconnected'}`}>
          {isAlpacaConnected ? 'Broker Connected' : 'Broker Disconnected'}
        </span>
      </div>

      {!isAlpacaConnected && (
        <div className="alert alert-warning">
          Please connect to a broker in Command Center before starting auto trading.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="auto-trade-grid">
        {/* Configuration Card */}
        <div className="builder-card">
          <h2>Auto Trading Configuration</h2>
          <div className="config-section">
            <div className="form-row">
              <div className="form-group">
                <label>Strategy</label>
                <select
                  value={autoTradeConfig.strategyId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setAutoTradeConfig((prev) => ({ ...prev, strategyId: selectedId }));
                    const template = templates.find(t => t.id === selectedId);
                    if (template) {
                      handleSelectTemplate(template);
                    }
                  }}
                  className="strategy-select"
                >
                  <option value="">-- Select a Strategy --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.type})
                    </option>
                  ))}
                </select>
              </div>
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Position Size (%)</label>
                <input
                  type="number"
                  value={autoTradeConfig.positionSize * 100}
                  onChange={(e) =>
                    setAutoTradeConfig((prev) => ({
                      ...prev,
                      positionSize: parseFloat(e.target.value) / 100,
                    }))
                  }
                  min="1"
                  max="100"
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Max Positions</label>
                <input
                  type="number"
                  value={autoTradeConfig.maxPositions}
                  onChange={(e) =>
                    setAutoTradeConfig((prev) => ({
                      ...prev,
                      maxPositions: parseInt(e.target.value),
                    }))
                  }
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stop Loss (%)</label>
                <input
                  type="number"
                  value={autoTradeConfig.stopLoss * 100}
                  onChange={(e) =>
                    setAutoTradeConfig((prev) => ({
                      ...prev,
                      stopLoss: parseFloat(e.target.value) / 100,
                    }))
                  }
                  min="0.5"
                  max="20"
                  step="0.5"
                />
              </div>
              <div className="form-group">
                <label>Take Profit (%)</label>
                <input
                  type="number"
                  value={autoTradeConfig.takeProfit * 100}
                  onChange={(e) =>
                    setAutoTradeConfig((prev) => ({
                      ...prev,
                      takeProfit: parseFloat(e.target.value) / 100,
                    }))
                  }
                  min="1"
                  max="50"
                  step="0.5"
                />
              </div>
            </div>

            {selectedTemplate && (
              <div className="selected-strategy">
                <span className="label">Selected Strategy:</span>
                <span className="value">{selectedTemplate.name}</span>
              </div>
            )}

            <div className="warning-box">
              <strong>Warning:</strong> Auto trading will execute real trades with real money (or paper money if in paper mode). Make sure you understand the risks.
            </div>

            <button
              className="btn btn-success btn-lg"
              onClick={handleStartAutoTrade}
              disabled={isStartingAutoTrade || !isAlpacaConnected || !selectedTemplate}
            >
              {isStartingAutoTrade ? 'Starting...' : 'Start Auto Trading'}
            </button>
          </div>
        </div>

        {/* Strategy Summary Card */}
        <div className="builder-card">
          <h2>Strategy Summary</h2>
          {selectedTemplate ? (
            <div className="strategy-summary">
              <div className="summary-item">
                <span className="label">Strategy</span>
                <span className="value">{selectedTemplate.name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Type</span>
                <span className="value">{selectedTemplate.type}</span>
              </div>
              <div className="summary-item">
                <span className="label">Risk Level</span>
                <span className={`value risk-${selectedTemplate.riskLevel}`}>{selectedTemplate.riskLevel}</span>
              </div>
              <div className="summary-item">
                <span className="label">Description</span>
                <p className="description">{selectedTemplate.description}</p>
              </div>
              <div className="summary-item">
                <span className="label">Parameters</span>
                <div className="params-list">
                  {Object.entries(customStrategy.params || {}).map(([key, value]) => (
                    <div key={key} className="param-item">
                      <span className="param-key">{key}:</span>
                      <span className="param-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Select a strategy to see its details</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Strategies Monitor */}
      <div className="monitor-section">
        <div className="builder-card full-width">
          <div className="card-header">
            <h2>Active Strategies ({activeStrategies.length})</h2>
            <button className="btn btn-secondary" onClick={loadActiveStrategies}>
              Refresh
            </button>
          </div>

          {activeStrategies.length > 0 ? (
            <div className="strategies-table">
              <div className="table-header">
                <span>Strategy ID</span>
                <span>Symbol</span>
                <span>Type</span>
                <span>Status</span>
                <span>P&L</span>
                <span>Trades</span>
                <span>Last Signal</span>
                <span>Actions</span>
              </div>
              {activeStrategies.map((strategy) => (
                <div key={strategy.id} className="table-row">
                  <span className="strategy-id">{strategy.id}</span>
                  <span className="symbol">{strategy.symbol}</span>
                  <span className="type">{strategy.type}</span>
                  <span className={`status ${strategy.status}`}>{strategy.status}</span>
                  <span className={strategy.pnl >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(strategy.pnl || 0)}
                  </span>
                  <span>{strategy.trades || 0}</span>
                  <span className={`signal ${strategy.lastSignal?.signal || 'hold'}`}>
                    {strategy.lastSignal?.signal || 'N/A'}
                  </span>
                  <span className="actions">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStopAutoTrade(strategy.id)}
                    >
                      Stop
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No active strategies. Configure and start one above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoTradingPage;
