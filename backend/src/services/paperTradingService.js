const crypto = require('crypto');
const { Op } = require('sequelize');
const { paperRiskDefaults, list } = require('../config/runtime');
const {
  DomainError, date, fingerprint, normalizeOrder, positiveNumber, symbol, text, uuid: uuidText,
} = require('../domain/tradingValidation');
const { RiskEngine } = require('./riskEngine');
const { TradingAuditService } = require('./tradingAuditService');

const number = value => Number(value || 0);
const money = value => Math.round((value + Number.EPSILON) * 10000) / 10000;
const quantity = value => Math.round((value + Number.EPSILON) * 100000000) / 100000000;
const uuid = () => crypto.randomUUID();

class PaperTradingService {
  constructor(models, options = {}) {
    this.models = models;
    this.sequelize = models.sequelize;
    this.riskEngine = options.riskEngine || new RiskEngine();
    this.audit = options.audit || new TradingAuditService(models);
  }

  async ensureAccount(userId, transaction) {
    if (!transaction) return this.sequelize.transaction(inner => this.ensureAccount(userId, inner));
    const [account, created] = await this.models.PaperAccount.findOrCreate({
      where: { userId },
      defaults: { userId, ...paperRiskDefaults(), riskDate: new Date().toISOString().slice(0, 10) },
      transaction,
    });
    if (created) {
      const eventGroupId = uuid();
      const common = {
        userId, eventGroupId, currency: account.baseCurrency, eventType: 'PAPER_ACCOUNT_OPENED',
        effectiveAt: account.createdAt, description: 'Paper account opening balance',
      };
      await this.models.LedgerEntry.bulkCreate([
        { ...common, sequence: 1, accountCode: 'PAPER_CASH', direction: 'DEBIT', amount: account.cashBalance },
        { ...common, sequence: 2, accountCode: 'PAPER_OPENING_EQUITY', direction: 'CREDIT', amount: account.cashBalance },
      ], { transaction });
      await this.audit.append({
        userId, actorId: userId, eventType: 'PAPER_ACCOUNT_OPENED', entityType: 'PAPER_ACCOUNT', entityId: account.id,
        payload: { cashBalance: number(account.cashBalance), custodyBoundary: 'PAPER_SIMULATION_ONLY' },
      }, transaction);
    }
    return account;
  }

  async refreshRiskDay(account, now, transaction) {
    const currentDate = now.toISOString().slice(0, 10);
    if (account.riskDate !== currentDate) {
      account.riskDate = currentDate;
      account.dailyRealizedPnl = 0;
      await account.save({ transaction });
    }
  }

  async accountSummary(userId) {
    const account = await this.ensureAccount(userId);
    const positions = await this.models.PaperPosition.findAll({ where: { accountId: account.id }, order: [['symbol', 'ASC']] });
    const marked = await this.markPositions(positions);
    return {
      account,
      positions: marked,
      custodyBoundary: 'PAPER_SIMULATION_ONLY',
      liveTradingEnabled: false,
      grossExposure: money(marked.reduce((sum, row) => sum + Math.abs(number(row.marketValue)), 0)),
    };
  }

  async markPositions(positions, transaction) {
    if (!positions.length) return [];
    const snapshots = await this.models.MarketSnapshot.findAll({
      where: { symbol: { [Op.in]: positions.map(row => row.symbol) } },
      order: [['sourceTimestamp', 'DESC'], ['receivedAt', 'DESC'], ['id', 'DESC']], transaction,
    });
    const latest = new Map();
    snapshots.forEach(row => { if (!latest.has(row.symbol)) latest.set(row.symbol, row); });
    return positions.map(row => {
      const plain = row.toJSON ? row.toJSON() : row;
      const snapshot = latest.get(row.symbol);
      const markPrice = snapshot ? number(snapshot.last) : number(plain.averageCost);
      return {
        ...plain, markPrice, marketValue: money(number(plain.quantity) * markPrice),
        marketSnapshotId: snapshot?.id || null, sourceTimestamp: snapshot?.sourceTimestamp || null,
      };
    });
  }

