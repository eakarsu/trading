const algoTradingService = require('../services/algoTradingService');
const alpacaService = require('../services/alpacaService');
const strategyOptimizerService = require('../services/strategyOptimizerService');

// ==================== STRATEGY TEMPLATES ====================

/**
 * Get all strategy templates
 * GET /api/algo/templates
 */
const getStrategyTemplates = async (req, res) => {
  try {
    const templates = algoTradingService.getStrategyTemplates();
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get strategy templates',
    });
  }
};

// ==================== SIGNALS ====================

/**
 * Generate trading signals for a symbol
 * POST /api/algo/signals
 */
const generateSignals = async (req, res) => {
  try {
    const { symbol, strategy, timeframe = '1Day', lookback = 100 } = req.body;

    if (!symbol || !strategy) {
      return res.status(400).json({
        success: false,
        message: 'Symbol and strategy are required',
      });
    }

    // Check if Alpaca is initialized
    if (!alpacaService.isInitialized) {
      return res.status(400).json({
        success: false,
        message: 'Please connect to Alpaca first in the Command Center',
      });
    }

    // Get historical bars
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookback);

    const bars = await alpacaService.getBars(
      symbol,
      timeframe,
      startDate.toISOString(),
      endDate.toISOString(),
      lookback
    );

    if (!bars || bars.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient data for signal generation',
      });
    }

    // Map bar properties to standard format
    const mappedBars = bars.map(b => ({
      close: b.c || b.close,
      open: b.o || b.open,
      high: b.h || b.high,
      low: b.l || b.low,
      volume: b.v || b.volume,
      timestamp: b.t || b.timestamp,
    }));

    // Generate signals
    const signals = await algoTradingService.generateSignals(symbol, strategy, mappedBars);

    res.json({
      success: true,
      data: {
        symbol,
        strategy: strategy.type,
        signals,
        barsAnalyzed: bars.length,
        timeframe,
      },
    });
  } catch (error) {
    console.error('Error generating signals:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate signals',
    });
  }
};

// ==================== BACKTESTING ====================

/**
 * Run backtest for a strategy
 * POST /api/algo/backtest
 */
const runBacktest = async (req, res) => {
  try {
    const {
      symbol,
      strategy,
      startDate,
      endDate,
      initialCapital = 10000,
      positionSize = 0.1,
      timeframe = '1Day',
    } = req.body;

    console.log('Backtest request received:', { symbol, strategy, startDate, endDate, initialCapital, positionSize });

    if (!symbol || !strategy || !startDate || !endDate) {
      const missing = [];
      if (!symbol) missing.push('symbol');
      if (!strategy) missing.push('strategy');
      if (!startDate) missing.push('startDate');
      if (!endDate) missing.push('endDate');
      console.log('Missing required fields:', missing);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    // Check if Alpaca is initialized
    if (!alpacaService.isInitialized) {
      console.log('Alpaca not initialized - user needs to connect first');
      return res.status(400).json({
        success: false,
        message: 'Please connect to Alpaca first in the Command Center',
      });
    }

    const config = {
      symbol,
      strategy,
      startDate,
      endDate,
      initialCapital,
      positionSize,
      timeframe,
    };

    const results = await algoTradingService.runBacktest(config);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run backtest',
    });
  }
};

// ==================== AUTO TRADING ====================

/**
 * Start auto trading for a strategy
 * POST /api/algo/auto-trade/start
 */
