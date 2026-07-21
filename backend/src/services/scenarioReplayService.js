const { paperRiskDefaults } = require('../config/runtime');
const {
  DomainError, date, fingerprint, nonNegativeNumber, normalizeOrder, positiveNumber, symbol, text,
} = require('../domain/tradingValidation');
const { RiskEngine } = require('./riskEngine');

const number = value => Number(value || 0);
const rounded = (value, places = 8) => Math.round((value + Number.EPSILON) * (10 ** places)) / (10 ** places);

class ScenarioReplayService {
  constructor(riskEngine = new RiskEngine()) {
    this.riskEngine = riskEngine;
  }

  run(input) {
    if (!Array.isArray(input.events) || input.events.length === 0 || input.events.length > 5000) {
      throw new DomainError(400, 'VALIDATION_ERROR', 'events must contain 1–5000 replay events');
    }
    const defaults = paperRiskDefaults();
    const account = {
      ...defaults,
      cashBalance: input.startingCash == null ? defaults.cashBalance : positiveNumber(input.startingCash, 'startingCash'),
      dailyRealizedPnl: 0, killSwitchActive: false,
    };
    const state = { account, snapshots: new Map(), positions: new Map(), orders: new Map(), results: [] };
    let previousAt = null;

    input.events.forEach((event, index) => {
      const at = date(event.at, `events[${index}].at`);
      if (previousAt && at < previousAt) throw new DomainError(400, 'EVENT_TIME_ORDER', 'Replay events must be chronological');
      previousAt = at;
      const type = text(event.type, `events[${index}].type`, 20).toUpperCase();
      if (type === 'SNAPSHOT') this.snapshot(state, event, at);
      else if (type === 'ORDER') this.order(state, event, at);
      else if (type === 'EXECUTE') this.executeExisting(state, event, at);
      else if (type === 'KILL_SWITCH') this.killSwitch(state, event, at);
      else throw new DomainError(400, 'VALIDATION_ERROR', `Unsupported replay event ${type}`);
    });

    const report = {
      scenarioVersion: 1,
      custodyBoundary: 'PAPER_SIMULATION_ONLY',
      eventResults: state.results,
      account,
      positions: [...state.positions.values()].sort((a, b) => a.symbol.localeCompare(b.symbol)),
      orders: [...state.orders.values()],
    };
    return { ...report, checksum: fingerprint(report) };
  }

  snapshot(state, event, at) {
    const quote = {
      symbol: symbol(event.symbol), bid: positiveNumber(event.bid, 'bid'), ask: positiveNumber(event.ask, 'ask'),
      last: positiveNumber(event.last, 'last'), volume: nonNegativeNumber(event.volume, 'volume'),
      sourceTimestamp: date(event.sourceTimestamp, 'sourceTimestamp'),
      consumed: 0,
    };
    if (quote.ask < quote.bid) throw new DomainError(400, 'INVALID_MARKET', 'ask must be greater than or equal to bid');
    if (quote.sourceTimestamp > new Date(at.getTime() + 300000)) throw new DomainError(400, 'SOURCE_TIME_IN_FUTURE', 'sourceTimestamp is too far after replay time');
    state.snapshots.set(quote.symbol, quote);
    state.results.push({ type: 'SNAPSHOT', at: at.toISOString(), symbol: quote.symbol, sourceTimestamp: quote.sourceTimestamp.toISOString() });
  }

  markedPositions(state) {
    return [...state.positions.values()].map(position => ({
      ...position,
      marketValue: rounded(position.quantity * number(state.snapshots.get(position.symbol)?.last || position.averageCost), 4),
      sourceTimestamp: state.snapshots.get(position.symbol)?.sourceTimestamp || null,
    }));
  }

  order(state, event, at) {
    const normalized = normalizeOrder(event);
    const requestFingerprint = fingerprint(normalized);
    const prior = state.orders.get(normalized.clientOrderId);
    if (prior) {
      state.results.push(prior.requestFingerprint === requestFingerprint
        ? { type: 'ORDER', at: at.toISOString(), clientOrderId: normalized.clientOrderId, status: 'IDEMPOTENT_REPLAY', orderStatus: prior.status }
        : { type: 'ORDER', at: at.toISOString(), clientOrderId: normalized.clientOrderId, status: 'REJECTED', code: 'CLIENT_ORDER_ID_CONFLICT' });
      return;
    }
    const replayOrder = { ...normalized, requestFingerprint, filledQuantity: 0, averageFillPrice: null, status: 'PENDING' };
    state.orders.set(normalized.clientOrderId, replayOrder);
    this.evaluateAndFill(state, replayOrder, at, 'ORDER');
  }