  async latestSnapshot(symbolValue, transaction) {
    return this.models.MarketSnapshot.findOne({
      where: { symbol: symbolValue }, order: [['sourceTimestamp', 'DESC'], ['receivedAt', 'DESC']], transaction,
    });
  }

  async placeOrder(userId, input, actorId = userId) {
    const normalized = normalizeOrder(input);
    const requestFingerprint = fingerprint(normalized);
    try {
      return await this.sequelize.transaction(async transaction => {
      const existing = await this.models.PaperOrder.findOne({
        where: { userId, clientOrderId: normalized.clientOrderId }, transaction,
      });
      if (existing) {
        if (existing.requestFingerprint !== requestFingerprint) {
          throw new DomainError(409, 'CLIENT_ORDER_ID_CONFLICT', 'clientOrderId was already used with a different request');
        }
        return { order: existing, fill: null, idempotentReplay: true };
      }

      const account = await this.ensureAccount(userId, transaction);
      await account.reload({ transaction, lock: transaction.LOCK.UPDATE });
      await this.refreshRiskDay(account, new Date(), transaction);
      const snapshot = await this.latestSnapshot(normalized.symbol, transaction);
      const positions = await this.models.PaperPosition.findAll({ where: { accountId: account.id }, transaction, lock: transaction.LOCK.UPDATE });
      const markedPositions = await this.markPositions(positions, transaction);
      const decision = this.riskEngine.evaluate({ account, order: normalized, snapshot, positions: markedPositions });
      const now = new Date();
      const order = await this.models.PaperOrder.create({
        ...normalized, userId, accountId: account.id, requestFingerprint,
        status: decision.approved ? 'APPROVED' : 'REJECTED',
        rejectionCode: decision.approved ? null : decision.reasons[0],
        riskDecision: decision, marketSnapshotId: snapshot?.id || null,
        approvedAt: decision.approved ? now : null,
        completedAt: decision.approved ? null : now,
      }, { transaction });

      await this.audit.append({
        userId, actorId, eventType: decision.approved ? 'ORDER_APPROVED' : 'ORDER_REJECTED',
        entityType: 'PAPER_ORDER', entityId: order.id,
        payload: { clientOrderId: order.clientOrderId, decision },
      }, transaction);

      if (!decision.approved) return { order, fill: null, idempotentReplay: false };
      const fill = await this.executeOrderLocked(order, account, snapshot, actorId, transaction);
      return { order, fill, idempotentReplay: false };
      });
    } catch (error) {
      if (error.name !== 'SequelizeUniqueConstraintError') throw error;
      const existing = await this.models.PaperOrder.findOne({ where: { userId, clientOrderId: normalized.clientOrderId } });
      if (existing?.requestFingerprint === requestFingerprint) return { order: existing, fill: null, idempotentReplay: true };
      throw new DomainError(409, 'CLIENT_ORDER_ID_CONFLICT', 'clientOrderId was already used with a different request');
    }
  }

  isMarketable(order, snapshot) {
    if (order.orderType === 'MARKET') return true;
    return order.side === 'BUY'
      ? number(order.limitPrice) >= number(snapshot.ask)
      : number(order.limitPrice) <= number(snapshot.bid);
  }

  fillPrice(order, snapshot) {
    const quote = order.side === 'BUY' ? number(snapshot.ask) : number(snapshot.bid);
    // A deterministic one-basis-point paper slippage model; never violates a limit price.
    const slipped = order.side === 'BUY' ? quote * 1.0001 : quote * 0.9999;
    if (order.orderType === 'LIMIT') {
      return money(order.side === 'BUY' ? Math.min(slipped, number(order.limitPrice)) : Math.max(slipped, number(order.limitPrice)));
    }
    return money(slipped);
  }

