const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Strategy = sequelize.define('Strategy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('momentum', 'value', 'growth', 'dividend', 'technical', 'fundamental', 'quantitative', 'breakout', 'custom'),
    allowNull: false,
    defaultValue: 'custom'
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium'
  },
  timeHorizon: {
    type: DataTypes.ENUM('short', 'medium', 'long'),
    allowNull: false,
    defaultValue: 'medium'
  },
  parameters: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  rules: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      entry: [],
      exit: [],
      riskManagement: []
    }
  },
  performance: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      totalReturn: 0,
      annualizedReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0,
      volatility: 0,
      beta: 0,
      alpha: 0
    }
  },
  backtestResults: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      startDate: null,
      endDate: null,
      initialCapital: 0,
      finalValue: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  lastBacktest: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  usageCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    }
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'strategies',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['isPublic']
    },
    {
      fields: ['rating']
    },
    {
      fields: ['userId', 'isActive']
    }
  ]
});

module.exports = Strategy;
