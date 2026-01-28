/**
 * Strategy Optimizer Service
 *
 * Real-time strategy competition:
 * - Monitors live quotes for selected symbols
 * - Runs ALL strategies against current market conditions
 * - Finds the winning strategy with highest confidence
 * - Executes trade only if profit threshold is met
 *
 * Uses FREE Alpaca data - no paid subscriptions needed!
 */

const alpacaService = require('./alpacaService');
const algoTradingService = require('./algoTradingService');

class StrategyOptimizerService {
  constructor() {
    this.isRunning = false;
    this.monitoredSymbols = new Set();
    this.optimizerInterval = null;
    this.config = {
      profitThreshold: 0.5,      // Minimum expected gain % to execute for day trading
      confidenceThreshold: 50,   // Minimum signal confidence %
      checkIntervalMs: 15000,    // Check every 15 seconds for real-time day trading
      maxPositionsPerSymbol: 1,  // Only one position per symbol
      positionSizePercent: 10,   // 10% of buying power per trade
      timeframe: '1Min',         // Day trading: use 1-minute bars for real-time analysis
      // Consensus configuration
      consensusEnabled: true,    // Enable consensus-based trading decisions
      minConsensusCount: 3,      // Minimum strategies that must agree on BUY
      enabledStrategies: null,   // null = all strategies, or array of strategy IDs
    };
    this.lastSignals = new Map();   // Last signals for each symbol
    this.executedTrades = [];       // Trade history
    this.strategyScores = new Map(); // Running scores for strategies
    this.realtimeData = new Map();  // Real-time price data
    this.lastUpdate = null;         // Last update timestamp
  }

  /**
   * Get all available strategy templates
   */
  getStrategies() {
    return algoTradingService.getStrategyTemplates();
  }

  /**
   * Start the strategy optimizer
   */
  async start(symbols, config = {}) {
    if (this.isRunning) {
      return { success: false, message: 'Optimizer is already running' };
    }

    // Merge config
    this.config = { ...this.config, ...config };

    // Add symbols to monitor
    if (Array.isArray(symbols)) {
      symbols.forEach(s => this.monitoredSymbols.add(s.toUpperCase()));
    } else if (symbols) {
      this.monitoredSymbols.add(symbols.toUpperCase());
    }

    if (this.monitoredSymbols.size === 0) {
      return { success: false, message: 'No symbols to monitor' };
    }

    this.isRunning = true;
    console.log(`[StrategyOptimizer] Starting with symbols: ${Array.from(this.monitoredSymbols).join(', ')}`);
    console.log(`[StrategyOptimizer] Config: Profit threshold: ${this.config.profitThreshold}%, Confidence: ${this.config.confidenceThreshold}%`);

    // Run initial check
    await this.runOptimizationCycle();

    // Start monitoring interval
    this.optimizerInterval = setInterval(async () => {
      try {
        await this.runOptimizationCycle();
      } catch (error) {
        console.error('[StrategyOptimizer] Error in cycle:', error.message);
      }
    }, this.config.checkIntervalMs);

    return {
      success: true,
      isRunning: true,  // IMPORTANT: Frontend needs this to start auto-refresh
      message: `Optimizer started for ${this.monitoredSymbols.size} symbols`,
      monitoredSymbols: Array.from(this.monitoredSymbols),
      config: this.config,
    };
  }

  /**
   * Stop the optimizer
   */
  stop() {
    if (this.optimizerInterval) {
      clearInterval(this.optimizerInterval);
      this.optimizerInterval = null;
    }
    this.isRunning = false;
    console.log('[StrategyOptimizer] Stopped');
    return { success: true, message: 'Optimizer stopped' };
  }

