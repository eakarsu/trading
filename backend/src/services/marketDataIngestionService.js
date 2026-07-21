const { Op } = require('sequelize');
const { list } = require('../config/runtime');
const {
  DomainError, date, fingerprint, nonNegativeNumber, positiveNumber, symbol, text,
  uuid,
} = require('../domain/tradingValidation');

class MarketDataIngestionService {
  constructor({ MarketSnapshot }) {
    this.MarketSnapshot = MarketSnapshot;
  }

  normalize(input) {
    const source = text(input.source, 'source', 64);
    const licensedSources = list('LICENSED_MARKET_DATA_SOURCES');
    if (licensedSources.length === 0 || !licensedSources.includes(source)) {
      throw new DomainError(403, 'UNLICENSED_MARKET_SOURCE', 'The market-data source is not approved for this deployment');
    }
    const sourceTimestamp = date(input.sourceTimestamp, 'sourceTimestamp');
    if (sourceTimestamp.getTime() > Date.now() + 300000) {
      throw new DomainError(400, 'SOURCE_TIME_IN_FUTURE', 'sourceTimestamp is too far in the future');
    }
    const normalized = {
      source,
      sourceRecordId: text(input.sourceRecordId, 'sourceRecordId', 160),
      symbol: symbol(input.symbol),
      bid: positiveNumber(input.bid, 'bid'),
      ask: positiveNumber(input.ask, 'ask'),
      last: positiveNumber(input.last, 'last'),
      volume: nonNegativeNumber(input.volume, 'volume'),
      sourceTimestamp,
      licenseScope: text(input.licenseScope, 'licenseScope', 64),
      correctionOfId: input.correctionOfId ? uuid(input.correctionOfId, 'correctionOfId') : null,
      metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    };
    if (normalized.ask < normalized.bid) {
      throw new DomainError(400, 'INVALID_MARKET', 'ask must be greater than or equal to bid');
    }
    normalized.checksum = fingerprint({
      source: normalized.source, sourceRecordId: normalized.sourceRecordId, symbol: normalized.symbol,
      bid: normalized.bid, ask: normalized.ask, last: normalized.last, volume: normalized.volume,
      sourceTimestamp: normalized.sourceTimestamp.toISOString(), licenseScope: normalized.licenseScope,
      correctionOfId: normalized.correctionOfId, metadata: normalized.metadata,
    });
    return normalized;
  }

  async ingest(input, { transaction } = {}) {
    const normalized = this.normalize(input);
    const existing = await this.MarketSnapshot.findOne({
      where: { source: normalized.source, sourceRecordId: normalized.sourceRecordId }, transaction,
    });
    if (existing) {
      if (existing.checksum !== normalized.checksum) {
        throw new DomainError(409, 'SOURCE_RECORD_CONFLICT', 'An idempotency key was reused with different market data');
      }
      return { snapshot: existing, idempotentReplay: true };
    }
    if (normalized.correctionOfId) {
      const original = await this.MarketSnapshot.findByPk(normalized.correctionOfId, { transaction });
      if (!original || original.source !== normalized.source || original.symbol !== normalized.symbol) {
        throw new DomainError(400, 'INVALID_CORRECTION_REFERENCE', 'The corrected snapshot does not match this source and symbol');
      }
    }
    try {
      const snapshot = await this.MarketSnapshot.create({ ...normalized, receivedAt: new Date() }, { transaction });
      return { snapshot, idempotentReplay: false };
    } catch (error) {
      if (error.name !== 'SequelizeUniqueConstraintError' || transaction) throw error;
      const winner = await this.MarketSnapshot.findOne({ where: { source: normalized.source, sourceRecordId: normalized.sourceRecordId } });
      if (winner?.checksum === normalized.checksum) return { snapshot: winner, idempotentReplay: true };
      throw new DomainError(409, 'SOURCE_RECORD_CONFLICT', 'An idempotency key was reused with different market data');
    }
  }

  async reconcile({ source, sourceRecordIds, from, to }) {
    const approvedSource = text(source, 'source', 64);
    if (!list('LICENSED_MARKET_DATA_SOURCES').includes(approvedSource)) {
      throw new DomainError(403, 'UNLICENSED_MARKET_SOURCE', 'The market-data source is not approved for this deployment');
    }
    if (!Array.isArray(sourceRecordIds) || sourceRecordIds.length > 5000) {
      throw new DomainError(400, 'VALIDATION_ERROR', 'sourceRecordIds must be an array of at most 5000 identifiers');
    }
    const expected = new Set(sourceRecordIds.map(id => text(id, 'sourceRecordId', 160)));
    const where = { source: approvedSource };
    if (from || to) {
      where.sourceTimestamp = {};
      if (from) where.sourceTimestamp[Op.gte] = date(from, 'from');
      if (to) where.sourceTimestamp[Op.lte] = date(to, 'to');
    }
    const rows = await this.MarketSnapshot.findAll({ where, attributes: ['sourceRecordId'], raw: true });
    const actual = new Set(rows.map(row => row.sourceRecordId));
    return {
      source: approvedSource,
      expectedCount: expected.size,
      persistedCount: actual.size,
      missing: [...expected].filter(id => !actual.has(id)).sort(),
      unexpected: [...actual].filter(id => !expected.has(id)).sort(),
      reconciledAt: new Date().toISOString(),
    };
  }
}

module.exports = { MarketDataIngestionService };
