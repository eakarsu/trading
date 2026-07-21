const { fingerprint } = require('../domain/tradingValidation');

class TradingAuditService {
  constructor({ TradingAuditEvent }) {
    this.TradingAuditEvent = TradingAuditEvent;
  }

  async append({ userId, actorId, eventType, entityType, entityId, payload = {} }, transaction) {
    if (transaction && this.TradingAuditEvent.sequelize.getDialect() === 'postgres') {
      await this.TradingAuditEvent.sequelize.query(
        'SELECT pg_advisory_xact_lock(hashtext(:userId))',
        { replacements: { userId: String(userId) }, transaction },
      );
    }
    const previous = await this.TradingAuditEvent.findOne({
      where: { userId }, order: [['occurredAt', 'DESC'], ['id', 'DESC']], transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });
    const occurredAt = new Date();
    const previousHash = previous ? previous.eventHash : null;
    const eventHash = fingerprint({
      userId, actorId: actorId || null, eventType, entityType, entityId: entityId || null,
      payload, previousHash, occurredAt: occurredAt.toISOString(),
    });
    return this.TradingAuditEvent.create({
      userId, actorId: actorId || null, eventType, entityType, entityId: entityId || null,
      payload, previousHash, eventHash, occurredAt,
    }, { transaction });
  }

  async verify(userId) {
    const events = await this.TradingAuditEvent.findAll({ where: { userId }, order: [['occurredAt', 'ASC'], ['id', 'ASC']], raw: true });
    let previousHash = null;
    for (const event of events) {
      const expected = fingerprint({
        userId: event.userId, actorId: event.actorId || null, eventType: event.eventType,
        entityType: event.entityType, entityId: event.entityId || null, payload: event.payload,
        previousHash, occurredAt: new Date(event.occurredAt).toISOString(),
      });
      if (event.previousHash !== previousHash || event.eventHash !== expected) {
        return { valid: false, eventId: event.id, count: events.length };
      }
      previousHash = event.eventHash;
    }
    return { valid: true, eventId: null, count: events.length, headHash: previousHash };
  }
}

module.exports = { TradingAuditService };
