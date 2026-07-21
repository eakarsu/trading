const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaperPosition = sequelize.define('PaperPosition', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  accountId: { type: DataTypes.UUID, allowNull: false },
  symbol: { type: DataTypes.STRING(16), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(24, 8), allowNull: false, defaultValue: 0 },
  averageCost: { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 0 },
  realizedPnl: { type: DataTypes.DECIMAL(20, 4), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'paper_positions', timestamps: true,
  indexes: [{ unique: true, fields: ['accountId', 'symbol'] }],
});

module.exports = PaperPosition;
