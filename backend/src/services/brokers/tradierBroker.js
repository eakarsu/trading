/**
 * Tradier Broker Implementation
 * Developer-friendly REST API with flat-rate pricing
 * https://documentation.tradier.com/
 */
const BaseBroker = require('./baseBroker');
const axios = require('axios');

class TradierBroker extends BaseBroker {
  constructor() {
    super('Tradier');
    this.baseUrl = 'https://api.tradier.com/v1';
    this.sandboxUrl = 'https://sandbox.tradier.com/v1';
    this.accessToken = null;
    this.accountId = null;
  }

  async initialize(credentials, paper = true) {
    const { accessToken, accountId } = credentials;

    if (!accessToken) {
      throw new Error('Tradier access token is required');
    }

    this.accessToken = accessToken;
    this.isPaper = paper;
    this.apiUrl = paper ? this.sandboxUrl : this.baseUrl;

    // Get account ID if not provided
    if (!accountId) {
      const profile = await this.makeRequest('GET', '/user/profile');
      this.accountId = profile.profile.account.account_number;
    } else {
      this.accountId = accountId;
    }

    this.isInitialized = true;
    console.log(`Tradier initialized in ${paper ? 'SANDBOX' : 'LIVE'} mode for account ${this.accountId}`);
    return { success: true, accountId: this.accountId };
  }