  async executeOrder(userId, orderId, actorId = userId) {
    const result = await this.sequelize.transaction(async transaction => {
      const normalizedOrderId = uuidText(orderId, 'orderId');
      const order = await this.models.PaperOrder.findOne({ where: { id: normalizedOrderId, userId }, transaction, lock: transaction.LOCK.UPDATE });
      if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND', 'Paper order not found');
      if (!['APPROVED', 'OPEN', 'PARTIALLY_FILLED'].includes(order.status)) {
        throw new DomainError(409, 'ORDER_NOT_EXECUTABLE', `Order in ${order.status} state cannot be executed`);
      }
      const account = await this.models.PaperAccount.findByPk(order.accountId, { transaction, lock: transaction.LOCK.UPDATE });
      await this.refreshRiskDay(account, new Date(), transaction);
      const snapshot = await this.latestSnapshot(order.symbol, transaction);
      const remaining = quantity(number(order.quantity) - number(order.filledQuantity));
      const positions = await this.models.PaperPosition.findAll({ where: { accountId: account.id }, transaction, lock: transaction.LOCK.UPDATE });
      const decision = this.riskEngine.evaluate({
        account,
        order: { ...order.toJSON(), quantity: remaining },
        snapshot,
        positions: await this.markPositions(positions, transaction),
      });
      if (!decision.approved) {
        order.riskDecision = decision;
        await order.save({ transaction });
        await this.audit.append({
          userId, actorId, eventType: 'EXECUTION_BLOCKED', entityType: 'PAPER_ORDER', entityId: order.id,
          payload: { decision },
        }, transaction);
        return { blockedDecision: decision };
      }
      order.riskDecision = decision;
      order.marketSnapshotId = snapshot.id;
      const fill = await this.executeOrderLocked(order, account, snapshot, actorId, transaction);
      return { order, fill, idempotentReplay: false };
    });
    if (result.blockedDecision) {
      throw new DomainError(422, result.blockedDecision.reasons[0], 'Deterministic risk controls blocked execution', result.blockedDecision);
    }
    return result;
  }

