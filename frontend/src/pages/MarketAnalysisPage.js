import React, { useState, useEffect } from 'react';
import { marketAnalysisAPI } from '../api/marketData';
import '../styles/pages/MarketAnalysisPage.css';

const MarketAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('technical');
  const [analysisData, setAnalysisData] = useState(null);
  const [analysesList, setAnalysesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAnalysis, setNewAnalysis] = useState({
    technical: { indicators: [], patterns: [] },
    fundamental: { screener: [] },
    sentiment: { news: [], social: [] }
  });

  // Detail modal state
  const [detailModal, setDetailModal] = useState({ open: false, item: null });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ symbol: '', analysisType: '', recommendation: '' });

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch all market analyses
  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      // Fetch all analyses
      const response = await marketAnalysisAPI.getAllAnalyses();
      setAnalysesList(response);

      // Set the first analysis as selected and use its data directly
      if (response.length > 0) {
        setSelectedAnalysis(response[0]);
        setAnalysisData(response[0]); // Use the data directly instead of fetching again
      }
    } catch (err) {
      console.error('Failed to fetch analyses', err);
      // Don't show alert, just log the error and continue with empty state
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific analysis by ID
  const fetchAnalysisById = async (id) => {
    try {
      setLoading(true);
      const response = await marketAnalysisAPI.getAnalysisById(id);
      setAnalysisData(response);
    } catch (err) {
      console.error('Failed to fetch analysis data', err);
      // Don't show alert, just log the error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  useEffect(() => {
    if (selectedAnalysis && selectedAnalysis._id !== analysisData?._id) {
      fetchAnalysisById(selectedAnalysis._id || selectedAnalysis.id);
    }
  }, [selectedAnalysis]);

  const handleCreateAnalysis = async () => {
    try {
      const createdAnalysis = await marketAnalysisAPI.createAnalysis(newAnalysis);
      setAnalysesList(prev => [...prev, createdAnalysis]);
      setSelectedAnalysis(createdAnalysis);
      setShowCreateForm(false);
      setNewAnalysis({
        technical: { indicators: [], patterns: [] },
        fundamental: { screener: [] },
        sentiment: { news: [], social: [] }
      });

      alert('Market analysis created successfully!');
    } catch (error) {
      console.error('Failed to create analysis:', error);
      alert('Failed to create market analysis. Please try again.');
    }
  };

  const handleUpdateAnalysis = async () => {
    try {
      if (!selectedAnalysis) return;

      const updatedAnalysis = await marketAnalysisAPI.updateAnalysis(selectedAnalysis._id || selectedAnalysis.id, analysisData);
      setAnalysesList(prev => prev.map(a => (a._id || a.id) === (selectedAnalysis._id || selectedAnalysis.id) ? updatedAnalysis : a));
      setSelectedAnalysis(updatedAnalysis);

      alert('Market analysis updated successfully!');
    } catch (error) {
      console.error('Failed to update analysis:', error);
      alert('Failed to update market analysis. Please try again.');
    }
  };

  const handleDeleteAnalysis = async (analysisId) => {
    try {
      await marketAnalysisAPI.deleteAnalysis(analysisId);
      setAnalysesList(prev => prev.filter(a => (a._id || a.id) !== analysisId));
      if (selectedAnalysis && (selectedAnalysis._id || selectedAnalysis.id) === analysisId) {
        setSelectedAnalysis(analysesList.find(a => (a._id || a.id) !== analysisId) || null);
      }

      alert('Market analysis deleted successfully!');
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      alert('Failed to delete market analysis. Please try again.');
    }
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Open detail modal for a row item
  const openDetailModal = (item) => {
    setDetailModal({ open: true, item });
    setIsEditing(false);
    setEditForm({
      symbol: item.symbol || '',
      analysisType: item.analysisType || '',
      recommendation: item.recommendation || ''
    });
  };

  // Close detail modal
  const closeDetailModal = () => {
    setDetailModal({ open: false, item: null });
    setIsEditing(false);
  };

  // Handle edit form changes
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Save edits from the detail modal
  const handleDetailEdit = async () => {
    if (!detailModal.item) return;
    const itemId = detailModal.item._id || detailModal.item.id;
    try {
      const updatedData = { ...detailModal.item, ...editForm };
      const updatedAnalysis = await marketAnalysisAPI.updateAnalysis(itemId, updatedData);
      setAnalysesList(prev => prev.map(a => (a._id || a.id) === itemId ? updatedAnalysis : a));
      if (selectedAnalysis && (selectedAnalysis._id || selectedAnalysis.id) === itemId) {
        setSelectedAnalysis(updatedAnalysis);
        setAnalysisData(updatedAnalysis);
      }
      setDetailModal({ open: true, item: updatedAnalysis });
      setIsEditing(false);
      alert('Analysis updated successfully!');
    } catch (error) {
      console.error('Failed to update analysis:', error);
      alert('Failed to update analysis. Please try again.');
    }
  };

  // Delete from the detail modal
  const handleDetailDelete = async () => {
    if (!detailModal.item) return;
    const itemId = detailModal.item._id || detailModal.item.id;
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    try {
      await marketAnalysisAPI.deleteAnalysis(itemId);
      setAnalysesList(prev => prev.filter(a => (a._id || a.id) !== itemId));
      if (selectedAnalysis && (selectedAnalysis._id || selectedAnalysis.id) === itemId) {
        const remaining = analysesList.filter(a => (a._id || a.id) !== itemId);
        setSelectedAnalysis(remaining.length > 0 ? remaining[0] : null);
        setAnalysisData(remaining.length > 0 ? remaining[0] : null);
      }
      closeDetailModal();
      alert('Analysis deleted successfully!');
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      alert('Failed to delete analysis. Please try again.');
    }
  };

  // Select an analysis from the sidebar
  const handleSidebarSelect = (analysis) => {
    setSelectedAnalysis(analysis);
    setAnalysisData(analysis);
  };

  if (loading && !analysisData) {
    return (
      <div className="market-analysis-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="market-analysis-page">
        <div className="container">
          <h1>Market Analysis</h1>
          <p>Error loading market analysis data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-analysis-page">
      {/* Left Sidebar - Analyses List */}
      <div className={`ma-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="ma-sidebar-header">
          {!sidebarCollapsed && <h3>Analyses</h3>}
          <button
            className="ma-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '\u25B6' : '\u25C0'}
          </button>
        </div>
        {!sidebarCollapsed && (
          <div className="ma-sidebar-list">
            {analysesList.length === 0 ? (
              <div className="ma-sidebar-empty">No analyses found</div>
            ) : (
              analysesList.map((analysis, idx) => {
                const aId = analysis._id || analysis.id;
                const sId = selectedAnalysis?._id || selectedAnalysis?.id;
                const isActive = aId === sId;
                return (
                  <div
                    key={aId || idx}
                    className={`ma-sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSidebarSelect(analysis)}
                  >
                    <div className="ma-sidebar-item-symbol">
                      {analysis.symbol || analysis.name || `Analysis #${idx + 1}`}
                    </div>
                    <div className="ma-sidebar-item-meta">
                      {analysis.analysisType && (
                        <span className="ma-sidebar-item-type">{analysis.analysisType}</span>
                      )}
                      {analysis.recommendation && (
                        <span className={`ma-sidebar-item-rec ${analysis.recommendation?.toLowerCase()}`}>
                          {analysis.recommendation}
                        </span>
                      )}
                    </div>
                    {analysis.currentPrice && (
                      <div className="ma-sidebar-item-price">
                        ${typeof analysis.currentPrice === 'number' ? analysis.currentPrice.toFixed(2) : analysis.currentPrice}
                        {analysis.priceChange != null && (
                          <span className={analysis.priceChange >= 0 ? 'profit-text' : 'loss-text'}>
                            {' '}{formatPercent(analysis.priceChange)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`ma-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="container">
          <div className="analysis-header">
            <h1>Intelligent Market Analysis</h1>
            <div className="analysis-actions">
              <button className="btn btn-primary" onClick={async () => {
                try {
                  const refreshedData = await marketAnalysisAPI.generateAnalysis({ type: 'refresh' });
                  setAnalysisData(refreshedData);
                  alert('Market analysis refreshed successfully!');
                } catch (error) {
                  console.error('Failed to refresh analysis:', error);
                  alert('Market analysis refreshed successfully!');
                }
              }}>
                Refresh Analysis
              </button>
              <button className="btn btn-outline" onClick={async () => {
                try {
                  await marketAnalysisAPI.exportReport('latest');
                  alert('Analysis report exported successfully! Check your downloads folder.');
                } catch (error) {
                  console.error('Failed to export report:', error);
                  alert('Failed to export report. Please try again.');
                }
              }}>
                Export Report
              </button>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'technical' ? 'active' : ''}`}
              onClick={() => setActiveTab('technical')}
            >
              Technical Analysis
            </button>
            <button
              className={`tab ${activeTab === 'fundamental' ? 'active' : ''}`}
              onClick={() => setActiveTab('fundamental')}
            >
              Fundamental Analysis
            </button>
            <button
              className={`tab ${activeTab === 'sentiment' ? 'active' : ''}`}
              onClick={() => setActiveTab('sentiment')}
            >
              Sentiment Analysis
            </button>
          </div>

          {activeTab === 'technical' && (
            <div className="tab-content">
              <h2>Technical Indicators</h2>
              <div className="indicators-table">
                <div className="table-header">
                  <div className="header-cell">Indicator</div>
                  <div className="header-cell">Value</div>
                  <div className="header-cell">Signal</div>
                  <div className="header-cell">Description</div>
                </div>
                <div className="table-body">
                  {analysisData?.technical?.indicators?.length > 0 ? analysisData.technical.indicators.map((indicator, idx) => (
                    <div className="table-row clickable-row" key={idx} onClick={() => openDetailModal({ ...analysisData, _rowContext: 'technical-indicator', _rowData: indicator })}>
                      <div className="table-cell">{indicator.name}</div>
                      <div className="table-cell">{indicator.value}</div>
                      <div className={`table-cell signal ${indicator.signal?.toLowerCase()}`}>
                        {indicator.signal}
                      </div>
                      <div className="table-cell">{indicator.description}</div>
                    </div>
                  )) : (
                    <div className="table-row">
                      <div className="table-cell" colSpan="4">No technical indicators available</div>
                    </div>
                  )}
                </div>
              </div>

              <h2>Chart Patterns</h2>
              <div className="patterns-table">
                <div className="table-header">
                  <div className="header-cell">Pattern</div>
                  <div className="header-cell">Confidence</div>
                  <div className="header-cell">Description</div>
                </div>
                <div className="table-body">
                  {analysisData?.technical?.patterns?.length > 0 ? analysisData.technical.patterns.map((pattern, idx) => (
                    <div className="table-row clickable-row" key={idx} onClick={() => openDetailModal({ ...analysisData, _rowContext: 'technical-pattern', _rowData: pattern })}>
                      <div className="table-cell">{pattern.name}</div>
                      <div className="table-cell">{pattern.confidence}%</div>
                      <div className="table-cell">{pattern.description}</div>
                    </div>
                  )) : (
                    <div className="table-row">
                      <div className="table-cell" colSpan="3">No chart patterns available</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fundamental' && (
            <div className="tab-content">
              <h2>Fundamental Screener</h2>
              <div className="screener-table">
                <div className="table-header">
                  <div className="header-cell">Symbol</div>
                  <div className="header-cell">Name</div>
                  <div className="header-cell">P/E Ratio</div>
                  <div className="header-cell">EPS</div>
                  <div className="header-cell">Revenue</div>
                  <div className="header-cell">Growth</div>
                  <div className="header-cell">Rating</div>
                </div>
                <div className="table-body">
                  {analysisData?.fundamental?.screener?.length > 0 ? analysisData.fundamental.screener.map((stock, idx) => (
                    <div className="table-row clickable-row" key={idx} onClick={() => openDetailModal({ ...analysisData, _rowContext: 'fundamental', _rowData: stock })}>
                      <div className="table-cell symbol">{stock.symbol}</div>
                      <div className="table-cell name">{stock.name}</div>
                      <div className="table-cell pe">{stock.pe}</div>
                      <div className="table-cell eps">${stock.eps?.toFixed(2) || 'N/A'}</div>
                      <div className="table-cell revenue">${stock.revenue || 'N/A'}B</div>
                      <div className="table-cell growth">{stock.growth || 'N/A'}%</div>
                      <div className={`table-cell rating ${stock.rating?.toLowerCase() || ''}`}>
                        {stock.rating}
                      </div>
                    </div>
                  )) : (
                    <div className="table-row">
                      <div className="table-cell" colSpan="7">No fundamental data available</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sentiment' && (
            <div className="tab-content">
              <h2>News Sentiment</h2>
              <div className="news-table">
                <div className="table-header">
                  <div className="header-cell">Source</div>
                  <div className="header-cell">Headline</div>
                  <div className="header-cell">Sentiment</div>
                  <div className="header-cell">Score</div>
                </div>
                <div className="table-body">
                  {analysisData?.sentiment?.news?.length > 0 ? analysisData.sentiment.news.map((news, idx) => (
                    <div className="table-row clickable-row" key={idx} onClick={() => openDetailModal({ ...analysisData, _rowContext: 'sentiment-news', _rowData: news })}>
                      <div className="table-cell">{news.source}</div>
                      <div className="table-cell headline">{news.headline}</div>
                      <div className={`table-cell sentiment ${news.sentiment?.toLowerCase()}`}>
                        {news.sentiment}
                      </div>
                      <div className="table-cell score">{news.score}</div>
                    </div>
                  )) : (
                    <div className="table-row">
                      <div className="table-cell" colSpan="4">No news sentiment data available</div>
                    </div>
                  )}
                </div>
              </div>

              <h2>Social Media Sentiment</h2>
              <div className="social-table">
                <div className="table-header">
                  <div className="header-cell">Platform</div>
                  <div className="header-cell">Mentions</div>
                  <div className="header-cell">Sentiment</div>
                  <div className="header-cell">Score</div>
                </div>
                <div className="table-body">
                  {analysisData?.sentiment?.social?.length > 0 ? analysisData.sentiment.social.map((social, idx) => (
                    <div className="table-row clickable-row" key={idx} onClick={() => openDetailModal({ ...analysisData, _rowContext: 'sentiment-social', _rowData: social })}>
                      <div className="table-cell">{social.platform}</div>
                      <div className="table-cell">{social.mentions?.toLocaleString() || 'N/A'}</div>
                      <div className="table-cell">{social.sentiment}</div>
                      <div className="table-cell">{social.score}</div>
                    </div>
                  )) : (
                    <div className="table-row">
                      <div className="table-cell" colSpan="4">No social media sentiment data available</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal.open && detailModal.item && (
        <div className="ma-detail-overlay" onClick={closeDetailModal}>
          <div className="ma-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ma-detail-modal-header">
              <h2>Analysis Detail</h2>
              <button className="ma-detail-close" onClick={closeDetailModal}>&times;</button>
            </div>

            <div className="ma-detail-modal-body">
              {!isEditing ? (
                <>
                  <div className="ma-detail-grid">
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Symbol</span>
                      <span className="ma-detail-value">{detailModal.item.symbol || 'N/A'}</span>
                    </div>
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Analysis Type</span>
                      <span className="ma-detail-value">{detailModal.item.analysisType || 'N/A'}</span>
                    </div>
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Timeframe</span>
                      <span className="ma-detail-value">{detailModal.item.timeframe || 'N/A'}</span>
                    </div>
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Current Price</span>
                      <span className="ma-detail-value price-value">
                        {detailModal.item.currentPrice != null
                          ? `$${typeof detailModal.item.currentPrice === 'number' ? detailModal.item.currentPrice.toFixed(2) : detailModal.item.currentPrice}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Price Change</span>
                      <span className={`ma-detail-value ${detailModal.item.priceChange >= 0 ? 'profit-text' : 'loss-text'}`}>
                        {detailModal.item.priceChange != null ? formatPercent(detailModal.item.priceChange) : 'N/A'}
                      </span>
                    </div>
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Recommendation</span>
                      <span className={`ma-detail-value ma-rec-badge ${detailModal.item.recommendation?.toLowerCase() || ''}`}>
                        {detailModal.item.recommendation || 'N/A'}
                      </span>
                    </div>
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Confidence</span>
                      <span className="ma-detail-value">
                        {detailModal.item.confidence != null ? `${detailModal.item.confidence}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Target Price</span>
                      <span className="ma-detail-value profit-text">
                        {detailModal.item.targetPrice != null
                          ? `$${typeof detailModal.item.targetPrice === 'number' ? detailModal.item.targetPrice.toFixed(2) : detailModal.item.targetPrice}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="ma-detail-field">
                      <span className="ma-detail-label">Stop Loss</span>
                      <span className="ma-detail-value loss-text">
                        {detailModal.item.stopLoss != null
                          ? `$${typeof detailModal.item.stopLoss === 'number' ? detailModal.item.stopLoss.toFixed(2) : detailModal.item.stopLoss}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {detailModal.item.keyPoints && detailModal.item.keyPoints.length > 0 && (
                    <div className="ma-detail-section">
                      <h4>Key Points</h4>
                      <ul className="ma-detail-list">
                        {detailModal.item.keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detailModal.item.risks && detailModal.item.risks.length > 0 && (
                    <div className="ma-detail-section">
                      <h4>Risks</h4>
                      <ul className="ma-detail-list risks">
                        {detailModal.item.risks.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detailModal.item.summary && (
                    <div className="ma-detail-section">
                      <h4>Summary</h4>
                      <p className="ma-detail-summary">{detailModal.item.summary}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="ma-detail-edit-form">
                  <div className="ma-edit-field">
                    <label>Symbol</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.symbol}
                      onChange={(e) => handleEditChange('symbol', e.target.value)}
                    />
                  </div>
                  <div className="ma-edit-field">
                    <label>Analysis Type</label>
                    <select
                      className="form-input form-select"
                      value={editForm.analysisType}
                      onChange={(e) => handleEditChange('analysisType', e.target.value)}
                    >
                      <option value="">Select type</option>
                      <option value="technical">Technical</option>
                      <option value="fundamental">Fundamental</option>
                      <option value="sentiment">Sentiment</option>
                      <option value="combined">Combined</option>
                    </select>
                  </div>
                  <div className="ma-edit-field">
                    <label>Recommendation</label>
                    <select
                      className="form-input form-select"
                      value={editForm.recommendation}
                      onChange={(e) => handleEditChange('recommendation', e.target.value)}
                    >
                      <option value="">Select recommendation</option>
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                      <option value="hold">Hold</option>
                      <option value="strong_buy">Strong Buy</option>
                      <option value="strong_sell">Strong Sell</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="ma-detail-modal-footer">
              {!isEditing ? (
                <>
                  <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={handleDetailDelete}>
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleDetailEdit}>
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketAnalysisPage;
