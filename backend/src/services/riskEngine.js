const { DomainError } = require('../domain/tradingValidation');

const value = input => Number(input || 0);

class RiskEngine {
  evaluate({ account, order, snapshot, positions = [], now = new Date() }) {
    if (!snapshot) throw new DomainError(422, 'MARKET_DATA_MISSING', 'No licensed market snapshot is available for this symbol');

    const reasons = [];
    const sidePrice = order.side === 'BUY' ? value(snapshot.ask) : value(snapshot.bid);
    const referencePrice = order.orderType === 'LIMIT' ? order.limitPrice : sidePrice;
    const quantity = value(order.quantity);
    const notional = quantity * referencePrice;
    const ageSeconds = Math.max(0, (now.getTime() - new Date(snapshot.sourceTimestamp).getTime()) / 1000);
    const current = positions.find(position => position.symbol === order.symbol) || { quantity: 0, marketValue: 0 };
    const currentSymbolExposure = Math.abs(value(current.marketValue));
    const grossExposure = positions.reduce((sum, position) => sum + Math.abs(value(position.marketValue)), 0);
    const projectedSymbolExposure = order.side === 'BUY'
      ? currentSymbolExposure + notional : Math.max(0, currentSymbolExposure - notional);
    const projectedGrossExposure = order.side === 'BUY'
      ? grossExposure + notional : Math.max(0, grossExposure - notional);
    const marketVolume = value(snapshot.volume);
    const participationPercent = marketVolume > 0 ? (quantity / marketVolume) * 100 : Number.POSITIVE_INFINITY;

    if (account.killSwitchActive) reasons.push('KILL_SWITCH_ACTIVE');
    if (ageSeconds > value(account.maxMarketDataAgeSeconds)) reasons.push('MARKET_DATA_STALE');
    if (positions.some(position => position.sourceTimestamp
      && (now.getTime() - new Date(position.sourceTimestamp).getTime()) / 1000 > value(account.maxMarketDataAgeSeconds))) {
      reasons.push('PORTFOLIO_MARK_STALE');
    }
    if (notional > value(account.maxOrderNotional)) reasons.push('ORDER_NOTIONAL_LIMIT');
    if (projectedSymbolExposure > value(account.maxSymbolExposure)) reasons.push('SYMBOL_EXPOSURE_LIMIT');
    if (projectedGrossExposure > value(account.maxGrossExposure)) reasons.push('GROSS_EXPOSURE_LIMIT');
    if (value(account.dailyRealizedPnl) <= -value(account.maxDailyLoss)) reasons.push('DAILY_LOSS_LIMIT');
    if (marketVolume <= 0) reasons.push('LIQUIDITY_UNAVAILABLE');
    if (order.side === 'BUY' && notional * 1.003 > value(account.cashBalance)) reasons.push('INSUFFICIENT_PAPER_CASH');
    if (order.side === 'SELL' && quantity > value(current.quantity)) reasons.push('INSUFFICIENT_PAPER_POSITION');

    return {
      approved: reasons.length === 0,
      reasons,
      metrics: {
        referencePrice, notional, ageSeconds, marketVolume, participationPercent,
        maxExecutableQuantity: marketVolume * (value(account.maxParticipationPercent) / 100),
        liquidityCapped: marketVolume > 0 && participationPercent > value(account.maxParticipationPercent),
        currentSymbolExposure, projectedSymbolExposure, grossExposure, projectedGrossExposure,
      },
      evaluatedAt: now.toISOString(),
      policy: 'paper-risk-v1',
    };
  }
}

module.exports = { RiskEngine };
