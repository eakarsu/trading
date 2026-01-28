import React, { useState, useEffect, useCallback } from 'react';
import { brokersAPI } from '../api/brokers';
import '../styles/pages/AlertsPage.css';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('priceAlerts');
    return saved ? JSON.parse(saved) : [];
  });
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New alert form
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    condition: 'above',
    price: '',
    note: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  // Current prices
  const [currentPrices, setCurrentPrices] = useState({});

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

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Check alerts against current prices
  const checkAlerts = useCallback(async () => {
    if (!isBrokerConnected || alerts.length === 0) return;

    const prices = {};
    const newTriggered = [];

    for (const alert of alerts) {
      if (alert.status === 'triggered') continue;

      try {
        const response = await brokersAPI.getQuote(alert.symbol);
        if (response.success) {
          const price = response.data?.price || response.data?.last;
          prices[alert.symbol] = price;

          // Check if alert should trigger
          let shouldTrigger = false;
          if (alert.condition === 'above' && price >= alert.price) {
            shouldTrigger = true;
          } else if (alert.condition === 'below' && price <= alert.price) {
            shouldTrigger = true;
          }

          if (shouldTrigger) {
            newTriggered.push({
              ...alert,
              triggeredAt: new Date().toISOString(),
              triggeredPrice: price,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to get price for ${alert.symbol}:`, err);
      }
    }

    setCurrentPrices(prices);

    // Update triggered alerts
    if (newTriggered.length > 0) {
      setTriggeredAlerts((prev) => [...newTriggered, ...prev].slice(0, 50));
      setAlerts((prev) =>
        prev.map((a) => {
          const triggered = newTriggered.find((t) => t.id === a.id);
          return triggered ? { ...a, status: 'triggered' } : a;
        })
      );

      // Show browser notification
      if (Notification.permission === 'granted') {
        newTriggered.forEach((alert) => {
          new Notification(`Price Alert: ${alert.symbol}`, {
            body: `${alert.symbol} is now ${alert.condition} $${alert.price}`,
            icon: '/logo192.png',
          });
        });
      }
    }
  }, [alerts, isBrokerConnected]);

  useEffect(() => {
    const init = async () => {
      const connected = await checkBrokerStatus();
      if (connected) {
        await checkAlerts();
      }
      setIsLoading(false);
    };
    init();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [checkBrokerStatus, checkAlerts]);

  // Check alerts periodically
  useEffect(() => {
    if (!isBrokerConnected) return;

    const interval = setInterval(checkAlerts, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isBrokerConnected, checkAlerts]);

  const handleCreateAlert = () => {
    if (!newAlert.symbol || !newAlert.price) {
      setError('Please enter symbol and price');
      return;
    }

    const alert = {
      id: `alert_${Date.now()}`,
      symbol: newAlert.symbol.toUpperCase(),
      condition: newAlert.condition,
      price: parseFloat(newAlert.price),
      note: newAlert.note,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    setAlerts((prev) => [alert, ...prev]);
    setNewAlert({ symbol: '', condition: 'above', price: '', note: '' });
    setIsCreating(false);
    setError(null);
  };

  const handleDeleteAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReactivateAlert = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'active' } : a))
    );
  };

  const handleClearTriggered = () => {
    setTriggeredAlerts([]);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const inactiveAlerts = alerts.filter((a) => a.status === 'triggered');

  if (!isBrokerConnected && !isLoading) {
    return (
      <div className="alerts-page">
        <div className="connect-prompt">
          <div className="prompt-icon">🔔</div>
          <h2>Connect to Set Price Alerts</h2>
          <p>Connect to a broker in Command Center to set and monitor price alerts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Price Alerts</h1>
          <span className="alert-count">{activeAlerts.length} Active</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={checkAlerts}>
            Refresh Prices
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
            + New Alert
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Create Alert Modal */}
      {isCreating && (
        <div className="modal-overlay" onClick={() => setIsCreating(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Price Alert</h2>
            <div className="form-group">
              <label>Symbol</label>
              <input
                type="text"
                placeholder="e.g., AAPL"
                value={newAlert.symbol}
                onChange={(e) =>
                  setNewAlert((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Condition</label>
                <select
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert((prev) => ({ ...prev, condition: e.target.value }))}
                >
                  <option value="above">Price Goes Above</option>
                  <option value="below">Price Goes Below</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Price</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={newAlert.price}
                  onChange={(e) => setNewAlert((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Note (optional)</label>
              <input
                type="text"
                placeholder="Add a note..."
                value={newAlert.note}
                onChange={(e) => setNewAlert((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateAlert}>
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="alerts-grid">
        {/* Active Alerts */}
        <div className="alerts-card">
          <div className="card-header">
            <h2>Active Alerts ({activeAlerts.length})</h2>
          </div>
          <div className="card-body">
            {activeAlerts.length === 0 ? (
              <div className="empty-state">
                <p>No active alerts. Create one to get started.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {activeAlerts.map((alert) => {
                  const currentPrice = currentPrices[alert.symbol];
                  const distance = currentPrice
                    ? ((alert.price - currentPrice) / currentPrice) * 100
                    : null;

                  return (
                    <div key={alert.id} className="alert-item">
                      <div className="alert-main">
                        <div className="alert-symbol">{alert.symbol}</div>
                        <div className="alert-condition">
                          <span className={`condition-badge ${alert.condition}`}>
                            {alert.condition === 'above' ? '↑' : '↓'}{' '}
                            {alert.condition === 'above' ? 'Above' : 'Below'}
                          </span>
                          <span className="target-price">{formatCurrency(alert.price)}</span>
                        </div>
                        {currentPrice && (
                          <div className="current-price">
                            <span className="label">Current:</span>
                            <span className="value">{formatCurrency(currentPrice)}</span>
                            {distance !== null && (
                              <span className={`distance ${distance > 0 ? 'above' : 'below'}`}>
                                ({distance > 0 ? '+' : ''}
                                {distance.toFixed(2)}%)
                              </span>
                            )}
                          </div>
                        )}
                        {alert.note && <div className="alert-note">{alert.note}</div>}
                      </div>
                      <div className="alert-actions">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Triggered Alerts */}
        <div className="alerts-card">
          <div className="card-header">
            <h2>Triggered ({triggeredAlerts.length})</h2>
            {triggeredAlerts.length > 0 && (
              <button className="btn btn-sm btn-link" onClick={handleClearTriggered}>
                Clear All
              </button>
            )}
          </div>
          <div className="card-body">
            {triggeredAlerts.length === 0 ? (
              <div className="empty-state">
                <p>No triggered alerts yet.</p>
              </div>
            ) : (
              <div className="alerts-list triggered">
                {triggeredAlerts.map((alert, idx) => (
                  <div key={`${alert.id}_${idx}`} className="alert-item triggered">
                    <div className="alert-main">
                      <div className="alert-symbol">{alert.symbol}</div>
                      <div className="triggered-info">
                        <span>
                          Triggered {alert.condition} {formatCurrency(alert.price)}
                        </span>
                        <span className="triggered-at">at {formatDate(alert.triggeredAt)}</span>
                      </div>
                      <div className="triggered-price">
                        Price: {formatCurrency(alert.triggeredPrice)}
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleReactivateAlert(alert.id)}
                      >
                        Reactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inactive (Previously Triggered) */}
        <div className="alerts-card">
          <div className="card-header">
            <h2>Inactive ({inactiveAlerts.length})</h2>
          </div>
          <div className="card-body">
            {inactiveAlerts.length === 0 ? (
              <div className="empty-state">
                <p>No inactive alerts.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {inactiveAlerts.map((alert) => (
                  <div key={alert.id} className="alert-item inactive">
                    <div className="alert-main">
                      <div className="alert-symbol">{alert.symbol}</div>
                      <div className="alert-condition">
                        {alert.condition === 'above' ? 'Above' : 'Below'}{' '}
                        {formatCurrency(alert.price)}
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleReactivateAlert(alert.id)}
                      >
                        Reactivate
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Info */}
      <div className="notification-info">
        {Notification.permission === 'granted' ? (
          <span className="notification-enabled">Browser notifications enabled</span>
        ) : Notification.permission === 'denied' ? (
          <span className="notification-disabled">
            Browser notifications blocked. Enable in browser settings to receive alerts.
          </span>
        ) : (
          <button
            className="btn btn-link"
            onClick={() => Notification.requestPermission()}
          >
            Enable browser notifications
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
