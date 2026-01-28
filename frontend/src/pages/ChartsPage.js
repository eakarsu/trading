import React, { useState, useEffect, useCallback, useRef } from 'react';
import { brokersAPI } from '../api/brokers';
import { algoTradingAPI } from '../api/algoTrading';
import '../styles/pages/ChartsPage.css';

// Generate demo data for when broker is not connected
const generateDemoData = (symbol, days = 100) => {
  const bars = [];
  let basePrice = symbol === 'AAPL' ? 175 : symbol === 'MSFT' ? 380 : symbol === 'GOOGL' ? 140 :
                  symbol === 'NVDA' ? 450 : symbol === 'TSLA' ? 250 : symbol === 'AMZN' ? 180 : 100;

  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
    basePrice = Math.max(basePrice + change, 10);

    const open = basePrice;
    const close = open + (Math.random() - 0.5) * volatility * basePrice;
    const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.5;
    const volume = Math.floor(Math.random() * 50000000) + 10000000;

    bars.push({
      timestamp: date.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    basePrice = close;
  }
  return bars;
};

// Calculate Heikin-Ashi candles
const calculateHeikinAshi = (bars) => {
  if (bars.length === 0) return [];

  const haBars = [];
  let prevHA = null;

  bars.forEach((bar, i) => {
    const open = bar.open || bar.o;
    const high = bar.high || bar.h;
    const low = bar.low || bar.l;
    const close = bar.close || bar.c;

    const haClose = (open + high + low + close) / 4;
    const haOpen = prevHA ? (prevHA.open + prevHA.close) / 2 : (open + close) / 2;
    const haHigh = Math.max(high, haOpen, haClose);
    const haLow = Math.min(low, haOpen, haClose);

    const haBar = {
      timestamp: bar.timestamp,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: bar.volume || bar.v,
    };

    haBars.push(haBar);
    prevHA = haBar;
  });

  return haBars;
};

// Calculate ALL technical indicators from bar data
const calculateIndicatorsFromBars = (bars) => {
  if (bars.length < 50) return null;

  const closes = bars.map(b => b.close || b.c);
  const highs = bars.map(b => b.high || b.h);
  const lows = bars.map(b => b.low || b.l);
  const opens = bars.map(b => b.open || b.o);
  const volumes = bars.map(b => b.volume || b.v || 0);

  // ============ MOVING AVERAGES ============

  // SMA calculation
  const sma = (data, period) => {
    if (data.length < period) return null;
    const sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  };

  // EMA calculation
  const ema = (data, period) => {
    if (data.length < period) return null;
    const multiplier = 2 / (period + 1);
    let emaValue = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      emaValue = (data[i] - emaValue) * multiplier + emaValue;
    }
    return emaValue;
  };

  // WMA (Weighted Moving Average)
  const wma = (data, period) => {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    let sum = 0;
    let weightSum = 0;
    for (let i = 0; i < period; i++) {
      const weight = i + 1;
      sum += slice[i] * weight;
      weightSum += weight;
    }
    return sum / weightSum;
  };

  // ============ MOMENTUM INDICATORS ============

  // RSI calculation
  const calculateRSI = (data, period = 14) => {
    if (data.length < period + 1) return null;
    let gains = 0, losses = 0;
    for (let i = data.length - period; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  // Stochastic Oscillator
  const calculateStochastic = (closes, highs, lows, period = 14, smoothK = 3, smoothD = 3) => {
    if (closes.length < period) return null;

    const recentCloses = closes.slice(-period);
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    const currentClose = closes[closes.length - 1];

    const k = highestHigh !== lowestLow
      ? ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
      : 50;

    // Simplified D calculation
    const d = k * 0.9;

    return { k, d };
  };

  // Williams %R
  const calculateWilliamsR = (closes, highs, lows, period = 14) => {
    if (closes.length < period) return null;

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    const currentClose = closes[closes.length - 1];

    if (highestHigh === lowestLow) return -50;
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  };

  // Momentum
  const calculateMomentum = (data, period = 10) => {
    if (data.length < period + 1) return null;
    return data[data.length - 1] - data[data.length - 1 - period];
  };

  // ROC (Rate of Change)
  const calculateROC = (data, period = 10) => {
    if (data.length < period + 1) return null;
    const prevPrice = data[data.length - 1 - period];
    if (prevPrice === 0) return 0;
    return ((data[data.length - 1] - prevPrice) / prevPrice) * 100;
  };

  // CCI (Commodity Channel Index)
  const calculateCCI = (closes, highs, lows, period = 20) => {
    if (closes.length < period) return null;

    // Calculate Typical Price
    const typicalPrices = [];
    for (let i = 0; i < closes.length; i++) {
      typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }

    const recentTP = typicalPrices.slice(-period);
    const smaTP = recentTP.reduce((a, b) => a + b, 0) / period;

    // Mean Deviation
    const meanDeviation = recentTP.reduce((sum, tp) => sum + Math.abs(tp - smaTP), 0) / period;

    if (meanDeviation === 0) return 0;
    return (typicalPrices[typicalPrices.length - 1] - smaTP) / (0.015 * meanDeviation);
  };

  // ============ TREND INDICATORS ============

  // MACD calculation
  const calculateMACD = (data) => {
    const ema12 = ema(data, 12);
    const ema26 = ema(data, 26);
    if (!ema12 || !ema26) return null;
    const macdLine = ema12 - ema26;
    const signal = macdLine * 0.8; // Simplified
    return { macdLine, signal, histogram: macdLine - signal };
  };

  // ADX (Average Directional Index)
  const calculateADX = (closes, highs, lows, period = 14) => {
    if (closes.length < period + 1) return null;

    let plusDM = 0, minusDM = 0, tr = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
      const highDiff = highs[i] - highs[i - 1];
      const lowDiff = lows[i - 1] - lows[i];

      if (highDiff > lowDiff && highDiff > 0) plusDM += highDiff;
      if (lowDiff > highDiff && lowDiff > 0) minusDM += lowDiff;

      const trueRange = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      tr += trueRange;
    }

    const plusDI = tr > 0 ? (plusDM / tr) * 100 : 0;
    const minusDI = tr > 0 ? (minusDM / tr) * 100 : 0;
    const dx = plusDI + minusDI > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;

    return { adx: dx, plusDI, minusDI };
  };

  // Parabolic SAR (simplified)
  const calculateParabolicSAR = (closes, highs, lows) => {
    if (closes.length < 5) return null;

    const af = 0.02;
    const maxAF = 0.2;

    // Simplified: return estimated SAR based on recent trend
    const recentCloses = closes.slice(-5);
    const trend = recentCloses[4] > recentCloses[0] ? 'up' : 'down';
    const recentLows = lows.slice(-5);
    const recentHighs = highs.slice(-5);

    if (trend === 'up') {
      return { sar: Math.min(...recentLows) * 0.98, trend: 'bullish' };
    } else {
      return { sar: Math.max(...recentHighs) * 1.02, trend: 'bearish' };
    }
  };

  // ============ VOLATILITY INDICATORS ============

  // Bollinger Bands
  const calculateBollinger = (data, period = 20) => {
    if (data.length < period) return null;
    const smaValue = sma(data, period);
    const slice = data.slice(-period);
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - smaValue, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    return {
      middle: smaValue,
      upper: smaValue + 2 * stdDev,
      lower: smaValue - 2 * stdDev,
      bandwidth: ((smaValue + 2 * stdDev) - (smaValue - 2 * stdDev)) / smaValue * 100,
    };
  };

  // ATR (Average True Range)
  const calculateATR = (closes, highs, lows, period = 14) => {
    if (closes.length < period + 1) return null;

    let trSum = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const trueRange = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trSum += trueRange;
    }

    return trSum / period;
  };

  // Keltner Channels
  const calculateKeltner = (closes, highs, lows, period = 20, multiplier = 2) => {
    const emaValue = ema(closes, period);
    const atr = calculateATR(closes, highs, lows, period);

    if (!emaValue || !atr) return null;

    return {
      middle: emaValue,
      upper: emaValue + multiplier * atr,
      lower: emaValue - multiplier * atr,
    };
  };

  // ============ VOLUME INDICATORS ============

  // OBV (On Balance Volume)
  const calculateOBV = (closes, volumes) => {
    if (closes.length < 2) return null;

    let obv = 0;
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv += volumes[i];
      } else if (closes[i] < closes[i - 1]) {
        obv -= volumes[i];
      }
    }

    return obv;
  };

  // VWAP (Volume Weighted Average Price)
  const calculateVWAP = (closes, highs, lows, volumes) => {
    if (closes.length === 0) return null;

    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < closes.length; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      cumulativeTPV += typicalPrice * volumes[i];
      cumulativeVolume += volumes[i];
    }

    return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null;
  };

  // MFI (Money Flow Index)
  const calculateMFI = (closes, highs, lows, volumes, period = 14) => {
    if (closes.length < period + 1) return null;

    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      const prevTypicalPrice = (highs[i - 1] + lows[i - 1] + closes[i - 1]) / 3;
      const rawMoneyFlow = typicalPrice * volumes[i];

      if (typicalPrice > prevTypicalPrice) {
        positiveFlow += rawMoneyFlow;
      } else {
        negativeFlow += rawMoneyFlow;
      }
    }

    if (negativeFlow === 0) return 100;
    const moneyRatio = positiveFlow / negativeFlow;
    return 100 - (100 / (1 + moneyRatio));
  };

  // A/D Line (Accumulation/Distribution)
  const calculateADLine = (closes, highs, lows, volumes) => {
    if (closes.length === 0) return null;

    let adLine = 0;
    for (let i = 0; i < closes.length; i++) {
      const mfm = highs[i] !== lows[i]
        ? ((closes[i] - lows[i]) - (highs[i] - closes[i])) / (highs[i] - lows[i])
        : 0;
      adLine += mfm * volumes[i];
    }

    return adLine;
  };

  // CMF (Chaikin Money Flow)
  const calculateCMF = (closes, highs, lows, volumes, period = 20) => {
    if (closes.length < period) return null;

    let mfvSum = 0;
    let volSum = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
      const mfm = highs[i] !== lows[i]
        ? ((closes[i] - lows[i]) - (highs[i] - closes[i])) / (highs[i] - lows[i])
        : 0;
      mfvSum += mfm * volumes[i];
      volSum += volumes[i];
    }

    return volSum > 0 ? mfvSum / volSum : 0;
  };

  // ============ ICHIMOKU CLOUD ============
  const calculateIchimoku = (closes, highs, lows, period1 = 9, period2 = 26, period3 = 52) => {
    if (closes.length < period3) return null;

    const highestHigh = (data, period) => Math.max(...data.slice(-period));
    const lowestLow = (data, period) => Math.min(...data.slice(-period));

    const tenkanSen = (highestHigh(highs, period1) + lowestLow(lows, period1)) / 2;
    const kijunSen = (highestHigh(highs, period2) + lowestLow(lows, period2)) / 2;
    const senkouSpanA = (tenkanSen + kijunSen) / 2;
    const senkouSpanB = (highestHigh(highs, period3) + lowestLow(lows, period3)) / 2;
    const chikouSpan = closes[closes.length - 1];

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikouSpan,
      cloudTop: Math.max(senkouSpanA, senkouSpanB),
      cloudBottom: Math.min(senkouSpanA, senkouSpanB),
      cloudColor: senkouSpanA > senkouSpanB ? 'bullish' : 'bearish',
    };
  };

  // ============ PIVOT POINTS ============
  const calculatePivotPoints = (closes, highs, lows) => {
    const high = highs[highs.length - 1];
    const low = lows[lows.length - 1];
    const close = closes[closes.length - 1];

    const pivot = (high + low + close) / 3;
    const r1 = 2 * pivot - low;
    const s1 = 2 * pivot - high;
    const r2 = pivot + (high - low);
    const s2 = pivot - (high - low);
    const r3 = high + 2 * (pivot - low);
    const s3 = low - 2 * (high - pivot);

    return { pivot, r1, r2, r3, s1, s2, s3 };
  };

  // Calculate all indicators
  return {
    indicators: {
      // Moving Averages
      sma: { sma20: sma(closes, 20), sma50: sma(closes, 50), sma200: sma(closes, 200) },
      ema: { ema12: ema(closes, 12), ema26: ema(closes, 26), ema50: ema(closes, 50) },
      wma: { wma20: wma(closes, 20) },

      // Momentum
      rsi: calculateRSI(closes),
      stochastic: calculateStochastic(closes, highs, lows),
      williamsR: calculateWilliamsR(closes, highs, lows),
      momentum: calculateMomentum(closes),
      roc: calculateROC(closes),
      cci: calculateCCI(closes, highs, lows),

      // Trend
      macd: calculateMACD(closes),
      adx: calculateADX(closes, highs, lows),
      parabolicSAR: calculateParabolicSAR(closes, highs, lows),

      // Volatility
      bollinger: calculateBollinger(closes),
      atr: calculateATR(closes, highs, lows),
      keltner: calculateKeltner(closes, highs, lows),

      // Volume
      obv: calculateOBV(closes, volumes),
      vwap: calculateVWAP(closes, highs, lows, volumes),
      mfi: calculateMFI(closes, highs, lows, volumes),
      adLine: calculateADLine(closes, highs, lows, volumes),
      cmf: calculateCMF(closes, highs, lows, volumes),

      // Advanced
      ichimoku: calculateIchimoku(closes, highs, lows),
      pivotPoints: calculatePivotPoints(closes, highs, lows),
    },
    currentPrice: closes[closes.length - 1],
  };
};

