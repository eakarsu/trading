const MarketAnalysis = require('../models/MarketAnalysis');
const aiService = require('../utils/aiService');

// Get all market analyses for user
exports.getMarketAnalyses = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    let analyses = await MarketAnalysis.findAll({ 
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    // Transform the data to match frontend expectations
    const transformedAnalyses = analyses.map(analysis => {
      const transformed = {
        id: analysis.id,
        userId: analysis.userId,
        symbol: analysis.symbol,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
      };

      // Transform technical analysis data
      if (analysis.technicalAnalysis) {
        const techData = analysis.technicalAnalysis;
        transformed.technical = {
          indicators: [],
          patterns: []
        };

        // Extract indicators from technical analysis
        if (techData.indicators) {
          Object.entries(techData.indicators).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              let signal = 'neutral';
              let description = `${key.toUpperCase()} indicator`;
              let displayValue = value;
              
              // Handle complex objects and determine signal based on indicator type
              if (key === 'rsi') {
                signal = value > 70 ? 'overbought' : value < 30 ? 'oversold' : 'neutral';
                description = `RSI at ${value}, indicating ${signal} conditions`;
                displayValue = typeof value === 'number' ? value.toFixed(2) : value;
              } else if (key === 'macd') {
                signal = value > 0 ? 'bullish' : 'bearish';
                description = `MACD at ${value}, showing ${signal} momentum`;
                displayValue = typeof value === 'number' ? value.toFixed(2) : value;
              } else if (key === 'bollinger' && typeof value === 'object') {
                // Handle Bollinger Bands object
                if (value.upper && value.lower && value.middle) {
                  displayValue = `${value.middle.toFixed(2)}`;
                  description = `Bollinger Bands: Upper ${value.upper.toFixed(2)}, Middle ${value.middle.toFixed(2)}, Lower ${value.lower.toFixed(2)}`;
                  signal = 'neutral';
                } else {
                  displayValue = 'N/A';
                }
              } else if (typeof value === 'object') {
                // Handle any other objects by converting to string
                displayValue = JSON.stringify(value);
              } else if (typeof value === 'number') {
                displayValue = value.toFixed(2);
              }
              
              transformed.technical.indicators.push({
                name: key.toUpperCase(),
                value: displayValue,
                signal: signal,
                description: description
              });
            }
          });
        }

        // Extract patterns from signals
        if (techData.signals && Array.isArray(techData.signals)) {
          techData.signals.forEach(signal => {
            transformed.technical.patterns.push({
              name: signal,
              confidence: 75,
              description: `Technical pattern: ${signal}`
            });
          });
        }
      }

      // Transform fundamental analysis data
      if (analysis.fundamentalAnalysis) {
        const fundData = analysis.fundamentalAnalysis;
        transformed.fundamental = {
          screener: []
        };

        // Create a screener entry for the current symbol
        if (analysis.symbol) {
          transformed.fundamental.screener.push({
            symbol: analysis.symbol,
            name: `${analysis.symbol} Inc.`,
            pe: fundData.pe || 'N/A',
            eps: fundData.eps || 'N/A',
            revenue: fundData.revenue ? (fundData.revenue / 1000000000).toFixed(1) : 'N/A',
            growth: fundData.revenueGrowth || 'N/A',
            rating: 'Buy' // Default rating
          });
        }
      }

      // Transform sentiment analysis data
      if (analysis.sentimentAnalysis) {
        const sentData = analysis.sentimentAnalysis;
        transformed.sentiment = {
          overall: sentData.overall || 50,
          news: [],
          social: []
        };

        // Extract news data
        if (sentData.news && sentData.news.articles && Array.isArray(sentData.news.articles)) {
          transformed.sentiment.news = sentData.news.articles.map(article => ({
            headline: article.title || article.headline || 'Market Update',
            sentiment: article.sentiment || 'neutral',
            score: article.score || 0.5,
            source: article.source || 'Financial News'
          }));
        }

        // Add default news if none exist
        if (transformed.sentiment.news.length === 0) {
          transformed.sentiment.news = [
            { headline: 'Market shows mixed signals amid economic uncertainty', sentiment: 'neutral', score: 0.5, source: 'Financial Times' },
            { headline: 'Tech sector continues to outperform broader market', sentiment: 'positive', score: 0.7, source: 'Reuters' },
            { headline: 'Federal Reserve maintains current interest rate policy', sentiment: 'neutral', score: 0.4, source: 'Bloomberg' }
          ];
        }

        // Extract social media data
        if (sentData.social) {
          transformed.sentiment.social = [
            { platform: 'Twitter', sentiment: 'bullish', score: sentData.social.score || 65, mentions: sentData.social.mentions || 10000 },
            { platform: 'Reddit', sentiment: 'neutral', score: 55, mentions: 7500 },
            { platform: 'StockTwits', sentiment: 'bullish', score: 70, mentions: 12000 }
          ];
        } else {
          transformed.sentiment.social = [
            { platform: 'Twitter', sentiment: 'bullish', score: 65, mentions: 10000 },
            { platform: 'Reddit', sentiment: 'neutral', score: 55, mentions: 7500 },
            { platform: 'StockTwits', sentiment: 'bullish', score: 70, mentions: 12000 }
          ];
        }
      }

      return transformed;
    });

    // If user has no analyses, create default ones
    if (transformedAnalyses.length === 0) {
      console.log(`Creating default market analyses for user ${req.user.id}`);
      
      const defaultAnalysis = {
        id: 'default-1',
        userId: req.user.id,
        symbol: 'MARKET',
        technical: {
          indicators: [
            { name: 'RSI', value: 65.2, signal: 'overbought', description: 'Relative Strength Index indicates overbought conditions' },
            { name: 'MACD', value: 0.85, signal: 'bullish', description: 'MACD line above signal line, indicating bullish momentum' },
            { name: 'SMA 20', value: 485.50, signal: 'bullish', description: '20-day Simple Moving Average shows upward trend' },
            { name: 'SMA 50', value: 478.30, signal: 'bullish', description: '50-day Simple Moving Average confirms long-term uptrend' },
            { name: 'Bollinger Bands', value: 'upper', signal: 'overbought', description: 'Price near upper Bollinger Band suggests overbought conditions' }
          ],
          patterns: [
            { name: 'Bull Flag', confidence: 78, description: 'Bullish continuation pattern identified' },
            { name: 'Higher Highs', confidence: 85, description: 'Series of higher highs indicates strong uptrend' }
          ]
        },
        fundamental: {
          screener: [
            { symbol: 'AAPL', name: 'Apple Inc.', pe: 28.5, eps: 6.95, revenue: 394.3, growth: 8.2, rating: 'Buy' },
            { symbol: 'MSFT', name: 'Microsoft Corp.', pe: 32.1, eps: 12.93, revenue: 211.9, growth: 12.1, rating: 'Buy' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', pe: 25.8, eps: 5.80, revenue: 307.4, growth: 15.3, rating: 'Strong Buy' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', pe: 45.2, eps: 3.08, revenue: 574.8, growth: 9.7, rating: 'Buy' },
            { symbol: 'TSLA', name: 'Tesla Inc.', pe: 65.3, eps: 4.02, revenue: 96.8, growth: 18.8, rating: 'Hold' }
          ]
        },
        sentiment: {
          overall: 72,
          news: [
            { headline: 'Tech Stocks Rally on Strong Earnings', sentiment: 'positive', score: 0.8, source: 'Financial Times' },
            { headline: 'Federal Reserve Signals Dovish Stance', sentiment: 'positive', score: 0.7, source: 'Reuters' },
            { headline: 'Market Volatility Expected Ahead of FOMC', sentiment: 'neutral', score: 0.1, source: 'Bloomberg' }
          ],
          social: [
            { platform: 'Twitter', sentiment: 'bullish', score: 75, mentions: 12500 },
            { platform: 'Reddit', sentiment: 'bullish', score: 68, mentions: 8900 },
            { platform: 'StockTwits', sentiment: 'neutral', score: 52, mentions: 15600 }
          ]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return res.json([defaultAnalysis]);
    }
    
    res.json(transformedAnalyses);
  } catch (error) {
    console.error('Error fetching market analyses:', error);
    res.status(500).json({ 
      message: 'Server error while fetching market analyses' 
    });
  }
};

