import React, { useState, useEffect, useCallback } from 'react';
import { brokersAPI } from '../api/brokers';
import { algoTradingAPI } from '../api/algoTrading';
import '../styles/pages/AnalyticsPage.css';

const AnalyticsPage = () => {
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  // Portfolio data
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeStrategies, setActiveStrategies] = useState([]);

  // Computed metrics
  const [metrics, setMetrics] = useState({
    totalReturn: 0,
    totalReturnPercent: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    bestTrade: null,
    worstTrade: null,
    avgHoldingPeriod: 0,
  });

  // Allocation data
  const [allocation, setAllocation] = useState([]);

  const checkBrokerStatus = useCallback(async () => {
    try {
      const response = await brokersAPI.getStatus();
      if (response?.success && response?.data?.totalConnected > 0) {
        setIsBrokerConnected(true);
        return true;
      }
      setIsBrokerConnected(false);
      return false;
    } catch (err) {
      setIsBrokerConnected(false);
      return false;
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!isBrokerConnected) return;

    setIsLoading(true);
    try {
      const [accountRes, positionsRes, ordersRes, strategiesRes] = await Promise.all([
        brokersAPI.getAccount(),
        brokersAPI.getPositions(),
        brokersAPI.getOrders('all'),
        algoTradingAPI.getActiveStrategies(),
      ]);

      if (accountRes.success) setAccount(accountRes.data);
      if (positionsRes.success) {
        setPositions(positionsRes.data || []);
        calculateAllocation(positionsRes.data || [], accountRes.data);
      }
      if (ordersRes.success) {
        setOrders(ordersRes.data || []);
        calculateMetrics(ordersRes.data || [], positionsRes.data || []);
      }
      if (strategiesRes.data?.success) {
        setActiveStrategies(strategiesRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isBrokerConnected]);

  useEffect(() => {
    const init = async () => {
      const connected = await checkBrokerStatus();
      if (connected) {
        await fetchData();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [checkBrokerStatus, fetchData]);

  const calculateAllocation = (positionsData, accountData) => {
    if (!positionsData.length || !accountData) {
      setAllocation([]);
      return;
    }

    const totalValue = accountData.portfolioValue || accountData.equity || 0;
    const allocData = positionsData.map((pos) => ({
      symbol: pos.symbol,
      value: pos.marketValue || 0,
      percent: totalValue > 0 ? ((pos.marketValue || 0) / totalValue) * 100 : 0,
      pnl: pos.unrealizedPL || 0,
      pnlPercent: pos.unrealizedPLPercent || 0,
    }));

    // Add cash allocation
    const totalPositions = allocData.reduce((sum, p) => sum + p.value, 0);
    const cashValue = totalValue - totalPositions;
    if (cashValue > 0) {
      allocData.push({
        symbol: 'Cash',
        value: cashValue,
        percent: (cashValue / totalValue) * 100,
        pnl: 0,
        pnlPercent: 0,
      });
    }

    setAllocation(allocData.sort((a, b) => b.value - a.value));
  };

  const calculateMetrics = (ordersData, positionsData) => {
    const filledOrders = ordersData.filter((o) => o.status?.toLowerCase() === 'filled');

    // Group orders by symbol to find paired trades
    const trades = [];
    const ordersBySymbol = {};

    filledOrders.forEach((order) => {
      if (!ordersBySymbol[order.symbol]) {
        ordersBySymbol[order.symbol] = [];
      }
      ordersBySymbol[order.symbol].push(order);
    });

    // Calculate trade P&L for completed round trips
    let totalProfit = 0;
    let totalLoss = 0;
    let winningCount = 0;
    let losingCount = 0;
    let bestTrade = null;
    let worstTrade = null;

    Object.entries(ordersBySymbol).forEach(([symbol, symbolOrders]) => {
      const buys = symbolOrders.filter((o) => o.side?.toLowerCase() === 'buy');
      const sells = symbolOrders.filter((o) => o.side?.toLowerCase() === 'sell');

      // Simple P&L calculation based on matched orders
      const minPairs = Math.min(buys.length, sells.length);
      for (let i = 0; i < minPairs; i++) {
        const buyPrice = parseFloat(buys[i].filled_avg_price) || 0;
        const sellPrice = parseFloat(sells[i].filled_avg_price) || 0;
        const qty = Math.min(parseFloat(buys[i].filled_qty) || 0, parseFloat(sells[i].filled_qty) || 0);
        const pnl = (sellPrice - buyPrice) * qty;

        trades.push({ symbol, pnl, buyPrice, sellPrice, qty });

        if (pnl > 0) {
          totalProfit += pnl;
          winningCount++;
        } else if (pnl < 0) {
          totalLoss += Math.abs(pnl);
          losingCount++;
        }

        if (!bestTrade || pnl > bestTrade.pnl) {
          bestTrade = { symbol, pnl };
        }
        if (!worstTrade || pnl < worstTrade.pnl) {
          worstTrade = { symbol, pnl };
        }
      }
    });

    // Include unrealized P&L from current positions
    const unrealizedPnL = positionsData.reduce((sum, pos) => sum + (pos.unrealizedPL || 0), 0);

    const totalReturn = totalProfit - totalLoss + unrealizedPnL;
    const totalTrades = winningCount + losingCount;
    const winRate = totalTrades > 0 ? (winningCount / totalTrades) * 100 : 0;
    const avgWin = winningCount > 0 ? totalProfit / winningCount : 0;
    const avgLoss = losingCount > 0 ? totalLoss / losingCount : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    setMetrics({
      totalReturn,
      totalReturnPercent: account?.portfolioValue ? (totalReturn / account.portfolioValue) * 100 : 0,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      sharpeRatio: calculateSharpeRatio(trades),
      maxDrawdown: calculateMaxDrawdown(trades),
      totalTrades,
      winningTrades: winningCount,
      losingTrades: losingCount,
      bestTrade,
      worstTrade,
      avgHoldingPeriod: 0,
    });
  };

  const calculateSharpeRatio = (trades) => {
    if (trades.length < 2) return 0;
    const returns = trades.map((t) => t.pnl);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  };

  const calculateMaxDrawdown = (trades) => {
    if (trades.length === 0) return 0;
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;

    trades.forEach((trade) => {
      runningPnL += trade.pnl;
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      const drawdown = peak > 0 ? ((peak - runningPnL) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (!isBrokerConnected && !isLoading) {
    return (
      <div className="analytics-page">
        <div className="connect-prompt">
          <div className="prompt-icon">📈</div>
          <h2>Connect to View Analytics</h2>
          <p>Connect to a broker in Command Center to view your performance analytics.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Performance Analytics</h1>
        </div>
        <div className="header-actions">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="365d">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchData}>
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className={`metric-card highlight ${metrics.totalReturn >= 0 ? 'positive' : 'negative'}`}>
          <span className="metric-label">Total Return</span>
          <span className="metric-value">{formatCurrency(metrics.totalReturn)}</span>
          <span className={`metric-change ${metrics.totalReturnPercent >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(metrics.totalReturnPercent)}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Win Rate</span>
          <span className="metric-value">{metrics.winRate.toFixed(1)}%</span>
          <span className="metric-detail">
            {metrics.winningTrades}W / {metrics.losingTrades}L
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Profit Factor</span>
          <span className="metric-value">
            {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Total Trades</span>
          <span className="metric-value">{metrics.totalTrades}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Avg Win</span>
          <span className="metric-value positive">{formatCurrency(metrics.avgWin)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Avg Loss</span>
          <span className="metric-value negative">{formatCurrency(metrics.avgLoss)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Max Drawdown</span>
          <span className="metric-value negative">{metrics.maxDrawdown.toFixed(2)}%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Sharpe Ratio</span>
          <span className="metric-value">{metrics.sharpeRatio.toFixed(2)}</span>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Portfolio Value */}
        <div className="analytics-card">
          <div className="card-header">
            <h2>Portfolio Summary</h2>
          </div>
          <div className="card-body">
            <div className="summary-stats">
              <div className="stat-row">
                <span className="stat-label">Portfolio Value</span>
                <span className="stat-value">{formatCurrency(account?.portfolioValue || account?.equity)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Buying Power</span>
                <span className="stat-value">{formatCurrency(account?.buyingPower)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Cash</span>
                <span className="stat-value">{formatCurrency(account?.cash)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Day Change</span>
                <span className={`stat-value ${(account?.dayChange || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(account?.dayChange)} ({formatPercent(account?.dayChangePercent)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Best/Worst Trades */}
        <div className="analytics-card">
          <div className="card-header">
            <h2>Trade Highlights</h2>
          </div>
          <div className="card-body">
            <div className="highlights">
              <div className="highlight-item best">
                <span className="highlight-label">Best Trade</span>
                {metrics.bestTrade ? (
                  <>
                    <span className="highlight-symbol">{metrics.bestTrade.symbol}</span>
                    <span className="highlight-value positive">{formatCurrency(metrics.bestTrade.pnl)}</span>
                  </>
                ) : (
                  <span className="no-data">No completed trades</span>
                )}
              </div>
              <div className="highlight-item worst">
                <span className="highlight-label">Worst Trade</span>
                {metrics.worstTrade ? (
                  <>
                    <span className="highlight-symbol">{metrics.worstTrade.symbol}</span>
                    <span className="highlight-value negative">{formatCurrency(metrics.worstTrade.pnl)}</span>
                  </>
                ) : (
                  <span className="no-data">No completed trades</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="analytics-card allocation-card">
          <div className="card-header">
            <h2>Portfolio Allocation</h2>
          </div>
          <div className="card-body">
            {allocation.length === 0 ? (
              <div className="empty-state">
                <p>No positions to display</p>
              </div>
            ) : (
              <div className="allocation-list">
                {allocation.map((item) => (
                  <div key={item.symbol} className="allocation-item">
                    <div className="allocation-info">
                      <span className="allocation-symbol">{item.symbol}</span>
                      <span className="allocation-value">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="allocation-bar-container">
                      <div
                        className={`allocation-bar ${item.symbol === 'Cash' ? 'cash' : ''}`}
                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                      ></div>
                    </div>
                    <div className="allocation-percent">{item.percent.toFixed(1)}%</div>
                    {item.symbol !== 'Cash' && (
                      <div className={`allocation-pnl ${item.pnl >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(item.pnlPercent)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Strategies Performance */}
        <div className="analytics-card strategies-card">
          <div className="card-header">
            <h2>Strategy Performance</h2>
          </div>
          <div className="card-body">
            {activeStrategies.length === 0 ? (
              <div className="empty-state">
                <p>No active strategies</p>
              </div>
            ) : (
              <div className="strategies-list">
                {activeStrategies.map((strategy) => (
                  <div key={strategy.id} className="strategy-perf-item">
                    <div className="strategy-info">
                      <span className="strategy-name">{strategy.type}</span>
                      <span className="strategy-symbol">{strategy.symbol}</span>
                    </div>
                    <div className="strategy-metrics">
                      <span className={`strategy-pnl ${(strategy.pnl || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(strategy.pnl || 0)}
                      </span>
                      <span className="strategy-trades">{strategy.trades || 0} trades</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