  async executeOrderLocked(order, account, snapshot, actorId, transaction) {
    await snapshot.reload({ transaction, lock: transaction.LOCK.UPDATE });
    if (!this.isMarketable(order, snapshot)) {
      order.status = 'OPEN';
      await order.save({ transaction });
      await this.audit.append({
        userId: order.userId, actorId, eventType: 'ORDER_RESTING', entityType: 'PAPER_ORDER', entityId: order.id,
        payload: { marketSnapshotId: snapshot.id },
      }, transaction);
      return null;
    }

    const remaining = quantity(number(order.quantity) - number(order.filledQuantity));
    const participationCap = quantity(number(snapshot.volume) * (number(account.maxParticipationPercent) / 100));
    const consumedLiquidity = number(await this.models.PaperFill.sum('quantity', { where: { marketSnapshotId: snapshot.id }, transaction }) || 0);
    const availableLiquidity = quantity(Math.max(0, participationCap - consumedLiquidity));
    const fillQuantity = quantity(Math.min(remaining, availableLiquidity));
    if (fillQuantity <= 0) {
      order.status = number(order.filledQuantity) > 0 ? 'PARTIALLY_FILLED' : 'OPEN';
      await order.save({ transaction });
      await this.audit.append({
        userId: order.userId, actorId, eventType: 'ORDER_WAITING_FOR_LIQUIDITY', entityType: 'PAPER_ORDER', entityId: order.id,
        payload: { marketSnapshotId: snapshot.id, participationCap, consumedLiquidity },
      }, transaction);
      return null;
    }
    const price = this.fillPrice(order, snapshot);
    const notional = money(fillQuantity * price);
    const fillCount = await this.models.PaperFill.count({ where: { orderId: order.id }, transaction });
    const fill = await this.models.PaperFill.create({
      orderId: order.id, sequence: fillCount + 1, quantity: fillQuantity, price, notional,
      marketSnapshotId: snapshot.id, executedAt: new Date(),
    }, { transaction });

    let position = await this.models.PaperPosition.findOne({ where: { accountId: account.id, symbol: order.symbol }, transaction, lock: transaction.LOCK.UPDATE });
    if (!position) {
      position = await this.models.PaperPosition.create({ accountId: account.id, symbol: order.symbol }, { transaction });
    }
    let realizedPnl = 0;
    if (order.side === 'BUY') {
      const oldQuantity = number(position.quantity);
      position.averageCost = quantity(((oldQuantity * number(position.averageCost)) + notional) / (oldQuantity + fillQuantity));
      position.quantity = quantity(oldQuantity + fillQuantity);
      account.cashBalance = money(number(account.cashBalance) - notional);
    } else {
      realizedPnl = money((price - number(position.averageCost)) * fillQuantity);
      position.quantity = quantity(number(position.quantity) - fillQuantity);
      position.realizedPnl = money(number(position.realizedPnl) + realizedPnl);
      if (number(position.quantity) === 0) position.averageCost = 0;
      account.cashBalance = money(number(account.cashBalance) + notional);
      account.dailyRealizedPnl = money(number(account.dailyRealizedPnl) + realizedPnl);
    }
    await Promise.all([position.save({ transaction }), account.save({ transaction })]);

    const oldFilled = number(order.filledQuantity);
    const totalFilled = quantity(oldFilled + fillQuantity);
    order.averageFillPrice = quantity(((oldFilled * number(order.averageFillPrice)) + notional) / totalFilled);
    order.filledQuantity = totalFilled;
    order.status = totalFilled >= number(order.quantity) ? 'FILLED' : 'PARTIALLY_FILLED';
    order.completedAt = order.status === 'FILLED' ? new Date() : null;
    await order.save({ transaction });

    await this.recordFillLedger(order, fill, { realizedPnl, costBasis: money(notional - realizedPnl) }, transaction);
    await this.audit.append({
      userId: order.userId, actorId, eventType: order.status === 'FILLED' ? 'ORDER_FILLED' : 'ORDER_PARTIALLY_FILLED',
      entityType: 'PAPER_FILL', entityId: fill.id,
      payload: { orderId: order.id, quantity: fillQuantity, price, notional, marketSnapshotId: snapshot.id, realizedPnl },
    }, transaction);
    return fill;
  }

  async recordFillLedger(order, fill, { realizedPnl, costBasis }, transaction) {
    const group = uuid();
    const common = {
      userId: order.userId, eventGroupId: group, currency: 'USD', symbol: order.symbol,
      quantity: fill.quantity, eventType: 'PAPER_FILL', orderId: order.id, fillId: fill.id,
      effectiveAt: fill.executedAt, description: `${order.side} paper fill ${order.symbol}`,
    };
    const entries = order.side === 'BUY' ? [
      { ...common, sequence: 1, accountCode: 'PAPER_SECURITIES', direction: 'DEBIT', amount: fill.notional },
      { ...common, sequence: 2, accountCode: 'PAPER_CASH', direction: 'CREDIT', amount: fill.notional },
    ] : [
      { ...common, sequence: 1, accountCode: 'PAPER_CASH', direction: 'DEBIT', amount: fill.notional },
      { ...common, sequence: 2, accountCode: 'PAPER_SECURITIES', direction: 'CREDIT', amount: costBasis },
      ...(realizedPnl > 0 ? [{ ...common, sequence: 3, accountCode: 'PAPER_REALIZED_PNL', direction: 'CREDIT', amount: realizedPnl }]
        : realizedPnl < 0 ? [{ ...common, sequence: 3, accountCode: 'PAPER_REALIZED_PNL', direction: 'DEBIT', amount: Math.abs(realizedPnl) }] : []),
    ];
    await this.models.LedgerEntry.bulkCreate(entries, { transaction });
  }

