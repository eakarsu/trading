const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaperFill = sequelize.define('PaperFill', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderId: { type: DataTypes.UUID, allowNull: false },
  sequence: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(24, 8), allowNull: false },
  price: { type: DataTypes.DECIMAL(20, 8), allowNull: false },
  notional: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  marketSnapshotId: { type: DataTypes.UUID, allowNull: false },
  executedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'paper_fills', timestamps: true,
  indexes: [{ unique: true, fields: ['orderId', 'sequence'] }],
});

module.exports = PaperFill;
