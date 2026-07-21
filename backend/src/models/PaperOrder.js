const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaperOrder = sequelize.define('PaperOrder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  accountId: { type: DataTypes.UUID, allowNull: false },
  clientOrderId: { type: DataTypes.STRING(120), allowNull: false },
  requestFingerprint: { type: DataTypes.STRING(64), allowNull: false },
  symbol: { type: DataTypes.STRING(16), allowNull: false },
  side: { type: DataTypes.STRING(4), allowNull: false },
  orderType: { type: DataTypes.STRING(12), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(24, 8), allowNull: false },
  limitPrice: { type: DataTypes.DECIMAL(20, 8), allowNull: true },
  filledQuantity: { type: DataTypes.DECIMAL(24, 8), allowNull: false, defaultValue: 0 },
  averageFillPrice: { type: DataTypes.DECIMAL(20, 8), allowNull: true },
  status: { type: DataTypes.STRING(20), allowNull: false },
  rejectionCode: { type: DataTypes.STRING(64), allowNull: true },
  riskDecision: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  marketSnapshotId: { type: DataTypes.UUID, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'paper_orders',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'clientOrderId'] },
    { fields: ['userId', 'status'] },
  ],
});

module.exports = PaperOrder;