const ChartsPage = () => {
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [symbol, setSymbol] = useState('AAPL');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [timeframe, setTimeframe] = useState('1Day');
  const [chartType, setChartType] = useState('candlestick');
  const [bars, setBars] = useState([]);
  const [quote, setQuote] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [selectedIndicators, setSelectedIndicators] = useState(['sma', 'volume']);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [indicatorCategory, setIndicatorCategory] = useState('all');
  const canvasRef = useRef(null);

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
  ];

  const chartTypes = [
    { id: 'candlestick', name: 'Candlestick', icon: '📊' },
    { id: 'ohlc', name: 'OHLC Bars', icon: '📈' },
    { id: 'line', name: 'Line', icon: '📉' },
    { id: 'area', name: 'Area', icon: '🌊' },
    { id: 'mountain', name: 'Mountain', icon: '⛰️' },
    { id: 'heikinashi', name: 'Heikin-Ashi', icon: '🎌' },
    { id: 'baseline', name: 'Baseline', icon: '➖' },
  ];

  const indicatorCategories = [
    { id: 'all', name: 'All' },
    { id: 'ma', name: 'Moving Avg' },
    { id: 'momentum', name: 'Momentum' },
    { id: 'trend', name: 'Trend' },
    { id: 'volatility', name: 'Volatility' },
    { id: 'volume', name: 'Volume' },
  ];

  const availableIndicators = [
    // Moving Averages
    { id: 'sma', name: 'SMA', description: '20, 50, 200', color: '#3b82f6', category: 'ma' },
    { id: 'ema', name: 'EMA', description: '12, 26, 50', color: '#8b5cf6', category: 'ma' },
    { id: 'wma', name: 'WMA', description: 'Weighted', color: '#06b6d4', category: 'ma' },

    // Momentum
    { id: 'rsi', name: 'RSI', description: '14', color: '#22c55e', category: 'momentum' },
    { id: 'stochastic', name: 'Stoch', description: '%K %D', color: '#f59e0b', category: 'momentum' },
    { id: 'williamsR', name: 'Will %R', description: '14', color: '#ec4899', category: 'momentum' },
    { id: 'momentum', name: 'MOM', description: '10', color: '#14b8a6', category: 'momentum' },
    { id: 'roc', name: 'ROC', description: '10', color: '#f97316', category: 'momentum' },
    { id: 'cci', name: 'CCI', description: '20', color: '#84cc16', category: 'momentum' },
    { id: 'mfi', name: 'MFI', description: '14', color: '#a855f7', category: 'momentum' },

    // Trend
    { id: 'macd', name: 'MACD', description: '12,26,9', color: '#ef4444', category: 'trend' },
    { id: 'adx', name: 'ADX', description: '14', color: '#6366f1', category: 'trend' },
    { id: 'parabolicSAR', name: 'SAR', description: 'Parabolic', color: '#f43f5e', category: 'trend' },
    { id: 'ichimoku', name: 'Ichimoku', description: 'Cloud', color: '#0ea5e9', category: 'trend' },

    // Volatility
    { id: 'bollinger', name: 'BB', description: 'Bollinger', color: '#f59e0b', category: 'volatility' },
    { id: 'atr', name: 'ATR', description: '14', color: '#10b981', category: 'volatility' },
    { id: 'keltner', name: 'KC', description: 'Keltner', color: '#7c3aed', category: 'volatility' },

    // Volume
    { id: 'volume', name: 'Volume', description: 'Bars', color: '#6b7280', category: 'volume' },
    { id: 'obv', name: 'OBV', description: 'On Balance', color: '#0d9488', category: 'volume' },
    { id: 'vwap', name: 'VWAP', description: 'Avg Price', color: '#dc2626', category: 'volume' },
    { id: 'cmf', name: 'CMF', description: 'Chaikin', color: '#7c2d12', category: 'volume' },
  ];

  const filteredIndicators = indicatorCategory === 'all'
    ? availableIndicators
    : availableIndicators.filter(ind => ind.category === indicatorCategory);

  const filteredStocks = popularStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      stock.name.toLowerCase().includes(symbolSearch.toLowerCase())
  );

  const checkBrokerStatus = useCallback(async () => {
    try {
      const response = await brokersAPI.getStatus();
      if (response?.success && response?.data?.totalConnected > 0) {
        setIsBrokerConnected(true);
        setIsDemo(false);
        return true;
      }
      setIsBrokerConnected(false);
      return false;
    } catch (err) {
      console.error('Broker status check failed:', err);
      setIsBrokerConnected(false);
      return false;
    }
  }, []);

  const fetchChartData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isBrokerConnected) {
        const end = new Date();
        const start = new Date();

        switch (timeframe) {
          case '1Min': start.setHours(start.getHours() - 4); break;
          case '5Min': start.setHours(start.getHours() - 12); break;
          case '15Min': start.setDate(start.getDate() - 2); break;
          case '1Hour': start.setDate(start.getDate() - 7); break;
          case '1Day':
          default: start.setMonth(start.getMonth() - 6); break;
        }

        const [barsRes, quoteRes, indicatorsRes] = await Promise.all([
          brokersAPI.getBars(symbol, timeframe, start.toISOString(), end.toISOString(), 100),
          brokersAPI.getQuote(symbol),
          algoTradingAPI.calculateIndicators(symbol, selectedIndicators, timeframe),
        ]);

        if (barsRes.success && barsRes.data?.length > 0) {
          setBars(barsRes.data);
          setIndicators(calculateIndicatorsFromBars(barsRes.data));
          setIsDemo(false);
        } else {
          const demoData = generateDemoData(symbol);
          setBars(demoData);
          setIndicators(calculateIndicatorsFromBars(demoData));
          setIsDemo(true);
        }

        if (quoteRes.success) setQuote(quoteRes.data);
      } else {
        const demoData = generateDemoData(symbol);
        setBars(demoData);
        setIndicators(calculateIndicatorsFromBars(demoData));
        setIsDemo(true);

        const lastBar = demoData[demoData.length - 1];
        const prevBar = demoData[demoData.length - 2];
        setQuote({
          symbol,
          price: lastBar.close,
          high: lastBar.high,
          low: lastBar.low,
          open: lastBar.open,
          volume: lastBar.volume,
          change: lastBar.close - prevBar.close,
          changePercent: ((lastBar.close - prevBar.close) / prevBar.close) * 100,
        });
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      const demoData = generateDemoData(symbol);
      setBars(demoData);
      setIndicators(calculateIndicatorsFromBars(demoData));
      setIsDemo(true);

      const lastBar = demoData[demoData.length - 1];
      const prevBar = demoData[demoData.length - 2];
      setQuote({
        symbol,
        price: lastBar.close,
        high: lastBar.high,
        low: lastBar.low,
        change: lastBar.close - prevBar.close,
        changePercent: ((lastBar.close - prevBar.close) / prevBar.close) * 100,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isBrokerConnected, symbol, timeframe, selectedIndicators]);

  useEffect(() => {
    const init = async () => {
      await checkBrokerStatus();
      await fetchChartData();
    };
    init();
  }, [checkBrokerStatus, fetchChartData]);

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || bars.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 80, bottom: 40, left: 10 };

    const hasBottomIndicator = selectedIndicators.some(ind =>
      ['rsi', 'macd', 'volume', 'stochastic', 'williamsR', 'cci', 'mfi', 'adx', 'obv', 'cmf', 'momentum', 'roc'].includes(ind)
    );
    const mainChartHeight = hasBottomIndicator ? (height - padding.top - padding.bottom) * 0.65 : height - padding.top - padding.bottom;
    const bottomChartHeight = hasBottomIndicator ? (height - padding.top - padding.bottom) * 0.28 : 0;
    const bottomChartTop = padding.top + mainChartHeight + 25;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const renderBars = chartType === 'heikinashi' ? calculateHeikinAshi(bars) : bars;

    const prices = renderBars.flatMap((b) => [b.high || b.h, b.low || b.l]).filter(p => p);
    if (prices.length === 0) return;

    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);

    // Extend price range for indicators
    if (selectedIndicators.includes('bollinger') && indicators?.indicators?.bollinger) {
      const bb = indicators.indicators.bollinger;
      if (bb.upper) maxPrice = Math.max(maxPrice, bb.upper);
      if (bb.lower) minPrice = Math.min(minPrice, bb.lower);
    }
    if (selectedIndicators.includes('keltner') && indicators?.indicators?.keltner) {
      const kc = indicators.indicators.keltner;
      if (kc.upper) maxPrice = Math.max(maxPrice, kc.upper);
      if (kc.lower) minPrice = Math.min(minPrice, kc.lower);
    }
    if (selectedIndicators.includes('ichimoku') && indicators?.indicators?.ichimoku) {
      const ich = indicators.indicators.ichimoku;
      maxPrice = Math.max(maxPrice, ich.cloudTop);
      minPrice = Math.min(minPrice, ich.cloudBottom);
    }

    minPrice *= 0.995;
    maxPrice *= 1.005;
    const priceRange = maxPrice - minPrice;

    const candleWidth = (width - padding.left - padding.right) / renderBars.length;
    const bodyWidth = Math.max(candleWidth * 0.7, 2);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange * i) / 5;
      const y = padding.top + mainChartHeight - (mainChartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillText(`$${price.toFixed(2)}`, width - 5, y + 4);
    }

    // Draw Ichimoku Cloud
    if (selectedIndicators.includes('ichimoku') && indicators?.indicators?.ichimoku) {
      const ich = indicators.indicators.ichimoku;
      const cloudTopY = padding.top + mainChartHeight - ((ich.cloudTop - minPrice) / priceRange) * mainChartHeight;
      const cloudBottomY = padding.top + mainChartHeight - ((ich.cloudBottom - minPrice) / priceRange) * mainChartHeight;

      ctx.fillStyle = ich.cloudColor === 'bullish' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(padding.left, cloudTopY, width - padding.left - padding.right, cloudBottomY - cloudTopY);

      // Tenkan-sen (Conversion Line)
      const tenkanY = padding.top + mainChartHeight - ((ich.tenkanSen - minPrice) / priceRange) * mainChartHeight;
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, tenkanY);
      ctx.lineTo(width - padding.right, tenkanY);
      ctx.stroke();

      // Kijun-sen (Base Line)
      const kijunY = padding.top + mainChartHeight - ((ich.kijunSen - minPrice) / priceRange) * mainChartHeight;
      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(padding.left, kijunY);
      ctx.lineTo(width - padding.right, kijunY);
      ctx.stroke();
    }

    // Draw Bollinger Bands
    if (selectedIndicators.includes('bollinger') && indicators?.indicators?.bollinger) {
      const bb = indicators.indicators.bollinger;
      if (bb.upper && bb.lower && bb.middle) {
        const yUpper = padding.top + mainChartHeight - ((bb.upper - minPrice) / priceRange) * mainChartHeight;
        const yLower = padding.top + mainChartHeight - ((bb.lower - minPrice) / priceRange) * mainChartHeight;
        const yMiddle = padding.top + mainChartHeight - ((bb.middle - minPrice) / priceRange) * mainChartHeight;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
        ctx.fillRect(padding.left, yUpper, width - padding.left - padding.right, yLower - yUpper);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        [yUpper, yMiddle, yLower].forEach(y => {
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }
    }

    // Draw Keltner Channels
    if (selectedIndicators.includes('keltner') && indicators?.indicators?.keltner) {
      const kc = indicators.indicators.keltner;
      if (kc.upper && kc.lower && kc.middle) {
        const yUpper = padding.top + mainChartHeight - ((kc.upper - minPrice) / priceRange) * mainChartHeight;
        const yLower = padding.top + mainChartHeight - ((kc.lower - minPrice) / priceRange) * mainChartHeight;
        const yMiddle = padding.top + mainChartHeight - ((kc.middle - minPrice) / priceRange) * mainChartHeight;

        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1;
        [yUpper, yMiddle, yLower].forEach(y => {
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
        });
      }
    }

    // Calculate baseline
    const closes = renderBars.map(b => b.close || b.c);
    const baseline = closes.reduce((a, b) => a + b, 0) / closes.length;

    // Draw chart based on type
    if (chartType === 'candlestick' || chartType === 'heikinashi') {
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const openPrice = bar.open || bar.o;
        const closePrice = bar.close || bar.c;
        const highPrice = bar.high || bar.h;
        const lowPrice = bar.low || bar.l;

        const open = padding.top + mainChartHeight - ((openPrice - minPrice) / priceRange) * mainChartHeight;
        const close = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
        const high = padding.top + mainChartHeight - ((highPrice - minPrice) / priceRange) * mainChartHeight;
        const low = padding.top + mainChartHeight - ((lowPrice - minPrice) / priceRange) * mainChartHeight;

        const isGreen = closePrice >= openPrice;
        const color = isGreen ? '#22c55e' : '#ef4444';

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(x, high);
        ctx.lineTo(x, low);
        ctx.stroke();

        const bodyTop = Math.min(open, close);
        const bodyHeight = Math.max(Math.abs(close - open), 1);
        ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
      });
    } else if (chartType === 'ohlc') {
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const openPrice = bar.open || bar.o;
        const closePrice = bar.close || bar.c;
        const highPrice = bar.high || bar.h;
        const lowPrice = bar.low || bar.l;

        const open = padding.top + mainChartHeight - ((openPrice - minPrice) / priceRange) * mainChartHeight;
        const close = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
        const high = padding.top + mainChartHeight - ((highPrice - minPrice) / priceRange) * mainChartHeight;
        const low = padding.top + mainChartHeight - ((lowPrice - minPrice) / priceRange) * mainChartHeight;

        const isGreen = closePrice >= openPrice;
        ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(x, high);
        ctx.lineTo(x, low);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - bodyWidth / 2, open);
        ctx.lineTo(x, open);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, close);
        ctx.lineTo(x + bodyWidth / 2, close);
        ctx.stroke();
      });
    } else if (chartType === 'line') {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const closePrice = bar.close || bar.c;
        const y = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else if (chartType === 'area') {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + mainChartHeight);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

      ctx.beginPath();
      ctx.moveTo(padding.left + candleWidth / 2, padding.top + mainChartHeight);
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const closePrice = bar.close || bar.c;
        const y = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(padding.left + (renderBars.length - 1) * candleWidth + candleWidth / 2, padding.top + mainChartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const closePrice = bar.close || bar.c;
        const y = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else if (chartType === 'mountain') {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + mainChartHeight);
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
      gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.3)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');

      ctx.beginPath();
      ctx.moveTo(padding.left + candleWidth / 2, padding.top + mainChartHeight);
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const closePrice = bar.close || bar.c;
        const y = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(padding.left + (renderBars.length - 1) * candleWidth + candleWidth / 2, padding.top + mainChartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const closePrice = bar.close || bar.c;
        const y = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (chartType === 'baseline') {
      const baselineY = padding.top + mainChartHeight - ((baseline - minPrice) / priceRange) * mainChartHeight;

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, baselineY);
      ctx.lineTo(width - padding.right, baselineY);
      ctx.stroke();
      ctx.setLineDash([]);

      renderBars.forEach((bar, i) => {
        if (i > 0) {
          const x = padding.left + i * candleWidth + candleWidth / 2;
          const closePrice = bar.close || bar.c;
          const y = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
          const prevBar = renderBars[i - 1];
          const prevX = padding.left + (i - 1) * candleWidth + candleWidth / 2;
          const prevClosePrice = prevBar.close || prevBar.c;
          const prevY = padding.top + mainChartHeight - ((prevClosePrice - minPrice) / priceRange) * mainChartHeight;

          ctx.beginPath();
          ctx.moveTo(prevX, baselineY);
          ctx.lineTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.lineTo(x, baselineY);
          ctx.closePath();
          ctx.fillStyle = ((y + prevY) / 2) < baselineY ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
          ctx.fill();
        }
      });

      ctx.lineWidth = 2;
      ctx.beginPath();
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const closePrice = bar.close || bar.c;
        const y = padding.top + mainChartHeight - ((closePrice - minPrice) / priceRange) * mainChartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else {
          ctx.strokeStyle = closePrice >= baseline ? '#22c55e' : '#ef4444';
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      });

      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Baseline: $${baseline.toFixed(2)}`, padding.left + 5, baselineY - 5);
    }

    // Draw Parabolic SAR
    if (selectedIndicators.includes('parabolicSAR') && indicators?.indicators?.parabolicSAR) {
      const sar = indicators.indicators.parabolicSAR;
      const sarY = padding.top + mainChartHeight - ((sar.sar - minPrice) / priceRange) * mainChartHeight;

      ctx.fillStyle = sar.trend === 'bullish' ? '#22c55e' : '#ef4444';
      renderBars.forEach((bar, i) => {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        ctx.beginPath();
        ctx.arc(x, sarY, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw Moving Averages
    if (selectedIndicators.includes('sma') && indicators?.indicators?.sma) {
      const { sma20, sma50, sma200 } = indicators.indicators.sma;
      const smaLines = [
        { value: sma20, color: '#3b82f6', label: 'SMA20' },
        { value: sma50, color: '#8b5cf6', label: 'SMA50' },
        { value: sma200, color: '#f59e0b', label: 'SMA200' },
      ];

      smaLines.forEach(({ value, color, label }) => {
        if (value) {
          const y = padding.top + mainChartHeight - ((value - minPrice) / priceRange) * mainChartHeight;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${label}: $${value.toFixed(2)}`, width - 5, y - 3);
        }
      });
    }

    if (selectedIndicators.includes('ema') && indicators?.indicators?.ema) {
      const { ema12, ema26, ema50 } = indicators.indicators.ema;
      const emaLines = [
        { value: ema12, color: '#06b6d4', label: 'EMA12' },
        { value: ema26, color: '#ec4899', label: 'EMA26' },
        { value: ema50, color: '#14b8a6', label: 'EMA50' },
      ];

      emaLines.forEach(({ value, color, label }) => {
        if (value) {
          const y = padding.top + mainChartHeight - ((value - minPrice) / priceRange) * mainChartHeight;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    if (selectedIndicators.includes('vwap') && indicators?.indicators?.vwap) {
      const vwap = indicators.indicators.vwap;
      const y = padding.top + mainChartHeight - ((vwap - minPrice) / priceRange) * mainChartHeight;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`VWAP: $${vwap.toFixed(2)}`, width - 5, y - 3);
    }

    // Draw bottom indicator panel
    if (hasBottomIndicator) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, bottomChartTop - 10);
      ctx.lineTo(width - padding.right, bottomChartTop - 10);
      ctx.stroke();

      // Volume
      if (selectedIndicators.includes('volume')) {
        const maxVolume = Math.max(...renderBars.map((b) => b.volume || b.v || 0));
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Volume', width - 5, bottomChartTop + 12);

        renderBars.forEach((bar, i) => {
          const x = padding.left + i * candleWidth + candleWidth / 2;
          const vol = bar.volume || bar.v || 0;
          const vHeight = (vol / maxVolume) * bottomChartHeight;
          const closePrice = bar.close || bar.c;
          const openPrice = bar.open || bar.o;
          ctx.fillStyle = closePrice >= openPrice ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
          ctx.fillRect(x - bodyWidth / 2, bottomChartTop + bottomChartHeight - vHeight, bodyWidth, vHeight);
        });
      }

      // RSI
      if (selectedIndicators.includes('rsi') && indicators?.indicators?.rsi !== undefined) {
        const rsiValue = indicators.indicators.rsi;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(padding.left, bottomChartTop, width - padding.left - padding.right, bottomChartHeight * 0.3);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
        ctx.fillRect(padding.left, bottomChartTop + bottomChartHeight * 0.7, width - padding.left - padding.right, bottomChartHeight * 0.3);

        ctx.strokeStyle = '#475569';
        ctx.setLineDash([2, 2]);
        [30, 50, 70].forEach(level => {
          const y = bottomChartTop + bottomChartHeight - (level / 100) * bottomChartHeight;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        const rsiY = bottomChartTop + bottomChartHeight - (rsiValue / 100) * bottomChartHeight;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, rsiY);
        ctx.lineTo(width - padding.right, rsiY);
        ctx.stroke();

        ctx.fillStyle = rsiValue < 30 ? '#22c55e' : rsiValue > 70 ? '#ef4444' : '#64748b';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`RSI: ${rsiValue.toFixed(1)}`, width - 5, rsiY - 5);
      }

      // Stochastic
      if (selectedIndicators.includes('stochastic') && indicators?.indicators?.stochastic) {
        const { k, d } = indicators.indicators.stochastic;
        const kY = bottomChartTop + bottomChartHeight - (k / 100) * bottomChartHeight;
        const dY = bottomChartTop + bottomChartHeight - (d / 100) * bottomChartHeight;

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, kY);
        ctx.lineTo(width - padding.right, kY);
        ctx.stroke();

        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(padding.left, dY);
        ctx.lineTo(width - padding.right, dY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Stoch %K: ${k.toFixed(1)} %D: ${d.toFixed(1)}`, width - 5, bottomChartTop + 12);
      }

      // Williams %R
      if (selectedIndicators.includes('williamsR') && indicators?.indicators?.williamsR !== undefined) {
        const wr = indicators.indicators.williamsR;
        const wrY = bottomChartTop + bottomChartHeight - ((wr + 100) / 100) * bottomChartHeight;

        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, wrY);
        ctx.lineTo(width - padding.right, wrY);
        ctx.stroke();

        ctx.fillStyle = wr > -20 ? '#ef4444' : wr < -80 ? '#22c55e' : '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Williams %R: ${wr.toFixed(1)}`, width - 5, bottomChartTop + 12);
      }

      // CCI
      if (selectedIndicators.includes('cci') && indicators?.indicators?.cci !== undefined) {
        const cci = indicators.indicators.cci;
        const cciNorm = Math.max(-200, Math.min(200, cci));
        const cciY = bottomChartTop + bottomChartHeight / 2 - (cciNorm / 200) * (bottomChartHeight / 2);

        ctx.strokeStyle = '#475569';
        ctx.setLineDash([2, 2]);
        [-100, 0, 100].forEach(level => {
          const y = bottomChartTop + bottomChartHeight / 2 - (level / 200) * (bottomChartHeight / 2);
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        ctx.strokeStyle = '#84cc16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, cciY);
        ctx.lineTo(width - padding.right, cciY);
        ctx.stroke();

        ctx.fillStyle = cci > 100 ? '#ef4444' : cci < -100 ? '#22c55e' : '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`CCI: ${cci.toFixed(1)}`, width - 5, bottomChartTop + 12);
      }

      // MFI
      if (selectedIndicators.includes('mfi') && indicators?.indicators?.mfi !== undefined) {
        const mfi = indicators.indicators.mfi;
        const mfiY = bottomChartTop + bottomChartHeight - (mfi / 100) * bottomChartHeight;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(padding.left, bottomChartTop, width - padding.left - padding.right, bottomChartHeight * 0.2);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
        ctx.fillRect(padding.left, bottomChartTop + bottomChartHeight * 0.8, width - padding.left - padding.right, bottomChartHeight * 0.2);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, mfiY);
        ctx.lineTo(width - padding.right, mfiY);
        ctx.stroke();

        ctx.fillStyle = mfi > 80 ? '#ef4444' : mfi < 20 ? '#22c55e' : '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`MFI: ${mfi.toFixed(1)}`, width - 5, bottomChartTop + 12);
      }

      // MACD
      if (selectedIndicators.includes('macd') && indicators?.indicators?.macd) {
        const { histogram, macdLine, signal } = indicators.indicators.macd;
        const zeroY = bottomChartTop + bottomChartHeight / 2;

        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(padding.left, zeroY);
        ctx.lineTo(width - padding.right, zeroY);
        ctx.stroke();

        const histHeight = Math.min(Math.abs(histogram) * 50, bottomChartHeight / 2);
        ctx.fillStyle = histogram > 0 ? '#22c55e' : '#ef4444';
        ctx.fillRect(width - padding.right - 60, zeroY - (histogram > 0 ? histHeight : 0), 50, histHeight);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`MACD: ${macdLine?.toFixed(3)} Signal: ${signal?.toFixed(3)}`, width - 5, bottomChartTop + 12);
      }

      // ADX
      if (selectedIndicators.includes('adx') && indicators?.indicators?.adx) {
        const { adx, plusDI, minusDI } = indicators.indicators.adx;
        const adxY = bottomChartTop + bottomChartHeight - (adx / 100) * bottomChartHeight;

        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, adxY);
        ctx.lineTo(width - padding.right, adxY);
        ctx.stroke();

        ctx.fillStyle = adx > 25 ? '#22c55e' : '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`ADX: ${adx.toFixed(1)} +DI: ${plusDI.toFixed(1)} -DI: ${minusDI.toFixed(1)}`, width - 5, bottomChartTop + 12);
      }

      // Momentum
      if (selectedIndicators.includes('momentum') && indicators?.indicators?.momentum !== undefined) {
        const mom = indicators.indicators.momentum;
        const zeroY = bottomChartTop + bottomChartHeight / 2;
        const momNorm = Math.max(-20, Math.min(20, mom));
        const momY = zeroY - (momNorm / 20) * (bottomChartHeight / 2);

        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(padding.left, zeroY);
        ctx.lineTo(width - padding.right, zeroY);
        ctx.stroke();

        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, momY);
        ctx.lineTo(width - padding.right, momY);
        ctx.stroke();

        ctx.fillStyle = mom > 0 ? '#22c55e' : '#ef4444';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Momentum: ${mom.toFixed(2)}`, width - 5, bottomChartTop + 12);
      }

      // ROC
      if (selectedIndicators.includes('roc') && indicators?.indicators?.roc !== undefined) {
        const roc = indicators.indicators.roc;
        const zeroY = bottomChartTop + bottomChartHeight / 2;
        const rocNorm = Math.max(-20, Math.min(20, roc));
        const rocY = zeroY - (rocNorm / 20) * (bottomChartHeight / 2);

        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(padding.left, zeroY);
        ctx.lineTo(width - padding.right, zeroY);
        ctx.stroke();

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, rocY);
        ctx.lineTo(width - padding.right, rocY);
        ctx.stroke();

        ctx.fillStyle = roc > 0 ? '#22c55e' : '#ef4444';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`ROC: ${roc.toFixed(2)}%`, width - 5, bottomChartTop + 12);
      }

      // OBV
      if (selectedIndicators.includes('obv') && indicators?.indicators?.obv !== undefined) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        const obvFormatted = indicators.indicators.obv >= 1e9
          ? `${(indicators.indicators.obv / 1e9).toFixed(2)}B`
          : indicators.indicators.obv >= 1e6
          ? `${(indicators.indicators.obv / 1e6).toFixed(2)}M`
          : `${(indicators.indicators.obv / 1e3).toFixed(0)}K`;
        ctx.fillText(`OBV: ${obvFormatted}`, width - 5, bottomChartTop + 12);
      }

      // CMF
      if (selectedIndicators.includes('cmf') && indicators?.indicators?.cmf !== undefined) {
        const cmf = indicators.indicators.cmf;
        const zeroY = bottomChartTop + bottomChartHeight / 2;
        const cmfY = zeroY - cmf * bottomChartHeight;

        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(padding.left, zeroY);
        ctx.lineTo(width - padding.right, zeroY);
        ctx.stroke();

        ctx.fillStyle = cmf > 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        ctx.fillRect(width - padding.right - 60, Math.min(zeroY, cmfY), 50, Math.abs(cmfY - zeroY));

        ctx.fillStyle = cmf > 0 ? '#22c55e' : '#ef4444';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`CMF: ${cmf.toFixed(3)}`, width - 5, bottomChartTop + 12);
      }
    }

    // Date labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const labelInterval = Math.floor(renderBars.length / 5);
    renderBars.forEach((bar, i) => {
      if (i % labelInterval === 0 || i === renderBars.length - 1) {
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const date = new Date(bar.timestamp);
        ctx.fillText(`${date.getMonth() + 1}/${date.getDate()}`, x, height - 5);
      }
    });

  }, [bars, indicators, selectedIndicators, chartType]);

  const handleSelectSymbol = (selectedSymbol) => {
    setSymbol(selectedSymbol);
    setSymbolSearch('');
    setShowSymbolDropdown(false);
  };

  const toggleIndicator = (indicatorId) => {
    setSelectedIndicators((prev) =>
      prev.includes(indicatorId) ? prev.filter((i) => i !== indicatorId) : [...prev, indicatorId]
    );
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatVolume = (value) => {
    if (!value) return '-';
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toString();
  };

  return (
    <div className="charts-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Charts</h1>
          {isDemo && <span className="demo-badge">Demo Data</span>}
          {!isDemo && isBrokerConnected && <span className="live-badge">Live</span>}
        </div>
        <div className="header-controls">
          <div className="symbol-select">
            <input
              type="text"
              value={symbolSearch || symbol}
              onChange={(e) => { setSymbolSearch(e.target.value.toUpperCase()); setShowSymbolDropdown(true); }}
              onFocus={() => setShowSymbolDropdown(true)}
              onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
              placeholder="Symbol"
            />
            {showSymbolDropdown && (
              <div className="symbol-dropdown">
                {filteredStocks.map((stock) => (
                  <div key={stock.symbol} className="symbol-option" onClick={() => handleSelectSymbol(stock.symbol)}>
                    <span className="symbol-code">{stock.symbol}</span>
                    <span className="symbol-name">{stock.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="1Min">1 Min</option>
            <option value="5Min">5 Min</option>
            <option value="15Min">15 Min</option>
            <option value="1Hour">1 Hour</option>
            <option value="1Day">1 Day</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchChartData} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {quote && (
        <div className="quote-bar">
          <div className="quote-symbol">{symbol}</div>
          <div className="quote-price">{formatCurrency(quote.price || quote.last || quote.close)}</div>
          <div className={`quote-change ${(quote.changePercent || 0) >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
          </div>
          <div className="quote-details">
            <span>O: {formatCurrency(quote.open)}</span>
            <span>H: {formatCurrency(quote.high)}</span>
            <span>L: {formatCurrency(quote.low)}</span>
            <span>Vol: {formatVolume(quote.volume)}</span>
          </div>
        </div>
      )}

      <div className="chart-type-bar">
        <span className="chart-type-label">Chart Type:</span>
        <div className="chart-type-buttons">
          {chartTypes.map((type) => (
            <button
              key={type.id}
              className={`chart-type-btn ${chartType === type.id ? 'active' : ''}`}
              onClick={() => setChartType(type.id)}
              title={type.name}
            >
              <span className="chart-type-icon">{type.icon}</span>
              <span className="chart-type-name">{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="indicators-bar">
        <span className="indicators-label">Indicators:</span>
        <div className="indicator-categories">
          {indicatorCategories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${indicatorCategory === cat.id ? 'active' : ''}`}
              onClick={() => setIndicatorCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="indicator-chips">
          {filteredIndicators.map((ind) => (
            <button
              key={ind.id}
              className={`indicator-chip ${selectedIndicators.includes(ind.id) ? 'active' : ''}`}
              onClick={() => toggleIndicator(ind.id)}
              style={{ borderColor: selectedIndicators.includes(ind.id) ? ind.color : undefined }}
              title={ind.description}
            >
              <span className="chip-name">{ind.name}</span>
              <span className="chip-desc">{ind.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        {isLoading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading chart data...</p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="chart-canvas" />
        )}
      </div>

      {indicators?.indicators && (
        <div className="indicator-values">
          {indicators.indicators.rsi !== undefined && (
            <div className={`indicator-value ${indicators.indicators.rsi < 30 ? 'oversold' : indicators.indicators.rsi > 70 ? 'overbought' : ''}`}>
              <span className="ind-label">RSI (14)</span>
              <span className="ind-value">{indicators.indicators.rsi.toFixed(2)}</span>
            </div>
          )}
          {indicators.indicators.stochastic && (
            <div className={`indicator-value ${indicators.indicators.stochastic.k < 20 ? 'oversold' : indicators.indicators.stochastic.k > 80 ? 'overbought' : ''}`}>
              <span className="ind-label">Stoch %K</span>
              <span className="ind-value">{indicators.indicators.stochastic.k.toFixed(2)}</span>
            </div>
          )}
          {indicators.indicators.macd && (
            <div className={`indicator-value ${indicators.indicators.macd.histogram > 0 ? 'bullish' : 'bearish'}`}>
              <span className="ind-label">MACD</span>
              <span className="ind-value">{indicators.indicators.macd.histogram?.toFixed(4)}</span>
            </div>
          )}
          {indicators.indicators.atr !== undefined && (
            <div className="indicator-value">
              <span className="ind-label">ATR (14)</span>
              <span className="ind-value">{indicators.indicators.atr.toFixed(2)}</span>
            </div>
          )}
          {indicators.indicators.adx && (
            <div className={`indicator-value ${indicators.indicators.adx.adx > 25 ? 'bullish' : ''}`}>
              <span className="ind-label">ADX</span>
              <span className="ind-value">{indicators.indicators.adx.adx.toFixed(2)}</span>
            </div>
          )}
          {indicators.indicators.cci !== undefined && (
            <div className={`indicator-value ${indicators.indicators.cci > 100 ? 'overbought' : indicators.indicators.cci < -100 ? 'oversold' : ''}`}>
              <span className="ind-label">CCI</span>
              <span className="ind-value">{indicators.indicators.cci.toFixed(2)}</span>
            </div>
          )}
          {indicators.indicators.mfi !== undefined && (
            <div className={`indicator-value ${indicators.indicators.mfi > 80 ? 'overbought' : indicators.indicators.mfi < 20 ? 'oversold' : ''}`}>
              <span className="ind-label">MFI</span>
              <span className="ind-value">{indicators.indicators.mfi.toFixed(2)}</span>
            </div>
          )}
          {indicators.indicators.vwap !== undefined && (
            <div className="indicator-value">
              <span className="ind-label">VWAP</span>
              <span className="ind-value">{formatCurrency(indicators.indicators.vwap)}</span>
            </div>
          )}
          {indicators.currentPrice && (
            <div className="indicator-value highlight">
              <span className="ind-label">Current</span>
              <span className="ind-value">{formatCurrency(indicators.currentPrice)}</span>
            </div>
          )}
        </div>
      )}

      {!isBrokerConnected && (
        <div className="connection-notice">
          Connect to a broker in Command Center for live market data. Currently showing demo data.
        </div>
      )}
    </div>
  );
};

export default ChartsPage;
