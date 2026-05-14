const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * AIResult — generic JSONB-backed audit log for every AI call.
 *
 * Captures: which user invoked, which feature (analysis/strategy/risk/etc),
 * the model used, the raw + parsed response, latency, and any error.
 * Used for: cost telemetry, prompt-cache analytics, post-hoc debugging,
 * and the trading audit "post-trade journal" feature (proposal #1).
 */
const AIResult = sequelize.define('AIResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL'
  },
  feature: {
    // e.g. "market_analysis", "strategy_generation", "risk_assessment",
    // "trade_rationale", "portfolio_analysis", "stock_picks"
    type: DataTypes.STRING(64),
    allowNull: false
  },
  symbol: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  model: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  promptHash: {
    type: DataTypes.STRING(128),
    allowNull: true
  },
  promptTokens: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  completionTokens: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  latencyMs: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cacheHit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // ai_results JSONB column — stores the parsed LLM output, fully structured
  ai_results: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  rawResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ai_results',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['feature'] },
    { fields: ['symbol'] },
    { fields: ['createdAt'] },
    { fields: ['userId', 'feature'] }
  ]
});

module.exports = AIResult;
