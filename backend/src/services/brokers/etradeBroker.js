/**
 * E*TRADE Broker Implementation
 * OAuth-based API for stock and options trading
 * https://apisb.etrade.com/docs/api/account/api-account-v1.html
 */
const BaseBroker = require('./baseBroker');
const axios = require('axios');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

class ETradeBroker extends BaseBroker {
  constructor() {
    super('E*TRADE');
    this.baseUrl = 'https://api.etrade.com';
    this.sandboxUrl = 'https://apisb.etrade.com';
    this.consumerKey = null;
    this.consumerSecret = null;
    this.accessToken = null;
    this.accessTokenSecret = null;
    this.accountIdKey = null;
    this.oauth = null;
  }

  async initialize(credentials, paper = true) {
    const { consumerKey, consumerSecret, accessToken, accessTokenSecret, accountIdKey } = credentials;

    if (!consumerKey || !consumerSecret) {
      throw new Error('E*TRADE consumer key and secret are required');
    }

    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.accessToken = accessToken;
    this.accessTokenSecret = accessTokenSecret;
    this.isPaper = paper;
    this.apiUrl = paper ? this.sandboxUrl : this.baseUrl;

    // Initialize OAuth 1.0a
    this.oauth = OAuth({
      consumer: { key: consumerKey, secret: consumerSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
      },
    });

    // Get account ID if tokens are provided
    if (accessToken && accessTokenSecret) {
      if (!accountIdKey) {
        const accounts = await this.getAccounts();
        this.accountIdKey = accounts[0]?.accountIdKey;
      } else {
        this.accountIdKey = accountIdKey;
      }
      this.isInitialized = true;
      console.log(`E*TRADE initialized in ${paper ? 'SANDBOX' : 'LIVE'} mode`);
      return { success: true, accountIdKey: this.accountIdKey };
    }

    // If no tokens, return URL for OAuth flow
    return {
      success: false,
      needsAuth: true,
      message: 'Access tokens required. Complete OAuth flow first.',
    };
  }