  /**
   * Run one optimization cycle - check all symbols with all strategies
   */
  async runOptimizationCycle() {
    const results = [];
    const strategies = this.getStrategies();

    for (const symbol of this.monitoredSymbols) {
      try {
        const symbolResult = await this.analyzeSymbol(symbol, strategies);
        results.push(symbolResult);

        // Execute if conditions are met
        if (symbolResult.shouldExecute) {
          await this.executeWinningStrategy(symbolResult);
        }
      } catch (error) {
        console.error(`[StrategyOptimizer] Error analyzing ${symbol}:`, error.message);
        results.push({ symbol, error: error.message });
      }
    }

    return results;
  }

  /**
   * Analyze a symbol with all strategies and find the best one
   */
  async analyzeSymbol(symbol, strategies) {
    console.log(`[StrategyOptimizer] Analyzing ${symbol} with ${strategies?.length || 0} strategies`);

    // Get REAL-TIME quote first for current price
    let realTimePrice = null;
    let realTimeQuote = null;
    try {
      realTimeQuote = await alpacaService.getQuote(symbol);
      realTimePrice = realTimeQuote.bidPrice || realTimeQuote.askPrice;
      console.log(`[StrategyOptimizer] Real-time quote for ${symbol}: Bid=$${realTimeQuote.bidPrice}, Ask=$${realTimeQuote.askPrice}`);
    } catch (err) {
      console.log(`[StrategyOptimizer] Could not get real-time quote for ${symbol}, will use last bar price`);
    }

    // Get TODAY's intraday bars only for day trading
    // Market hours: 9:30 AM - 4:00 PM ET = 6.5 hours = 390 minutes
    // With 1-minute bars = ~390 bars, with 5-minute bars = ~78 bars
    const endDate = new Date();
    const startDate = new Date();

    // Set to start of today (market open at 9:30 AM ET)
    startDate.setHours(0, 0, 0, 0); // Midnight today

    // Use 1-minute bars for most accurate day trading analysis
    const timeframe = this.config.timeframe || '1Min';

    const bars = await alpacaService.getBars(
      symbol,
      timeframe,
      startDate.toISOString(),
      endDate.toISOString(),
      1000 // Get all bars from today
    );

    console.log(`[StrategyOptimizer] Got ${bars?.length || 0} ${timeframe} bars for ${symbol} (TODAY's data only)`);

    // For day trading, we need at least 30 bars to calculate indicators (30 minutes of 1-min data)
    if (!bars || bars.length < 30) {
      console.log(`[StrategyOptimizer] Insufficient intraday data for ${symbol}: ${bars?.length || 0} bars (need at least 30)`);
      return {
        symbol,
        error: `Insufficient intraday data: ${bars?.length || 0} bars. Market may be closed or just opened.`,
        signals: [],
        currentPrice: realTimePrice || null,
        realTimeQuote: realTimeQuote ? {
          bidPrice: realTimeQuote.bidPrice,
          askPrice: realTimeQuote.askPrice,
        } : null,
      };
    }

    // Map bar properties to standard format
    const standardBars = bars.map(b => ({
      close: b.close || b.ClosePrice || b.c,
      open: b.open || b.OpenPrice || b.o,
      high: b.high || b.HighPrice || b.h,
      low: b.low || b.LowPrice || b.l,
      volume: b.volume || b.Volume || b.v,
      timestamp: b.timestamp || b.Timestamp || b.t,
    }));

    // Use real-time price if available, otherwise use last bar's close
    const lastBarPrice = standardBars[standardBars.length - 1].close;
    const currentPrice = realTimePrice || lastBarPrice;

    // If we have real-time price, update the last bar to reflect current market
    if (realTimePrice && realTimePrice !== lastBarPrice) {
      console.log(`[StrategyOptimizer] Using real-time price $${realTimePrice} (last bar was $${lastBarPrice})`);
      // Add current price to bars for more accurate indicator calculation
      standardBars[standardBars.length - 1].close = realTimePrice;
    }
    const signals = [];

    // Run each strategy and collect signals
    console.log(`[StrategyOptimizer] Running ${strategies.length} strategies on ${symbol}`);
    for (const strategy of strategies) {
      try {
        const strategyConfig = {
          type: strategy.type,
          params: strategy.params,
        };

        console.log(`[StrategyOptimizer] Running strategy: ${strategy.name} (${strategy.type})`);
        const signal = await algoTradingService.generateSignals(symbol, strategyConfig, standardBars);
        console.log(`[StrategyOptimizer] Strategy ${strategy.name} result: ${signal.signal}, confidence: ${signal.confidence}%`);

        // Calculate expected profit based on historical performance and signal strength
        const expectedProfit = this.estimateExpectedProfit(signal, strategy);

        signals.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          strategyType: strategy.type,
          riskLevel: strategy.riskLevel,
          signal: signal.signal,
          confidence: signal.confidence,
          expectedProfit,
          indicators: signal.indicators,
          reasons: signal.reasons,
        });

        // Update strategy scores (for long-term tracking)
        this.updateStrategyScore(strategy.id, signal);

      } catch (error) {
        console.error(`[StrategyOptimizer] Error with strategy ${strategy.name}:`, error.message);
        console.error(`[StrategyOptimizer] Full error:`, error);
      }
    }
    console.log(`[StrategyOptimizer] Finished analyzing ${symbol}, got ${signals.length} signals`);

    // Sort by expected profit (descending)
    signals.sort((a, b) => {
      // Prioritize buy/sell signals over hold
      if (a.signal !== 'HOLD' && b.signal === 'HOLD') return -1;
      if (a.signal === 'HOLD' && b.signal !== 'HOLD') return 1;
      // Then by expected profit
      return b.expectedProfit - a.expectedProfit;
    });

    // Find the winner
    const winner = signals.find(s =>
      s.signal !== 'HOLD' &&
      s.confidence >= this.config.confidenceThreshold &&
      s.expectedProfit >= this.config.profitThreshold
    );

    // Check if we should execute
    const existingPosition = await this.checkExistingPosition(symbol);
    const shouldExecute = winner && !existingPosition && this.isMarketOpen();

    // Store last signals for this symbol
    this.lastSignals.set(symbol, {
      timestamp: new Date().toISOString(),
      currentPrice,
      signals,
      winner,
      shouldExecute,
    });

    return {
      symbol,
      currentPrice,
      realTimeQuote: realTimeQuote ? {
        bidPrice: realTimeQuote.bidPrice,
        askPrice: realTimeQuote.askPrice,
        timestamp: realTimeQuote.timestamp,
      } : null,
      timeframe: this.config.timeframe || '5Min',
      barsAnalyzed: standardBars.length,
      signals,
      winner,
      shouldExecute,
      existingPosition,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Estimate expected profit based on signal strength and strategy characteristics
   */
  estimateExpectedProfit(signal, strategy) {
    if (signal.signal === 'HOLD') return 0;

    // Base profit estimate from confidence - more aggressive scaling
    // Confidence of 50 = 1.5%, 70 = 2.1%, 90 = 2.7%
    let profit = (signal.confidence / 100) * 3.0;

    // Adjust based on risk level
    const riskMultipliers = {
      low: 0.9,    // Lower risk = slightly lower expected return
      medium: 1.0,
      high: 1.4,   // Higher risk = higher expected return
    };
    profit *= riskMultipliers[strategy.riskLevel] || 1.0;

    // Adjust based on indicator specifics
    if (signal.indicators) {
      // RSI extremes - strong mean reversion signals
      if (signal.indicators.rsi) {
        if (signal.indicators.rsi < 25 && signal.signal === 'BUY') {
          profit *= 1.3; // Oversold = strong buy signal
        } else if (signal.indicators.rsi > 75 && signal.signal === 'SELL') {
          profit *= 1.3; // Overbought = strong sell signal
        } else if (signal.indicators.rsi < 30 || signal.indicators.rsi > 70) {
          profit *= 1.15; // Near extremes
        }
      }
      // MACD histogram strength
      if (signal.indicators.macd?.histogram) {
        profit *= 1 + Math.min(0.4, Math.abs(signal.indicators.macd.histogram) * 0.15);
      }
      // Bollinger Band %B
      if (signal.indicators.bollinger?.percentB !== undefined) {
        const pb = signal.indicators.bollinger.percentB;
        if (pb < 0 || pb > 1) {
          profit *= 1.25; // Outside bands = stronger mean reversion signal
        } else if (pb < 0.1 || pb > 0.9) {
          profit *= 1.1; // Near bands
        }
      }
    }

    // Add a small base profit for any actionable signal
    if (signal.signal !== 'HOLD') {
      profit = Math.max(profit, 0.5); // Minimum 0.5% for any buy/sell signal
    }

    return Math.round(profit * 100) / 100;
  }

  /**
   * Update running scores for strategies
   */
  updateStrategyScore(strategyId, signal) {
    const current = this.strategyScores.get(strategyId) || {
      totalSignals: 0,
      buySignals: 0,
      sellSignals: 0,
      avgConfidence: 0,
    };

    current.totalSignals++;
    if (signal.signal === 'BUY') current.buySignals++;
    if (signal.signal === 'SELL') current.sellSignals++;
    current.avgConfidence = (
      (current.avgConfidence * (current.totalSignals - 1) + signal.confidence) /
      current.totalSignals
    );

    this.strategyScores.set(strategyId, current);
  }

  /**
   * Check if we already have a position in this symbol
   */
  async checkExistingPosition(symbol) {
    try {
      const position = await alpacaService.getPosition(symbol);
      return position ? { qty: position.qty, marketValue: position.marketValue } : null;
    } catch (error) {
      return null; // No position
    }
  }

  /**
   * Check if market is open
   */
  async isMarketOpen() {
    try {
      const clock = await alpacaService.getClock();
      return clock.isOpen;
    } catch (error) {
      console.error('[StrategyOptimizer] Error checking market hours:', error.message);
      return false;
    }
  }

  /**
   * Execute the winning strategy's trade
   */
  async executeWinningStrategy(result) {
    const { symbol, winner, currentPrice } = result;

    if (!winner) {
      console.log(`[StrategyOptimizer] No winning strategy for ${symbol}`);
      return null;
    }

    console.log(`[StrategyOptimizer] 🎯 EXECUTING: ${winner.signal} ${symbol}`);
    console.log(`  Strategy: ${winner.strategyName} (${winner.strategyType})`);
    console.log(`  Confidence: ${winner.confidence}%`);
    console.log(`  Expected Profit: ${winner.expectedProfit}%`);
    console.log(`  Reasons: ${winner.reasons.join(', ')}`);

    try {
      // Get account to calculate position size
      const account = await alpacaService.getAccount();
      const tradeAmount = account.buyingPower * (this.config.positionSizePercent / 100);
      const shares = Math.floor(tradeAmount / currentPrice);

      if (shares < 1) {
        console.log(`[StrategyOptimizer] Insufficient buying power for ${symbol}`);
        return null;
      }

      // Place the order
      const order = await alpacaService.placeOrder({
        symbol,
        qty: shares,
        side: winner.signal.toLowerCase(),
        type: 'market',
        timeInForce: 'day',
      });

      const trade = {
        timestamp: new Date().toISOString(),
        symbol,
        side: winner.signal,
        shares,
        price: currentPrice,
        strategy: winner.strategyName,
        strategyType: winner.strategyType,
        confidence: winner.confidence,
        expectedProfit: winner.expectedProfit,
        reasons: winner.reasons,
        orderId: order.id,
      };

      this.executedTrades.push(trade);

      console.log(`[StrategyOptimizer] ✅ Order placed: ${shares} shares of ${symbol} @ ~$${currentPrice}`);

      return trade;

    } catch (error) {
      console.error(`[StrategyOptimizer] ❌ Failed to execute trade for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      monitoredSymbols: Array.from(this.monitoredSymbols),
      config: this.config,
      lastSignals: Object.fromEntries(this.lastSignals),
      recentTrades: this.executedTrades.slice(-20),
      strategyScores: Object.fromEntries(this.strategyScores),
    };
  }

  /**
   * Get the latest analysis for all symbols (without executing)
   */
  async getLatestAnalysis() {
    if (this.lastSignals.size === 0) {
      // Run analysis if no data
      await this.runOptimizationCycle();
    }
    return Object.fromEntries(this.lastSignals);
  }

  /**
   * Add symbol to monitoring
   */
  addSymbol(symbol) {
    this.monitoredSymbols.add(symbol.toUpperCase());
    return { success: true, symbols: Array.from(this.monitoredSymbols) };
  }

  /**
   * Remove symbol from monitoring
   */
  removeSymbol(symbol) {
    this.monitoredSymbols.delete(symbol.toUpperCase());
    this.lastSignals.delete(symbol.toUpperCase());
    return { success: true, symbols: Array.from(this.monitoredSymbols) };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return { success: true, config: this.config };
  }

  /**
   * Get strategy leaderboard based on accumulated signals
   */
  getStrategyLeaderboard() {
    const strategies = this.getStrategies();
    const leaderboard = strategies.map(s => {
      const score = this.strategyScores.get(s.id) || {
        totalSignals: 0,
        buySignals: 0,
        sellSignals: 0,
        avgConfidence: 0,
      };
      return {
        id: s.id,
        name: s.name,
        type: s.type,
        riskLevel: s.riskLevel,
        ...score,
        activityRate: score.totalSignals > 0
          ? ((score.buySignals + score.sellSignals) / score.totalSignals * 100).toFixed(1)
          : 0,
      };
    });

    // Sort by average confidence
    return leaderboard.sort((a, b) => b.avgConfidence - a.avgConfidence);
  }

  /**
   * Run one-time analysis with profit calculation for today's trading data
   * Calculates what profit each strategy would have made today
   */
  async runOnceAnalysis(symbols) {
    console.log(`[StrategyOptimizer] DAY TRADING ANALYSIS - symbols: ${symbols}`);
    const strategies = this.getStrategies();
    console.log(`[StrategyOptimizer] Loaded ${strategies.length} strategies`);
    const results = {};

    for (const symbol of symbols) {
      try {
        console.log(`[StrategyOptimizer] Analyzing symbol: ${symbol} with profit calculation`);
        results[symbol] = await this.analyzeDayTradingProfits(symbol.toUpperCase(), strategies);
        console.log(`[StrategyOptimizer] Day trading result for ${symbol}:`,
          `Best strategy: ${results[symbol].bestStrategy?.strategyName || 'None'}, ` +
          `Max profit: ${results[symbol].maxProfit?.toFixed(2) || 0}%`);
      } catch (error) {
        console.error(`[StrategyOptimizer] Error analyzing ${symbol}:`, error);
        results[symbol] = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Analyze day trading profits for each strategy
   * Backtests each strategy on today's intraday data
   */
  async analyzeDayTradingProfits(symbol, allStrategies) {
    console.log(`[StrategyOptimizer] Day trading profit analysis for ${symbol}`);

    // Filter strategies based on enabledStrategies config
    let strategies = allStrategies;
    if (this.config.enabledStrategies && Array.isArray(this.config.enabledStrategies) && this.config.enabledStrategies.length > 0) {
      strategies = allStrategies.filter(s => this.config.enabledStrategies.includes(s.type));
      console.log(`[StrategyOptimizer] Filtered to ${strategies.length} enabled strategies out of ${allStrategies.length}`);
    }

    // Get real-time quote first
    let realTimeQuote = null;
    let currentPrice = null;
    try {
      realTimeQuote = await alpacaService.getQuote(symbol);
      currentPrice = (realTimeQuote.bidPrice + realTimeQuote.askPrice) / 2;
      console.log(`[StrategyOptimizer] Real-time: ${symbol} Bid=$${realTimeQuote.bidPrice}, Ask=$${realTimeQuote.askPrice}`);
    } catch (err) {
      console.log(`[StrategyOptimizer] Could not get real-time quote for ${symbol}`);
    }

    // Get TODAY's intraday bars (from market open to now)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Midnight today

    const timeframe = this.config.timeframe || '1Min';
    const bars = await alpacaService.getBars(
      symbol,
      timeframe,
      startDate.toISOString(),
      endDate.toISOString(),
      1000
    );

    console.log(`[StrategyOptimizer] Got ${bars?.length || 0} ${timeframe} bars for ${symbol} today`);

    if (!bars || bars.length < 30) {
      return {
        symbol,
        error: `Insufficient intraday data: ${bars?.length || 0} bars. Market may be closed or just opened.`,
        strategyProfits: [],
        bestStrategy: null,
        maxProfit: 0,
        currentPrice,
        realTimeQuote: realTimeQuote ? { bidPrice: realTimeQuote.bidPrice, askPrice: realTimeQuote.askPrice } : null,
        barsAnalyzed: bars?.length || 0,
        timeframe,
      };
    }

    // Map bars to standard format
    const standardBars = bars.map(b => ({
      close: b.close || b.ClosePrice || b.c,
      open: b.open || b.OpenPrice || b.o,
      high: b.high || b.HighPrice || b.h,
      low: b.low || b.LowPrice || b.l,
      volume: b.volume || b.Volume || b.v,
      timestamp: b.timestamp || b.Timestamp || b.t,
    }));

    const openPrice = standardBars[0].open; // First bar open price (market open)
    const lastPrice = currentPrice || standardBars[standardBars.length - 1].close;

    // Calculate profit for each strategy by simulating trades
    const strategyProfits = [];

    for (const strategy of strategies) {
      try {
        const profitResult = await this.calculateStrategyDayProfit(symbol, strategy, standardBars, lastPrice);
        strategyProfits.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          strategyType: strategy.type,
          riskLevel: strategy.riskLevel,
          ...profitResult,
        });
      } catch (error) {
        console.error(`[StrategyOptimizer] Error calculating profit for ${strategy.name}:`, error.message);
      }
    }

    // Sort by profit (descending)
    strategyProfits.sort((a, b) => b.profit - a.profit);

    // Find best strategy
    const bestStrategy = strategyProfits.length > 0 ? strategyProfits[0] : null;
    const maxProfit = bestStrategy?.profit || 0;

    // Also get current signal for each strategy (for "what to do now")
    const currentSignals = [];
    for (const strategy of strategies) {
      try {
        const strategyConfig = { type: strategy.type, params: strategy.params };
        const signal = await algoTradingService.generateSignals(symbol, strategyConfig, standardBars);
        currentSignals.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          strategyType: strategy.type,
          signal: signal.signal,
          confidence: signal.confidence,
          reasons: signal.reasons,
        });
      } catch (error) {
        // Skip this strategy
      }
    }

    // Calculate consensus for BUY/SELL decisions
    const buySignals = currentSignals.filter(s => s.signal === 'BUY' && s.confidence >= this.config.confidenceThreshold);
    const sellSignals = currentSignals.filter(s => s.signal === 'SELL' && s.confidence >= this.config.confidenceThreshold);
    const holdSignals = currentSignals.filter(s => s.signal === 'HOLD');

    const consensus = {
      enabled: this.config.consensusEnabled,
      minRequired: this.config.minConsensusCount,
      totalStrategies: currentSignals.length,
      buyCount: buySignals.length,
      sellCount: sellSignals.length,
      holdCount: holdSignals.length,
      buyStrategies: buySignals.map(s => s.strategyName),
      sellStrategies: sellSignals.map(s => s.strategyName),
      // Consensus recommendation
      recommendation: 'HOLD',
      consensusMet: false,
      consensusStrength: 0, // Percentage of enabled strategies agreeing
    };

    // Determine consensus recommendation
    if (this.config.consensusEnabled) {
      if (buySignals.length >= this.config.minConsensusCount) {
        consensus.recommendation = 'BUY';
        consensus.consensusMet = true;
        consensus.consensusStrength = (buySignals.length / currentSignals.length * 100).toFixed(1);
      } else if (sellSignals.length >= this.config.minConsensusCount) {
        consensus.recommendation = 'SELL';
        consensus.consensusMet = true;
        consensus.consensusStrength = (sellSignals.length / currentSignals.length * 100).toFixed(1);
      }
    } else {
      // If consensus is disabled, use the best single strategy
      const bestSignal = currentSignals.find(s => s.signal !== 'HOLD' && s.confidence >= this.config.confidenceThreshold);
      if (bestSignal) {
        consensus.recommendation = bestSignal.signal;
        consensus.consensusMet = true;
        consensus.consensusStrength = bestSignal.confidence;
      }
    }

    console.log(`[StrategyOptimizer] Consensus for ${symbol}: ${consensus.recommendation} (${consensus.buyCount} BUY, ${consensus.sellCount} SELL, ${consensus.holdCount} HOLD)`);

    return {
      symbol,
      currentPrice: lastPrice,
      openPrice,
      dayChange: lastPrice - openPrice,
      dayChangePercent: ((lastPrice - openPrice) / openPrice * 100).toFixed(2),
      realTimeQuote: realTimeQuote ? { bidPrice: realTimeQuote.bidPrice, askPrice: realTimeQuote.askPrice } : null,
      timeframe,
      barsAnalyzed: standardBars.length,
      tradingPeriod: {
        start: standardBars[0].timestamp,
        end: standardBars[standardBars.length - 1].timestamp,
      },
      strategyProfits,
      bestStrategy,
      maxProfit,
      signals: currentSignals, // Current signals for "what to do now"
      consensus, // Consensus-based recommendation
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate profit a strategy would have made today
   * Simulates following the strategy's signals throughout the day
   */
  async calculateStrategyDayProfit(symbol, strategy, bars, currentPrice) {
    const trades = [];
    let position = null; // null = no position, 'long' = holding
    let entryPrice = 0;
    let totalProfit = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    // Simulate trading through each bar
    for (let i = 30; i < bars.length; i++) {
      // Get bars up to this point (for indicator calculation)
      const barsToHere = bars.slice(0, i + 1);

      try {
        const strategyConfig = { type: strategy.type, params: strategy.params };
        const signal = await algoTradingService.generateSignals(symbol, strategyConfig, barsToHere);

        const barPrice = bars[i].close;

        // Execute trades based on signals
        if (signal.signal === 'BUY' && signal.confidence >= 50 && position !== 'long') {
          // Enter long position
          if (position === null) {
            position = 'long';
            entryPrice = barPrice;
            trades.push({
              type: 'BUY',
              price: barPrice,
              timestamp: bars[i].timestamp,
              confidence: signal.confidence,
            });
          }
        } else if (signal.signal === 'SELL' && position === 'long') {
          // Exit long position
          const tradeProfit = ((barPrice - entryPrice) / entryPrice) * 100;
          totalProfit += tradeProfit;

          if (tradeProfit > 0) winningTrades++;
          else losingTrades++;

          trades.push({
            type: 'SELL',
            price: barPrice,
            timestamp: bars[i].timestamp,
            profit: tradeProfit,
            confidence: signal.confidence,
          });

          position = null;
          entryPrice = 0;
        }
      } catch (error) {
        // Skip this bar
      }
    }

    // If still in position, calculate unrealized profit
    let unrealizedProfit = 0;
    if (position === 'long') {
      unrealizedProfit = ((currentPrice - entryPrice) / entryPrice) * 100;
    }

    const finalProfit = totalProfit + unrealizedProfit;
    const totalTrades = trades.filter(t => t.type === 'SELL').length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;

    return {
      profit: finalProfit,
      realizedProfit: totalProfit,
      unrealizedProfit,
      trades,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      currentPosition: position,
      entryPrice: position ? entryPrice : null,
    };
  }
}

module.exports = new StrategyOptimizerService();
