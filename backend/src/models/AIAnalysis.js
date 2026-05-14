const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AIAnalysis = sequelize.define('AIAnalysis', {
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
    allowNull: false
  },
  analysisJson: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  modelUsed: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'anthropic/claude-sonnet-4'
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ai_analyses',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['symbol'] },
    { fields: ['symbol', 'createdAt'] },
    { fields: ['userId', 'symbol'] }
  ]
});

module.exports = AIAnalysis;
