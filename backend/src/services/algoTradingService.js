/**
 * Algorithmic Trading Service
 *
 * Supports multiple strategy types:
 * - Technical Indicators (RSI, MACD, Moving Averages, Bollinger Bands)
 * - Mean Reversion
 * - Momentum Trading
 *
 * Features:
 * - Strategy creation and management
 * - Backtesting on historical data
 * - Live auto-execution
 * - Performance tracking
 */

const alpacaService = require('./alpacaService');

class AlgoTradingService {
  constructor() {
    this.activeStrategies = new Map(); // Running strategies
    this.strategyIntervals = new Map(); // Interval timers
  }

  // ==================== TECHNICAL INDICATORS ====================

  /**
   * Calculate Simple Moving Average (SMA)
   */
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  calculateEMA(prices, period) {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate subsequent values using smoothing
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod + signalPeriod) return null;

    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;

    // Calculate MACD history for signal line
    const macdHistory = [];
    for (let i = slowPeriod; i <= prices.length; i++) {
      const slicedPrices = prices.slice(0, i);
      const fast = this.calculateEMA(slicedPrices, fastPeriod);
      const slow = this.calculateEMA(slicedPrices, slowPeriod);
      macdHistory.push(fast - slow);
    }

    const signalLine = this.calculateEMA(macdHistory, signalPeriod);
    const histogram = macdLine - signalLine;

    return {
      macdLine,
      signalLine,
      histogram,
      bullish: macdLine > signalLine,
      bearish: macdLine < signalLine,
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return null;

    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);

    // Calculate standard deviation
    const squaredDiffs = slice.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    const upperBand = sma + (stdDev * standardDeviation);
    const lowerBand = sma - (stdDev * standardDeviation);
    const currentPrice = prices[prices.length - 1];