  async makeRequest(method, endpoint, data = null) {
    this.checkInitialized();
    const config = {
      method,
      url: `${this.apiUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    if (data) {
      config.data = new URLSearchParams(data).toString();
    }

    const response = await axios(config);
    return response.data;
  }

  // ==================== ACCOUNT ====================

  async getAccount() {
    const response = await this.makeRequest('GET', `/accounts/${this.accountId}/balances`);
    const balances = response.balances;

    return {
      id: this.accountId,
      status: balances.status || 'active',
      currency: 'USD',
      buyingPower: balances.margin?.stock_buying_power || balances.cash?.cash_available || 0,
      cash: balances.cash?.cash_available || balances.total_cash || 0,
      portfolioValue: balances.total_equity || 0,
      equity: balances.total_equity || 0,
      lastEquity: balances.total_equity || 0,
      longMarketValue: balances.market_value || 0,
      shortMarketValue: balances.short_market_value || 0,
      daytradeCount: balances.day_trade_count || 0,
      patternDayTrader: balances.pdt_status || false,
      tradingBlocked: false,
      dayChange: balances.total_equity - (balances.close_pl || balances.total_equity),
      dayChangePercent: 0,
    };
  }

  // ==================== POSITIONS ====================

  async getPositions() {
    const response = await this.makeRequest('GET', `/accounts/${this.accountId}/positions`);
    const positions = response.positions?.position;

    if (!positions) return [];
    const posArray = Array.isArray(positions) ? positions : [positions];

    return posArray.map(p => ({
      symbol: p.symbol,
      qty: p.quantity,
      side: p.quantity > 0 ? 'long' : 'short',
      marketValue: p.quantity * p.last_price,
      costBasis: p.cost_basis,
      unrealizedPL: (p.quantity * p.last_price) - p.cost_basis,
      unrealizedPLPercent: ((p.quantity * p.last_price) - p.cost_basis) / p.cost_basis * 100,
      currentPrice: p.last_price,
      avgEntryPrice: p.cost_basis / p.quantity,
      changeToday: p.change_percentage || 0,
    }));
  }

  async getPosition(symbol) {
    const positions = await this.getPositions();
    return positions.find(p => p.symbol === symbol) || null;
  }

  async closePosition(symbol) {
    const position = await this.getPosition(symbol);
    if (!position) throw new Error(`No position found for ${symbol}`);

    return await this.placeOrder({
      symbol,
      qty: Math.abs(position.qty),
      side: position.qty > 0 ? 'sell' : 'buy',
      type: 'market',
    });
  }

  // ==================== ORDERS ====================

  async placeOrder(orderParams) {
    const params = this.normalizeOrderParams(orderParams);

    const orderData = {
      class: 'equity',
      symbol: params.symbol,
      side: params.side,
      quantity: params.qty,
      type: params.type,
      duration: params.timeInForce === 'gtc' ? 'gtc' : 'day',
    };

    if (params.limitPrice) orderData.price = params.limitPrice;
    if (params.stopPrice) orderData.stop = params.stopPrice;

    const response = await this.makeRequest('POST', `/accounts/${this.accountId}/orders`, orderData);

    return {
      id: response.order?.id,
      clientOrderId: response.order?.id,
      symbol: params.symbol,
      qty: params.qty,
      side: params.side,
      type: params.type,
      status: response.order?.status || 'submitted',
      filledQty: 0,
      filledAvgPrice: 0,
      createdAt: new Date().toISOString(),
    };
  }

  async getOrders(status = 'all') {
    const response = await this.makeRequest('GET', `/accounts/${this.accountId}/orders`);
    let orders = response.orders?.order;

    if (!orders) return [];
    if (!Array.isArray(orders)) orders = [orders];

    return orders.map(o => ({
      id: o.id,
      symbol: o.symbol,
      qty: o.quantity,
      side: o.side,
      type: o.type,
      status: o.status,
      filledQty: o.exec_quantity || 0,
      filledAvgPrice: o.avg_fill_price || 0,
      limitPrice: o.price,
      stopPrice: o.stop_price,
      createdAt: o.create_date,
      updatedAt: o.transaction_date,
    }));
  }

  async getOrder(orderId) {
    const response = await this.makeRequest('GET', `/accounts/${this.accountId}/orders/${orderId}`);
    const o = response.order;
    return {
      id: o.id,
      symbol: o.symbol,
      qty: o.quantity,
      side: o.side,
      type: o.type,
      status: o.status,
      filledQty: o.exec_quantity || 0,
      filledAvgPrice: o.avg_fill_price || 0,
      createdAt: o.create_date,
    };
  }

  async cancelOrder(orderId) {
    return await this.makeRequest('DELETE', `/accounts/${this.accountId}/orders/${orderId}`);
  }

  async cancelAllOrders() {
    const orders = await this.getOrders('open');
    const pending = orders.filter(o => ['open', 'pending'].includes(o.status));
    await Promise.all(pending.map(o => this.cancelOrder(o.id)));
    return { cancelled: pending.length };
  }

  // ==================== MARKET DATA ====================

  async getQuote(symbol) {
    const response = await this.makeRequest('GET', `/markets/quotes?symbols=${symbol}`);
    const quote = response.quotes?.quote;

    return {
      symbol,
      bidPrice: quote?.bid || 0,
      bidSize: quote?.bidsize || 0,
      askPrice: quote?.ask || 0,
      askSize: quote?.asksize || 0,
      lastPrice: quote?.last || 0,
      volume: quote?.volume || 0,
      timestamp: quote?.trade_date,
    };
  }

  async getBars(symbol, timeframe, start, end, limit = 100) {
    // Map timeframe to Tradier interval
    const intervalMap = {
      '1Min': '1min', '5Min': '5min', '15Min': '15min',
      '1Day': 'daily', '1Week': 'weekly', '1Month': 'monthly',
    };
    const interval = intervalMap[timeframe] || 'daily';

    let endpoint;
    if (['daily', 'weekly', 'monthly'].includes(interval)) {
      endpoint = `/markets/history?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`;
    } else {
      endpoint = `/markets/timesales?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`;
    }

    const response = await this.makeRequest('GET', endpoint);
    let bars = response.history?.day || response.series?.data || [];

    if (!Array.isArray(bars)) bars = [bars];

    return bars.slice(-limit).map(bar => ({
      timestamp: bar.date || bar.time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }));
  }

  async isMarketOpen() {
    const response = await this.makeRequest('GET', '/markets/clock');
    return response.clock?.state === 'open';
  }

  getCapabilities() {
    return {
      stocks: true,
      options: true,
      futures: false,
      forex: false,
      crypto: false,
      fractionalShares: false,
      extendedHours: true,
      paperTrading: true,
    };
  }

  static getRequiredCredentials() {
    return [
      { key: 'accessToken', label: 'Access Token', type: 'password' },
      { key: 'accountId', label: 'Account ID (optional)', type: 'text' },
    ];
  }
}

module.exports = TradierBroker;
