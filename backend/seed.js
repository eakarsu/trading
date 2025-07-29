const { 
  User, 
  MarketData, 
  Portfolio, 
  Strategy, 
  Prediction, 
  MarketAnalysis, 
  initializeDatabase 
} = require('./src/models');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize database connection and sync models
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error('Failed to initialize database');
    }

    // Clear existing data (optional - remove in production)
    console.log('🧹 Clearing existing data...');
    await MarketAnalysis.destroy({ where: {} });
    await Prediction.destroy({ where: {} });
    await Strategy.destroy({ where: {} });
    await Portfolio.destroy({ where: {} });
    await MarketData.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create sample users
    console.log('👥 Creating sample users...');
    const userDataArray = [
      {
        username: 'admin',
        email: 'admin@trading.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          trading: {
            riskTolerance: 'high',
            autoInvest: true,
            defaultAmount: 10000
          }
        }
      },
      {
        username: 'trader1',
        email: 'trader1@trading.com',
        password: 'trader123',
        firstName: 'John',
        lastName: 'Trader',
        role: 'user',
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: false,
            sms: true
          },
          trading: {
            riskTolerance: 'medium',
            autoInvest: false,
            defaultAmount: 5000
          }
        }
      },
      {
        username: 'investor1',
        email: 'investor1@trading.com',
        password: 'investor123',
        firstName: 'Jane',
        lastName: 'Investor',
        role: 'user',
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          trading: {
            riskTolerance: 'low',
            autoInvest: true,
            defaultAmount: 2000
          }
        }
      }
    ];

    // Create users individually to trigger password hashing hooks
    const users = [];
    for (const userData of userDataArray) {
      const user = await User.create(userData);
      users.push(user);
    }

    console.log(`✅ Created ${users.length} users`);

    // Create sample market data
    console.log('📊 Creating sample market data...');
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
    const marketDataEntries = [];

    for (const symbol of symbols) {
      const basePrice = Math.random() * 500 + 50; // Random price between 50-550
      const volume = Math.floor(Math.random() * 10000000) + 1000000; // Random volume
      
      marketDataEntries.push({
        symbol,
        price: basePrice,
        volume,
        high: basePrice * 1.05,
        low: basePrice * 0.95,
        open: basePrice * 0.98,
        close: basePrice,
        change: basePrice * 0.02,
        changePercent: 2.0,
        marketCap: Math.floor(Math.random() * 1000000000000) + 100000000000,
        pe: Math.random() * 30 + 10,
        eps: Math.random() * 10 + 1,
        dividend: Math.random() * 5,
        dividendYield: Math.random() * 3,
        beta: Math.random() * 2 + 0.5,
        fiftyTwoWeekHigh: basePrice * 1.2,
        fiftyTwoWeekLow: basePrice * 0.7,
        avgVolume: volume,
        sector: ['Technology', 'Healthcare', 'Finance', 'Energy'][Math.floor(Math.random() * 4)],
        industry: 'Software',
        source: 'yahoo',
        metadata: {
          lastUpdated: new Date(),
          dataQuality: 'high'
        }
      });
    }

    const marketData = await MarketData.bulkCreate(marketDataEntries);
    console.log(`✅ Created ${marketData.length} market data entries`);

    // Create sample portfolios
    console.log('💼 Creating sample portfolios...');
    const portfolios = await Portfolio.bulkCreate([
      {
        userId: users[0].id,
        name: 'Growth Portfolio',
        description: 'High-growth technology stocks',
        totalValue: 150000,
        cashBalance: 10000,
        totalReturn: 25000,
        totalReturnPercent: 20.0,
        dayChange: 1500,
        dayChangePercent: 1.0,
        holdings: [
          { symbol: 'AAPL', shares: 100, avgPrice: 150, currentPrice: 155 },
          { symbol: 'GOOGL', shares: 50, avgPrice: 2500, currentPrice: 2600 },
          { symbol: 'TSLA', shares: 25, avgPrice: 800, currentPrice: 850 }
        ],
        riskProfile: 'aggressive',
        strategy: 'Growth Investing'
      },
      {
        userId: users[1].id,
        name: 'Balanced Portfolio',
        description: 'Diversified portfolio with moderate risk',
        totalValue: 75000,
        cashBalance: 5000,
        totalReturn: 8000,
        totalReturnPercent: 12.0,
        dayChange: 300,
        dayChangePercent: 0.4,
        holdings: [
          { symbol: 'MSFT', shares: 75, avgPrice: 300, currentPrice: 310 },
          { symbol: 'AMZN', shares: 30, avgPrice: 3200, currentPrice: 3300 },
          { symbol: 'NVDA', shares: 40, avgPrice: 400, currentPrice: 420 }
        ],
        riskProfile: 'moderate',
        strategy: 'Balanced Investing'
      },
      {
        userId: users[2].id,
        name: 'Conservative Portfolio',
        description: 'Low-risk dividend-focused portfolio',
        totalValue: 50000,
        cashBalance: 8000,
        totalReturn: 3000,
        totalReturnPercent: 6.0,
        dayChange: 100,
        dayChangePercent: 0.2,
        holdings: [
          { symbol: 'AAPL', shares: 50, avgPrice: 150, currentPrice: 155 },
          { symbol: 'MSFT', shares: 40, avgPrice: 300, currentPrice: 310 }
        ],
        riskProfile: 'conservative',
        strategy: 'Dividend Investing'
      }
    ]);

    console.log(`✅ Created ${portfolios.length} portfolios`);

    // Create sample strategies
    console.log('🎯 Creating sample strategies...');
    const strategies = await Strategy.bulkCreate([
      {
        userId: users[0].id,
        name: 'Momentum Trading',
        description: 'Buy stocks with strong upward momentum',
        type: 'momentum',
        riskLevel: 'high',
        timeHorizon: 'short',
        parameters: {
          rsiThreshold: 70,
          volumeMultiplier: 2,
          priceChange: 5
        },
        rules: {
          entry: ['RSI > 70', 'Volume > 2x average', 'Price up 5% in 3 days'],
          exit: ['RSI < 30', 'Stop loss at -10%', 'Take profit at +20%'],
          riskManagement: ['Max position size 5%', 'Max daily loss 2%']
        },
        isPublic: true,
        tags: ['momentum', 'short-term', 'high-risk']
      },
      {
        userId: users[1].id,
        name: 'Value Investing',
        description: 'Buy undervalued stocks with strong fundamentals',
        type: 'value',
        riskLevel: 'medium',
        timeHorizon: 'long',
        parameters: {
          peRatio: 15,
          pbRatio: 1.5,
          debtToEquity: 0.5
        },
        rules: {
          entry: ['P/E < 15', 'P/B < 1.5', 'Debt/Equity < 0.5'],
          exit: ['P/E > 25', 'Fundamental deterioration'],
          riskManagement: ['Max position size 10%', 'Diversify across sectors']
        },
        isPublic: true,
        tags: ['value', 'long-term', 'fundamentals']
      },
      {
        userId: users[2].id,
        name: 'Dividend Growth',
        description: 'Focus on stocks with growing dividends',
        type: 'dividend',
        riskLevel: 'low',
        timeHorizon: 'long',
        parameters: {
          dividendYield: 3,
          dividendGrowth: 5,
          payoutRatio: 60
        },
        rules: {
          entry: ['Dividend yield > 3%', 'Dividend growth > 5%', 'Payout ratio < 60%'],
          exit: ['Dividend cut', 'Payout ratio > 80%'],
          riskManagement: ['Max position size 8%', 'Focus on dividend aristocrats']
        },
        isPublic: false,
        tags: ['dividend', 'income', 'conservative']
      }
    ]);

    console.log(`✅ Created ${strategies.length} strategies`);

    // Create sample predictions
    console.log('🔮 Creating sample predictions...');
    const predictions = await Prediction.bulkCreate([
      {
        userId: users[0].id,
        symbol: 'AAPL',
        predictionType: 'price',
        timeframe: '1w',
        currentPrice: 155.50,
        predictedPrice: 165.00,
        predictedDirection: 'up',
        confidence: 75.5,
        model: 'lstm',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        technicalIndicators: {
          rsi: 65,
          macd: 2.5,
          bollinger: { upper: 160, lower: 150, middle: 155 },
          sma: 152,
          ema: 154
        }
      },
      {
        userId: users[1].id,
        symbol: 'GOOGL',
        predictionType: 'direction',
        timeframe: '1d',
        currentPrice: 2600.00,
        predictedDirection: 'up',
        confidence: 68.2,
        model: 'random_forest',
        targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        technicalIndicators: {
          rsi: 58,
          macd: 15.2,
          sma: 2580,
          ema: 2590
        }
      },
      {
        userId: users[2].id,
        symbol: 'MSFT',
        predictionType: 'price',
        timeframe: '1m',
        currentPrice: 310.00,
        predictedPrice: 325.00,
        predictedDirection: 'up',
        confidence: 82.1,
        model: 'ensemble',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
        technicalIndicators: {
          rsi: 55,
          macd: 5.8,
          sma: 305,
          ema: 308
        }
      }
    ]);

    console.log(`✅ Created ${predictions.length} predictions`);

    // Create sample market analyses
    console.log('📈 Creating sample market analyses...');
    const analyses = await MarketAnalysis.bulkCreate([
      {
        userId: users[0].id,
        symbol: 'AAPL',
        analysisType: 'comprehensive',
        timeframe: '1d',
        currentPrice: 155.50,
        priceChange: 2.50,
        priceChangePercent: 1.63,
        volume: 45000000,
        avgVolume: 42000000,
        technicalAnalysis: {
          trend: 'bullish',
          support: [150, 145],
          resistance: [160, 165],
          indicators: {
            rsi: 65,
            macd: 2.5,
            bollinger: { upper: 160, lower: 150, middle: 155 }
          },
          signals: ['Golden cross on MACD', 'Breaking resistance at 155']
        },
        fundamentalAnalysis: {
          pe: 28.5,
          eps: 5.45,
          revenue: 394000000000,
          revenueGrowth: 8.2,
          profitMargin: 25.3,
          roe: 147.4
        },
        recommendation: 'buy',
        confidence: 78.5,
        targetPrice: 170.00,
        stopLoss: 145.00,
        timeHorizon: 'medium',
        keyPoints: [
          'Strong quarterly earnings beat expectations',
          'iPhone sales showing resilience',
          'Services revenue growing steadily'
        ],
        summary: 'Apple shows strong fundamentals with growing services revenue and resilient iPhone sales. Technical indicators suggest continued upward momentum.',
        isPublic: true,
        tags: ['technology', 'large-cap', 'growth']
      },
      {
        userId: users[1].id,
        symbol: 'TSLA',
        analysisType: 'technical',
        timeframe: '1w',
        currentPrice: 850.00,
        priceChange: -15.50,
        priceChangePercent: -1.79,
        volume: 28000000,
        avgVolume: 25000000,
        technicalAnalysis: {
          trend: 'bearish',
          support: [800, 750],
          resistance: [900, 950],
          indicators: {
            rsi: 42,
            macd: -8.2,
            bollinger: { upper: 900, lower: 800, middle: 850 }
          },
          signals: ['Death cross forming', 'Breaking below 50-day MA']
        },
        recommendation: 'hold',
        confidence: 65.2,
        targetPrice: 800.00,
        stopLoss: 750.00,
        timeHorizon: 'short',
        keyPoints: [
          'Technical indicators showing weakness',
          'High volatility continues',
          'Support level at $800 critical'
        ],
        summary: 'Tesla showing technical weakness with bearish signals. Watch for support at $800 level.',
        isPublic: false,
        tags: ['electric-vehicles', 'high-volatility', 'growth']
      }
    ]);

    console.log(`✅ Created ${analyses.length} market analyses`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Market Data: ${marketData.length}`);
    console.log(`   Portfolios: ${portfolios.length}`);
    console.log(`   Strategies: ${strategies.length}`);
    console.log(`   Predictions: ${predictions.length}`);
    console.log(`   Market Analyses: ${analyses.length}`);
    
    console.log('\n🔐 Test Credentials:');
    console.log('   Admin: admin@trading.com / admin123');
    console.log('   Trader: trader1@trading.com / trader123');
    console.log('   Investor: investor1@trading.com / investor123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };
