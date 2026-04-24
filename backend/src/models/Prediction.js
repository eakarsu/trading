const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prediction = sequelize.define('Prediction', {
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
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 10]
    }
  },
  predictionType: {
    type: DataTypes.ENUM('price', 'direction', 'volatility', 'volume', 'trend'),
    allowNull: false,
    defaultValue: 'price'
  },
  timeframe: {
    type: DataTypes.ENUM('1h', '4h', '1d', '1w', '1m', '3m', '6m', '1y'),
    allowNull: false,
    defaultValue: '1d'
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  predictedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  predictedDirection: {
    type: DataTypes.ENUM('up', 'down', 'sideways'),
    allowNull: true
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  accuracy: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'lstm'
  },
  modelVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  technicalIndicators: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      rsi: null,
      macd: null,
      bollinger: null,
      sma: null,
      ema: null,
      stochastic: null,
      williams: null,
      momentum: null
    }
  },
  fundamentalData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      pe: null,
      eps: null,
      revenue: null,
      debt: null,
      roe: null,
      roa: null,
      currentRatio: null,
      quickRatio: null
    }
  },
  marketSentiment: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      newsScore: null,
      socialScore: null,
      analystRating: null,
      institutionalFlow: null
    }
  },
  predictionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  targetDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  actualPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  actualDirection: {
    type: DataTypes.ENUM('up', 'down', 'sideways'),
    allowNull: true
  },
  isResolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  absoluteError: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  percentageError: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'predictions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['symbol']
    },
    {
      fields: ['predictionType']
    },
    {
      fields: ['timeframe']
    },
    {
      fields: ['isResolved']
    },
    {
      fields: ['targetDate']
    },
    {
      fields: ['symbol', 'targetDate']
    },
    {
      fields: ['userId', 'symbol']
    }
  ]
});

module.exports = Prediction;
