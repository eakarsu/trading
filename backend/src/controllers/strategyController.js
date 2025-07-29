const Strategy = require('../models/Strategy');
const aiService = require('../utils/aiService');

// Get all strategies for user
exports.getStrategies = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    let strategies = await Strategy.findAll({ 
      where: { userId: req.user.id }
    });
    
    // If user has no strategies, create default ones
    if (strategies.length === 0) {
      console.log(`Creating default strategies for user ${req.user.id}`);
      
      const defaultStrategies = [
        {
          userId: req.user.id,
          name: 'Momentum Trading Strategy',
          description: 'A strategy that capitalizes on the continuation of existing market trends',
          type: 'momentum',
          riskLevel: 'high',
          timeHorizon: 'medium',
          isActive: true,
          parameters: {
            entryThreshold: 2.5,
            exitThreshold: -1.0,
            stopLoss: 5.0,
            takeProfit: 10.0,
            positionSize: 2.0
          },
          performance: {
            totalReturn: 15.2,
            annualizedReturn: 22.5,
            sharpeRatio: 1.24,
            maxDrawdown: -12.3,
            winRate: 68.5,
            profitFactor: 1.8,
            volatility: 18.2,
            beta: 1.1,
            alpha: 4.2
          },
          tags: ['momentum', 'trending', 'high-frequency']
        },
        {
          userId: req.user.id,
          name: 'Value Investing Strategy',
          description: 'A strategy that focuses on undervalued stocks with strong fundamentals',
          type: 'value',
          riskLevel: 'medium',
          timeHorizon: 'long',
          isActive: false,
          parameters: {
            peRatio: 15.0,
            pbRatio: 1.5,
            debtToEquity: 0.5,
            roe: 15.0,
            positionSize: 1.5
          },
          performance: {
            totalReturn: 8.7,
            annualizedReturn: 12.3,
            sharpeRatio: 0.96,
            maxDrawdown: -8.7,
            winRate: 55.2,
            profitFactor: 1.2,
            volatility: 12.8,
            beta: 0.8,
            alpha: 2.1
          },
          tags: ['value', 'fundamental', 'long-term']
        },
        {
          userId: req.user.id,
          name: 'Technical Analysis Strategy',
          description: 'A strategy that uses technical indicators to identify trading opportunities',
          type: 'technical',
          riskLevel: 'high',
          timeHorizon: 'short',
          isActive: true,
          parameters: {
            rsiThreshold: 70,
            macdSignal: 'bullish',
            stopLoss: 4.0,
            takeProfit: 8.0,
            positionSize: 1.8
          },
          performance: {
            totalReturn: 12.8,
            annualizedReturn: 18.7,
            sharpeRatio: 1.14,
            maxDrawdown: -10.2,
            winRate: 62.3,
            profitFactor: 1.6,
            volatility: 16.4,
            beta: 1.2,
            alpha: 3.5
          },
          tags: ['technical', 'indicators', 'short-term']
        }
      ];
      
      // Create the default strategies
      const createdStrategies = await Strategy.bulkCreate(defaultStrategies);
      strategies = createdStrategies;
      
      console.log(`Created ${createdStrategies.length} default strategies for user ${req.user.id}`);
    }
    
    res.json(strategies);
  } catch (error) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({ 
      message: 'Server error while fetching strategies' 
    });
  }
};

// Get a specific strategy by ID
exports.getStrategyById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    const strategy = await Strategy.findOne({ 
      where: {
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!strategy) {
      return res.status(404).json({ 
        message: 'Strategy not found' 
      });
    }
    
    res.json(strategy);
  } catch (error) {
    console.error('Error fetching strategy:', error);
    res.status(500).json({ 
      message: 'Server error while fetching strategy' 
    });
  }
};

