import React, { useState, useEffect } from 'react';
import { marketDataAPI, portfolioAPI } from '../api/marketData';
import DashboardPerformanceChart from '../components/DashboardPerformanceChart';
import '../styles/pages/DashboardPage.css';

const DashboardPage = () => {
  const [marketData, setMarketData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [newWatchlistItem, setNewWatchlistItem] = useState({ symbol: '', name: '' });
  const [editingWatchlistId, setEditingWatchlistId] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real market data
      const marketResponse = await marketDataAPI.getRealTimeData();
      
      // Set market data
      if (marketResponse && marketResponse.data) {
        setMarketData(marketResponse.data);
      }
      
      // Fetch portfolio data
      try {
        const portfolioResponse = await portfolioAPI.getPortfolio();
        if (portfolioResponse) {
          setPortfolioData(portfolioResponse);
        }
      } catch (portfolioError) {
        console.error('Failed to fetch portfolio data', portfolioError);
        // Don't show alert for portfolio data failure, just leave it null
        setPortfolioData(null);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      // Show error to user
      alert('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddToWatchlist = async () => {
    if (!newWatchlistItem.symbol || !newWatchlistItem.name) {
      alert('Please enter both symbol and name');
      return;
    }
    
    try {
      const newItem = {
        id: watchlist.length + 1,
        symbol: newWatchlistItem.symbol.toUpperCase(),
        name: newWatchlistItem.name,
        price: 0,
        change: 0,
        changePercent: 0
      };
      
      setWatchlist(prev => [...prev, newItem]);
      setNewWatchlistItem({ symbol: '', name: '' });
      
      alert('Item added to watchlist successfully!');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      alert('Failed to add to watchlist. Please try again.');
    }
  };

  const handleRemoveFromWatchlist = async (id) => {
    try {
      setWatchlist(prev => prev.filter(item => item.id !== id));
      alert('Item removed from watchlist successfully!');
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      alert('Failed to remove from watchlist. Please try again.');
    }
  };

  const handleEditWatchlistItem = (item) => {
    setEditingWatchlistId(item.id);
    setNewWatchlistItem({ symbol: item.symbol, name: item.name });
  };

  const handleUpdateWatchlistItem = () => {
    if (!newWatchlistItem.symbol || !newWatchlistItem.name) {
      alert('Please enter both symbol and name');
      return;
    }
    
    try {
      setWatchlist(prev => prev.map(item => 
        item.id === editingWatchlistId 
          ? { ...item, symbol: newWatchlistItem.symbol.toUpperCase(), name: newWatchlistItem.name } 
          : item
      ));
      
      setEditingWatchlistId(null);
      setNewWatchlistItem({ symbol: '', name: '' });
      alert('Watchlist item updated successfully!');
    } catch (error) {
      console.error('Failed to update watchlist item:', error);
      alert('Failed to update watchlist item. Please try again.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%';
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return '0.00%';
    }
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <h1>Dashboard</h1>
          <p>Error loading dashboard data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="dashboard-actions">
            <button className="btn btn-primary" onClick={async () => {
              try {
                setLoading(true);
                const refreshedData = await marketDataAPI.getRealTimeData();
                if (refreshedData && refreshedData.data) {
                  setMarketData(refreshedData.data);
                  alert('Dashboard data refreshed successfully!');
                } else {
                  throw new Error('No data received');
                }
              } catch (error) {
                console.error('Failed to refresh dashboard data:', error);
                alert('Failed to refresh dashboard data. Please try again.');
              } finally {
                setLoading(false);
              }
            }}>
              Refresh Data
            </button>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card portfolio-summary">
            <h2>Portfolio Summary</h2>
            {portfolioData ? (
              <>
                <div className="portfolio-value">
                  <div className="value-amount">{formatCurrency(portfolioData.totalValue)}</div>
                  <div className={`value-change ${portfolioData.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(portfolioData.totalReturn)} ({formatPercent(portfolioData.totalReturnPercent)})
                  </div>
                </div>
                
                <div className="allocation-chart">
                  {portfolioData.allocation && typeof portfolioData.allocation === 'object' ? 
                    Object.entries(portfolioData.allocation).map(([asset, percent], idx) => (
                      <div className="allocation-item" key={idx}>
                        <div className="allocation-label">
                          <div 
                            className="allocation-color" 
                            style={{ backgroundColor: `hsl(${idx * 60}, 70%, 50%)` }}
                          ></div>
                          <span>{asset.charAt(0).toUpperCase() + asset.slice(1)}</span>
                        </div>
                        <div className="allocation-value">{percent}%</div>
                        <div className="allocation-percent">
                          {formatCurrency((portfolioData.totalValue * percent) / 100)}
                        </div>
                      </div>
                    )) : (
                      <div className="allocation-placeholder">
                        <p>No allocation data available</p>
                      </div>
                    )
                  }
                </div>
              </>
            ) : (
              <div className="portfolio-placeholder">
                <p>No portfolio data available. <a href="/portfolio">Create a portfolio</a> to get started.</p>
              </div>
            )}
          </div>
          
          <div className="dashboard-card market-overview">
            <h2>Market Overview</h2>
            <div className="indices-grid">
              {marketData.indices && Array.isArray(marketData.indices) ? 
                marketData.indices.map((index, idx) => (
                  <div className="index-item" key={idx}>
                    <div className="index-symbol">{index.symbol}</div>
                    <div className="index-name">{index.name}</div>
                    <div className="index-price">{formatCurrency(index.price || 0)}</div>
                    <div className={`index-change ${(index.change || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(index.change || 0)} ({formatPercent(index.changePercent)}%)
                    </div>
                  </div>
                )) : (
                  <div className="market-placeholder">
                    <p>Loading market data...</p>
                  </div>
                )
              }
            </div>
          </div>
          
          <div className="dashboard-card watchlist">
            <h2>My Watchlist</h2>
            <div className="watchlist-controls">
              <div className="watchlist-form">
                <input
                  type="text"
                  placeholder="Symbol (e.g. AAPL)"
                  value={newWatchlistItem.symbol}
                  onChange={(e) => setNewWatchlistItem({...newWatchlistItem, symbol: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={newWatchlistItem.name}
                  onChange={(e) => setNewWatchlistItem({...newWatchlistItem, name: e.target.value})}
                />
                {editingWatchlistId ? (
                  <button className="btn btn-primary" onClick={handleUpdateWatchlistItem}>
                    Update
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleAddToWatchlist}>
                    Add
                  </button>
                )}
                {editingWatchlistId && (
                  <button className="btn btn-outline" onClick={() => {
                    setEditingWatchlistId(null);
                    setNewWatchlistItem({ symbol: '', name: '' });
                  }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <div className="watchlist-grid">
              {watchlist.map((item, idx) => (
                <div className="watchlist-item" key={idx}>
                  <div className="watchlist-symbol">{item.symbol}</div>
                  <div className="watchlist-name">{item.name}</div>
                  <div className="watchlist-price">{formatCurrency(item.price)}</div>
                  <div className={`watchlist-change ${item.change >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(item.change)} ({formatPercent(item.changePercent)}%)
                  </div>
                  <div className="watchlist-actions">
                    <button className="btn btn-outline btn-small" onClick={() => handleEditWatchlistItem(item)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-small" onClick={() => handleRemoveFromWatchlist(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="dashboard-card recommendations">
            <h2>AI Recommendations</h2>
            <div className="recommendations-list">
              {[
                { symbol: 'NVDA', name: 'NVIDIA Corp', reason: 'Strong momentum in AI sector', action: 'Buy' },
                { symbol: 'META', name: 'Meta Platforms Inc', reason: 'Undervalued with strong fundamentals', action: 'Buy' },
                { symbol: 'BAC', name: 'Bank of America', reason: 'Overvalued in current market', action: 'Sell' },
                { symbol: 'JPM', name: 'JPMorgan Chase', reason: 'Technical resistance level approaching', action: 'Hold' }
              ].map((rec, idx) => (
                <div className="recommendation-item" key={idx}>
                  <div className="recommendation-header">
                    <div className="recommendation-symbol">{rec.symbol}</div>
                    <div className={`recommendation-action ${rec.action.toLowerCase()}`}>
                      {rec.action}
                    </div>
                  </div>
                  <div className="recommendation-name">{rec.name}</div>
                  <div className="recommendation-reason">{rec.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="performance-chart">
          <h2>Portfolio Performance</h2>
          {portfolioData ? (
            <DashboardPerformanceChart performanceData={portfolioData.performance} />
          ) : (
            <div className="chart-placeholder">
              Portfolio Performance Chart
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
