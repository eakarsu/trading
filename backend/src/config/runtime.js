const required = (name, { minLength = 1 } = {}) => {
  const value = process.env[name];
  if (!value || value.trim().length < minLength) {
    throw new Error(`${name} is required${minLength > 1 ? ` and must be at least ${minLength} characters` : ''}`);
  }
  return value.trim();
};

const boolean = (name, defaultValue = false) => {
  const value = process.env[name];
  if (value === undefined || value === '') return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} must be true or false`);
};

const number = (name, defaultValue, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) => {
  const value = process.env[name] === undefined || process.env[name] === ''
    ? defaultValue : Number(process.env[name]);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}`);
  }
  return value;
};

const list = (name, fallback = '') => (process.env[name] || fallback)
  .split(',').map(value => value.trim()).filter(Boolean);

const validateRuntime = () => {
  const production = process.env.NODE_ENV === 'production';
  required('JWT_SECRET', { minLength: 32 });
  if (boolean('ENABLE_LIVE_TRADING', false)) {
    throw new Error('ENABLE_LIVE_TRADING is not supported: this release has a hard paper-custody boundary');
  }
  if (boolean('ENABLE_LEGACY_FEATURES', false) || boolean('ENABLE_EXPERIMENTAL_AI', false)) {
    throw new Error('Legacy and experimental product routes are not supported by the paper-only release');
  }
  if (production) {
    if (!process.env.DATABASE_URL) {
      required('DB_HOST');
      required('DB_NAME');
      required('DB_USER');
      required('DB_PASSWORD');
    }
    const origins = list('CORS_ORIGINS');
    if (origins.length === 0 || origins.includes('*')) {
      throw new Error('CORS_ORIGINS must contain explicit origins in production');
    }
  }
};

const paperRiskDefaults = () => ({
  cashBalance: number('PAPER_STARTING_CASH', 100000, { min: 1000 }),
  maxOrderNotional: number('PAPER_MAX_ORDER_NOTIONAL', 25000, { min: 1 }),
  maxSymbolExposure: number('PAPER_MAX_SYMBOL_EXPOSURE', 50000, { min: 1 }),
  maxGrossExposure: number('PAPER_MAX_GROSS_EXPOSURE', 100000, { min: 1 }),
  maxDailyLoss: number('PAPER_MAX_DAILY_LOSS', 5000, { min: 1 }),
  maxParticipationPercent: number('PAPER_MAX_PARTICIPATION_PERCENT', 5, { min: 0.01, max: 100 }),
  maxMarketDataAgeSeconds: number('PAPER_MAX_MARKET_DATA_AGE_SECONDS', 30, { min: 1 }),
});

module.exports = { required, boolean, number, list, validateRuntime, paperRiskDefaults };
