const MarketData = require('../models/MarketData');
const Prediction = require('../models/Prediction');
const { getHistoricalData, getMarketSentiment, getRealTimeMarketData } = require('../services/financialDataService');

const category = item => {
  if (['SPY', 'QQQ', 'DIA', 'IWM', 'VTI'].includes(item.symbol)) return 'indices';
  if (['GLD', 'SLV', 'OIL', 'GAS', 'GOLD'].includes(item.symbol)) return 'commodities';
  if (['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD'].includes(item.symbol)) return 'currencies';
  return 'stocks';
};

exports.getRealTimeData = async (req, res) => {
  try {
    const rows = await getRealTimeMarketData();
    const data = { indices: [], stocks: [], commodities: [], currencies: [] };
    rows.forEach(item => data[category(item)].push({ ...item, sourceTimestamp: item.timestamp }));
    return res.json({ message: 'Persisted market data', data, recordCount: rows.length, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(error.status || 500).json({ code: 'MARKET_DATA_ERROR', message: error.message });
  }
};

exports.getHistoricalData = async (req, res) => {
  try {
    const symbol = String(req.query.symbol || '').trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,15}$/.test(symbol)) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'A valid symbol is required' });
    const timeframe = req.query.timeframe || '1D';
    const data = await getHistoricalData(symbol, timeframe);
    return res.json({ message: 'Persisted historical market data', data, timeframe, symbol, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(error.status || 500).json({ code: 'MARKET_DATA_ERROR', message: error.message });
  }
};

exports.getSentiment = async (req, res) => {
  try {
    return res.json({ sentiment: await getMarketSentiment() });
  } catch (error) {
    return res.status(error.status || 500).json({ code: 'SOURCE_NOT_CONFIGURED', message: error.message });
  }
};

exports.getPredictions = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '1D';
    const prediction = await Prediction.findOne({ where: { timeframe }, order: [['createdAt', 'DESC']] });
    if (!prediction) return res.status(404).json({ code: 'NOT_FOUND', message: 'No persisted prediction found' });
    return res.json({ data: prediction, sourceTimestamp: prediction.createdAt });
  } catch (error) {
    return res.status(500).json({ code: 'PREDICTION_READ_ERROR', message: 'Unable to read predictions' });
  }
};

exports.getUserMarketData = async (req, res) => res.json(await MarketData.findAll({ order: [['timestamp', 'DESC']], limit: 100 }));

exports.getMarketDataById = async (req, res) => {
  const row = await MarketData.findByPk(req.params.id);
  return row ? res.json(row) : res.status(404).json({ code: 'NOT_FOUND', message: 'Market data not found' });
};