const startAutoTrading = async (req, res) => {
  try {
    const {
      strategyId,
      symbol,
      strategy,
      positionSize = 0.1,
      maxPositions = 3,
      stopLoss = 0.02,
      takeProfit = 0.05,
      checkInterval = 60000,
    } = req.body;

    if (!strategyId || !symbol || !strategy) {
      return res.status(400).json({
        success: false,
        message: 'strategyId, symbol, and strategy are required',
      });
    }

    // Check if Alpaca is initialized
    if (!alpacaService.isInitialized) {
      return res.status(400).json({
        success: false,
        message: 'Please connect to Alpaca first in the Command Center',
      });
    }

    const config = {
      symbol,
      strategy,
      positionSize,
      maxPositions,
      stopLoss,
      takeProfit,
      checkInterval,
    };

    await algoTradingService.startAutoTrading(strategyId, config);

    res.json({
      success: true,
      message: `Auto trading started for strategy: ${strategyId}`,
      data: {
        strategyId,
        symbol,
        strategy: strategy.type,
        status: 'running',
      },
    });
  } catch (error) {
    console.error('Error starting auto trading:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start auto trading',
    });
  }
};

/**
 * Stop auto trading for a strategy
 * POST /api/algo/auto-trade/stop
 */
const stopAutoTrading = async (req, res) => {
  try {
    const { strategyId } = req.body;

    if (!strategyId) {
      return res.status(400).json({
        success: false,
        message: 'strategyId is required',
      });
    }

    algoTradingService.stopAutoTrading(strategyId);

    res.json({
      success: true,
      message: `Auto trading stopped for strategy: ${strategyId}`,
    });
  } catch (error) {
    console.error('Error stopping auto trading:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop auto trading',
    });
  }
};

/**
 * Get status of a specific strategy
 * GET /api/algo/auto-trade/status/:strategyId
 */
const getStrategyStatus = async (req, res) => {
  try {
    const { strategyId } = req.params;
    const status = algoTradingService.getStrategyStatus(strategyId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Strategy not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting strategy status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get strategy status',
    });
  }
};

/**
 * Get all active strategies
 * GET /api/algo/auto-trade/active
 */
const getActiveStrategies = async (req, res) => {
  try {
    const strategies = algoTradingService.getAllActiveStrategies();

    res.json({
      success: true,
      data: strategies,
      count: strategies.length,
    });
  } catch (error) {
    console.error('Error getting active strategies:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get active strategies',
    });
  }
};

// ==================== TECHNICAL INDICATORS ====================

/**
 * Calculate technical indicators for a symbol
 * POST /api/algo/indicators
 */
const calculateIndicators = async (req, res) => {
  try {
    const {
      symbol,
      indicators = ['sma', 'ema', 'rsi', 'macd', 'bollinger'],
      timeframe = '1Day',
      lookback = 100,
    } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required',
      });
    }

    // Check if Alpaca is initialized
    if (!alpacaService.isInitialized) {
      return res.status(400).json({
        success: false,
        message: 'Please connect to Alpaca first in the Command Center',
      });
    }

    // Get historical bars
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookback);

    const bars = await alpacaService.getBars(
      symbol,
      timeframe,
      startDate.toISOString(),
      endDate.toISOString(),
      lookback
    );

    if (!bars || bars.length < 26) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient data for indicator calculation',
      });
    }

    // Map bar properties to standard format
    const mappedBars = bars.map(b => ({
      close: b.c || b.close,
      open: b.o || b.open,
      high: b.h || b.high,
      low: b.l || b.low,
      volume: b.v || b.volume,
      timestamp: b.t || b.timestamp,
    }));

    const prices = mappedBars.map(b => b.close);
    const result = {};

    if (indicators.includes('sma')) {
      result.sma = {
        sma20: algoTradingService.calculateSMA(prices, 20),
        sma50: algoTradingService.calculateSMA(prices, 50),
      };
    }

    if (indicators.includes('ema')) {
      result.ema = {
        ema12: algoTradingService.calculateEMA(prices, 12),
        ema26: algoTradingService.calculateEMA(prices, 26),
      };
    }

    if (indicators.includes('rsi')) {
      result.rsi = algoTradingService.calculateRSI(prices);
    }

    if (indicators.includes('macd')) {
      result.macd = algoTradingService.calculateMACD(prices);
    }

    if (indicators.includes('bollinger')) {
      result.bollinger = algoTradingService.calculateBollingerBands(prices);
    }

    if (indicators.includes('atr')) {
      result.atr = algoTradingService.calculateATR(mappedBars);
    }

    res.json({
      success: true,
      data: {
        symbol,
        timeframe,
        currentPrice: prices[prices.length - 1],
        indicators: result,
        dataPoints: prices.length,
      },
    });
  } catch (error) {
    console.error('Error calculating indicators:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate indicators',
    });
  }
};

