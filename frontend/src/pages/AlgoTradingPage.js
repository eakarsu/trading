import React, { useState, useEffect, useCallback } from 'react';
import { algoTradingAPI } from '../api/algoTrading';
import { alpacaAPI } from '../api/alpaca';
import '../styles/pages/AlgoTradingPage.css';

const AlgoTradingPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('builder');

  // Strategy builder state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customStrategy, setCustomStrategy] = useState({
    type: 'rsi',
    params: {},
  });

  // Symbol state
  const [symbol, setSymbol] = useState('AAPL');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [timeframe, setTimeframe] = useState('1Day');

  // Top 50 Major Stocks List (Market Cap > $10B)
  const popularStocks = [
    // Tech Giants
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'AVGO', name: 'Broadcom Inc.' },
    { symbol: 'ADBE', name: 'Adobe Inc.' },
    { symbol: 'CRM', name: 'Salesforce Inc.' },
    { symbol: 'ORCL', name: 'Oracle Corporation' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
    { symbol: 'ACN', name: 'Accenture PLC' },
    { symbol: 'TXN', name: 'Texas Instruments' },
    { symbol: 'QCOM', name: 'Qualcomm Inc.' },
    { symbol: 'INTC', name: 'Intel Corporation' },
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
    // Finance
    { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'MA', name: 'Mastercard Inc.' },
    { symbol: 'WFC', name: 'Wells Fargo & Co.' },
    { symbol: 'MS', name: 'Morgan Stanley' },
    // Healthcare
    { symbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'LLY', name: 'Eli Lilly & Co.' },
    { symbol: 'MRK', name: 'Merck & Co.' },
    { symbol: 'ABBV', name: 'AbbVie Inc.' },
    { symbol: 'TMO', name: 'Thermo Fisher Scientific' },
    { symbol: 'ABT', name: 'Abbott Laboratories' },
    { symbol: 'DHR', name: 'Danaher Corporation' },
    { symbol: 'BMY', name: 'Bristol-Myers Squibb' },
    // Consumer
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'KO', name: 'Coca-Cola Co.' },
    { symbol: 'PEP', name: 'PepsiCo Inc.' },
    { symbol: 'COST', name: 'Costco Wholesale' },
    { symbol: 'MCD', name: "McDonald's Corp." },
    { symbol: 'NKE', name: 'Nike Inc.' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    // Energy & Industrial
    { symbol: 'XOM', name: 'Exxon Mobil Corp.' },
    { symbol: 'CVX', name: 'Chevron Corporation' },
    { symbol: 'NEE', name: 'NextEra Energy' },
    { symbol: 'LIN', name: 'Linde PLC' },
    { symbol: 'RTX', name: 'RTX Corporation' },
    { symbol: 'UPS', name: 'United Parcel Service' },
    { symbol: 'PM', name: 'Philip Morris Intl.' },
    { symbol: 'VZ', name: 'Verizon Communications' },
  ];

  // Filter stocks based on search
  const filteredStocks = popularStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      stock.name.toLowerCase().includes(symbolSearch.toLowerCase())
  );

  // Handle symbol selection
  const handleSelectSymbol = (selectedSymbol) => {
    setSymbol(selectedSymbol);
    setSymbolSearch('');
    setShowSymbolDropdown(false);
  };

  // Signals state
  const [signals, setSignals] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);

  // Backtest state
  const [backtestConfig, setBacktestConfig] = useState({
    startDate: '',
    endDate: '',
    initialCapital: 10000,
    positionSize: 0.1,
  });
  const [backtestResults, setBacktestResults] = useState(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Compare all strategies state
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState({ current: 0, total: 0, currentStrategy: '' });

  // Strategy Optimizer state (real-time competition)
  const [optimizerStatus, setOptimizerStatus] = useState(null);
  const [optimizerSymbols, setOptimizerSymbols] = useState(['AAPL', 'TSLA', 'NVDA']);
  const [showOnlyConsensus, setShowOnlyConsensus] = useState(true); // Only show stocks with consensus met

  // Top 50 Large-Cap Stocks (Market Cap > $10B)
  const MAJOR_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
    'V', 'XOM', 'JPM', 'WMT', 'MA', 'PG', 'LLY', 'HD', 'CVX', 'MRK',
    'ABBV', 'KO', 'PEP', 'COST', 'AVGO', 'TMO', 'MCD', 'CSCO', 'ACN', 'ABT',
    'DHR', 'WFC', 'NEE', 'LIN', 'VZ', 'ADBE', 'NKE', 'TXN', 'PM', 'CRM',
    'BMY', 'RTX', 'QCOM', 'UPS', 'ORCL', 'MS', 'INTC', 'AMD', 'NFLX', 'DIS'
  ];
  const [optimizerConfig, setOptimizerConfig] = useState({
    profitThreshold: 0.5,      // Lower threshold for day trading (0.5%)
    confidenceThreshold: 50,   // Lower confidence for more signals
    checkIntervalMs: 30000,    // Check every 30 seconds
    positionSizePercent: 10,
    timeframe: '1Min',         // 1-minute bars for day trading
    // Consensus configuration - which strategies to use for BUY decision
    consensusEnabled: true,
    minConsensusCount: 3,      // Minimum strategies that must agree to BUY
    enabledStrategies: [       // All 25 strategies enabled by default
      'rsi_oversold', 'macd_crossover', 'bollinger_bounce', 'sma_crossover',
      'ema_crossover', 'volume_breakout', 'momentum', 'mean_reversion',
      'trend_following', 'support_resistance', 'rsi_divergence', 'macd_histogram',
      'parabolic_sar', 'stochastic', 'ichimoku',
      // New strategies
      'obv', 'supertrend', 'donchian', 'keltner', 'mfi',
      'pivot_points', 'fibonacci', 'trix', 'aroon', 'roc'
    ],
  });

  // All available strategies for selection (25 total)
  const allStrategies = [
    // Original 15 strategies
    { id: 'rsi_oversold', name: 'RSI Oversold/Overbought', riskLevel: 'medium' },
    { id: 'macd_crossover', name: 'MACD Crossover', riskLevel: 'medium' },
    { id: 'bollinger_bounce', name: 'Bollinger Band Bounce', riskLevel: 'medium' },
    { id: 'sma_crossover', name: 'SMA Crossover', riskLevel: 'low' },
    { id: 'ema_crossover', name: 'EMA Crossover', riskLevel: 'medium' },
    { id: 'volume_breakout', name: 'Volume Breakout', riskLevel: 'high' },
    { id: 'momentum', name: 'Momentum', riskLevel: 'high' },
    { id: 'mean_reversion', name: 'Mean Reversion', riskLevel: 'medium' },
    { id: 'trend_following', name: 'Trend Following', riskLevel: 'medium' },
    { id: 'support_resistance', name: 'Support/Resistance', riskLevel: 'low' },
    { id: 'rsi_divergence', name: 'RSI Divergence', riskLevel: 'medium' },
    { id: 'macd_histogram', name: 'MACD Histogram', riskLevel: 'medium' },
    { id: 'parabolic_sar', name: 'Parabolic SAR', riskLevel: 'high' },
    { id: 'stochastic', name: 'Stochastic Oscillator', riskLevel: 'medium' },
    { id: 'ichimoku', name: 'Ichimoku Cloud', riskLevel: 'medium' },
    // New 10 strategies
    { id: 'obv', name: 'OBV (On-Balance Volume)', riskLevel: 'medium' },
    { id: 'supertrend', name: 'SuperTrend', riskLevel: 'medium' },
    { id: 'donchian', name: 'Donchian Channel', riskLevel: 'high' },
    { id: 'keltner', name: 'Keltner Channel', riskLevel: 'medium' },
    { id: 'mfi', name: 'MFI (Money Flow Index)', riskLevel: 'medium' },
    { id: 'pivot_points', name: 'Pivot Points', riskLevel: 'low' },
    { id: 'fibonacci', name: 'Fibonacci Retracement', riskLevel: 'medium' },
    { id: 'trix', name: 'TRIX', riskLevel: 'low' },
    { id: 'aroon', name: 'Aroon Indicator', riskLevel: 'medium' },
    { id: 'roc', name: 'Rate of Change (ROC)', riskLevel: 'medium' },
  ];

  // Toggle strategy for consensus
  const toggleStrategy = (strategyId) => {
    setOptimizerConfig(prev => {
      const enabled = prev.enabledStrategies.includes(strategyId);
      return {
        ...prev,
        enabledStrategies: enabled
          ? prev.enabledStrategies.filter(id => id !== strategyId)
          : [...prev.enabledStrategies, strategyId]
      };
    });
  };
  const [isStartingOptimizer, setIsStartingOptimizer] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newOptimizerSymbol, setNewOptimizerSymbol] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null); // Track when results were last updated
  const [isRefreshing, setIsRefreshing] = useState(false); // Show refreshing indicator

  // Auto-trading state
  const [autoTradeConfig, setAutoTradeConfig] = useState({
    strategyId: '',
    positionSize: 0.1,
    maxPositions: 3,
    stopLoss: 0.02,
    takeProfit: 0.05,
  });
  const [activeStrategies, setActiveStrategies] = useState([]);
  const [isStartingAutoTrade, setIsStartingAutoTrade] = useState(false);

  // Alpaca status
  const [isAlpacaConnected, setIsAlpacaConnected] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Load templates and check Alpaca status on mount
  useEffect(() => {
    loadTemplates();
    checkAlpacaStatus();
    loadActiveStrategies();
    loadOptimizerStatus(); // Load optimizer status to show Stop button if running

    // Set default dates
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);

    setBacktestConfig((prev) => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }));
  }, []);

  // Auto-refresh analysis when optimizer is running
  const analysisIntervalRef = React.useRef(null);

  // Refs to get latest values in interval callback
  const autoRefreshConfigRef = React.useRef(optimizerConfig);
  const autoRefreshSymbolsRef = React.useRef(optimizerSymbols);

  useEffect(() => {
    autoRefreshConfigRef.current = optimizerConfig;
  }, [optimizerConfig]);

  useEffect(() => {
    autoRefreshSymbolsRef.current = optimizerSymbols;
  }, [optimizerSymbols]);

  useEffect(() => {
    // Clear any existing interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    if (optimizerStatus?.isRunning && isAlpacaConnected && optimizerSymbols.length > 0) {
      const refreshInterval = optimizerConfig.checkIntervalMs || 30000;
      console.log('[Auto-Refresh] STARTING interval every', refreshInterval / 1000, 'seconds');

      // Start new interval
      analysisIntervalRef.current = setInterval(async () => {
        const config = autoRefreshConfigRef.current;
        const symbols = autoRefreshSymbolsRef.current;

        console.log('[Auto-Refresh] TICK at', new Date().toLocaleTimeString());
        setIsRefreshing(true);

        try {
          const response = await algoTradingAPI.runAnalysis(symbols, config);
          if (response.data.success) {
            setAnalysisResults(response.data.data);
            setLastUpdateTime(new Date());
            console.log('[Auto-Refresh] SUCCESS at', new Date().toLocaleTimeString());
          }
        } catch (err) {
          console.error('[Auto-Refresh] Error:', err);
        } finally {
          setTimeout(() => setIsRefreshing(false), 500);
        }
      }, refreshInterval);
    } else {
      console.log('[Auto-Refresh] NOT starting - isRunning:', optimizerStatus?.isRunning, 'connected:', isAlpacaConnected, 'symbols:', optimizerSymbols.length);
    }

    return () => {
      if (analysisIntervalRef.current) {
        console.log('[Auto-Refresh] STOPPING interval');
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [optimizerStatus?.isRunning, isAlpacaConnected, optimizerSymbols.length, optimizerConfig.checkIntervalMs]);

  // Refresh analysis results when consensus config changes (without full page refresh)
  const configRefreshTimeoutRef = React.useRef(null);
  const prevConfigRef = React.useRef(null);

  // Function to refresh analysis (can be called from useEffect or manually)
  const refreshAnalysisResults = React.useCallback(async () => {
    if (!isAlpacaConnected || optimizerSymbols.length === 0) {
      console.log('[Refresh] Skipping - connected:', isAlpacaConnected, 'symbols:', optimizerSymbols.length);
      return;
    }

    const startTime = Date.now();
    setIsRefreshing(true);
    console.log('[Refresh] Fetching analysis at', new Date().toLocaleTimeString());

    try {
      const response = await algoTradingAPI.runAnalysis(optimizerSymbols, optimizerConfig);
      if (response.data.success) {
        setAnalysisResults(response.data.data);
        const now = new Date();
        setLastUpdateTime(now);
        console.log('[Refresh] SUCCESS at', now.toLocaleTimeString());
      } else {
        console.error('[Refresh] API error:', response.data.message);
      }
    } catch (err) {
      console.error('[Refresh] Failed:', err.response?.data?.message || err.message);
    } finally {
      // Keep "Refreshing..." visible for at least 800ms so user can see it
      const elapsed = Date.now() - startTime;
      const minDisplayTime = 800;
      if (elapsed < minDisplayTime) {
        setTimeout(() => setIsRefreshing(false), minDisplayTime - elapsed);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [isAlpacaConnected, optimizerSymbols, optimizerConfig]);

  // Auto-refresh when consensus config changes
  // Use refs to access latest values without causing re-renders
  const latestConfigRef = React.useRef(optimizerConfig);
  const latestSymbolsRef = React.useRef(optimizerSymbols);
  const latestConnectedRef = React.useRef(isAlpacaConnected);

  useEffect(() => {
    latestConfigRef.current = optimizerConfig;
  }, [optimizerConfig]);

  useEffect(() => {
    latestSymbolsRef.current = optimizerSymbols;
  }, [optimizerSymbols]);

  useEffect(() => {
    latestConnectedRef.current = isAlpacaConnected;
  }, [isAlpacaConnected]);

  useEffect(() => {
    const configKey = JSON.stringify({
      consensusEnabled: optimizerConfig.consensusEnabled,
      minConsensusCount: optimizerConfig.minConsensusCount,
      enabledStrategies: optimizerConfig.enabledStrategies
    });

    // Skip if config hasn't actually changed
    if (prevConfigRef.current === configKey) {
      return;
    }

    // Skip initial render
    if (prevConfigRef.current === null) {
      prevConfigRef.current = configKey;
      return;
    }

    prevConfigRef.current = configKey;
    console.log('[Config Change] Detected change, will refresh in 500ms...');

    // Debounce the refresh
    if (configRefreshTimeoutRef.current) {
      clearTimeout(configRefreshTimeoutRef.current);
    }

    configRefreshTimeoutRef.current = setTimeout(async () => {
      const config = latestConfigRef.current;
      const symbols = latestSymbolsRef.current;
      const connected = latestConnectedRef.current;

      if (!connected || symbols.length === 0) {
        console.log('[Config Refresh] Skipping - not ready');
        return;
      }

      const startTime = Date.now();
      setIsRefreshing(true);
      console.log('[Config Refresh] Starting at', new Date().toLocaleTimeString());

      try {
        const response = await algoTradingAPI.runAnalysis(symbols, config);
        if (response.data.success) {
          setAnalysisResults(response.data.data);
          setLastUpdateTime(new Date());
          console.log('[Config Refresh] SUCCESS at', new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error('[Config Refresh] Failed:', err.message);
      } finally {
        // Keep visible for at least 800ms
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) {
          setTimeout(() => setIsRefreshing(false), 800 - elapsed);
        } else {
          setIsRefreshing(false);
        }
      }
    }, 500);

    return () => {
      if (configRefreshTimeoutRef.current) {
        clearTimeout(configRefreshTimeoutRef.current);
      }
    };
  }, [optimizerConfig.consensusEnabled, optimizerConfig.minConsensusCount, JSON.stringify(optimizerConfig.enabledStrategies)]);

  const loadTemplates = async () => {
    try {
      const response = await algoTradingAPI.getTemplates();
      setTemplates(response.data.data);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const checkAlpacaStatus = async () => {
    try {
      const response = await alpacaAPI.getStatus();
      setIsAlpacaConnected(response?.initialized || false);
    } catch (err) {
      console.error('Error checking Alpaca status:', err);
      setIsAlpacaConnected(false);
    }
  };

  const loadActiveStrategies = async () => {
    try {
      const response = await algoTradingAPI.getActiveStrategies();
      setActiveStrategies(response.data.data || []);
    } catch (err) {
      console.error('Error loading active strategies:', err);
    }
  };

  // Generate signals
  const handleGenerateSignals = useCallback(async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to Alpaca in the Command Center first');
      return;
    }

    setIsLoadingSignals(true);
    setError(null);

    try {
      const strategy = selectedTemplate || customStrategy;
      const [signalsRes, indicatorsRes] = await Promise.all([
        algoTradingAPI.generateSignals(symbol, strategy, timeframe, 100),
        algoTradingAPI.calculateIndicators(
          symbol,
          ['sma', 'ema', 'rsi', 'macd', 'bollinger'],
          timeframe,
          100
        ),
      ]);

      // Map signal response to display format
      const signalData = signalsRes.data.data.signals;
      setSignals({
        currentSignal: signalData.signal?.toLowerCase() || 'hold',
        strength: (signalData.confidence || 0) / 100,
        reasons: signalData.reasons || [],
      });
      setIndicators(indicatorsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate signals');
    } finally {
      setIsLoadingSignals(false);
    }
  }, [symbol, selectedTemplate, customStrategy, timeframe, isAlpacaConnected]);

  // Run backtest
  const handleRunBacktest = async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to Alpaca in the Command Center first');
      return;
    }

    // Validate dates
    const today = new Date().toISOString().split('T')[0];
    if (backtestConfig.endDate > today) {
      setError(`End date cannot be in the future. Today is ${today}`);
      return;
    }
    if (backtestConfig.startDate >= backtestConfig.endDate) {
      setError('Start date must be before end date');
      return;
    }

    setIsBacktesting(true);
    setError(null);
    setBacktestResults(null);

    try {
      // Use customStrategy which contains the user-adjusted parameters
      const strategy = {
        type: customStrategy.type || selectedTemplate?.type,
        params: { ...customStrategy.params },
      };
      const response = await algoTradingAPI.runBacktest({
        symbol,
        strategy,
        startDate: backtestConfig.startDate,
        endDate: backtestConfig.endDate,
        initialCapital: backtestConfig.initialCapital,
        positionSize: backtestConfig.positionSize,
        timeframe,
      });

      // Map backtest response to display format
      const data = response.data.data;
      setBacktestResults({
        finalValue: data.finalCapital,
        totalReturn: (data.finalCapital - data.initialCapital) / data.initialCapital,
        totalTrades: data.metrics?.totalTrades || 0,
        winRate: (data.metrics?.winRate || 0) / 100,
        profitFactor: data.metrics?.profitFactor || 0,
        sharpeRatio: data.metrics?.sharpeRatio || 0,
        maxDrawdown: (data.metrics?.maxDrawdown || 0) / 100,
        avgTradeReturn: data.metrics?.totalReturn ? (data.metrics.totalReturn / (data.metrics.totalTrades || 1)) / 100 : 0,
        trades: data.trades?.map(t => ({
          date: t.date,
          side: t.type?.toLowerCase(),
          price: t.price,
          qty: t.shares,
          pnl: t.pnl || 0,
        })) || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run backtest');
    } finally {
      setIsBacktesting(false);
    }
  };

  // Compare all strategies
  const handleCompareAllStrategies = async () => {
    if (!backtestConfig.startDate || !backtestConfig.endDate) {
      setError('Please select start and end dates');
      return;
    }

    setIsComparing(true);
    setError(null);
    setComparisonResults(null);
    setComparisonProgress({ current: 0, total: templates.length, currentStrategy: '' });

    const results = [];

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      setComparisonProgress({
        current: i + 1,
        total: templates.length,
        currentStrategy: template.name,
      });

      try {
        const strategy = {
          type: template.type,
          params: { ...template.params },
        };

        const response = await algoTradingAPI.runBacktest({
          symbol,
          strategy,
          startDate: backtestConfig.startDate,
          endDate: backtestConfig.endDate,
          initialCapital: backtestConfig.initialCapital,
          positionSize: backtestConfig.positionSize,
          timeframe,
        });

        const data = response.data.data;
        results.push({
          id: template.id,
          name: template.name,
          type: template.type,
          riskLevel: template.riskLevel,
          totalReturn: ((data.finalCapital - data.initialCapital) / data.initialCapital) * 100,
          finalValue: data.finalCapital,
          totalTrades: data.metrics?.totalTrades || 0,
          winRate: data.metrics?.winRate || 0,
          profitFactor: data.metrics?.profitFactor || 0,
          sharpeRatio: data.metrics?.sharpeRatio || 0,
          maxDrawdown: data.metrics?.maxDrawdown || 0,
          success: true,
        });
      } catch (err) {
        results.push({
          id: template.id,
          name: template.name,
          type: template.type,
          riskLevel: template.riskLevel,
          totalReturn: 0,
          finalValue: backtestConfig.initialCapital,
          totalTrades: 0,
          winRate: 0,
          profitFactor: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          success: false,
          error: err.response?.data?.message || 'Failed',
        });
      }
    }

    // Sort by total return (best first)
    results.sort((a, b) => b.totalReturn - a.totalReturn);

    // Add rank
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    setComparisonResults(results);
    setIsComparing(false);
  };

  // ==================== STRATEGY OPTIMIZER FUNCTIONS ====================

  // Start the real-time strategy optimizer
  const handleStartOptimizer = async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to Alpaca first');
      return;
    }

    if (optimizerSymbols.length === 0) {
      setError('Please add at least one symbol to monitor');
      return;
    }

    setIsStartingOptimizer(true);
    setError(null);

    try {
      // Start the optimizer on the backend
      const response = await algoTradingAPI.startOptimizer(optimizerSymbols, optimizerConfig);
      setOptimizerStatus(response.data.data);

      // Run initial analysis immediately
      const analysisResponse = await algoTradingAPI.runAnalysis(optimizerSymbols, optimizerConfig);
      setAnalysisResults(analysisResponse.data.data);
      setLastUpdateTime(new Date()); // Track update time
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start optimizer');
    } finally {
      setIsStartingOptimizer(false);
    }
  };

  // Stop the optimizer
  const handleStopOptimizer = async () => {
    try {
      await algoTradingAPI.stopOptimizer();
      setOptimizerStatus(null);
      // Keep the last analysis results visible but stop auto-refresh
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop optimizer');
    }
  };

  // Load optimizer status
  const loadOptimizerStatus = async () => {
    try {
      const response = await algoTradingAPI.getOptimizerStatus();
      setOptimizerStatus(response.data.data);
    } catch (err) {
      console.error('Error loading optimizer status:', err);
    }
  };

  // Run one-time analysis (test without starting continuous monitoring)
  const handleRunAnalysis = async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to Alpaca first');
      return;
    }

    if (optimizerSymbols.length === 0) {
      setError('Please add at least one symbol to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);

    try {
      const response = await algoTradingAPI.runAnalysis(optimizerSymbols, optimizerConfig);
      setAnalysisResults(response.data.data);
      setLastUpdateTime(new Date()); // Track update time
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add symbol to optimizer
  const handleAddOptimizerSymbol = () => {
    const sym = newOptimizerSymbol.trim().toUpperCase();
    if (sym && !optimizerSymbols.includes(sym)) {
      setOptimizerSymbols([...optimizerSymbols, sym]);
      setNewOptimizerSymbol('');
    }
  };

  // Load all major stocks (top 50 large-cap)
  const handleLoadMajorStocks = () => {
    setOptimizerSymbols(MAJOR_STOCKS);
  };

  // Clear all symbols
  const handleClearSymbols = () => {
    setOptimizerSymbols([]);
  };

  // Remove symbol from optimizer
  const handleRemoveOptimizerSymbol = (sym) => {
    setOptimizerSymbols(optimizerSymbols.filter((s) => s !== sym));
  };

  // Start auto trading
  const handleStartAutoTrade = async () => {
    if (!isAlpacaConnected) {
      setError('Please connect to Alpaca first');
      return;
    }

    if (!autoTradeConfig.strategyId) {
      setError('Please select a strategy');
      return;
    }

    setIsStartingAutoTrade(true);
    setError(null);

    try {
      // Build strategy object from selectedTemplate or customStrategy
      const strategy = {
        type: selectedTemplate?.type || customStrategy.type,
        params: selectedTemplate?.params || customStrategy.params || {},
      };
      const strategyId = `${autoTradeConfig.strategyId}_${Date.now()}`;

      await algoTradingAPI.startAutoTrading({
        strategyId,
        symbol,
        strategy,
        positionSize: autoTradeConfig.positionSize,
        maxPositions: autoTradeConfig.maxPositions,
        stopLoss: autoTradeConfig.stopLoss,
        takeProfit: autoTradeConfig.takeProfit,
      });

      await loadActiveStrategies();
      setActiveTab('monitor');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start auto trading');
    } finally {
      setIsStartingAutoTrade(false);
    }
  };

  // Stop auto trading
  const handleStopAutoTrade = async (strategyId) => {
    try {
      await algoTradingAPI.stopAutoTrading(strategyId);
      await loadActiveStrategies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop auto trading');
    }
  };

  // Select template
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setCustomStrategy({
      type: template.type,
      params: { ...template.params },
    });
  };

  // Update custom strategy params
  const handleParamChange = (param, value) => {
    setCustomStrategy((prev) => ({
      ...prev,
      params: {
        ...prev.params,
        [param]: parseFloat(value) || value,
      },
    }));
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format percent
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0.00%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="algo-trading-page">
      <div className="container">
        {/* Header */}
        <div className="algo-header">
          <div className="algo-title-section">
            <h1>Algorithmic Trading</h1>
            <span className={`connection-badge ${isAlpacaConnected ? 'connected' : 'disconnected'}`}>
              {isAlpacaConnected ? 'Alpaca Connected' : 'Alpaca Disconnected'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="algo-tabs">
          <button
            className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            Strategy Builder
          </button>
          <button
            className={`tab-btn ${activeTab === 'backtest' ? 'active' : ''}`}
            onClick={() => setActiveTab('backtest')}
          >
            Backtesting
          </button>
          <button
            className={`tab-btn ${activeTab === 'auto' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto')}
          >
            Auto Trading
          </button>
          <button
            className={`tab-btn ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            Monitor ({activeStrategies.length})
          </button>
          <button
            className={`tab-btn optimizer-tab ${activeTab === 'optimizer' ? 'active' : ''}`}
            onClick={() => setActiveTab('optimizer')}
          >
            Strategy Optimizer
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Strategy Builder Tab */}
        {activeTab === 'builder' && (
          <div className="tab-content">
            <div className="builder-grid">
              {/* Templates */}
              <div className="builder-card">
                <h2>Strategy Templates</h2>
                <div className="templates-list">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="template-header">
                        <span className="template-name">{template.name}</span>
                        <span className={`template-type ${template.type}`}>{template.type}</span>
                      </div>
                      <p className="template-description">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration */}
              <div className="builder-card">
                <h2>Configuration</h2>
                <div className="config-section">
                  <div className="form-row">
                    <div className="form-group symbol-search-group">
                      <label>Symbol</label>
                      <div className="symbol-search-container">
                        <input
                          type="text"
                          value={symbolSearch || symbol}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setSymbolSearch(val);
                            setSymbol(val);
                            setShowSymbolDropdown(true);
                          }}
                          onFocus={() => setShowSymbolDropdown(true)}
                          onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
                          placeholder="Search or type symbol..."
                        />
                        <span className="selected-symbol-badge">{symbol}</span>
                        {showSymbolDropdown && (
                          <div className="symbol-dropdown">
                            <div className="dropdown-header">Major Stocks (50)</div>
                            {filteredStocks.slice(0, 20).map((stock) => (
                              <div
                                key={stock.symbol}
                                className={`dropdown-item ${symbol === stock.symbol ? 'selected' : ''}`}
                                onClick={() => handleSelectSymbol(stock.symbol)}
                              >
                                <span className="stock-symbol">{stock.symbol}</span>
                                <span className="stock-name">{stock.name}</span>
                              </div>
                            ))}
                            {filteredStocks.length === 0 && symbolSearch && (
                              <div className="dropdown-item no-results">
                                Press Enter to use "{symbolSearch}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Timeframe</label>
                      <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                        <option value="1Min">1 Minute</option>
                        <option value="5Min">5 Minutes</option>
                        <option value="15Min">15 Minutes</option>
                        <option value="1Hour">1 Hour</option>
                        <option value="1Day">1 Day</option>
                      </select>
                    </div>
                  </div>

                  {selectedTemplate && (
                    <div className="params-section">
                      <h3>Strategy Parameters</h3>
                      <div className="params-grid">
                        {Object.entries(selectedTemplate.defaultParams || {}).map(([key, value]) => (
                          <div key={key} className="form-group">
                            <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                            <input
                              type="number"
                              value={customStrategy.params[key] ?? value}
                              onChange={(e) => handleParamChange(key, e.target.value)}
                              step="0.01"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleGenerateSignals}
                    disabled={isLoadingSignals || !symbol}
                  >
                    {isLoadingSignals ? 'Analyzing...' : 'Generate Signals'}
                  </button>
                </div>
              </div>

              {/* Signals */}
              <div className="builder-card signals-card">
                <h2>Trading Signals</h2>
                {signals ? (
                  <div className="signals-content">
                    <div className="signal-summary">
                      <div className={`current-signal ${signals.currentSignal}`}>
                        <span className="signal-label">Current Signal</span>
                        <span className="signal-value">{signals.currentSignal.toUpperCase()}</span>
                      </div>
                      <div className="signal-strength">
                        <span className="signal-label">Strength</span>
                        <div className="strength-bar">
                          <div
                            className={`strength-fill ${signals.currentSignal}`}
                            style={{ width: `${Math.abs(signals.strength) * 100}%` }}
                          ></div>
                        </div>
                        <span className="strength-value">{(signals.strength * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {signals.reasons && signals.reasons.length > 0 && (
                      <div className="signal-reasons">
                        <h4>Signal Reasons</h4>
                        <ul>
                          {signals.reasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Select a strategy and click "Generate Signals" to analyze</p>
                  </div>
                )}
              </div>

              {/* Indicators */}
              <div className="builder-card indicators-card">
                <h2>Technical Indicators</h2>
                {indicators ? (
                  <div className="indicators-grid">
                    <div className="indicator-item">
                      <span className="indicator-label">Current Price</span>
                      <span className="indicator-value">{formatCurrency(indicators.currentPrice)}</span>
                    </div>

                    {indicators.indicators.rsi != null && (
                      <div className="indicator-item">
                        <span className="indicator-label">RSI (14)</span>
                        <span
                          className={`indicator-value ${
                            indicators.indicators.rsi > 70
                              ? 'overbought'
                              : indicators.indicators.rsi < 30
                              ? 'oversold'
                              : ''
                          }`}
                        >
                          {(indicators.indicators.rsi ?? 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {indicators.indicators.macd && (
                      <>
                        <div className="indicator-item">
                          <span className="indicator-label">MACD</span>
                          <span className="indicator-value">
                            {(indicators.indicators.macd.macdLine ?? indicators.indicators.macd.macd ?? 0).toFixed(4)}
                          </span>
                        </div>
                        <div className="indicator-item">
                          <span className="indicator-label">MACD Signal</span>
                          <span className="indicator-value">
                            {(indicators.indicators.macd.signalLine ?? indicators.indicators.macd.signal ?? 0).toFixed(4)}
                          </span>
                        </div>
                      </>
                    )}

                    {indicators.indicators.sma && (
                      <>
                        <div className="indicator-item">
                          <span className="indicator-label">SMA 20</span>
                          <span className="indicator-value">
                            {formatCurrency(indicators.indicators.sma.sma20)}
                          </span>
                        </div>
                        <div className="indicator-item">
                          <span className="indicator-label">SMA 50</span>
                          <span className="indicator-value">
                            {formatCurrency(indicators.indicators.sma.sma50)}
                          </span>
                        </div>
                      </>
                    )}

                    {indicators.indicators.bollinger && (
                      <>
                        <div className="indicator-item">
                          <span className="indicator-label">BB Upper</span>
                          <span className="indicator-value">
                            {formatCurrency(indicators.indicators.bollinger.upper)}
                          </span>
                        </div>
                        <div className="indicator-item">
                          <span className="indicator-label">BB Lower</span>
                          <span className="indicator-value">
                            {formatCurrency(indicators.indicators.bollinger.lower)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Indicators will appear after signal generation</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Backtesting Tab */}
        {activeTab === 'backtest' && (
          <div className="tab-content">
            <div className="backtest-grid">
              {/* Configuration */}
              <div className="builder-card">
                <h2>Backtest Configuration</h2>
                <div className="config-section">
                  <div className="form-row">
                    <div className="form-group symbol-search-group">
                      <label>Symbol</label>
                      <div className="symbol-search-container">
                        <input
                          type="text"
                          value={symbolSearch || symbol}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setSymbolSearch(val);
                            setSymbol(val);
                            setShowSymbolDropdown(true);
                          }}
                          onFocus={() => setShowSymbolDropdown(true)}
                          onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
                          placeholder="Search or type symbol..."
                        />
                        <span className="selected-symbol-badge">{symbol}</span>
                        {showSymbolDropdown && (
                          <div className="symbol-dropdown">
                            <div className="dropdown-header">Major Stocks (50)</div>
                            {filteredStocks.slice(0, 20).map((stock) => (
                              <div
                                key={stock.symbol}
                                className={`dropdown-item ${symbol === stock.symbol ? 'selected' : ''}`}
                                onClick={() => handleSelectSymbol(stock.symbol)}
                              >
                                <span className="stock-symbol">{stock.symbol}</span>
                                <span className="stock-name">{stock.name}</span>
                              </div>
                            ))}
                            {filteredStocks.length === 0 && symbolSearch && (
                              <div className="dropdown-item no-results">
                                Press Enter to use "{symbolSearch}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Timeframe</label>
                      <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                        <option value="1Day">1 Day</option>
                        <option value="1Hour">1 Hour</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={backtestConfig.startDate}
                        onChange={(e) =>
                          setBacktestConfig((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={backtestConfig.endDate}
                        onChange={(e) =>
                          setBacktestConfig((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Initial Capital ($)</label>
                      <input
                        type="number"
                        value={backtestConfig.initialCapital}
                        onChange={(e) =>
                          setBacktestConfig((prev) => ({
                            ...prev,
                            initialCapital: parseFloat(e.target.value),
                          }))
                        }
                        min="1000"
                        step="1000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Position Size (%)</label>
                      <input
                        type="number"
                        value={backtestConfig.positionSize * 100}
                        onChange={(e) =>
                          setBacktestConfig((prev) => ({
                            ...prev,
                            positionSize: parseFloat(e.target.value) / 100,
                          }))
                        }
                        min="1"
                        max="100"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Strategy</label>
                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value);
                        if (template) {
                          setSelectedTemplate(template);
                          setCustomStrategy({
                            type: template.type,
                            params: { ...template.params },
                          });
                        }
                      }}
                    >
                      <option value="">Select a strategy...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTemplate && (
                    <div className="selected-strategy">
                      <span className="label">Strategy:</span>
                      <span className="value">{selectedTemplate.name}</span>
                      <span className="description">{selectedTemplate.description}</span>
                    </div>
                  )}

                  {/* Strategy Parameters */}
                  {selectedTemplate && (
                    <div className="strategy-params">
                      <h3>Strategy Parameters</h3>

                      {/* RSI Parameters */}
                      {selectedTemplate.type === 'RSI' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>RSI Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.period || 14}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, period: parseInt(e.target.value) },
                                }))
                              }
                              min="2"
                              max="50"
                            />
                          </div>
                          <div className="form-group">
                            <label>Oversold Level (Buy Signal)</label>
                            <input
                              type="number"
                              value={customStrategy.params.oversold || 30}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, oversold: parseInt(e.target.value) },
                                }))
                              }
                              min="10"
                              max="50"
                            />
                            <small>Higher = more buy signals</small>
                          </div>
                          <div className="form-group">
                            <label>Overbought Level (Sell Signal)</label>
                            <input
                              type="number"
                              value={customStrategy.params.overbought || 70}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, overbought: parseInt(e.target.value) },
                                }))
                              }
                              min="50"
                              max="90"
                            />
                            <small>Lower = more sell signals</small>
                          </div>
                        </div>
                      )}

                      {/* MACD Parameters */}
                      {selectedTemplate.type === 'MACD' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Fast Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.fastPeriod || 12}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, fastPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="2"
                              max="50"
                            />
                          </div>
                          <div className="form-group">
                            <label>Slow Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.slowPeriod || 26}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, slowPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="10"
                              max="100"
                            />
                          </div>
                          <div className="form-group">
                            <label>Signal Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.signalPeriod || 9}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, signalPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="2"
                              max="50"
                            />
                          </div>
                        </div>
                      )}

                      {/* Moving Average Parameters */}
                      {selectedTemplate.type === 'MOVING_AVERAGE' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Fast MA Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.fastPeriod || 10}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, fastPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="2"
                              max="100"
                            />
                          </div>
                          <div className="form-group">
                            <label>Slow MA Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.slowPeriod || 50}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, slowPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="10"
                              max="200"
                            />
                          </div>
                        </div>
                      )}

                      {/* Bollinger Bands Parameters */}
                      {selectedTemplate.type === 'BOLLINGER_BANDS' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.period || 20}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, period: parseInt(e.target.value) },
                                }))
                              }
                              min="5"
                              max="50"
                            />
                          </div>
                          <div className="form-group">
                            <label>Standard Deviations</label>
                            <input
                              type="number"
                              value={customStrategy.params.stdDev || 2}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, stdDev: parseFloat(e.target.value) },
                                }))
                              }
                              min="1"
                              max="4"
                              step="0.5"
                            />
                            <small>Lower = tighter bands, more signals</small>
                          </div>
                        </div>
                      )}

                      {/* Mean Reversion Parameters */}
                      {selectedTemplate.type === 'MEAN_REVERSION' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.period || 20}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, period: parseInt(e.target.value) },
                                }))
                              }
                              min="5"
                              max="100"
                            />
                          </div>
                          <div className="form-group">
                            <label>Deviation Threshold (%)</label>
                            <input
                              type="number"
                              value={customStrategy.params.threshold || 5}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, threshold: parseFloat(e.target.value) },
                                }))
                              }
                              min="1"
                              max="20"
                              step="0.5"
                            />
                            <small>Lower = more signals</small>
                          </div>
                        </div>
                      )}

                      {/* Momentum Parameters */}
                      {selectedTemplate.type === 'MOMENTUM' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Lookback Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.period || 10}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, period: parseInt(e.target.value) },
                                }))
                              }
                              min="2"
                              max="50"
                            />
                          </div>
                          <div className="form-group">
                            <label>Momentum Threshold (%)</label>
                            <input
                              type="number"
                              value={customStrategy.params.threshold || 3}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, threshold: parseFloat(e.target.value) },
                                }))
                              }
                              min="1"
                              max="20"
                              step="0.5"
                            />
                            <small>Lower = more signals</small>
                          </div>
                        </div>
                      )}

                      {/* Stochastic Oscillator Parameters */}
                      {selectedTemplate.type === 'STOCHASTIC' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>%K Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.kPeriod || 14}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, kPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="5"
                              max="30"
                            />
                          </div>
                          <div className="form-group">
                            <label>%D Period (Smoothing)</label>
                            <input
                              type="number"
                              value={customStrategy.params.dPeriod || 3}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, dPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="1"
                              max="10"
                            />
                          </div>
                          <div className="form-group">
                            <label>Oversold Level</label>
                            <input
                              type="number"
                              value={customStrategy.params.oversold || 20}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, oversold: parseInt(e.target.value) },
                                }))
                              }
                              min="5"
                              max="40"
                            />
                            <small>Higher = more buy signals</small>
                          </div>
                          <div className="form-group">
                            <label>Overbought Level</label>
                            <input
                              type="number"
                              value={customStrategy.params.overbought || 80}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, overbought: parseInt(e.target.value) },
                                }))
                              }
                              min="60"
                              max="95"
                            />
                            <small>Lower = more sell signals</small>
                          </div>
                        </div>
                      )}

                      {/* VWAP Parameters */}
                      {selectedTemplate.type === 'VWAP' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Deviation Threshold (%)</label>
                            <input
                              type="number"
                              value={customStrategy.params.threshold || 1}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, threshold: parseFloat(e.target.value) },
                                }))
                              }
                              min="0.5"
                              max="5"
                              step="0.5"
                            />
                            <small>Distance from VWAP to trigger signal</small>
                          </div>
                        </div>
                      )}

                      {/* Ichimoku Cloud Parameters */}
                      {selectedTemplate.type === 'ICHIMOKU' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Tenkan-sen Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.tenkanPeriod || 9}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, tenkanPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="5"
                              max="20"
                            />
                            <small>Conversion line (fast)</small>
                          </div>
                          <div className="form-group">
                            <label>Kijun-sen Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.kijunPeriod || 26}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, kijunPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="15"
                              max="50"
                            />
                            <small>Base line (slow)</small>
                          </div>
                          <div className="form-group">
                            <label>Senkou Span B Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.senkouBPeriod || 52}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, senkouBPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="30"
                              max="100"
                            />
                            <small>Leading span B</small>
                          </div>
                        </div>
                      )}

                      {/* ADX Parameters */}
                      {selectedTemplate.type === 'ADX' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>ADX Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.period || 14}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, period: parseInt(e.target.value) },
                                }))
                              }
                              min="7"
                              max="30"
                            />
                          </div>
                          <div className="form-group">
                            <label>Trend Strength Threshold</label>
                            <input
                              type="number"
                              value={customStrategy.params.threshold || 25}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, threshold: parseInt(e.target.value) },
                                }))
                              }
                              min="15"
                              max="40"
                            />
                            <small>ADX above this = strong trend</small>
                          </div>
                        </div>
                      )}

                      {/* Parabolic SAR Parameters */}
                      {selectedTemplate.type === 'PARABOLIC_SAR' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Acceleration Factor</label>
                            <input
                              type="number"
                              value={customStrategy.params.acceleration || 0.02}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, acceleration: parseFloat(e.target.value) },
                                }))
                              }
                              min="0.01"
                              max="0.1"
                              step="0.01"
                            />
                            <small>Starting acceleration</small>
                          </div>
                          <div className="form-group">
                            <label>Maximum Acceleration</label>
                            <input
                              type="number"
                              value={customStrategy.params.maximum || 0.2}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, maximum: parseFloat(e.target.value) },
                                }))
                              }
                              min="0.1"
                              max="0.5"
                              step="0.05"
                            />
                            <small>Max acceleration cap</small>
                          </div>
                        </div>
                      )}

                      {/* Williams %R Parameters */}
                      {selectedTemplate.type === 'WILLIAMS_R' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.period || 14}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, period: parseInt(e.target.value) },
                                }))
                              }
                              min="5"
                              max="30"
                            />
                          </div>
                          <div className="form-group">
                            <label>Oversold Level</label>
                            <input
                              type="number"
                              value={customStrategy.params.oversold || -80}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, oversold: parseInt(e.target.value) },
                                }))
                              }
                              min="-95"
                              max="-60"
                            />
                            <small>Buy when below this (higher = more signals)</small>
                          </div>
                          <div className="form-group">
                            <label>Overbought Level</label>
                            <input
                              type="number"
                              value={customStrategy.params.overbought || -20}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, overbought: parseInt(e.target.value) },
                                }))
                              }
                              min="-40"
                              max="-5"
                            />
                            <small>Sell when above this (lower = more signals)</small>
                          </div>
                        </div>
                      )}

                      {/* CCI Parameters */}
                      {selectedTemplate.type === 'CCI' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.period || 20}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, period: parseInt(e.target.value) },
                                }))
                              }
                              min="10"
                              max="40"
                            />
                          </div>
                          <div className="form-group">
                            <label>Oversold Level</label>
                            <input
                              type="number"
                              value={customStrategy.params.oversold || -100}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, oversold: parseInt(e.target.value) },
                                }))
                              }
                              min="-200"
                              max="-50"
                            />
                            <small>Buy signal threshold</small>
                          </div>
                          <div className="form-group">
                            <label>Overbought Level</label>
                            <input
                              type="number"
                              value={customStrategy.params.overbought || 100}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, overbought: parseInt(e.target.value) },
                                }))
                              }
                              min="50"
                              max="200"
                            />
                            <small>Sell signal threshold</small>
                          </div>
                        </div>
                      )}

                      {/* ATR Breakout Parameters */}
                      {selectedTemplate.type === 'ATR_BREAKOUT' && (
                        <div className="params-grid">
                          <div className="form-group">
                            <label>ATR Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.atrPeriod || 14}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, atrPeriod: parseInt(e.target.value) },
                                }))
                              }
                              min="7"
                              max="30"
                            />
                          </div>
                          <div className="form-group">
                            <label>ATR Multiplier</label>
                            <input
                              type="number"
                              value={customStrategy.params.multiplier || 2}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, multiplier: parseFloat(e.target.value) },
                                }))
                              }
                              min="1"
                              max="5"
                              step="0.5"
                            />
                            <small>Lower = more signals, Higher = fewer but stronger</small>
                          </div>
                          <div className="form-group">
                            <label>Lookback Period</label>
                            <input
                              type="number"
                              value={customStrategy.params.lookback || 20}
                              onChange={(e) =>
                                setCustomStrategy((prev) => ({
                                  ...prev,
                                  params: { ...prev.params, lookback: parseInt(e.target.value) },
                                }))
                              }
                              min="10"
                              max="50"
                            />
                            <small>Period for high/low range</small>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="backtest-buttons">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleRunBacktest}
                      disabled={isBacktesting || isComparing || !symbol || !selectedTemplate}
                    >
                      {isBacktesting ? 'Running Backtest...' : 'Run Backtest'}
                    </button>
                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={handleCompareAllStrategies}
                      disabled={isBacktesting || isComparing || !symbol}
                    >
                      {isComparing
                        ? `Comparing ${comparisonProgress.current}/${comparisonProgress.total}...`
                        : 'Compare All Strategies'}
                    </button>
                  </div>
                  {isComparing && (
                    <div className="comparison-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(comparisonProgress.current / comparisonProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      <p>Testing: {comparisonProgress.currentStrategy}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Results */}
              {comparisonResults && (
                <div className="builder-card comparison-card">
                  <h2>Strategy Comparison Results</h2>
                  <p className="comparison-subtitle">
                    Tested {comparisonResults.length} strategies on {symbol} from {backtestConfig.startDate} to {backtestConfig.endDate}
                  </p>
                  <div className="comparison-table">
                    <div className="table-header">
                      <span>Rank</span>
                      <span>Strategy</span>
                      <span>Return</span>
                      <span>Trades</span>
                      <span>Win Rate</span>
                      <span>Sharpe</span>
                      <span>Max DD</span>
                      <span>Risk</span>
                    </div>
                    {comparisonResults.map((result) => (
                      <div
                        key={result.id}
                        className={`table-row ${result.rank === 1 ? 'best' : ''} ${!result.success ? 'failed' : ''}`}
                        onClick={() => {
                          const template = templates.find(t => t.id === result.id);
                          if (template) {
                            setSelectedTemplate(template);
                            setCustomStrategy({ type: template.type, params: { ...template.params } });
                          }
                        }}
                      >
                        <span className="rank">
                          {result.rank === 1 ? '1' : result.rank === 2 ? '2' : result.rank === 3 ? '3' : result.rank}
                        </span>
                        <span className="strategy-name">{result.name}</span>
                        <span className={`return ${result.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                          {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                        </span>
                        <span>{result.totalTrades}</span>
                        <span>{result.winRate.toFixed(1)}%</span>
                        <span>{result.sharpeRatio.toFixed(2)}</span>
                        <span className="negative">-{result.maxDrawdown.toFixed(1)}%</span>
                        <span className={`risk ${result.riskLevel}`}>{result.riskLevel}</span>
                      </div>
                    ))}
                  </div>
                  <p className="comparison-tip">Click on a strategy to select it for detailed backtest or auto trading</p>
                </div>
              )}

              {/* Results */}
              <div className="builder-card results-card">
                <h2>Backtest Results</h2>
                {backtestResults ? (
                  <div className="results-content">
                    <div className="results-summary">
                      <div className="result-item primary">
                        <span className="result-label">Final Value</span>
                        <span className="result-value">{formatCurrency(backtestResults.finalValue)}</span>
                      </div>
                      <div className={`result-item ${backtestResults.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                        <span className="result-label">Total Return</span>
                        <span className="result-value">{formatPercent(backtestResults.totalReturn)}</span>
                      </div>
                    </div>

                    <div className="metrics-grid">
                      <div className="metric-item">
                        <span className="metric-label">Total Trades</span>
                        <span className="metric-value">{backtestResults.totalTrades}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Win Rate</span>
                        <span className="metric-value">{(backtestResults.winRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Profit Factor</span>
                        <span className="metric-value">{backtestResults.profitFactor.toFixed(2)}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Sharpe Ratio</span>
                        <span className="metric-value">{backtestResults.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Max Drawdown</span>
                        <span className="metric-value negative">
                          {formatPercent(-backtestResults.maxDrawdown)}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Avg Trade Return</span>
                        <span className="metric-value">{formatPercent(backtestResults.avgTradeReturn)}</span>
                      </div>
                    </div>

                    {backtestResults.trades && backtestResults.trades.length > 0 && (
                      <div className="trades-section">
                        <h3>Recent Trades</h3>
                        <div className="trades-table">
                          <div className="table-header">
                            <span>Date</span>
                            <span>Side</span>
                            <span>Price</span>
                            <span>Qty</span>
                            <span>P&L</span>
                          </div>
                          {backtestResults.trades.slice(-10).map((trade, idx) => (
                            <div key={idx} className="table-row">
                              <span>{new Date(trade.date).toLocaleDateString()}</span>
                              <span className={`side ${trade.side}`}>{trade.side.toUpperCase()}</span>
                              <span>{formatCurrency(trade.price)}</span>
                              <span>{trade.qty}</span>
                              <span className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                                {formatCurrency(trade.pnl)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Configure your backtest and click "Run Backtest" to see results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Auto Trading Tab */}
        {activeTab === 'auto' && (
          <div className="tab-content">
            <div className="auto-trade-grid">
              <div className="builder-card">
                <h2>Auto Trading Configuration</h2>

                {!isAlpacaConnected && (
                  <div className="alert alert-warning">
                    Please connect to Alpaca in the Command Center before starting auto trading.
                  </div>
                )}

                <div className="config-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Strategy</label>
                      <select
                        value={autoTradeConfig.strategyId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          setAutoTradeConfig((prev) => ({ ...prev, strategyId: selectedId }));
                          // Also update the selected template
                          const template = templates.find(t => t.id === selectedId);
                          if (template) {
                            setSelectedTemplate(template);
                            setCustomStrategy({
                              type: template.type,
                              params: { ...template.params },
                            });
                          }
                        }}
                        className="strategy-select"
                      >
                        <option value="">-- Select a Strategy --</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group symbol-search-group">
                      <label>Symbol</label>
                      <div className="symbol-search-container">
                        <input
                          type="text"
                          value={symbolSearch || symbol}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setSymbolSearch(val);
                            setSymbol(val);
                            setShowSymbolDropdown(true);
                          }}
                          onFocus={() => setShowSymbolDropdown(true)}
                          onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
                          placeholder="Search or type symbol..."
                        />
                        <span className="selected-symbol-badge">{symbol}</span>
                        {showSymbolDropdown && (
                          <div className="symbol-dropdown">
                            <div className="dropdown-header">Major Stocks (50)</div>
                            {filteredStocks.slice(0, 20).map((stock) => (
                              <div
                                key={stock.symbol}
                                className={`dropdown-item ${symbol === stock.symbol ? 'selected' : ''}`}
                                onClick={() => handleSelectSymbol(stock.symbol)}
                              >
                                <span className="stock-symbol">{stock.symbol}</span>
                                <span className="stock-name">{stock.name}</span>
                              </div>
                            ))}
                            {filteredStocks.length === 0 && symbolSearch && (
                              <div className="dropdown-item no-results">
                                Press Enter to use "{symbolSearch}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Position Size (%)</label>
                      <input
                        type="number"
                        value={autoTradeConfig.positionSize * 100}
                        onChange={(e) =>
                          setAutoTradeConfig((prev) => ({
                            ...prev,
                            positionSize: parseFloat(e.target.value) / 100,
                          }))
                        }
                        min="1"
                        max="100"
                        step="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Positions</label>
                      <input
                        type="number"
                        value={autoTradeConfig.maxPositions}
                        onChange={(e) =>
                          setAutoTradeConfig((prev) => ({
                            ...prev,
                            maxPositions: parseInt(e.target.value),
                          }))
                        }
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Stop Loss (%)</label>
                      <input
                        type="number"
                        value={autoTradeConfig.stopLoss * 100}
                        onChange={(e) =>
                          setAutoTradeConfig((prev) => ({
                            ...prev,
                            stopLoss: parseFloat(e.target.value) / 100,
                          }))
                        }
                        min="0.5"
                        max="20"
                        step="0.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Take Profit (%)</label>
                      <input
                        type="number"
                        value={autoTradeConfig.takeProfit * 100}
                        onChange={(e) =>
                          setAutoTradeConfig((prev) => ({
                            ...prev,
                            takeProfit: parseFloat(e.target.value) / 100,
                          }))
                        }
                        min="1"
                        max="50"
                        step="0.5"
                      />
                    </div>
                  </div>

                  <div className="selected-strategy">
                    <span className="label">Selected Strategy:</span>
                    <span className="value">
                      {selectedTemplate?.name || customStrategy.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="warning-box">
                    <strong>Warning:</strong> Auto trading will execute real trades with real money (or paper money if in paper mode). Make sure you understand the risks.
                  </div>

                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleStartAutoTrade}
                    disabled={isStartingAutoTrade || !isAlpacaConnected || !selectedTemplate}
                  >
                    {isStartingAutoTrade ? 'Starting...' : 'Start Auto Trading'}
                  </button>
                </div>
              </div>

              <div className="builder-card">
                <h2>Strategy Summary</h2>
                {selectedTemplate ? (
                  <div className="strategy-summary">
                    <div className="summary-item">
                      <span className="label">Strategy</span>
                      <span className="value">{selectedTemplate.name}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Type</span>
                      <span className="value">{selectedTemplate.type}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Description</span>
                      <p className="description">{selectedTemplate.description}</p>
                    </div>
                    <div className="summary-item">
                      <span className="label">Parameters</span>
                      <div className="params-list">
                        {Object.entries(customStrategy.params || {}).map(([key, value]) => (
                          <div key={key} className="param-item">
                            <span className="param-key">{key}:</span>
                            <span className="param-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Select a strategy from the Strategy Builder tab first</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Monitor Tab */}
        {activeTab === 'monitor' && (
          <div className="tab-content">
            <div className="monitor-section">
              <div className="builder-card full-width">
                <div className="card-header">
                  <h2>Active Strategies</h2>
                  <button className="btn btn-secondary" onClick={loadActiveStrategies}>
                    Refresh
                  </button>
                </div>

                {activeStrategies.length > 0 ? (
                  <div className="strategies-table">
                    <div className="table-header">
                      <span>Strategy ID</span>
                      <span>Symbol</span>
                      <span>Type</span>
                      <span>Status</span>
                      <span>P&L</span>
                      <span>Trades</span>
                      <span>Last Signal</span>
                      <span>Actions</span>
                    </div>
                    {activeStrategies.map((strategy) => (
                      <div key={strategy.id} className="table-row">
                        <span className="strategy-id">{strategy.id}</span>
                        <span className="symbol">{strategy.symbol}</span>
                        <span className="type">{strategy.type}</span>
                        <span className={`status ${strategy.status}`}>{strategy.status}</span>
                        <span className={strategy.pnl >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(strategy.pnl || 0)}
                        </span>
                        <span>{strategy.trades || 0}</span>
                        <span className={`signal ${strategy.lastSignal?.signal || 'hold'}`}>
                          {strategy.lastSignal?.signal || 'N/A'}
                        </span>
                        <span className="actions">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStopAutoTrade(strategy.id)}
                          >
                            Stop
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No active strategies. Start one from the Auto Trading tab.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Strategy Optimizer Tab */}
        {activeTab === 'optimizer' && (
          <div className="tab-content">
            <div className="optimizer-intro">
              <h2>Real-Time Strategy Optimizer</h2>
              <p>
                Monitor live quotes, run ALL 15 strategies simultaneously, and auto-execute
                trades when the winning strategy exceeds your profit threshold.
              </p>
            </div>

            <div className="optimizer-grid">
              {/* Configuration Card */}
              <div className="optimizer-card config-card">
                <h3>Configuration</h3>

                {/* Symbols to Monitor */}
                <div className="config-section">
                  <label>Symbols to Monitor</label>
                  <div className="symbol-tags">
                    {optimizerSymbols.map((sym) => (
                      <span key={sym} className="symbol-tag">
                        {sym}
                        <button onClick={() => handleRemoveOptimizerSymbol(sym)}>x</button>
                      </span>
                    ))}
                  </div>
                  <div className="add-symbol-row">
                    <input
                      type="text"
                      placeholder="Add symbol (e.g., GOOGL)"
                      value={newOptimizerSymbol}
                      onChange={(e) => setNewOptimizerSymbol(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOptimizerSymbol()}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={handleAddOptimizerSymbol}>
                      Add
                    </button>
                  </div>
                  <div className="symbol-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleLoadMajorStocks}>
                      Load 50 Major Stocks
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={handleClearSymbols}>
                      Clear All
                    </button>
                    <span className="symbol-count">{optimizerSymbols.length} symbols</span>
                  </div>
                </div>

                {/* Profit Threshold */}
                <div className="config-section">
                  <label>Profit Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={optimizerConfig.profitThreshold}
                    onChange={(e) =>
                      setOptimizerConfig((prev) => ({
                        ...prev,
                        profitThreshold: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <small>Only execute trades with expected profit above this %</small>
                </div>

                {/* Confidence Threshold */}
                <div className="config-section">
                  <label>Confidence Threshold (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    step="5"
                    value={optimizerConfig.confidenceThreshold}
                    onChange={(e) =>
                      setOptimizerConfig((prev) => ({
                        ...prev,
                        confidenceThreshold: parseInt(e.target.value),
                      }))
                    }
                  />
                  <small>Minimum signal confidence required</small>
                </div>

                {/* Position Size */}
                <div className="config-section">
                  <label>Position Size (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={optimizerConfig.positionSizePercent}
                    onChange={(e) =>
                      setOptimizerConfig((prev) => ({
                        ...prev,
                        positionSizePercent: parseInt(e.target.value),
                      }))
                    }
                  />
                  <small>% of buying power per trade</small>
                </div>

                {/* Timeframe for Day Trading */}
                <div className="config-section">
                  <label>Timeframe (Day Trading)</label>
                  <select
                    value={optimizerConfig.timeframe}
                    onChange={(e) =>
                      setOptimizerConfig((prev) => ({
                        ...prev,
                        timeframe: e.target.value,
                      }))
                    }
                  >
                    <option value="1Min">1 Minute (Real-time)</option>
                    <option value="5Min">5 Minutes</option>
                    <option value="15Min">15 Minutes</option>
                  </select>
                  <small>Uses today's intraday data only</small>
                </div>

                {/* Check Interval */}
                <div className="config-section">
                  <label>Check Interval</label>
                  <select
                    value={optimizerConfig.checkIntervalMs}
                    onChange={(e) =>
                      setOptimizerConfig((prev) => ({
                        ...prev,
                        checkIntervalMs: parseInt(e.target.value),
                      }))
                    }
                  >
                    <option value={15000}>15 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                  </select>
                </div>

                {/* Consensus Configuration */}
                <div className="config-section consensus-config">
                  <label>
                    <input
                      type="checkbox"
                      checked={optimizerConfig.consensusEnabled}
                      onChange={(e) =>
                        setOptimizerConfig((prev) => ({
                          ...prev,
                          consensusEnabled: e.target.checked,
                        }))
                      }
                    />
                    Enable Consensus Mode
                  </label>
                  <small>BUY only when multiple strategies agree</small>
                </div>

                {optimizerConfig.consensusEnabled && (
                  <>
                    <div className="config-section">
                      <label>Min Strategies to Agree</label>
                      <select
                        value={optimizerConfig.minConsensusCount}
                        onChange={(e) =>
                          setOptimizerConfig((prev) => ({
                            ...prev,
                            minConsensusCount: parseInt(e.target.value),
                          }))
                        }
                      >
                        <option value={0}>0 (Show all with any signal)</option>
                        <option value={1}>1 strategy</option>
                        {[...Array(15)].map((_, i) => (
                          <option key={i + 2} value={i + 2}>
                            {i + 2} strategies
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="strategy-selector">
                      <label>Select Strategies for Consensus ({optimizerConfig.enabledStrategies.length} selected)</label>
                      <div className="strategy-grid">
                        {allStrategies.map((strategy) => (
                          <div
                            key={strategy.id}
                            className={`strategy-chip ${optimizerConfig.enabledStrategies.includes(strategy.id) ? 'selected' : ''} risk-${strategy.riskLevel}`}
                            onClick={() => toggleStrategy(strategy.id)}
                          >
                            <span className="strategy-name">{strategy.name}</span>
                            <span className={`risk-badge ${strategy.riskLevel}`}>{strategy.riskLevel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="optimizer-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing || !isAlpacaConnected}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis (Test)'}
                  </button>

                  {optimizerStatus?.isRunning ? (
                    <button className="btn btn-danger" onClick={handleStopOptimizer}>
                      Stop Optimizer
                    </button>
                  ) : (
                    <button
                      className="btn btn-success"
                      onClick={handleStartOptimizer}
                      disabled={isStartingOptimizer || !isAlpacaConnected}
                    >
                      {isStartingOptimizer ? 'Starting...' : 'Start Auto-Optimizer'}
                    </button>
                  )}
                </div>

                {!isAlpacaConnected && (
                  <div className="warning-box">
                    Please connect to Alpaca first in the Command Center
                  </div>
                )}
              </div>

              {/* Analysis Results Card */}
              <div className="optimizer-card results-card">
                <h3>Analysis Results</h3>

                {isAnalyzing && (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Running all 15 strategies on {optimizerSymbols.length} symbols...</p>
                  </div>
                )}

                {!isAnalyzing && analysisResults && (
                  <div className="analysis-results">
                    {/* Last Updated Timestamp - PROOF OF AUTO-REFRESH */}
                    <div className={`last-updated-banner ${isRefreshing ? 'refreshing' : ''}`}>
                      <span className="pulse-indicator"></span>
                      <strong>Last Updated:</strong>{' '}
                      {isRefreshing ? (
                        <span className="refreshing-text">Refreshing...</span>
                      ) : (
                        <span className="timestamp">{lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'N/A'}</span>
                      )}
                      {optimizerStatus?.isRunning && (
                        <span className="auto-refresh-badge">Auto-refreshing every {optimizerConfig.checkIntervalMs / 1000}s</span>
                      )}
                    </div>

                    {/* Filter Toggle - Show only consensus stocks */}
                    <div className="filter-toggle-bar">
                      <label className="filter-toggle">
                        <input
                          type="checkbox"
                          checked={showOnlyConsensus}
                          onChange={(e) => setShowOnlyConsensus(e.target.checked)}
                        />
                        <span>Show only stocks with consensus (BUY/SELL signals)</span>
                      </label>
                      <div className="filter-stats">
                        {(() => {
                          const matchingStocks = Object.entries(analysisResults).filter(([, r]) => {
                            if (optimizerConfig.minConsensusCount === 0) {
                              return (r.consensus?.buyCount > 0 || r.consensus?.sellCount > 0);
                            }
                            return r.consensus?.consensusMet && r.consensus?.recommendation !== 'HOLD';
                          });
                          return (
                            <span className="consensus-count">
                              <strong>{matchingStocks.length}</strong> of {Object.keys(analysisResults).length} stocks
                              {optimizerConfig.minConsensusCount === 0 ? ' have signals' : ' have consensus'}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Filtered Analysis Results */}
                    {Object.entries(analysisResults)
                      .filter(([, result]) => {
                        if (!showOnlyConsensus) return true;
                        // When minConsensusCount is 0, show all stocks with any BUY or SELL signal
                        if (optimizerConfig.minConsensusCount === 0) {
                          return (result.consensus?.buyCount > 0 || result.consensus?.sellCount > 0);
                        }
                        // Otherwise, only show stocks where consensus is met AND it's BUY or SELL
                        return result.consensus?.consensusMet && result.consensus?.recommendation !== 'HOLD';
                      })
                      .map(([sym, result]) => (
                      <div key={sym} className="symbol-analysis">
                        <div className="symbol-header">
                          <h4>{sym}</h4>
                          <div className="price-info">
                            <span className="price">${result.currentPrice?.toFixed(2)}</span>
                            {result.realTimeQuote && (
                              <span className="quote-spread">
                                (Bid: ${result.realTimeQuote.bidPrice?.toFixed(2)} / Ask: ${result.realTimeQuote.askPrice?.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Day Change Stats */}
                        <div className="day-stats">
                          <span className="stat">
                            Open: <strong>${result.openPrice?.toFixed(2)}</strong>
                          </span>
                          <span className={`stat change ${parseFloat(result.dayChangePercent) >= 0 ? 'positive' : 'negative'}`}>
                            Day: <strong>{parseFloat(result.dayChangePercent) >= 0 ? '+' : ''}{result.dayChangePercent}%</strong>
                          </span>
                          <span className="stat">
                            {result.barsAnalyzed || 0} bars ({result.timeframe || '1Min'})
                          </span>
                        </div>

                        {result.error && (
                          <div className="error-message">
                            <p>{result.error}</p>
                          </div>
                        )}

                        {/* Best Strategy Winner */}
                        {result.bestStrategy ? (
                          <div className="winner-card">
                            <div className="winner-badge">BEST STRATEGY TODAY</div>
                            <div className="winner-details">
                              <div className="strategy-name">{result.bestStrategy.strategyName}</div>
                              <div className="winner-stats">
                                <span className={`profit ${result.bestStrategy.profit >= 0 ? 'positive' : 'negative'}`}>
                                  {result.bestStrategy.profit >= 0 ? '+' : ''}{result.bestStrategy.profit?.toFixed(2)}% profit
                                </span>
                                <span className="trades">{result.bestStrategy.totalTrades} trades</span>
                                <span className="winrate">{result.bestStrategy.winRate?.toFixed(0)}% win rate</span>
                              </div>
                              {result.bestStrategy.currentPosition && (
                                <div className="current-position">
                                  Currently holding at ${result.bestStrategy.entryPrice?.toFixed(2)}
                                  <span className={`unrealized ${result.bestStrategy.unrealizedProfit >= 0 ? 'positive' : 'negative'}`}>
                                    ({result.bestStrategy.unrealizedProfit >= 0 ? '+' : ''}{result.bestStrategy.unrealizedProfit?.toFixed(2)}% unrealized)
                                  </span>
                                </div>
                              )}

                              {/* Show actual trades for proof */}
                              {result.bestStrategy.trades?.length > 0 && (
                                <div className="trade-history">
                                  <strong>Trade History (Proof):</strong>
                                  <div className="trade-list">
                                    {result.bestStrategy.trades.slice(-10).map((trade, idx) => (
                                      <div key={idx} className={`trade-item ${trade.type.toLowerCase()}`}>
                                        <span className="trade-type">{trade.type}</span>
                                        <span className="trade-price">${trade.price?.toFixed(2)}</span>
                                        {trade.profit !== undefined && (
                                          <span className={`trade-profit ${trade.profit >= 0 ? 'positive' : 'negative'}`}>
                                            {trade.profit >= 0 ? '+' : ''}{trade.profit?.toFixed(2)}%
                                          </span>
                                        )}
                                        <span className="trade-time">
                                          {trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString() : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="profit-breakdown">
                                    <span>Realized: {result.bestStrategy.realizedProfit?.toFixed(2)}%</span>
                                    <span>Unrealized: {result.bestStrategy.unrealizedProfit?.toFixed(2)}%</span>
                                    <span><strong>Total: {result.bestStrategy.profit?.toFixed(2)}%</strong></span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="no-winner">
                            <p>No profitable strategies found today</p>
                          </div>
                        )}

                        {/* Consensus Recommendation */}
                        {result.consensus && (
                          <div className={`consensus-card ${result.consensus.recommendation.toLowerCase()}`}>
                            <div className="consensus-header">
                              <span className="consensus-label">CONSENSUS RECOMMENDATION</span>
                              <span className={`consensus-signal ${result.consensus.recommendation.toLowerCase()}`}>
                                {result.consensus.recommendation}
                              </span>
                            </div>
                            <div className="consensus-details">
                              <div className="consensus-counts">
                                <span className="count buy">
                                  <strong>{result.consensus.buyCount}</strong> BUY
                                </span>
                                <span className="count sell">
                                  <strong>{result.consensus.sellCount}</strong> SELL
                                </span>
                                <span className="count hold">
                                  <strong>{result.consensus.holdCount}</strong> HOLD
                                </span>
                              </div>
                              <div className="consensus-status">
                                {result.consensus.enabled ? (
                                  result.consensus.consensusMet ? (
                                    <span className="status met">
                                      Consensus Met ({result.consensus.consensusStrength}% agree)
                                    </span>
                                  ) : (
                                    <span className="status not-met">
                                      Need {result.consensus.minRequired} strategies to agree (have {Math.max(result.consensus.buyCount, result.consensus.sellCount)})
                                    </span>
                                  )
                                ) : (
                                  <span className="status disabled">Consensus mode disabled</span>
                                )}
                              </div>
                              {result.consensus.buyStrategies?.length > 0 && (
                                <div className="consensus-strategies">
                                  <span className="label">Buying:</span>
                                  <span className="strategies">{result.consensus.buyStrategies.join(', ')}</span>
                                </div>
                              )}
                              {result.consensus.sellStrategies?.length > 0 && (
                                <div className="consensus-strategies">
                                  <span className="label">Selling:</span>
                                  <span className="strategies">{result.consensus.sellStrategies.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Matching Strategies - Only show strategies that agree with consensus */}
                        <div className="top-strategies">
                          {showOnlyConsensus && (result.consensus?.consensusMet || optimizerConfig.minConsensusCount === 0) ? (
                            <>
                              <strong className="consensus-matched-header">
                                {optimizerConfig.minConsensusCount === 0 ? (
                                  <>All Signals ({result.consensus?.buyCount || 0} BUY, {result.consensus?.sellCount || 0} SELL):</>
                                ) : (
                                  <>Matching Strategies ({result.consensus?.recommendation === 'BUY'
                                    ? result.consensus?.buyCount
                                    : result.consensus?.sellCount} strategies agree on {result.consensus?.recommendation}):</>
                                )}
                              </strong>
                              {result.signals?.length > 0 ? (
                                result.signals
                                  .filter(s => {
                                    if (optimizerConfig.minConsensusCount === 0) {
                                      // Show all BUY and SELL signals
                                      return s.signal === 'BUY' || s.signal === 'SELL';
                                    }
                                    // Only show strategies that match the consensus recommendation
                                    return s.signal === result.consensus?.recommendation;
                                  })
                                  .map((s, i) => (
                                    <div key={i} className={`strategy-row consensus-matched ${s.signal.toLowerCase()}`}>
                                      <span className="rank">#{i + 1}</span>
                                      <span className="name">{s.strategyName}</span>
                                      <span className={`signal ${s.signal.toLowerCase()}`}>
                                        {s.signal}
                                      </span>
                                      <span className="confidence">{s.confidence}% conf</span>
                                    </div>
                                  ))
                              ) : (
                                <p className="no-data">No matching strategies found</p>
                              )}
                            </>
                          ) : (
                            <>
                              <strong>Strategy Performance Today ({result.strategyProfits?.length || 0} strategies):</strong>
                              {result.strategyProfits?.length > 0 ? (
                                result.strategyProfits.slice(0, 8).map((s, i) => (
                                  <div key={i} className={`strategy-row ${s.profit > 0 ? 'profitable' : s.profit < 0 ? 'losing' : ''}`}>
                                    <span className="rank">#{i + 1}</span>
                                    <span className="name">{s.strategyName}</span>
                                    <span className={`profit ${s.profit >= 0 ? 'positive' : 'negative'}`}>
                                      {s.profit >= 0 ? '+' : ''}{s.profit?.toFixed(2)}%
                                    </span>
                                    <span className="trades">{s.totalTrades} trades</span>
                                    <span className="winrate">{s.winRate?.toFixed(0)}% win</span>
                                  </div>
                                ))
                              ) : (
                                <p className="no-data">No strategy data - check if Alpaca is connected or market is open</p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Current Signals - Filtered by consensus when enabled */}
                        {result.signals?.length > 0 && (
                          <div className="current-signals">
                            <strong>
                              {showOnlyConsensus && result.consensus?.consensusMet
                                ? `Agreeing Signals (${result.consensus.recommendation}):`
                                : 'Current Signals (What to do now):'}
                            </strong>
                            {(() => {
                              const filteredSignals = showOnlyConsensus && result.consensus?.consensusMet
                                ? result.signals.filter(s => s.signal === result.consensus.recommendation)
                                : result.signals.filter(s => s.signal !== 'HOLD');

                              return filteredSignals.length > 0 ? (
                                filteredSignals.slice(0, 10).map((s, i) => (
                                  <div key={i} className={`signal-row ${showOnlyConsensus ? 'consensus-signal' : ''}`}>
                                    <span className="name">{s.strategyName}</span>
                                    <span className={`signal ${s.signal.toLowerCase()}`}>{s.signal}</span>
                                    <span className="confidence">{s.confidence}%</span>
                                  </div>
                                ))
                              ) : (
                                <p className="no-signals">
                                  {showOnlyConsensus ? 'No matching signals' : 'All strategies say HOLD'}
                                </p>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* No consensus stocks message */}
                    {showOnlyConsensus && Object.entries(analysisResults).filter(([, r]) => {
                      if (optimizerConfig.minConsensusCount === 0) {
                        return (r.consensus?.buyCount > 0 || r.consensus?.sellCount > 0);
                      }
                      return r.consensus?.consensusMet && r.consensus?.recommendation !== 'HOLD';
                    }).length === 0 && (
                      <div className="no-consensus-stocks">
                        <p>
                          {optimizerConfig.minConsensusCount === 0
                            ? 'No stocks currently have any BUY/SELL signals.'
                            : 'No stocks currently have consensus (BUY/SELL) signals.'}
                        </p>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                          Uncheck the filter above to see all {Object.keys(analysisResults).length} stocks,
                          or wait for strategies to generate signals.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!isAnalyzing && !analysisResults && (
                  <div className="empty-state">
                    <p>Click "Run Analysis" to test all strategies on your symbols</p>
                  </div>
                )}
              </div>

              {/* Status Card */}
              {optimizerStatus?.isRunning && (
                <div className="optimizer-card status-card">
                  <h3>Optimizer Status</h3>
                  <div className="status-running">
                    <div className="pulse-dot"></div>
                    <span>Running</span>
                  </div>
                  <div className="status-details">
                    <p><strong>Symbols:</strong> {optimizerStatus.monitoredSymbols?.join(', ')}</p>
                    <p><strong>Check Interval:</strong> {optimizerStatus.config?.checkIntervalMs / 1000}s</p>
                    <p><strong>Recent Trades:</strong> {optimizerStatus.recentTrades?.length || 0}</p>
                  </div>

                  {optimizerStatus.recentTrades?.length > 0 && (
                    <div className="recent-trades">
                      <h4>Recent Executed Trades</h4>
                      {optimizerStatus.recentTrades.slice(-5).map((trade, i) => (
                        <div key={i} className="trade-row">
                          <span className={`side ${trade.side.toLowerCase()}`}>{trade.side}</span>
                          <span className="symbol">{trade.symbol}</span>
                          <span className="shares">{trade.shares} shares</span>
                          <span className="strategy">{trade.strategy}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgoTradingPage;
