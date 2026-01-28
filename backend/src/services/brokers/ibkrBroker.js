/**
 * Interactive Brokers (IBKR) Broker Implementation
 * Uses IBKR Client Portal API
 * https://www.interactivebrokers.com/api/doc.html
 *
 * Note: IBKR requires running the Client Portal Gateway locally
 * Download from: https://www.interactivebrokers.com/en/index.php?f=5041
 */
const BaseBroker = require('./baseBroker');
const axios = require('axios');

class IBKRBroker extends BaseBroker {
  constructor() {
    super('Interactive Brokers');
    this.baseUrl = 'https://localhost:5000/v1/api';
    this.accountId = null;
  }

  async initialize(credentials, paper = true) {
    const { accountId, gatewayUrl } = credentials;

    if (!accountId) {
      throw new Error('IBKR Account ID is required');
    }

    this.accountId = accountId;
    if (gatewayUrl) {
      this.baseUrl = gatewayUrl;
    }
    this.isPaper = paper;

    // Verify connection by getting account info
    try {
      await this.validateSession();
      this.isInitialized = true;
      console.log(`IBKR initialized for account ${accountId}`);
      return { success: true, accountId };
    } catch (error) {
      throw new Error(`Failed to connect to IBKR Gateway: ${error.message}. Make sure Client Portal Gateway is running.`);
    }
  }

