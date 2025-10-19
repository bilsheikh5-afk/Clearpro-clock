const fs = require('fs');
const path = require('path');

class SignalService {
  constructor() {
    this.signals = this.loadInitialSignals();
    this.portfolio = this.loadPortfolioData();
    this.experts = this.loadExperts();
  }

  loadInitialSignals() {
    return [
      {
        id: 1,
        asset: "AAPL - Apple Inc.",
        trend: "up",
        expert: "Mark Johnson",
        risk: "low",
        entry: "148.50 - 150.00",
        target: "165.00",
        stopLoss: "145.00",
        timestamp: new Date().toISOString(),
        expiry: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        asset: "EUR/USD",
        trend: "down",
        expert: "Sarah Chen",
        risk: "medium",
        entry: "1.0850 - 1.0870",
        target: "1.0650",
        stopLoss: "1.0950",
        timestamp: new Date().toISOString(),
        expiry: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        asset: "BTC/USD",
        trend: "up",
        expert: "Michael Torres",
        risk: "high",
        entry: "29800 - 30200",
        target: "32500",
        stopLoss: "28500",
        timestamp: new Date().toISOString(),
        expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  loadPortfolioData() {
    return {
      portfolioValue: 12458.75,
      dailyProfit: 245.60,
      openTrades: 8,
      winRate: 73,
      riskRatio: 1.4,
      lastUpdate: new Date().toISOString()
    };
  }

  loadExperts() {
    return [
      {
        id: 1,
        name: "Mark Johnson",
        specialty: "Stock Market Analyst",
        rating: 4.9,
        reviews: 128,
        successRate: 78,
        avatar: "MJ"
      },
      {
        id: 2,
        name: "Sarah Chen",
        specialty: "Forex Specialist",
        rating: 4.7,
        reviews: 94,
        successRate: 82,
        avatar: "SC"
      },
      {
        id: 3,
        name: "Michael Torres",
        specialty: "Cryptocurrency Expert",
        rating: 4.5,
        reviews: 156,
        successRate: 71,
        avatar: "MT"
      }
    ];
  }

  getSignals() {
    return this.signals.filter(signal => 
      new Date(signal.expiry) > new Date()
    );
  }

  getExperts() {
    return this.experts;
  }

  getPortfolioData() {
    return this.portfolio;
  }

  generateNewSignals() {
    const assets = [
      { symbol: "MSFT - Microsoft", name: "Microsoft Corporation" },
      { symbol: "GOOGL - Alphabet", name: "Alphabet Inc." },
      { symbol: "TSLA - Tesla", name: "Tesla Inc." },
      { symbol: "GBP/USD", name: "British Pound" },
      { symbol: "ETH/USD", name: "Ethereum" }
    ];

    const trends = ["up", "down"];
    const risks = ["low", "medium", "high"];
    const experts = this.experts;

    const newSignal = {
      id: Date.now(),
      asset: assets[Math.floor(Math.random() * assets.length)].symbol,
      trend: trends[Math.floor(Math.random() * trends.length)],
      expert: experts[Math.floor(Math.random() * experts.length)].name,
      risk: risks[Math.floor(Math.random() * risks.length)],
      entry: this.generatePriceRange(),
      target: this.generateTargetPrice(),
      stopLoss: this.generateStopLoss(),
      timestamp: new Date().toISOString(),
      expiry: new Date(Date.now() + Math.floor(Math.random() * 3 + 1) * 24 * 60 * 60 * 1000).toISOString()
    };

    this.signals.unshift(newSignal);
    
    // Keep only latest 10 signals
    if (this.signals.length > 10) {
      this.signals = this.signals.slice(0, 10);
    }

    return [newSignal];
  }

  generatePriceRange() {
    const base = 100 + Math.random() * 200;
    const range = 0.5 + Math.random() * 2;
    return `${(base).toFixed(2)} - ${(base + range).toFixed(2)}`;
  }

  generateTargetPrice() {
    return (100 + Math.random() * 100).toFixed(2);
  }

  generateStopLoss() {
    return (80 + Math.random() * 20).toFixed(2);
  }

  updatePortfolio() {
    const change = (Math.random() - 0.5) * 200;
    this.portfolio.portfolioValue += change;
    this.portfolio.dailyProfit += change;
    this.portfolio.openTrades = 7 + Math.floor(Math.random() * 4);
    this.portfolio.winRate = 70 + Math.floor(Math.random() * 10);
    this.portfolio.lastUpdate = new Date().toISOString();

    return this.portfolio;
  }
}

module.exports = new SignalService();
