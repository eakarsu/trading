const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketAnalysis = sequelize.define('MarketAnalysis', {
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
  analysisType: {
    type: DataTypes.ENUM('technical', 'fundamental', 'sentiment', 'comprehensive'),
    allowNull: false,
    defaultValue: 'comprehensive'
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
  priceChange: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  priceChangePercent: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true
  },
  volume: {
    type: DataTypes.BIGINT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  avgVolume: {
    type: DataTypes.BIGINT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  technicalAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      trend: null,
      support: [],
      resistance: [],
      indicators: {
        rsi: null,
        macd: null,
        bollinger: null,
        sma: null,
        ema: null,
        stochastic: null,
        williams: null,
        momentum: null,
        atr: null,
        adx: null
      },
      patterns: [],
      signals: []
    }
  },
  fundamentalAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      pe: null,
      eps: null,
      revenue: null,
      revenueGrowth: null,
      profitMargin: null,
      debtToEquity: null,
      roe: null,
      roa: null,
      currentRatio: null,
      quickRatio: null,
      bookValue: null,
      priceToBook: null,
      dividendYield: null,
      payoutRatio: null
    }
  },
  sentimentAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      overall: null,
      news: {
        score: null,
        articles: [],
        keywords: []
      },
      social: {
        score: null,
        mentions: 0,
        sentiment: null,
        trending: false
      },
      analyst: {
        rating: null,
        targetPrice: null,
        recommendations: {
          buy: 0,
          hold: 0,
          sell: 0
        }
      },
      institutional: {
        flow: null,
        ownership: null,
        changes: []
      }
    }
  },
  riskAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      volatility: null,
      beta: null,
      var: null,
      sharpeRatio: null,
      maxDrawdown: null,
      correlations: {},
      riskScore: null,
      riskFactors: []
    }
  },
  recommendation: {
    type: DataTypes.ENUM('strong_buy', 'buy', 'hold', 'sell', 'strong_sell'),
    allowNull: true
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  targetPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  stopLoss: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  timeHorizon: {
    type: DataTypes.ENUM('short', 'medium', 'long'),
    allowNull: false,
    defaultValue: 'medium'
  },
  keyPoints: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: []
  },
  risks: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: []
  },
  opportunities: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: []
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
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
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'market_analysis',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['symbol']
    },
    {
      fields: ['analysisType']
    },
    {
      fields: ['recommendation']
    },
    {
      fields: ['isPublic']
    },
    {
      fields: ['symbol', 'createdAt']
    },
    {
      fields: ['userId', 'symbol']
    }
  ]
});

module.exports = MarketAnalysis;
