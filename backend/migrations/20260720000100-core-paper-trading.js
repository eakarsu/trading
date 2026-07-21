'use strict';

const tableName = value => typeof value === 'string' ? value : value.tableName;

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = new Set((await queryInterface.showAllTables()).map(tableName));
    const create = async (name, columns) => {
      if (!existing.has(name)) {
        await queryInterface.createTable(name, columns);
        existing.add(name);
      }
    };
    const addIndex = async (name, fields, options) => {
      const indices = await queryInterface.showIndex(name);
      if (!indices.some(index => index.name === options.name)) await queryInterface.addIndex(name, fields, options);
    };
    const uuid = { type: Sequelize.UUID, allowNull: false, primaryKey: true };
    const timestamps = {
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    };

    await create('users', {
      id: uuid,
      username: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      email: { type: Sequelize.STRING(254), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(100), allowNull: false },
      firstName: { type: Sequelize.STRING(50), allowNull: false },
      lastName: { type: Sequelize.STRING(50), allowNull: false },
      role: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'user' },
      preferences: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      lastLogin: { type: Sequelize.DATE, allowNull: true },
      ...timestamps,
    });

    await create('market_snapshots', {
      id: uuid,
      source: { type: Sequelize.STRING(64), allowNull: false },
      sourceRecordId: { type: Sequelize.STRING(160), allowNull: false },
      symbol: { type: Sequelize.STRING(16), allowNull: false },
      bid: { type: Sequelize.DECIMAL(20, 8), allowNull: false },
      ask: { type: Sequelize.DECIMAL(20, 8), allowNull: false },
      last: { type: Sequelize.DECIMAL(20, 8), allowNull: false },
      volume: { type: Sequelize.DECIMAL(24, 8), allowNull: false },
      sourceTimestamp: { type: Sequelize.DATE, allowNull: false },
      receivedAt: { type: Sequelize.DATE, allowNull: false },
      licenseScope: { type: Sequelize.STRING(64), allowNull: false },
      checksum: { type: Sequelize.STRING(64), allowNull: false },
      correctionOfId: { type: Sequelize.UUID, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      ...timestamps,
    });
    await addIndex('market_snapshots', ['source', 'sourceRecordId'], { unique: true, name: 'market_snapshots_source_record_unique' });
    await addIndex('market_snapshots', ['symbol', 'sourceTimestamp'], { name: 'market_snapshots_symbol_time' });

    await create('paper_accounts', {
      id: uuid,
      userId: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      baseCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      cashBalance: { type: Sequelize.DECIMAL(20, 4), allowNull: false },
      dailyRealizedPnl: { type: Sequelize.DECIMAL(20, 4), allowNull: false, defaultValue: 0 },
      riskDate: { type: Sequelize.DATEONLY, allowNull: false },
      killSwitchActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      killSwitchReason: { type: Sequelize.STRING(240), allowNull: true },
      maxOrderNotional: { type: Sequelize.DECIMAL(20, 4), allowNull: false },
      maxSymbolExposure: { type: Sequelize.DECIMAL(20, 4), allowNull: false },
      maxGrossExposure: { type: Sequelize.DECIMAL(20, 4), allowNull: false },
      maxDailyLoss: { type: Sequelize.DECIMAL(20, 4), allowNull: false },
      maxParticipationPercent: { type: Sequelize.DECIMAL(8, 4), allowNull: false },
      maxMarketDataAgeSeconds: { type: Sequelize.INTEGER, allowNull: false },
      ...timestamps,
    });

    await create('paper_orders', {
      id: uuid,
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      accountId: { type: Sequelize.UUID, allowNull: false, references: { model: 'paper_accounts', key: 'id' }, onDelete: 'CASCADE' },
      clientOrderId: { type: Sequelize.STRING(120), allowNull: false },
      requestFingerprint: { type: Sequelize.STRING(64), allowNull: false },
      symbol: { type: Sequelize.STRING(16), allowNull: false },
      side: { type: Sequelize.STRING(4), allowNull: false },
      orderType: { type: Sequelize.STRING(12), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(24, 8), allowNull: false },
      limitPrice: { type: Sequelize.DECIMAL(20, 8), allowNull: true },
      filledQuantity: { type: Sequelize.DECIMAL(24, 8), allowNull: false, defaultValue: 0 },
      averageFillPrice: { type: Sequelize.DECIMAL(20, 8), allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false },
      rejectionCode: { type: Sequelize.STRING(64), allowNull: true },
      riskDecision: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      marketSnapshotId: { type: Sequelize.UUID, allowNull: true, references: { model: 'market_snapshots', key: 'id' } },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      ...timestamps,
    });
    await addIndex('paper_orders', ['userId', 'clientOrderId'], { unique: true, name: 'paper_orders_user_client_unique' });
    await addIndex('paper_orders', ['userId', 'status'], { name: 'paper_orders_user_status' });

    await create('paper_fills', {
      id: uuid,
      orderId: { type: Sequelize.UUID, allowNull: false, references: { model: 'paper_orders', key: 'id' }, onDelete: 'RESTRICT' },
      sequence: { type: Sequelize.INTEGER, allowNull: false },
      quantity: { type: Sequelize.DECIMAL(24, 8), allowNull: false },
      price: { type: Sequelize.DECIMAL(20, 8), allowNull: false },
      notional: { type: Sequelize.DECIMAL(20, 4), allowNull: false },
      marketSnapshotId: { type: Sequelize.UUID, allowNull: false, references: { model: 'market_snapshots', key: 'id' } },
      executedAt: { type: Sequelize.DATE, allowNull: false },
      ...timestamps,
    });
    await addIndex('paper_fills', ['orderId', 'sequence'], { unique: true, name: 'paper_fills_order_sequence_unique' });

    await create('paper_positions', {
      id: uuid,
      accountId: { type: Sequelize.UUID, allowNull: false, references: { model: 'paper_accounts', key: 'id' }, onDelete: 'CASCADE' },
      symbol: { type: Sequelize.STRING(16), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(24, 8), allowNull: false, defaultValue: 0 },
      averageCost: { type: Sequelize.DECIMAL(20, 8), allowNull: false, defaultValue: 0 },
      realizedPnl: { type: Sequelize.DECIMAL(20, 4), allowNull: false, defaultValue: 0 },
      ...timestamps,
    });
    await addIndex('paper_positions', ['accountId', 'symbol'], { unique: true, name: 'paper_positions_account_symbol_unique' });

    await create('ledger_entries', {
      id: uuid,
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      eventGroupId: { type: Sequelize.UUID, allowNull: false },
      sequence: { type: Sequelize.INTEGER, allowNull: false },
      accountCode: { type: Sequelize.STRING(48), allowNull: false },
      direction: { type: Sequelize.STRING(6), allowNull: false },
      amount: { type: Sequelize.DECIMAL(20, 4), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false },
      symbol: { type: Sequelize.STRING(16), allowNull: true },
      quantity: { type: Sequelize.DECIMAL(24, 8), allowNull: true },
      eventType: { type: Sequelize.STRING(40), allowNull: false },
      orderId: { type: Sequelize.UUID, allowNull: true, references: { model: 'paper_orders', key: 'id' }, onDelete: 'RESTRICT' },
      fillId: { type: Sequelize.UUID, allowNull: true, references: { model: 'paper_fills', key: 'id' }, onDelete: 'RESTRICT' },
      correctionOfId: { type: Sequelize.UUID, allowNull: true, references: { model: 'ledger_entries', key: 'id' }, onDelete: 'RESTRICT' },
      effectiveAt: { type: Sequelize.DATE, allowNull: false },
      recordedAt: { type: Sequelize.DATE, allowNull: false },
      description: { type: Sequelize.STRING(240), allowNull: false },
    });
    await addIndex('ledger_entries', ['eventGroupId', 'sequence'], { unique: true, name: 'ledger_entries_group_sequence_unique' });
    await addIndex('ledger_entries', ['userId', 'recordedAt'], { name: 'ledger_entries_user_time' });
    await addIndex('ledger_entries', ['correctionOfId'], { unique: true, where: { correctionOfId: { [Sequelize.Op.ne]: null } }, name: 'ledger_entries_single_correction' });

    await create('trading_audit_events', {
      id: uuid,
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      actorId: { type: Sequelize.UUID, allowNull: true },
      eventType: { type: Sequelize.STRING(64), allowNull: false },
      entityType: { type: Sequelize.STRING(40), allowNull: false },
      entityId: { type: Sequelize.UUID, allowNull: true },
      payload: { type: Sequelize.JSONB, allowNull: false },
      previousHash: { type: Sequelize.STRING(64), allowNull: true },
      eventHash: { type: Sequelize.STRING(64), allowNull: false },
      occurredAt: { type: Sequelize.DATE, allowNull: false },
    });
    await addIndex('trading_audit_events', ['userId', 'occurredAt'], { name: 'trading_audit_user_time' });

    await create('corporate_actions', {
      id: uuid,
      source: { type: Sequelize.STRING(64), allowNull: false },
      sourceRecordId: { type: Sequelize.STRING(160), allowNull: false },
      symbol: { type: Sequelize.STRING(16), allowNull: false },
      actionType: { type: Sequelize.STRING(20), allowNull: false },
      ratio: { type: Sequelize.DECIMAL(20, 8), allowNull: true },
      cashAmount: { type: Sequelize.DECIMAL(20, 8), allowNull: true },
      effectiveAt: { type: Sequelize.DATE, allowNull: false },
      payloadChecksum: { type: Sequelize.STRING(64), allowNull: false },
      appliedAt: { type: Sequelize.DATE, allowNull: true },
      ...timestamps,
    });
    await addIndex('corporate_actions', ['source', 'sourceRecordId'], { unique: true, name: 'corporate_actions_source_record_unique' });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION prevent_trading_audit_mutation() RETURNS trigger AS $$
        BEGIN RAISE EXCEPTION '% is append-only', TG_TABLE_NAME; END; $$ LANGUAGE plpgsql;
        DROP TRIGGER IF EXISTS ledger_entries_append_only ON ledger_entries;
        CREATE TRIGGER ledger_entries_append_only BEFORE UPDATE OR DELETE ON ledger_entries
          FOR EACH ROW EXECUTE FUNCTION prevent_trading_audit_mutation();
        DROP TRIGGER IF EXISTS trading_audit_events_append_only ON trading_audit_events;
        CREATE TRIGGER trading_audit_events_append_only BEFORE UPDATE OR DELETE ON trading_audit_events
          FOR EACH ROW EXECUTE FUNCTION prevent_trading_audit_mutation();
      `);
    }
  },

  async down(queryInterface) {
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS prevent_trading_audit_mutation() CASCADE');
    }
    const existing = new Set((await queryInterface.showAllTables()).map(tableName));
    for (const table of ['corporate_actions', 'trading_audit_events', 'ledger_entries', 'paper_positions', 'paper_fills', 'paper_orders', 'paper_accounts', 'market_snapshots']) {
      if (existing.has(table)) await queryInterface.dropTable(table);
    }
  },
};