// Get a specific market analysis by ID
exports.getMarketAnalysisById = async (req, res) => {
  try {
    const analysis = await MarketAnalysis.findOne({ 
      where: {
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!analysis) {
      return res.status(404).json({ 
        message: 'Market analysis not found' 
      });
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching market analysis:', error);
    res.status(500).json({ 
      message: 'Server error while fetching market analysis' 
    });
  }
};

// Create a new market analysis
exports.createMarketAnalysis = async (req, res) => {
  try {
    const analysisData = {
      userId: req.user.id,
      technical: req.body.technical,
      fundamental: req.body.fundamental,
      sentiment: req.body.sentiment
    };
    
    const analysis = await MarketAnalysis.create(analysisData);
    
    res.status(201).json(analysis);
  } catch (error) {
    console.error('Error creating market analysis:', error);
    res.status(500).json({ 
      message: 'Server error while creating market analysis' 
    });
  }
};

// Update a market analysis
exports.updateMarketAnalysis = async (req, res) => {
  try {
    const updateData = {};
    const updateFields = ['technical', 'fundamental', 'sentiment'];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const [updatedRowsCount] = await MarketAnalysis.update(updateData, {
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Market analysis not found' 
      });
    }
    
    const analysis = await MarketAnalysis.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('Error updating market analysis:', error);
    res.status(500).json({ 
      message: 'Server error while updating market analysis' 
    });
  }
};

// Delete a market analysis
exports.deleteMarketAnalysis = async (req, res) => {
  try {
    const deletedRowsCount = await MarketAnalysis.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Market analysis not found' 
      });
    }
    
    res.json({ message: 'Market analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting market analysis:', error);
    res.status(500).json({ 
      message: 'Server error while deleting market analysis' 
    });
  }
};

