/**
 * Alpaca Broker Implementation
 * Commission-free trading API designed for algo trading
 * https://alpaca.markets/docs/api-documentation/
 */
const BaseBroker = require('./baseBroker');
const Alpaca = require('@alpacahq/alpaca-trade-api');

class AlpacaBroker extends BaseBroker {
  constructor() {
    super('Alpaca');
    this.client = null;
    this.feed = 'iex';
  }

  async initialize(credentials, paper = true) {
    const { apiKey, secretKey } = credentials;

    if (!apiKey || !secretKey) {
      throw new Error('Alpaca API key and secret key are required');
    }

    const baseUrl = paper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';

    this.client = new Alpaca({
      keyId: apiKey,
      secretKey: secretKey,
      paper: paper,
      baseUrl: baseUrl,
      feed: 'iex',
    });

    this.isInitialized = true;
    this.isPaper = paper;
    console.log(`Alpaca initialized in ${paper ? 'PAPER' : 'LIVE'} mode`);
    return { success: true, mode: paper ? 'paper' : 'live' };
  }

  disconnect() {
    this.client = null;
    this.isInitialized = false;
    console.log('Alpaca disconnected');
  }

  // ==================== ACCOUNT ====================

  async getAccount() {
    this.checkInitialized();
    const account = await this.client.getAccount();
    return {
      id: account.id,
      status: account.status,
      currency: account.currency,
      buyingPower: parseFloat(account.buying_power),
      cash: parseFloat(account.cash),
      portfolioValue: parseFloat(account.portfolio_value),
      equity: parseFloat(account.equity),
      lastEquity: parseFloat(account.last_equity),
      longMarketValue: parseFloat(account.long_market_value),
      shortMarketValue: parseFloat(account.short_market_value),
      daytradeCount: account.daytrade_count,
      patternDayTrader: account.pattern_day_trader,
      tradingBlocked: account.trading_blocked,
      dayChange: parseFloat(account.equity) - parseFloat(account.last_equity),
      dayChangePercent: ((parseFloat(account.equity) - parseFloat(account.last_equity)) / parseFloat(account.last_equity)) * 100,
    };
  }

  // ==================== POSITIONS ====================

  async getPositions() {
    this.checkInitialized();
    const positions = await this.client.getPositions();
    return positions.map(p => ({
      symbol: p.symbol,
      qty: parseFloat(p.qty),
      side: parseFloat(p.qty) > 0 ? 'long' : 'short',
      marketValue: parseFloat(p.market_value),
      costBasis: parseFloat(p.cost_basis),
      unrealizedPL: parseFloat(p.unrealized_pl),
      unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100,
      currentPrice: parseFloat(p.current_price),
      avgEntryPrice: parseFloat(p.avg_entry_price),
      changeToday: parseFloat(p.change_today) * 100,
    }));
  }

  async getPosition(symbol) {
    this.checkInitialized();
    try {
      const p = await this.client.getPosition(symbol);
      return {
        symbol: p.symbol,
        qty: parseFloat(p.qty),
        side: parseFloat(p.qty) > 0 ? 'long' : 'short',
        marketValue: parseFloat(p.market_value),
        costBasis: parseFloat(p.cost_basis),
        unrealizedPL: parseFloat(p.unrealized_pl),
        unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100,
        currentPrice: parseFloat(p.current_price),
        avgEntryPrice: parseFloat(p.avg_entry_price),
      };
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw error;
    }
  }

  async closePosition(symbol) {
    this.checkInitialized();
    return await this.client.closePosition(symbol);
  }

  // ==================== ORDERS ====================

  async placeOrder(orderParams) {
    this.checkInitialized();
    const params = this.normalizeOrderParams(orderParams);

    const order = await this.client.createOrder({
      symbol: params.symbol,
      qty: params.qty,
      side: params.side,
      type: params.type,
      time_in_force: params.timeInForce,
      limit_price: params.limitPrice,
      stop_price: params.stopPrice,
    });

    return {
      id: order.id,
      clientOrderId: order.client_order_id,
      symbol: order.symbol,
      qty: parseFloat(order.qty),
      side: order.side,
      type: order.type,
      status: order.status,
      filledQty: parseFloat(order.filled_qty || 0),
      filledAvgPrice: parseFloat(order.filled_avg_price || 0),
      createdAt: order.created_at,
    };
  }