  async listOrders(userId, limit = 100) {
    return this.models.PaperOrder.findAll({
      where: { userId }, include: [{ model: this.models.PaperFill, as: 'fills' }],
      order: [['createdAt', 'DESC']], limit: Math.min(Math.max(Number(limit) || 100, 1), 500),
    });
  }

  async setKillSwitch(userId, { active, reason }, actor) {
    if (typeof active !== 'boolean') throw new DomainError(400, 'VALIDATION_ERROR', 'active must be a boolean');
    if (!active && actor.role !== 'admin') throw new DomainError(403, 'ADMIN_REQUIRED', 'Only an administrator can release the kill switch');
    const normalizedReason = text(reason, 'reason', 240);
    return this.sequelize.transaction(async transaction => {
      const account = await this.ensureAccount(userId, transaction);
      await account.reload({ transaction, lock: transaction.LOCK.UPDATE });
      account.killSwitchActive = active;
      account.killSwitchReason = active ? normalizedReason : null;
      await account.save({ transaction });
      let cancelledOrders = 0;
      if (active) {
        const [count] = await this.models.PaperOrder.update(
          { status: 'CANCELLED', completedAt: new Date() },
          { where: { accountId: account.id, status: { [Op.in]: ['APPROVED', 'OPEN', 'PARTIALLY_FILLED'] } }, transaction },
        );
        cancelledOrders = count;
      }
      await this.audit.append({
        userId, actorId: actor.id, eventType: active ? 'KILL_SWITCH_ACTIVATED' : 'KILL_SWITCH_RELEASED',
        entityType: 'PAPER_ACCOUNT', entityId: account.id, payload: { reason: normalizedReason, cancelledOrders },
      }, transaction);
      return { account, cancelledOrders };
    });
  }

  async correctLedger(userId, { eventGroupId, reason }, actorId) {
    const groupId = uuidText(eventGroupId, 'eventGroupId');
    const normalizedReason = text(reason, 'reason', 200);
    return this.sequelize.transaction(async transaction => {
      const originals = await this.models.LedgerEntry.findAll({ where: { userId, eventGroupId: groupId }, order: [['sequence', 'ASC']], transaction });
      if (!originals.length) throw new DomainError(404, 'LEDGER_EVENT_NOT_FOUND', 'Ledger event group not found');
      const previousCorrection = await this.models.LedgerEntry.findOne({ where: { correctionOfId: { [Op.in]: originals.map(row => row.id) } }, transaction });
      if (previousCorrection) throw new DomainError(409, 'LEDGER_ALREADY_CORRECTED', 'Ledger event group already has a correction');
      const correctionGroup = uuid();
      const reversals = originals.map((row, index) => ({
        userId, eventGroupId: correctionGroup, sequence: index + 1, accountCode: row.accountCode,
        direction: row.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT', amount: row.amount,
        currency: row.currency, symbol: row.symbol, quantity: row.quantity,
        eventType: 'CORRECTION', orderId: row.orderId, fillId: row.fillId, correctionOfId: row.id,
        effectiveAt: new Date(), description: `Correction: ${normalizedReason}`,
      }));
      const reposts = originals.map((row, index) => ({
        userId, eventGroupId: correctionGroup, sequence: originals.length + index + 1, accountCode: row.accountCode,
        direction: row.direction, amount: row.amount, currency: row.currency, symbol: row.symbol, quantity: row.quantity,
        eventType: 'CORRECTION_REPOST', orderId: row.orderId, fillId: row.fillId, correctionOfId: null,
        effectiveAt: new Date(), description: `Corrected repost: ${normalizedReason}`,
      }));
      const corrections = await this.models.LedgerEntry.bulkCreate([...reversals, ...reposts], { transaction });
      await this.audit.append({
        userId, actorId, eventType: 'LEDGER_CORRECTED', entityType: 'LEDGER_EVENT', entityId: null,
        payload: { originalEventGroupId: groupId, correctionEventGroupId: correctionGroup, reason: normalizedReason },
      }, transaction);
      return { originalEventGroupId: groupId, correctionEventGroupId: correctionGroup, entries: corrections };
    });
  }

