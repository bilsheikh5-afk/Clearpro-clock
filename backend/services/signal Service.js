const finnhubService = require('./finnhubService');

class SignalService {
  constructor() {
    this.signals = [];
    this.portfolio = this.loadPortfolioData();
    this.experts = this.loadExperts();
    this.watchlist = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'EUR/USD', 'BTC/USD'];
  }

  // ... (keep your existing methods)

  async generateRealSignals() {
    const newSignals = [];
    
    for (const symbol of this.watchlist) {
      try {
        const signal = await finnhubService.generateRealSignal(symbol);
        if (signal) {
          // Enhance with expert analysis and entry/target prices
          const enhancedSignal = this.enhanceSignal(signal);
          newSignals.push(enhancedSignal);
        }
      } catch (error) {
        console.error(`Error generating signal for ${symbol}:`, error);
      }
    }

    // Add to existing signals
    this.signals = [...newSignals, ...this.signals.slice(0, 5)];
    return newSignals;
  }

  enhanceSignal(signal) {
    const experts = this.experts;
    const randomExpert = experts[Math.floor(Math.random() * experts.length)];
    
    // Calculate entry and target based on trend
    const currentPrice = signal.currentPrice;
    let entry, target;
    
    if (signal.trend === 'up') {
      entry = (currentPrice * 0.99).toFixed(2);
      target = (currentPrice * 1.05).toFixed(2);
    } else {
      entry = (currentPrice * 1.01).toFixed(2);
      target = (currentPrice * 0.95).toFixed(2);
    }

    return {
      id: Date.now(),
      asset: signal.asset,
      trend: signal.trend,
      expert: randomExpert.name,
      risk: signal.risk,
      entry: entry,
      target: target,
      stopLoss: signal.trend === 'up' ? (currentPrice * 0.97).toFixed(2) : (currentPrice * 1.03).toFixed(2),
      currentPrice: currentPrice,
      priceChange: signal.priceChange,
      timestamp: new Date().toISOString(),
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Update your existing generateNewSignals to use real data
  async generateNewSignals() {
    return await this.generateRealSignals();
  }
}

module.exports = new SignalService();
