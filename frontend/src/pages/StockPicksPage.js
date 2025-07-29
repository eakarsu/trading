import React, { useState, useEffect } from 'react';
import './StockPicksPage.css';

const StockPicksPage = () => {
  const [stockPicks, setStockPicks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    riskTolerance: 'moderate',
    timeframe: 'short-term',
    sectors: [],
    marketCap: 'all',
    dividendRequired: false,
    esgFocus: false
  });

  const handleGenerateStockPicks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/stock-picks/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferences: userPreferences
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate stock picks');
      }

      const data = await response.json();
      setStockPicks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation?.toLowerCase()) {
      case 'buy':
      case 'strong buy':
        return '#28a745';
      case 'hold':
        return '#ffc107';
      case 'sell':
      case 'strong sell':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getConfidenceColor = (confidence) => {
    const conf = parseInt(confidence);
    if (conf >= 80) return '#28a745';
    if (conf >= 60) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="stock-picks-page">
        <div className="page-header">
          <h1>AI Stock Picks</h1>
          <p>Get intelligent stock recommendations powered by comprehensive AI analysis</p>
        </div>

        {/* User Preferences Panel */}
        <div className="preferences-panel">
          <h2>Investment Preferences</h2>
          <div className="preferences-grid">
            <div className="preference-group">
              <label>Risk Tolerance</label>
              <select 
                value={userPreferences.riskTolerance}
                onChange={(e) => handlePreferenceChange('riskTolerance', e.target.value)}
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>

            <div className="preference-group">
              <label>Investment Timeframe</label>
              <select 
                value={userPreferences.timeframe}
                onChange={(e) => handlePreferenceChange('timeframe', e.target.value)}
              >
                <option value="day-trading">Day Trading (intraday)</option>
                <option value="short-term">Short Term Trading (2-3 days)</option>
                <option value="2-3-weeks">2-3 Week Trading</option>
                <option value="1-month">1 Month Trading</option>
                <option value="short">Short Term (1-6 months)</option>
                <option value="medium">Medium Term (6-18 months)</option>
                <option value="long">Long Term (18+ months)</option>
              </select>
            </div>

            <div className="preference-group">
              <label>Market Cap Preference</label>
              <select 
                value={userPreferences.marketCap}
                onChange={(e) => handlePreferenceChange('marketCap', e.target.value)}
              >
                <option value="all">All Market Caps</option>
                <option value="large">Large Cap</option>
                <option value="mid">Mid Cap</option>
                <option value="small">Small Cap</option>
              </select>
            </div>

            <div className="preference-group">
              <label>
                <input
                  type="checkbox"
                  checked={userPreferences.dividendRequired}
                  onChange={(e) => handlePreferenceChange('dividendRequired', e.target.checked)}
                />
                Dividend Required
              </label>
            </div>

            <div className="preference-group">
              <label>
                <input
                  type="checkbox"
                  checked={userPreferences.esgFocus}
                  onChange={(e) => handlePreferenceChange('esgFocus', e.target.checked)}
                />
                ESG Focus
              </label>
            </div>
          </div>

          <button 
            className="generate-btn"
            onClick={handleGenerateStockPicks}
            disabled={loading}
          >
            {loading ? 'Generating AI Stock Picks...' : 'Generate Stock Picks'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        {stockPicks && (
          <div className="stock-picks-results">
            {/* Market Outlook */}
            <div className="market-outlook-section">
              <h2>Market Outlook</h2>
              <div className="outlook-grid">
                <div className="outlook-item">
                  <h3>Short Term (1-3 days)</h3>
                  <p>{stockPicks.marketOutlook?.shortTerm}</p>
                </div>
                <div className="outlook-item">
                  <h3>Medium Term (1-2 weeks)</h3>
                  <p>{stockPicks.marketOutlook?.mediumTerm}</p>
                </div>
                <div className="outlook-item">
                  <h3>Long Term (3-4 weeks)</h3>
                  <p>{stockPicks.marketOutlook?.longTerm}</p>
                </div>
              </div>
            </div>

            {/* Stock Recommendations */}
            <div className="recommendations-section">
              <h2>Stock Recommendations</h2>
              <div className="stocks-grid">
                {stockPicks.recommendations?.map((stock, index) => (
                  <div key={index} className="stock-card">
                    <div className="stock-header">
                      <div className="stock-info">
                        <h3>{stock.symbol}</h3>
                        <p className="company-name">{stock.companyName}</p>
                        <span className="sector-tag">{stock.sector}</span>
                      </div>
                      <div className="recommendation-badge" 
                           style={{ backgroundColor: getRecommendationColor(stock.recommendation) }}>
                        {stock.recommendation}
                      </div>
                    </div>

                    <div className="price-info">
                      <div className="price-item">
                        <span className="label">Current Price:</span>
                        <span className="value">${stock.currentPrice}</span>
                      </div>
                      <div className="price-item">
                        <span className="label">Target Price:</span>
                        <span className="value">${stock.targetPrice}</span>
                      </div>
                      <div className="price-item">
                        <span className="label">Confidence:</span>
                        <span className="value" style={{ color: getConfidenceColor(stock.confidence) }}>
                          {stock.confidence}%
                        </span>
                      </div>
                    </div>

                    <div className="analysis-scores">
                      <div className="score-item">
                        <span>Technical</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${stock.analysis?.technical?.score || 0}%` }}></div>
                        </div>
                        <span>{stock.analysis?.technical?.score || 0}</span>
                      </div>
                      <div className="score-item">
                        <span>Fundamental</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${stock.analysis?.fundamental?.score || 0}%` }}></div>
                        </div>
                        <span>{stock.analysis?.fundamental?.score || 0}</span>
                      </div>
                      <div className="score-item">
                        <span>Sentiment</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${stock.analysis?.sentiment?.score || 0}%` }}></div>
                        </div>
                        <span>{stock.analysis?.sentiment?.score || 0}</span>
                      </div>
                    </div>

                    <div className="stock-details">
                      <div className="reasoning">
                        <h4>Analysis</h4>
                        <p>{stock.reasoning}</p>
                      </div>

                      {stock.catalysts && stock.catalysts.length > 0 && (
                        <div className="catalysts">
                          <h4>Catalysts</h4>
                          <ul>
                            {stock.catalysts.map((catalyst, idx) => (
                              <li key={idx}>{catalyst}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {stock.risks && stock.risks.length > 0 && (
                        <div className="risks">
                          <h4>Risks</h4>
                          <ul>
                            {stock.risks.map((risk, idx) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Allocation */}
            {stockPicks.portfolioAllocation && (
              <div className="allocation-section">
                <h2>Recommended Portfolio Allocation</h2>
                <div className="allocation-grid">
                  <div className="allocation-item">
                    <h3>Conservative</h3>
                    <p>{stockPicks.portfolioAllocation.conservative}</p>
                  </div>
                  <div className="allocation-item">
                    <h3>Moderate</h3>
                    <p>{stockPicks.portfolioAllocation.moderate}</p>
                  </div>
                  <div className="allocation-item">
                    <h3>Aggressive</h3>
                    <p>{stockPicks.portfolioAllocation.aggressive}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sector Breakdown */}
            {stockPicks.sectorBreakdown && (
              <div className="sector-section">
                <h2>Sector Allocation</h2>
                <div className="sector-grid">
                  {Object.entries(stockPicks.sectorBreakdown).map(([sector, allocation]) => (
                    <div key={sector} className="sector-item">
                      <span className="sector-name">{sector}</span>
                      <span className="sector-allocation">{allocation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {stockPicks.summary && (
              <div className="summary-section">
                <h2>Executive Summary</h2>
                <p>{stockPicks.summary}</p>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default StockPicksPage;
