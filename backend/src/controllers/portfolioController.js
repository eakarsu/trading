const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const aiService = require('../utils/aiService');

// Get user's portfolio
exports.getPortfolio = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    let portfolio = await Portfolio.findOne({ 
      where: { userId: req.user.id }
    });
    
    // If user doesn't have a portfolio, create a default one with realistic sample data
    if (!portfolio) {
      console.log(`Creating default portfolio for user ${req.user.id}`);
      
      const defaultPortfolio = {
        userId: req.user.id,
        name: 'My Portfolio',
        description: 'Default portfolio',
        totalValue: 100000.00,
        cashBalance: 20000.00,
        totalReturn: 8500.00,
        totalReturnPercent: 9.29,
        dayChange: 250.00,
        dayChangePercent: 0.25,
        holdings: [
          { 
            symbol: 'AAPL', 
            name: 'Apple Inc.',
            shares: 50, 
            avgCost: 150.00, 
            currentPrice: 155.50,
            value: 7775.00,
            change: 275.00,
            changePercent: 3.67
          },
          { 
            symbol: 'MSFT', 
            name: 'Microsoft Corp.',
            shares: 75, 
            avgCost: 300.00, 
            currentPrice: 310.00,
            value: 23250.00,
            change: 750.00,
            changePercent: 3.33
          },
          { 
            symbol: 'GOOGL', 
            name: 'Alphabet Inc.',
            shares: 15, 
            avgCost: 2500.00, 
            currentPrice: 2600.00,
            value: 39000.00,
            change: 1500.00,
            changePercent: 4.00
          }
        ],
        riskProfile: 'moderate',
        strategy: 'Balanced Growth',
        isActive: true,
        performance: {
          oneDay: 0.25,
          oneWeek: 1.85,
          oneMonth: 3.42,
          threeMonths: 6.78,
          sixMonths: 8.15,
          oneYear: 9.29,
          ytd: 7.85,
          inception: 9.29
        },
        allocation: {
          stocks: 70,
          bonds: 10,
          cash: 20,
          crypto: 0,
          commodities: 0,
          reits: 0,
          other: 0
        },
        settings: {
          autoRebalance: false,
          rebalanceThreshold: 5,
          dividendReinvestment: true,
          taxOptimization: false
        }
      };
      
      portfolio = await Portfolio.create(defaultPortfolio);
      
      console.log(`Created default portfolio for user ${req.user.id}`);
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ 
      message: 'Server error while fetching portfolio' 
    });
  }
};

// Create a new portfolio for user
exports.createPortfolio = async (req, res) => {
  try {
    const existingPortfolio = await Portfolio.findOne({ 
      where: { userId: req.user.id }
    });
    
    if (existingPortfolio) {
      return res.status(400).json({ 
        message: 'Portfolio already exists for this user' 
      });
    }
    
    const portfolioData = {
      userId: req.user.id,
      name: req.body.name || 'My Portfolio',
      description: req.body.description || '',
      totalValue: req.body.totalValue || 0,
      cashBalance: req.body.cashBalance || 0,
      totalReturn: req.body.totalReturn || 0,
      totalReturnPercent: req.body.totalReturnPercent || 0,
      dayChange: req.body.dayChange || 0,
      dayChangePercent: req.body.dayChangePercent || 0,
      holdings: req.body.holdings || [],
      riskProfile: req.body.riskProfile || 'moderate',
      strategy: req.body.strategy || null,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      performance: req.body.performance || {
        oneDay: 0,
        oneWeek: 0,
        oneMonth: 0,
        threeMonths: 0,
        sixMonths: 0,
        oneYear: 0,
        ytd: 0,
        inception: 0
      },
      allocation: req.body.allocation || {
        stocks: 0,
        bonds: 0,
        cash: 100,
        crypto: 0,
        commodities: 0,
        reits: 0,
        other: 0
      },
      settings: req.body.settings || {
        autoRebalance: false,
        rebalanceThreshold: 5,
        dividendReinvestment: true,
        taxOptimization: false
      }
    };
    
    const portfolio = await Portfolio.create(portfolioData);
    
    res.status(201).json(portfolio);
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ 
      message: 'Server error while creating portfolio' 
    });
  }
};

// Update user's portfolio
exports.updatePortfolio = async (req, res) => {
  try {
    const updateData = {};
    const updateFields = [
      'name', 'description', 'totalValue', 'cashBalance', 
      'totalReturn', 'totalReturnPercent', 'dayChange', 'dayChangePercent',
      'holdings', 'riskProfile', 'strategy', 'isActive',
      'allocation', 'performance', 'settings'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const [updatedRowsCount] = await Portfolio.update(updateData, {
      where: { userId: req.user.id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Portfolio not found' 
      });
    }
    
    const portfolio = await Portfolio.findOne({
      where: { userId: req.user.id }
    });
    
    res.json(portfolio);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ 
      message: 'Server error while updating portfolio' 
    });
  }
};


