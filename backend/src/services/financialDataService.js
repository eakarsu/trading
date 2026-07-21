const MarketData = require('../models/MarketData');

const serialize = row => ({
  symbol: row.symbol,
  price: Number(row.price), volume: Number(row.volume), high: Number(row.high), low: Number(row.low),
  open: Number(row.open), close: Number(row.close), change: Number(row.change || 0),
  changePercent: Number(row.changePercent || 0), marketCap: Number(row.marketCap || 0),
  timestamp: row.timestamp, source: row.source,
});

const getRealTimeMarketData = async () => {
  const rows = await MarketData.findAll({ order: [['timestamp', 'DESC']], limit: 20 });
  return rows.map(serialize);
};

const getHistoricalData = async (symbol, timeframe = '1D') => {
  const allowedTimeframes = new Set(['1D', '1W', '1M']);
  if (!allowedTimeframes.has(timeframe)) throw Object.assign(new Error('Unsupported timeframe'), { status: 400 });
  const rows = await MarketData.findAll({ where: { symbol: symbol.toUpperCase() }, order: [['timestamp', 'ASC']], limit: 1000 });
  return rows.map(row => ({ ...serialize(row), sourceTimestamp: row.timestamp }));
};

const getMarketSentiment = async () => {
  throw Object.assign(new Error('Sentiment is unavailable until a licensed, attributable source is configured'), { status: 501 });
};

module.exports = { getRealTimeMarketData, getHistoricalData, getMarketSentiment };
