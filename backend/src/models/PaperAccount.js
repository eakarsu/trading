const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaperAccount = sequelize.define('PaperAccount', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, unique: true },
  baseCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
  cashBalance: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  dailyRealizedPnl: { type: DataTypes.DECIMAL(20, 4), allowNull: false, defaultValue: 0 },
  riskDate: { type: DataTypes.DATEONLY, allowNull: false },
  killSwitchActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  killSwitchReason: { type: DataTypes.STRING(240), allowNull: true },
  maxOrderNotional: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  maxSymbolExposure: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  maxGrossExposure: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  maxDailyLoss: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  maxParticipationPercent: { type: DataTypes.DECIMAL(8, 4), allowNull: false },
  maxMarketDataAgeSeconds: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'paper_accounts', timestamps: true });

module.exports = PaperAccount;