  executeExisting(state, event, at) {
    const clientOrderId = text(event.clientOrderId, 'clientOrderId', 120);
    const order = state.orders.get(clientOrderId);
    if (!order) {
      state.results.push({ type: 'EXECUTE', at: at.toISOString(), clientOrderId, status: 'REJECTED', code: 'ORDER_NOT_FOUND' });
      return;
    }
    if (!['OPEN', 'PARTIALLY_FILLED'].includes(order.status)) {
      state.results.push({ type: 'EXECUTE', at: at.toISOString(), clientOrderId, status: 'REJECTED', code: 'ORDER_NOT_EXECUTABLE' });
      return;
    }
    this.evaluateAndFill(state, order, at, 'EXECUTE');
  }

  evaluateAndFill(state, order, at, resultType) {
    const snapshot = state.snapshots.get(order.symbol);
    const remaining = rounded(order.quantity - order.filledQuantity);
    let decision;
    try {
      decision = this.riskEngine.evaluate({
        account: state.account, order: { ...order, quantity: remaining }, snapshot,
        positions: this.markedPositions(state), now: at,
      });
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      order.status = 'REJECTED';
      order.rejectionCode = error.code;
      state.results.push({ type: resultType, at: at.toISOString(), clientOrderId: order.clientOrderId, status: 'REJECTED', code: error.code });
      return;
    }
    order.riskDecision = decision;
    if (!decision.approved) {
      order.status = order.filledQuantity > 0 ? 'PARTIALLY_FILLED' : 'REJECTED';
      order.rejectionCode = decision.reasons[0];
      state.results.push({ type: resultType, at: at.toISOString(), clientOrderId: order.clientOrderId, status: 'REJECTED', code: decision.reasons[0] });
      return;
    }
    const marketable = order.orderType === 'MARKET' || (order.side === 'BUY' ? order.limitPrice >= snapshot.ask : order.limitPrice <= snapshot.bid);
    if (!marketable) {
      order.status = 'OPEN';
      state.results.push({ type: resultType, at: at.toISOString(), clientOrderId: order.clientOrderId, status: 'OPEN' });
      return;
    }
    const availableLiquidity = rounded(Math.max(0, decision.metrics.maxExecutableQuantity - snapshot.consumed));
    if (availableLiquidity <= 0) {
      order.status = order.filledQuantity > 0 ? 'PARTIALLY_FILLED' : 'OPEN';
      state.results.push({ type: resultType, at: at.toISOString(), clientOrderId: order.clientOrderId, status: order.status, code: 'WAITING_FOR_LIQUIDITY' });
      return;
    }
    const fillQuantity = rounded(Math.min(remaining, availableLiquidity));
    snapshot.consumed = rounded(snapshot.consumed + fillQuantity);
    const quote = order.side === 'BUY' ? snapshot.ask : snapshot.bid;
    const slipped = order.side === 'BUY' ? quote * 1.0001 : quote * 0.9999;
    const price = rounded(order.orderType === 'LIMIT'
      ? order.side === 'BUY' ? Math.min(slipped, order.limitPrice) : Math.max(slipped, order.limitPrice)
      : slipped, 4);
    const notional = rounded(fillQuantity * price, 4);
    let position = state.positions.get(order.symbol) || { symbol: order.symbol, quantity: 0, averageCost: 0, realizedPnl: 0 };
    if (order.side === 'BUY') {
      position.averageCost = rounded(((position.quantity * position.averageCost) + notional) / (position.quantity + fillQuantity));
      position.quantity = rounded(position.quantity + fillQuantity);
      state.account.cashBalance = rounded(state.account.cashBalance - notional, 4);
    } else {
      const pnl = rounded((price - position.averageCost) * fillQuantity, 4);
      position.quantity = rounded(position.quantity - fillQuantity);
      position.realizedPnl = rounded(position.realizedPnl + pnl, 4);
      state.account.cashBalance = rounded(state.account.cashBalance + notional, 4);
      state.account.dailyRealizedPnl = rounded(state.account.dailyRealizedPnl + pnl, 4);
    }
    state.positions.set(order.symbol, position);
    const previousFilled = order.filledQuantity;
    order.averageFillPrice = rounded(((previousFilled * number(order.averageFillPrice)) + notional) / (previousFilled + fillQuantity), 4);
    order.filledQuantity = rounded(previousFilled + fillQuantity);
    order.status = order.filledQuantity >= order.quantity ? 'FILLED' : 'PARTIALLY_FILLED';
    state.results.push({ type: resultType, at: at.toISOString(), clientOrderId: order.clientOrderId, status: order.status, fillQuantity, price });
  }

  killSwitch(state, event, at) {
    state.account.killSwitchActive = event.active !== false;
    let cancelled = 0;
    if (state.account.killSwitchActive) {
      state.orders.forEach(order => {
        if (['OPEN', 'PARTIALLY_FILLED'].includes(order.status)) { order.status = 'CANCELLED'; cancelled += 1; }
      });
    }
    state.results.push({ type: 'KILL_SWITCH', at: at.toISOString(), active: state.account.killSwitchActive, cancelled });
  }
}

module.exports = { ScenarioReplayService };
