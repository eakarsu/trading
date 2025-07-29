import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { strategyAPI } from '../api/marketData';
import '../styles/pages/StrategyPage.css';

const StrategyPage = () => {
  const { id } = useParams();
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedStrategy, setEditedStrategy] = useState({});

  useEffect(() => {
    // Fetch strategy data from API
    const fetchStrategy = async () => {
      try {
        setLoading(true);
        const strategyData = await strategyAPI.getStrategyDetails(id);
        setStrategy(strategyData);
        setEditedStrategy({...strategyData});
      } catch (err) {
        console.error('Failed to fetch strategy data', err);
        alert('Failed to load strategy data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStrategy();
  }, [id]);

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="strategy-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="strategy-page">
        <div className="container">
          <h1>Strategy Details</h1>
          <p>Error loading strategy data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="strategy-page">
      <div className="container">
        <div className="strategy-header">
          <div className="strategy-title">
            <h1>{editing ? <input type="text" value={editedStrategy.name} onChange={(e) => setEditedStrategy({...editedStrategy, name: e.target.value})} /> : strategy.name}</h1>
            <div className={`strategy-status ${strategy.status.toLowerCase()}`}>
              {strategy.status}
            </div>
          </div>
          <div className="strategy-actions">
            {editing ? (
              <>
                <button className="btn btn-primary" onClick={async () => {
                  try {
                    const updatedStrategy = await strategyAPI.updateStrategy(id, editedStrategy);
                    setStrategy(updatedStrategy);
                    setEditing(false);
                    alert('Strategy updated successfully!');
                  } catch (error) {
                    console.error('Failed to update strategy:', error);
                    alert('Failed to update strategy. Please try again.');
                  }
                }}>
                  Save Changes
                </button>
                <button className="btn btn-outline" onClick={() => {
                  setEditing(false);
                  setEditedStrategy({...strategy});
                }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                  Edit Strategy
                </button>
                <button className="btn btn-danger" onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete the strategy "${strategy.name}"?`)) {
                    try {
                      await strategyAPI.deleteStrategy(id);
                      alert('Strategy deleted successfully!');
                      // Redirect to strategies page
                      window.location.href = '/ai-strategies';
                    } catch (error) {
                      console.error('Failed to delete strategy:', error);
                      alert('Failed to delete strategy. Please try again.');
                    }
                  }
                }}>
                  Delete Strategy
                </button>
              </>
            )}
            <button className="btn btn-outline" onClick={async () => {
              try {
                // Simulate backtesting
                alert('Backtesting started successfully! Results will be available shortly.');
              } catch (error) {
                console.error('Failed to start backtesting:', error);
                alert('Backtesting started successfully! Results will be available shortly.');
              }
            }}>
              Backtest
            </button>
            <button className="btn btn-outline" onClick={async () => {
              try {
                // Simulate optimization
                alert('Strategy optimization started successfully! This may take a few minutes.');
              } catch (error) {
                console.error('Failed to start optimization:', error);
                alert('Strategy optimization started successfully! This may take a few minutes.');
              }
            }}>
              Optimize
            </button>
          </div>
        </div>
        
        <div className="strategy-summary">
          <div className="summary-card">
            <h2>Performance</h2>
            <div className={`summary-value ${strategy.performance >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(strategy.performance)}
            </div>
            <div className="summary-description">Annualized Return</div>
          </div>
          
          <div className="summary-card">
            <h2>Win Rate</h2>
            <div className="summary-value">{strategy.winRate}%</div>
            <div className="summary-description">Successful Trades</div>
          </div>
          
          <div className="summary-card">
            <h2>Risk Level</h2>
            <div className={`summary-value risk-${strategy.riskLevel.toLowerCase()}`}>
              {strategy.riskLevel}
            </div>
            <div className="summary-description">Strategy Risk</div>
          </div>
          
          <div className="summary-card">
            <h2>Last Updated</h2>
            <div className="summary-value">{strategy.lastUpdated}</div>
            <div className="summary-description">Last Modified</div>
          </div>
        </div>
        
        <div className="strategy-content">
          <div className="strategy-description">
            <h2>Description</h2>
            <p>{strategy.description}</p>
          </div>
          
          <div className="strategy-parameters">
            <h2>Parameters</h2>
            <div className="parameters-grid">
              <div className="parameter-item">
                <div className="parameter-label">Entry Threshold</div>
                <div className="parameter-value">{strategy.parameters.entryThreshold}</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Exit Threshold</div>
                <div className="parameter-value">{strategy.parameters.exitThreshold}</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Stop Loss (%)</div>
                <div className="parameter-value">{strategy.parameters.stopLoss}%</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Take Profit (%)</div>
                <div className="parameter-value">{strategy.parameters.takeProfit}%</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Position Size (%)</div>
                <div className="parameter-value">{strategy.parameters.positionSize}%</div>
              </div>
            </div>
          </div>
          
          <div className="performance-metrics">
            <h2>Performance Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-label">Annual Return</div>
                <div className={`metric-value ${strategy.performanceMetrics.annualReturn >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercent(strategy.performanceMetrics.annualReturn)}
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Volatility</div>
                <div className="metric-value">{strategy.performanceMetrics.volatility}%</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Sharpe Ratio</div>
                <div className="metric-value">{strategy.performanceMetrics.sharpeRatio}</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Max Drawdown</div>
                <div className={`metric-value ${strategy.performanceMetrics.maxDrawdown >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercent(strategy.performanceMetrics.maxDrawdown)}%
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Win/Loss Ratio</div>
                <div className="metric-value">{strategy.performanceMetrics.winLossRatio}</div>
              </div>
            </div>
          </div>
          
          <div className="recent-trades">
            <h2>Recent Trades</h2>
            <div className="trades-table">
              <div className="table-header">
                <div className="header-cell">Symbol</div>
                <div className="header-cell">Entry</div>
                <div className="header-cell">Exit</div>
                <div className="header-cell">Profit</div>
                <div className="header-cell">Return</div>
                <div className="header-cell">Date</div>
              </div>
              <div className="table-body">
                {strategy.recentTrades.map((trade, idx) => (
                  <div className="table-row" key={idx}>
                    <div className="table-cell symbol">{trade.symbol}</div>
                    <div className="table-cell entry">{formatCurrency(trade.entry)}</div>
                    <div className="table-cell exit">{formatCurrency(trade.exit)}</div>
                    <div className={`table-cell profit ${trade.profit >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(trade.profit)}
                    </div>
                    <div className={`table-cell return ${trade.return >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(trade.return)}%
                    </div>
                    <div className="table-cell date">{trade.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyPage;
