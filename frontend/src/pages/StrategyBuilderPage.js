import React, { useState, useEffect } from 'react';
import { algoTradingAPI } from '../api/algoTrading';
import { brokersAPI } from '../api/brokers';
import '../styles/pages/AlgoTradingPage.css';

const StrategyBuilderPage = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [timeframe, setTimeframe] = useState('1Day');
  const [signals, setSignals] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
  const [isAlpacaConnected, setIsAlpacaConnected] = useState(false);
  const [error, setError] = useState(null);

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
  ];

  const filteredStocks = popularStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      stock.name.toLowerCase().includes(symbolSearch.toLowerCase())
  );

  useEffect(() => {
    loadTemplates();
    checkAlpacaStatus();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await algoTradingAPI.getTemplates();
      if (response.success) {
        setTemplates(response.data);
      }
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

  const handleGenerateSignals = async () => {
    if (!selectedTemplate) {
      setError('Please select a strategy template first');
      return;
    }

    setIsLoadingSignals(true);
    setError(null);

    try {
      const [signalsRes, indicatorsRes] = await Promise.all([
        algoTradingAPI.generateSignals(symbol, {
          type: selectedTemplate.type,
          params: selectedTemplate.params,
        }, timeframe),
        algoTradingAPI.calculateIndicators(symbol, ['sma', 'ema', 'rsi', 'macd', 'bollinger'], timeframe),
      ]);

      if (signalsRes.success) setSignals(signalsRes.data);
      if (indicatorsRes.success) setIndicators(indicatorsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate signals');
    } finally {
      setIsLoadingSignals(false);
    }
  };

  const getSignalColor = (signal) => {
    if (signal === 'BUY') return 'signal-buy';
    if (signal === 'SELL') return 'signal-sell';
    return 'signal-hold';
  };

  return (
    <div className="algo-trading-page">
      <div className="page-header">
        <h1>Strategy Builder</h1>
        <p>Build and test trading strategies using 25+ technical indicators</p>
      </div>

      {!isAlpacaConnected && (
        <div className="alert alert-warning">
          Please connect to a broker in Command Center to use this feature.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="builder-grid">
        {/* Strategy Templates */}
        <div className="builder-card templates-card">
          <h2>Strategy Templates</h2>
          <div className="templates-list">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="template-header">
                  <span className="template-name">{template.name}</span>
                  <span className={`risk-badge risk-${template.riskLevel}`}>
                    {template.riskLevel}
                  </span>
                </div>
                <p className="template-description">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signal Generator */}
        <div className="builder-card signal-card">
          <h2>Signal Generator</h2>

          <div className="signal-controls">
            <div className="form-group">
              <label>Symbol</label>
              <div className="symbol-select-wrapper">
                <input
                  type="text"
                  value={symbolSearch || symbol}
                  onChange={(e) => {
                    setSymbolSearch(e.target.value);
                    setShowSymbolDropdown(true);
                  }}
                  onFocus={() => setShowSymbolDropdown(true)}
                  placeholder="Search symbol..."
                />
                {showSymbolDropdown && (
                  <div className="symbol-dropdown">
                    {filteredStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="symbol-option"
                        onClick={() => handleSelectSymbol(stock.symbol)}
                      >
                        <span className="symbol-code">{stock.symbol}</span>
                        <span className="symbol-name">{stock.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Timeframe</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <option value="1Min">1 Minute</option>
                <option value="5Min">5 Minutes</option>
                <option value="15Min">15 Minutes</option>
                <option value="1Hour">1 Hour</option>
                <option value="1Day">1 Day</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateSignals}
              disabled={isLoadingSignals || !selectedTemplate || !isAlpacaConnected}
            >
              {isLoadingSignals ? 'Analyzing...' : 'Generate Signals'}
            </button>
          </div>

          {/* Signal Results */}
          {signals && (
            <div className="signal-results">
              <div className={`signal-badge ${getSignalColor(signals.signals?.signal)}`}>
                {signals.signals?.signal || 'HOLD'}
              </div>
              <div className="signal-confidence">
                Confidence: {signals.signals?.confidence?.toFixed(0) || 0}%
              </div>
              {signals.signals?.reasons?.length > 0 && (
                <div className="signal-reasons">
                  <h4>Analysis:</h4>
                  <ul>
                    {signals.signals.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Technical Indicators */}
        <div className="builder-card indicators-card">
          <h2>Technical Indicators</h2>
          {indicators ? (
            <div className="indicators-grid">
              {indicators.indicators?.rsi !== undefined && (
                <div className="indicator-item">
                  <span className="indicator-label">RSI (14)</span>
                  <span className={`indicator-value ${
                    indicators.indicators.rsi < 30 ? 'oversold' :
                    indicators.indicators.rsi > 70 ? 'overbought' : ''
                  }`}>
                    {indicators.indicators.rsi?.toFixed(2)}
                  </span>
                </div>
              )}
              {indicators.indicators?.macd && (
                <div className="indicator-item">
                  <span className="indicator-label">MACD</span>
                  <span className={`indicator-value ${
                    indicators.indicators.macd.histogram > 0 ? 'bullish' : 'bearish'
                  }`}>
                    {indicators.indicators.macd.histogram?.toFixed(4)}
                  </span>
                </div>
              )}
              {indicators.indicators?.sma && (
                <>
                  <div className="indicator-item">
                    <span className="indicator-label">SMA 20</span>
                    <span className="indicator-value">${indicators.indicators.sma.sma20?.toFixed(2)}</span>
                  </div>
                  <div className="indicator-item">
                    <span className="indicator-label">SMA 50</span>
                    <span className="indicator-value">${indicators.indicators.sma.sma50?.toFixed(2)}</span>
                  </div>
                </>
              )}
              {indicators.indicators?.bollinger && (
                <>
                  <div className="indicator-item">
                    <span className="indicator-label">BB Upper</span>
                    <span className="indicator-value">${indicators.indicators.bollinger.upper?.toFixed(2)}</span>
                  </div>
                  <div className="indicator-item">
                    <span className="indicator-label">BB Lower</span>
                    <span className="indicator-value">${indicators.indicators.bollinger.lower?.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="indicator-item highlight">
                <span className="indicator-label">Current Price</span>
                <span className="indicator-value">${indicators.currentPrice?.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="empty-state">Generate signals to view indicators</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilderPage;