// Create a new strategy
exports.createStrategy = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    const strategyData = {
      userId: req.user.id,
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      riskLevel: req.body.riskLevel,
      timeHorizon: req.body.timeHorizon || 'medium',
      isActive: req.body.isActive || false,
      parameters: req.body.parameters || {},
      rules: req.body.rules || { entry: [], exit: [], riskManagement: [] },
      performance: req.body.performance || {},
      tags: req.body.tags || []
    };
    
    const strategy = await Strategy.create(strategyData);
    
    res.status(201).json(strategy);
  } catch (error) {
    console.error('Error creating strategy:', error);
    res.status(500).json({ 
      message: 'Server error while creating strategy' 
    });
  }
};

// Update a strategy
exports.updateStrategy = async (req, res) => {
  try {
    const updateData = {};
    const updateFields = [
      'name', 'description', 'type', 'riskLevel', 'timeHorizon',
      'isActive', 'isPublic', 'parameters', 'rules', 'performance',
      'lastBacktest', 'backtestResults', 'tags'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const [updatedRowsCount] = await Strategy.update(updateData, {
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Strategy not found' 
      });
    }
    
    const strategy = await Strategy.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    res.json(strategy);
  } catch (error) {
    console.error('Error updating strategy:', error);
    res.status(500).json({ 
      message: 'Server error while updating strategy' 
    });
  }
};

// Delete a strategy
exports.deleteStrategy = async (req, res) => {
  try {
    const deletedRowsCount = await Strategy.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Strategy not found' 
      });
    }
    
    res.json({ message: 'Strategy deleted successfully' });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    res.status(500).json({ 
      message: 'Server error while deleting strategy' 
    });
  }
};

// Activate a strategy
exports.activateStrategy = async (req, res) => {
  try {
    const [updatedRowsCount] = await Strategy.update(
      { isActive: true },
      {
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      }
    );
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Strategy not found' 
      });
    }
    
    const strategy = await Strategy.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    res.json(strategy);
  } catch (error) {
    console.error('Error activating strategy:', error);
    res.status(500).json({ 
      message: 'Server error while activating strategy' 
    });
  }
};

// Deactivate a strategy
exports.deactivateStrategy = async (req, res) => {
  try {
    const [updatedRowsCount] = await Strategy.update(
      { isActive: false },
      {
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      }
    );
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Strategy not found' 
      });
    }
    
    const strategy = await Strategy.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    res.json(strategy);
  } catch (error) {
    console.error('Error deactivating strategy:', error);
    res.status(500).json({ 
      message: 'Server error while deactivating strategy' 
    });
  }
};

// Add a trade to strategy
exports.addTrade = async (req, res) => {
  try {
    const strategy = await Strategy.findOne({ 
      where: {
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!strategy) {
      return res.status(404).json({ 
        message: 'Strategy not found' 
      });
    }
    
    const trade = {
      symbol: req.body.symbol,
      entry: req.body.entry,
      exit: req.body.exit,
      profit: req.body.profit,
      return: req.body.return,
      date: req.body.date || new Date(),
      status: req.body.status || 'closed'
    };
    
    // Update performance metrics with the new trade
    const currentPerformance = strategy.performance || {};
    const updatedPerformance = {
      ...currentPerformance,
      totalTrades: (currentPerformance.totalTrades || 0) + 1,
      totalReturn: (currentPerformance.totalReturn || 0) + (req.body.return || 0)
    };
    
    await Strategy.update(
      { performance: updatedPerformance },
      {
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      }
    );
    
    const updatedStrategy = await Strategy.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    res.json(updatedStrategy);
  } catch (error) {
    console.error('Error adding trade:', error);
    res.status(500).json({ 
      message: 'Server error while adding trade' 
    });
  }
};

// Update backtest results
exports.updateBacktestResults = async (req, res) => {
  try {
    const [updatedRowsCount] = await Strategy.update(
      { 
        lastBacktest: new Date(),
        backtestResults: req.body.backtestResults
      },
      {
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      }
    );
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ 
        message: 'Strategy not found' 
      });
    }
    
    const strategy = await Strategy.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    res.json(strategy);
  } catch (error) {
    console.error('Error updating backtest results:', error);
    res.status(500).json({ 
      message: 'Server error while updating backtest results' 
    });
  }
};