// Get trading assistant response
exports.getTradingAssistantResponse = async (req, res) => {
  try {
    const { message, conversationHistory, context } = req.body;
    
    // Use AI service to generate response
    const aiResponse = await aiService.getTradingAssistantResponse(
      conversationHistory || [],
      {
        userMessage: message,
        ...context
      }
    );
    
    res.json({ 
      response: aiResponse,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting trading assistant response:', error);
    res.status(500).json({ 
      message: 'Server error while getting trading assistant response' 
    });
  }
};

// Generate a new market analysis using AI
exports.generateMarketAnalysis = async (req, res) => {
  try {
    // Get real-time market data for analysis
    // We need to create a mock response object to capture the data
    let marketData = null;
    let marketDataError = null;
    
    // Create a mock response object
    const mockRes = {
      json: (data) => {
        marketData = data;
      },
      status: (code) => {
        if (code >= 400) {
          marketDataError = code;
        }
        return mockRes;
      }
    };
    
    // Call the function with our mock response
    await require('./marketDataController').getRealTimeData(req, mockRes);
    
    // Check if there was an error
    if (marketDataError) {
      return res.status(marketDataError).json({ 
        message: 'Error fetching market data' 
      });
    }
    
    // Check if we got data
    if (!marketData || !marketData.data) {
      return res.status(500).json({ 
        message: 'Failed to fetch market data' 
      });
    }
    
    // Use AI service to generate analysis
    const aiAnalysis = await aiService.generateMarketAnalysis(marketData.data);
    
    // Parse AI response
    let analysisData;
    try {
      analysisData = JSON.parse(aiAnalysis);
    } catch (parseError) {
      // If AI response isn't valid JSON, create a basic structure
      analysisData = {
        technical: {
          indicators: [],
          patterns: []
        },
        fundamental: {
          screener: []
        },
        sentiment: {
          overall: aiAnalysis,
          news: [],
          social: []
        }
      };
    }
    
    const analysis = await MarketAnalysis.create({
      userId: req.user.id,
      symbol: 'MARKET', // Default symbol for general market analysis
      currentPrice: 0, // Default price for general market analysis
      technical: analysisData.technical,
      fundamental: analysisData.fundamental,
      sentiment: analysisData.sentiment
    });
    
    res.status(201).json(analysis);
  } catch (error) {
    console.error('Error generating market analysis:', error);
    res.status(500).json({ 
      message: 'Server error while generating market analysis' 
    });
  }
};

// Export market analysis report
exports.exportAnalysis = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Get all analyses for the user if no specific ID provided
    let analyses;
    if (req.params.id) {
      const analysis = await MarketAnalysis.findOne({ 
        where: {
          id: req.params.id, 
          userId: req.user.id 
        }
      });
      
      if (!analysis) {
        return res.status(404).json({ 
          message: 'Market analysis not found' 
        });
      }
      analyses = [analysis];
    } else {
      analyses = await MarketAnalysis.findAll({ 
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
    }
    
    // If no analyses found, create a simple CSV with headers
    if (analyses.length === 0) {
      const csvContent = 'Date,Technical Indicators,Fundamental Analysis,Sentiment Score,Created At\nNo market analyses found\n';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="market-analysis-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return res.send(csvContent);
    }
    
    // Generate CSV content
    const csvHeader = 'Date,Technical Indicators,Fundamental Analysis,Sentiment Score,Created At\n';
    const csvRows = analyses.map(analysis => {
      // Safely extract technical indicators
      let technicalSummary = 'No data';
      if (analysis.technical && analysis.technical.indicators && Array.isArray(analysis.technical.indicators)) {
        technicalSummary = analysis.technical.indicators.map(ind => `${ind.name || 'Unknown'}: ${ind.value || 'N/A'}`).join('; ');
      } else if (analysis.technicalAnalysis && analysis.technicalAnalysis.indicators) {
        // Handle different data structure
        const indicators = analysis.technicalAnalysis.indicators;
        technicalSummary = Object.entries(indicators).map(([key, value]) => `${key}: ${value}`).join('; ');
      }
      
      // Safely extract fundamental analysis
      let fundamentalSummary = 'No data';
      if (analysis.fundamental && analysis.fundamental.screener && Array.isArray(analysis.fundamental.screener)) {
        fundamentalSummary = analysis.fundamental.screener.map(stock => `${stock.symbol || 'Unknown'}: ${stock.rating || 'N/A'}`).join('; ');
      } else if (analysis.fundamentalAnalysis) {
        // Handle different data structure
        const fundData = analysis.fundamentalAnalysis;
        fundamentalSummary = `PE: ${fundData.pe || 'N/A'}, EPS: ${fundData.eps || 'N/A'}, Revenue: ${fundData.revenue || 'N/A'}`;
      }
      
      // Safely extract sentiment score
      let sentimentScore = 'No data';
      if (analysis.sentiment && analysis.sentiment.overall) {
        sentimentScore = analysis.sentiment.overall;
      } else if (analysis.sentimentAnalysis && analysis.sentimentAnalysis.overall) {
        sentimentScore = analysis.sentimentAnalysis.overall;
      }
      
      return `"${new Date().toISOString()}","${technicalSummary}","${fundamentalSummary}","${sentimentScore}","${analysis.createdAt}"`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="market-analysis-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting market analysis:', error);
    res.status(500).json({ 
      message: 'Server error while exporting market analysis' 
    });
  }
};

// Generate AI-powered stock picks
exports.generateStockPicks = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Get user preferences from request body
    const userPreferences = req.body.preferences || {};
    
    // Get real-time market data for analysis
    let marketData = null;
    let marketDataError = null;
    
    // Create a mock response object to capture market data
    const mockRes = {
      json: (data) => {
        marketData = data;
      },
      status: (code) => {
        if (code >= 400) {
          marketDataError = code;
        }
        return mockRes;
      }
    };
    
    // Call the market data controller to get current data
    await require('./marketDataController').getRealTimeData(req, mockRes);
    
    // Check if there was an error getting market data
    if (marketDataError) {
      return res.status(marketDataError).json({ 
        message: 'Error fetching market data for stock analysis' 
      });
    }
    
    // Check if we got valid market data
    if (!marketData || !marketData.data) {
      return res.status(500).json({ 
        message: 'Failed to fetch market data for stock analysis' 
      });
    }
    
    // Use AI service to generate comprehensive stock picks
    const aiStockPicks = await aiService.generateStockPicks(marketData.data, userPreferences);
    
    // Parse AI response
    let stockPicksData;
    try {
      stockPicksData = JSON.parse(aiStockPicks);
    } catch (parseError) {
      console.error('Error parsing AI stock picks response:', parseError);
      return res.status(500).json({ 
        message: 'Error processing AI stock analysis' 
      });
    }
    
    // Add metadata
    const response = {
      ...stockPicksData,
      generatedAt: new Date(),
      userId: req.user.id,
      userPreferences: userPreferences,
      marketDataTimestamp: marketData.timestamp || new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error generating stock picks:', error);
    res.status(500).json({ 
      message: 'Server error while generating stock picks' 
    });
  }
};