  async reconcile(userId) {
    const orders = await this.models.PaperOrder.findAll({ where: { userId }, include: [{ model: this.models.PaperFill, as: 'fills' }] });
    const ledger = await this.models.LedgerEntry.findAll({ where: { userId }, order: [['recordedAt', 'ASC']], raw: true });
    const exceptions = [];
    orders.forEach(order => {
      const fillTotal = quantity(order.fills.reduce((sum, fill) => sum + number(fill.quantity), 0));
      if (Math.abs(fillTotal - number(order.filledQuantity)) > 0.00000001) {
        exceptions.push({ code: 'ORDER_FILL_QUANTITY_MISMATCH', orderId: order.id, orderQuantity: number(order.filledQuantity), fillQuantity: fillTotal });
      }
    });
    const groups = new Map();
    ledger.forEach(row => {
      const group = groups.get(row.eventGroupId) || { debit: 0, credit: 0 };
      group[row.direction.toLowerCase()] += number(row.amount);
      groups.set(row.eventGroupId, group);
      if (!row.accountCode.startsWith('PAPER_')) exceptions.push({ code: 'CUSTODY_BOUNDARY_VIOLATION', ledgerEntryId: row.id });
    });
    groups.forEach((group, eventGroupId) => {
      if (Math.abs(group.debit - group.credit) > 0.0001) exceptions.push({ code: 'UNBALANCED_LEDGER_EVENT', eventGroupId, ...group });
    });
    const account = await this.models.PaperAccount.findOne({ where: { userId } });
    const positions = account ? await this.models.PaperPosition.findAll({ where: { accountId: account.id }, raw: true }) : [];
    const netFor = accountCode => money(ledger.filter(row => row.accountCode === accountCode)
      .reduce((sum, row) => sum + (row.direction === 'DEBIT' ? number(row.amount) : -number(row.amount)), 0));
    if (account && Math.abs(netFor('PAPER_CASH') - number(account.cashBalance)) > 0.0001) {
      exceptions.push({ code: 'CASH_LEDGER_MISMATCH', ledgerBalance: netFor('PAPER_CASH'), accountBalance: number(account.cashBalance) });
    }
    const securitiesLedger = netFor('PAPER_SECURITIES');
    const positionCost = money(positions.reduce((sum, position) => sum + number(position.quantity) * number(position.averageCost), 0));
    if (Math.abs(securitiesLedger - positionCost) > 0.0001) {
      exceptions.push({ code: 'SECURITIES_LEDGER_MISMATCH', ledgerBalance: securitiesLedger, positionCost });
    }
    return { valid: exceptions.length === 0, exceptions, orderCount: orders.length, ledgerEntryCount: ledger.length, reconciledAt: new Date().toISOString() };
  }

  async auditExport(userId) {
    const [summary, orders, ledger, auditEvents, chain] = await Promise.all([
      this.accountSummary(userId), this.listOrders(userId, 500),
      this.models.LedgerEntry.findAll({ where: { userId }, order: [['recordedAt', 'ASC']] }),
      this.models.TradingAuditEvent.findAll({ where: { userId }, order: [['occurredAt', 'ASC']] }),
      this.audit.verify(userId),
    ]);
    const payload = {
      exportVersion: 1, generatedAt: new Date().toISOString(), custodyBoundary: 'PAPER_SIMULATION_ONLY',
      account: summary, orders, ledger, auditEvents, auditChain: chain,
    };
    const serialized = JSON.parse(JSON.stringify(payload));
    return { ...serialized, checksum: fingerprint(serialized) };
  }

