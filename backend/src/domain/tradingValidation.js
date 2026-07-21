const crypto = require('crypto');

class DomainError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'DomainError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const canonicalize = value => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value.toJSON === 'function') return canonicalize(value.toJSON());
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = canonicalize(value[key]);
      return result;
    }, {});
  }
  return value;
};
const fingerprint = value => sha256(JSON.stringify(canonicalize(value)));

const text = (value, label, maxLength) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > maxLength || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new DomainError(400, 'VALIDATION_ERROR', `${label} is required and must be at most ${maxLength} characters`);
  }
  return normalized;
};

const positiveNumber = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new DomainError(400, 'VALIDATION_ERROR', `${label} must be a positive number`);
  }
  return parsed;
};

const nonNegativeNumber = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new DomainError(400, 'VALIDATION_ERROR', `${label} must be zero or greater`);
  }
  return parsed;
};

const symbol = value => {
  const normalized = text(value, 'symbol', 16).toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,15}$/.test(normalized)) {
    throw new DomainError(400, 'VALIDATION_ERROR', 'symbol contains unsupported characters');
  }
  return normalized;
};

const date = (value, label) => {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) {
    throw new DomainError(400, 'VALIDATION_ERROR', `${label} must be an ISO-8601 timestamp`);
  }
  return parsed;
};

const uuid = (value, label = 'id') => {
  const normalized = text(value, label, 36).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw new DomainError(400, 'VALIDATION_ERROR', `${label} must be a UUID`);
  }
  return normalized;
};

const normalizeOrder = input => {
  const side = text(input.side, 'side', 4).toUpperCase();
  const orderType = text(input.orderType || 'MARKET', 'orderType', 12).toUpperCase();
  if (!['BUY', 'SELL'].includes(side)) throw new DomainError(400, 'VALIDATION_ERROR', 'side must be BUY or SELL');
  if (!['MARKET', 'LIMIT'].includes(orderType)) throw new DomainError(400, 'VALIDATION_ERROR', 'orderType must be MARKET or LIMIT');
  const normalized = {
    clientOrderId: text(input.clientOrderId, 'clientOrderId', 120),
    symbol: symbol(input.symbol),
    side,
    orderType,
    quantity: positiveNumber(input.quantity, 'quantity'),
    limitPrice: input.limitPrice === undefined || input.limitPrice === null || input.limitPrice === ''
      ? null : positiveNumber(input.limitPrice, 'limitPrice'),
  };
  if (orderType === 'LIMIT' && normalized.limitPrice === null) {
    throw new DomainError(400, 'VALIDATION_ERROR', 'limitPrice is required for LIMIT orders');
  }
  return normalized;
};

module.exports = {
  DomainError, sha256, fingerprint, canonicalize, text, positiveNumber, nonNegativeNumber, symbol, date, uuid, normalizeOrder,
};
