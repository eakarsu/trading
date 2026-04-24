const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Portfolio = sequelize.define('Portfolio', {
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
  totalValue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  cashBalance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  totalReturn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  totalReturnPercent: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    defaultValue: 0
  },
  dayChange: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  dayChangePercent: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    defaultValue: 0
  },
  holdings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  riskProfile: {
    type: DataTypes.ENUM('conservative', 'moderate', 'aggressive'),
    allowNull: false,
    defaultValue: 'moderate'
  },
  strategy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastRebalanced: {
    type: DataTypes.DATE,
    allowNull: true
  },
  performance: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      oneDay: 0,
      oneWeek: 0,
      oneMonth: 0,
      threeMonths: 0,
      sixMonths: 0,
      oneYear: 0,
      ytd: 0,
      inception: 0
    }
  },
  allocation: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      stocks: 0,
      bonds: 0,
      cash: 0,
      crypto: 0,
      commodities: 0,
      reits: 0,
      other: 0
    }
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      autoRebalance: false,
      rebalanceThreshold: 5,
      dividendReinvestment: true,
      taxOptimization: false
    }
  }
}, {
  tableName: 'portfolios',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['userId', 'isActive']
    }
  ]
});

module.exports = Portfolio;
