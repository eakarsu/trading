import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { brokersAPI } from '../api/brokers';
import { algoTradingAPI } from '../api/algoTrading';
import '../styles/pages/DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [activeBroker, setActiveBroker] = useState(null);

  // Data state
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeStrategies, setActiveStrategies] = useState([]);

  // Detail modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailType, setDetailType] = useState('');

  // Watchlist state
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    ];
  });
  const [newSymbol, setNewSymbol] = useState('');
  const [watchlistPrices, setWatchlistPrices] = useState({});

  // Check broker status
  const checkBrokerStatus = useCallback(async () => {
    try {
      const response = await brokersAPI.getStatus();
      if (response?.success && response?.data?.totalConnected > 0) {
        setIsBrokerConnected(true);
        setActiveBroker(response.data.activeBroker);
        return true;
      }
      setIsBrokerConnected(false);
      return false;
    } catch (err) {
      setIsBrokerConnected(false);
      return false;
    }
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
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
      if (positionsRes.success) setPositions(positionsRes.data || []);
      if (ordersRes.success) setRecentOrders((ordersRes.data || []).slice(0, 10));
      if (strategiesRes.data?.success) setActiveStrategies(strategiesRes.data.data || []);

      // Fetch watchlist prices
      fetchWatchlistPrices();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isBrokerConnected]);

  // Fetch watchlist prices
  const fetchWatchlistPrices = async () => {
    const prices = {};
    for (const item of watchlist) {
      try {
        const response = await brokersAPI.getQuote(item.symbol);
        if (response.success) {
          prices[item.symbol] = response.data;
        }
      } catch (err) {
        console.error(`Failed to get quote for ${item.symbol}:`, err);
      }
    }
    setWatchlistPrices(prices);
  };

  useEffect(() => {
    const init = async () => {
      const connected = await checkBrokerStatus();
      if (connected) {
        await fetchDashboardData();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [checkBrokerStatus, fetchDashboardData]);

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Add to watchlist
  const handleAddToWatchlist = () => {
    if (!newSymbol.trim()) return;
    const symbol = newSymbol.toUpperCase().trim();
    if (!watchlist.find(w => w.symbol === symbol)) {
      setWatchlist([...watchlist, { symbol, name: symbol }]);
      setNewSymbol('');
    }
  };

  // Remove from watchlist
  const handleRemoveFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(w => w.symbol !== symbol));
  };

  // Open detail modal
  const openDetail = (item, type) => {
    setSelectedItem(item);
    setDetailType(type);
  };

  // Close detail modal
  const closeDetail = () => {
    setSelectedItem(null);
    setDetailType('');
  };

  // Handle delete from detail modal
  const handleDetailDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm(`Are you sure you want to delete this ${detailType}?`)) return;

    try {
      if (detailType === 'position') {
        await brokersAPI.closePosition(selectedItem.symbol);
        setPositions(positions.filter(p => p.symbol !== selectedItem.symbol));
      } else if (detailType === 'order') {
        await brokersAPI.cancelOrder(selectedItem.id);
        setRecentOrders(recentOrders.filter(o => o.id !== selectedItem.id));
      } else if (detailType === 'strategy') {
        await algoTradingAPI.stopAutoTrade(selectedItem.id);
        setActiveStrategies(activeStrategies.filter(s => s.id !== selectedItem.id));
      }
      closeDetail();
    } catch (err) {
      console.error(`Failed to delete ${detailType}:`, err);
      alert(`Failed to delete ${detailType}. Please try again.`);
    }
  };

  // Handle edit from detail modal - navigate to appropriate page
  const handleDetailEdit = () => {
    if (!selectedItem) return;
    if (detailType === 'position') {
      navigate('/command-center');
    } else if (detailType === 'order') {
      navigate('/command-center');
    } else if (detailType === 'strategy') {
      navigate('/auto-trading');
    }
    closeDetail();
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
    return `${sign}${value.toFixed(2)}%`;
  };

  // Detail Modal
  const renderDetailModal = () => {
    if (!selectedItem || !detailType) return null;

    return (
      <div className="detail-modal-overlay" onClick={closeDetail}>
        <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="detail-modal-header">
            <h2>
              {detailType === 'position' && `Position: ${selectedItem.symbol}`}
              {detailType === 'order' && `Order: ${selectedItem.symbol}`}
              {detailType === 'strategy' && `Strategy: ${selectedItem.type || selectedItem.name}`}
              {detailType === 'watchlist' && `Watchlist: ${selectedItem.symbol}`}
            </h2>
            <button className="detail-modal-close" onClick={closeDetail}>×</button>
          </div>
          <div className="detail-modal-body">
            {detailType === 'position' && (
              <div className="detail-grid">
                <div className="detail-row"><span className="detail-label">Symbol</span><span className="detail-value">{selectedItem.symbol}</span></div>
                <div className="detail-row"><span className="detail-label">Quantity</span><span className="detail-value">{selectedItem.qty} shares</span></div>
                <div className="detail-row"><span className="detail-label">Avg Entry Price</span><span className="detail-value">{formatCurrency(selectedItem.avgEntryPrice)}</span></div>
                <div className="detail-row"><span className="detail-label">Current Price</span><span className="detail-value">{formatCurrency(selectedItem.currentPrice)}</span></div>
                <div className="detail-row"><span className="detail-label">Market Value</span><span className="detail-value">{formatCurrency(selectedItem.marketValue)}</span></div>
                <div className="detail-row"><span className="detail-label">Unrealized P&L</span><span className={`detail-value ${selectedItem.unrealizedPL >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(selectedItem.unrealizedPL)}</span></div>
                <div className="detail-row"><span className="detail-label">P&L %</span><span className={`detail-value ${selectedItem.unrealizedPLPercent >= 0 ? 'positive' : 'negative'}`}>{formatPercent(selectedItem.unrealizedPLPercent)}</span></div>
                <div className="detail-row"><span className="detail-label">Side</span><span className="detail-value">{selectedItem.side || 'long'}</span></div>
              </div>
            )}
            {detailType === 'order' && (
              <div className="detail-grid">
                <div className="detail-row"><span className="detail-label">Order ID</span><span className="detail-value">{selectedItem.id}</span></div>
                <div className="detail-row"><span className="detail-label">Symbol</span><span className="detail-value">{selectedItem.symbol}</span></div>
                <div className="detail-row"><span className="detail-label">Side</span><span className="detail-value">{selectedItem.side?.toUpperCase()}</span></div>
                <div className="detail-row"><span className="detail-label">Quantity</span><span className="detail-value">{selectedItem.qty}</span></div>
                <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value">{selectedItem.type}</span></div>
                <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{selectedItem.status}</span></div>
                <div className="detail-row"><span className="detail-label">Filled Price</span><span className="detail-value">{formatCurrency(selectedItem.filledAvgPrice || selectedItem.filled_avg_price)}</span></div>
                <div className="detail-row"><span className="detail-label">Created</span><span className="detail-value">{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : 'N/A'}</span></div>
              </div>
            )}
            {detailType === 'strategy' && (
              <div className="detail-grid">
                <div className="detail-row"><span className="detail-label">Strategy ID</span><span className="detail-value">{selectedItem.id}</span></div>
                <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value">{selectedItem.type}</span></div>
                <div className="detail-row"><span className="detail-label">Symbol</span><span className="detail-value">{selectedItem.symbol}</span></div>
                <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value">{selectedItem.status}</span></div>
                <div className="detail-row"><span className="detail-label">Interval</span><span className="detail-value">{selectedItem.interval || 'N/A'}</span></div>
                <div className="detail-row"><span className="detail-label">Trades</span><span className="detail-value">{selectedItem.trades || 0}</span></div>
              </div>
            )}
            {detailType === 'watchlist' && (
              <div className="detail-grid">
                <div className="detail-row"><span className="detail-label">Symbol</span><span className="detail-value">{selectedItem.symbol}</span></div>
                <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{selectedItem.name}</span></div>
                {watchlistPrices[selectedItem.symbol] && (
                  <>
                    <div className="detail-row"><span className="detail-label">Price</span><span className="detail-value">{formatCurrency(watchlistPrices[selectedItem.symbol].price || watchlistPrices[selectedItem.symbol].last)}</span></div>
                    <div className="detail-row"><span className="detail-label">Change</span><span className={`detail-value ${(watchlistPrices[selectedItem.symbol].changePercent || 0) >= 0 ? 'positive' : 'negative'}`}>{formatPercent(watchlistPrices[selectedItem.symbol].changePercent || 0)}</span></div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="detail-modal-footer">
            <button className="btn btn-primary" onClick={handleDetailEdit}>Edit</button>
            <button className="btn btn-danger" onClick={handleDetailDelete}>Delete</button>
            <button className="btn btn-secondary" onClick={closeDetail}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // If not connected, show connect prompt
  if (!isBrokerConnected && !isLoading) {
    return (
      <div className="dashboard-page">
        <div className="connect-prompt">
          <div className="prompt-icon">🔗</div>
          <h2>Connect to a Broker</h2>
          <p>Connect to your broker to view your dashboard and start trading.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/command-center')}>
            Go to Command Center
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPL || 0), 0);

  return (
    <div className="dashboard-page">
      {renderDetailModal()}

      <div className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <span className="broker-badge">{activeBroker?.toUpperCase()} Connected</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchDashboardData}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/command-center')}>
            Trade
          </button>
        </div>
      </div>

      {/* Portfolio Summary Cards - Clickable */}
      <div className="summary-grid">
        <div className="summary-card primary clickable" onClick={() => navigate('/portfolio')}>
          <div className="card-icon">💰</div>
          <div className="card-content">
            <span className="card-label">Portfolio Value</span>
            <span className="card-value">{formatCurrency(account?.portfolioValue || account?.equity)}</span>
            <span className={`card-change ${(account?.dayChange || 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(account?.dayChange || 0)} ({formatPercent(account?.dayChangePercent || 0)}) today
            </span>
          </div>
        </div>

        <div className="summary-card clickable" onClick={() => navigate('/command-center')}>
          <div className="card-icon">💵</div>
          <div className="card-content">
            <span className="card-label">Buying Power</span>
            <span className="card-value">{formatCurrency(account?.buyingPower)}</span>
          </div>
        </div>

        <div className="summary-card clickable" onClick={() => navigate('/portfolio')}>
          <div className="card-icon">🏦</div>
          <div className="card-content">
            <span className="card-label">Cash</span>
            <span className="card-value">{formatCurrency(account?.cash)}</span>
          </div>
        </div>

        <div className="summary-card clickable" onClick={() => navigate('/analytics')}>
          <div className="card-icon">📈</div>
          <div className="card-content">
            <span className="card-label">Unrealized P&L</span>
            <span className={`card-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(totalPnL)}
            </span>
          </div>
        </div>

        <div className="summary-card clickable" onClick={() => navigate('/auto-trading')}>
          <div className="card-icon">🤖</div>
          <div className="card-content">
            <span className="card-label">Active Strategies</span>
            <span className="card-value">{activeStrategies.length}</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Positions - Clickable card header + clickable rows */}
        <div className="dashboard-card positions-card">
          <div className="card-header">
            <h2>Positions ({positions.length})</h2>
            <button className="btn btn-sm btn-link" onClick={() => navigate('/command-center')}>
              View All
            </button>
          </div>
          <div className="card-body">
            {positions.length === 0 ? (
              <div className="empty-state">
                <p>No open positions</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/command-center')}>
                  Place Trade
                </button>
              </div>
            ) : (
              <div className="positions-list">
                {positions.slice(0, 5).map((pos) => (
                  <div key={pos.symbol} className="position-item clickable-row" onClick={() => openDetail(pos, 'position')}>
                    <div className="position-info">
                      <span className="symbol">{pos.symbol}</span>
                      <span className="qty">{pos.qty} shares @ {formatCurrency(pos.avgEntryPrice)}</span>
                    </div>
                    <div className="position-value">
                      <span className="market-value">{formatCurrency(pos.marketValue)}</span>
                      <span className={`pnl ${pos.unrealizedPL >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(pos.unrealizedPL)} ({formatPercent(pos.unrealizedPLPercent)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Strategies - Clickable card + clickable rows */}
        <div className="dashboard-card strategies-card">
          <div className="card-header">
            <h2>Active Strategies</h2>
            <button className="btn btn-sm btn-link" onClick={() => navigate('/auto-trading')}>
              Manage
            </button>
          </div>
          <div className="card-body">
            {activeStrategies.length === 0 ? (
              <div className="empty-state">
                <p>No active strategies</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/auto-trading')}>
                  Start Auto Trading
                </button>
              </div>
            ) : (
              <div className="strategies-list">
                {activeStrategies.slice(0, 5).map((strategy) => (
                  <div key={strategy.id} className="strategy-item clickable-row" onClick={() => openDetail(strategy, 'strategy')}>
                    <div className="strategy-info">
                      <span className="strategy-name">{strategy.type}</span>
                      <span className="strategy-symbol">{strategy.symbol}</span>
                    </div>
                    <div className="strategy-status">
                      <span className={`status ${strategy.status?.toLowerCase()}`}>
                        {strategy.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Watchlist - Clickable rows */}
        <div className="dashboard-card watchlist-card">
          <div className="card-header">
            <h2>Watchlist</h2>
          </div>
          <div className="card-body">
            <div className="watchlist-add">
              <input
                type="text"
                placeholder="Add symbol..."
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleAddToWatchlist()}
              />
              <button className="btn btn-sm btn-primary" onClick={handleAddToWatchlist}>
                Add
              </button>
            </div>
            <div className="watchlist-items">
              {watchlist.map((item) => {
                const quote = watchlistPrices[item.symbol];
                return (
                  <div key={item.symbol} className="watchlist-item clickable-row" onClick={() => openDetail(item, 'watchlist')}>
                    <div className="watchlist-info">
                      <span className="symbol">{item.symbol}</span>
                      <span className="name">{item.name}</span>
                    </div>
                    <div className="watchlist-price">
                      {quote ? (
                        <>
                          <span className="price">{formatCurrency(quote.price || quote.last)}</span>
                          <span className={`change ${(quote.changePercent || 0) >= 0 ? 'positive' : 'negative'}`}>
                            {formatPercent(quote.changePercent || 0)}
                          </span>
                        </>
                      ) : (
                        <span className="loading">...</span>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={(e) => { e.stopPropagation(); handleRemoveFromWatchlist(item.symbol); }}
                    >
                      X
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Orders - Clickable rows */}
        <div className="dashboard-card orders-card">
          <div className="card-header">
            <h2>Recent Orders</h2>
            <button className="btn btn-sm btn-link" onClick={() => navigate('/trade-history')}>
              View History
            </button>
          </div>
          <div className="card-body">
            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <p>No recent orders</p>
              </div>
            ) : (
              <div className="orders-list">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="order-item clickable-row" onClick={() => openDetail(order, 'order')}>
                    <div className="order-info">
                      <span className={`side ${order.side}`}>{order.side?.toUpperCase()}</span>
                      <span className="symbol">{order.symbol}</span>
                      <span className="qty">{order.qty}</span>
                    </div>
                    <div className="order-status">
                      <span className={`status ${order.status?.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - All navigable */}
        <div className="dashboard-card actions-card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              <button className="action-btn" onClick={() => navigate('/command-center')}>
                <span className="action-icon">💹</span>
                <span className="action-label">Place Trade</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/strategy-builder')}>
                <span className="action-icon">🛠️</span>
                <span className="action-label">Build Strategy</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/backtesting')}>
                <span className="action-icon">📊</span>
                <span className="action-label">Backtest</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/auto-trading')}>
                <span className="action-icon">🤖</span>
                <span className="action-label">Auto Trade</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/market-analysis')}>
                <span className="action-icon">🔬</span>
                <span className="action-label">Analysis</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/predictions')}>
                <span className="action-icon">🔮</span>
                <span className="action-label">Predictions</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/ai-strategies')}>
                <span className="action-icon">🧠</span>
                <span className="action-label">AI Strategies</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/stock-picks')}>
                <span className="action-icon">🎯</span>
                <span className="action-label">Stock Picks</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/trading-assistant')}>
                <span className="action-icon">💬</span>
                <span className="action-label">Assistant</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/strategy-optimizer')}>
                <span className="action-icon">⚡</span>
                <span className="action-label">Optimizer</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/trade-history')}>
                <span className="action-icon">📜</span>
                <span className="action-label">History</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/portfolio')}>
                <span className="action-icon">💼</span>
                <span className="action-label">Portfolio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
