const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TradingAuditEvent = sequelize.define('TradingAuditEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  actorId: { type: DataTypes.UUID, allowNull: true },
  eventType: { type: DataTypes.STRING(64), allowNull: false },
  entityType: { type: DataTypes.STRING(40), allowNull: false },
  entityId: { type: DataTypes.UUID, allowNull: true },
  payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  previousHash: { type: DataTypes.STRING(64), allowNull: true },
  eventHash: { type: DataTypes.STRING(64), allowNull: false },
  occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'trading_audit_events', timestamps: false,
  indexes: [{ fields: ['userId', 'occurredAt'] }],
});

module.exports = TradingAuditEvent;
