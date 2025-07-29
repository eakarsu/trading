const mongoose = require('mongoose');
const MarketData = require('./src/models/MarketData');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ai-trading-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Sample market data to save
const sampleMarketData = {
  indices: [
    { 
      symbol: 'SPX', 
      name: 'S&P 500', 
      price: 4350.25, 
      change: 25.75, 
      changePercent: 0.59, 
      volume: '3.2B', 
      high: 4365.50, 
      low: 4335.25 
    },
    { 
      symbol: 'NDX', 
      name: 'NASDAQ-100', 
      price: 13500.75, 
      change: 45.25, 
      changePercent: 0.34, 
      volume: '2.8B', 
      high: 13550.00, 
      low: 13450.50 
    }
  ],
  stocks: [
    { 
      symbol: 'AAPL', 
      name: 'Apple Inc.', 
      price: 175.25, 
      change: 3.25, 
      changePercent: 1.89, 
      volume: '45.2M', 
      marketCap: '2.8T', 
      high: 176.50, 
      low: 173.75 
    },
    { 
      symbol: 'MSFT', 
      name: 'Microsoft Corp.', 
      price: 330.10, 
      change: -2.15, 
      changePercent: -0.65, 
      volume: '28.7M', 
      marketCap: '2.5T', 
      high: 332.25, 
      low: 328.50 
    }
  ],
  commodities: [
    { 
      symbol: 'GC', 
      name: 'Gold', 
      price: 1950.25, 
      change: 12.75, 
      changePercent: 0.66, 
      volume: '12.5M', 
      high: 1955.00, 
      low: 1942.50 
    },
    { 
      symbol: 'SI', 
      name: 'Silver', 
      price: 24.25, 
      change: -0.35, 
      changePercent: -1.42, 
      volume: '8.2M', 
      high: 24.50, 
      low: 24.00 
    }
  ],
  currencies: [
    { 
      symbol: 'EURUSD', 
      name: 'Euro/Dollar', 
      price: 1.0825, 
      change: 0.0015, 
      changePercent: 0.14, 
      volume: '25.3B', 
      high: 1.0835, 
      low: 1.0810 
    },
    { 
      symbol: 'GBPUSD', 
      name: 'British Pound/Dollar', 
      price: 1.2650, 
      change: -0.0025, 
      changePercent: -0.20, 
      volume: '12.7B', 
      high: 1.2675, 
      low: 1.2625 
    }
  ]
};

const saveSampleData = async () => {
  try {
    // Find a user to associate with the market data
    const user = await User.findOne({ email: 'john@example.com' });
    
    if (!user) {
      console.log('User not found. Please run the seed script first.');
      process.exit(1);
    }
    
    // Create market data document
    const marketData = new MarketData({
      userId: user._id,
      ...sampleMarketData,
      source: 'real-time'
    });
    
    // Save to database
    await marketData.save();
    
    console.log('Sample market data saved successfully!');
    console.log('Market data ID:', marketData._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error saving sample market data:', error);
    process.exit(1);
  }
};

// Run the save function
saveSampleData();
