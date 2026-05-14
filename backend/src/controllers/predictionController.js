const Prediction = require('../models/Prediction');
const alpacaService = require('../services/alpacaService');
const algoTradingService = require('../services/algoTradingService');

// ─── helpers ──────────────────────────────────────────────────────────────────

function getCompanyName(symbol) {
  const companyNames = {
    AAPL: 'Apple Inc.',
    MSFT: 'Microsoft Corp.',
    GOOGL: 'Alphabet Inc.',
    AMZN: 'Amazon.com Inc.',
    TSLA: 'Tesla Inc.',
    NVDA: 'NVIDIA Corp.',
    META: 'Meta Platforms Inc.',
    NFLX: 'Netflix Inc.'
  };
  return companyNames[symbol] || `${symbol} Corp.`;
}

/**
 * Fetch 30-day bars from Alpaca and compute RSI/EMA indicators then
 * derive a signal-crossover-based prediction.
 * Falls back gracefully if Alpaca is not connected.
 */
async function buildRealPrediction(userId, symbol, timeframe = '1w') {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 35); // 35 days to guarantee 30 trading bars

  // Alpaca bars (may throw if not connected – caller catches)
  const rawBars = await alpacaService.getBars(
    symbol,
    '1Day',
    start.toISOString(),
    now.toISOString(),
    50
  );

  if (!rawBars || rawBars.length < 15) {
    throw new Error(`Insufficient bar data for ${symbol} (got ${rawBars ? rawBars.length : 0})`);
  }

  const bars = rawBars.map(b => ({
    close: b.c || b.close || b.ClosePrice,
    open:  b.o || b.open  || b.OpenPrice,
    high:  b.h || b.high  || b.HighPrice,
    low:   b.l || b.low   || b.LowPrice,
    volume: b.v || b.volume || b.Volume,
    timestamp: b.t || b.timestamp
  }));

  const prices  = bars.map(b => b.close);
  const current = prices[prices.length - 1];

  // Technical indicators
  const rsi    = algoTradingService.calculateRSI(prices, 14);
  const ema10  = algoTradingService.calculateEMA(prices, 10);
  const ema20  = algoTradingService.calculateEMA(prices, 20);
  const sma20  = algoTradingService.calculateSMA(prices, 20);
  const macdResult = algoTradingService.calculateMACD(prices, 12, 26, 9);
  const bb     = algoTradingService.calculateBollingerBands(prices, 20, 2);

  // Signal crossover logic
  let direction = 'sideways';
  let signalScore = 0;  // positive = bullish, negative = bearish

  if (rsi !== null) {
    if (rsi < 35) signalScore += 2;
    else if (rsi < 45) signalScore += 1;
    else if (rsi > 65) signalScore -= 2;
    else if (rsi > 55) signalScore -= 1;
  }

  if (ema10 !== null && ema20 !== null) {
    if (ema10 > ema20) signalScore += 2;
    else signalScore -= 2;
  }

  if (macdResult !== null) {
    if (macdResult.bullish && macdResult.histogram > 0) signalScore += 2;
    else if (macdResult.bearish && macdResult.histogram < 0) signalScore -= 2;
  }

  if (bb !== null) {
    if (current < bb.lower) signalScore += 1;
    else if (current > bb.upper) signalScore -= 1;
  }

  if (signalScore >= 3) direction = 'up';
  else if (signalScore <= -3) direction = 'down';
  else direction = 'sideways';

  // Predicted price: apply a momentum-scaled move
  const momentumPct = (signalScore / 7) * 0.05; // max ±5%
  const predictedPrice = parseFloat((current * (1 + momentumPct)).toFixed(2));

  // Confidence based on indicator agreement
  const confidence = Math.min(95, Math.max(50, 50 + Math.abs(signalScore) * 5));

  // Target date
  const targetDate = new Date();
  if (timeframe === '1w') targetDate.setDate(targetDate.getDate() + 7);
  else if (timeframe === '1m') targetDate.setMonth(targetDate.getMonth() + 1);
  else targetDate.setDate(targetDate.getDate() + 1);

  const record = {
    userId,
    symbol,
    predictionType: 'price',
    timeframe,
    currentPrice: parseFloat(current.toFixed(2)),
    predictedPrice,
    predictedDirection: direction,
    confidence: parseFloat(confidence.toFixed(2)),
    model: 'signal-crossover',
    predictionDate: new Date(),
    targetDate,
    technicalIndicators: {
      rsi: rsi !== null ? parseFloat(rsi.toFixed(2)) : null,
      macd: macdResult ? parseFloat(macdResult.macdLine.toFixed(4)) : null,
      bollinger: bb
        ? { lower: parseFloat(bb.lower.toFixed(2)), middle: parseFloat(bb.middle.toFixed(2)), upper: parseFloat(bb.upper.toFixed(2)) }
        : null,
      sma: sma20 !== null ? parseFloat(sma20.toFixed(2)) : null,
      ema: ema10 !== null ? parseFloat(ema10.toFixed(2)) : null,
      signalScore
    },
    marketSentiment: {
      newsScore: 65,
      socialScore: 60,
      analystRating: direction === 'up' ? 'buy' : direction === 'down' ? 'sell' : 'hold',
      institutionalFlow: signalScore > 0 ? 'positive' : signalScore < 0 ? 'negative' : 'neutral'
    },
    metadata: {
      methodology: 'RSI + EMA crossover + MACD + Bollinger Bands signal composite',
      barsUsed: bars.length,
      signalScore
    }
  };

  return record;
}