// ==================== STRATEGY OPTIMIZER ====================

/**
 * Start the strategy optimizer
 * POST /api/algo/optimizer/start
 */
const startOptimizer = async (req, res) => {
  try {
    const { symbols, config } = req.body;

    if (!symbols || (Array.isArray(symbols) && symbols.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one symbol is required',
      });
    }

    // Check if Alpaca is initialized
    if (!alpacaService.isInitialized) {
      return res.status(400).json({
        success: false,
        message: 'Please connect to Alpaca first in the Command Center',
      });
    }

    const result = await strategyOptimizerService.start(symbols, config);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error starting optimizer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start optimizer',
    });
  }
};

/**
 * Stop the strategy optimizer
 * POST /api/algo/optimizer/stop
 */
const stopOptimizer = async (req, res) => {
  try {
    const result = strategyOptimizerService.stop();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error stopping optimizer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop optimizer',
    });
  }
};

/**
 * Get optimizer status
 * GET /api/algo/optimizer/status
 */
const getOptimizerStatus = async (req, res) => {
  try {
    const status = strategyOptimizerService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting optimizer status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get optimizer status',
    });
  }
};

/**
 * Run one-time analysis on symbols (Day Trading Mode)
 * POST /api/algo/optimizer/analyze
 */
const runAnalysis = async (req, res) => {
  try {
    const { symbols, config } = req.body;

    if (!symbols || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one symbol is required',
      });
    }

    // Check if Alpaca is initialized
    if (!alpacaService.isInitialized) {
      return res.status(400).json({
        success: false,
        message: 'Please connect to Alpaca first in the Command Center',
      });
    }

    // Apply config if provided (for day trading timeframe selection)
    if (config) {
      strategyOptimizerService.updateConfig(config);
    }

    const results = await strategyOptimizerService.runOnceAnalysis(symbols);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error running analysis:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run analysis',
    });
  }
};

/**
 * Update optimizer configuration
 * PUT /api/algo/optimizer/config
 */
const updateOptimizerConfig = async (req, res) => {
  try {
    const { config } = req.body;
    const result = strategyOptimizerService.updateConfig(config);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating optimizer config:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update config',
    });
  }
};

/**
 * Add symbol to monitoring
 * POST /api/algo/optimizer/symbols
 */
const addOptimizerSymbol = async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required',
      });
    }
    const result = strategyOptimizerService.addSymbol(symbol);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error adding symbol:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add symbol',
    });
  }
};

/**
 * Remove symbol from monitoring
 * DELETE /api/algo/optimizer/symbols/:symbol
 */
const removeOptimizerSymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const result = strategyOptimizerService.removeSymbol(symbol);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error removing symbol:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove symbol',
    });
  }
};

/**
 * Get strategy leaderboard
 * GET /api/algo/optimizer/leaderboard
 */
const getStrategyLeaderboard = async (req, res) => {
  try {
    const leaderboard = strategyOptimizerService.getStrategyLeaderboard();
    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get leaderboard',
    });
  }
};

module.exports = {
  getStrategyTemplates,
  generateSignals,
  runBacktest,
  startAutoTrading,
  stopAutoTrading,
  getStrategyStatus,
  getActiveStrategies,
  calculateIndicators,
  // Optimizer
  startOptimizer,
  stopOptimizer,
  getOptimizerStatus,
  runAnalysis,
  updateOptimizerConfig,
  addOptimizerSymbol,
  removeOptimizerSymbol,
  getStrategyLeaderboard,
};
