const aiService = require('../utils/aiService');
const marketDataService = require('../services/financialDataService');

// Generate AI stock picks
const generateStockPicks = async (req, res) => {
  try {
    const { timeframe = 'short-term', riskTolerance = 'moderate', preferences = {} } = req.body;

    // Get current market data
    const marketData = await marketDataService.getRealTimeMarketData();
    
    if (!marketData) {
      return res.status(500).json({ 
        message: 'Unable to fetch current market data',
        error: 'Market data service unavailable'
      });
    }

    // Prepare user preferences for AI analysis
    const userPreferences = {
      timeframe,
      riskTolerance,
      ...preferences
    };

    // Generate AI stock picks using the AI service
    const stockPicksResponse = await aiService.generateStockPicks(marketData, userPreferences);
    
    // Parse the AI response (it might be wrapped in markdown code blocks)
    let stockPicks;
    try {
      // Clean the response by removing markdown code block markers
      let cleanResponse = stockPicksResponse.trim();
      
      // Remove ```json at the beginning and ``` at the end if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '');
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.replace(/\s*```$/, '');
      }
      
      stockPicks = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', stockPicksResponse);
      return res.status(500).json({ 
        message: 'Error processing AI analysis',
        error: 'Invalid AI response format'
      });
    }

    // Add metadata
    const response = {
      ...stockPicks,
      metadata: {
        generatedAt: new Date().toISOString(),
        timeframe,
        riskTolerance,
        marketDataTimestamp: marketData.timestamp || new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error generating stock picks:', error);
    res.status(500).json({ 
      message: 'Error generating stock picks',
      error: error.message 
    });
  }
};

// Get stock picks history (placeholder for future implementation)
const getStockPicksHistory = async (req, res) => {
  try {
    // This would typically fetch from a database
    // For now, return empty array
    res.json({
      history: [],
      message: 'Stock picks history feature coming soon'
    });
  } catch (error) {
    console.error('Error fetching stock picks history:', error);
    res.status(500).json({ 
      message: 'Error fetching stock picks history',
      error: error.message 
    });
  }
};

module.exports = {
  generateStockPicks,
  getStockPicksHistory
};