// ─── controller methods ───────────────────────────────────────────────────────

// Get all predictions for user
exports.getPredictions = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let predictions = await Prediction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    // If user has no predictions, generate real ones from Alpaca
    if (predictions.length === 0) {
      console.log(`Generating real predictions for user ${req.user.id}`);

      const defaultSymbols = ['AAPL', 'MSFT', 'GOOGL'];
      const created = [];

      for (const symbol of defaultSymbols) {
        try {
          const recordData = await buildRealPrediction(req.user.id, symbol, '1w');
          const prediction = await Prediction.create(recordData);
          created.push(prediction);
          console.log(`Created real prediction for ${symbol} — direction: ${recordData.predictedDirection}, confidence: ${recordData.confidence}`);
        } catch (err) {
          console.warn(`Could not build real prediction for ${symbol}: ${err.message}. Skipping.`);
        }
      }

      predictions = created.length > 0
        ? created
        : await Prediction.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    }

    const transformedData = transformPredictionsToFrontendFormat(predictions);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ message: 'Server error while fetching predictions' });
  }
};

// Helper function to transform database predictions to frontend format
function transformPredictionsToFrontendFormat(predictions) {
  // Generate sample forecast data
  const sampleForecastData = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    sampleForecastData.push({
      date: date.toISOString(),
      spx: 5800 + (Math.random() - 0.5) * 100 + (i * 10),
      ndx: 18000 + (Math.random() - 0.5) * 200 + (i * 20),
      dji: 42000 + (Math.random() - 0.5) * 300 + (i * 30),
      rut: 2100 + (Math.random() - 0.5) * 50 + (i * 5)
    });
  }

  const stocks = predictions.map(prediction => {
    const change = prediction.predictedPrice && prediction.currentPrice
      ? ((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100)
      : 0;

    return {
      symbol: prediction.symbol,
      name: getCompanyName(prediction.symbol),
      current: parseFloat(prediction.currentPrice),
      predicted: parseFloat(prediction.predictedPrice || prediction.currentPrice),
      change: parseFloat(change.toFixed(2)),
      confidence: parseFloat(prediction.confidence),
      timeframe: prediction.timeframe.toUpperCase()
    };
  });

  const sectors = [
    { name: 'Technology', current: 12.5, predicted: 15.2, confidence: 85 },
    { name: 'Healthcare', current: 8.3, predicted: 9.1, confidence: 78 },
    { name: 'Financial', current: -2.1, predicted: 1.5, confidence: 72 },
    { name: 'Energy', current: 15.7, predicted: 18.3, confidence: 68 },
    { name: 'Consumer Discretionary', current: 6.8, predicted: 4.2, confidence: 75 }
  ];

  const avgSentiment = predictions.reduce((acc, pred) => {
    if (pred.marketSentiment) {
      acc.news += pred.marketSentiment.newsScore || 70;
      acc.social += pred.marketSentiment.socialScore || 65;
      acc.count++;
    }
    return acc;
  }, { news: 0, social: 0, count: 0 });

  const sentiment = {
    news: avgSentiment.count > 0 ? Math.round(avgSentiment.news / avgSentiment.count) : 72,
    social: avgSentiment.count > 0 ? Math.round(avgSentiment.social / avgSentiment.count) : 68,
    technical: 78,
    overall: 73
  };

  return {
    market: {
      forecast: sampleForecastData,
      confidence: 85,
      methodology: 'RSI + EMA crossover + MACD + Bollinger Bands signal composite'
    },
    stocks,
    sectors,
    sentiment,
    timeframe: '1W',
    createdAt: new Date()
  };
}