  async validateSession() {
    const response = await axios.get(`${this.baseUrl}/iserver/auth/status`, {
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
    if (!response.data.authenticated) {
      throw new Error('IBKR session not authenticated. Please login through the Gateway.');
    }
    return response.data;
  }

  async makeRequest(method, endpoint, data = null) {
    this.checkInitialized();
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) config.data = data;

    const response = await axios(config);
    return response.data;
  }

  // ==================== ACCOUNT ====================

  async getAccount() {
    const accounts = await this.makeRequest('GET', '/portfolio/accounts');
    const account = accounts.find(a => a.accountId === this.accountId) || accounts[0];

    const summary = await this.makeRequest('GET', `/portfolio/${this.accountId}/summary`);

    return {
      id: account.accountId,
      status: account.accountStatus,
      currency: account.currency,
      buyingPower: summary.buyingpower?.amount || 0,
      cash: summary.totalcashvalue?.amount || 0,
      portfolioValue: summary.netliquidation?.amount || 0,
      equity: summary.netliquidation?.amount || 0,
      lastEquity: summary.netliquidation?.amount || 0,
      longMarketValue: summary.grosspositionvalue?.amount || 0,
      shortMarketValue: 0,
      daytradeCount: 0,
      patternDayTrader: false,
      tradingBlocked: false,
      dayChange: summary.unrealizedpnl?.amount || 0,
      dayChangePercent: 0,
    };
  }

  // ==================== POSITIONS ====================

  async getPositions() {
    const positions = await this.makeRequest('GET', `/portfolio/${this.accountId}/positions/0`);
    return positions.map(p => ({
      symbol: p.contractDesc || p.ticker,
      qty: p.position,
      side: p.position > 0 ? 'long' : 'short',
      marketValue: p.mktValue,
      costBasis: p.avgCost * Math.abs(p.position),
      unrealizedPL: p.unrealizedPnl,
      unrealizedPLPercent: p.unrealizedPnlPercent || 0,
      currentPrice: p.mktPrice,
      avgEntryPrice: p.avgCost,
      conid: p.conid,
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

    // Get conid for the symbol
    const searchResult = await this.makeRequest('GET', `/iserver/secdef/search?symbol=${params.symbol}`);
    if (!searchResult || searchResult.length === 0) {
      throw new Error(`Symbol ${params.symbol} not found`);
    }
    const conid = searchResult[0].conid;

    const orderData = {
      acctId: this.accountId,
      conid: conid,
      orderType: params.type.toUpperCase(),
      side: params.side.toUpperCase(),
      quantity: params.qty,
      tif: params.timeInForce.toUpperCase(),
    };

    if (params.limitPrice) orderData.price = params.limitPrice;
    if (params.stopPrice) orderData.auxPrice = params.stopPrice;

    const response = await this.makeRequest('POST', `/iserver/account/${this.accountId}/orders`, { orders: [orderData] });

    // Handle order confirmation if needed
    if (response[0]?.id) {
      const confirmResponse = await this.makeRequest('POST', `/iserver/reply/${response[0].id}`, { confirmed: true });
      return {
        id: confirmResponse[0]?.order_id || response[0].id,
        symbol: params.symbol,
        qty: params.qty,
        side: params.side,
        type: params.type,
        status: 'submitted',
      };
    }

    return response;
  }

  async getOrders(status = 'all') {
    const orders = await this.makeRequest('GET', '/iserver/account/orders');
    return (orders.orders || []).map(o => ({
      id: o.orderId,
      symbol: o.ticker,
      qty: o.totalSize,
      side: o.side,
      type: o.orderType,
      status: o.status,
      filledQty: o.filledQuantity || 0,
      filledAvgPrice: o.avgPrice || 0,
      limitPrice: o.price,
      createdAt: o.lastExecutionTime,
    }));
  }

  async getOrder(orderId) {
    const orders = await this.getOrders();
    return orders.find(o => o.id === orderId) || null;
  }

  async cancelOrder(orderId) {
    return await this.makeRequest('DELETE', `/iserver/account/${this.accountId}/order/${orderId}`);
  }

  async cancelAllOrders() {
    const orders = await this.getOrders('open');
    const results = await Promise.all(orders.map(o => this.cancelOrder(o.id)));
    return { cancelled: results.length };
  }

  // ==================== MARKET DATA ====================

  async getQuote(symbol) {
    const searchResult = await this.makeRequest('GET', `/iserver/secdef/search?symbol=${symbol}`);
    if (!searchResult || searchResult.length === 0) {
      throw new Error(`Symbol ${symbol} not found`);
    }
    const conid = searchResult[0].conid;

    const snapshot = await this.makeRequest('GET', `/iserver/marketdata/snapshot?conids=${conid}&fields=31,84,85,86,88`);
    const data = snapshot[0] || {};

    return {
      symbol,
      bidPrice: data['84'],
      askPrice: data['86'],
      lastPrice: data['31'],
      volume: data['88'],
    };
  }

  async getBars(symbol, timeframe, start, end, limit = 100) {
    const searchResult = await this.makeRequest('GET', `/iserver/secdef/search?symbol=${symbol}`);
    if (!searchResult || searchResult.length === 0) {
      throw new Error(`Symbol ${symbol} not found`);
    }
    const conid = searchResult[0].conid;

    // Map timeframe to IBKR period
    const periodMap = {
      '1Min': '1min', '5Min': '5min', '15Min': '15min', '30Min': '30min',
      '1Hour': '1h', '1Day': '1d', '1Week': '1w', '1Month': '1m',
    };
    const period = periodMap[timeframe] || '1d';

    const response = await this.makeRequest('GET',
      `/iserver/marketdata/history?conid=${conid}&period=${period}&bar=${period}`
    );

    return (response.data || []).map(bar => ({
      timestamp: new Date(bar.t).toISOString(),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));
  }

  async isMarketOpen() {
    // IBKR doesn't have a simple market hours endpoint
    // Check if it's a weekday and within market hours
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    return day >= 1 && day <= 5 && hour >= 13 && hour < 21; // Rough EST market hours in UTC
  }

  getCapabilities() {
    return {
      stocks: true,
      options: true,
      futures: true,
      forex: true,
      crypto: false,
      fractionalShares: false,
      extendedHours: true,
      paperTrading: true,
    };
  }

  static getRequiredCredentials() {
    return [
      { key: 'accountId', label: 'Account ID', type: 'text' },
      { key: 'gatewayUrl', label: 'Gateway URL (optional)', type: 'text', default: 'https://localhost:5000/v1/api' },
    ];
  }
}

module.exports = IBKRBroker;
