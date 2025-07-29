const { User, Portfolio, Strategy, MarketData, Prediction, MarketAnalysis, sequelize } = require('../models');
const { Op } = require('sequelize');
const { getRealTimeMarketData } = require('../services/financialDataService');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Create default resources for new user
const createDefaultResources = async (userId) => {
  try {
    // Default portfolio data
    const defaultPortfolio = {
      userId: userId,
      name: 'Default Portfolio',
      description: 'Your main investment portfolio',
      totalValue: 100000.00,
      cashBalance: 100000.00,
      totalReturn: 0.00,
      totalReturnPercent: 0.00,
      dayChange: 0.00,
      dayChangePercent: 0.00,
      holdings: [],
      riskProfile: 'moderate',
      strategy: 'Balanced Investing',
      performance: {
        oneDay: 0.00,
        oneWeek: 0.00,
        oneMonth: 0.00,
        threeMonths: 0.00,
        sixMonths: 0.00,
        oneYear: 0.00,
        ytd: 0.00,
        inception: 0.00
      },
      allocation: {
        stocks: 0,
        bonds: 0,
        cash: 100,
        crypto: 0,
        commodities: 0,
        reits: 0,
        other: 0
      }
    };

    // Default strategies
    const defaultStrategies = [
      {
        userId: userId,
        name: 'Conservative Growth Strategy',
        description: 'A low-risk strategy focused on steady, long-term growth with minimal volatility',
        type: 'value',
        riskLevel: 'low',
        timeHorizon: 'long',
        parameters: {
          maxPositionSize: 5.0,
          stopLoss: 2.0,
          takeProfit: 6.0,
          riskPerTrade: 1.0
        },
        rules: {
          entry: ['P/E < 20', 'Dividend yield > 2%', 'Debt/Equity < 0.5'],
          exit: ['P/E > 30', 'Dividend cut', 'Stop loss triggered'],
          riskManagement: ['Max position size 5%', 'Diversify across sectors']
        },
        performance: {
          totalReturn: 0,
          annualizedReturn: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          winRate: 0,
          profitFactor: 0,
          volatility: 0,
          beta: 0,
          alpha: 0
        },
        isPublic: false,
        tags: ['conservative', 'value', 'dividend']
      },
      {
        userId: userId,
        name: 'Balanced Growth Strategy',
        description: 'A moderate-risk strategy balancing growth potential with risk management',
        type: 'growth',
        riskLevel: 'medium',
        timeHorizon: 'medium',
        parameters: {
          maxPositionSize: 8.0,
          stopLoss: 3.0,
          takeProfit: 9.0,
          riskPerTrade: 2.0
        },
        rules: {
          entry: ['Revenue growth > 10%', 'P/E < 25', 'Strong momentum'],
          exit: ['P/E > 35', 'Revenue decline', 'Stop loss triggered'],
          riskManagement: ['Max position size 8%', 'Sector diversification']
        },
        performance: {
          totalReturn: 0,
          annualizedReturn: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          winRate: 0,
          profitFactor: 0,
          volatility: 0,
          beta: 0,
          alpha: 0
        },
        isPublic: false,
        tags: ['balanced', 'growth', 'momentum']
      }
    ];

    // Create all resources
    await Portfolio.create(defaultPortfolio);
    console.log(`Created default portfolio for user ${userId}`);

    for (const strategy of defaultStrategies) {
      await Strategy.create(strategy);
    }
    console.log(`Created default strategies for user ${userId}`);

    console.log(`Successfully created all default resources for user ${userId}`);
  } catch (error) {
    console.error(`Error creating default resources for user ${userId}:`, error);
    // Don't throw error to prevent registration failure
  }
};

// Register new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (userExists) {
      return res.status(400).json({
        message: 'User already exists with this email or username'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    if (user) {
      // Create default resources for the new user (wait for completion)
      try {
        await createDefaultResources(user.id);
        console.log(`Successfully created all default resources for user ${user.id}`);
      } catch (resourceError) {
        console.error(`Failed to create default resources for user ${user.id}:`, resourceError);
        // Continue with registration even if resource creation fails
      }
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      res.status(400).json({
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Authenticate user
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (user && (await user.comparePassword(password))) {
      // Update last login
      await User.update(
        { lastLogin: new Date() },
        { where: { id: user.id } }
      );

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferences: user.preferences,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (user) {
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt
      });
    } else {
      res.status(404).json({
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.username = req.body.username || user.username;
      
      // Only update email if it's different and not already taken
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ where: { email: req.body.email } });
        if (emailExists) {
          return res.status(400).json({
            message: 'Email already in use'
          });
        }
        user.email = req.body.email;
      }

      // Update preferences if provided
      if (req.body.preferences) {
        user.preferences = {
          ...user.preferences,
          ...req.body.preferences
        };
      }

      const updateData = {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        preferences: user.preferences
      };

      await User.update(updateData, {
        where: { id: req.user.id }
      });
      
      const updatedUser = await User.findByPk(req.user.id);

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        preferences: updatedUser.preferences,
        token: generateToken(updatedUser.id)
      });
    } else {
      res.status(404).json({
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile
};