  async makeRequest(method, endpoint, data = null) {
    if (!this.accessToken || !this.accessTokenSecret) {
      throw new Error('E*TRADE access tokens not set. Complete OAuth flow first.');
    }

    const url = `${this.apiUrl}${endpoint}`;
    const token = { key: this.accessToken, secret: this.accessTokenSecret };
    const authHeader = this.oauth.toHeader(this.oauth.authorize({ url, method }, token));

    const config = {
      method,
      url,
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (data) config.data = data;

    const response = await axios(config);
    return response.data;
  }

  async getAccounts() {
    const response = await this.makeRequest('GET', '/v1/accounts/list.json');
    return response.AccountListResponse?.Accounts?.Account || [];
  }

  // ==================== ACCOUNT ====================

  async getAccount() {
    this.checkInitialized();
    const response = await this.makeRequest('GET', `/v1/accounts/${this.accountIdKey}/balance.json?instType=BROKERAGE&realTimeNAV=true`);
    const balance = response.BalanceResponse;

    return {
      id: this.accountIdKey,
      status: 'active',
      currency: 'USD',
      buyingPower: balance.Computed?.RealTimeValues?.totalAccountValue || 0,
      cash: balance.Computed?.cashAvailableForInvestment || 0,
      portfolioValue: balance.Computed?.RealTimeValues?.totalAccountValue || 0,
      equity: balance.Computed?.RealTimeValues?.totalAccountValue || 0,
      lastEquity: balance.Computed?.RealTimeValues?.totalAccountValue || 0,
      longMarketValue: balance.Computed?.RealTimeValues?.netMv || 0,
      shortMarketValue: balance.Computed?.RealTimeValues?.netMvShort || 0,
      daytradeCount: 0,
      patternDayTrader: false,
      tradingBlocked: false,
      dayChange: balance.Computed?.RealTimeValues?.totalGainLoss || 0,
      dayChangePercent: balance.Computed?.RealTimeValues?.totalGainLossPct || 0,
    };
  }

  // ==================== POSITIONS ====================

  async getPositions() {
    this.checkInitialized();
    const response = await this.makeRequest('GET', `/v1/accounts/${this.accountIdKey}/portfolio.json`);
    const portfolio = response.PortfolioResponse?.AccountPortfolio;

    if (!portfolio || !portfolio.Position) return [];
    const positions = Array.isArray(portfolio.Position) ? portfolio.Position : [portfolio.Position];

    return positions.map(p => ({
      symbol: p.Product?.symbol,
      qty: p.quantity,
      side: p.positionType === 'LONG' ? 'long' : 'short',
      marketValue: p.marketValue,
      costBasis: p.totalCost,
      unrealizedPL: p.totalGain,
      unrealizedPLPercent: p.totalGainPct,
      currentPrice: p.Quick?.lastTrade || p.marketValue / p.quantity,
      avgEntryPrice: p.totalCost / p.quantity,
      changeToday: p.daysGainPct || 0,
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
    this.checkInitialized();
    const params = this.normalizeOrderParams(orderParams);

    // First, preview the order
    const previewData = {
      PreviewOrderRequest: {
        orderType: params.type.toUpperCase(),
        clientOrderId: Date.now().toString(),
        Order: [{
          allOrNone: 'false',
          priceType: params.type.toUpperCase(),
          orderTerm: params.timeInForce === 'gtc' ? 'GOOD_UNTIL_CANCEL' : 'GOOD_FOR_DAY',
          marketSession: 'REGULAR',
          Instrument: [{
            Product: { securityType: 'EQ', symbol: params.symbol },
            orderAction: params.side.toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
            quantityType: 'QUANTITY',
            quantity: params.qty,
          }],
        }],
      },
    };

    if (params.limitPrice) previewData.PreviewOrderRequest.Order[0].limitPrice = params.limitPrice;
    if (params.stopPrice) previewData.PreviewOrderRequest.Order[0].stopPrice = params.stopPrice;

    const preview = await this.makeRequest('POST', `/v1/accounts/${this.accountIdKey}/orders/preview.json`, previewData);

    // Place the order
    const placeData = {
      PlaceOrderRequest: {
        ...previewData.PreviewOrderRequest,
        PreviewIds: preview.PreviewOrderResponse?.PreviewIds,
      },
    };

    const response = await this.makeRequest('POST', `/v1/accounts/${this.accountIdKey}/orders/place.json`, placeData);
    const order = response.PlaceOrderResponse?.OrderIds?.[0];

    return {
      id: order?.orderId,
      clientOrderId: order?.orderId,
      symbol: params.symbol,
      qty: params.qty,
      side: params.side,
      type: params.type,
      status: 'submitted',
      filledQty: 0,
      filledAvgPrice: 0,
      createdAt: new Date().toISOString(),
    };
  }

  async getOrders(status = 'all') {
    this.checkInitialized();
    const response = await this.makeRequest('GET', `/v1/accounts/${this.accountIdKey}/orders.json`);
    let orders = response.OrdersResponse?.Order || [];

    if (!Array.isArray(orders)) orders = [orders];

    return orders.map(o => ({
      id: o.orderId,
      symbol: o.OrderDetail?.[0]?.Instrument?.[0]?.Product?.symbol,
      qty: o.OrderDetail?.[0]?.Instrument?.[0]?.orderedQuantity,
      side: o.OrderDetail?.[0]?.Instrument?.[0]?.orderAction?.toLowerCase(),
      type: o.orderType?.toLowerCase(),
      status: o.orderStatus?.toLowerCase(),
      filledQty: o.OrderDetail?.[0]?.Instrument?.[0]?.filledQuantity || 0,
      filledAvgPrice: o.OrderDetail?.[0]?.Instrument?.[0]?.averageExecutionPrice || 0,
      limitPrice: o.OrderDetail?.[0]?.limitPrice,
      stopPrice: o.OrderDetail?.[0]?.stopPrice,
      createdAt: o.OrderDetail?.[0]?.placedTime,
    }));
  }

  async getOrder(orderId) {
    const orders = await this.getOrders();
    return orders.find(o => o.id === parseInt(orderId)) || null;
  }

  async cancelOrder(orderId) {
    this.checkInitialized();
    return await this.makeRequest('PUT', `/v1/accounts/${this.accountIdKey}/orders/cancel.json`, {
      CancelOrderRequest: { orderId },
    });
  }

  async cancelAllOrders() {
    const orders = await this.getOrders('open');
    const open = orders.filter(o => ['open', 'pending'].includes(o.status));
    await Promise.all(open.map(o => this.cancelOrder(o.id)));
    return { cancelled: open.length };
  }

  // ==================== MARKET DATA ====================

  async getQuote(symbol) {
    const response = await this.makeRequest('GET', `/v1/market/quote/${symbol}.json`);
    const quote = response.QuoteResponse?.QuoteData?.[0];

    return {
      symbol,
      bidPrice: quote?.All?.bid || 0,
      bidSize: quote?.All?.bidSize || 0,
      askPrice: quote?.All?.ask || 0,
      askSize: quote?.All?.askSize || 0,
      lastPrice: quote?.All?.lastTrade || 0,
      volume: quote?.All?.totalVolume || 0,
      timestamp: new Date().toISOString(),
    };
  }

  async getBars(symbol, timeframe, start, end, limit = 100) {
    // E*TRADE doesn't have a direct historical bars API
    // Use the quote lookup for current data
    // For historical, would need to integrate with a data provider
    console.warn('E*TRADE historical bars limited. Using current quote.');

    const quote = await this.getQuote(symbol);
    return [{
      timestamp: quote.timestamp,
      open: quote.lastPrice,
      high: quote.lastPrice,
      low: quote.lastPrice,
      close: quote.lastPrice,
      volume: quote.volume,
    }];
  }

  async isMarketOpen() {
    // Check market hours
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const totalMinutes = hour * 60 + minute;

    // Market hours: 9:30 AM - 4:00 PM ET (14:30 - 21:00 UTC)
    const marketOpen = 14 * 60 + 30; // 14:30 UTC
    const marketClose = 21 * 60; // 21:00 UTC

    return day >= 1 && day <= 5 && totalMinutes >= marketOpen && totalMinutes < marketClose;
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
      { key: 'consumerKey', label: 'Consumer Key', type: 'text' },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password' },
      { key: 'accessToken', label: 'Access Token', type: 'password' },
      { key: 'accessTokenSecret', label: 'Access Token Secret', type: 'password' },
      { key: 'accountIdKey', label: 'Account ID Key (optional)', type: 'text' },
    ];
  }
}

module.exports = ETradeBroker;
