import React, { useState, useEffect, useRef, useCallback } from 'react';
import { algoTradingAPI } from '../api/algoTrading';
import { brokersAPI } from '../api/brokers';
import '../styles/pages/AlgoTradingPage.css';

const StrategyOptimizerPage = () => {
  const [isAlpacaConnected, setIsAlpacaConnected] = useState(false);
  const [error, setError] = useState(null);

  // Strategy Optimizer state
  const [optimizerStatus, setOptimizerStatus] = useState(null);
  const [optimizerSymbols, setOptimizerSymbols] = useState(['AAPL', 'TSLA', 'NVDA']);
  const [showOnlyConsensus, setShowOnlyConsensus] = useState(true);
  const [newOptimizerSymbol, setNewOptimizerSymbol] = useState('');
  const [isStartingOptimizer, setIsStartingOptimizer] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Top 50 Large-Cap Stocks
  const MAJOR_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
    'V', 'XOM', 'JPM', 'WMT', 'MA', 'PG', 'LLY', 'HD', 'CVX', 'MRK',
    'ABBV', 'KO', 'PEP', 'COST', 'AVGO', 'TMO', 'MCD', 'CSCO', 'ACN', 'ABT',
    'DHR', 'WFC', 'NEE', 'LIN', 'VZ', 'ADBE', 'NKE', 'TXN', 'PM', 'CRM',
    'BMY', 'RTX', 'QCOM', 'UPS', 'ORCL', 'MS', 'INTC', 'AMD', 'NFLX', 'DIS'
  ];

  const [optimizerConfig, setOptimizerConfig] = useState({
    profitThreshold: 0.5,
    confidenceThreshold: 50,
    checkIntervalMs: 30000,
    positionSizePercent: 10,
    timeframe: '1Min',
    consensusEnabled: true,
    minConsensusCount: 3,
    enabledStrategies: [
      'rsi_oversold', 'macd_crossover', 'bollinger_bounce', 'sma_crossover',
      'ema_crossover', 'volume_breakout', 'momentum', 'mean_reversion',
      'trend_following', 'support_resistance', 'rsi_divergence', 'macd_histogram',
      'parabolic_sar', 'stochastic', 'ichimoku',
      'obv', 'supertrend', 'donchian', 'keltner', 'mfi',
      'pivot_points', 'fibonacci', 'trix', 'aroon', 'roc'
    ],
  });

  // All available strategies (25 total)
  const allStrategies = [
    { id: 'rsi_oversold', name: 'RSI Oversold/Overbought', riskLevel: 'medium' },
    { id: 'macd_crossover', name: 'MACD Crossover', riskLevel: 'medium' },
    { id: 'bollinger_bounce', name: 'Bollinger Band Bounce', riskLevel: 'medium' },
    { id: 'sma_crossover', name: 'SMA Crossover', riskLevel: 'low' },
    { id: 'ema_crossover', name: 'EMA Crossover', riskLevel: 'medium' },
    { id: 'volume_breakout', name: 'Volume Breakout', riskLevel: 'high' },
    { id: 'momentum', name: 'Momentum', riskLevel: 'high' },
    { id: 'mean_reversion', name: 'Mean Reversion', riskLevel: 'medium' },
    { id: 'trend_following', name: 'Trend Following', riskLevel: 'medium' },
    { id: 'support_resistance', name: 'Support/Resistance', riskLevel: 'low' },
    { id: 'rsi_divergence', name: 'RSI Divergence', riskLevel: 'medium' },
    { id: 'macd_histogram', name: 'MACD Histogram', riskLevel: 'medium' },
    { id: 'parabolic_sar', name: 'Parabolic SAR', riskLevel: 'high' },
    { id: 'stochastic', name: 'Stochastic Oscillator', riskLevel: 'medium' },
    { id: 'ichimoku', name: 'Ichimoku Cloud', riskLevel: 'medium' },
    { id: 'obv', name: 'OBV (On-Balance Volume)', riskLevel: 'medium' },
    { id: 'supertrend', name: 'SuperTrend', riskLevel: 'medium' },
    { id: 'donchian', name: 'Donchian Channel', riskLevel: 'high' },
    { id: 'keltner', name: 'Keltner Channel', riskLevel: 'medium' },
    { id: 'mfi', name: 'MFI (Money Flow Index)', riskLevel: 'medium' },
    { id: 'pivot_points', name: 'Pivot Points', riskLevel: 'low' },
    { id: 'fibonacci', name: 'Fibonacci Retracement', riskLevel: 'medium' },
    { id: 'trix', name: 'TRIX', riskLevel: 'low' },
    { id: 'aroon', name: 'Aroon Indicator', riskLevel: 'medium' },
    { id: 'roc', name: 'Rate of Change (ROC)', riskLevel: 'medium' },
  ];

  // Refs for auto-refresh
  const analysisIntervalRef = useRef(null);
  const autoRefreshConfigRef = useRef(optimizerConfig);
  const autoRefreshSymbolsRef = useRef(optimizerSymbols);

  useEffect(() => {
    checkAlpacaStatus();
    loadOptimizerStatus();
  }, []);

  useEffect(() => {
    autoRefreshConfigRef.current = optimizerConfig;
  }, [optimizerConfig]);

  useEffect(() => {
    autoRefreshSymbolsRef.current = optimizerSymbols;
  }, [optimizerSymbols]);

  // Auto-refresh when optimizer is running
  useEffect(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    if (optimizerStatus?.isRunning && isAlpacaConnected && optimizerSymbols.length > 0) {
      const refreshInterval = optimizerConfig.checkIntervalMs || 30000;

      analysisIntervalRef.current = setInterval(async () => {
        const config = autoRefreshConfigRef.current;
        const symbols = autoRefreshSymbolsRef.current;

        setIsRefreshing(true);

        try {
          const response = await algoTradingAPI.runAnalysis(symbols, config);
          if (response.data.success) {
            setAnalysisResults(response.data.data);
            setLastUpdateTime(new Date());
          }
        } catch (err) {
          console.error('[Auto-Refresh] Error:', err);
        } finally {
          setTimeout(() => setIsRefreshing(false), 500);
        }
      }, refreshInterval);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [optimizerStatus?.isRunning, isAlpacaConnected, optimizerSymbols.length, optimizerConfig.checkIntervalMs]);

  const checkAlpacaStatus = async () => {
    try {
      const response = await brokersAPI.getStatus();
      setIsAlpacaConnected(response?.success && response?.data?.totalConnected > 0);
    } catch (err) {
      setIsAlpacaConnected(false);
    }
  };

  const loadOptimizerStatus = async () => {
    try {
      const response = await algoTradingAPI.getOptimizerStatus();
      setOptimizerStatus(response.data.data);
    } catch (err) {
      console.error('Error loading optimizer status:', err);
    }
  };

  const toggleStrategy = (strategyId) => {
    setOptimizerConfig(prev => {
      const enabled = prev.enabledStrategies.includes(strategyId);
      return {
        ...prev,
        enabledStrategies: enabled
          ? prev.enabledStrategies.filter(id => id !== strategyId)
          : [...prev.enabledStrategies, strategyId]
      };
    });
  };

  const handleStartOptimizer = async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to a broker in Command Center first');
      return;
    }

    if (optimizerSymbols.length === 0) {
      setError('Please add at least one symbol to monitor');
      return;
    }

    setIsStartingOptimizer(true);
    setError(null);

    try {
      const response = await algoTradingAPI.startOptimizer(optimizerSymbols, optimizerConfig);
      setOptimizerStatus(response.data.data);

      const analysisResponse = await algoTradingAPI.runAnalysis(optimizerSymbols, optimizerConfig);
      setAnalysisResults(analysisResponse.data.data);
      setLastUpdateTime(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start optimizer');
    } finally {
      setIsStartingOptimizer(false);
    }
  };

  const handleStopOptimizer = async () => {
    try {
      await algoTradingAPI.stopOptimizer();
      setOptimizerStatus(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop optimizer');
    }
  };

  const handleRunAnalysis = async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to a broker in Command Center first');
      return;
    }

    if (optimizerSymbols.length === 0) {
      setError('Please add at least one symbol to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);

    try {
      const response = await algoTradingAPI.runAnalysis(optimizerSymbols, optimizerConfig);
      setAnalysisResults(response.data.data);
      setLastUpdateTime(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddOptimizerSymbol = () => {
    const sym = newOptimizerSymbol.trim().toUpperCase();
    if (sym && !optimizerSymbols.includes(sym)) {
      setOptimizerSymbols([...optimizerSymbols, sym]);
      setNewOptimizerSymbol('');
    }
  };

  const handleLoadMajorStocks = () => {
    setOptimizerSymbols(MAJOR_STOCKS);
  };

  const handleClearSymbols = () => {
    setOptimizerSymbols([]);
  };

  const handleRemoveOptimizerSymbol = (sym) => {
    setOptimizerSymbols(optimizerSymbols.filter((s) => s !== sym));
  };

  return (
    <div className="algo-trading-page">
      <div className="page-header">
        <h1>Strategy Optimizer</h1>
        <p>Real-time multi-strategy analysis with consensus-based signals</p>
        <span className={`connection-badge ${isAlpacaConnected ? 'connected' : 'disconnected'}`}>
          {isAlpacaConnected ? 'Broker Connected' : 'Broker Disconnected'}
        </span>
      </div>

      {!isAlpacaConnected && (
        <div className="alert alert-warning">
          Please connect to a broker in Command Center to use the optimizer.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="optimizer-grid">
        {/* Configuration Card */}
        <div className="optimizer-card config-card">
          <h3>Configuration</h3>

          {/* Symbols to Monitor */}
          <div className="config-section">
            <label>Symbols to Monitor</label>
            <div className="symbol-tags">
              {optimizerSymbols.map((sym) => (
                <span key={sym} className="symbol-tag">
                  {sym}
                  <button onClick={() => handleRemoveOptimizerSymbol(sym)}>x</button>
                </span>
              ))}
            </div>
            <div className="add-symbol-row">
              <input
                type="text"
                placeholder="Add symbol (e.g., GOOGL)"
                value={newOptimizerSymbol}
                onChange={(e) => setNewOptimizerSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleAddOptimizerSymbol()}
              />
              <button className="btn btn-secondary btn-sm" onClick={handleAddOptimizerSymbol}>
                Add
              </button>
            </div>
            <div className="symbol-actions">
              <button className="btn btn-primary btn-sm" onClick={handleLoadMajorStocks}>
                Load 50 Major Stocks
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleClearSymbols}>
                Clear All
              </button>
              <span className="symbol-count">{optimizerSymbols.length} symbols</span>
            </div>
          </div>

          {/* Profit Threshold */}
          <div className="config-section">
            <label>Profit Threshold (%)</label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={optimizerConfig.profitThreshold}
              onChange={(e) =>
                setOptimizerConfig((prev) => ({
                  ...prev,
                  profitThreshold: parseFloat(e.target.value),
                }))
              }
            />
            <small>Only execute trades with expected profit above this %</small>
          </div>

          {/* Confidence Threshold */}
          <div className="config-section">
            <label>Confidence Threshold (%)</label>
            <input
              type="number"
              min="50"
              max="100"
              step="5"
              value={optimizerConfig.confidenceThreshold}
              onChange={(e) =>
                setOptimizerConfig((prev) => ({
                  ...prev,
                  confidenceThreshold: parseInt(e.target.value),
                }))
              }
            />
            <small>Minimum signal confidence required</small>
          </div>

          {/* Position Size */}
          <div className="config-section">
            <label>Position Size (%)</label>
            <input
              type="number"
              min="1"
              max="50"
              step="1"
              value={optimizerConfig.positionSizePercent}
              onChange={(e) =>
                setOptimizerConfig((prev) => ({
                  ...prev,
                  positionSizePercent: parseInt(e.target.value),
                }))
              }
            />
            <small>% of buying power per trade</small>
          </div>

          {/* Timeframe */}
          <div className="config-section">
            <label>Timeframe (Day Trading)</label>
            <select
              value={optimizerConfig.timeframe}
              onChange={(e) =>
                setOptimizerConfig((prev) => ({
                  ...prev,
                  timeframe: e.target.value,
                }))
              }
            >
              <option value="1Min">1 Minute (Real-time)</option>
              <option value="5Min">5 Minutes</option>
              <option value="15Min">15 Minutes</option>
            </select>
            <small>Uses today's intraday data only</small>
          </div>

          {/* Check Interval */}
          <div className="config-section">
            <label>Check Interval</label>
            <select
              value={optimizerConfig.checkIntervalMs}
              onChange={(e) =>
                setOptimizerConfig((prev) => ({
                  ...prev,
                  checkIntervalMs: parseInt(e.target.value),
                }))
              }
            >
              <option value={15000}>15 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={300000}>5 minutes</option>
            </select>
          </div>

          {/* Consensus Configuration */}
          <div className="config-section consensus-config">
            <label>
              <input
                type="checkbox"
                checked={optimizerConfig.consensusEnabled}
                onChange={(e) =>
                  setOptimizerConfig((prev) => ({
                    ...prev,
                    consensusEnabled: e.target.checked,
                  }))
                }
              />
              Enable Consensus Mode
            </label>
            <small>BUY only when multiple strategies agree</small>
          </div>

          {optimizerConfig.consensusEnabled && (
            <>
              <div className="config-section">
                <label>Min Strategies to Agree</label>
                <select
                  value={optimizerConfig.minConsensusCount}
                  onChange={(e) =>
                    setOptimizerConfig((prev) => ({
                      ...prev,
                      minConsensusCount: parseInt(e.target.value),
                    }))
                  }
                >
                  <option value={0}>0 (Show all with any signal)</option>
                  <option value={1}>1 strategy</option>
                  {[...Array(15)].map((_, i) => (
                    <option key={i + 2} value={i + 2}>
                      {i + 2} strategies
                    </option>
                  ))}
                </select>
              </div>

              <div className="strategy-selector">
                <label>Select Strategies for Consensus ({optimizerConfig.enabledStrategies.length} selected)</label>
                <div className="strategy-grid">
                  {allStrategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className={`strategy-chip ${optimizerConfig.enabledStrategies.includes(strategy.id) ? 'selected' : ''} risk-${strategy.riskLevel}`}
                      onClick={() => toggleStrategy(strategy.id)}
                    >
                      <span className="strategy-name">{strategy.name}</span>
                      <span className={`risk-badge ${strategy.riskLevel}`}>{strategy.riskLevel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="optimizer-actions">
            <button
              className="btn btn-primary"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !isAlpacaConnected}
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis (Test)'}
            </button>

            {optimizerStatus?.isRunning ? (
              <button className="btn btn-danger" onClick={handleStopOptimizer}>
                Stop Optimizer
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleStartOptimizer}
                disabled={isStartingOptimizer || !isAlpacaConnected}
              >
                {isStartingOptimizer ? 'Starting...' : 'Start Auto-Optimizer'}
              </button>
            )}
          </div>
        </div>

        {/* Analysis Results Card */}
        <div className="optimizer-card results-card">
          <h3>Analysis Results</h3>

          {isAnalyzing && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Running all 25 strategies on {optimizerSymbols.length} symbols...</p>
            </div>
          )}

          {!isAnalyzing && analysisResults && (
            <div className="analysis-results">
              {/* Last Updated Timestamp */}
              <div className={`last-updated-banner ${isRefreshing ? 'refreshing' : ''}`}>
                <span className="pulse-indicator"></span>
                <strong>Last Updated:</strong>{' '}
                {isRefreshing ? (
                  <span className="refreshing-text">Refreshing...</span>
                ) : (
                  <span className="timestamp">{lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'N/A'}</span>
                )}
                {optimizerStatus?.isRunning && (
                  <span className="auto-refresh-badge">Auto-refreshing every {optimizerConfig.checkIntervalMs / 1000}s</span>
                )}
              </div>

              {/* Filter Toggle */}
              <div className="filter-toggle-bar">
                <label className="filter-toggle">
                  <input
                    type="checkbox"
                    checked={showOnlyConsensus}
                    onChange={(e) => setShowOnlyConsensus(e.target.checked)}
                  />
                  <span>Show only stocks with consensus (BUY/SELL signals)</span>
                </label>
                <div className="filter-stats">
                  {(() => {
                    const matchingStocks = Object.entries(analysisResults).filter(([, r]) => {
                      if (optimizerConfig.minConsensusCount === 0) {
                        return (r.consensus?.buyCount > 0 || r.consensus?.sellCount > 0);
                      }
                      return r.consensus?.consensusMet && r.consensus?.recommendation !== 'HOLD';
                    });
                    return (
                      <span className="consensus-count">
                        <strong>{matchingStocks.length}</strong> of {Object.keys(analysisResults).length} stocks
                        {optimizerConfig.minConsensusCount === 0 ? ' have signals' : ' have consensus'}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Filtered Analysis Results */}
              {Object.entries(analysisResults)
                .filter(([, result]) => {
                  if (!showOnlyConsensus) return true;
                  if (optimizerConfig.minConsensusCount === 0) {
                    return (result.consensus?.buyCount > 0 || result.consensus?.sellCount > 0);
                  }
                  return result.consensus?.consensusMet && result.consensus?.recommendation !== 'HOLD';
                })
                .map(([sym, result]) => (
                <div key={sym} className="symbol-analysis">
                  <div className="symbol-header">
                    <h4>{sym}</h4>
                    <div className="price-info">
                      <span className="price">${result.currentPrice?.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Day Change Stats */}
                  <div className="day-stats">
                    <span className="stat">
                      Open: <strong>${result.openPrice?.toFixed(2)}</strong>
                    </span>
                    <span className={`stat change ${parseFloat(result.dayChangePercent) >= 0 ? 'positive' : 'negative'}`}>
                      Day: <strong>{parseFloat(result.dayChangePercent) >= 0 ? '+' : ''}{result.dayChangePercent}%</strong>
                    </span>
                    <span className="stat">
                      {result.barsAnalyzed || 0} bars ({result.timeframe || '1Min'})
                    </span>
                  </div>

                  {result.error && (
                    <div className="error-message">
                      <p>{result.error}</p>
                    </div>
                  )}

                  {/* Best Strategy Winner */}
                  {result.bestStrategy && (
                    <div className="winner-card">
                      <div className="winner-badge">BEST STRATEGY TODAY</div>
                      <div className="winner-details">
                        <div className="strategy-name">{result.bestStrategy.strategyName}</div>
                        <div className="winner-stats">
                          <span className={`profit ${result.bestStrategy.profit >= 0 ? 'positive' : 'negative'}`}>
                            {result.bestStrategy.profit >= 0 ? '+' : ''}{result.bestStrategy.profit?.toFixed(2)}% profit
                          </span>
                          <span className="trades">{result.bestStrategy.totalTrades} trades</span>
                          <span className="winrate">{result.bestStrategy.winRate?.toFixed(0)}% win rate</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Consensus Recommendation */}
                  {result.consensus && (
                    <div className={`consensus-card ${result.consensus.recommendation.toLowerCase()}`}>
                      <div className="consensus-header">
                        <span className="consensus-label">CONSENSUS RECOMMENDATION</span>
                        <span className={`consensus-signal ${result.consensus.recommendation.toLowerCase()}`}>
                          {result.consensus.recommendation}
                        </span>
                      </div>
                      <div className="consensus-details">
                        <div className="consensus-counts">
                          <span className="count buy">
                            <strong>{result.consensus.buyCount}</strong> BUY
                          </span>
                          <span className="count sell">
                            <strong>{result.consensus.sellCount}</strong> SELL
                          </span>
                          <span className="count hold">
                            <strong>{result.consensus.holdCount}</strong> HOLD
                          </span>
                        </div>
                        <div className="consensus-status">
                          {result.consensus.enabled ? (
                            result.consensus.consensusMet ? (
                              <span className="status met">
                                Consensus Met ({result.consensus.consensusStrength}% agree)
                              </span>
                            ) : (
                              <span className="status not-met">
                                Need {result.consensus.minRequired} strategies to agree (have {Math.max(result.consensus.buyCount, result.consensus.sellCount)})
                              </span>
                            )
                          ) : (
                            <span className="status disabled">Consensus mode disabled</span>
                          )}
                        </div>
                        {result.consensus.buyStrategies?.length > 0 && (
                          <div className="consensus-strategies">
                            <span className="label">Buying:</span>
                            <span className="strategies">{result.consensus.buyStrategies.join(', ')}</span>
                          </div>
                        )}
                        {result.consensus.sellStrategies?.length > 0 && (
                          <div className="consensus-strategies">
                            <span className="label">Selling:</span>
                            <span className="strategies">{result.consensus.sellStrategies.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Strategy Performance */}
                  <div className="top-strategies">
                    <strong>Strategy Performance Today:</strong>
                    {result.strategyProfits?.length > 0 ? (
                      result.strategyProfits.slice(0, 8).map((s, i) => (
                        <div key={i} className={`strategy-row ${s.profit > 0 ? 'profitable' : s.profit < 0 ? 'losing' : ''}`}>
                          <span className="rank">#{i + 1}</span>
                          <span className="name">{s.strategyName}</span>
                          <span className={`profit ${s.profit >= 0 ? 'positive' : 'negative'}`}>
                            {s.profit >= 0 ? '+' : ''}{s.profit?.toFixed(2)}%
                          </span>
                          <span className="trades">{s.totalTrades} trades</span>
                          <span className="winrate">{s.winRate?.toFixed(0)}% win</span>
                        </div>
                      ))
                    ) : (
                      <p className="no-data">No strategy data</p>
                    )}
                  </div>
                </div>
              ))}

              {/* No consensus stocks message */}
              {showOnlyConsensus && Object.entries(analysisResults).filter(([, r]) => {
                if (optimizerConfig.minConsensusCount === 0) {
                  return (r.consensus?.buyCount > 0 || r.consensus?.sellCount > 0);
                }
                return r.consensus?.consensusMet && r.consensus?.recommendation !== 'HOLD';
              }).length === 0 && (
                <div className="no-consensus-stocks">
                  <p>
                    {optimizerConfig.minConsensusCount === 0
                      ? 'No stocks currently have any BUY/SELL signals.'
                      : 'No stocks currently have consensus (BUY/SELL) signals.'}
                  </p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    Uncheck the filter above to see all {Object.keys(analysisResults).length} stocks.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isAnalyzing && !analysisResults && (
            <div className="empty-state">
              <p>Click "Run Analysis" to test all strategies on your symbols</p>
            </div>
          )}
        </div>

        {/* Status Card */}
        {optimizerStatus?.isRunning && (
          <div className="optimizer-card status-card">
            <h3>Optimizer Status</h3>
            <div className="status-running">
              <div className="pulse-dot"></div>
              <span>Running</span>
            </div>
            <div className="status-details">
              <p><strong>Symbols:</strong> {optimizerStatus.monitoredSymbols?.join(', ')}</p>
              <p><strong>Check Interval:</strong> {optimizerStatus.config?.checkIntervalMs / 1000}s</p>
              <p><strong>Recent Trades:</strong> {optimizerStatus.recentTrades?.length || 0}</p>
            </div>

            {optimizerStatus.recentTrades?.length > 0 && (
              <div className="recent-trades">
                <h4>Recent Executed Trades</h4>
                {optimizerStatus.recentTrades.slice(-5).map((trade, i) => (
                  <div key={i} className="trade-row">
                    <span className={`side ${trade.side.toLowerCase()}`}>{trade.side}</span>
                    <span className="symbol">{trade.symbol}</span>
                    <span className="shares">{trade.shares} shares</span>
                    <span className="strategy">{trade.strategy}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyOptimizerPage;
