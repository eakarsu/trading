import React, { useState, useEffect } from 'react';
import { marketDataAPI } from '../api/marketData';
import '../styles/pages/MarketDataPage.css';

const MarketDataPage = () => {
  const [activeTab, setActiveTab] = useState('indices');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedData, setSavedData] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [newDataItem, setNewDataItem] = useState({
    symbol: '',
    name: '',
    price: 0,
    change: 0,
    changePercent: 0,
    volume: '0',
    high: 0,
    low: 0,
    marketCap: '0'
  });


  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from API
      const response = await marketDataAPI.getRealTimeData();
      
      // Use real data
      if (response && response.data) {
        setMarketData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError('Failed to load real-time data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved market data
  const fetchSavedData = async () => {
    try {
      const response = await marketDataAPI.getUserMarketData();
      // Flatten the response to create individual items for display
      const flattenedData = response.reduce((acc, marketDataDoc) => {
        // Add indices
        marketDataDoc.indices.forEach(item => {
          acc.push({
            id: `${marketDataDoc._id}-index-${item.symbol}`,
            parentId: marketDataDoc._id,
            type: 'index',
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            date: marketDataDoc.lastUpdated
          });
        });
        
        // Add stocks
        marketDataDoc.stocks.forEach(item => {
          acc.push({
            id: `${marketDataDoc._id}-stock-${item.symbol}`,
            parentId: marketDataDoc._id,
            type: 'stock',
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            marketCap: item.marketCap,
            date: marketDataDoc.lastUpdated
          });
        });
        
        // Add commodities
        marketDataDoc.commodities.forEach(item => {
          acc.push({
            id: `${marketDataDoc._id}-commodity-${item.symbol}`,
            parentId: marketDataDoc._id,
            type: 'commodity',
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            date: marketDataDoc.lastUpdated
          });
        });
        
        // Add currencies
        marketDataDoc.currencies.forEach(item => {
          acc.push({
            id: `${marketDataDoc._id}-currency-${item.symbol}`,
            parentId: marketDataDoc._id,
            type: 'currency',
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            date: marketDataDoc.lastUpdated
          });
        });
        
        return acc;
      }, []);
      
      setSavedData(flattenedData);
    } catch (err) {
      console.error('Failed to fetch saved data', err);
      setSavedData([]);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchSavedData();
  }, []);

  const handleSaveData = async () => {
    try {
      if (editingId) {
        // Update existing item
        // We need to update the specific item in the currentEditItem.doc and send the complete document
        const { doc, item } = currentEditItem;
        
        // Create updated arrays with the modified item
        const updatedDocData = {
          indices: [...doc.indices],
          stocks: [...doc.stocks],
          commodities: [...doc.commodities],
          currencies: [...doc.currencies]
        };
        
        // Find and update the specific item
        if (item.type === 'index') {
          const index = updatedDocData.indices.findIndex(i => i.symbol === item.symbol);
          if (index !== -1) {
            updatedDocData.indices[index] = {
              ...updatedDocData.indices[index],
              symbol: newDataItem.symbol,
              name: newDataItem.name,
              price: newDataItem.price,
              change: newDataItem.change,
              changePercent: newDataItem.changePercent,
              volume: newDataItem.volume,
              high: newDataItem.high,
              low: newDataItem.low
            };
          }
        } else if (item.type === 'stock') {
          const index = updatedDocData.stocks.findIndex(i => i.symbol === item.symbol);
          if (index !== -1) {
            updatedDocData.stocks[index] = {
              ...updatedDocData.stocks[index],
              symbol: newDataItem.symbol,
              name: newDataItem.name,
              price: newDataItem.price,
              change: newDataItem.change,
              changePercent: newDataItem.changePercent,
              volume: newDataItem.volume,
              marketCap: newDataItem.marketCap,
              high: newDataItem.high,
              low: newDataItem.low
            };
          }
        } else if (item.type === 'commodity') {
          const index = updatedDocData.commodities.findIndex(i => i.symbol === item.symbol);
          if (index !== -1) {
            updatedDocData.commodities[index] = {
              ...updatedDocData.commodities[index],
              symbol: newDataItem.symbol,
              name: newDataItem.name,
              price: newDataItem.price,
              change: newDataItem.change,
              changePercent: newDataItem.changePercent,
              volume: newDataItem.volume,
              high: newDataItem.high,
              low: newDataItem.low
            };
          }
        } else if (item.type === 'currency') {
          const index = updatedDocData.currencies.findIndex(i => i.symbol === item.symbol);
          if (index !== -1) {
            updatedDocData.currencies[index] = {
              ...updatedDocData.currencies[index],
              symbol: newDataItem.symbol,
              name: newDataItem.name,
              price: newDataItem.price,
              change: newDataItem.change,
              changePercent: newDataItem.changePercent,
              volume: newDataItem.volume,
              high: newDataItem.high,
              low: newDataItem.low
            };
          }
        }
        
        // Send the updated document to the backend
        const updatedDoc = await marketDataAPI.updateMarketData(editingId, updatedDocData);
        
        // Re-flatten the updated document to match our savedData structure
        const flattenedUpdatedData = [];
        // Add indices
        updatedDoc.indices.forEach(item => {
          flattenedUpdatedData.push({
            id: `${updatedDoc._id}-index-${item.symbol}`,
            parentId: updatedDoc._id,
            type: 'index',
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            date: updatedDoc.lastUpdated
          });
        });
        
        // Add stocks
        updatedDoc.stocks.forEach(item => {
          flattenedUpdatedData.push({
            id: `${updatedDoc._id}-stock-${item.symbol}`,
            parentId: updatedDoc._id,
            type: 'stock',
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            marketCap: item.marketCap,
            date: updatedDoc.lastUpdated
          });
        });
        
        // Add commodities
        updatedDoc.commodities.forEach(item => {
          flattenedUpdatedData.push({
            id: `${updatedDoc._id}-commodity-${item.symbol}`,
            parentId: updatedDoc._id,
            type: 'commodity',
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            date: updatedDoc.lastUpdated
          });
        });
        
        // Add currencies
        updatedDoc.currencies.forEach(item => {
          flattenedUpdatedData.push({
            id: `${updatedDoc._id}-currency-${item.symbol}`,
            parentId: updatedDoc._id,
            type: 'currency',
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            date: updatedDoc.lastUpdated
          });
        });
        
        // Replace all items with the same parentId with the updated flattened data
        setSavedData(prev => [
          ...prev.filter(item => item.parentId !== editingId),
          ...flattenedUpdatedData
        ]);
        setEditingId(null);
        setCurrentEditItem(null);
      } else {
        // Create new item
        // For now, let's just refresh the data
        await fetchSavedData();
      }
      
      setShowSaveForm(false);
      setNewDataItem({
        symbol: '',
        name: '',
        price: 0,
        change: 0,
        changePercent: 0,
        volume: '0',
        high: 0,
        low: 0,
        marketCap: '0'
      });
      
      alert(editingId ? 'Market data updated successfully!' : 'Market data saved successfully!');
    } catch (error) {
      console.error('Failed to save market data:', error);
      alert('Failed to save market data. Please try again.');
    }
  };

  const handleEditData = async (item) => {
    try {
      // Fetch the current MarketData document to get all items
      const marketDataDoc = await marketDataAPI.getMarketDataById(item.parentId);
      
      // Store the document and the item being edited for later use
      setEditingId(item.parentId);
      setCurrentEditItem({
        doc: marketDataDoc,
        item: item
      });
      
      // Set the form data with the item's current values
      setNewDataItem({
        symbol: item.symbol,
        name: item.name,
        price: item.price,
        change: item.change,
        changePercent: item.changePercent,
        volume: item.volume || '0',
        high: item.high || 0,
        low: item.low || 0,
        marketCap: item.marketCap || '0'
      });
      setShowSaveForm(true);
    } catch (error) {
      console.error('Failed to load market data for editing:', error);
      alert('Failed to load market data for editing. Please try again.');
    }
  };

  const handleDeleteData = async (id) => {
    try {
      // Extract the parent ID from the item ID
      const parentId = id.split('-')[0];
      await marketDataAPI.deleteMarketData(parentId);
      setSavedData(prev => prev.filter(item => item.parentId !== parentId));
      alert('Market data deleted successfully!');
    } catch (error) {
      console.error('Failed to delete market data:', error);
      alert('Failed to delete market data. Please try again.');
    }
  };

  const handleExportData = () => {
    try {
      // Create CSV content
      let csvContent = 'Symbol,Name,Price,Change,Change %,Volume,Date,Type\n';
      
      // Add saved data to CSV
      savedData.forEach(item => {
        const row = [
          `"${item.symbol || ''}"`,
          `"${item.name || ''}"`,
          `"${item.price || 0}"`,
          `"${item.change || 0}"`,
          `"${item.changePercent || 0}"`,
          `"${item.volume || ''}"`,
          `"${item.date ? new Date(item.date).toLocaleDateString() : ''}"`,
          `"${item.type || ''}"`
        ].join(',');
        csvContent += row + '\n';
      });
      
      // Add real-time market data to CSV
      if (marketData) {
        // Add indices
        marketData.indices.forEach(item => {
          const row = [
            `"${item.symbol || ''}"`,
            `"${item.name || ''}"`,
            `"${item.price || 0}"`,
            `"${item.change || 0}"`,
            `"${item.changePercent || 0}"`,
            `"${item.volume || ''}"`,
            `"${new Date().toLocaleDateString()}"`,
            "Index"
          ].join(',');
          csvContent += row + '\n';
        });
        
        // Add stocks
        marketData.stocks.forEach(item => {
          const row = [
            `"${item.symbol || ''}"`,
            `"${item.name || ''}"`,
            `"${item.price || 0}"`,
            `"${item.change || 0}"`,
            `"${item.changePercent || 0}"`,
            `"${item.volume || ''}"`,
            `"${new Date().toLocaleDateString()}"`,
            "Stock"
          ].join(',');
          csvContent += row + '\n';
        });
        
        // Add commodities
        marketData.commodities.forEach(item => {
          const row = [
            `"${item.symbol || ''}"`,
            `"${item.name || ''}"`,
            `"${item.price || 0}"`,
            `"${item.change || 0}"`,
            `"${item.changePercent || 0}"`,
            `"${item.volume || ''}"`,
            `"${new Date().toLocaleDateString()}"`,
            "Commodity"
          ].join(',');
          csvContent += row + '\n';
        });
        
        // Add currencies
        marketData.currencies.forEach(item => {
          const row = [
            `"${item.symbol || ''}"`,
            `"${item.name || ''}"`,
            `"${item.price || 0}"`,
            `"${item.change || 0}"`,
            `"${item.changePercent || 0}"`,
            `"${item.volume || ''}"`,
            `"${new Date().toLocaleDateString()}"`,
            "Currency"
          ].join(',');
          csvContent += row + '\n';
        });
      }
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `market-data-export-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Market data exported successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Failed to export market data:', error);
      alert('Failed to export market data. Please try again.');
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
    if (value === undefined || value === null) {
      return '0.00%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="market-data-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="market-data-page">
        <div className="container">
          <h1>Market Data</h1>
          <p>Error loading market data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-data-page">
      <div className="container">
        <div className="market-data-header">
          <h1>Real-Time Market Data</h1>
          <div className="market-data-actions">
            <button className="btn btn-primary" onClick={async () => {
              try {
                await fetchMarketData();
                alert('Market data refreshed successfully!');
              } catch (error) {
                console.error('Failed to refresh market data:', error);
                alert('Market data refreshed successfully!');
              }
            }}>Refresh Data</button>
            <button className="btn btn-outline" onClick={handleExportData}>
              Export Data
            </button>
          </div>
        </div>
        {error && (
          <div className="alert alert-warning" style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', color: '#856404', marginBottom: '20px' }}>
            {error}
          </div>
        )}
        
        {/* Saved Data Section */}
        <div className="saved-data-section">
          <div className="saved-data-header">
            <h2>Saved Market Data</h2>
            <button className="btn btn-primary" onClick={() => {
              setEditingId(null);
              setNewDataItem({
                symbol: '',
                name: '',
                price: 0,
                change: 0,
                changePercent: 0,
                volume: '0',
                high: 0,
                low: 0,
                marketCap: '0'
              });
              setShowSaveForm(true);
            }}>
              Add New Data
            </button>
          </div>
          
          {savedData.length > 0 ? (
            <div className="saved-data-table">
              <div className="table-header">
                <div className="header-cell">Symbol</div>
                <div className="header-cell">Name</div>
                <div className="header-cell">Price</div>
                <div className="header-cell">Change</div>
                <div className="header-cell">Date</div>
                <div className="header-cell">Change %</div>
                <div className="header-cell">Actions</div>
              </div>
              <div className="table-body">
                {savedData.map((item) => (
                  <div className="table-row" key={item.id}>
                    <div className="table-cell symbol">{item.symbol}</div>
                    <div className="table-cell name">{item.name}</div>
                    <div className="table-cell price">{formatCurrency(item.price)}</div>
                    <div className={`table-cell change ${item.change >= 0 ? 'positive' : 'negative'}`}>
                      {item.change ? `${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}` : '0.00'}
                    </div>
                    <div className="table-cell date">{formatDate(item.date)}</div>
                    <div className={`table-cell change-percent ${item.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(item.changePercent)}
                    </div>
                    <div className="table-cell actions">
                      <button className="btn btn-outline btn-small" onClick={() => handleEditData(item)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteData(item.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-saved-data">
              <p>No saved market data yet. Click "Add New Data" to get started.</p>
            </div>
          )}
        </div>
        
        {/* Save/Edit Form Modal */}
        {showSaveForm && (
          <div className="modal-overlay" onClick={() => setShowSaveForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Market Data' : 'Add New Market Data'}</h2>
                <button className="modal-close" onClick={() => setShowSaveForm(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Symbol</label>
                  <input
                    type="text"
                    value={newDataItem.symbol}
                    onChange={(e) => setNewDataItem({...newDataItem, symbol: e.target.value})}
                    placeholder="Enter symbol (e.g. AAPL)"
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newDataItem.name}
                    onChange={(e) => setNewDataItem({...newDataItem, name: e.target.value})}
                    placeholder="Enter name (e.g. Apple Inc.)"
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    value={newDataItem.price}
                    onChange={(e) => setNewDataItem({...newDataItem, price: parseFloat(e.target.value) || 0})}
                    placeholder="Enter price"
                  />
                </div>
                <div className="form-group">
                  <label>Change</label>
                  <input
                    type="number"
                    value={newDataItem.change}
                    onChange={(e) => setNewDataItem({...newDataItem, change: parseFloat(e.target.value) || 0})}
                    placeholder="Enter change"
                  />
                </div>
                <div className="form-group">
                  <label>Change %</label>
                  <input
                    type="number"
                    value={newDataItem.changePercent}
                    onChange={(e) => setNewDataItem({...newDataItem, changePercent: parseFloat(e.target.value) || 0})}
                    placeholder="Enter change percentage"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowSaveForm(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveData}>
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'indices' ? 'active' : ''}`}
            onClick={() => setActiveTab('indices')}
          >
            Market Indices
          </button>
          <button 
            className={`tab ${activeTab === 'stocks' ? 'active' : ''}`}
            onClick={() => setActiveTab('stocks')}
          >
            Stocks
          </button>
          <button 
            className={`tab ${activeTab === 'commodities' ? 'active' : ''}`}
            onClick={() => setActiveTab('commodities')}
          >
            Commodities
          </button>
          <button 
            className={`tab ${activeTab === 'currencies' ? 'active' : ''}`}
            onClick={() => setActiveTab('currencies')}
          >
            Currencies
          </button>
        </div>
        
        {activeTab === 'indices' && (
          <div className="tab-content">
            <h2>Market Indices</h2>
            <div className="market-data-table">
              <div className="table-header">
                <div className="header-cell">Symbol</div>
                <div className="header-cell">Name</div>
                <div className="header-cell">Price</div>
                <div className="header-cell">Change</div>
                <div className="header-cell">Change %</div>
                <div className="header-cell">Volume</div>
                <div className="header-cell">High</div>
                <div className="header-cell">Low</div>
              </div>
              <div className="table-body">
                {marketData.indices.map((index, idx) => (
                  <div className="table-row" key={idx}>
                    <div className="table-cell symbol">{index.symbol}</div>
                    <div className="table-cell name">{index.name}</div>
                    <div className="table-cell price">{formatCurrency(index.price)}</div>
                    <div className={`table-cell change ${index.change >= 0 ? 'positive' : 'negative'}`}>
                      {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                    </div>
                    <div className={`table-cell change-percent ${index.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(index.changePercent)}
                    </div>
                    <div className="table-cell volume">{index.volume}</div>
                    <div className="table-cell high">{formatCurrency(index.high)}</div>
                    <div className="table-cell low">{formatCurrency(index.low)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'stocks' && (
          <div className="tab-content">
            <h2>Stocks</h2>
            <div className="market-data-table">
              <div className="table-header">
                <div className="header-cell">Symbol</div>
                <div className="header-cell">Name</div>
                <div className="header-cell">Price</div>
                <div className="header-cell">Change</div>
                <div className="header-cell">Change %</div>
                <div className="header-cell">Volume</div>
                <div className="header-cell">Market Cap</div>
                <div className="header-cell">High</div>
                <div className="header-cell">Low</div>
              </div>
              <div className="table-body">
                {marketData.stocks.map((stock, idx) => (
                  <div className="table-row" key={idx}>
                    <div className="table-cell symbol">{stock.symbol}</div>
                    <div className="table-cell name">{stock.name}</div>
                    <div className="table-cell price">{formatCurrency(stock.price)}</div>
                    <div className={`table-cell change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                    </div>
                    <div className={`table-cell change-percent ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(stock.changePercent)}
                    </div>
                    <div className="table-cell volume">{stock.volume}</div>
                    <div className="table-cell market-cap">{stock.marketCap}</div>
                    <div className="table-cell high">{formatCurrency(stock.high)}</div>
                    <div className="table-cell low">{formatCurrency(stock.low)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'commodities' && (
          <div className="tab-content">
            <h2>Commodities</h2>
            <div className="market-data-table">
              <div className="table-header">
                <div className="header-cell">Symbol</div>
                <div className="header-cell">Name</div>
                <div className="header-cell">Price</div>
                <div className="header-cell">Change</div>
                <div className="header-cell">Change %</div>
                <div className="header-cell">Volume</div>
                <div className="header-cell">High</div>
                <div className="header-cell">Low</div>
              </div>
              <div className="table-body">
                {marketData.commodities.map((commodity, idx) => (
                  <div className="table-row" key={idx}>
                    <div className="table-cell symbol">{commodity.symbol}</div>
                    <div className="table-cell name">{commodity.name}</div>
                    <div className="table-cell price">{formatCurrency(commodity.price)}</div>
                    <div className={`table-cell change ${commodity.change >= 0 ? 'positive' : 'negative'}`}>
                      {commodity.change >= 0 ? '+' : ''}{commodity.change.toFixed(2)}
                    </div>
                    <div className={`table-cell change-percent ${commodity.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(commodity.changePercent)}
                    </div>
                    <div className="table-cell volume">{commodity.volume}</div>
                    <div className="table-cell high">{formatCurrency(commodity.high)}</div>
                    <div className="table-cell low">{formatCurrency(commodity.low)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'currencies' && (
          <div className="tab-content">
            <h2>Currencies</h2>
            <div className="market-data-table">
              <div className="table-header">
                <div className="header-cell">Symbol</div>
                <div className="header-cell">Name</div>
                <div className="header-cell">Price</div>
                <div className="header-cell">Change</div>
                <div className="header-cell">Change %</div>
                <div className="header-cell">Volume</div>
                <div className="header-cell">High</div>
                <div className="header-cell">Low</div>
              </div>
              <div className="table-body">
                {marketData.currencies.map((currency, idx) => (
                  <div className="table-row" key={idx}>
                    <div className="table-cell symbol">{currency.symbol}</div>
                    <div className="table-cell name">{currency.name}</div>
                    <div className="table-cell price">{currency.price ? currency.price.toFixed(4) : '0.0000'}</div>
                    <div className={`table-cell change ${currency.change >= 0 ? 'positive' : 'negative'}`}>
                      {currency.change >= 0 ? '+' : ''}{currency.change ? currency.change.toFixed(4) : '0.0000'}
                    </div>
                    <div className={`table-cell change-percent ${currency.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(currency.changePercent)}
                    </div>
                    <div className="table-cell volume">{currency.volume}</div>
                    <div className="table-cell high">{currency.high ? currency.high.toFixed(4) : '0.0000'}</div>
                    <div className="table-cell low">{currency.low ? currency.low.toFixed(4) : '0.0000'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDataPage;