// Generate a new AI strategy
exports.generateAIStrategy = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Generate a new AI strategy with predefined data
    const aiStrategyTypes = [
      {
        name: 'AI Momentum Strategy',
        description: 'AI-powered momentum trading strategy that identifies trending stocks using machine learning algorithms',
        type: 'momentum',
        riskLevel: 'medium',
        timeHorizon: 'medium',
        parameters: {
          momentumThreshold: 3.0,
          confidenceLevel: 0.85,
          stopLoss: 4.5,
          positionSize: 2.5
        },
        rules: {
          entry: ['Momentum > threshold', 'Volume > average'],
          exit: ['Momentum < exit threshold', 'Stop loss triggered'],
          riskManagement: ['Position sizing based on volatility', 'Dynamic stop loss']
        },
        performance: {
          totalReturn: 18.5,
          annualizedReturn: 16.2,
          sharpeRatio: 1.22,
          maxDrawdown: -9.8,
          winRate: 68.5,
          profitFactor: 1.8,
          volatility: 15.2,
          beta: 1.1,
          alpha: 4.2
        }
      },
      {
        name: 'AI Sentiment Strategy',
        description: 'Strategy that uses AI to analyze market sentiment from news and social media',
        type: 'custom',
        riskLevel: 'low',
        timeHorizon: 'short',
        parameters: {
          sentimentThreshold: 0.7,
          newsWeight: 0.6,
          socialWeight: 0.4,
          positionSize: 1.5
        },
        rules: {
          entry: ['Sentiment score > threshold', 'News sentiment positive'],
          exit: ['Sentiment deteriorates', 'Target profit reached'],
          riskManagement: ['Conservative position sizing', 'Sentiment-based stop loss']
        },
        performance: {
          totalReturn: 12.3,
          annualizedReturn: 11.8,
          sharpeRatio: 1.14,
          maxDrawdown: -6.2,
          winRate: 72.1,
          profitFactor: 1.6,
          volatility: 10.8,
          beta: 0.8,
          alpha: 3.1
        }
      },
      {
        name: 'AI Pattern Recognition Strategy',
        description: 'Advanced pattern recognition using neural networks to identify profitable chart patterns',
        type: 'technical',
        riskLevel: 'high',
        timeHorizon: 'short',
        parameters: {
          patternConfidence: 0.9,
          lookbackPeriod: 30,
          stopLoss: 6.0,
          positionSize: 3.0
        },
        rules: {
          entry: ['Pattern confidence > 90%', 'Volume confirmation'],
          exit: ['Pattern invalidated', 'Target reached'],
          riskManagement: ['Pattern-based stop loss', 'Aggressive position sizing']
        },
        performance: {
          totalReturn: 25.7,
          annualizedReturn: 22.1,
          sharpeRatio: 1.16,
          maxDrawdown: -15.3,
          winRate: 62.3,
          profitFactor: 2.1,
          volatility: 22.1,
          beta: 1.4,
          alpha: 8.2
        }
      }
    ];

    // Select a random strategy type
    const selectedStrategy = aiStrategyTypes[Math.floor(Math.random() * aiStrategyTypes.length)];
    
    const strategy = await Strategy.create({
      userId: req.user.id,
      name: selectedStrategy.name,
      description: selectedStrategy.description,
      type: selectedStrategy.type,
      riskLevel: selectedStrategy.riskLevel,
      timeHorizon: selectedStrategy.timeHorizon,
      parameters: selectedStrategy.parameters,
      rules: selectedStrategy.rules,
      performance: selectedStrategy.performance,
      isActive: false,
      isPublic: false,
      tags: ['AI-generated', 'machine-learning', selectedStrategy.type],
      usageCount: 0,
      ratingCount: 0
    });
    
    res.status(201).json(strategy);
  } catch (error) {
    console.error('Error generating AI strategy:', error);
    res.status(500).json({ 
      message: 'Server error while generating AI strategy' 
    });
  }
};

