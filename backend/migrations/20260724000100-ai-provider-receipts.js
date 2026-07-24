'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = new Set((await queryInterface.showAllTables()).map(value => typeof value === 'string' ? value : value.tableName));
    if (!tables.has('ai_provider_receipts')) {
      await queryInterface.createTable('ai_provider_receipts', {
        id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
        userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
        provider: { type: Sequelize.STRING(32), allowNull: false },
        providerRequestId: { type: Sequelize.STRING(160), allowNull: false },
        model: { type: Sequelize.STRING(160), allowNull: false },
        prompt: { type: Sequelize.TEXT, allowNull: false },
        content: { type: Sequelize.TEXT, allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
      await queryInterface.addIndex('ai_provider_receipts', ['provider', 'providerRequestId'], { unique: true, name: 'ai_provider_receipts_provider_request_uq' });
      await queryInterface.addIndex('ai_provider_receipts', ['userId', 'createdAt'], { name: 'ai_provider_receipts_user_created_idx' });
    }
  },
  async down(queryInterface) {
    const tables = new Set((await queryInterface.showAllTables()).map(value => typeof value === 'string' ? value : value.tableName));
    if (tables.has('ai_provider_receipts')) await queryInterface.dropTable('ai_provider_receipts');
  },
};