  async applyCorporateAction(input, actorId) {
    const source = text(input.source, 'source', 64);
    if (!list('LICENSED_MARKET_DATA_SOURCES').includes(source)) throw new DomainError(403, 'UNLICENSED_MARKET_SOURCE', 'Corporate-action source is not approved');
    const normalized = {
      source, sourceRecordId: text(input.sourceRecordId, 'sourceRecordId', 160), symbol: symbol(input.symbol),
      actionType: text(input.actionType, 'actionType', 20).toUpperCase(), effectiveAt: date(input.effectiveAt, 'effectiveAt'),
      ratio: input.ratio == null ? null : positiveNumber(input.ratio, 'ratio'),
      cashAmount: input.cashAmount == null ? null : positiveNumber(input.cashAmount, 'cashAmount'),
    };
    if (!['SPLIT', 'DIVIDEND'].includes(normalized.actionType)) throw new DomainError(400, 'VALIDATION_ERROR', 'actionType must be SPLIT or DIVIDEND');
    if (normalized.actionType === 'SPLIT' && !normalized.ratio) throw new DomainError(400, 'VALIDATION_ERROR', 'ratio is required for a split');
    if (normalized.actionType === 'DIVIDEND' && !normalized.cashAmount) throw new DomainError(400, 'VALIDATION_ERROR', 'cashAmount is required for a dividend');
    const payloadChecksum = fingerprint(normalized);
    return this.sequelize.transaction(async transaction => {
      const existing = await this.models.CorporateAction.findOne({ where: { source, sourceRecordId: normalized.sourceRecordId }, transaction });
      if (existing) {
        if (existing.payloadChecksum !== payloadChecksum) throw new DomainError(409, 'SOURCE_RECORD_CONFLICT', 'Corporate-action idempotency key was reused');
        return { action: existing, idempotentReplay: true, affectedAccounts: 0 };
      }
      const action = await this.models.CorporateAction.create({ ...normalized, payloadChecksum, appliedAt: new Date() }, { transaction });
      const positions = await this.models.PaperPosition.findAll({
        where: { symbol: normalized.symbol, quantity: { [Op.gt]: 0 } }, include: [{ model: this.models.PaperAccount, as: 'account' }], transaction,
      });
      for (const position of positions) {
        const account = position.account;
        if (normalized.actionType === 'SPLIT') {
          position.quantity = quantity(number(position.quantity) * normalized.ratio);
          position.averageCost = quantity(number(position.averageCost) / normalized.ratio);
          await position.save({ transaction });
        } else {
          const amount = money(number(position.quantity) * normalized.cashAmount);
          account.cashBalance = money(number(account.cashBalance) + amount);
          await account.save({ transaction });
          const group = uuid();
          const common = {
            userId: account.userId, eventGroupId: group, currency: account.baseCurrency, symbol: normalized.symbol,
            eventType: 'CORPORATE_ACTION', effectiveAt: normalized.effectiveAt, description: `Paper dividend ${normalized.symbol}`,
          };
          await this.models.LedgerEntry.bulkCreate([
            { ...common, sequence: 1, accountCode: 'PAPER_CASH', direction: 'DEBIT', amount },
            { ...common, sequence: 2, accountCode: 'PAPER_DIVIDEND_INCOME', direction: 'CREDIT', amount },
          ], { transaction });
        }
        await this.audit.append({
          userId: account.userId, actorId, eventType: 'CORPORATE_ACTION_APPLIED', entityType: 'CORPORATE_ACTION', entityId: action.id,
          payload: { actionType: normalized.actionType, symbol: normalized.symbol, ratio: normalized.ratio, cashAmount: normalized.cashAmount },
        }, transaction);
      }
      return { action, idempotentReplay: false, affectedAccounts: positions.length };
    });
  }
}

module.exports = { PaperTradingService };