// Buy securities
exports.buySecurities = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ 
      where: { userId: req.user.id }
    });
    
    if (!portfolio) {
      return res.status(404).json({ 
        message: 'Portfolio not found' 
      });
    }
    
    const { symbol, name, shares, price } = req.body;
    const amount = shares * price;
    
    // Check if user has enough cash
    if (portfolio.cashBalance < amount) {
      return res.status(400).json({ 
        message: 'Insufficient funds' 
      });
    }
    
    // Update cash balance
    portfolio.cashBalance -= amount;
    
    // Check if holding already exists
    const existingHoldingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);
    
    if (existingHoldingIndex >= 0) {
      // Update existing holding
      const existingHolding = portfolio.holdings[existingHoldingIndex];
      const totalShares = existingHolding.shares + shares;
      const totalCost = (existingHolding.avgCost * existingHolding.shares) + amount;
      existingHolding.shares = totalShares;
      existingHolding.avgCost = totalCost / totalShares;
      existingHolding.currentPrice = price;
      existingHolding.value = totalShares * price;
      existingHolding.change = existingHolding.value - totalCost;
      existingHolding.changePercent = (existingHolding.change / totalCost) * 100;
    } else {
      // Add new holding
      const newHolding = {
        symbol,
        name,
        shares,
        avgCost: price,
        currentPrice: price,
        value: amount,
        change: 0,
        changePercent: 0
      };
      
      portfolio.holdings.push(newHolding);
    }
    
    // Update total portfolio value
    const newTotalValue = portfolio.holdings.reduce((total, holding) => total + holding.value, 0) + portfolio.cashBalance;
    
    await Portfolio.update(
      { 
        cashBalance: portfolio.cashBalance,
        holdings: portfolio.holdings,
        totalValue: newTotalValue
      },
      { where: { userId: req.user.id } }
    );
    
    const updatedPortfolio = await Portfolio.findOne({
      where: { userId: req.user.id }
    });
    
    res.json(updatedPortfolio);
  } catch (error) {
    console.error('Error buying securities:', error);
    res.status(500).json({ 
      message: 'Server error while buying securities' 
    });
  }
};

// Sell securities
exports.sellSecurities = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ 
      where: { userId: req.user.id }
    });
    
    if (!portfolio) {
      return res.status(404).json({ 
        message: 'Portfolio not found' 
      });
    }
    
    const { symbol, shares, price } = req.body;
    const amount = shares * price;
    
    // Find the holding
    const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);
    
    if (holdingIndex < 0) {
      return res.status(404).json({ 
        message: 'Holding not found' 
      });
    }
    
    const holding = portfolio.holdings[holdingIndex];
    
    // Check if user has enough shares
    if (holding.shares < shares) {
      return res.status(400).json({ 
        message: 'Insufficient shares' 
      });
    }
    
    // Update holding
    holding.shares -= shares;
    holding.value = holding.shares * price;
    holding.change = holding.value - (holding.avgCost * holding.shares);
    holding.changePercent = (holding.change / (holding.avgCost * holding.shares)) * 100;
    
    // Remove holding if shares are zero
    if (holding.shares === 0) {
      portfolio.holdings.splice(holdingIndex, 1);
    }
    
    // Update cash balance
    portfolio.cashBalance += amount;
    
    // Update total portfolio value
    const newTotalValue = portfolio.holdings.reduce((total, holding) => total + holding.value, 0) + portfolio.cashBalance;
    
    await Portfolio.update(
      { 
        cashBalance: portfolio.cashBalance,
        holdings: portfolio.holdings,
        totalValue: newTotalValue
      },
      { where: { userId: req.user.id } }
    );
    
    const updatedPortfolio = await Portfolio.findOne({
      where: { userId: req.user.id }
    });
    
    res.json(updatedPortfolio);
  } catch (error) {
    console.error('Error selling securities:', error);
    res.status(500).json({ 
      message: 'Server error while selling securities' 
    });
  }
};

// Transfer funds
exports.transferFunds = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ 
      where: { userId: req.user.id }
    });
    
    if (!portfolio) {
      return res.status(404).json({ 
        message: 'Portfolio not found' 
      });
    }
    
    const { amount, fromAccount, toAccount } = req.body;
    
    // Check if user has enough funds
    if (portfolio.cashBalance < amount) {
      return res.status(400).json({ 
        message: 'Insufficient funds' 
      });
    }
    
    // Update cash balance
    portfolio.cashBalance -= amount;
    
    await Portfolio.update(
      { 
        cashBalance: portfolio.cashBalance
      },
      { where: { userId: req.user.id } }
    );
    
    const updatedPortfolio = await Portfolio.findOne({
      where: { userId: req.user.id }
    });
    
    res.json(updatedPortfolio);
  } catch (error) {
    console.error('Error transferring funds:', error);
    res.status(500).json({ 
      message: 'Server error while transferring funds' 
    });
  }
};

// Get a specific portfolio by ID
exports.getPortfolioById = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ 
      where: {
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!portfolio) {
      return res.status(404).json({ 
        message: 'Portfolio not found' 
      });
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ 
      message: 'Server error while fetching portfolio' 
    });
  }
};

// Delete a portfolio
exports.deletePortfolio = async (req, res) => {
  try {
    const deletedRowsCount = await Portfolio.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Portfolio not found' 
      });
    }
    
    res.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ 
      message: 'Server error while deleting portfolio' 
    });
  }
};
