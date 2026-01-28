/**
 * Base Broker Interface
 * All broker implementations must extend this class
 */
class BaseBroker {
  constructor(name) {
    this.name = name;
    this.isInitialized = false;
    this.isPaper = true;
  }

  /**
   * Initialize the broker with credentials
   * @param {Object} credentials - Broker-specific credentials
   * @param {boolean} paper - Use paper/sandbox mode
   */
  async initialize(credentials, paper = true) {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Disconnect from the broker
   */
  disconnect() {
    this.isInitialized = false;
  }

  /**
   * Check if broker is initialized
   */
  checkInitialized() {
    if (!this.isInitialized) {
      throw new Error(`${this.name} broker not initialized. Please set API keys first.`);
    }
  }

  // ==================== ACCOUNT ====================

  async getAccount() {
    throw new Error('getAccount() must be implemented by subclass');
  }

  // ==================== POSITIONS ====================

  async getPositions() {
    throw new Error('getPositions() must be implemented by subclass');
  }

  async getPosition(symbol) {
    throw new Error('getPosition() must be implemented by subclass');
  }

  async closePosition(symbol) {
    throw new Error('closePosition() must be implemented by subclass');
  }

  // ==================== ORDERS ====================

  async placeOrder(orderParams) {
    throw new Error('placeOrder() must be implemented by subclass');
  }

  async getOrders(status = 'all') {
    throw new Error('getOrders() must be implemented by subclass');
  }

  async getOrder(orderId) {
    throw new Error('getOrder() must be implemented by subclass');
  }

  async cancelOrder(orderId) {
    throw new Error('cancelOrder() must be implemented by subclass');
  }

  async cancelAllOrders() {
    throw new Error('cancelAllOrders() must be implemented by subclass');
  }

  // ==================== MARKET DATA ====================

  async getQuote(symbol) {
    throw new Error('getQuote() must be implemented by subclass');
  }

  async getBars(symbol, timeframe, start, end, limit = 100) {
    throw new Error('getBars() must be implemented by subclass');
  }

  async isMarketOpen() {
    throw new Error('isMarketOpen() must be implemented by subclass');
  }

  // ==================== HELPERS ====================

  normalizeOrderParams(params) {
    return {
      symbol: params.symbol,
      qty: params.qty || params.quantity,
      side: params.side,
      type: params.type || 'market',
      timeInForce: params.timeInForce || 'day',
      limitPrice: params.limitPrice,
      stopPrice: params.stopPrice,
    };
  }

  getCapabilities() {
    return {
      stocks: true,
      options: false,
      futures: false,
      forex: false,
      crypto: false,
      fractionalShares: false,
      extendedHours: false,
      paperTrading: true,
    };
  }

  static getRequiredCredentials() {
    return ['apiKey', 'secretKey'];
  }
}

module.exports = BaseBroker;
