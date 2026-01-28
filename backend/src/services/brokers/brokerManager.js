/**
 * Broker Manager
 * Handles multiple broker connections and provides a unified interface
 */
const AlpacaBroker = require('./alpacaBroker');
const IBKRBroker = require('./ibkrBroker');
const TradierBroker = require('./tradierBroker');
const ETradeBroker = require('./etradeBroker');

class BrokerManager {
  constructor() {
    this.brokers = new Map();
    this.activeBroker = null;
    this.activeBrokerName = null;

    // Register available brokers
    this.availableBrokers = {
      alpaca: { name: 'Alpaca', class: AlpacaBroker, description: 'Commission-free trading, great for algo trading' },
      ibkr: { name: 'Interactive Brokers', class: IBKRBroker, description: 'Professional-grade, global markets access' },
      tradier: { name: 'Tradier', class: TradierBroker, description: 'Developer-friendly, flat-rate pricing' },
      etrade: { name: 'E*TRADE', class: ETradeBroker, description: 'Established broker with options trading' },
    };
  }

  /**
   * Get list of available brokers
   */
  getAvailableBrokers() {
    return Object.entries(this.availableBrokers).map(([id, broker]) => ({
      id,
      name: broker.name,
      description: broker.description,
      requiredCredentials: broker.class.getRequiredCredentials(),
      capabilities: new broker.class().getCapabilities(),
    }));
  }

  /**
   * Initialize a broker with credentials
   */
  async initializeBroker(brokerId, credentials, paper = true) {
    const brokerInfo = this.availableBrokers[brokerId];
    if (!brokerInfo) {
      throw new Error(`Unknown broker: ${brokerId}. Available: ${Object.keys(this.availableBrokers).join(', ')}`);
    }

    const broker = new brokerInfo.class();
    const result = await broker.initialize(credentials, paper);

    this.brokers.set(brokerId, broker);

    // Set as active if it's the first or only broker
    if (!this.activeBroker) {
      this.activeBroker = broker;
      this.activeBrokerName = brokerId;
    }

    return {
      success: true,
      broker: brokerId,
      name: brokerInfo.name,
      mode: paper ? 'paper' : 'live',
      ...result,
    };
  }

  /**
   * Disconnect a broker
   */
  disconnectBroker(brokerId) {
    const broker = this.brokers.get(brokerId);
    if (broker) {
      broker.disconnect();
      this.brokers.delete(brokerId);

      if (this.activeBrokerName === brokerId) {
        // Switch to another connected broker or null
        const remaining = Array.from(this.brokers.entries());
        if (remaining.length > 0) {
          this.activeBrokerName = remaining[0][0];
          this.activeBroker = remaining[0][1];
        } else {
          this.activeBroker = null;
          this.activeBrokerName = null;
        }
      }
    }
    return { success: true, disconnected: brokerId };
  }

  /**
   * Disconnect all brokers
   */
  disconnectAll() {
    for (const [id, broker] of this.brokers) {
      broker.disconnect();
    }
    this.brokers.clear();
    this.activeBroker = null;
    this.activeBrokerName = null;
    return { success: true, message: 'All brokers disconnected' };
  }

  /**
   * Set the active broker
   */
  setActiveBroker(brokerId) {
    const broker = this.brokers.get(brokerId);
    if (!broker) {
      throw new Error(`Broker ${brokerId} is not connected`);
    }
    this.activeBroker = broker;
    this.activeBrokerName = brokerId;
    return { success: true, activeBroker: brokerId };
  }

  /**
   * Get the active broker
   */
  getActiveBroker() {
    if (!this.activeBroker) {
      throw new Error('No broker connected. Please connect to a broker first.');
    }
    return this.activeBroker;
  }

  /**
   * Get a specific broker
   */
  getBroker(brokerId) {
    const broker = this.brokers.get(brokerId);
    if (!broker) {
      throw new Error(`Broker ${brokerId} is not connected`);
    }
    return broker;
  }

  /**
   * Get status of all connected brokers
   */
  getStatus() {
    const connected = [];
    for (const [id, broker] of this.brokers) {
      connected.push({
        id,
        name: this.availableBrokers[id].name,
        isInitialized: broker.isInitialized,
        isPaper: broker.isPaper,
        isActive: id === this.activeBrokerName,
      });
    }

    return {
      connectedBrokers: connected,
      activeBroker: this.activeBrokerName,
      totalConnected: connected.length,
    };
  }

  // ==================== PROXY METHODS TO ACTIVE BROKER ====================

  get isInitialized() {
    return this.activeBroker?.isInitialized || false;
  }

  async getAccount() {
    return await this.getActiveBroker().getAccount();
  }

  async getPositions() {
    return await this.getActiveBroker().getPositions();
  }

  async getPosition(symbol) {
    return await this.getActiveBroker().getPosition(symbol);
  }

  async closePosition(symbol) {
    return await this.getActiveBroker().closePosition(symbol);
  }

  async placeOrder(orderParams) {
    return await this.getActiveBroker().placeOrder(orderParams);
  }

  async getOrders(status = 'all') {
    return await this.getActiveBroker().getOrders(status);
  }

  async getOrder(orderId) {
    return await this.getActiveBroker().getOrder(orderId);
  }

  async cancelOrder(orderId) {
    return await this.getActiveBroker().cancelOrder(orderId);
  }

  async cancelAllOrders() {
    return await this.getActiveBroker().cancelAllOrders();
  }

  async getQuote(symbol) {
    return await this.getActiveBroker().getQuote(symbol);
  }

  async getBars(symbol, timeframe, start, end, limit = 100) {
    return await this.getActiveBroker().getBars(symbol, timeframe, start, end, limit);
  }

  async isMarketOpen() {
    return await this.getActiveBroker().isMarketOpen();
  }

  // ==================== MULTI-BROKER OPERATIONS ====================

  /**
   * Get account from all connected brokers
   */
  async getAllAccounts() {
    const accounts = [];
    for (const [id, broker] of this.brokers) {
      try {
        const account = await broker.getAccount();
        accounts.push({ brokerId: id, brokerName: this.availableBrokers[id].name, ...account });
      } catch (error) {
        accounts.push({ brokerId: id, error: error.message });
      }
    }
    return accounts;
  }

  /**
   * Get positions from all connected brokers
   */
  async getAllPositions() {
    const allPositions = [];
    for (const [id, broker] of this.brokers) {
      try {
        const positions = await broker.getPositions();
        positions.forEach(p => allPositions.push({ brokerId: id, brokerName: this.availableBrokers[id].name, ...p }));
      } catch (error) {
        console.error(`Error getting positions from ${id}:`, error.message);
      }
    }
    return allPositions;
  }

  /**
   * Get total portfolio value across all brokers
   */
  async getTotalPortfolioValue() {
    const accounts = await this.getAllAccounts();
    let total = 0;
    const breakdown = [];

    for (const account of accounts) {
      if (!account.error && account.portfolioValue) {
        total += account.portfolioValue;
        breakdown.push({
          broker: account.brokerName,
          value: account.portfolioValue,
        });
      }
    }

    return { total, breakdown };
  }
}

// Export singleton instance
module.exports = new BrokerManager();
