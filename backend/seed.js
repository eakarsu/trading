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

    // ================================================================
    // USERS (5 users)
    // ================================================================
    console.log('👥 Creating sample users...');
    const userDataArray = [
      {
        username: 'admin',
        email: 'admin@trading.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        preferences: { theme: 'dark', notifications: { email: true, push: true, sms: false }, trading: { riskTolerance: 'high', autoInvest: true, defaultAmount: 10000 } }
      },
      {
        username: 'trader1',
        email: 'trader1@trading.com',
        password: 'trader123',
        firstName: 'John',
        lastName: 'Trader',
        role: 'user',
        preferences: { theme: 'light', notifications: { email: true, push: false, sms: true }, trading: { riskTolerance: 'medium', autoInvest: false, defaultAmount: 5000 } }
      },
      {
        username: 'investor1',
        email: 'investor1@trading.com',
        password: 'investor123',
        firstName: 'Jane',
        lastName: 'Investor',
        role: 'user',
        preferences: { theme: 'light', notifications: { email: true, push: true, sms: false }, trading: { riskTolerance: 'low', autoInvest: true, defaultAmount: 2000 } }
      },
      {
        username: 'daytrader',
        email: 'daytrader@trading.com',
        password: 'daytrader123',
        firstName: 'Mike',
        lastName: 'Swift',
        role: 'user',
        preferences: { theme: 'dark', notifications: { email: false, push: true, sms: true }, trading: { riskTolerance: 'high', autoInvest: true, defaultAmount: 25000 } }
      },
      {
        username: 'quantdev',
        email: 'quantdev@trading.com',
        password: 'quantdev123',
        firstName: 'Sarah',
        lastName: 'Quant',
        role: 'user',
        preferences: { theme: 'dark', notifications: { email: true, push: true, sms: false }, trading: { riskTolerance: 'medium', autoInvest: true, defaultAmount: 15000 } }
      }
    ];

    const users = [];
    for (const userData of userDataArray) {
      const user = await User.create(userData);
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users`);

    // ================================================================
    // MARKET DATA (20 entries)
    // ================================================================
    console.log('📊 Creating sample market data...');
    const stockInfo = [
      { symbol: 'AAPL', sector: 'Technology', industry: 'Consumer Electronics', basePrice: 195 },
      { symbol: 'GOOGL', sector: 'Technology', industry: 'Internet Services', basePrice: 175 },
      { symbol: 'MSFT', sector: 'Technology', industry: 'Software', basePrice: 415 },
      { symbol: 'TSLA', sector: 'Consumer Discretionary', industry: 'Electric Vehicles', basePrice: 248 },
      { symbol: 'AMZN', sector: 'Consumer Discretionary', industry: 'E-Commerce', basePrice: 186 },
      { symbol: 'NVDA', sector: 'Technology', industry: 'Semiconductors', basePrice: 875 },
      { symbol: 'META', sector: 'Technology', industry: 'Social Media', basePrice: 505 },
      { symbol: 'NFLX', sector: 'Communication Services', industry: 'Streaming', basePrice: 625 },
      { symbol: 'JPM', sector: 'Financial', industry: 'Banking', basePrice: 198 },
      { symbol: 'V', sector: 'Financial', industry: 'Payments', basePrice: 278 },
      { symbol: 'JNJ', sector: 'Healthcare', industry: 'Pharmaceuticals', basePrice: 155 },
      { symbol: 'UNH', sector: 'Healthcare', industry: 'Health Insurance', basePrice: 520 },
      { symbol: 'XOM', sector: 'Energy', industry: 'Oil & Gas', basePrice: 105 },
      { symbol: 'PG', sector: 'Consumer Staples', industry: 'Household Products', basePrice: 168 },
      { symbol: 'DIS', sector: 'Communication Services', industry: 'Entertainment', basePrice: 112 },
      { symbol: 'BA', sector: 'Industrials', industry: 'Aerospace', basePrice: 178 },
      { symbol: 'AMD', sector: 'Technology', industry: 'Semiconductors', basePrice: 165 },
      { symbol: 'INTC', sector: 'Technology', industry: 'Semiconductors', basePrice: 32 },
      { symbol: 'CRM', sector: 'Technology', industry: 'Cloud Software', basePrice: 265 },
      { symbol: 'COIN', sector: 'Financial', industry: 'Crypto Exchange', basePrice: 225 },
    ];

    const marketDataEntries = stockInfo.map(stock => {
      const change = (Math.random() - 0.4) * stock.basePrice * 0.04;
      const volume = Math.floor(Math.random() * 50000000) + 5000000;
      return {
        symbol: stock.symbol,
        price: stock.basePrice + change,
        volume,
        high: stock.basePrice * 1.02,
        low: stock.basePrice * 0.98,
        open: stock.basePrice - change * 0.5,
        close: stock.basePrice + change,
        change: change,
        changePercent: (change / stock.basePrice) * 100,
        marketCap: Math.floor(stock.basePrice * (Math.random() * 5 + 1) * 1000000000),
        pe: Math.random() * 40 + 8,
        eps: Math.random() * 15 + 1,
        dividend: Math.random() * 4,
        dividendYield: Math.random() * 3,
        beta: Math.random() * 1.5 + 0.5,
        fiftyTwoWeekHigh: stock.basePrice * 1.25,
        fiftyTwoWeekLow: stock.basePrice * 0.65,
        avgVolume: volume * 0.95,
        sector: stock.sector,
        industry: stock.industry,
        source: 'seed',
        metadata: { lastUpdated: new Date(), dataQuality: 'high' }
      };
    });

    const marketData = await MarketData.bulkCreate(marketDataEntries);
    console.log(`✅ Created ${marketData.length} market data entries`);

    // ================================================================
    // PORTFOLIOS (15 portfolios across users)
    // ================================================================
    console.log('💼 Creating sample portfolios...');
    const portfolioData = [
      { userId: users[0].id, name: 'Growth Portfolio', description: 'High-growth technology stocks', totalValue: 250000, cashBalance: 15000, totalReturn: 45000, totalReturnPercent: 22.0, dayChange: 2800, dayChangePercent: 1.13, holdings: [{ symbol: 'AAPL', shares: 150, avgPrice: 145, currentPrice: 195, name: 'Apple Inc.' }, { symbol: 'NVDA', shares: 80, avgPrice: 450, currentPrice: 875, name: 'NVIDIA Corp.' }, { symbol: 'MSFT', shares: 60, avgPrice: 350, currentPrice: 415, name: 'Microsoft Corp.' }], riskProfile: 'aggressive', strategy: 'Growth Investing', performance: { oneDay: 1.13, oneWeek: 3.2, oneMonth: 5.8, threeMonths: 12.4, sixMonths: 18.6, oneYear: 22.0, ytd: 15.3, inception: 22.0 }, allocation: { stocks: 94, bonds: 0, cash: 6, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[0].id, name: 'Crypto Holdings', description: 'Cryptocurrency focused portfolio', totalValue: 85000, cashBalance: 5000, totalReturn: 12000, totalReturnPercent: 16.4, dayChange: -1200, dayChangePercent: -1.39, holdings: [{ symbol: 'COIN', shares: 120, avgPrice: 180, currentPrice: 225, name: 'Coinbase' }, { symbol: 'MSTR', shares: 30, avgPrice: 450, currentPrice: 520, name: 'MicroStrategy' }], riskProfile: 'aggressive', strategy: 'Crypto Exposure', performance: { oneDay: -1.39, oneWeek: 2.1, oneMonth: -3.5, threeMonths: 8.2, sixMonths: 16.4, oneYear: 45.2, ytd: 12.8, inception: 16.4 }, allocation: { stocks: 94, bonds: 0, cash: 6, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[0].id, name: 'Retirement IRA', description: 'Long-term retirement account', totalValue: 520000, cashBalance: 25000, totalReturn: 95000, totalReturnPercent: 22.4, dayChange: 1500, dayChangePercent: 0.29, holdings: [{ symbol: 'VTI', shares: 500, avgPrice: 180, currentPrice: 230, name: 'Vanguard Total Market' }, { symbol: 'VXUS', shares: 300, avgPrice: 50, currentPrice: 58, name: 'Vanguard Intl' }, { symbol: 'BND', shares: 400, avgPrice: 72, currentPrice: 70, name: 'Vanguard Bond' }], riskProfile: 'moderate', strategy: 'Balanced Index', performance: { oneDay: 0.29, oneWeek: 0.8, oneMonth: 2.1, threeMonths: 5.4, sixMonths: 10.2, oneYear: 22.4, ytd: 8.5, inception: 22.4 }, allocation: { stocks: 65, bonds: 25, cash: 5, crypto: 0, commodities: 0, reits: 5, other: 0 } },
      { userId: users[1].id, name: 'Balanced Portfolio', description: 'Diversified portfolio with moderate risk', totalValue: 175000, cashBalance: 12000, totalReturn: 18000, totalReturnPercent: 11.5, dayChange: 650, dayChangePercent: 0.37, holdings: [{ symbol: 'MSFT', shares: 75, avgPrice: 300, currentPrice: 415, name: 'Microsoft Corp.' }, { symbol: 'AMZN', shares: 50, avgPrice: 145, currentPrice: 186, name: 'Amazon.com' }, { symbol: 'JNJ', shares: 80, avgPrice: 148, currentPrice: 155, name: 'Johnson & Johnson' }], riskProfile: 'moderate', strategy: 'Balanced Investing', performance: { oneDay: 0.37, oneWeek: 1.2, oneMonth: 3.1, threeMonths: 6.8, sixMonths: 11.5, oneYear: 15.2, ytd: 9.4, inception: 11.5 }, allocation: { stocks: 80, bonds: 10, cash: 7, crypto: 0, commodities: 0, reits: 3, other: 0 } },
      { userId: users[1].id, name: 'Swing Trading', description: 'Short-term swing trade positions', totalValue: 65000, cashBalance: 25000, totalReturn: 8500, totalReturnPercent: 15.1, dayChange: -320, dayChangePercent: -0.49, holdings: [{ symbol: 'TSLA', shares: 40, avgPrice: 220, currentPrice: 248, name: 'Tesla Inc.' }, { symbol: 'AMD', shares: 100, avgPrice: 140, currentPrice: 165, name: 'AMD' }], riskProfile: 'aggressive', strategy: 'Swing Trading', performance: { oneDay: -0.49, oneWeek: 3.8, oneMonth: 7.2, threeMonths: 15.1, sixMonths: 22.3, oneYear: 35.6, ytd: 18.9, inception: 15.1 }, allocation: { stocks: 62, bonds: 0, cash: 38, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[1].id, name: 'Dividend Income', description: 'High dividend yield stocks', totalValue: 120000, cashBalance: 8000, totalReturn: 14000, totalReturnPercent: 13.2, dayChange: 280, dayChangePercent: 0.23, holdings: [{ symbol: 'JNJ', shares: 120, avgPrice: 140, currentPrice: 155, name: 'Johnson & Johnson' }, { symbol: 'PG', shares: 90, avgPrice: 145, currentPrice: 168, name: 'Procter & Gamble' }, { symbol: 'XOM', shares: 150, avgPrice: 85, currentPrice: 105, name: 'Exxon Mobil' }], riskProfile: 'conservative', strategy: 'Dividend Growth', performance: { oneDay: 0.23, oneWeek: 0.6, oneMonth: 1.8, threeMonths: 4.2, sixMonths: 8.1, oneYear: 13.2, ytd: 6.5, inception: 13.2 }, allocation: { stocks: 93, bonds: 0, cash: 7, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[2].id, name: 'Conservative Portfolio', description: 'Low-risk dividend-focused portfolio', totalValue: 95000, cashBalance: 15000, totalReturn: 5200, totalReturnPercent: 5.8, dayChange: 180, dayChangePercent: 0.19, holdings: [{ symbol: 'AAPL', shares: 80, avgPrice: 150, currentPrice: 195, name: 'Apple Inc.' }, { symbol: 'MSFT', shares: 40, avgPrice: 300, currentPrice: 415, name: 'Microsoft Corp.' }], riskProfile: 'conservative', strategy: 'Dividend Investing', performance: { oneDay: 0.19, oneWeek: 0.5, oneMonth: 1.5, threeMonths: 3.2, sixMonths: 5.8, oneYear: 8.4, ytd: 4.1, inception: 5.8 }, allocation: { stocks: 84, bonds: 0, cash: 16, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[2].id, name: 'ESG Focus', description: 'Environmental and social governance picks', totalValue: 48000, cashBalance: 6000, totalReturn: 3200, totalReturnPercent: 7.1, dayChange: 95, dayChangePercent: 0.2, holdings: [{ symbol: 'MSFT', shares: 30, avgPrice: 380, currentPrice: 415, name: 'Microsoft Corp.' }, { symbol: 'CRM', shares: 25, avgPrice: 240, currentPrice: 265, name: 'Salesforce' }], riskProfile: 'moderate', strategy: 'ESG Investing', performance: { oneDay: 0.2, oneWeek: 0.7, oneMonth: 2.0, threeMonths: 4.5, sixMonths: 7.1, oneYear: 10.8, ytd: 5.2, inception: 7.1 }, allocation: { stocks: 88, bonds: 0, cash: 12, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[3].id, name: 'Day Trading Account', description: 'Intraday momentum plays', totalValue: 180000, cashBalance: 80000, totalReturn: 32000, totalReturnPercent: 21.6, dayChange: 4200, dayChangePercent: 2.39, holdings: [{ symbol: 'TSLA', shares: 100, avgPrice: 235, currentPrice: 248, name: 'Tesla Inc.' }, { symbol: 'NVDA', shares: 25, avgPrice: 820, currentPrice: 875, name: 'NVIDIA Corp.' }, { symbol: 'AMD', shares: 200, avgPrice: 150, currentPrice: 165, name: 'AMD' }], riskProfile: 'aggressive', strategy: 'Momentum Day Trading', performance: { oneDay: 2.39, oneWeek: 5.8, oneMonth: 12.4, threeMonths: 21.6, sixMonths: 38.5, oneYear: 55.2, ytd: 28.3, inception: 21.6 }, allocation: { stocks: 56, bonds: 0, cash: 44, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[3].id, name: 'Options Portfolio', description: 'Options strategies and hedges', totalValue: 95000, cashBalance: 40000, totalReturn: 15000, totalReturnPercent: 18.8, dayChange: -800, dayChangePercent: -0.83, holdings: [{ symbol: 'SPY', shares: 150, avgPrice: 450, currentPrice: 480, name: 'S&P 500 ETF' }, { symbol: 'QQQ', shares: 80, avgPrice: 380, currentPrice: 410, name: 'Nasdaq ETF' }], riskProfile: 'aggressive', strategy: 'Options Strategies', performance: { oneDay: -0.83, oneWeek: 2.1, oneMonth: 6.3, threeMonths: 18.8, sixMonths: 28.4, oneYear: 42.1, ytd: 22.5, inception: 18.8 }, allocation: { stocks: 58, bonds: 0, cash: 42, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[3].id, name: 'Sector Rotation', description: 'Rotating into strong sectors', totalValue: 135000, cashBalance: 20000, totalReturn: 22000, totalReturnPercent: 19.5, dayChange: 1100, dayChangePercent: 0.82, holdings: [{ symbol: 'XOM', shares: 200, avgPrice: 88, currentPrice: 105, name: 'Exxon Mobil' }, { symbol: 'JPM', shares: 100, avgPrice: 165, currentPrice: 198, name: 'JPMorgan Chase' }, { symbol: 'UNH', shares: 30, avgPrice: 470, currentPrice: 520, name: 'UnitedHealth' }], riskProfile: 'moderate', strategy: 'Sector Rotation', performance: { oneDay: 0.82, oneWeek: 2.4, oneMonth: 5.6, threeMonths: 12.8, sixMonths: 19.5, oneYear: 26.3, ytd: 14.7, inception: 19.5 }, allocation: { stocks: 85, bonds: 0, cash: 15, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[4].id, name: 'Quant Alpha', description: 'Quantitative factor model portfolio', totalValue: 320000, cashBalance: 30000, totalReturn: 52000, totalReturnPercent: 19.4, dayChange: 2100, dayChangePercent: 0.66, holdings: [{ symbol: 'AAPL', shares: 200, avgPrice: 160, currentPrice: 195, name: 'Apple Inc.' }, { symbol: 'GOOGL', shares: 150, avgPrice: 140, currentPrice: 175, name: 'Alphabet' }, { symbol: 'META', shares: 80, avgPrice: 350, currentPrice: 505, name: 'Meta Platforms' }], riskProfile: 'moderate', strategy: 'Multi-Factor Quant', performance: { oneDay: 0.66, oneWeek: 1.8, oneMonth: 4.5, threeMonths: 10.2, sixMonths: 19.4, oneYear: 28.6, ytd: 16.1, inception: 19.4 }, allocation: { stocks: 91, bonds: 0, cash: 9, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[4].id, name: 'Statistical Arbitrage', description: 'Pairs trading and mean reversion', totalValue: 210000, cashBalance: 50000, totalReturn: 28000, totalReturnPercent: 15.4, dayChange: 850, dayChangePercent: 0.41, holdings: [{ symbol: 'V', shares: 100, avgPrice: 250, currentPrice: 278, name: 'Visa Inc.' }, { symbol: 'INTC', shares: 500, avgPrice: 28, currentPrice: 32, name: 'Intel Corp.' }, { symbol: 'BA', shares: 60, avgPrice: 160, currentPrice: 178, name: 'Boeing' }], riskProfile: 'moderate', strategy: 'Stat Arb', performance: { oneDay: 0.41, oneWeek: 1.2, oneMonth: 3.4, threeMonths: 8.6, sixMonths: 15.4, oneYear: 22.8, ytd: 11.3, inception: 15.4 }, allocation: { stocks: 76, bonds: 0, cash: 24, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[4].id, name: 'Machine Learning Fund', description: 'ML-driven signal portfolio', totalValue: 450000, cashBalance: 45000, totalReturn: 78000, totalReturnPercent: 20.9, dayChange: 3200, dayChangePercent: 0.72, holdings: [{ symbol: 'NVDA', shares: 120, avgPrice: 500, currentPrice: 875, name: 'NVIDIA Corp.' }, { symbol: 'MSFT', shares: 100, avgPrice: 350, currentPrice: 415, name: 'Microsoft Corp.' }, { symbol: 'CRM', shares: 80, avgPrice: 220, currentPrice: 265, name: 'Salesforce' }, { symbol: 'AMZN', shares: 90, avgPrice: 150, currentPrice: 186, name: 'Amazon.com' }], riskProfile: 'aggressive', strategy: 'ML Signals', performance: { oneDay: 0.72, oneWeek: 2.5, oneMonth: 6.1, threeMonths: 13.5, sixMonths: 20.9, oneYear: 35.4, ytd: 19.2, inception: 20.9 }, allocation: { stocks: 90, bonds: 0, cash: 10, crypto: 0, commodities: 0, reits: 0, other: 0 } },
      { userId: users[4].id, name: 'Risk Parity', description: 'Equal risk contribution across assets', totalValue: 280000, cashBalance: 35000, totalReturn: 32000, totalReturnPercent: 12.9, dayChange: 620, dayChangePercent: 0.22, holdings: [{ symbol: 'SPY', shares: 200, avgPrice: 440, currentPrice: 480, name: 'S&P 500 ETF' }, { symbol: 'TLT', shares: 300, avgPrice: 95, currentPrice: 92, name: 'Treasury Bond ETF' }, { symbol: 'GLD', shares: 150, avgPrice: 185, currentPrice: 198, name: 'Gold ETF' }], riskProfile: 'moderate', strategy: 'Risk Parity', performance: { oneDay: 0.22, oneWeek: 0.6, oneMonth: 1.8, threeMonths: 5.2, sixMonths: 9.8, oneYear: 12.9, ytd: 7.1, inception: 12.9 }, allocation: { stocks: 45, bonds: 30, cash: 12, crypto: 0, commodities: 8, reits: 5, other: 0 } },
    ];

    const portfolios = await Portfolio.bulkCreate(portfolioData);
    console.log(`✅ Created ${portfolios.length} portfolios`);

    // ================================================================
    // STRATEGIES (18 strategies)
    // ================================================================
    console.log('🎯 Creating sample strategies...');
    const strategyData = [
      { userId: users[0].id, name: 'Momentum Trading', description: 'Buy stocks with strong upward momentum based on RSI and volume', type: 'momentum', riskLevel: 'high', timeHorizon: 'short', parameters: { rsiThreshold: 70, volumeMultiplier: 2, priceChange: 5 }, rules: { entry: ['RSI > 70', 'Volume > 2x average', 'Price up 5% in 3 days'], exit: ['RSI < 30', 'Stop loss at -10%', 'Take profit at +20%'], riskManagement: ['Max position size 5%', 'Max daily loss 2%'] }, isActive: true, isPublic: true, tags: ['momentum', 'short-term', 'high-risk'], rating: 4.2, usageCount: 156 },
      { userId: users[0].id, name: 'Mean Reversion RSI', description: 'Buy oversold stocks using RSI indicator for mean reversion', type: 'technical', riskLevel: 'medium', timeHorizon: 'short', parameters: { rsiOversold: 30, rsiOverbought: 70, lookbackPeriod: 14 }, rules: { entry: ['RSI < 30', 'Price below 20-day SMA', 'Volume spike'], exit: ['RSI > 50', 'Price reaches 20-day SMA'], riskManagement: ['Stop loss -5%', 'Max 3 positions'] }, isActive: true, isPublic: true, tags: ['mean-reversion', 'RSI', 'technical'], rating: 3.8, usageCount: 89 },
      { userId: users[0].id, name: 'Breakout Scanner', description: 'Identify and trade breakout patterns from consolidation', type: 'breakout', riskLevel: 'high', timeHorizon: 'short', parameters: { consolidationDays: 20, breakoutPercent: 3, volumeIncrease: 1.5 }, rules: { entry: ['Price breaks above 20-day high', 'Volume > 1.5x average', 'ATR expanding'], exit: ['Price falls below breakout level', 'Trailing stop 7%'], riskManagement: ['Risk 2% per trade', 'Max 4 positions'] }, isActive: false, isPublic: true, tags: ['breakout', 'consolidation', 'high-risk'], rating: 4.0, usageCount: 120 },
      { userId: users[1].id, name: 'Value Investing', description: 'Buy undervalued stocks with strong fundamentals and low P/E', type: 'value', riskLevel: 'medium', timeHorizon: 'long', parameters: { peRatio: 15, pbRatio: 1.5, debtToEquity: 0.5 }, rules: { entry: ['P/E < 15', 'P/B < 1.5', 'Debt/Equity < 0.5'], exit: ['P/E > 25', 'Fundamental deterioration'], riskManagement: ['Max position size 10%', 'Diversify across sectors'] }, isActive: true, isPublic: true, tags: ['value', 'long-term', 'fundamentals'], rating: 4.5, usageCount: 234 },
      { userId: users[1].id, name: 'GARP Strategy', description: 'Growth at a reasonable price combining growth and value metrics', type: 'growth', riskLevel: 'medium', timeHorizon: 'medium', parameters: { pegRatio: 1.5, earningsGrowth: 15, peRatio: 25 }, rules: { entry: ['PEG ratio < 1.5', 'EPS growth > 15%', 'P/E < 25'], exit: ['PEG > 2.5', 'Growth declining 2 quarters'], riskManagement: ['Max 8% position', 'Sector diversification'] }, isActive: true, isPublic: true, tags: ['GARP', 'growth', 'value'], rating: 4.1, usageCount: 178 },
      { userId: users[1].id, name: 'Earnings Momentum', description: 'Trade stocks with positive earnings surprises and revisions', type: 'fundamental', riskLevel: 'medium', timeHorizon: 'medium', parameters: { earningsSurprise: 5, revisionThreshold: 3, analystUpgrades: 2 }, rules: { entry: ['Earnings beat > 5%', 'Analyst revisions up > 3%', '2+ analyst upgrades'], exit: ['Earnings miss', 'Downward revisions'], riskManagement: ['Max 6% per position', 'Hold 3-6 months'] }, isActive: false, isPublic: false, tags: ['earnings', 'fundamental', 'medium-term'], rating: 3.9, usageCount: 95 },
      { userId: users[2].id, name: 'Dividend Growth', description: 'Focus on stocks with consistently growing dividends and stable yields', type: 'dividend', riskLevel: 'low', timeHorizon: 'long', parameters: { dividendYield: 3, dividendGrowth: 5, payoutRatio: 60 }, rules: { entry: ['Dividend yield > 3%', 'Dividend growth > 5%', 'Payout ratio < 60%'], exit: ['Dividend cut', 'Payout ratio > 80%'], riskManagement: ['Max position size 8%', 'Focus on dividend aristocrats'] }, isActive: true, isPublic: false, tags: ['dividend', 'income', 'conservative'], rating: 4.3, usageCount: 312 },
      { userId: users[2].id, name: 'Bond Ladder', description: 'Invest in staggered maturity bonds for steady income', type: 'value', riskLevel: 'low', timeHorizon: 'long', parameters: { yieldMinimum: 4, creditRating: 'A', maturitySpread: 5 }, rules: { entry: ['Yield > 4%', 'Credit rating A or better', 'Maturity 1-10 years'], exit: ['Credit downgrade', 'Yield compression below 2%'], riskManagement: ['Equal allocation per maturity', 'Max 5% any single issuer'] }, isActive: true, isPublic: false, tags: ['bonds', 'income', 'conservative'], rating: 3.7, usageCount: 67 },
      { userId: users[2].id, name: 'Defensive Equities', description: 'Low-volatility stocks with stable earnings in defensive sectors', type: 'value', riskLevel: 'low', timeHorizon: 'long', parameters: { betaMax: 0.8, volatilityMax: 15, sectorFocus: ['Healthcare', 'Utilities', 'Consumer Staples'] }, rules: { entry: ['Beta < 0.8', 'Low volatility', 'Stable earnings 5+ years'], exit: ['Beta rises above 1.2', 'Earnings instability'], riskManagement: ['Max 10% per position', 'Sector concentration limit 40%'] }, isActive: false, isPublic: true, tags: ['defensive', 'low-volatility', 'stable'], rating: 3.6, usageCount: 54 },
      { userId: users[3].id, name: 'Scalping Machine', description: 'High-frequency intraday scalping on liquid stocks', type: 'momentum', riskLevel: 'high', timeHorizon: 'short', parameters: { profitTarget: 0.3, stopLoss: 0.2, minVolume: 5000000 }, rules: { entry: ['VWAP cross', 'Level 2 imbalance', 'Spread < 0.05%'], exit: ['0.3% profit target', '0.2% stop loss', 'End of day flat'], riskManagement: ['Max $500 risk per trade', '20 trades/day max'] }, isActive: true, isPublic: false, tags: ['scalping', 'intraday', 'high-frequency'], rating: 3.4, usageCount: 445 },
      { userId: users[3].id, name: 'Gap and Go', description: 'Trade morning gaps on high pre-market movers', type: 'breakout', riskLevel: 'high', timeHorizon: 'short', parameters: { gapPercent: 5, preMarketVolume: 500000, floatMax: 50000000 }, rules: { entry: ['Gap > 5%', 'Pre-market volume > 500K', 'First pullback to VWAP'], exit: ['Break below opening range', 'Trailing stop 3%', 'Close by 11am'], riskManagement: ['Max 3% portfolio per trade', 'Max 2 gap trades/day'] }, isActive: true, isPublic: true, tags: ['gap-trading', 'morning', 'momentum'], rating: 3.5, usageCount: 198 },
      { userId: users[3].id, name: 'MACD Crossover', description: 'Trade MACD signal line crossovers with trend confirmation', type: 'technical', riskLevel: 'medium', timeHorizon: 'medium', parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }, rules: { entry: ['MACD crosses above signal', 'Price above 50-day MA', 'ADX > 25'], exit: ['MACD crosses below signal', 'Price below 50-day MA'], riskManagement: ['Stop loss below recent swing low', 'Max 5% per position'] }, isActive: false, isPublic: true, tags: ['MACD', 'technical', 'crossover'], rating: 3.9, usageCount: 267 },
      { userId: users[4].id, name: 'Multi-Factor Alpha', description: 'Combine value, momentum, quality and low-vol factors', type: 'quantitative', riskLevel: 'medium', timeHorizon: 'medium', parameters: { valueWeight: 0.25, momentumWeight: 0.3, qualityWeight: 0.25, lowVolWeight: 0.2 }, rules: { entry: ['Composite score > 80th percentile', 'All factors positive', 'Sector neutral'], exit: ['Score drops below 50th percentile', 'Factor breakdown'], riskManagement: ['Equal risk contribution', 'Monthly rebalance', 'Max 3% per position'] }, isActive: true, isPublic: true, tags: ['multi-factor', 'quantitative', 'systematic'], rating: 4.6, usageCount: 389 },
      { userId: users[4].id, name: 'Pairs Trading', description: 'Statistical arbitrage on cointegrated stock pairs', type: 'quantitative', riskLevel: 'medium', timeHorizon: 'short', parameters: { correlationMin: 0.85, zScoreEntry: 2, zScoreExit: 0.5, lookback: 60 }, rules: { entry: ['Z-score > 2 or < -2', 'Correlation > 0.85', 'Cointegration confirmed'], exit: ['Z-score reverts to 0.5', 'Correlation breaks down', 'Max hold 30 days'], riskManagement: ['Equal dollar long/short', 'Max 5 active pairs', 'Stop at 3x std dev'] }, isActive: true, isPublic: true, tags: ['pairs', 'stat-arb', 'market-neutral'], rating: 4.4, usageCount: 215 },
      { userId: users[4].id, name: 'Volatility Harvesting', description: 'Systematic short volatility strategy with tail risk hedging', type: 'quantitative', riskLevel: 'high', timeHorizon: 'short', parameters: { vixThreshold: 20, putSpread: 5, hedgeRatio: 0.1 }, rules: { entry: ['VIX > 20', 'Term structure in contango', 'Put skew elevated'], exit: ['VIX < 14', 'Term structure inverts', 'Realized vol spike'], riskManagement: ['Max notional 20% portfolio', 'Always maintain tail hedge', 'Daily delta hedge'] }, isActive: false, isPublic: false, tags: ['volatility', 'options', 'systematic'], rating: 4.0, usageCount: 78 },
      { userId: users[4].id, name: 'Sector Momentum', description: 'Rotate into top-performing sectors monthly', type: 'momentum', riskLevel: 'medium', timeHorizon: 'medium', parameters: { lookbackMonths: 3, topSectors: 3, rebalanceFreq: 'monthly' }, rules: { entry: ['Top 3 sector performance over 3 months', 'Positive absolute momentum'], exit: ['Sector drops out of top 5', 'Negative absolute momentum'], riskManagement: ['Equal weight top sectors', 'Cash when all negative', 'Max 40% single sector'] }, isActive: true, isPublic: true, tags: ['sector-rotation', 'momentum', 'monthly'], rating: 4.2, usageCount: 167 },
      { userId: users[0].id, name: 'Bollinger Squeeze', description: 'Trade volatility expansion after Bollinger Band compression', type: 'technical', riskLevel: 'medium', timeHorizon: 'short', parameters: { bbPeriod: 20, bbStdDev: 2, squeezeThreshold: 0.5 }, rules: { entry: ['BB width at 6-month low', 'Keltner inside Bollinger', 'Volume expanding'], exit: ['Price touches opposite band', 'BB width > 2x entry width'], riskManagement: ['Stop below lower band', 'Max 4% per trade'] }, isActive: false, isPublic: true, tags: ['bollinger', 'volatility', 'squeeze'], rating: 3.8, usageCount: 142 },
      { userId: users[3].id, name: 'News Sentiment Alpha', description: 'Trade based on NLP sentiment analysis of financial news', type: 'custom', riskLevel: 'high', timeHorizon: 'short', parameters: { sentimentThreshold: 0.7, newsRecency: 4, minSources: 3 }, rules: { entry: ['Sentiment score > 0.7', 'News within 4 hours', '3+ sources confirming'], exit: ['Sentiment reversal', '24-hour time decay', 'Profit target 5%'], riskManagement: ['Max 2% per trade', 'Max 5 sentiment trades/day', 'Stop loss 3%'] }, isActive: true, isPublic: false, tags: ['NLP', 'sentiment', 'news-driven'], rating: 3.3, usageCount: 88 },
    ];

    const strategies = await Strategy.bulkCreate(strategyData);
    console.log(`✅ Created ${strategies.length} strategies`);

    // ================================================================
    // PREDICTIONS (18 predictions)
    // ================================================================
    console.log('🔮 Creating sample predictions...');
    const predictionData = [
      { userId: users[0].id, symbol: 'AAPL', predictionType: 'price', timeframe: '1w', currentPrice: 195.50, predictedPrice: 205.00, predictedDirection: 'up', confidence: 78.5, model: 'lstm', modelVersion: '2.1', targetDate: new Date(Date.now() + 7 * 86400000), technicalIndicators: { rsi: 62, macd: 2.8, bollinger: { upper: 200, lower: 190, middle: 195 }, sma: 192, ema: 194 }, notes: 'Strong iPhone sales momentum heading into holiday season' },
      { userId: users[0].id, symbol: 'NVDA', predictionType: 'price', timeframe: '1m', currentPrice: 875.00, predictedPrice: 950.00, predictedDirection: 'up', confidence: 82.1, model: 'transformer', modelVersion: '3.0', targetDate: new Date(Date.now() + 30 * 86400000), technicalIndicators: { rsi: 68, macd: 15.2, sma: 850, ema: 862 }, notes: 'AI chip demand continues to accelerate, datacenter revenue surging' },
      { userId: users[0].id, symbol: 'TSLA', predictionType: 'direction', timeframe: '1w', currentPrice: 248.75, predictedDirection: 'down', confidence: 65.3, model: 'random_forest', modelVersion: '1.8', targetDate: new Date(Date.now() + 7 * 86400000), technicalIndicators: { rsi: 72, macd: -3.5, sma: 255, ema: 250 }, notes: 'Overbought conditions, competition intensifying' },
      { userId: users[1].id, symbol: 'GOOGL', predictionType: 'price', timeframe: '1d', currentPrice: 175.20, predictedPrice: 178.50, predictedDirection: 'up', confidence: 71.2, model: 'random_forest', modelVersion: '1.8', targetDate: new Date(Date.now() + 86400000), technicalIndicators: { rsi: 55, macd: 1.8, sma: 172, ema: 174 }, notes: 'Cloud revenue acceleration expected' },
      { userId: users[1].id, symbol: 'MSFT', predictionType: 'price', timeframe: '1m', currentPrice: 415.30, predictedPrice: 435.00, predictedDirection: 'up', confidence: 84.6, model: 'ensemble', modelVersion: '2.5', targetDate: new Date(Date.now() + 30 * 86400000), technicalIndicators: { rsi: 58, macd: 5.2, sma: 410, ema: 413 }, notes: 'Azure growth and Copilot monetization driving upside' },
      { userId: users[1].id, symbol: 'AMZN', predictionType: 'direction', timeframe: '1w', currentPrice: 186.00, predictedDirection: 'up', confidence: 73.8, model: 'gradient_boost', modelVersion: '2.0', targetDate: new Date(Date.now() + 7 * 86400000), technicalIndicators: { rsi: 52, macd: 2.1, sma: 183, ema: 185 }, notes: 'AWS margins improving, Prime membership growth' },
      { userId: users[2].id, symbol: 'JNJ', predictionType: 'price', timeframe: '3m', currentPrice: 155.00, predictedPrice: 162.00, predictedDirection: 'up', confidence: 76.4, model: 'lstm', modelVersion: '2.1', targetDate: new Date(Date.now() + 90 * 86400000), technicalIndicators: { rsi: 48, macd: 0.8, sma: 153, ema: 154 }, notes: 'New drug pipeline and stable dividend make it attractive' },
      { userId: users[2].id, symbol: 'PG', predictionType: 'price', timeframe: '6m', currentPrice: 168.00, predictedPrice: 180.00, predictedDirection: 'up', confidence: 80.2, model: 'ensemble', modelVersion: '2.5', targetDate: new Date(Date.now() + 180 * 86400000), technicalIndicators: { rsi: 51, macd: 1.2, sma: 165, ema: 167 }, notes: 'Consumer staples safe haven in uncertain market' },
      { userId: users[2].id, symbol: 'XOM', predictionType: 'direction', timeframe: '1m', currentPrice: 105.00, predictedDirection: 'down', confidence: 62.8, model: 'random_forest', modelVersion: '1.8', targetDate: new Date(Date.now() + 30 * 86400000), technicalIndicators: { rsi: 65, macd: -1.5, sma: 108, ema: 106 }, notes: 'Oil prices weakening on demand concerns' },
      { userId: users[3].id, symbol: 'AMD', predictionType: 'price', timeframe: '1w', currentPrice: 165.00, predictedPrice: 175.00, predictedDirection: 'up', confidence: 74.9, model: 'transformer', modelVersion: '3.0', targetDate: new Date(Date.now() + 7 * 86400000), technicalIndicators: { rsi: 60, macd: 3.2, sma: 158, ema: 162 }, notes: 'MI300 AI chip gaining datacenter market share' },
      { userId: users[3].id, symbol: 'META', predictionType: 'price', timeframe: '1d', currentPrice: 505.00, predictedPrice: 512.00, predictedDirection: 'up', confidence: 69.5, model: 'gradient_boost', modelVersion: '2.0', targetDate: new Date(Date.now() + 86400000), technicalIndicators: { rsi: 57, macd: 4.5, sma: 498, ema: 502 }, notes: 'Ad revenue growth strong, Reels monetization improving' },
      { userId: users[3].id, symbol: 'COIN', predictionType: 'volatility', timeframe: '1w', currentPrice: 225.00, predictedDirection: 'up', confidence: 58.3, model: 'garch', modelVersion: '1.2', targetDate: new Date(Date.now() + 7 * 86400000), technicalIndicators: { rsi: 70, macd: 8.5, sma: 210, ema: 218 }, notes: 'Bitcoin halving catalyst, expect increased volatility' },
      { userId: users[4].id, symbol: 'CRM', predictionType: 'price', timeframe: '1m', currentPrice: 265.00, predictedPrice: 285.00, predictedDirection: 'up', confidence: 77.1, model: 'ensemble', modelVersion: '2.5', targetDate: new Date(Date.now() + 30 * 86400000), technicalIndicators: { rsi: 54, macd: 3.8, sma: 260, ema: 263 }, notes: 'AI integration into CRM products driving enterprise adoption' },
      { userId: users[4].id, symbol: 'V', predictionType: 'price', timeframe: '3m', currentPrice: 278.00, predictedPrice: 295.00, predictedDirection: 'up', confidence: 81.4, model: 'lstm', modelVersion: '2.1', targetDate: new Date(Date.now() + 90 * 86400000), technicalIndicators: { rsi: 56, macd: 2.4, sma: 272, ema: 276 }, notes: 'Cross-border travel recovery boosting transaction volumes' },
      { userId: users[4].id, symbol: 'JPM', predictionType: 'direction', timeframe: '1w', currentPrice: 198.00, predictedDirection: 'up', confidence: 72.6, model: 'random_forest', modelVersion: '1.8', targetDate: new Date(Date.now() + 7 * 86400000), technicalIndicators: { rsi: 59, macd: 1.9, sma: 194, ema: 196 }, notes: 'Net interest income strong, trading revenue solid' },
      { userId: users[0].id, symbol: 'DIS', predictionType: 'price', timeframe: '1m', currentPrice: 112.00, predictedPrice: 120.00, predictedDirection: 'up', confidence: 68.7, model: 'transformer', modelVersion: '3.0', targetDate: new Date(Date.now() + 30 * 86400000), technicalIndicators: { rsi: 45, macd: -0.8, sma: 115, ema: 113 }, notes: 'Streaming profitability improving, parks revenue strong' },
      { userId: users[1].id, symbol: 'BA', predictionType: 'direction', timeframe: '1w', currentPrice: 178.00, predictedDirection: 'sideways', confidence: 55.2, model: 'gradient_boost', modelVersion: '2.0', targetDate: new Date(Date.now() + 7 * 86400000), technicalIndicators: { rsi: 50, macd: 0.2, sma: 176, ema: 177 }, notes: 'Production issues offsetting strong backlog demand' },
      { userId: users[3].id, symbol: 'NFLX', predictionType: 'price', timeframe: '1w', currentPrice: 625.00, predictedPrice: 648.00, predictedDirection: 'up', confidence: 75.8, model: 'lstm', modelVersion: '2.1', targetDate: new Date(Date.now() + 7 * 86400000), technicalIndicators: { rsi: 63, macd: 6.2, sma: 610, ema: 618 }, notes: 'Ad tier growth and password sharing crackdown boosting subscribers' },
    ];

    const predictions = await Prediction.bulkCreate(predictionData);
    console.log(`✅ Created ${predictions.length} predictions`);

    // ================================================================
    // MARKET ANALYSES (18 analyses)
    // ================================================================
    console.log('📈 Creating sample market analyses...');
    const analysisData = [
      { userId: users[0].id, symbol: 'AAPL', analysisType: 'comprehensive', timeframe: '1d', currentPrice: 195.50, priceChange: 3.20, priceChangePercent: 1.66, volume: 52000000, avgVolume: 48000000, technicalAnalysis: { trend: 'bullish', support: [190, 185], resistance: [200, 205], indicators: { rsi: 62, macd: 2.8, bollinger: { upper: 200, lower: 190, middle: 195 } }, patterns: [{ name: 'Cup and Handle', confidence: 78 }], signals: ['Golden cross on 50/200 MA', 'MACD bullish crossover'] }, fundamentalAnalysis: { pe: 31.2, eps: 6.26, revenue: 394000000000, revenueGrowth: 8.2, profitMargin: 25.3, roe: 147.4 }, sentimentAnalysis: { news: { score: 0.72, articles: 45 }, social: { score: 0.68, mentions: 12500 }, analyst: { buyRatings: 28, holdRatings: 8, sellRatings: 2 } }, recommendation: 'buy', confidence: 78.5, targetPrice: 215.00, stopLoss: 185.00, timeHorizon: 'medium', keyPoints: ['Strong iPhone 16 demand', 'Services revenue growing 14% YoY', 'Vision Pro creating new revenue stream'], risks: ['China market competition', 'Regulatory pressure in EU'], summary: 'Apple shows strong fundamentals with growing services revenue. Technical indicators suggest continued upward momentum.', isPublic: true, tags: ['technology', 'large-cap', 'growth'] },
      { userId: users[0].id, symbol: 'NVDA', analysisType: 'comprehensive', timeframe: '1w', currentPrice: 875.00, priceChange: 28.50, priceChangePercent: 3.36, volume: 42000000, avgVolume: 38000000, technicalAnalysis: { trend: 'strongly_bullish', support: [850, 800], resistance: [900, 950], indicators: { rsi: 68, macd: 15.2 }, signals: ['Sustained uptrend', 'Volume confirmation'] }, fundamentalAnalysis: { pe: 65.8, eps: 13.30, revenue: 60900000000, revenueGrowth: 122.0, profitMargin: 55.6, roe: 115.8 }, recommendation: 'strong_buy', confidence: 85.2, targetPrice: 1000.00, stopLoss: 800.00, timeHorizon: 'medium', keyPoints: ['AI chip monopoly position', 'Datacenter revenue tripled', 'CUDA ecosystem moat'], risks: ['Valuation premium', 'Export restrictions to China', 'AMD MI300 competition'], summary: 'NVIDIA dominates AI infrastructure with unprecedented demand for H100/H200 GPUs.', isPublic: true, tags: ['AI', 'semiconductors', 'growth'] },
      { userId: users[0].id, symbol: 'TSLA', analysisType: 'technical', timeframe: '1d', currentPrice: 248.75, priceChange: -5.25, priceChangePercent: -2.07, volume: 35000000, avgVolume: 32000000, technicalAnalysis: { trend: 'bearish', support: [240, 230], resistance: [255, 270], indicators: { rsi: 42, macd: -3.5 }, signals: ['Death cross forming', 'Breaking below 50-day MA'] }, recommendation: 'hold', confidence: 62.4, targetPrice: 230.00, stopLoss: 220.00, timeHorizon: 'short', keyPoints: ['EV competition intensifying', 'Margin pressure from price cuts', 'FSD progress uncertain'], risks: ['Further margin compression', 'Regulatory changes on EV credits'], summary: 'Tesla facing near-term headwinds with price competition and margin pressure.', isPublic: true, tags: ['electric-vehicles', 'high-volatility'] },
      { userId: users[1].id, symbol: 'MSFT', analysisType: 'comprehensive', timeframe: '1w', currentPrice: 415.30, priceChange: 8.70, priceChangePercent: 2.14, volume: 28000000, avgVolume: 25000000, technicalAnalysis: { trend: 'bullish', support: [405, 395], resistance: [425, 440], indicators: { rsi: 58, macd: 5.2 }, signals: ['Steady uptrend', 'Above all major MAs'] }, fundamentalAnalysis: { pe: 35.4, eps: 11.73, revenue: 227000000000, revenueGrowth: 16.0, profitMargin: 36.4, roe: 38.5 }, recommendation: 'buy', confidence: 82.3, targetPrice: 450.00, stopLoss: 395.00, timeHorizon: 'medium', keyPoints: ['Azure growing 29% YoY', 'Copilot monetization ramping', 'Gaming segment strong post-Activision'], risks: ['Enterprise spending slowdown', 'AI capex pressure on margins'], summary: 'Microsoft well positioned with Azure cloud growth and AI monetization through Copilot.', isPublic: true, tags: ['cloud', 'AI', 'enterprise'] },
      { userId: users[1].id, symbol: 'AMZN', analysisType: 'fundamental', timeframe: '1m', currentPrice: 186.00, priceChange: 4.50, priceChangePercent: 2.48, volume: 38000000, avgVolume: 35000000, fundamentalAnalysis: { pe: 58.2, eps: 3.20, revenue: 575000000000, revenueGrowth: 12.5, profitMargin: 7.8, roe: 19.4 }, recommendation: 'buy', confidence: 76.8, targetPrice: 210.00, stopLoss: 170.00, timeHorizon: 'medium', keyPoints: ['AWS margins expanding significantly', 'Retail automation reducing costs', 'Advertising becoming major profit center'], risks: ['FTC antitrust scrutiny', 'Fulfillment cost inflation'], summary: 'Amazon showing improving profitability driven by AWS margins and advertising revenue.', isPublic: true, tags: ['e-commerce', 'cloud', 'advertising'] },
      { userId: users[1].id, symbol: 'JPM', analysisType: 'fundamental', timeframe: '1m', currentPrice: 198.00, priceChange: 2.80, priceChangePercent: 1.43, volume: 12000000, avgVolume: 10000000, fundamentalAnalysis: { pe: 11.8, eps: 16.78, revenue: 162000000000, revenueGrowth: 9.2, profitMargin: 32.1, roe: 17.2 }, recommendation: 'buy', confidence: 79.1, targetPrice: 220.00, stopLoss: 185.00, timeHorizon: 'medium', keyPoints: ['Net interest income at record levels', 'Strong trading revenue', 'Disciplined credit quality'], risks: ['Rate cut impact on NII', 'Commercial real estate exposure'], summary: 'JPMorgan delivering exceptional results with strong NII and diversified revenue streams.', isPublic: true, tags: ['banking', 'financial', 'value'] },
      { userId: users[2].id, symbol: 'JNJ', analysisType: 'comprehensive', timeframe: '1m', currentPrice: 155.00, priceChange: 1.20, priceChangePercent: 0.78, volume: 8000000, avgVolume: 7500000, technicalAnalysis: { trend: 'neutral', support: [150, 145], resistance: [160, 165], indicators: { rsi: 48, macd: 0.8 } }, fundamentalAnalysis: { pe: 22.5, eps: 6.89, revenue: 87800000000, revenueGrowth: 3.5, profitMargin: 18.8, roe: 23.1 }, recommendation: 'hold', confidence: 71.5, targetPrice: 165.00, stopLoss: 145.00, timeHorizon: 'long', keyPoints: ['Stable dividend aristocrat', 'New drug pipeline promising', 'Talc litigation settling'], risks: ['Patent cliffs on key drugs', 'Generic competition'], summary: 'JNJ remains a defensive stalwart with consistent dividends and improving litigation outlook.', isPublic: true, tags: ['healthcare', 'dividend', 'defensive'] },
      { userId: users[2].id, symbol: 'PG', analysisType: 'fundamental', timeframe: '3m', currentPrice: 168.00, priceChange: 0.85, priceChangePercent: 0.51, volume: 7000000, avgVolume: 6500000, fundamentalAnalysis: { pe: 27.8, eps: 6.04, revenue: 84700000000, revenueGrowth: 4.2, profitMargin: 18.5, roe: 31.2 }, recommendation: 'hold', confidence: 74.2, targetPrice: 178.00, stopLoss: 158.00, timeHorizon: 'long', keyPoints: ['Pricing power in inflationary environment', 'Brand portfolio strength', 'Consistent dividend growth'], risks: ['Volume declines from pricing', 'Private label competition'], summary: 'Procter & Gamble maintains pricing power with premium brands in consumer staples.', isPublic: false, tags: ['consumer-staples', 'dividend', 'defensive'] },
      { userId: users[2].id, symbol: 'UNH', analysisType: 'comprehensive', timeframe: '1m', currentPrice: 520.00, priceChange: 6.50, priceChangePercent: 1.27, volume: 4500000, avgVolume: 4000000, technicalAnalysis: { trend: 'bullish', support: [510, 495], resistance: [535, 550], indicators: { rsi: 56, macd: 3.2 } }, fundamentalAnalysis: { pe: 20.1, eps: 25.87, revenue: 371000000000, revenueGrowth: 14.6, profitMargin: 6.2, roe: 25.8 }, recommendation: 'buy', confidence: 80.5, targetPrice: 570.00, stopLoss: 490.00, timeHorizon: 'medium', keyPoints: ['Optum segment rapid growth', 'Medicare Advantage enrollment rising', 'Tech-driven cost efficiencies'], risks: ['Healthcare regulation changes', 'Medical cost ratio volatility'], summary: 'UnitedHealth combines insurance scale with Optum health services growth.', isPublic: true, tags: ['healthcare', 'managed-care', 'growth'] },
      { userId: users[3].id, symbol: 'AMD', analysisType: 'technical', timeframe: '1d', currentPrice: 165.00, priceChange: 4.80, priceChangePercent: 3.0, volume: 55000000, avgVolume: 48000000, technicalAnalysis: { trend: 'bullish', support: [158, 150], resistance: [172, 180], indicators: { rsi: 60, macd: 3.2 }, signals: ['Breakout above consolidation', 'Volume surge'] }, recommendation: 'buy', confidence: 74.9, targetPrice: 185.00, stopLoss: 150.00, timeHorizon: 'short', keyPoints: ['MI300 AI accelerator gaining share', 'Server CPU market share growing', 'Strong gaming revenue'], risks: ['NVIDIA dominance in AI', 'Pricing pressure'], summary: 'AMD showing technical strength with fundamental AI catalyst from MI300 chip lineup.', isPublic: true, tags: ['semiconductors', 'AI', 'technical'] },
      { userId: users[3].id, symbol: 'META', analysisType: 'comprehensive', timeframe: '1w', currentPrice: 505.00, priceChange: 12.30, priceChangePercent: 2.50, volume: 18000000, avgVolume: 16000000, technicalAnalysis: { trend: 'bullish', support: [490, 475], resistance: [520, 540], indicators: { rsi: 57, macd: 4.5 } }, fundamentalAnalysis: { pe: 25.8, eps: 19.57, revenue: 135000000000, revenueGrowth: 25.0, profitMargin: 34.2, roe: 33.8 }, recommendation: 'buy', confidence: 79.8, targetPrice: 560.00, stopLoss: 470.00, timeHorizon: 'medium', keyPoints: ['Ad revenue growth accelerating', 'Reels monetization improving', 'Year of Efficiency delivering margins'], risks: ['Metaverse spending concerns', 'TikTok competition', 'Regulatory risks'], summary: 'Meta delivering strong financial results with efficiency gains and ad revenue momentum.', isPublic: true, tags: ['social-media', 'advertising', 'AI'] },
      { userId: users[3].id, symbol: 'NFLX', analysisType: 'sentiment', timeframe: '1w', currentPrice: 625.00, priceChange: 15.00, priceChangePercent: 2.46, volume: 9000000, avgVolume: 8000000, sentimentAnalysis: { news: { score: 0.75, articles: 32 }, social: { score: 0.71, mentions: 8500 }, analyst: { buyRatings: 22, holdRatings: 12, sellRatings: 3 } }, recommendation: 'buy', confidence: 73.6, targetPrice: 680.00, stopLoss: 585.00, timeHorizon: 'short', keyPoints: ['Password sharing crackdown boosting subs', 'Ad tier growing faster than expected', 'Live sports content expansion'], risks: ['Content cost inflation', 'Streaming market saturation'], summary: 'Netflix sentiment positive driven by subscriber growth catalysts and ad tier expansion.', isPublic: true, tags: ['streaming', 'entertainment', 'growth'] },
      { userId: users[4].id, symbol: 'CRM', analysisType: 'comprehensive', timeframe: '1m', currentPrice: 265.00, priceChange: 5.40, priceChangePercent: 2.08, volume: 8000000, avgVolume: 7000000, technicalAnalysis: { trend: 'bullish', support: [258, 250], resistance: [275, 285], indicators: { rsi: 54, macd: 3.8 } }, fundamentalAnalysis: { pe: 52.4, eps: 5.06, revenue: 34900000000, revenueGrowth: 11.0, profitMargin: 15.4, roe: 10.2 }, recommendation: 'buy', confidence: 77.1, targetPrice: 300.00, stopLoss: 245.00, timeHorizon: 'medium', keyPoints: ['Einstein AI driving enterprise value', 'Operating margin expansion', 'Data Cloud product traction'], risks: ['Enterprise spending slowdown', 'Competition from Microsoft Dynamics'], summary: 'Salesforce leveraging AI to drive product differentiation and margin expansion.', isPublic: true, tags: ['cloud', 'SaaS', 'AI'] },
      { userId: users[4].id, symbol: 'V', analysisType: 'fundamental', timeframe: '3m', currentPrice: 278.00, priceChange: 3.20, priceChangePercent: 1.16, volume: 7500000, avgVolume: 7000000, fundamentalAnalysis: { pe: 30.2, eps: 9.21, revenue: 33400000000, revenueGrowth: 10.8, profitMargin: 54.2, roe: 47.8 }, recommendation: 'buy', confidence: 81.4, targetPrice: 310.00, stopLoss: 260.00, timeHorizon: 'long', keyPoints: ['Cross-border travel recovery', 'New payment flows expansion', 'Consistent margin profile'], risks: ['Regulatory changes on interchange', 'Digital wallet competition'], summary: 'Visa benefits from global payment digitization and travel recovery with exceptional margins.', isPublic: true, tags: ['fintech', 'payments', 'quality'] },
      { userId: users[4].id, symbol: 'INTC', analysisType: 'comprehensive', timeframe: '1m', currentPrice: 32.00, priceChange: -0.80, priceChangePercent: -2.44, volume: 35000000, avgVolume: 30000000, technicalAnalysis: { trend: 'bearish', support: [30, 28], resistance: [35, 38], indicators: { rsi: 38, macd: -1.2 } }, fundamentalAnalysis: { pe: 95.2, eps: 0.34, revenue: 54200000000, revenueGrowth: -1.5, profitMargin: 1.8, roe: 0.8 }, recommendation: 'sell', confidence: 70.3, targetPrice: 28.00, stopLoss: 36.00, timeHorizon: 'short', keyPoints: ['Foundry business bleeding cash', 'Market share loss to AMD continues', 'Massive capex requirements'], risks: ['Government subsidies could help', 'Turnaround takes longer than expected'], summary: 'Intel struggling with execution while competitors gain market share. Foundry bet is high risk.', isPublic: true, tags: ['semiconductors', 'turnaround', 'value-trap'] },
      { userId: users[0].id, symbol: 'GOOGL', analysisType: 'comprehensive', timeframe: '1w', currentPrice: 175.20, priceChange: 4.30, priceChangePercent: 2.52, volume: 25000000, avgVolume: 22000000, technicalAnalysis: { trend: 'bullish', support: [170, 165], resistance: [180, 185], indicators: { rsi: 55, macd: 1.8 } }, fundamentalAnalysis: { pe: 24.5, eps: 7.15, revenue: 307000000000, revenueGrowth: 13.5, profitMargin: 25.8, roe: 29.4 }, recommendation: 'buy', confidence: 80.1, targetPrice: 200.00, stopLoss: 165.00, timeHorizon: 'medium', keyPoints: ['Search AI integration strengthening moat', 'Cloud revenue accelerating', 'YouTube ad revenue growing'], risks: ['DOJ antitrust trial outcome', 'AI search disruption risk'], summary: 'Alphabet executing well on AI integration across products with strong Cloud momentum.', isPublic: true, tags: ['search', 'cloud', 'AI'] },
      { userId: users[1].id, symbol: 'DIS', analysisType: 'sentiment', timeframe: '1m', currentPrice: 112.00, priceChange: -1.50, priceChangePercent: -1.32, volume: 12000000, avgVolume: 10000000, sentimentAnalysis: { news: { score: 0.55, articles: 28 }, social: { score: 0.48, mentions: 6200 }, analyst: { buyRatings: 15, holdRatings: 14, sellRatings: 5 } }, recommendation: 'hold', confidence: 63.8, targetPrice: 125.00, stopLoss: 100.00, timeHorizon: 'medium', keyPoints: ['Disney+ approaching profitability', 'Parks segment strong', 'Content spending discipline improving'], risks: ['Linear TV decline accelerating', 'Theme park spending sensitivity to economy'], summary: 'Disney in transition with streaming improving but legacy media declining. Parks remain strong.', isPublic: true, tags: ['entertainment', 'streaming', 'media'] },
    ];

    const analyses = await MarketAnalysis.bulkCreate(analysisData);
    console.log(`✅ Created ${analyses.length} market analyses`);

    // ================================================================
    // SUMMARY
    // ================================================================
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Market Data: ${marketData.length}`);
    console.log(`   Portfolios: ${portfolios.length}`);
    console.log(`   Strategies: ${strategies.length}`);
    console.log(`   Predictions: ${predictions.length}`);
    console.log(`   Market Analyses: ${analyses.length}`);

    console.log('\n🔐 Test Credentials:');
    console.log('   Admin:      admin@trading.com / admin123');
    console.log('   Trader:     trader1@trading.com / trader123');
    console.log('   Investor:   investor1@trading.com / investor123');
    console.log('   Day Trader: daytrader@trading.com / daytrader123');
    console.log('   Quant Dev:  quantdev@trading.com / quantdev123');

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