// Optimize an existing strategy using AI
exports.optimizeStrategy = async (req, res) => {
  try {
    const strategy = await Strategy.findOne({ 
      where: {
        id: req.params.id, 
        userId: req.user.id 
      }
    });
    
    if (!strategy) {
      return res.status(404).json({ 
        message: 'Strategy not found' 
      });
    }
    
    // Simulate optimization results
    const optimizationResult = {
      id: Date.now(),
      strategy: strategy.name,
      parameter: 'Risk Level',
      oldValue: strategy.riskLevel,
      newValue: strategy.riskLevel === 'low' ? 'medium' : strategy.riskLevel === 'medium' ? 'high' : 'low',
      improvement: Math.random() * 10 + 2, // 2-12% improvement
      status: 'Completed',
      timestamp: new Date()
    };
    
    // Update strategy with optimized parameters
    const currentPerformance = strategy.performance || {};
    const updatedPerformance = {
      ...currentPerformance,
      totalReturn: (currentPerformance.totalReturn || 0) + optimizationResult.improvement
    };
    
    await Strategy.update(
      {
        riskLevel: optimizationResult.newValue,
        performance: updatedPerformance,
        lastBacktest: new Date()
      },
      {
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      }
    );
    
    const updatedStrategy = await Strategy.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    res.json({
      strategy: updatedStrategy,
      optimization: optimizationResult
    });
  } catch (error) {
    console.error('Error optimizing strategy:', error);
    res.status(500).json({ 
      message: 'Server error while optimizing strategy' 
    });
  }
};

// Get optimization history
exports.getOptimizations = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Get user's strategies
    const strategies = await Strategy.findAll({ 
      where: { userId: req.user.id }
    });

    // Generate mock optimization data
    const optimizations = strategies.map((strategy, index) => ({
      id: index + 1,
      strategy: strategy.name,
      parameter: ['Risk Level', 'Position Size', 'Stop Loss'][index % 3],
      oldValue: ['medium', '2.0%', '5.0%'][index % 3],
      newValue: ['high', '2.5%', '4.5%'][index % 3],
      improvement: Math.random() * 8 + 2,
      status: 'Completed',
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
    }));
    
    res.json(optimizations);
  } catch (error) {
    console.error('Error fetching optimizations:', error);
    res.status(500).json({ 
      message: 'Server error while fetching optimizations' 
    });
  }
};

// Get backtesting results
exports.getBacktestResults = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Get user's strategies
    const strategies = await Strategy.findAll({ 
      where: { userId: req.user.id }
    });

    // Generate mock backtesting data
    const backtestResults = strategies.map((strategy, index) => {
      const startDate = new Date(2023, 0, 1); // Jan 1, 2023
      const endDate = new Date(2023, 11, 31); // Dec 31, 2023
      const totalReturn = Math.random() * 30 - 5; // -5% to 25%
      const annualizedReturn = totalReturn * 0.8;
      const maxDrawdown = -(Math.random() * 15 + 5); // -5% to -20%
      const sharpeRatio = Math.random() * 2 + 0.5; // 0.5 to 2.5
      const winRate = Math.random() * 30 + 50; // 50% to 80%

      return {
        id: index + 1,
        strategy: strategy.name,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalReturn: totalReturn,
        annualizedReturn: annualizedReturn,
        maxDrawdown: maxDrawdown,
        sharpeRatio: sharpeRatio,
        winRate: Math.round(winRate),
        trades: Math.floor(Math.random() * 100) + 50,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last month
      };
    });
    
    res.json(backtestResults);
  } catch (error) {
    console.error('Error fetching backtest results:', error);
    res.status(500).json({ 
      message: 'Server error while fetching backtest results' 
    });
  }
};
