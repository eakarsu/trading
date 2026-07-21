const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LedgerEntry = sequelize.define('LedgerEntry', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  eventGroupId: { type: DataTypes.UUID, allowNull: false },
  sequence: { type: DataTypes.INTEGER, allowNull: false },
  accountCode: { type: DataTypes.STRING(48), allowNull: false },
  direction: { type: DataTypes.STRING(6), allowNull: false },
  amount: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
  symbol: { type: DataTypes.STRING(16), allowNull: true },
  quantity: { type: DataTypes.DECIMAL(24, 8), allowNull: true },
  eventType: { type: DataTypes.STRING(40), allowNull: false },
  orderId: { type: DataTypes.UUID, allowNull: true },
  fillId: { type: DataTypes.UUID, allowNull: true },
  correctionOfId: { type: DataTypes.UUID, allowNull: true },
  effectiveAt: { type: DataTypes.DATE, allowNull: false },
  recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.STRING(240), allowNull: false },
}, {
  tableName: 'ledger_entries', timestamps: false,
  indexes: [
    { unique: true, fields: ['eventGroupId', 'sequence'] },
    { fields: ['userId', 'recordedAt'] },
  ],
});

module.exports = LedgerEntry;
