const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketData = sequelize.define('MarketData', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 10]
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  volume: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  high: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  low: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  open: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  close: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  change: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  changePercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  marketCap: {
    type: DataTypes.BIGINT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  pe: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  eps: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  dividend: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  dividendYield: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  beta: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  fiftyTwoWeekHigh: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  fiftyTwoWeekLow: {
    type: DataTypes.DECIMAL(10, 2),
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
  sector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'yahoo'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'market_data',
  timestamps: true,
  indexes: [
    {
      fields: ['symbol']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['symbol', 'timestamp']
    }
  ]
});

module.exports = MarketData;
