import React, { useState, useEffect, useCallback } from 'react';
import { brokersAPI } from '../api/brokers';
import '../styles/pages/TradeHistoryPage.css';

const TradeHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [activeBroker, setActiveBroker] = useState(null);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    side: 'all',
    symbol: '',
    dateRange: '30d',
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;

  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    filledOrders: 0,
    canceledOrders: 0,
    totalBuys: 0,
    totalSells: 0,
    winRate: 0,
  });

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

  const fetchOrders = useCallback(async () => {
    if (!isBrokerConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await brokersAPI.getOrders('all');
      if (response.success) {
        const orderData = response.data || [];
        setOrders(orderData);
        calculateStats(orderData);
      }
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isBrokerConnected]);

  useEffect(() => {
    const init = async () => {
      const connected = await checkBrokerStatus();
      if (connected) {
        await fetchOrders();
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [checkBrokerStatus, fetchOrders]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...orders];

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter((order) => order.status?.toLowerCase() === filters.status);
    }

    // Filter by side
    if (filters.side !== 'all') {
      result = result.filter((order) => order.side?.toLowerCase() === filters.side);
    }

    // Filter by symbol
    if (filters.symbol) {
      result = result.filter((order) =>
        order.symbol?.toLowerCase().includes(filters.symbol.toLowerCase())
      );
    }

    // Filter by date range
    const now = new Date();
    const dateFilters = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365,
      all: null,
    };
    const days = dateFilters[filters.dateRange];
    if (days) {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      result = result.filter((order) => new Date(order.created_at) >= cutoff);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle date comparison
      if (sortConfig.key === 'created_at' || sortConfig.key === 'filled_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Handle numeric comparison
      if (sortConfig.key === 'qty' || sortConfig.key === 'filled_avg_price') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [orders, filters, sortConfig]);

  const calculateStats = (orderData) => {
    const filled = orderData.filter((o) => o.status?.toLowerCase() === 'filled');
    const canceled = orderData.filter((o) => o.status?.toLowerCase() === 'canceled');
    const buys = orderData.filter((o) => o.side?.toLowerCase() === 'buy');
    const sells = orderData.filter((o) => o.side?.toLowerCase() === 'sell');

    setStats({
      totalOrders: orderData.length,
      filledOrders: filled.length,
      canceledOrders: canceled.length,
      totalBuys: buys.length,
      totalSells: sells.length,
      winRate: orderData.length > 0 ? ((filled.length / orderData.length) * 100).toFixed(1) : 0,
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusClass = (status) => {
    const statusMap = {
      filled: 'status-filled',
      new: 'status-new',
      pending_new: 'status-pending',
      partially_filled: 'status-partial',
      canceled: 'status-canceled',
      rejected: 'status-rejected',
      expired: 'status-expired',
    };
    return statusMap[status?.toLowerCase()] || 'status-default';
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (!isBrokerConnected && !isLoading) {
    return (
      <div className="trade-history-page">
        <div className="connect-prompt">
          <div className="prompt-icon">📜</div>
          <h2>Connect to View Trade History</h2>
          <p>Connect to a broker in Command Center to view your trade history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trade-history-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Trade History</h1>
          {activeBroker && (
            <span className="broker-badge">{activeBroker.toUpperCase()}</span>
          )}
        </div>
        <button className="btn btn-secondary" onClick={fetchOrders} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.totalOrders}</span>
          <span className="stat-label">Total Orders</span>
        </div>
        <div className="stat-card filled">
          <span className="stat-value">{stats.filledOrders}</span>
          <span className="stat-label">Filled</span>
        </div>
        <div className="stat-card canceled">
          <span className="stat-value">{stats.canceledOrders}</span>
          <span className="stat-label">Canceled</span>
        </div>
        <div className="stat-card buy">
          <span className="stat-value">{stats.totalBuys}</span>
          <span className="stat-label">Buy Orders</span>
        </div>
        <div className="stat-card sell">
          <span className="stat-value">{stats.totalSells}</span>
          <span className="stat-label">Sell Orders</span>
        </div>
        <div className="stat-card rate">
          <span className="stat-value">{stats.winRate}%</span>
          <span className="stat-label">Fill Rate</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="filled">Filled</option>
            <option value="new">New</option>
            <option value="partially_filled">Partially Filled</option>
            <option value="canceled">Canceled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Side</label>
          <select
            value={filters.side}
            onChange={(e) => setFilters((prev) => ({ ...prev, side: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Symbol</label>
          <input
            type="text"
            placeholder="Search symbol..."
            value={filters.symbol}
            onChange={(e) => setFilters((prev) => ({ ...prev, symbol: e.target.value }))}
          />
        </div>

        <div className="filter-group">
          <label>Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="365d">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <button
          className="btn btn-link"
          onClick={() =>
            setFilters({ status: 'all', side: 'all', symbol: '', dateRange: '30d' })
          }
        >
          Clear Filters
        </button>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found matching your criteria.</p>
          </div>
        ) : (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    Date {sortConfig.key === 'created_at' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </th>
                  <th onClick={() => handleSort('symbol')} className="sortable">
                    Symbol {sortConfig.key === 'symbol' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </th>
                  <th>Side</th>
                  <th>Type</th>
                  <th onClick={() => handleSort('qty')} className="sortable">
                    Qty {sortConfig.key === 'qty' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </th>
                  <th onClick={() => handleSort('filled_avg_price')} className="sortable">
                    Avg Price {sortConfig.key === 'filled_avg_price' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Order ID</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{formatDate(order.created_at)}</td>
                    <td className="symbol">{order.symbol}</td>
                    <td>
                      <span className={`side-badge ${order.side?.toLowerCase()}`}>
                        {order.side?.toUpperCase()}
                      </span>
                    </td>
                    <td>{order.type?.replace('_', ' ')}</td>
                    <td>{order.qty || order.filled_qty || '-'}</td>
                    <td>{formatCurrency(order.filled_avg_price)}</td>
                    <td>
                      {order.filled_avg_price && order.filled_qty
                        ? formatCurrency(order.filled_avg_price * order.filled_qty)
                        : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="order-id">{order.id?.substring(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            )}

            <div className="results-info">
              Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} of{' '}
              {filteredOrders.length} orders
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TradeHistoryPage;