  async getOrders(status = 'all') {
    this.checkInitialized();
    const orders = await this.client.getOrders({ status });
    return orders.map(o => ({
      id: o.id,
      symbol: o.symbol,
      qty: parseFloat(o.qty),
      side: o.side,
      type: o.type,
      status: o.status,
      filledQty: parseFloat(o.filled_qty || 0),
      filledAvgPrice: parseFloat(o.filled_avg_price || 0),
      limitPrice: o.limit_price ? parseFloat(o.limit_price) : null,
      stopPrice: o.stop_price ? parseFloat(o.stop_price) : null,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));
  }

  async getOrder(orderId) {
    this.checkInitialized();
    const o = await this.client.getOrder(orderId);
    return {
      id: o.id,
      symbol: o.symbol,
      qty: parseFloat(o.qty),
      side: o.side,
      type: o.type,
      status: o.status,
      filledQty: parseFloat(o.filled_qty || 0),
      filledAvgPrice: parseFloat(o.filled_avg_price || 0),
      createdAt: o.created_at,
    };
  }

  async cancelOrder(orderId) {
    this.checkInitialized();
    return await this.client.cancelOrder(orderId);
  }

  async cancelAllOrders() {
    this.checkInitialized();
    return await this.client.cancelAllOrders();
  }

  // ==================== MARKET DATA ====================

  async getQuote(symbol) {
    this.checkInitialized();
    try {
      // Get both quote and trade for more complete data
      const [quote, trade] = await Promise.all([
        this.client.getLatestQuote(symbol),
        this.client.getLatestTrade(symbol).catch(() => null),
      ]);

      // Try to get snapshot for additional data
      let snapshot = null;
      try {
        const snapshots = await this.client.getSnapshots([symbol]);
        snapshot = snapshots[symbol];
      } catch (e) {
        // Snapshot not available
      }

      const price = trade?.Price || (quote.BidPrice + quote.AskPrice) / 2;

      return {
        symbol,
        price,
        bidPrice: quote.BidPrice,
        bidSize: quote.BidSize,
        askPrice: quote.AskPrice,
        askSize: quote.AskSize,
        last: price,
        high: snapshot?.DailyBar?.HighPrice,
        low: snapshot?.DailyBar?.LowPrice,
        open: snapshot?.DailyBar?.OpenPrice,
        close: snapshot?.DailyBar?.ClosePrice,
        volume: snapshot?.DailyBar?.Volume || trade?.Size,
        change: snapshot ? (price - snapshot.PrevDailyBar?.ClosePrice) : null,
        changePercent: snapshot?.PrevDailyBar?.ClosePrice
          ? ((price - snapshot.PrevDailyBar.ClosePrice) / snapshot.PrevDailyBar.ClosePrice) * 100
          : null,
        timestamp: quote.Timestamp,
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getBars(symbol, timeframe, start, end, limit = 100) {
    this.checkInitialized();

    try {
      // Calculate default start date if not provided
      if (!start) {
        const startDate = new Date();
        switch (timeframe) {
          case '1Min':
            startDate.setHours(startDate.getHours() - 4);
            break;
          case '5Min':
            startDate.setHours(startDate.getHours() - 12);
            break;
          case '15Min':
            startDate.setDate(startDate.getDate() - 2);
            break;
          case '1Hour':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '1Day':
          default:
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        }
        start = startDate.toISOString();
      }

      const options = {
        start,
        timeframe,
        limit,
        feed: this.feed,
      };
      if (end) options.end = end;

      const bars = await this.client.getBarsV2(symbol, options);

      const result = [];
      for await (const bar of bars) {
        result.push({
          timestamp: bar.Timestamp,
          open: bar.OpenPrice,
          high: bar.HighPrice,
          low: bar.LowPrice,
          close: bar.ClosePrice,
          volume: bar.Volume,
          vwap: bar.VWAP,
        });
      }
      return result;
    } catch (error) {
      console.error(`Error fetching bars for ${symbol}:`, error.message);
      throw error;
    }
  }

  async isMarketOpen() {
    this.checkInitialized();
    const clock = await this.client.getClock();
    return clock.is_open;
  }

  getCapabilities() {
    return {
      stocks: true,
      options: false,
      futures: false,
      forex: false,
      crypto: true,
      fractionalShares: true,
      extendedHours: true,
      paperTrading: true,
    };
  }

  static getRequiredCredentials() {
    return [
      { key: 'apiKey', label: 'API Key', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
    ];
  }
}

module.exports = AlpacaBroker;
