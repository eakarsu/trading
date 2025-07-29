import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../api/marketData';
import PortfolioPerformanceChart from '../components/PortfolioPerformanceChart';
import AssetAllocationChart from '../components/AssetAllocationChart';
import '../styles/pages/PortfolioPage.css';

const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('holdings');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'buy', 'sell', 'transfer', 'create', 'edit', 'delete'
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [portfolioId, setPortfolioId] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    shares: '',
    price: '',
    amount: '',
    fromAccount: '',
    toAccount: ''
  });

  // Handler functions for Buy, Sell, Transfer
  const handleBuy = () => {
    setModalType('buy');
    setShowModal(true);
  };

  const handleSell = () => {
    setModalType('sell');
    setShowModal(true);
  };

  const handleTransfer = () => {
    setModalType('transfer');
    setShowModal(true);
  };

  const handleCreatePortfolio = () => {
    setModalType('create');
    setShowModal(true);
  };

  const handleEditPortfolio = () => {
    setModalType('edit');
    setShowModal(true);
  };

  const handleDeletePortfolio = async () => {
    if (window.confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      try {
        if (!portfolioId) {
          alert('No portfolio to delete.');
          return;
        }
        
        const result = await portfolioAPI.deletePortfolio(portfolioId);
        if (result) {
          setPortfolio(null);
          setPortfolioId(null);
          alert('Portfolio deleted successfully');
        } else {
          throw new Error('Delete operation failed');
        }
      } catch (err) {
        console.error('Failed to delete portfolio:', err);
        alert('Failed to delete portfolio. Please try again later.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      switch (modalType) {
        case 'buy':
          result = await portfolioAPI.buySecurities({
            symbol: formData.symbol,
            name: formData.name,
            shares: parseFloat(formData.shares),
            price: parseFloat(formData.price)
          });
          break;
        case 'sell':
          result = await portfolioAPI.sellSecurities({
            symbol: formData.symbol,
            shares: parseFloat(formData.shares),
            price: parseFloat(formData.price)
          });
          break;
        case 'transfer':
          result = await portfolioAPI.transferFunds({
            amount: parseFloat(formData.amount),
            fromAccount: formData.fromAccount,
            toAccount: formData.toAccount
          });
          break;
        case 'create':
          result = await portfolioAPI.createPortfolio({
            name: 'My Portfolio',
            description: 'Default portfolio',
            totalValue: 100000,
            cashBalance: 100000,
            totalReturn: 0,
            totalReturnPercent: 0,
            dayChange: 0,
            dayChangePercent: 0,
            holdings: [],
            riskProfile: 'moderate',
            strategy: null,
            isActive: true,
            performance: {
              oneDay: 0,
              oneWeek: 0,
              oneMonth: 0,
              threeMonths: 0,
              sixMonths: 0,
              oneYear: 0,
              ytd: 0,
              inception: 0
            },
            allocation: {
              stocks: 0,
              bonds: 0,
              cash: 100,
              crypto: 0,
              commodities: 0,
              reits: 0,
              other: 0
            },
            settings: {
              autoRebalance: false,
              rebalanceThreshold: 5,
              dividendReinvestment: true,
              taxOptimization: false
            }
          });
          if (result && result.id) {
            setPortfolioId(result.id);
          } else {
            throw new Error('Failed to create portfolio');
          }
          break;
        case 'edit':
          // For simplicity, we're not implementing full edit functionality here
          // In a real app, this would update the portfolio details
          result = { success: true };
          break;
      }
      
      // Check if operation was successful
      if (!result) {
        throw new Error(`${modalType} operation failed`);
      }
      
      // Refresh portfolio data
      await fetchPortfolio();
      
      // Close modal and reset form
      setShowModal(false);
      setFormData({
        symbol: '',
        name: '',
        shares: '',
        price: '',
        amount: '',
        fromAccount: '',
        toAccount: ''
      });
      
      alert(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} operation completed successfully`);
    } catch (err) {
      console.error(`Failed to ${modalType}:`, err);
      alert(`Failed to ${modalType}. Please try again later.`);
    }
  };

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getPortfolio();
      setPortfolio(response);
      setPortfolioId(response.id);
    } catch (err) {
      console.error('Failed to fetch portfolio data:', err);
      // If portfolio doesn't exist, user can create one
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
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
      <div className="portfolio-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // If no portfolio exists, show create option
  if (!portfolio && !loading) {
    return (
      <div className="portfolio-page">
        <div className="container">
          <h1>Portfolio Management</h1>
          <div className="no-portfolio">
            <p>You don't have a portfolio yet.</p>
            <button className="btn btn-primary" onClick={handleCreatePortfolio}>
              Create Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <div className="container">
        <div className="portfolio-header">
          <h1>Portfolio Management</h1>
          <div className="portfolio-actions">
            <button className="btn btn-primary" onClick={() => handleBuy()}>Buy</button>
            <button className="btn btn-outline" onClick={() => handleSell()}>Sell</button>
            <button className="btn btn-outline" onClick={() => handleTransfer()}>Transfer</button>
            <button className="btn btn-outline" onClick={handleEditPortfolio}>Edit</button>
            <button className="btn btn-danger" onClick={handleDeletePortfolio}>Delete</button>
          </div>
        </div>
        
        {/* Modal for Buy/Sell/Transfer/Create/Edit */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {modalType === 'buy' ? 'Buy Securities' : 
                   modalType === 'sell' ? 'Sell Securities' : 
                   modalType === 'transfer' ? 'Transfer Funds' :
                   modalType === 'create' ? 'Create Portfolio' :
                   'Edit Portfolio'}
                </h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {modalType === 'buy' && (
                    <div className="transaction-form">
                      <div className="form-group">
                        <label>Symbol</label>
                        <input 
                          type="text" 
                          name="symbol"
                          value={formData.symbol}
                          onChange={handleInputChange}
                          placeholder="Enter stock symbol (e.g. AAPL)" 
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Name</label>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter company name" 
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <input 
                          type="number" 
                          name="shares"
                          value={formData.shares}
                          onChange={handleInputChange}
                          placeholder="Enter number of shares" 
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Price</label>
                        <input 
                          type="number" 
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="Enter price per share" 
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {modalType === 'sell' && (
                    <div className="transaction-form">
                      <div className="form-group">
                        <label>Symbol</label>
                        <select 
                          name="symbol"
                          value={formData.symbol}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select a holding</option>
                          {portfolio.holdings.map((holding, idx) => (
                            <option key={idx} value={holding.symbol}>
                              {holding.symbol} - {holding.name} ({holding.shares} shares)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <input 
                          type="number" 
                          name="shares"
                          value={formData.shares}
                          onChange={handleInputChange}
                          placeholder="Enter number of shares" 
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Price</label>
                        <input 
                          type="number" 
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="Enter price per share" 
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {modalType === 'transfer' && (
                    <div className="transaction-form">
                      <div className="form-group">
                        <label>From Account</label>
                        <select 
                          name="fromAccount"
                          value={formData.fromAccount}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select from account</option>
                          <option>Checking Account (****1234)</option>
                          <option>Savings Account (****5678)</option>
                          <option>Brokerage Account (****9012)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>To Account</label>
                        <select 
                          name="toAccount"
                          value={formData.toAccount}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select to account</option>
                          <option>Brokerage Account (****9012)</option>
                          <option>Checking Account (****1234)</option>
                          <option>Savings Account (****5678)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Amount</label>
                        <input 
                          type="number" 
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          placeholder="Enter transfer amount" 
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {(modalType === 'create' || modalType === 'edit') && (
                    <div className="transaction-form">
                      <p>
                        {modalType === 'create' 
                          ? 'Create a new portfolio to start tracking your investments.' 
                          : 'Edit your portfolio details.'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    {modalType === 'buy' ? 'Buy' : 
                     modalType === 'sell' ? 'Sell' : 
                     modalType === 'transfer' ? 'Transfer' :
                     modalType === 'create' ? 'Create' :
                     'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <div className="portfolio-summary">
          <div className="summary-card">
            <h2>Total Value</h2>
            <div className="summary-value">{formatCurrency(portfolio.totalValue)}</div>
            <div className={`summary-change ${portfolio.totalReturn >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(portfolio.totalReturn)} ({formatPercent(portfolio.totalReturnPercent)})
            </div>
          </div>
          
          <div className="summary-card">
            <h2>Cash Balance</h2>
            <div className="summary-value">{formatCurrency(portfolio.cashBalance)}</div>
            <div className="summary-description">Available for trading</div>
          </div>
          
          <div className="summary-card">
            <h2>Day Change</h2>
            <div className="summary-value">{formatCurrency(portfolio.dayChange)}</div>
            <div className={`summary-change ${portfolio.dayChange >= 0 ? 'positive' : 'negative'}`}>
              ({formatPercent(portfolio.dayChangePercent)})
            </div>
          </div>
        </div>
        
        <div className="performance-chart">
          <h2>Portfolio Performance</h2>
          <div className="performance-metrics">
            {Object.entries(portfolio.performance).map(([period, value]) => (
              <div className="performance-item" key={period}>
                <div className="performance-period">{period}</div>
                <div className={`performance-value ${value >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercent(value)}
                </div>
              </div>
            ))}
          </div>
          <PortfolioPerformanceChart performanceData={portfolio.performance} />
        </div>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'holdings' ? 'active' : ''}`}
            onClick={() => setActiveTab('holdings')}
          >
            Holdings
          </button>
          <button 
            className={`tab ${activeTab === 'allocation' ? 'active' : ''}`}
            onClick={() => setActiveTab('allocation')}
          >
            Asset Allocation
          </button>
          <button 
            className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>
        
        {activeTab === 'holdings' && (
          <div className="tab-content">
            <h2>Holdings</h2>
            <div className="holdings-table">
              <div className="table-header">
                <div className="header-cell">Symbol</div>
                <div className="header-cell">Name</div>
                <div className="header-cell">Shares</div>
                <div className="header-cell">Avg Cost</div>
                <div className="header-cell">Current Price</div>
                <div className="header-cell">Value</div>
                <div className="header-cell">Change</div>
                <div className="header-cell">Change %</div>
              </div>
              <div className="table-body">
                {portfolio.holdings && portfolio.holdings.map((holding, idx) => (
                  <div className="table-row" key={idx}>
                    <div className="table-cell symbol">{holding.symbol}</div>
                    <div className="table-cell name">{holding.name}</div>
                    <div className="table-cell shares">{holding.shares}</div>
                    <div className="table-cell avg-cost">{formatCurrency(holding.avgCost)}</div>
                    <div className="table-cell current-price">{formatCurrency(holding.currentPrice)}</div>
                    <div className="table-cell value">{formatCurrency(holding.value)}</div>
                    <div className={`table-cell change ${holding.change >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(holding.change)}
                    </div>
                    <div className={`table-cell change-percent ${holding.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(holding.changePercent)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'allocation' && (
          <div className="tab-content">
            <h2>Asset Allocation</h2>
            <div className="allocation-content">
              <div className="allocation-chart">
                <AssetAllocationChart allocationData={portfolio.allocation} />
              </div>
                <div className="allocation-table">
                  <div className="table-header">
                    <div className="header-cell">Asset</div>
                    <div className="header-cell">Value</div>
                    <div className="header-cell">Allocation</div>
                    <div className="header-cell">Change</div>
                  </div>
                  <div className="table-body">
                    {portfolio.allocation && typeof portfolio.allocation === 'object' && 
                      Object.entries(portfolio.allocation).map(([asset, percent], idx) => (
                        <div className="table-row" key={idx}>
                          <div className="table-cell asset">{asset.charAt(0).toUpperCase() + asset.slice(1)}</div>
                          <div className="table-cell value">{formatCurrency((portfolio.totalValue * percent) / 100)}</div>
                          <div className="table-cell allocation">{percent}%</div>
                          <div className="table-cell change">
                            {formatCurrency(0)}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
            </div>
          </div>
        )}
        
        {activeTab === 'transactions' && (
          <div className="tab-content">
            <h2>Recent Transactions</h2>
            <div className="transactions-placeholder">
              <p>Transaction history will be displayed here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
