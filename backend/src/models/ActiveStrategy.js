const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActiveStrategy = sequelize.define('ActiveStrategy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  strategyId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Logical strategy ID used by algoTradingService Map'
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
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'stopped'),
    allowNull: false,
    defaultValue: 'active'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  stoppedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  }
}, {
  tableName: 'active_strategies',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['strategyId'] },
    { fields: ['status'] },
    { fields: ['userId', 'status'] }
  ]
});

module.exports = ActiveStrategy;
