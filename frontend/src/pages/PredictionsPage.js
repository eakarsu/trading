import React, { useState, useEffect } from 'react';
import { predictionsAPI } from '../api/marketData';
import MarketForecastChart from '../components/MarketForecastChart';
import '../styles/pages/PredictionsPage.css';

const PredictionsPage = () => {
  const [predictions, setPredictions] = useState(null);
  const [predictionsList, setPredictionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('market');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPrediction, setNewPrediction] = useState({
    market: { forecast: [], confidence: 80, methodology: '' },
    stocks: [],
    sectors: [],
    sentiment: { news: 0, social: 0, technical: 0, overall: 0 },
    timeframe: '1W'
  });

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const [detailModalType, setDetailModalType] = useState(null); // 'stock' or 'sector'
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sample forecast data for demonstration
  const sampleForecastData = [
    { date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), spx: 5850, ndx: 18500, dji: 43200, rut: 2180 },
    { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), spx: 5875, ndx: 18650, dji: 43350, rut: 2195 },
    { date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), spx: 5820, ndx: 18400, dji: 43100, rut: 2165 },
    { date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), spx: 5890, ndx: 18750, dji: 43450, rut: 2210 },
    { date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), spx: 5910, ndx: 18850, dji: 43600, rut: 2225 },
    { date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), spx: 5865, ndx: 18600, dji: 43300, rut: 2190 },
    { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), spx: 5925, ndx: 18950, dji: 43750, rut: 2240 }
  ];

  // Sample predictions data
  const samplePredictions = {
    market: {
      forecast: sampleForecastData,
      confidence: 85,
      methodology: 'LSTM Neural Network with Technical Indicators'
    },
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', current: 195.50, predicted: 205.25, change: 4.99, confidence: 82, timeframe: '1W' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', current: 415.30, predicted: 425.80, change: 2.53, confidence: 78, timeframe: '1W' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', current: 175.20, predicted: 182.40, change: 4.11, confidence: 75, timeframe: '1W' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', current: 185.90, predicted: 178.50, change: -3.98, confidence: 80, timeframe: '1W' },
      { symbol: 'TSLA', name: 'Tesla Inc.', current: 248.75, predicted: 265.30, change: 6.65, confidence: 70, timeframe: '1W' }
    ],
    sectors: [
      { name: 'Technology', current: 12.5, predicted: 15.2, confidence: 85 },
      { name: 'Healthcare', current: 8.3, predicted: 9.1, confidence: 78 },
      { name: 'Financial', current: -2.1, predicted: 1.5, confidence: 72 },
      { name: 'Energy', current: 15.7, predicted: 18.3, confidence: 68 },
      { name: 'Consumer Discretionary', current: 6.8, predicted: 4.2, confidence: 75 }
    ],
    sentiment: {
      news: 72,
      social: 68,
      technical: 78,
      overall: 73
    }
  };

  // Fetch all predictions
  const fetchPredictionsList = async () => {
    try {
      setLoading(true);
      const response = await predictionsAPI.getAllPredictions();
      setPredictionsList(response);

      // Set the first prediction as selected if available
      if (response.length > 0 && !selectedPrediction) {
        setSelectedPrediction(response[0]);
      }
    } catch (err) {
      console.error('Failed to fetch predictions list', err);
      alert('Failed to load predictions list. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific prediction by ID
  const fetchPredictionById = async (id) => {
    try {
      setLoading(true);
      const response = await predictionsAPI.getPredictionById(id);
      setPredictions(response);
    } catch (err) {
      console.error('Failed to fetch prediction data', err);
      alert('Failed to load prediction data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictionsList();
  }, []);

  useEffect(() => {
    if (selectedPrediction) {
      // Use the selected prediction data directly instead of fetching by ID
      setPredictions(selectedPrediction);
    }
  }, [selectedPrediction]);

  const handleCreatePrediction = async () => {
    try {
      const createdPrediction = await predictionsAPI.createPrediction(newPrediction);
      setPredictionsList(prev => [...prev, createdPrediction]);
      setSelectedPrediction(createdPrediction);
      setShowCreateForm(false);
      setNewPrediction({
        market: { forecast: [], confidence: 80, methodology: '' },
        stocks: [],
        sectors: [],
        sentiment: { news: 0, social: 0, technical: 0, overall: 0 },
        timeframe: '1W'
      });

      alert('Prediction created successfully!');
    } catch (error) {
      console.error('Failed to create prediction:', error);
      alert('Failed to create prediction. Please try again.');
    }
  };

  const handleUpdatePrediction = async () => {
    try {
      if (!selectedPrediction) return;

      const updatedPrediction = await predictionsAPI.updatePrediction(selectedPrediction._id || selectedPrediction.id, predictions);
      setPredictionsList(prev => prev.map(p => (p._id || p.id) === (selectedPrediction._id || selectedPrediction.id) ? updatedPrediction : p));
      setSelectedPrediction(updatedPrediction);

      alert('Prediction updated successfully!');
    } catch (error) {
      console.error('Failed to update prediction:', error);
      alert('Failed to update prediction. Please try again.');
    }
  };

  const handleDeletePrediction = async (predictionId) => {
    try {
      await predictionsAPI.deletePrediction(predictionId);
      setPredictionsList(prev => prev.filter(p => (p._id || p.id) !== predictionId));
      if (selectedPrediction && (selectedPrediction._id || selectedPrediction.id) === predictionId) {
        setSelectedPrediction(predictionsList.find(p => (p._id || p.id) !== predictionId) || null);
      }

      alert('Prediction deleted successfully!');
    } catch (error) {
      console.error('Failed to delete prediction:', error);
      alert('Failed to delete prediction. Please try again.');
    }
  };

  // --- Detail Modal Handlers ---

  const openDetailModal = (item, type) => {
    setDetailModalData({ ...item });
    setDetailModalType(type);
    setDetailModalOpen(true);
    setIsEditing(false);
    setEditFormData({});
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setDetailModalData(null);
    setDetailModalType(null);
    setIsEditing(false);
    setEditFormData({});
  };

  const handleEditClick = () => {
    if (detailModalType === 'stock') {
      setEditFormData({
        predicted: detailModalData.predicted,
        confidence: detailModalData.confidence,
        timeframe: detailModalData.timeframe || '1W'
      });
    } else if (detailModalType === 'sector') {
      setEditFormData({
        predicted: detailModalData.predicted,
        confidence: detailModalData.confidence
      });
    }
    setIsEditing(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = () => {
    if (!detailModalData || !displayPredictions) return;

    if (detailModalType === 'stock') {
      const updatedStocks = displayPredictions.stocks.map(s => {
        if (s.symbol === detailModalData.symbol) {
          const newPredicted = parseFloat(editFormData.predicted);
          const newConfidence = parseInt(editFormData.confidence, 10);
          const newTimeframe = editFormData.timeframe;
          const newChange = s.current ? ((newPredicted - s.current) / s.current) * 100 : s.change;
          return {
            ...s,
            predicted: newPredicted,
            confidence: newConfidence,
            timeframe: newTimeframe,
            change: newChange
          };
        }
        return s;
      });

      const updatedPredictions = { ...displayPredictions, stocks: updatedStocks };
      setPredictions(updatedPredictions);

      // Update the detail modal data to reflect saved changes
      const updatedItem = updatedStocks.find(s => s.symbol === detailModalData.symbol);
      setDetailModalData(updatedItem);
    } else if (detailModalType === 'sector') {
      const updatedSectors = displayPredictions.sectors.map(s => {
        if (s.name === detailModalData.name) {
          return {
            ...s,
            predicted: parseFloat(editFormData.predicted),
            confidence: parseInt(editFormData.confidence, 10)
          };
        }
        return s;
      });

      const updatedPredictions = { ...displayPredictions, sectors: updatedSectors };
      setPredictions(updatedPredictions);

      const updatedItem = updatedSectors.find(s => s.name === detailModalData.name);
      setDetailModalData(updatedItem);
    }

    setIsEditing(false);
    setEditFormData({});
  };

  const handleDetailDelete = async () => {
    if (!detailModalData) return;

    // If the prediction has an _id or id (i.e. it's from the backend), call delete API
    const predId = selectedPrediction?._id || selectedPrediction?.id;
    if (predId) {
      try {
        await predictionsAPI.deletePrediction(predId);
        setPredictionsList(prev => prev.filter(p => (p._id || p.id) !== predId));

        // If this was the currently selected prediction, select the next available
        const remaining = predictionsList.filter(p => (p._id || p.id) !== predId);
        if (remaining.length > 0) {
          setSelectedPrediction(remaining[0]);
        } else {
          setSelectedPrediction(null);
          setPredictions(null);
        }

        closeDetailModal();
        alert('Prediction deleted successfully!');
      } catch (error) {
        console.error('Failed to delete prediction:', error);
        alert('Failed to delete prediction. Please try again.');
      }
    } else {
      // For sample data, remove from local state only
      if (detailModalType === 'stock') {
        const updatedStocks = displayPredictions.stocks.filter(s => s.symbol !== detailModalData.symbol);
        setPredictions(prev => ({ ...prev, stocks: updatedStocks }));
      } else if (detailModalType === 'sector') {
        const updatedSectors = displayPredictions.sectors.filter(s => s.name !== detailModalData.name);
        setPredictions(prev => ({ ...prev, sectors: updatedSectors }));
      }
      closeDetailModal();
    }
  };

  // --- Sidebar Prediction Click ---
  const handleSidebarPredictionClick = (prediction) => {
    setSelectedPrediction(prediction);
  };

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
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && !predictions) {
    return (
      <div className="predictions-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Use sample data if predictions is null or incomplete
  let displayPredictions = predictions || samplePredictions;

  // If we have prediction data but it's in the backend format, use it directly
  if (predictions && (predictions.market || predictions.stocks || predictions.sectors)) {
    displayPredictions = predictions;
  } else if (predictionsList.length > 0 && !predictions) {
    // Use the first prediction from the list if no specific prediction is selected
    displayPredictions = predictionsList[0];
  }

  // Final fallback check - if still no valid data structure, show loading
  if (!displayPredictions || (!displayPredictions.market && !displayPredictions.stocks && !displayPredictions.sectors)) {
    return (
      <div className="predictions-page">
        <div className="container">
          <h1>Predictive Analytics</h1>
          <p>Loading predictions data...</p>
        </div>
      </div>
    );
  }

  // Ensure we have the required structure for display
  if (!displayPredictions.market) {
    displayPredictions.market = {
      forecast: sampleForecastData,
      confidence: 85,
      methodology: 'LSTM Neural Network with Technical Indicators'
    };
  }

  if (!displayPredictions.stocks) {
    displayPredictions.stocks = samplePredictions.stocks;
  }

  if (!displayPredictions.sectors) {
    displayPredictions.sectors = samplePredictions.sectors;
  }

  if (!displayPredictions.sentiment) {
    displayPredictions.sentiment = samplePredictions.sentiment;
  }

  return (
    <div className="predictions-page">
      {/* Predictions List Sidebar */}
      <div className={`predictions-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3>Predictions</h3>
          <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '\u2039' : '\u203A'}
          </button>
        </div>
        {sidebarOpen && (
          <div className="sidebar-list">
            {predictionsList.length === 0 && (
              <div className="sidebar-empty">No predictions available</div>
            )}
            {predictionsList.map((pred, idx) => {
              const predId = pred._id || pred.id || idx;
              const isActive = selectedPrediction && (selectedPrediction._id || selectedPrediction.id) === predId;
              return (
                <div
                  key={predId}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSidebarPredictionClick(pred)}
                >
                  <div className="sidebar-item-title">
                    Prediction #{idx + 1}
                  </div>
                  <div className="sidebar-item-meta">
                    {pred.timeframe && <span className="sidebar-item-timeframe">{pred.timeframe}</span>}
                    {pred.market && pred.market.confidence && (
                      <span className="sidebar-item-confidence">{pred.market.confidence}% conf</span>
                    )}
                  </div>
                  {pred.market && pred.market.methodology && (
                    <div className="sidebar-item-method">{pred.market.methodology}</div>
                  )}
                  {pred.createdAt && (
                    <div className="sidebar-item-date">
                      {new Date(pred.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`predictions-main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <div className="container">
          <div className="predictions-header">
            <h1>Predictive Analytics & Forecasting</h1>
            <div className="predictions-actions">
              {!sidebarOpen && (
                <button className="btn btn-outline sidebar-open-btn" onClick={() => setSidebarOpen(true)}>
                  Predictions List
                </button>
              )}
              <button className="btn btn-primary" onClick={async () => {
                setIsGenerating(true);
                try {
                  const newPredictions = await predictionsAPI.generatePrediction({ timeframe: '1W' });
                  if (newPredictions) {
                    setPredictions(newPredictions);
                    alert('New prediction generated successfully!');
                  } else {
                    throw new Error('No prediction data received');
                  }
                } catch (error) {
                  console.error('Failed to generate prediction:', error);
                  alert('Failed to generate prediction. Please try again.');
                } finally {
                  setIsGenerating(false);
                }
              }} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Run New Prediction'}
              </button>
              <button className="btn btn-outline" onClick={async () => {
                try {
                  if (!predictions) {
                    alert('No prediction data available to export. Please generate a prediction first.');
                    return;
                  }

                  const result = await predictionsAPI.exportReport('latest');
                  if (result && result.message) {
                    alert('Report exported successfully! Check your downloads folder.');
                  } else {
                    throw new Error('Export failed');
                  }
                } catch (error) {
                  console.error('Failed to export report:', error);
                  alert('Failed to export report. Please try again.');
                }
              }}>
                Export Report
              </button>
            </div>
          </div>

          <div className="predictions-summary">
            <div className="summary-card">
              <h2>Model Confidence</h2>
              <div className="confidence-meter">
                <div className="confidence-value">{displayPredictions.market.confidence}%</div>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${displayPredictions.market.confidence}%` }}
                  ></div>
                </div>
                <div className="confidence-description">Overall Prediction Confidence</div>
              </div>
            </div>

            <div className="summary-card">
              <h2>Sentiment Analysis</h2>
              <div className="sentiment-grid">
                <div className="sentiment-item">
                  <div className="sentiment-label">News</div>
                  <div className="sentiment-value">{displayPredictions.sentiment.news}%</div>
                </div>
                <div className="sentiment-item">
                  <div className="sentiment-label">Social</div>
                  <div className="sentiment-value">{displayPredictions.sentiment.social}%</div>
                </div>
                <div className="sentiment-item">
                  <div className="sentiment-label">Technical</div>
                  <div className="sentiment-value">{displayPredictions.sentiment.technical}%</div>
                </div>
                <div className="sentiment-item">
                  <div className="sentiment-label">Overall</div>
                  <div className="sentiment-value">{displayPredictions.sentiment.overall}%</div>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <h2>Methodology</h2>
              <div className="methodology-content">
                <div className="methodology-value">{displayPredictions.market.methodology}</div>
                <div className="methodology-description">AI Model Used</div>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'market' ? 'active' : ''}`}
              onClick={() => setActiveTab('market')}
            >
              Market Forecast
            </button>
            <button
              className={`tab ${activeTab === 'stocks' ? 'active' : ''}`}
              onClick={() => setActiveTab('stocks')}
            >
              Stock Predictions
            </button>
            <button
              className={`tab ${activeTab === 'sectors' ? 'active' : ''}`}
              onClick={() => setActiveTab('sectors')}
            >
              Sector Analysis
            </button>
          </div>

          {activeTab === 'market' && (
            <div className="tab-content">
              <h2>Market Forecast</h2>
              <div className="forecast-chart">
                <MarketForecastChart forecastData={displayPredictions.market.forecast} />
              </div>
              <div className="forecast-table">
                <div className="table-header">
                  <div className="header-cell">Date</div>
                  <div className="header-cell">S&P 500</div>
                  <div className="header-cell">NASDAQ</div>
                  <div className="header-cell">DOW JONES</div>
                  <div className="header-cell">RUSSELL 2000</div>
                </div>
                <div className="table-body">
                  {displayPredictions.market.forecast.map((item, idx) => (
                    <div className="table-row" key={idx}>
                      <div className="table-cell date">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="table-cell spx">{item.spx.toLocaleString()}</div>
                      <div className="table-cell ndx">{item.ndx.toLocaleString()}</div>
                      <div className="table-cell dji">{item.dji.toLocaleString()}</div>
                      <div className="table-cell rut">{item.rut.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stocks' && (
            <div className="tab-content">
              <h2>Stock Predictions</h2>
              <p className="clickable-hint">Click a row to view details</p>
              <div className="stocks-table">
                <div className="table-header">
                  <div className="header-cell">Symbol</div>
                  <div className="header-cell">Name</div>
                  <div className="header-cell">Current Price</div>
                  <div className="header-cell">Predicted Price</div>
                  <div className="header-cell">Change</div>
                  <div className="header-cell">Confidence</div>
                  <div className="header-cell">Timeframe</div>
                </div>
                <div className="table-body">
                  {displayPredictions.stocks.map((stock, idx) => (
                    <div
                      className="table-row clickable-row"
                      key={idx}
                      onClick={() => openDetailModal(stock, 'stock')}
                    >
                      <div className="table-cell symbol">{stock.symbol}</div>
                      <div className="table-cell name">{stock.name}</div>
                      <div className="table-cell current">{formatCurrency(stock.current)}</div>
                      <div className="table-cell predicted">{formatCurrency(stock.predicted)}</div>
                      <div className={`table-cell change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(stock.change)}%
                      </div>
                      <div className="table-cell confidence">{stock.confidence}%</div>
                      <div className="table-cell timeframe">{stock.timeframe}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sectors' && (
            <div className="tab-content">
              <h2>Sector Analysis</h2>
              <p className="clickable-hint">Click a row to view details</p>
              <div className="sectors-table">
                <div className="table-header">
                  <div className="header-cell">Sector</div>
                  <div className="header-cell">Current Performance</div>
                  <div className="header-cell">Predicted Performance</div>
                  <div className="header-cell">Confidence</div>
                </div>
                <div className="table-body">
                  {displayPredictions.sectors.map((sector, idx) => (
                    <div
                      className="table-row clickable-row"
                      key={idx}
                      onClick={() => openDetailModal(sector, 'sector')}
                    >
                      <div className="table-cell sector">{sector.name}</div>
                      <div className={`table-cell current ${sector.current >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(sector.current)}%
                      </div>
                      <div className={`table-cell predicted ${sector.predicted >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(sector.predicted)}%
                      </div>
                      <div className="table-cell confidence">{sector.confidence}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && detailModalData && (
        <div className="detail-modal-overlay" onClick={closeDetailModal}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>
                {detailModalType === 'stock'
                  ? `${detailModalData.symbol} - ${detailModalData.name}`
                  : `${detailModalData.name} Sector`}
              </h2>
              <button className="detail-modal-close" onClick={closeDetailModal}>&times;</button>
            </div>

            <div className="detail-modal-body">
              {!isEditing ? (
                <>
                  {/* Display Mode */}
                  <div className="detail-grid">
                    {detailModalType === 'stock' && (
                      <>
                        <div className="detail-field">
                          <span className="detail-label">Symbol</span>
                          <span className="detail-value">{detailModalData.symbol}</span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Name</span>
                          <span className="detail-value">{detailModalData.name}</span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Current Price</span>
                          <span className="detail-value">{formatCurrency(detailModalData.current)}</span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Predicted Price</span>
                          <span className="detail-value">{formatCurrency(detailModalData.predicted)}</span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Change %</span>
                          <span className={`detail-value ${detailModalData.change >= 0 ? 'positive' : 'negative'}`}>
                            {formatPercent(detailModalData.change)}
                          </span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Confidence</span>
                          <span className="detail-value">{detailModalData.confidence}%</span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Timeframe</span>
                          <span className="detail-value">{detailModalData.timeframe}</span>
                        </div>
                      </>
                    )}

                    {detailModalType === 'sector' && (
                      <>
                        <div className="detail-field">
                          <span className="detail-label">Sector</span>
                          <span className="detail-value">{detailModalData.name}</span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Current Performance</span>
                          <span className={`detail-value ${detailModalData.current >= 0 ? 'positive' : 'negative'}`}>
                            {formatPercent(detailModalData.current)}
                          </span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Predicted Performance</span>
                          <span className={`detail-value ${detailModalData.predicted >= 0 ? 'positive' : 'negative'}`}>
                            {formatPercent(detailModalData.predicted)}
                          </span>
                        </div>
                        <div className="detail-field">
                          <span className="detail-label">Confidence</span>
                          <span className="detail-value">{detailModalData.confidence}%</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Technical Indicators Section */}
                  <div className="detail-section">
                    <h3>Technical Indicators</h3>
                    <div className="detail-indicators">
                      {detailModalType === 'stock' && (
                        <>
                          <div className="indicator-item">
                            <span className="indicator-label">RSI (14)</span>
                            <span className="indicator-value">
                              {detailModalData.rsi || (detailModalData.confidence > 75 ? '58.3' : '44.7')}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">MACD</span>
                            <span className={`indicator-value ${detailModalData.change >= 0 ? 'positive' : 'negative'}`}>
                              {detailModalData.macd || (detailModalData.change >= 0 ? 'Bullish' : 'Bearish')}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Moving Avg (50)</span>
                            <span className="indicator-value">
                              {detailModalData.ma50 || formatCurrency(detailModalData.current * 0.97)}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Moving Avg (200)</span>
                            <span className="indicator-value">
                              {detailModalData.ma200 || formatCurrency(detailModalData.current * 0.93)}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Volume Trend</span>
                            <span className="indicator-value">
                              {detailModalData.volumeTrend || (detailModalData.change >= 0 ? 'Above Average' : 'Below Average')}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Bollinger Band</span>
                            <span className="indicator-value">
                              {detailModalData.bollingerBand || 'Middle'}
                            </span>
                          </div>
                        </>
                      )}
                      {detailModalType === 'sector' && (
                        <>
                          <div className="indicator-item">
                            <span className="indicator-label">Momentum</span>
                            <span className={`indicator-value ${detailModalData.predicted >= detailModalData.current ? 'positive' : 'negative'}`}>
                              {detailModalData.momentum || (detailModalData.predicted >= detailModalData.current ? 'Positive' : 'Negative')}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Relative Strength</span>
                            <span className="indicator-value">
                              {detailModalData.relativeStrength || (detailModalData.confidence > 75 ? 'Strong' : 'Moderate')}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Trend</span>
                            <span className={`indicator-value ${detailModalData.predicted >= 0 ? 'positive' : 'negative'}`}>
                              {detailModalData.trend || (detailModalData.predicted >= 0 ? 'Uptrend' : 'Downtrend')}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Volatility</span>
                            <span className="indicator-value">
                              {detailModalData.volatility || (detailModalData.confidence > 75 ? 'Low' : 'Moderate')}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode */}
                  <div className="detail-edit-form">
                    <h3>Edit Prediction</h3>
                    <div className="edit-form-group">
                      <label>{detailModalType === 'stock' ? 'Predicted Price' : 'Predicted Performance'}</label>
                      <input
                        type="number"
                        step={detailModalType === 'stock' ? '0.01' : '0.1'}
                        value={editFormData.predicted}
                        onChange={(e) => handleEditFormChange('predicted', e.target.value)}
                      />
                    </div>
                    <div className="edit-form-group">
                      <label>Confidence (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editFormData.confidence}
                        onChange={(e) => handleEditFormChange('confidence', e.target.value)}
                      />
                    </div>
                    {detailModalType === 'stock' && (
                      <div className="edit-form-group">
                        <label>Timeframe</label>
                        <select
                          value={editFormData.timeframe}
                          onChange={(e) => handleEditFormChange('timeframe', e.target.value)}
                        >
                          <option value="1D">1 Day</option>
                          <option value="1W">1 Week</option>
                          <option value="1M">1 Month</option>
                          <option value="3M">3 Months</option>
                          <option value="6M">6 Months</option>
                          <option value="1Y">1 Year</option>
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="detail-modal-footer">
              {!isEditing ? (
                <>
                  <button className="btn btn-primary" onClick={handleEditClick}>Edit</button>
                  <button className="btn btn-danger" onClick={handleDetailDelete}>Delete</button>
                  <button className="btn btn-outline" onClick={closeDetailModal}>Close</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={handleEditSave}>Save Changes</button>
                  <button className="btn btn-outline" onClick={() => { setIsEditing(false); setEditFormData({}); }}>Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionsPage;
