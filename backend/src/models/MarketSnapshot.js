const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketSnapshot = sequelize.define('MarketSnapshot', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  source: { type: DataTypes.STRING(64), allowNull: false },
  sourceRecordId: { type: DataTypes.STRING(160), allowNull: false },
  symbol: { type: DataTypes.STRING(16), allowNull: false },
  bid: { type: DataTypes.DECIMAL(20, 8), allowNull: false },
  ask: { type: DataTypes.DECIMAL(20, 8), allowNull: false },
  last: { type: DataTypes.DECIMAL(20, 8), allowNull: false },
  volume: { type: DataTypes.DECIMAL(24, 8), allowNull: false },
  sourceTimestamp: { type: DataTypes.DATE, allowNull: false },
  receivedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  licenseScope: { type: DataTypes.STRING(64), allowNull: false },
  checksum: { type: DataTypes.STRING(64), allowNull: false },
  correctionOfId: { type: DataTypes.UUID, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  tableName: 'market_snapshots',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['source', 'sourceRecordId'] },
    { fields: ['symbol', 'sourceTimestamp'] },
  ],
});

module.exports = MarketSnapshot;
