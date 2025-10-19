const axios = require('axios');

class FinnhubService {
  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY;
    this.baseURL = 'https://finnhub.io/api/v1';
  }

  async getStockQuote(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/quote`, {
        params: {
          symbol: symbol,
          token: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      return null;
    }
  }

  async getCompanyNews(symbol, from, to) {
    try {
      const response = await axios.get(`${this.baseURL}/company-news`, {
        params: {
          symbol: symbol,
          from: from, // YYYY-MM-DD
          to: to,     // YYYY-MM-DD
          token: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching company news:', error);
      return null;
    }
  }

  async getTechnicalIndicator(symbol, resolution, from, to, indicator) {
    try {
      const response = await axios.get(`${this.baseURL}/indicator`, {
        params: {
          symbol: symbol,
          resolution: resolution, // 1, 5, 15, 30, 60, D, W, M
          from: from,
          to: to,
          indicator: indicator, // sma, ema, wma, rsi, etc.
          token: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching technical indicator:', error);
      return null;
    }
  }

  // Generate trading signals based on real data
  async generateRealSignal(symbol) {
    const quote = await this.getStockQuote(symbol);
    
    if (!quote || !quote.c) return null;

    const currentPrice = quote.c;
    const previousClose = quote.pc;
    const priceChange = ((currentPrice - previousClose) / previousClose) * 100;

    // Simple signal logic based on price movement
    let trend = priceChange > 0 ? 'up' : 'down';
    let risk = 'medium';
    
    if (Math.abs(priceChange) > 3) risk = 'high';
    if (Math.abs(priceChange) < 1) risk = 'low';

    return {
      asset: `${symbol}`,
      trend: trend,
      currentPrice: currentPrice,
      priceChange: priceChange,
      risk: risk,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new FinnhubService();
