const Alpaca = require('@alpacahq/alpaca-trade-api');

class AlpacaService {
  constructor() {
    this.alpaca = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the Alpaca client with API keys
   */
  initialize(apiKey, secretKey, paper = true) {
    if (!apiKey || !secretKey) {
      throw new Error('Alpaca API key and secret key are required');
    }

    // Determine the base URL based on paper/live mode
    const baseUrl = paper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';

    this.alpaca = new Alpaca({
      keyId: apiKey,
      secretKey: secretKey,
      paper: paper,
      baseUrl: baseUrl,
      feed: 'iex', // Use IEX feed (free) instead of SIP (paid)
    });

    this.isInitialized = true;
    this.feed = 'iex';
    console.log(`Alpaca initialized in ${paper ? 'PAPER' : 'LIVE'} mode`);
    console.log(`Using base URL: ${baseUrl}`);
    console.log(`Using data feed: IEX (free)`);
  }

  /**
   * Check if service is initialized
   */
  checkInitialized() {
    if (!this.isInitialized || !this.alpaca) {
      throw new Error('Alpaca service not initialized. Please set API keys first.');
    }
  }

  /**
   * Disconnect from Alpaca
   */
  disconnect() {
    this.alpaca = null;
    this.isInitialized = false;
    this.feed = null;
    console.log('Alpaca disconnected');
  }

  // ==================== ACCOUNT ====================

  /**
   * Get account information
   */
  async getAccount() {
    this.checkInitialized();
    try {
      const account = await this.alpaca.getAccount();
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
        initialMargin: parseFloat(account.initial_margin),
        maintenanceMargin: parseFloat(account.maintenance_margin),
        daytradeCount: account.daytrade_count,
        patternDayTrader: account.pattern_day_trader,
        tradingBlocked: account.trading_blocked,
        transfersBlocked: account.transfers_blocked,
        accountBlocked: account.account_blocked,
        createdAt: account.created_at,
        // Calculated fields
        dayChange: parseFloat(account.equity) - parseFloat(account.last_equity),
        dayChangePercent: ((parseFloat(account.equity) - parseFloat(account.last_equity)) / parseFloat(account.last_equity)) * 100,
      };
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  }

  // ==================== POSITIONS ====================

  /**
   * Get all positions
   */
  async getPositions() {
    this.checkInitialized();
    try {
      const positions = await this.alpaca.getPositions();
      return positions.map(pos => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        side: pos.side,
        avgEntryPrice: parseFloat(pos.avg_entry_price),
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        currentPrice: parseFloat(pos.current_price),
        lastdayPrice: parseFloat(pos.lastday_price),
        changeToday: parseFloat(pos.change_today),
        unrealizedPL: parseFloat(pos.unrealized_pl),
        unrealizedPLPercent: parseFloat(pos.unrealized_plpc) * 100,
        unrealizedIntradayPL: parseFloat(pos.unrealized_intraday_pl),
        unrealizedIntradayPLPercent: parseFloat(pos.unrealized_intraday_plpc) * 100,
        assetId: pos.asset_id,
        exchange: pos.exchange,
      }));
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  /**
   * Get position for a specific symbol
   */
  async getPosition(symbol) {
    this.checkInitialized();
    try {
      const pos = await this.alpaca.getPosition(symbol.toUpperCase());
      return {
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        side: pos.side,
        avgEntryPrice: parseFloat(pos.avg_entry_price),
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        currentPrice: parseFloat(pos.current_price),
        unrealizedPL: parseFloat(pos.unrealized_pl),
        unrealizedPLPercent: parseFloat(pos.unrealized_plpc) * 100,
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Close a position
   */
  async closePosition(symbol) {
    this.checkInitialized();
    try {
      const result = await this.alpaca.closePosition(symbol.toUpperCase());
      return result;
    } catch (error) {
      console.error(`Error closing position ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Close all positions
   */
  async closeAllPositions() {
    this.checkInitialized();
    try {
      const result = await this.alpaca.closeAllPositions();
      return result;
    } catch (error) {
      console.error('Error closing all positions:', error);
      throw error;
    }
  }

  // ==================== ORDERS ====================

  /**
   * Get all orders
   */
  async getOrders(status = 'all', limit = 100) {
    this.checkInitialized();
    try {
      const orders = await this.alpaca.getOrders({
        status: status,
        limit: limit,
        direction: 'desc',
      });
      return orders.map(order => this.formatOrder(order));
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Get a specific order
   */
  async getOrder(orderId) {
    this.checkInitialized();
    try {
      const order = await this.alpaca.getOrder(orderId);
      return this.formatOrder(order);
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Place a new order
   */
  async placeOrder(orderParams) {
    this.checkInitialized();
    const {
      symbol,
      qty,
      side,
      type = 'market',
      timeInForce = 'day',
      limitPrice,
      stopPrice,
      trailPrice,
      trailPercent,
    } = orderParams;

    // Validate required fields
    if (!symbol || !qty || !side) {
      throw new Error('Symbol, quantity, and side are required');
    }

    // Build order object
    const order = {
      symbol: symbol.toUpperCase(),
      qty: parseFloat(qty),
      side: side.toLowerCase(),
      type: type.toLowerCase(),
      time_in_force: timeInForce.toLowerCase(),
    };

    // Add price fields based on order type
    if (type === 'limit' || type === 'stop_limit') {
      if (!limitPrice) throw new Error('Limit price required for limit orders');
      order.limit_price = parseFloat(limitPrice);
    }

    if (type === 'stop' || type === 'stop_limit') {
      if (!stopPrice) throw new Error('Stop price required for stop orders');
      order.stop_price = parseFloat(stopPrice);
    }

    if (type === 'trailing_stop') {
      if (trailPrice) {
        order.trail_price = parseFloat(trailPrice);
      } else if (trailPercent) {
        order.trail_percent = parseFloat(trailPercent);
      } else {
        throw new Error('Trail price or trail percent required for trailing stop orders');
      }
    }

    try {
      const result = await this.alpaca.createOrder(order);
      return this.formatOrder(result);
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    this.checkInitialized();
    try {
      await this.alpaca.cancelOrder(orderId);
      return { success: true, orderId };
    } catch (error) {
      console.error(`Error canceling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel all open orders
   */
  async cancelAllOrders() {
    this.checkInitialized();
    try {
      const result = await this.alpaca.cancelAllOrders();
      return result;
    } catch (error) {
      console.error('Error canceling all orders:', error);
      throw error;
    }
  }

  /**
   * Format order object
   */
  formatOrder(order) {
    return {
      id: order.id,
      clientOrderId: order.client_order_id,
      symbol: order.symbol,
      qty: parseFloat(order.qty),
      filledQty: parseFloat(order.filled_qty || 0),
      side: order.side,
      type: order.type,
      timeInForce: order.time_in_force,
      limitPrice: order.limit_price ? parseFloat(order.limit_price) : null,
      stopPrice: order.stop_price ? parseFloat(order.stop_price) : null,
      filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      submittedAt: order.submitted_at,
      filledAt: order.filled_at,
      canceledAt: order.canceled_at,
      expiredAt: order.expired_at,
      assetId: order.asset_id,
      assetClass: order.asset_class,
      extendedHours: order.extended_hours,
    };
  }

  // ==================== MARKET DATA ====================

  /**
   * Get latest quote for a symbol
   */
  async getQuote(symbol) {
    this.checkInitialized();
    try {
      const quote = await this.alpaca.getLatestQuote(symbol.toUpperCase(), { feed: 'iex' });
      return {
        symbol: symbol.toUpperCase(),
        askPrice: quote.AskPrice,
        askSize: quote.AskSize,
        bidPrice: quote.BidPrice,
        bidSize: quote.BidSize,
        timestamp: quote.Timestamp,
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get latest trade for a symbol
   */
  async getLatestTrade(symbol) {
    this.checkInitialized();
    try {
      const trade = await this.alpaca.getLatestTrade(symbol.toUpperCase(), { feed: 'iex' });
      return {
        symbol: symbol.toUpperCase(),
        price: trade.Price,
        size: trade.Size,
        timestamp: trade.Timestamp,
        exchange: trade.Exchange,
      };
    } catch (error) {
      console.error(`Error fetching trade for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get historical bars
   */
  async getBars(symbol, timeframe = '1Day', start, end, limit = 100) {
    this.checkInitialized();
    try {
      const options = {
        start: start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: end || new Date().toISOString(),
        limit: limit,
        timeframe: timeframe,
        feed: 'iex', // Use free IEX data feed
      };

      const bars = await this.alpaca.getBarsV2(symbol.toUpperCase(), options);
      const barsArray = [];

      for await (const bar of bars) {
        barsArray.push({
          timestamp: bar.Timestamp,
          open: bar.OpenPrice,
          high: bar.HighPrice,
          low: bar.LowPrice,
          close: bar.ClosePrice,
          volume: bar.Volume,
          vwap: bar.VWAP,
          tradeCount: bar.TradeCount,
        });
      }

      return barsArray;
    } catch (error) {
      console.error(`Error fetching bars for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get snapshot for multiple symbols
   */
  async getSnapshots(symbols) {
    this.checkInitialized();
    try {
      const snapshots = await this.alpaca.getSnapshots(symbols.map(s => s.toUpperCase()));
      const result = {};

      for (const [symbol, snapshot] of Object.entries(snapshots)) {
        result[symbol] = {
          symbol: symbol,
          latestTrade: snapshot.LatestTrade ? {
            price: snapshot.LatestTrade.Price,
            size: snapshot.LatestTrade.Size,
            timestamp: snapshot.LatestTrade.Timestamp,
          } : null,
          latestQuote: snapshot.LatestQuote ? {
            askPrice: snapshot.LatestQuote.AskPrice,
            bidPrice: snapshot.LatestQuote.BidPrice,
          } : null,
          minuteBar: snapshot.MinuteBar ? {
            open: snapshot.MinuteBar.OpenPrice,
            high: snapshot.MinuteBar.HighPrice,
            low: snapshot.MinuteBar.LowPrice,
            close: snapshot.MinuteBar.ClosePrice,
            volume: snapshot.MinuteBar.Volume,
          } : null,
          dailyBar: snapshot.DailyBar ? {
            open: snapshot.DailyBar.OpenPrice,
            high: snapshot.DailyBar.HighPrice,
            low: snapshot.DailyBar.LowPrice,
            close: snapshot.DailyBar.ClosePrice,
            volume: snapshot.DailyBar.Volume,
          } : null,
          prevDailyBar: snapshot.PrevDailyBar ? {
            open: snapshot.PrevDailyBar.OpenPrice,
            high: snapshot.PrevDailyBar.HighPrice,
            low: snapshot.PrevDailyBar.LowPrice,
            close: snapshot.PrevDailyBar.ClosePrice,
            volume: snapshot.PrevDailyBar.Volume,
          } : null,
        };
      }

      return result;
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      throw error;
    }
  }

  // ==================== ASSETS ====================

  /**
   * Get asset info
   */
  async getAsset(symbol) {
    this.checkInitialized();
    try {
      const asset = await this.alpaca.getAsset(symbol.toUpperCase());
      return {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        exchange: asset.exchange,
        assetClass: asset.class,
        tradable: asset.tradable,
        marginable: asset.marginable,
        shortable: asset.shortable,
        easyToBorrow: asset.easy_to_borrow,
        fractionable: asset.fractionable,
        status: asset.status,
      };
    } catch (error) {
      console.error(`Error fetching asset ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Search assets
   */
  async searchAssets(query) {
    this.checkInitialized();
    try {
      const assets = await this.alpaca.getAssets({
        status: 'active',
        asset_class: 'us_equity',
      });

      const filtered = assets
        .filter(asset =>
          asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
          (asset.name && asset.name.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 20);

      return filtered.map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        exchange: asset.exchange,
        tradable: asset.tradable,
      }));
    } catch (error) {
      console.error('Error searching assets:', error);
      throw error;
    }
  }

  // ==================== CLOCK & CALENDAR ====================

  /**
   * Get market clock
   */
  async getClock() {
    this.checkInitialized();
    try {
      const clock = await this.alpaca.getClock();
      return {
        timestamp: clock.timestamp,
        isOpen: clock.is_open,
        nextOpen: clock.next_open,
        nextClose: clock.next_close,
      };
    } catch (error) {
      console.error('Error fetching clock:', error);
      throw error;
    }
  }

  /**
   * Get market calendar
   */
  async getCalendar(start, end) {
    this.checkInitialized();
    try {
      const calendar = await this.alpaca.getCalendar({
        start: start,
        end: end,
      });
      return calendar.map(day => ({
        date: day.date,
        open: day.open,
        close: day.close,
      }));
    } catch (error) {
      console.error('Error fetching calendar:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AlpacaService();
