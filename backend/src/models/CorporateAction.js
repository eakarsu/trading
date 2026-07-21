const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CorporateAction = sequelize.define('CorporateAction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  source: { type: DataTypes.STRING(64), allowNull: false },
  sourceRecordId: { type: DataTypes.STRING(160), allowNull: false },
  symbol: { type: DataTypes.STRING(16), allowNull: false },
  actionType: { type: DataTypes.STRING(20), allowNull: false },
  ratio: { type: DataTypes.DECIMAL(20, 8), allowNull: true },
  cashAmount: { type: DataTypes.DECIMAL(20, 8), allowNull: true },
  effectiveAt: { type: DataTypes.DATE, allowNull: false },
  payloadChecksum: { type: DataTypes.STRING(64), allowNull: false },
  appliedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'corporate_actions', timestamps: true,
  indexes: [{ unique: true, fields: ['source', 'sourceRecordId'] }],
});

module.exports = CorporateAction;
