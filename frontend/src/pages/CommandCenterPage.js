import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpacaAPI } from '../api/alpaca';
import { brokersAPI } from '../api/brokers';
import '../styles/pages/CommandCenterPage.css';

const CommandCenterPage = () => {
  const navigate = useNavigate();

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-broker state
  const [availableBrokers, setAvailableBrokers] = useState([]);
  const [connectedBrokers, setConnectedBrokers] = useState([]);
  const [activeBroker, setActiveBroker] = useState(null);
  const [selectedBroker, setSelectedBroker] = useState('alpaca');

  // Credential inputs (dynamic based on broker)
  const [credentials, setCredentials] = useState({});
  const [isPaper, setIsPaper] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Account data
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clock, setClock] = useState(null);

  // Quick trade
  const [quickSymbol, setQuickSymbol] = useState('');
  const [quickQty, setQuickQty] = useState('');
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [timeInForce, setTimeInForce] = useState('day');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // AI Alerts (mock for now)
  const [alerts] = useState([
    { id: 1, type: 'warning', message: 'TSLA earnings report tomorrow', time: '2 hours ago' },
    { id: 2, type: 'info', message: 'NVDA showing strong momentum', time: '4 hours ago' },
    { id: 3, type: 'success', message: 'AAPL hit your target price of $180', time: '1 day ago' },
  ]);

  // Load available brokers on mount
  useEffect(() => {
    const loadBrokers = async () => {
      try {
        const response = await brokersAPI.getAvailableBrokers();
        if (response.success) {
          setAvailableBrokers(response.data);
        }
      } catch (err) {
        console.error('Error loading brokers:', err);
      }
    };
    loadBrokers();
  }, []);

  // Check broker status
  const checkStatus = useCallback(async () => {
    try {
      const response = await brokersAPI.getStatus();
      if (response.success) {
        setConnectedBrokers(response.data.connectedBrokers || []);
        setActiveBroker(response.data.activeBroker);
        return response.data.totalConnected > 0;
      }
      return false;
    } catch (err) {
      console.error('Error checking status:', err);
      return false;
    }
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!activeBroker) return;

    setIsLoading(true);
    setError(null);

    try {
      const [accountRes, positionsRes, ordersRes] = await Promise.all([
        brokersAPI.getAccount(),
        brokersAPI.getPositions(),
        brokersAPI.getOrders('open'),
      ]);

      if (accountRes.success) setAccount(accountRes.data);
      if (positionsRes.success) setPositions(positionsRes.data || []);
      if (ordersRes.success) setOrders(ordersRes.data || []);

      // Try to get clock from Alpaca API if connected
      try {
        const clockRes = await alpacaAPI.getClock();
        setClock(clockRes.data);
      } catch {
        // Clock not available
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [activeBroker]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const hasConnected = await checkStatus();
      if (hasConnected) {
        setIsInitialized(true);
        await fetchData();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [checkStatus, fetchData]);

  // Update credential fields when broker changes
  useEffect(() => {
    const broker = availableBrokers.find(b => b.id === selectedBroker);
    if (broker) {
      const newCreds = {};
      broker.requiredCredentials.forEach(cred => {
        newCreds[cred.key] = cred.default || '';
      });
      setCredentials(newCreds);
    }
  }, [selectedBroker, availableBrokers]);

  // Connect to broker
  const handleConnect = async (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setError(null);

    try {
      const result = await brokersAPI.connectBroker(selectedBroker, credentials, isPaper);
      if (result.success) {
        setIsInitialized(true);
        await checkStatus();
        await fetchData();
      } else {
        setError(result.message || 'Failed to connect');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to broker');
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch active broker
  const handleSwitchBroker = async (brokerId) => {
    try {
      const result = await brokersAPI.setActiveBroker(brokerId);
      if (result.success) {
        setActiveBroker(brokerId);
        await fetchData();
      }
    } catch (err) {
      alert('Failed to switch broker: ' + err.message);
    }
  };

  // Quick trade
  const handleQuickTrade = async (side) => {
    if (!quickSymbol || !quickQty) {
      alert('Please enter symbol and quantity');
      return;
    }

    if (orderType === 'limit' && !limitPrice) {
      alert('Please enter limit price for limit orders');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderParams = {
        symbol: quickSymbol.toUpperCase(),
        qty: parseInt(quickQty),
        side: side,
        type: orderType,
        timeInForce: timeInForce,
      };

      if (orderType === 'limit' || orderType === 'stop_limit') {
        orderParams.limitPrice = parseFloat(limitPrice);
      }
      if (orderType === 'stop' || orderType === 'stop_limit') {
        orderParams.stopPrice = parseFloat(limitPrice);
      }

      await brokersAPI.placeOrder(orderParams);

      alert(`${side.toUpperCase()} ${orderType} order placed for ${quickQty} shares of ${quickSymbol.toUpperCase()}`);
      setQuickSymbol('');
      setQuickQty('');
      setLimitPrice('');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    try {
      await brokersAPI.cancelOrder(orderId);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  // Disconnect from broker
  const handleDisconnect = async (brokerId = null) => {
    const broker = brokerId || activeBroker;
    if (!window.confirm(`Are you sure you want to disconnect from ${broker}?`)) {
      return;
    }

    try {
      await brokersAPI.disconnectBroker(broker);
      await checkStatus();

      if (connectedBrokers.length <= 1) {
        setIsInitialized(false);
        setAccount(null);
        setPositions([]);
        setOrders([]);
        setClock(null);
      } else {
        await fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to disconnect');
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

  // Format percent
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0.00%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Get broker icon
  const getBrokerIcon = (brokerId) => {
    const icons = {
      alpaca: '🦙',
      ibkr: '🏦',
      tradier: '📈',
      etrade: '💹',
    };
    return icons[brokerId] || '🔗';
  };

  // Render connection form if not initialized
  if (!isInitialized && !isLoading) {
    const selectedBrokerInfo = availableBrokers.find(b => b.id === selectedBroker);

    return (
      <div className="command-center-page">
        <div className="connect-container">
          <div className="connect-card">
            <div className="connect-header">
              <span className="connect-icon">🔗</span>
              <h1>Connect to Broker</h1>
              <p>Select your broker and enter API credentials to start trading</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Broker Selector */}
            <div className="broker-selector">
              <label>Select Broker</label>
              <div className="broker-options">
                {availableBrokers.map((broker) => (
                  <button
                    key={broker.id}
                    type="button"
                    className={`broker-option ${selectedBroker === broker.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBroker(broker.id)}
                  >
                    <span className="broker-icon">{getBrokerIcon(broker.id)}</span>
                    <span className="broker-name">{broker.name}</span>
                    <span className="broker-desc">{broker.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            {selectedBrokerInfo && (
              <div className="broker-capabilities">
                <span className="cap-label">Capabilities:</span>
                {selectedBrokerInfo.capabilities.stocks && <span className="cap-badge">Stocks</span>}
                {selectedBrokerInfo.capabilities.options && <span className="cap-badge">Options</span>}
                {selectedBrokerInfo.capabilities.futures && <span className="cap-badge">Futures</span>}
                {selectedBrokerInfo.capabilities.forex && <span className="cap-badge">Forex</span>}
                {selectedBrokerInfo.capabilities.crypto && <span className="cap-badge">Crypto</span>}
              </div>
            )}

            <form onSubmit={handleConnect} className="connect-form">
              {/* Dynamic credential fields */}
              {selectedBrokerInfo?.requiredCredentials.map((cred) => (
                <div className="form-group" key={cred.key}>
                  <label>{cred.label}</label>
                  <input
                    type={cred.type === 'password' ? 'password' : 'text'}
                    value={credentials[cred.key] || ''}
                    onChange={(e) => setCredentials({ ...credentials, [cred.key]: e.target.value })}
                    placeholder={`Enter ${cred.label.toLowerCase()}`}
                    required={!cred.label.includes('optional')}
                  />
                </div>
              ))}

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={isPaper}
                    onChange={(e) => setIsPaper(e.target.checked)}
                  />
                  <span className="toggle-text">Paper Trading Mode</span>
                  <span className={`mode-badge ${isPaper ? 'paper' : 'live'}`}>
                    {isPaper ? 'PAPER' : 'LIVE'}
                  </span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : `Connect to ${selectedBrokerInfo?.name || 'Broker'}`}
              </button>
            </form>

            <div className="connect-footer">
              <p>
                {selectedBroker === 'alpaca' && (
                  <>Don't have an Alpaca account? <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer">Sign up free</a></>
                )}
                {selectedBroker === 'ibkr' && (
                  <>Need IBKR Gateway? <a href="https://www.interactivebrokers.com/en/index.php?f=5041" target="_blank" rel="noopener noreferrer">Download here</a></>
                )}
                {selectedBroker === 'tradier' && (
                  <>Need a Tradier account? <a href="https://www.tradier.com" target="_blank" rel="noopener noreferrer">Sign up here</a></>
                )}
                {selectedBroker === 'etrade' && (
                  <>Need E*TRADE API access? <a href="https://developer.etrade.com" target="_blank" rel="noopener noreferrer">Apply here</a></>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="command-center-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading trading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="command-center-page">
      {/* Header with connected brokers */}
      <div className="cc-header">
        <div className="cc-title">
          <h1>Command Center</h1>
          <span className={`mode-badge ${isPaper ? 'paper' : 'live'}`}>
            {isPaper ? 'PAPER' : 'LIVE'}
          </span>
        </div>

        {/* Connected Brokers Tabs */}
        <div className="broker-tabs">
          {connectedBrokers.map((broker) => (
            <button
              key={broker.id}
              className={`broker-tab ${broker.isActive ? 'active' : ''}`}
              onClick={() => handleSwitchBroker(broker.id)}
            >
              <span className="broker-icon">{getBrokerIcon(broker.id)}</span>
              <span className="broker-name">{broker.name}</span>
              {broker.isActive && <span className="active-indicator">●</span>}
            </button>
          ))}
          <button className="broker-tab add-broker" onClick={() => setIsInitialized(false)}>
            + Add Broker
          </button>
        </div>

        <div className="cc-actions">
          <button className="btn btn-secondary" onClick={fetchData}>
            Refresh
          </button>
          <button className="btn btn-outline" onClick={() => handleDisconnect()}>
            Disconnect
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Main Grid */}
      <div className="cc-grid">
        {/* Account Overview */}
        <div className="cc-card account-card">
          <div className="card-header">
            <h2>Account Overview</h2>
            <span className="broker-label">{getBrokerIcon(activeBroker)} {activeBroker?.toUpperCase()}</span>
          </div>
          <div className="account-stats">
            <div className="stat primary">
              <span className="label">Portfolio Value</span>
              <span className="value">{formatCurrency(account?.portfolioValue)}</span>
              <span className={`change ${account?.dayChange >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(account?.dayChange)} ({formatPercent(account?.dayChangePercent)})
              </span>
            </div>
            <div className="stat">
              <span className="label">Buying Power</span>
              <span className="value">{formatCurrency(account?.buyingPower)}</span>
            </div>
            <div className="stat">
              <span className="label">Cash</span>
              <span className="value">{formatCurrency(account?.cash)}</span>
            </div>
            <div className="stat">
              <span className="label">Equity</span>
              <span className="value">{formatCurrency(account?.equity)}</span>
            </div>
          </div>
        </div>

        {/* Market Status */}
        <div className="cc-card market-card">
          <div className="card-header">
            <h2>Market Status</h2>
          </div>
          <div className="market-status">
            <div className={`status-indicator ${clock?.isOpen ? 'open' : 'closed'}`}>
              <span className="status-dot"></span>
              <span className="status-text">{clock?.isOpen ? 'Market Open' : 'Market Closed'}</span>
            </div>
            {clock?.nextOpen && !clock?.isOpen && (
              <p className="next-time">Opens: {new Date(clock.nextOpen).toLocaleString()}</p>
            )}
            {clock?.nextClose && clock?.isOpen && (
              <p className="next-time">Closes: {new Date(clock.nextClose).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Quick Trade - Enhanced Trading Panel */}
        <div className="cc-card quick-trade-card trading-panel">
          <div className="card-header">
            <h2>Place Order</h2>
            <span className="broker-label">{getBrokerIcon(activeBroker)} {activeBroker?.toUpperCase()}</span>
          </div>
          <div className="quick-trade-form">
            <div className="trade-row">
              <div className="form-group">
                <label>Symbol</label>
                <input
                  type="text"
                  placeholder="AAPL, TSLA..."
                  value={quickSymbol}
                  onChange={(e) => setQuickSymbol(e.target.value.toUpperCase())}
                  className="symbol-input"
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  placeholder="100"
                  value={quickQty}
                  onChange={(e) => setQuickQty(e.target.value)}
                  className="qty-input"
                  min="1"
                />
              </div>
            </div>

            <div className="trade-row">
              <div className="form-group">
                <label>Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="order-type-select"
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                  <option value="stop">Stop</option>
                  <option value="stop_limit">Stop Limit</option>
                </select>
              </div>
              <div className="form-group">
                <label>Time in Force</label>
                <select
                  value={timeInForce}
                  onChange={(e) => setTimeInForce(e.target.value)}
                  className="tif-select"
                >
                  <option value="day">Day</option>
                  <option value="gtc">GTC (Good Till Canceled)</option>
                  <option value="ioc">IOC (Immediate or Cancel)</option>
                  <option value="fok">FOK (Fill or Kill)</option>
                </select>
              </div>
            </div>

            {(orderType === 'limit' || orderType === 'stop' || orderType === 'stop_limit') && (
              <div className="trade-row">
                <div className="form-group full-width">
                  <label>{orderType === 'stop' ? 'Stop Price' : 'Limit Price'}</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="price-input"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            )}

            <div className="trade-buttons-large">
              <button
                className="btn btn-buy"
                onClick={() => handleQuickTrade('buy')}
                disabled={isPlacingOrder || !quickSymbol || !quickQty}
              >
                {isPlacingOrder ? 'Placing...' : 'BUY'}
              </button>
              <button
                className="btn btn-sell"
                onClick={() => handleQuickTrade('sell')}
                disabled={isPlacingOrder || !quickSymbol || !quickQty}
              >
                {isPlacingOrder ? 'Placing...' : 'SELL'}
              </button>
            </div>
          </div>
        </div>

        {/* Positions */}
        <div className="cc-card positions-card">
          <div className="card-header">
            <h2>Positions ({positions.length})</h2>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/algo-trading')}>
              Auto Trade
            </button>
          </div>
          <div className="positions-list">
            {positions.length === 0 ? (
              <p className="empty-state">No open positions</p>
            ) : (
              positions.map((pos) => (
                <div key={pos.symbol} className="position-item">
                  <div className="position-symbol">
                    <span className="symbol">{pos.symbol}</span>
                    <span className="qty">{pos.qty} shares</span>
                  </div>
                  <div className="position-value">
                    <span className="market-value">{formatCurrency(pos.marketValue)}</span>
                    <span className={`pl ${pos.unrealizedPL >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(pos.unrealizedPL)} ({formatPercent(pos.unrealizedPLPercent)})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open Orders */}
        <div className="cc-card orders-card">
          <div className="card-header">
            <h2>Open Orders ({orders.length})</h2>
          </div>
          <div className="orders-list">
            {orders.length === 0 ? (
              <p className="empty-state">No open orders</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <span className={`side ${order.side}`}>{order.side.toUpperCase()}</span>
                    <span className="symbol">{order.symbol}</span>
                    <span className="qty">{order.qty}</span>
                    <span className="type">{order.type}</span>
                  </div>
                  <div className="order-actions">
                    <span className="status">{order.status}</span>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Alerts */}
        <div className="cc-card alerts-card">
          <div className="card-header">
            <h2>AI Alerts</h2>
          </div>
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.type}`}>
                <span className="alert-icon">
                  {alert.type === 'warning' && '⚠️'}
                  {alert.type === 'info' && 'ℹ️'}
                  {alert.type === 'success' && '✅'}
                </span>
                <div className="alert-content">
                  <p className="alert-message">{alert.message}</p>
                  <span className="alert-time">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterPage;
