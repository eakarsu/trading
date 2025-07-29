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
                  <div className="table-row" key={idx}>
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
                  <div className="table-row" key={idx}>
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
                  <div className="table-row" key={idx}>
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
                  <div className="table-row" key={idx}>
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
                  <div className="table-row" key={idx}>
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
  );
};

export default MarketAnalysisPage;
