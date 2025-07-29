const axios = require('axios');
const MarketData = require('../models/MarketData');

// Function to fetch real-time market data from database
const getRealTimeMarketData = async () => {
  try {
    console.log('Fetching real-time market data from database');
    
    // Get latest market data from database
    const marketData = await MarketData.findAll({
      order: [['timestamp', 'DESC']],
      limit: 20
    });
    
    if (!marketData || marketData.length === 0) {
      throw new Error('No market data found in database');
    }
    
    // Transform data to expected format
    const transformedData = marketData.map(data => ({
      symbol: data.symbol,
      price: parseFloat(data.price),
      volume: parseInt(data.volume),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      open: parseFloat(data.open),
      close: parseFloat(data.close),
      change: parseFloat(data.change || 0),
      changePercent: parseFloat(data.changePercent || 0),
      marketCap: parseInt(data.marketCap || 0),
      pe: parseFloat(data.pe || 0),
      eps: parseFloat(data.eps || 0),
      dividend: parseFloat(data.dividend || 0),
      dividendYield: parseFloat(data.dividendYield || 0),
      beta: parseFloat(data.beta || 1),
      fiftyTwoWeekHigh: parseFloat(data.fiftyTwoWeekHigh || 0),
      fiftyTwoWeekLow: parseFloat(data.fiftyTwoWeekLow || 0),
      avgVolume: parseInt(data.avgVolume || 0),
      sector: data.sector,
      industry: data.industry,
      timestamp: data.timestamp,
      source: data.source || 'database'
    }));
    
    console.log(`Successfully fetched ${transformedData.length} market data records from database`);
    return transformedData;
    
  } catch (error) {
    console.error('Error fetching real-time market data from database:', error.message);
    throw error;
  }
};

// Function to fetch historical data for a symbol
const getHistoricalData = async (symbol, timeframe = '1D') => {
  // For now, we'll return mock data since we don't have a direct way to fetch historical data
  // In a real implementation, you might want to extend the Python server to provide this data
  console.log(`Fetching historical data for ${symbol} with timeframe ${timeframe}`);
  
  // Return mock data for demonstration
  const mockHistoricalData = [];
  const baseDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - i);
    
    // Generate mock price data
    const basePrice = 100 + Math.random() * 50;
    const open = basePrice;
    const high = basePrice + Math.random() * 5;
    const low = basePrice - Math.random() * 5;
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    mockHistoricalData.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume
    });
  }
  
  return mockHistoricalData;
};

// Function to get market sentiment (simplified)
const getMarketSentiment = async () => {
  try {
    // In a real implementation, this would use a sentiment analysis API
    // For now, we'll return mock sentiment data
    return {
      overall: 0.65,
      sectors: {
        technology: 0.72,
        finance: 0.58,
        healthcare: 0.61,
        energy: 0.45
      },
      sources: [
        { name: 'News Sentiment', score: 0.68 },
        { name: 'Social Media', score: 0.62 },
        { name: 'Technical Analysis', score: 0.65 }
      ]
    };
  } catch (error) {
    console.error('Error fetching market sentiment:', error.message);
    throw error;
  }
};

// Helper function to get full name for symbols
const getFullName = (symbol) => {
  const names = {
    'SPY': 'SPDR S&P 500 ETF',
    'QQQ': 'Invesco QQQ Trust',
    'DIA': 'SPDR Dow Jones Industrial Average ETF',
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corp.',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.'
  };
  return names[symbol] || symbol;
};

module.exports = {
  getRealTimeMarketData,
  getHistoricalData,
  getMarketSentiment
};