    return {
      upper: upperBand,
      middle: sma,
      lower: lowerBand,
      currentPrice,
      percentB: (currentPrice - lowerBand) / (upperBand - lowerBand),
      bandwidth: (upperBand - lowerBand) / sma,
    };
  }

  /**
   * Calculate ATR (Average True Range) - for position sizing
   */
  calculateATR(bars, period = 14) {
    if (bars.length < period + 1) return null;

    const trueRanges = [];
    for (let i = 1; i < bars.length; i++) {
      const high = bars[i].high;
      const low = bars[i].low;
      const prevClose = bars[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    return this.calculateSMA(trueRanges, period);
  }

  /**
   * Calculate Stochastic Oscillator
   */
  calculateStochastic(bars, kPeriod = 14, dPeriod = 3) {
    if (bars.length < kPeriod) return null;

    const kValues = [];
    for (let i = kPeriod - 1; i < bars.length; i++) {
      const slice = bars.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...slice.map(b => b.high));
      const lowest = Math.min(...slice.map(b => b.low));
      const current = slice[slice.length - 1].close;

      const k = highest !== lowest ? ((current - lowest) / (highest - lowest)) * 100 : 50;
      kValues.push(k);
    }

    const currentK = kValues[kValues.length - 1];
    const currentD = this.calculateSMA(kValues.slice(-dPeriod), dPeriod);

    return {
      k: currentK,
      d: currentD,
      overbought: currentK > 80,
      oversold: currentK < 20,
    };
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price)
   */
  calculateVWAP(bars) {
    if (bars.length < 1) return null;

    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;

    for (const bar of bars) {
      const typicalPrice = (bar.high + bar.low + bar.close) / 3;
      cumulativeTPV += typicalPrice * bar.volume;
      cumulativeVolume += bar.volume;
    }

    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : bars[bars.length - 1].close;
    const currentPrice = bars[bars.length - 1].close;
    const deviation = ((currentPrice - vwap) / vwap) * 100;

    return {
      vwap,
      currentPrice,
      deviation,
      aboveVWAP: currentPrice > vwap,
      belowVWAP: currentPrice < vwap,
    };
  }

  /**
   * Calculate Ichimoku Cloud
   */
  calculateIchimoku(bars, tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52) {
    if (bars.length < senkouBPeriod) return null;

    const calcMidpoint = (slice) => {
      const high = Math.max(...slice.map(b => b.high));
      const low = Math.min(...slice.map(b => b.low));
      return (high + low) / 2;
    };

    const tenkanSen = calcMidpoint(bars.slice(-tenkanPeriod)); // Conversion Line
    const kijunSen = calcMidpoint(bars.slice(-kijunPeriod)); // Base Line
    const senkouSpanA = (tenkanSen + kijunSen) / 2; // Leading Span A
    const senkouSpanB = calcMidpoint(bars.slice(-senkouBPeriod)); // Leading Span B
    const currentPrice = bars[bars.length - 1].close;

    const cloudTop = Math.max(senkouSpanA, senkouSpanB);
    const cloudBottom = Math.min(senkouSpanA, senkouSpanB);

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      cloudTop,
      cloudBottom,
      aboveCloud: currentPrice > cloudTop,
      belowCloud: currentPrice < cloudBottom,
      inCloud: currentPrice >= cloudBottom && currentPrice <= cloudTop,
      bullishCross: tenkanSen > kijunSen,
      bearishCross: tenkanSen < kijunSen,
    };
  }

  /**
   * Calculate ADX (Average Directional Index)
   */
  calculateADX(bars, period = 14) {
    if (bars.length < period * 2) return null;

    const plusDM = [];
    const minusDM = [];
    const tr = [];

    for (let i = 1; i < bars.length; i++) {
      const highDiff = bars[i].high - bars[i - 1].high;
      const lowDiff = bars[i - 1].low - bars[i].low;

      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

      const trueRange = Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close)
      );
      tr.push(trueRange);
    }

    const smoothedPlusDM = this.calculateEMA(plusDM, period);
    const smoothedMinusDM = this.calculateEMA(minusDM, period);
    const smoothedTR = this.calculateEMA(tr, period);

    const plusDI = (smoothedPlusDM / smoothedTR) * 100;
    const minusDI = (smoothedMinusDM / smoothedTR) * 100;
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;

    // Calculate ADX as EMA of DX
    const dxValues = [dx];
    const adx = dx; // Simplified - would need more history for proper ADX

    return {
      adx,
      plusDI,
      minusDI,
      strongTrend: adx > 25,
      weakTrend: adx < 20,
      bullish: plusDI > minusDI,
      bearish: minusDI > plusDI,
    };
  }

  /**
   * Calculate Parabolic SAR
   */
  calculateParabolicSAR(bars, acceleration = 0.02, maximum = 0.2) {
    if (bars.length < 5) return null;

    let af = acceleration;
    let ep = bars[0].high;
    let sar = bars[0].low;
    let isUptrend = true;

    for (let i = 1; i < bars.length; i++) {
      const prevSAR = sar;

      if (isUptrend) {
        sar = prevSAR + af * (ep - prevSAR);
        sar = Math.min(sar, bars[i - 1].low, i > 1 ? bars[i - 2].low : bars[i - 1].low);

        if (bars[i].low < sar) {
          isUptrend = false;
          sar = ep;
          ep = bars[i].low;
          af = acceleration;
        } else {
          if (bars[i].high > ep) {
            ep = bars[i].high;
            af = Math.min(af + acceleration, maximum);
          }
        }
      } else {
        sar = prevSAR + af * (ep - prevSAR);
        sar = Math.max(sar, bars[i - 1].high, i > 1 ? bars[i - 2].high : bars[i - 1].high);

        if (bars[i].high > sar) {
          isUptrend = true;
          sar = ep;
          ep = bars[i].high;
          af = acceleration;
        } else {
          if (bars[i].low < ep) {
            ep = bars[i].low;
            af = Math.min(af + acceleration, maximum);
          }
        }
      }
    }

    const currentPrice = bars[bars.length - 1].close;
    return {
      sar,
      isUptrend,
      currentPrice,
      buySignal: isUptrend && currentPrice > sar,
      sellSignal: !isUptrend && currentPrice < sar,
    };
  }

  /**
   * Calculate Williams %R
   */
  calculateWilliamsR(bars, period = 14) {
    if (bars.length < period) return null;

    const slice = bars.slice(-period);
    const highest = Math.max(...slice.map(b => b.high));
    const lowest = Math.min(...slice.map(b => b.low));
    const current = slice[slice.length - 1].close;

    const williamsR = highest !== lowest
      ? ((highest - current) / (highest - lowest)) * -100
      : -50;

    return {
      value: williamsR,
      overbought: williamsR > -20,
      oversold: williamsR < -80,
    };
  }

  /**
   * Calculate CCI (Commodity Channel Index)
   */
  calculateCCI(bars, period = 20) {
    if (bars.length < period) return null;

    const typicalPrices = bars.map(b => (b.high + b.low + b.close) / 3);
    const sma = this.calculateSMA(typicalPrices, period);

    const slice = typicalPrices.slice(-period);
    const meanDeviation = slice.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;

    const currentTP = typicalPrices[typicalPrices.length - 1];
    const cci = meanDeviation !== 0 ? (currentTP - sma) / (0.015 * meanDeviation) : 0;

    return {
      value: cci,
      overbought: cci > 100,
      oversold: cci < -100,
      strongBuy: cci < -200,
      strongSell: cci > 200,
    };
  }

  /**
   * Calculate ATR for breakout strategy
   */
  calculateATRBreakout(bars, atrPeriod = 14, multiplier = 2) {
    if (bars.length < atrPeriod + 1) return null;

    const atr = this.calculateATR(bars, atrPeriod);
    const currentPrice = bars[bars.length - 1].close;
    const sma = this.calculateSMA(bars.map(b => b.close), 20);

    const upperBreakout = sma + (atr * multiplier);
    const lowerBreakout = sma - (atr * multiplier);

    return {
      atr,
      upperBreakout,
      lowerBreakout,
      currentPrice,
      sma,
      breakoutUp: currentPrice > upperBreakout,
      breakoutDown: currentPrice < lowerBreakout,
    };
  }

  /**
   * Calculate OBV (On-Balance Volume)
   */
  calculateOBV(bars) {
    if (bars.length < 2) return null;

    let obv = 0;
    const obvValues = [0];

    for (let i = 1; i < bars.length; i++) {
      if (bars[i].close > bars[i - 1].close) {
        obv += bars[i].volume;
      } else if (bars[i].close < bars[i - 1].close) {
        obv -= bars[i].volume;
      }
      obvValues.push(obv);
    }

    const obvSMA = this.calculateSMA(obvValues, 20) || obv;
    const trend = obv > obvSMA ? 'bullish' : obv < obvSMA ? 'bearish' : 'neutral';

    return {
      obv,
      obvSMA,
      trend,
      divergence: false, // Would need price comparison for divergence
    };
  }

  /**
   * Calculate SuperTrend
   */
  calculateSuperTrend(bars, period = 10, multiplier = 3) {
    if (bars.length < period) return null;

    const atr = this.calculateATR(bars, period);
    const currentBar = bars[bars.length - 1];
    const hl2 = (currentBar.high + currentBar.low) / 2;

    const upperBand = hl2 + (multiplier * atr);
    const lowerBand = hl2 - (multiplier * atr);

    // Simplified SuperTrend - in reality needs previous values
    const trend = currentBar.close > hl2 ? 'up' : 'down';
    const superTrend = trend === 'up' ? lowerBand : upperBand;

    return {
      superTrend,
      upperBand,
      lowerBand,
      trend,
      buySignal: currentBar.close > superTrend && trend === 'up',
      sellSignal: currentBar.close < superTrend && trend === 'down',
    };
  }

  /**
   * Calculate Donchian Channel
   */
  calculateDonchian(bars, period = 20) {
    if (bars.length < period) return null;

    const slice = bars.slice(-period);
    const upperChannel = Math.max(...slice.map(b => b.high));
    const lowerChannel = Math.min(...slice.map(b => b.low));
    const middleChannel = (upperChannel + lowerChannel) / 2;
    const currentPrice = bars[bars.length - 1].close;

    return {
      upper: upperChannel,
      lower: lowerChannel,
      middle: middleChannel,
      currentPrice,
      breakoutUp: currentPrice >= upperChannel,
      breakoutDown: currentPrice <= lowerChannel,
      width: upperChannel - lowerChannel,
    };
  }

  /**
   * Calculate Keltner Channel
   */
  calculateKeltner(bars, emaPeriod = 20, atrPeriod = 10, multiplier = 2) {
    if (bars.length < Math.max(emaPeriod, atrPeriod)) return null;

    const prices = bars.map(b => b.close);
    const ema = this.calculateEMA(prices, emaPeriod);
    const atr = this.calculateATR(bars, atrPeriod);

    const upperChannel = ema + (multiplier * atr);
    const lowerChannel = ema - (multiplier * atr);
    const currentPrice = bars[bars.length - 1].close;

    return {
      upper: upperChannel,
      middle: ema,
      lower: lowerChannel,
      currentPrice,
      aboveUpper: currentPrice > upperChannel,
      belowLower: currentPrice < lowerChannel,
      inChannel: currentPrice >= lowerChannel && currentPrice <= upperChannel,
    };
  }

  /**
   * Calculate MFI (Money Flow Index)
   */
  calculateMFI(bars, period = 14) {
    if (bars.length < period + 1) return null;

    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let i = bars.length - period; i < bars.length; i++) {
      const typicalPrice = (bars[i].high + bars[i].low + bars[i].close) / 3;
      const prevTypicalPrice = (bars[i - 1].high + bars[i - 1].low + bars[i - 1].close) / 3;
      const rawMoneyFlow = typicalPrice * bars[i].volume;

      if (typicalPrice > prevTypicalPrice) {
        positiveFlow += rawMoneyFlow;
      } else {
        negativeFlow += rawMoneyFlow;
      }
    }

    const moneyRatio = negativeFlow === 0 ? 100 : positiveFlow / negativeFlow;
    const mfi = 100 - (100 / (1 + moneyRatio));

    return {
      value: mfi,
      overbought: mfi > 80,
      oversold: mfi < 20,
    };
  }

  /**
   * Calculate Pivot Points
   */
  calculatePivotPoints(bars) {
    if (bars.length < 2) return null;

    // Use previous bar for pivot calculation
    const prevBar = bars[bars.length - 2];
    const currentPrice = bars[bars.length - 1].close;

    const pivot = (prevBar.high + prevBar.low + prevBar.close) / 3;
    const r1 = (2 * pivot) - prevBar.low;
    const s1 = (2 * pivot) - prevBar.high;
    const r2 = pivot + (prevBar.high - prevBar.low);
    const s2 = pivot - (prevBar.high - prevBar.low);
    const r3 = prevBar.high + 2 * (pivot - prevBar.low);
    const s3 = prevBar.low - 2 * (prevBar.high - pivot);

    return {
      pivot,
      r1, r2, r3,
      s1, s2, s3,
      currentPrice,
      abovePivot: currentPrice > pivot,
      belowPivot: currentPrice < pivot,
      nearestSupport: currentPrice > s1 ? s1 : currentPrice > s2 ? s2 : s3,
      nearestResistance: currentPrice < r1 ? r1 : currentPrice < r2 ? r2 : r3,
    };
  }

  /**
   * Calculate Fibonacci Retracement Levels
   */
  calculateFibonacci(bars, lookback = 50) {
    if (bars.length < lookback) return null;

    const slice = bars.slice(-lookback);
    const high = Math.max(...slice.map(b => b.high));
    const low = Math.min(...slice.map(b => b.low));
    const diff = high - low;
    const currentPrice = bars[bars.length - 1].close;

    // Fibonacci levels
    const levels = {
      level0: high,
      level236: high - (diff * 0.236),
      level382: high - (diff * 0.382),
      level500: high - (diff * 0.5),
      level618: high - (diff * 0.618),
      level786: high - (diff * 0.786),
      level1000: low,
    };

    // Find nearest levels
    const allLevels = Object.values(levels).sort((a, b) => b - a);
    const nearestSupport = allLevels.find(l => l < currentPrice) || low;
    const nearestResistance = allLevels.reverse().find(l => l > currentPrice) || high;

    return {
      ...levels,
      currentPrice,
      nearestSupport,
      nearestResistance,
      trend: currentPrice > levels.level500 ? 'bullish' : 'bearish',
    };
  }

  /**
   * Calculate TRIX (Triple Exponential Average)
   */
  calculateTRIX(prices, period = 15) {
    if (prices.length < period * 3) return null;

    // Triple EMA
    const ema1 = [];
    let e1 = this.calculateSMA(prices.slice(0, period), period);
    ema1.push(e1);
    const multiplier = 2 / (period + 1);

    for (let i = period; i < prices.length; i++) {
      e1 = (prices[i] - e1) * multiplier + e1;
      ema1.push(e1);
    }

    const ema2 = [];
    let e2 = this.calculateSMA(ema1.slice(0, period), period);
    ema2.push(e2);

    for (let i = period; i < ema1.length; i++) {
      e2 = (ema1[i] - e2) * multiplier + e2;
      ema2.push(e2);
    }

    const ema3 = [];
    let e3 = this.calculateSMA(ema2.slice(0, period), period);
    ema3.push(e3);

    for (let i = period; i < ema2.length; i++) {
      e3 = (ema2[i] - e3) * multiplier + e3;
      ema3.push(e3);
    }

    const currentTrix = ema3.length > 1
      ? ((ema3[ema3.length - 1] - ema3[ema3.length - 2]) / ema3[ema3.length - 2]) * 100
      : 0;

    return {
      value: currentTrix,
      bullish: currentTrix > 0,
      bearish: currentTrix < 0,
    };
  }

  /**
   * Calculate Aroon Indicator
   */
  calculateAroon(bars, period = 25) {
    if (bars.length < period) return null;

    const slice = bars.slice(-period);
    const highIndex = slice.reduce((maxIdx, bar, idx, arr) =>
      bar.high > arr[maxIdx].high ? idx : maxIdx, 0);
    const lowIndex = slice.reduce((minIdx, bar, idx, arr) =>
      bar.low < arr[minIdx].low ? idx : minIdx, 0);

    const aroonUp = ((period - (period - 1 - highIndex)) / period) * 100;
    const aroonDown = ((period - (period - 1 - lowIndex)) / period) * 100;
    const aroonOscillator = aroonUp - aroonDown;

    return {
      aroonUp,
      aroonDown,
      oscillator: aroonOscillator,
      strongUptrend: aroonUp > 70 && aroonDown < 30,
      strongDowntrend: aroonDown > 70 && aroonUp < 30,
      trend: aroonOscillator > 0 ? 'bullish' : 'bearish',
    };
  }

  /**
   * Calculate Rate of Change (ROC)
   */
  calculateROC(prices, period = 12) {
    if (prices.length < period + 1) return null;

    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    const roc = ((currentPrice - pastPrice) / pastPrice) * 100;

    return {
      value: roc,
      bullish: roc > 0,
      bearish: roc < 0,
      strongBullish: roc > 5,
      strongBearish: roc < -5,
    };
  }

  // ==================== STRATEGY SIGNALS ====================

  /**
   * Generate signals based on strategy type
   */
  async generateSignals(symbol, strategyConfig, bars) {
    const prices = bars.map(bar => bar.close);
    const signals = {
      symbol,
      timestamp: new Date().toISOString(),
      indicators: {},
      signal: 'HOLD',
      confidence: 0,
      reasons: [],
    };

    const { type: rawType, params = {} } = strategyConfig;
    const type = (rawType || '').toUpperCase();

    console.log(`[generateSignals] Strategy type: "${rawType}" -> "${type}", Params:`, params);

    switch (type) {
      case 'RSI':
        signals.indicators.rsi = this.calculateRSI(prices, params.period || 14);
        if (signals.indicators.rsi !== null) {
          const oversold = params.oversold || 30;
          const overbought = params.overbought || 70;
          if (signals.indicators.rsi < oversold) {
            signals.signal = 'BUY';
            // Higher confidence the further below oversold threshold
            signals.confidence = Math.min(100, 50 + (oversold - signals.indicators.rsi) * 2);
            signals.reasons.push(`RSI oversold at ${signals.indicators.rsi.toFixed(2)}`);
          } else if (signals.indicators.rsi > overbought) {
            signals.signal = 'SELL';
            // Higher confidence the further above overbought threshold
            signals.confidence = Math.min(100, 50 + (signals.indicators.rsi - overbought) * 2);
            signals.reasons.push(`RSI overbought at ${signals.indicators.rsi.toFixed(2)}`);
          }
        }
        break;

      case 'MACD':
        signals.indicators.macd = this.calculateMACD(
          prices,
          params.fastPeriod || 12,
          params.slowPeriod || 26,
          params.signalPeriod || 9
        );
        if (signals.indicators.macd !== null) {
          if (signals.indicators.macd.bullish && signals.indicators.macd.histogram > 0) {
            signals.signal = 'BUY';
            // Base confidence of 60 when bullish, plus histogram strength
            signals.confidence = Math.min(100, 60 + Math.abs(signals.indicators.macd.histogram) * 20);
            signals.reasons.push('MACD bullish crossover');
          } else if (signals.indicators.macd.bearish && signals.indicators.macd.histogram < 0) {
            signals.signal = 'SELL';
            signals.confidence = Math.min(100, 60 + Math.abs(signals.indicators.macd.histogram) * 20);
            signals.reasons.push('MACD bearish crossover');
          }
        }
        break;

      case 'MOVING_AVERAGE':
        const fastMA = this.calculateSMA(prices, params.fastPeriod || 10);
        const slowMA = this.calculateSMA(prices, params.slowPeriod || 50);
        signals.indicators.fastMA = fastMA;
        signals.indicators.slowMA = slowMA;

        if (fastMA !== null && slowMA !== null) {
          const currentPrice = prices[prices.length - 1];
          if (fastMA > slowMA && currentPrice > fastMA) {
            signals.signal = 'BUY';
            // Base confidence of 55, plus strength of crossover
            signals.confidence = Math.min(100, 55 + ((fastMA - slowMA) / slowMA) * 500);
            signals.reasons.push(`Fast MA (${fastMA.toFixed(2)}) above Slow MA (${slowMA.toFixed(2)})`);
          } else if (fastMA < slowMA && currentPrice < fastMA) {
            signals.signal = 'SELL';
            signals.confidence = Math.min(100, 55 + ((slowMA - fastMA) / slowMA) * 500);
            signals.reasons.push(`Fast MA (${fastMA.toFixed(2)}) below Slow MA (${slowMA.toFixed(2)})`);
          }
        }
        break;

      case 'BOLLINGER_BANDS':
        signals.indicators.bollinger = this.calculateBollingerBands(
          prices,
          params.period || 20,
          params.stdDev || 2
        );
        if (signals.indicators.bollinger !== null) {
          const { percentB, currentPrice, lower, upper } = signals.indicators.bollinger;
          if (currentPrice < lower) {
            signals.signal = 'BUY';
            // Below lower band = strong buy signal
            signals.confidence = Math.min(100, 60 + Math.abs(percentB) * 30);
            signals.reasons.push(`Price below lower Bollinger Band`);
          } else if (currentPrice > upper) {
            signals.signal = 'SELL';
            signals.confidence = Math.min(100, 60 + (percentB - 1) * 30);
            signals.reasons.push(`Price above upper Bollinger Band`);
          }
        }
        break;

      case 'MEAN_REVERSION':
        const sma = this.calculateSMA(prices, params.period || 20);
        const currentPriceMR = prices[prices.length - 1];
        const deviation = ((currentPriceMR - sma) / sma) * 100;
        signals.indicators.sma = sma;
        signals.indicators.deviation = deviation;

        const threshold = params.threshold || 5; // Default 5% threshold
        if (deviation < -threshold) {
          signals.signal = 'BUY';
          // Base 55 confidence when below threshold
          signals.confidence = Math.min(100, 55 + Math.abs(deviation) * 5);
          signals.reasons.push(`Price ${Math.abs(deviation).toFixed(2)}% below mean`);
        } else if (deviation > threshold) {
          signals.signal = 'SELL';
          signals.confidence = Math.min(100, 55 + Math.abs(deviation) * 5);
          signals.reasons.push(`Price ${deviation.toFixed(2)}% above mean`);
        }
        break;

      case 'MOMENTUM':
        const momentumPeriod = params.period || 10;
        if (prices.length >= momentumPeriod) {
          const momentum = ((prices[prices.length - 1] / prices[prices.length - momentumPeriod]) - 1) * 100;
          signals.indicators.momentum = momentum;

          const momThreshold = params.threshold || 3; // Lower default for more signals
          if (momentum > momThreshold) {
            signals.signal = 'BUY';
            // Base 55 confidence when above threshold
            signals.confidence = Math.min(100, 55 + momentum * 3);
            signals.reasons.push(`Strong upward momentum: ${momentum.toFixed(2)}%`);
          } else if (momentum < -momThreshold) {
            signals.signal = 'SELL';
            signals.confidence = Math.min(100, 55 + Math.abs(momentum) * 3);
            signals.reasons.push(`Strong downward momentum: ${momentum.toFixed(2)}%`);
          }
        }
        break;

      case 'COMBINED':
        // Combine multiple indicators
        const rsi = this.calculateRSI(prices, 14);
        const macd = this.calculateMACD(prices, 12, 26, 9);
        const bb = this.calculateBollingerBands(prices, 20, 2);

        let buyScore = 0;
        let sellScore = 0;

        if (rsi !== null) {
          signals.indicators.rsi = rsi;
          if (rsi < 30) buyScore += 2;
          else if (rsi < 40) buyScore += 1;
          else if (rsi > 70) sellScore += 2;
          else if (rsi > 60) sellScore += 1;
        }

        if (macd !== null) {
          signals.indicators.macd = macd;
          if (macd.bullish) buyScore += 2;
          if (macd.bearish) sellScore += 2;
        }

        if (bb !== null) {
          signals.indicators.bollinger = bb;
          if (bb.percentB < 0) buyScore += 2;
          else if (bb.percentB < 0.2) buyScore += 1;
          else if (bb.percentB > 1) sellScore += 2;
          else if (bb.percentB > 0.8) sellScore += 1;
        }

        if (buyScore >= 4 && buyScore > sellScore) {
          signals.signal = 'BUY';
          signals.confidence = Math.min(100, buyScore * 15);
          signals.reasons.push(`Combined score: BUY ${buyScore} vs SELL ${sellScore}`);
        } else if (sellScore >= 4 && sellScore > buyScore) {
          signals.signal = 'SELL';
          signals.confidence = Math.min(100, sellScore * 15);
          signals.reasons.push(`Combined score: SELL ${sellScore} vs BUY ${buyScore}`);
        }
        break;

      case 'STOCHASTIC':
        signals.indicators.stochastic = this.calculateStochastic(
          bars,
          params.kPeriod || 14,
          params.dPeriod || 3
        );
        if (signals.indicators.stochastic !== null) {
          const { k, d, oversold, overbought } = signals.indicators.stochastic;
          if (oversold && k > d) {
            signals.signal = 'BUY';
            signals.confidence = Math.min(100, 55 + (20 - k) * 2);
            signals.reasons.push(`Stochastic oversold at ${k.toFixed(2)}, K crossing above D`);
          } else if (overbought && k < d) {
            signals.signal = 'SELL';
            signals.confidence = Math.min(100, 55 + (k - 80) * 2);
            signals.reasons.push(`Stochastic overbought at ${k.toFixed(2)}, K crossing below D`);
          }
        }
        break;

      case 'VWAP':
        signals.indicators.vwap = this.calculateVWAP(bars);
        if (signals.indicators.vwap !== null) {
          const { deviation, belowVWAP, aboveVWAP } = signals.indicators.vwap;
          const threshold = params.threshold || 1;
          if (belowVWAP && deviation < -threshold) {
            signals.signal = 'BUY';
            signals.confidence = Math.min(100, 55 + Math.abs(deviation) * 10);
            signals.reasons.push(`Price ${Math.abs(deviation).toFixed(2)}% below VWAP`);
          } else if (aboveVWAP && deviation > threshold) {
            signals.signal = 'SELL';
            signals.confidence = Math.min(100, 55 + deviation * 10);
            signals.reasons.push(`Price ${deviation.toFixed(2)}% above VWAP`);
          }
        }
        break;

      case 'ICHIMOKU':
        signals.indicators.ichimoku = this.calculateIchimoku(
          bars,
          params.tenkanPeriod || 9,
          params.kijunPeriod || 26,
          params.senkouBPeriod || 52
        );
        if (signals.indicators.ichimoku !== null) {
          const { aboveCloud, belowCloud, bullishCross, bearishCross, tenkanSen, kijunSen } = signals.indicators.ichimoku;
          if (aboveCloud && bullishCross) {
            signals.signal = 'BUY';
            signals.confidence = 70;
            signals.reasons.push('Price above cloud with bullish TK cross');
          } else if (belowCloud && bearishCross) {
            signals.signal = 'SELL';
            signals.confidence = 70;
            signals.reasons.push('Price below cloud with bearish TK cross');
          } else if (aboveCloud) {
            signals.signal = 'BUY';
            signals.confidence = 55;
            signals.reasons.push('Price above Ichimoku cloud');
          } else if (belowCloud) {
            signals.signal = 'SELL';
            signals.confidence = 55;
            signals.reasons.push('Price below Ichimoku cloud');
          }
        }
        break;

      case 'ADX':
        signals.indicators.adx = this.calculateADX(bars, params.period || 14);
        if (signals.indicators.adx !== null) {
          const { adx, strongTrend, bullish, bearish, plusDI, minusDI } = signals.indicators.adx;
          const threshold = params.threshold || 25;
          if (strongTrend && adx > threshold) {
            if (bullish) {
              signals.signal = 'BUY';
              signals.confidence = Math.min(100, 55 + (adx - threshold) * 2);
              signals.reasons.push(`Strong uptrend: ADX ${adx.toFixed(2)}, +DI > -DI`);
            } else if (bearish) {
              signals.signal = 'SELL';
              signals.confidence = Math.min(100, 55 + (adx - threshold) * 2);
              signals.reasons.push(`Strong downtrend: ADX ${adx.toFixed(2)}, -DI > +DI`);
            }
          }
        }
        break;

      case 'PARABOLIC_SAR':
        signals.indicators.psar = this.calculateParabolicSAR(
          bars,
          params.acceleration || 0.02,
          params.maximum || 0.2
        );
        if (signals.indicators.psar !== null) {
          const { buySignal, sellSignal, sar, currentPrice, isUptrend } = signals.indicators.psar;
          if (buySignal) {
            signals.signal = 'BUY';
            signals.confidence = 65;
            signals.reasons.push(`Parabolic SAR bullish: Price ${currentPrice.toFixed(2)} > SAR ${sar.toFixed(2)}`);
          } else if (sellSignal) {
            signals.signal = 'SELL';
            signals.confidence = 65;
            signals.reasons.push(`Parabolic SAR bearish: Price ${currentPrice.toFixed(2)} < SAR ${sar.toFixed(2)}`);
          }
        }
        break;

      case 'WILLIAMS_R':
        signals.indicators.williamsR = this.calculateWilliamsR(bars, params.period || 14);
        if (signals.indicators.williamsR !== null) {
          const { value, oversold, overbought } = signals.indicators.williamsR;
          if (oversold) {
            signals.signal = 'BUY';
            signals.confidence = Math.min(100, 55 + Math.abs(value + 80) * 2);
            signals.reasons.push(`Williams %R oversold at ${value.toFixed(2)}`);
          } else if (overbought) {
            signals.signal = 'SELL';
            signals.confidence = Math.min(100, 55 + (value + 20) * 2);
            signals.reasons.push(`Williams %R overbought at ${value.toFixed(2)}`);
          }
        }
        break;

      case 'CCI':
        signals.indicators.cci = this.calculateCCI(bars, params.period || 20);
        if (signals.indicators.cci !== null) {
          const { value, oversold, overbought, strongBuy, strongSell } = signals.indicators.cci;
          if (strongBuy) {
            signals.signal = 'BUY';
            signals.confidence = 80;
            signals.reasons.push(`CCI extremely oversold at ${value.toFixed(2)}`);
          } else if (oversold) {
            signals.signal = 'BUY';
            signals.confidence = 60;
            signals.reasons.push(`CCI oversold at ${value.toFixed(2)}`);
          } else if (strongSell) {
            signals.signal = 'SELL';
            signals.confidence = 80;
            signals.reasons.push(`CCI extremely overbought at ${value.toFixed(2)}`);
          } else if (overbought) {
            signals.signal = 'SELL';
            signals.confidence = 60;
            signals.reasons.push(`CCI overbought at ${value.toFixed(2)}`);
          }
        }
        break;

      case 'ATR_BREAKOUT':
        signals.indicators.atrBreakout = this.calculateATRBreakout(
          bars,
          params.atrPeriod || 14,
          params.multiplier || 2
        );
        if (signals.indicators.atrBreakout !== null) {
          const { breakoutUp, breakoutDown, currentPrice, upperBreakout, lowerBreakout, atr } = signals.indicators.atrBreakout;
          if (breakoutUp) {
            signals.signal = 'BUY';
            signals.confidence = 70;
            signals.reasons.push(`ATR breakout UP: Price ${currentPrice.toFixed(2)} > ${upperBreakout.toFixed(2)}`);
          } else if (breakoutDown) {
            signals.signal = 'SELL';
            signals.confidence = 70;
            signals.reasons.push(`ATR breakout DOWN: Price ${currentPrice.toFixed(2)} < ${lowerBreakout.toFixed(2)}`);
          }
        }
        break;

      case 'OBV':
        signals.indicators.obv = this.calculateOBV(bars);
        if (signals.indicators.obv !== null) {
          const { trend, obv, obvSMA } = signals.indicators.obv;
          if (trend === 'bullish') {
            signals.signal = 'BUY';
            signals.confidence = 60;
            signals.reasons.push(`OBV bullish: Volume confirming uptrend`);
          } else if (trend === 'bearish') {
            signals.signal = 'SELL';
            signals.confidence = 60;
            signals.reasons.push(`OBV bearish: Volume confirming downtrend`);
          }
        }
        break;

      case 'SUPERTREND':
        signals.indicators.supertrend = this.calculateSuperTrend(
          bars,
          params.period || 10,
          params.multiplier || 3
        );
        if (signals.indicators.supertrend !== null) {
          const { buySignal, sellSignal, trend, superTrend } = signals.indicators.supertrend;
          if (buySignal) {
            signals.signal = 'BUY';
            signals.confidence = 75;
            signals.reasons.push(`SuperTrend BUY: Price above ${superTrend.toFixed(2)}, trend UP`);
          } else if (sellSignal) {
            signals.signal = 'SELL';
            signals.confidence = 75;
            signals.reasons.push(`SuperTrend SELL: Price below ${superTrend.toFixed(2)}, trend DOWN`);
          }
        }
        break;

      case 'DONCHIAN':
        signals.indicators.donchian = this.calculateDonchian(bars, params.period || 20);
        if (signals.indicators.donchian !== null) {
          const { breakoutUp, breakoutDown, upper, lower, currentPrice } = signals.indicators.donchian;
          if (breakoutUp) {
            signals.signal = 'BUY';
            signals.confidence = 80;
            signals.reasons.push(`Donchian breakout UP: Price ${currentPrice.toFixed(2)} at ${params.period || 20}-day high`);
          } else if (breakoutDown) {
            signals.signal = 'SELL';
            signals.confidence = 80;
            signals.reasons.push(`Donchian breakout DOWN: Price ${currentPrice.toFixed(2)} at ${params.period || 20}-day low`);
          }
        }
        break;

      case 'KELTNER':
        signals.indicators.keltner = this.calculateKeltner(
          bars,
          params.emaPeriod || 20,
          params.atrPeriod || 10,
          params.multiplier || 2
        );
        if (signals.indicators.keltner !== null) {
          const { aboveUpper, belowLower, upper, lower, currentPrice } = signals.indicators.keltner;
          if (belowLower) {
            signals.signal = 'BUY';
            signals.confidence = 65;
            signals.reasons.push(`Keltner oversold: Price ${currentPrice.toFixed(2)} below lower band ${lower.toFixed(2)}`);
          } else if (aboveUpper) {
            signals.signal = 'SELL';
            signals.confidence = 65;
            signals.reasons.push(`Keltner overbought: Price ${currentPrice.toFixed(2)} above upper band ${upper.toFixed(2)}`);
          }
        }
        break;

      case 'MFI':
        signals.indicators.mfi = this.calculateMFI(bars, params.period || 14);
        if (signals.indicators.mfi !== null) {
          const { value, overbought, oversold } = signals.indicators.mfi;
          signals.indicators.mfi.value = value;
          if (oversold) {
            signals.signal = 'BUY';
            signals.confidence = 70;
            signals.reasons.push(`MFI oversold at ${value.toFixed(2)} (below 20)`);
          } else if (overbought) {
            signals.signal = 'SELL';
            signals.confidence = 70;
            signals.reasons.push(`MFI overbought at ${value.toFixed(2)} (above 80)`);
          }
        }
        break;

      case 'PIVOT_POINTS':
        signals.indicators.pivots = this.calculatePivotPoints(bars);
        if (signals.indicators.pivots !== null) {
          const { currentPrice, pivot, s1, r1, abovePivot } = signals.indicators.pivots;
          if (currentPrice < s1) {
            signals.signal = 'BUY';
            signals.confidence = 65;
            signals.reasons.push(`Price ${currentPrice.toFixed(2)} below S1 support ${s1.toFixed(2)}`);
          } else if (currentPrice > r1) {
            signals.signal = 'SELL';
            signals.confidence = 65;
            signals.reasons.push(`Price ${currentPrice.toFixed(2)} above R1 resistance ${r1.toFixed(2)}`);
          }
        }
        break;

      case 'FIBONACCI':
        signals.indicators.fibonacci = this.calculateFibonacci(bars, params.lookback || 50);
        if (signals.indicators.fibonacci !== null) {
          const { currentPrice, level382, level618, trend, nearestSupport, nearestResistance } = signals.indicators.fibonacci;
          const distToSupport = Math.abs(currentPrice - nearestSupport) / currentPrice * 100;
          const distToResistance = Math.abs(nearestResistance - currentPrice) / currentPrice * 100;

          if (distToSupport < 1 && trend === 'bullish') {
            signals.signal = 'BUY';
            signals.confidence = 65;
            signals.reasons.push(`Price near Fibonacci support ${nearestSupport.toFixed(2)}`);
          } else if (distToResistance < 1 && trend === 'bearish') {
            signals.signal = 'SELL';
            signals.confidence = 65;
            signals.reasons.push(`Price near Fibonacci resistance ${nearestResistance.toFixed(2)}`);
          }
        }
        break;

      case 'TRIX':
        signals.indicators.trix = this.calculateTRIX(prices, params.period || 15);
        if (signals.indicators.trix !== null) {
          const { value, bullish, bearish } = signals.indicators.trix;
          if (bullish && value > 0.1) {
            signals.signal = 'BUY';
            signals.confidence = 60;
            signals.reasons.push(`TRIX bullish momentum: ${value.toFixed(4)}`);
          } else if (bearish && value < -0.1) {
            signals.signal = 'SELL';
            signals.confidence = 60;
            signals.reasons.push(`TRIX bearish momentum: ${value.toFixed(4)}`);
          }
        }
        break;

      case 'AROON':
        signals.indicators.aroon = this.calculateAroon(bars, params.period || 25);
        if (signals.indicators.aroon !== null) {
          const { strongUptrend, strongDowntrend, aroonUp, aroonDown } = signals.indicators.aroon;
          if (strongUptrend) {
            signals.signal = 'BUY';
            signals.confidence = 75;
            signals.reasons.push(`Aroon strong uptrend: Up ${aroonUp.toFixed(0)}%, Down ${aroonDown.toFixed(0)}%`);
          } else if (strongDowntrend) {
            signals.signal = 'SELL';
            signals.confidence = 75;
            signals.reasons.push(`Aroon strong downtrend: Up ${aroonUp.toFixed(0)}%, Down ${aroonDown.toFixed(0)}%`);
          }
        }
        break;

      case 'ROC':
        signals.indicators.roc = this.calculateROC(prices, params.period || 12);
        if (signals.indicators.roc !== null) {
          const { value, strongBullish, strongBearish } = signals.indicators.roc;
          if (strongBullish) {
            signals.signal = 'BUY';
            signals.confidence = 70;
            signals.reasons.push(`ROC strong bullish momentum: ${value.toFixed(2)}%`);
          } else if (strongBearish) {
            signals.signal = 'SELL';
            signals.confidence = 70;
            signals.reasons.push(`ROC strong bearish momentum: ${value.toFixed(2)}%`);
          }
        }
        break;
    }

    return signals;
  }

  // ==================== BACKTESTING ====================

  /**
   * Run backtest on historical data
   */
  async runBacktest(config) {
    const {
      symbol,
      strategy,
      startDate,
      endDate,
      initialCapital = 100000,
      positionSize = 0.1, // 10% of capital per trade
      stopLoss = 0.02, // 2% stop loss
      takeProfit = 0.05, // 5% take profit
    } = config;

    try {
      // Get historical data
      const rawBars = await alpacaService.getBars(
        symbol,
        '1Day',
        startDate,
        endDate,
        1000
      );

      if (rawBars.length < 50) {
        throw new Error(`Insufficient historical data for backtesting. Got ${rawBars.length} bars, need at least 50.`);
      }

      // Map bar properties to standard format (Alpaca uses different property names)
      const bars = rawBars.map(b => ({
        close: b.close || b.ClosePrice || b.c,
        open: b.open || b.OpenPrice || b.o,
        high: b.high || b.HighPrice || b.h,
        low: b.low || b.LowPrice || b.l,
        volume: b.volume || b.Volume || b.v,
        timestamp: b.timestamp || b.Timestamp || b.t,
      }));

      console.log(`Backtest: Got ${bars.length} bars from ${startDate} to ${endDate}`);
      console.log(`First bar: ${JSON.stringify(bars[0])}`);
      console.log(`Last bar: ${JSON.stringify(bars[bars.length - 1])}`);
      console.log(`Strategy: ${strategy.type}, Params: ${JSON.stringify(strategy.params)}`);

      // Initialize backtest state
      const results = {
        symbol,
        strategy,
        startDate,
        endDate,
        initialCapital,
        finalCapital: initialCapital,
        trades: [],
        metrics: {},
      };

      let capital = initialCapital;
      let position = null;
      let wins = 0;
      let losses = 0;
      let totalReturn = 0;
      let maxDrawdown = 0;
      let peakCapital = initialCapital;

      // Track signal statistics for debugging
      let buySignals = 0;
      let sellSignals = 0;
      let holdSignals = 0;

      // Run through each bar
      for (let i = 50; i < bars.length; i++) {
        const historicalBars = bars.slice(0, i + 1);
        const currentBar = bars[i];
        const currentPrice = currentBar.close;

        // Generate signal
        const signals = await this.generateSignals(symbol, strategy, historicalBars);

        // Track signal types for debugging
        if (signals.signal === 'BUY') buySignals++;
        else if (signals.signal === 'SELL') sellSignals++;
        else holdSignals++;

        // Log first few signals for debugging
        if (i < 55) {
          console.log(`Bar ${i}: Signal=${signals.signal}, Confidence=${signals.confidence}, RSI=${signals.indicators.rsi?.toFixed(2) || 'N/A'}`);
        }

        // Check stop loss / take profit if in position
        if (position) {
          const pnlPercent = (currentPrice - position.entryPrice) / position.entryPrice;

          // Stop loss hit
          if (pnlPercent <= -stopLoss) {
            const pnl = position.shares * (currentPrice - position.entryPrice);
            capital += position.shares * currentPrice;
            results.trades.push({
              type: 'SELL',
              reason: 'STOP_LOSS',
              date: currentBar.timestamp,
              price: currentPrice,
              shares: position.shares,
              pnl,
              pnlPercent: pnlPercent * 100,
            });
            losses++;
            totalReturn += pnlPercent;
            position = null;
          }
          // Take profit hit
          else if (pnlPercent >= takeProfit) {
            const pnl = position.shares * (currentPrice - position.entryPrice);
            capital += position.shares * currentPrice;
            results.trades.push({
              type: 'SELL',
              reason: 'TAKE_PROFIT',
              date: currentBar.timestamp,
              price: currentPrice,
              shares: position.shares,
              pnl,
              pnlPercent: pnlPercent * 100,
            });
            wins++;
            totalReturn += pnlPercent;
            position = null;
          }
          // Signal to sell
          else if (signals.signal === 'SELL' && signals.confidence >= 50) {
            const pnl = position.shares * (currentPrice - position.entryPrice);
            capital += position.shares * currentPrice;
            results.trades.push({
              type: 'SELL',
              reason: 'SIGNAL',
              date: currentBar.timestamp,
              price: currentPrice,
              shares: position.shares,
              pnl,
              pnlPercent: pnlPercent * 100,
              signal: signals,
            });
            if (pnl > 0) wins++;
            else losses++;
            totalReturn += pnlPercent;
            position = null;
          }
        }
        // Enter position
        else if (signals.signal === 'BUY' && signals.confidence >= 50) {
          const tradeAmount = capital * positionSize;
          const shares = Math.floor(tradeAmount / currentPrice);

          if (shares > 0) {
            const cost = shares * currentPrice;
            capital -= cost;
            position = {
              entryPrice: currentPrice,
              entryDate: currentBar.timestamp,
              shares,
            };
            results.trades.push({
              type: 'BUY',
              reason: 'SIGNAL',
              date: currentBar.timestamp,
              price: currentPrice,
              shares,
              signal: signals,
            });
          }
        }

        // Track drawdown
        const currentCapital = capital + (position ? position.shares * currentPrice : 0);
        if (currentCapital > peakCapital) {
          peakCapital = currentCapital;
        }
        const drawdown = (peakCapital - currentCapital) / peakCapital;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      // Close any remaining position
      if (position) {
        const finalPrice = bars[bars.length - 1].close;
        const pnl = position.shares * (finalPrice - position.entryPrice);
        capital += position.shares * finalPrice;
        results.trades.push({
          type: 'SELL',
          reason: 'END_OF_BACKTEST',
          date: bars[bars.length - 1].timestamp,
          price: finalPrice,
          shares: position.shares,
          pnl,
        });
        if (pnl > 0) wins++;
        else losses++;
      }

      // Calculate final metrics
      results.finalCapital = capital;
      results.metrics = {
        totalTrades: results.trades.filter(t => t.type === 'BUY').length,
        winningTrades: wins,
        losingTrades: losses,
        winRate: wins / (wins + losses) * 100 || 0,
        totalReturn: ((capital - initialCapital) / initialCapital) * 100,
        maxDrawdown: maxDrawdown * 100,
        sharpeRatio: this.calculateSharpeRatio(results.trades),
        profitFactor: this.calculateProfitFactor(results.trades),
      };

      // Log backtest summary
      console.log(`\n=== BACKTEST SUMMARY ===`);
      console.log(`Symbol: ${symbol}, Strategy: ${strategy.type}`);
      console.log(`Bars analyzed: ${bars.length - 50}`);
      console.log(`Signals - BUY: ${buySignals}, SELL: ${sellSignals}, HOLD: ${holdSignals}`);
      console.log(`Total trades executed: ${results.metrics.totalTrades}`);
      console.log(`Final capital: $${capital.toFixed(2)} (${results.metrics.totalReturn.toFixed(2)}%)`);
      console.log(`========================\n`);

      return results;
    } catch (error) {
      console.error('Backtest error:', error);
      throw error;
    }
  }

  /**
   * Calculate Sharpe Ratio
   */
  calculateSharpeRatio(trades) {
    const returns = trades
      .filter(t => t.type === 'SELL' && t.pnlPercent !== undefined)
      .map(t => t.pnlPercent);

    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Annualized Sharpe (assuming daily returns, 252 trading days)
    return (avgReturn / stdDev) * Math.sqrt(252);
  }

  /**
   * Calculate Profit Factor
   */
  calculateProfitFactor(trades) {
    const profits = trades
      .filter(t => t.type === 'SELL' && t.pnl > 0)
      .reduce((sum, t) => sum + t.pnl, 0);

    const losses = Math.abs(trades
      .filter(t => t.type === 'SELL' && t.pnl < 0)
      .reduce((sum, t) => sum + t.pnl, 0));

    if (losses === 0) return profits > 0 ? Infinity : 0;
    return profits / losses;
  }

  // ==================== LIVE TRADING ====================

  /**
   * Start automated trading for a strategy
   */
  async startAutoTrading(strategyId, config) {
    const {
      symbol,
      strategy,
      positionSize = 0.1,
      stopLoss = 0.02,
      takeProfit = 0.05,
      checkInterval = 60000, // 1 minute default
    } = config;

    if (this.activeStrategies.has(strategyId)) {
      throw new Error('Strategy is already running');
    }

    console.log(`Starting auto-trading for ${symbol} with strategy ${strategy.type}`);

    // Store strategy config
    this.activeStrategies.set(strategyId, {
      symbol,
      strategy,
      config,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
      trades: [],
      currentPosition: null,
    });

    // Start monitoring interval
    const interval = setInterval(async () => {
      try {
        await this.checkAndExecute(strategyId);
      } catch (error) {
        console.error(`Error in auto-trading for ${strategyId}:`, error);
      }
    }, checkInterval);

    this.strategyIntervals.set(strategyId, interval);

    // Run initial check
    await this.checkAndExecute(strategyId);

    return { success: true, message: `Auto-trading started for ${symbol}` };
  }

  /**
   * Check signals and execute trades
   */
  async checkAndExecute(strategyId) {
    const strategyState = this.activeStrategies.get(strategyId);
    if (!strategyState || strategyState.status !== 'RUNNING') return;

    const { symbol, strategy, config } = strategyState;

    try {
      // Get recent bars
      const bars = await alpacaService.getBars(symbol, '1Day', null, null, 100);

      // Generate signals
      const signals = await this.generateSignals(symbol, strategy, bars);

      // Get current position
      const position = await alpacaService.getPosition(symbol).catch(() => null);

      // Get account info
      const account = await alpacaService.getAccount();

      console.log(`[${symbol}] Signal: ${signals.signal}, Confidence: ${signals.confidence}%, Position: ${position ? position.qty : 0}`);

      // Execute based on signals
      if (signals.signal === 'BUY' && signals.confidence >= 60 && !position) {
        // Calculate position size
        const tradeAmount = account.buyingPower * config.positionSize;
        const currentPrice = bars[bars.length - 1].close;
        const shares = Math.floor(tradeAmount / currentPrice);

        if (shares > 0) {
          const order = await alpacaService.placeOrder({
            symbol,
            qty: shares,
            side: 'buy',
            type: 'market',
            timeInForce: 'day',
          });

          strategyState.trades.push({
            type: 'BUY',
            timestamp: new Date().toISOString(),
            signal: signals,
            order,
          });

          strategyState.currentPosition = { shares, entryPrice: currentPrice };
          console.log(`[${symbol}] BUY order placed: ${shares} shares`);
        }
      }
      else if (signals.signal === 'SELL' && signals.confidence >= 60 && position) {
        const order = await alpacaService.placeOrder({
          symbol,
          qty: position.qty,
          side: 'sell',
          type: 'market',
          timeInForce: 'day',
        });

        strategyState.trades.push({
          type: 'SELL',
          timestamp: new Date().toISOString(),
          signal: signals,
          order,
          pnl: position.unrealizedPL,
        });

        strategyState.currentPosition = null;
        console.log(`[${symbol}] SELL order placed: ${position.qty} shares`);
      }
      // Check stop loss / take profit
      else if (position && strategyState.currentPosition) {
        const entryPrice = strategyState.currentPosition.entryPrice;
        const currentPrice = position.currentPrice;
        const pnlPercent = (currentPrice - entryPrice) / entryPrice;

        if (pnlPercent <= -config.stopLoss) {
          // Stop loss triggered
          const order = await alpacaService.placeOrder({
            symbol,
            qty: position.qty,
            side: 'sell',
            type: 'market',
            timeInForce: 'day',
          });

          strategyState.trades.push({
            type: 'SELL',
            reason: 'STOP_LOSS',
            timestamp: new Date().toISOString(),
            order,
            pnl: position.unrealizedPL,
          });

          strategyState.currentPosition = null;
          console.log(`[${symbol}] STOP LOSS triggered at ${(pnlPercent * 100).toFixed(2)}%`);
        }
        else if (pnlPercent >= config.takeProfit) {
          // Take profit triggered
          const order = await alpacaService.placeOrder({
            symbol,
            qty: position.qty,
            side: 'sell',
            type: 'market',
            timeInForce: 'day',
          });

          strategyState.trades.push({
            type: 'SELL',
            reason: 'TAKE_PROFIT',
            timestamp: new Date().toISOString(),
            order,
            pnl: position.unrealizedPL,
          });

          strategyState.currentPosition = null;
          console.log(`[${symbol}] TAKE PROFIT triggered at ${(pnlPercent * 100).toFixed(2)}%`);
        }
      }

      // Update last check timestamp
      strategyState.lastCheck = new Date().toISOString();
      strategyState.lastSignal = signals;

    } catch (error) {
      console.error(`Error checking/executing for ${symbol}:`, error);
      strategyState.lastError = error.message;
    }
  }

  /**
   * Stop automated trading
   */
  stopAutoTrading(strategyId) {
    const interval = this.strategyIntervals.get(strategyId);
    if (interval) {
      clearInterval(interval);
      this.strategyIntervals.delete(strategyId);
    }

    const strategy = this.activeStrategies.get(strategyId);
    if (strategy) {
      strategy.status = 'STOPPED';
      strategy.stoppedAt = new Date().toISOString();
    }

    return { success: true, message: 'Auto-trading stopped' };
  }

  /**
   * Get status of running strategy
   */
  getStrategyStatus(strategyId) {
    return this.activeStrategies.get(strategyId) || null;
  }

  /**
   * Get all active strategies
   */
  getAllActiveStrategies() {
    const strategies = [];
    for (const [id, strategy] of this.activeStrategies) {
      strategies.push({ id, ...strategy });
    }
    return strategies;
  }

  /**
   * Available strategy templates
   */
  getStrategyTemplates() {
    return [
      {
        id: 'rsi_oversold',
        name: 'RSI Oversold/Overbought',
        description: 'Buy when RSI drops below 30 (oversold), sell when RSI rises above 70 (overbought)',
        type: 'RSI',
        params: { period: 14, oversold: 30, overbought: 70 },
        riskLevel: 'medium',
      },
      {
        id: 'macd_crossover',
        name: 'MACD Crossover',
        description: 'Buy on bullish MACD crossover, sell on bearish crossover',
        type: 'MACD',
        params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        riskLevel: 'medium',
      },
      {
        id: 'golden_cross',
        name: 'Golden Cross / Death Cross',
        description: 'Buy when 50-day MA crosses above 200-day MA, sell on opposite',
        type: 'MOVING_AVERAGE',
        params: { fastPeriod: 50, slowPeriod: 200 },
        riskLevel: 'low',
      },
      {
        id: 'bollinger_bounce',
        name: 'Bollinger Band Bounce',
        description: 'Buy at lower band, sell at upper band',
        type: 'BOLLINGER_BANDS',
        params: { period: 20, stdDev: 2 },
        riskLevel: 'medium',
      },
      {
        id: 'mean_reversion',
        name: 'Mean Reversion',
        description: 'Buy when price deviates 5% below average, sell 5% above',
        type: 'MEAN_REVERSION',
        params: { period: 20, threshold: 5 },
        riskLevel: 'medium',
      },
      {
        id: 'momentum',
        name: 'Momentum Trading',
        description: 'Follow strong trends - buy winners, avoid losers',
        type: 'MOMENTUM',
        params: { period: 10, threshold: 5 },
        riskLevel: 'high',
      },
      {
        id: 'combined',
        name: 'Multi-Indicator Strategy',
        description: 'Combines RSI, MACD, and Bollinger Bands for stronger signals',
        type: 'COMBINED',
        params: {},
        riskLevel: 'low',
      },
      {
        id: 'stochastic',
        name: 'Stochastic Oscillator',
        description: 'Buy when %K crosses above %D in oversold zone, sell when crosses below in overbought',
        type: 'STOCHASTIC',
        params: { kPeriod: 14, dPeriod: 3, oversold: 20, overbought: 80 },
        riskLevel: 'medium',
      },
      {
        id: 'vwap',
        name: 'VWAP Trading',
        description: 'Buy below VWAP (institutional support), sell above VWAP (institutional resistance)',
        type: 'VWAP',
        params: { threshold: 1 },
        riskLevel: 'medium',
      },
      {
        id: 'ichimoku',
        name: 'Ichimoku Cloud',
        description: 'Multiple signals: price vs cloud, TK cross. Strong trend following.',
        type: 'ICHIMOKU',
        params: { tenkanPeriod: 9, kijunPeriod: 26, senkouBPeriod: 52 },
        riskLevel: 'medium',
      },
      {
        id: 'adx',
        name: 'ADX Trend Strength',
        description: 'Trade strong trends only. ADX > 25 confirms trend, DI+/DI- shows direction.',
        type: 'ADX',
        params: { period: 14, threshold: 25 },
        riskLevel: 'medium',
      },
      {
        id: 'parabolic_sar',
        name: 'Parabolic SAR',
        description: 'Trailing stop and reversal. Buy when price above SAR dots, sell when below.',
        type: 'PARABOLIC_SAR',
        params: { acceleration: 0.02, maximum: 0.2 },
        riskLevel: 'high',
      },
      {
        id: 'williams_r',
        name: 'Williams %R',
        description: 'Momentum oscillator. Buy below -80 (oversold), sell above -20 (overbought).',
        type: 'WILLIAMS_R',
        params: { period: 14, oversold: -80, overbought: -20 },
        riskLevel: 'medium',
      },
      {
        id: 'cci',
        name: 'CCI (Commodity Channel)',
        description: 'Cyclical trading. Buy below -100, sell above +100. Extreme at +/-200.',
        type: 'CCI',
        params: { period: 20, oversold: -100, overbought: 100 },
        riskLevel: 'medium',
      },
      {
        id: 'atr_breakout',
        name: 'ATR Breakout',
        description: 'Volatility breakout strategy. Buy when price breaks above SMA + 2*ATR.',
        type: 'ATR_BREAKOUT',
        params: { atrPeriod: 14, multiplier: 2, lookback: 20 },
        riskLevel: 'high',
      },
      // ===== NEW STRATEGIES =====
      {
        id: 'obv',
        name: 'OBV (On-Balance Volume)',
        description: 'Volume-based trend confirmation. Buy when OBV confirms uptrend, sell on downtrend.',
        type: 'OBV',
        params: {},
        riskLevel: 'medium',
      },
      {
        id: 'supertrend',
        name: 'SuperTrend',
        description: 'Popular trend following. Buy above SuperTrend line, sell below.',
        type: 'SUPERTREND',
        params: { period: 10, multiplier: 3 },
        riskLevel: 'medium',
      },
      {
        id: 'donchian',
        name: 'Donchian Channel',
        description: 'Breakout trading. Buy at 20-day high, sell at 20-day low.',
        type: 'DONCHIAN',
        params: { period: 20 },
        riskLevel: 'high',
      },
      {
        id: 'keltner',
        name: 'Keltner Channel',
        description: 'Smoother than Bollinger. Buy at lower band, sell at upper band.',
        type: 'KELTNER',
        params: { emaPeriod: 20, atrPeriod: 10, multiplier: 2 },
        riskLevel: 'medium',
      },
      {
        id: 'mfi',
        name: 'MFI (Money Flow Index)',
        description: 'Volume-weighted RSI. Buy below 20 (oversold), sell above 80 (overbought).',
        type: 'MFI',
        params: { period: 14 },
        riskLevel: 'medium',
      },
      {
        id: 'pivot_points',
        name: 'Pivot Points',
        description: 'Daily support/resistance levels. Buy near support, sell near resistance.',
        type: 'PIVOT_POINTS',
        params: {},
        riskLevel: 'low',
      },
      {
        id: 'fibonacci',
        name: 'Fibonacci Retracement',
        description: 'Key pullback levels at 38.2%, 50%, 61.8%. Buy at support, sell at resistance.',
        type: 'FIBONACCI',
        params: { lookback: 50 },
        riskLevel: 'medium',
      },
      {
        id: 'trix',
        name: 'TRIX',
        description: 'Triple-smoothed momentum. Filters noise, shows underlying trend.',
        type: 'TRIX',
        params: { period: 15 },
        riskLevel: 'low',
      },
      {
        id: 'aroon',
        name: 'Aroon Indicator',
        description: 'Trend strength & direction. Strong signals when Aroon Up > 70, Down < 30.',
        type: 'AROON',
        params: { period: 25 },
        riskLevel: 'medium',
      },
      {
        id: 'roc',
        name: 'Rate of Change (ROC)',
        description: 'Simple momentum. Buy when ROC > 5%, sell when ROC < -5%.',
        type: 'ROC',
        params: { period: 12 },
        riskLevel: 'medium',
      },
    ];
  }
}

module.exports = new AlgoTradingService();