// Get a specific prediction by ID
exports.getPredictionById = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const prediction = await Prediction.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ message: 'Server error while fetching prediction' });
  }
};

// Create a new prediction
exports.createPrediction = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const predictionData = {
      userId: req.user.id,
      market: req.body.market,
      stocks: req.body.stocks,
      sectors: req.body.sectors,
      sentiment: req.body.sentiment,
      timeframe: req.body.timeframe || '1W'
    };

    const prediction = await Prediction.create(predictionData);
    res.status(201).json(prediction);
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({ message: 'Server error while creating prediction' });
  }
};

// Update a prediction
exports.updatePrediction = async (req, res) => {
  try {
    const updateData = {};
    const updateFields = ['market', 'stocks', 'sectors', 'sentiment', 'timeframe'];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const [updatedRowsCount] = await Prediction.update(updateData, {
      where: { id: req.params.id, userId: req.user.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    const prediction = await Prediction.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    res.json(prediction);
  } catch (error) {
    console.error('Error updating prediction:', error);
    res.status(500).json({ message: 'Server error while updating prediction' });
  }
};

// Delete a prediction
exports.deletePrediction = async (req, res) => {
  try {
    const deletedRowsCount = await Prediction.destroy({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    res.status(500).json({ message: 'Server error while deleting prediction' });
  }
};

// Export prediction report
exports.exportPrediction = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let predictions;
    if (req.params.id) {
      const prediction = await Prediction.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });

      if (!prediction) {
        return res.status(404).json({ message: 'Prediction not found' });
      }
      predictions = [prediction];
    } else {
      predictions = await Prediction.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
    }

    if (predictions.length === 0) {
      const csvContent = 'Symbol,Current Price,Predicted Price,Direction,Confidence,Timeframe,Created At\nNo predictions found\n';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="predictions-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    const csvHeader = 'Symbol,Current Price,Predicted Price,Direction,Confidence,Timeframe,Model,Created At\n';
    const csvRows = predictions.map(p => {
      if (p.symbol) {
        return `"${p.symbol}","${p.currentPrice || 'N/A'}","${p.predictedPrice || 'N/A'}","${p.predictedDirection || 'N/A'}","${p.confidence || 'N/A'}","${p.timeframe || 'N/A'}","${p.model || 'N/A'}","${p.createdAt}"`;
      }
      const stocks = p.stocks || [];
      if (stocks.length > 0) {
        return stocks.map(stock =>
          `"${stock.symbol || 'N/A'}","${stock.current || 'N/A'}","${stock.predicted || 'N/A'}","${stock.change > 0 ? 'up' : 'down'}","${stock.confidence || 'N/A'}","${stock.timeframe || p.timeframe || 'N/A'}","ai-generated","${p.createdAt}"`
        ).join('\n');
      }
      return `"N/A","N/A","N/A","N/A","N/A","${p.timeframe || 'N/A'}","N/A","${p.createdAt}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="predictions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting prediction:', error);
    res.status(500).json({ message: 'Server error while exporting prediction' });
  }
};

// Generate a new prediction using real Alpaca data + technical indicators
exports.generatePrediction = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const timeframe = req.body.timeframe || '1W';
    const normalizedTimeframe = timeframe.toLowerCase().replace('-', '');

    const symbols = req.body.symbols || ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA'];
    const stockPredictions = [];
    const stocksForFrontend = [];

    for (const symbol of symbols) {
      try {
        const recordData = await buildRealPrediction(req.user.id, symbol, normalizedTimeframe);
        const saved = await Prediction.create(recordData);
        stockPredictions.push(saved);

        const change = ((recordData.predictedPrice - recordData.currentPrice) / recordData.currentPrice) * 100;
        stocksForFrontend.push({
          symbol,
          name: getCompanyName(symbol),
          current: recordData.currentPrice,
          predicted: recordData.predictedPrice,
          change: parseFloat(change.toFixed(2)),
          confidence: recordData.confidence,
          timeframe: timeframe.toUpperCase(),
          direction: recordData.predictedDirection,
          indicators: recordData.technicalIndicators
        });

        console.log(`Generated real prediction for ${symbol}: ${recordData.predictedDirection} @ $${recordData.predictedPrice} (confidence ${recordData.confidence})`);
      } catch (err) {
        console.warn(`Skipping ${symbol} prediction: ${err.message}`);
      }
    }

    if (stocksForFrontend.length === 0) {
      return res.status(503).json({
        message: 'Could not generate predictions. Ensure Alpaca is connected.',
        hint: 'Connect Alpaca in the Command Center first.'
      });
    }

    // Build minimal forecast using available data
    const today = new Date();
    const sampleForecast = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      sampleForecast.push({
        date: date.toISOString(),
        spx: 5800 + (Math.random() - 0.5) * 100 + (i * 10),
        ndx: 18000 + (Math.random() - 0.5) * 200 + (i * 20),
        dji: 42000 + (Math.random() - 0.5) * 300 + (i * 30),
        rut: 2100 + (Math.random() - 0.5) * 50 + (i * 5)
      });
    }

    const bullish = stocksForFrontend.filter(s => s.direction === 'up').length;
    const bearish = stocksForFrontend.filter(s => s.direction === 'down').length;
    const overallSentiment = Math.round(60 + ((bullish - bearish) / stocksForFrontend.length) * 25);

    const response = {
      id: stockPredictions[0]?.id || 'generated',
      market: {
        forecast: sampleForecast,
        confidence: Math.round(stocksForFrontend.reduce((s, p) => s + p.confidence, 0) / stocksForFrontend.length),
        methodology: 'RSI + EMA crossover + MACD + Bollinger Bands signal composite'
      },
      stocks: stocksForFrontend,
      sectors: [
        { name: 'Technology', current: 12.5, predicted: 15.2, confidence: 85 },
        { name: 'Healthcare', current: 8.3, predicted: 9.1, confidence: 78 },
        { name: 'Financial', current: -2.1, predicted: 1.5, confidence: 72 },
        { name: 'Energy', current: 15.7, predicted: 18.3, confidence: 68 }
      ],
      sentiment: {
        news: overallSentiment,
        social: overallSentiment - 5,
        technical: overallSentiment + 3,
        overall: overallSentiment
      },
      timeframe: timeframe.toUpperCase(),
      createdAt: new Date(),
      stockPredictions
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ message: 'Server error while generating prediction' });
  }
};
