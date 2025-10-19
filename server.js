const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const io = socketIo(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Finnhub Service
class FinnhubService {
  constructor() {
    this.apiKey = FINNHUB_API_KEY;
    this.baseURL = 'https://finnhub.io/api/v1';
  }

  async getStockQuote(symbol) {
    try {
      if (!this.apiKey) {
        throw new Error('Finnhub API key not configured');
      }

      const response = await axios.get(`${this.baseURL}/quote`, {
        params: {
          symbol: symbol,
          token: this.apiKey
        },
        timeout: 10000
      });
      
      if (response.data && response.data.c !== 0) {
        return response.data;
      } else {
        throw new Error('Invalid symbol or no data available');
      }
    } catch (error) {
      console.error(`Error fetching stock quote for ${symbol}:`, error.message);
      return this.generateMockQuote(symbol);
    }
  }

  async getCompanyProfile(symbol) {
    try {
      if (!this.apiKey) {
        return this.generateMockProfile(symbol);
      }

      const response = await axios.get(`${this.baseURL}/stock/profile2`, {
        params: {
          symbol: symbol,
          token: this.apiKey
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol}:`, error.message);
      return this.generateMockProfile(symbol);
    }
  }

  generateMockQuote(symbol) {
    const basePrice = 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    return {
      c: basePrice, // current price
      h: basePrice + Math.random() * 5, // high
      l: basePrice - Math.random() * 5, // low
      o: basePrice - change, // open
      pc: basePrice - change, // previous close
      d: change, // change
      dp: (change / (basePrice - change)) * 100 // percent change
    };
  }

  generateMockProfile(symbol) {
    const companies = {
      'AAPL': { name: 'Apple Inc.', exchange: 'NASDAQ' },
      'MSFT': { name: 'Microsoft Corporation', exchange: 'NASDAQ' },
      'GOOGL': { name: 'Alphabet Inc.', exchange: 'NASDAQ' },
      'TSLA': { name: 'Tesla Inc.', exchange: 'NASDAQ' },
      'AMZN': { name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
      'META': { name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
      'NFLX': { name: 'Netflix Inc.', exchange: 'NASDAQ' },
      'NVDA': { name: 'NVIDIA Corporation', exchange: 'NASDAQ' }
    };
    
    return companies[symbol] || { name: `${symbol} Company`, exchange: 'Unknown' };
  }
}

// Signal Service
class SignalService {
  constructor() {
    this.finnhub = new FinnhubService();
    this.signals = [];
    this.portfolio = this.loadPortfolioData();
    this.experts = this.loadExperts();
    this.watchlist = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META', 'NFLX', 'NVDA'];
    
    // Initialize with some signals
    this.initializeSignals();
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
      },
      {
        id: 4,
        name: "Emily Watson",
        specialty: "Technical Analyst",
        rating: 4.8,
        reviews: 89,
        successRate: 75,
        avatar: "EW"
      }
    ];
  }

  async initializeSignals() {
    // Generate initial signals
    for (let i = 0; i < 3; i++) {
      await this.generateNewSignals();
    }
  }

  getSignals() {
    // Filter out expired signals
    const now = new Date();
    return this.signals.filter(signal => 
      new Date(signal.expiry) > now
    );
  }

  getExperts() {
    return this.experts;
  }

  getPortfolioData() {
    return this.portfolio;
  }

  async generateNewSignals() {
    const newSignals = [];
    const symbolsToCheck = this.getRandomSymbols(2); // Check 2 random symbols
    
    for (const symbol of symbolsToCheck) {
      try {
        const signal = await this.generateSignalForSymbol(symbol);
        if (signal) {
          newSignals.push(signal);
        }
      } catch (error) {
        console.error(`Error generating signal for ${symbol}:`, error);
      }
    }

    // Add new signals to the beginning
    this.signals = [...newSignals, ...this.signals];
    
    // Keep only latest 8 signals
    if (this.signals.length > 8) {
      this.signals = this.signals.slice(0, 8);
    }

    return newSignals;
  }

  getRandomSymbols(count) {
    const shuffled = [...this.watchlist].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async generateSignalForSymbol(symbol) {
    const quote = await this.finnhub.getStockQuote(symbol);
    const profile = await this.finnhub.getCompanyProfile(symbol);
    
    if (!quote) return null;

    const currentPrice = quote.c;
    const previousClose = quote.pc;
    const priceChange = ((currentPrice - previousClose) / previousClose) * 100;
    const volatility = Math.abs(priceChange);

    // Determine trend and risk based on price movement and volatility
    let trend = priceChange > 0 ? 'up' : 'down';
    let risk = 'medium';
    
    if (volatility > 5) risk = 'high';
    if (volatility < 2) risk = 'low';

    // Select random expert
    const expert = this.experts[Math.floor(Math.random() * this.experts.length)];

    // Calculate entry, target, and stop loss
    const { entry, target, stopLoss } = this.calculateLevels(currentPrice, trend, risk);

    return {
      id: Date.now() + Math.random(),
      asset: `${symbol} - ${profile.name}`,
      trend: trend,
      expert: expert.name,
      risk: risk,
      entry: entry,
      target: target,
      stopLoss: stopLoss,
      currentPrice: currentPrice.toFixed(2),
      priceChange: priceChange.toFixed(2),
      timestamp: new Date().toISOString(),
      expiry: new Date(Date.now() + (2 + Math.floor(Math.random() * 3)) * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  calculateLevels(currentPrice, trend, risk) {
    let entryRange, target, stopLoss;
    const riskMultiplier = risk === 'high' ? 1.5 : risk === 'low' ? 0.5 : 1;

    if (trend === 'up') {
      const entryLow = currentPrice * (1 - 0.01 * riskMultiplier);
      const entryHigh = currentPrice * (1 - 0.005 * riskMultiplier);
      target = currentPrice * (1 + 0.08 * riskMultiplier);
      stopLoss = currentPrice * (1 - 0.04 * riskMultiplier);
      entryRange = `${entryLow.toFixed(2)} - ${entryHigh.toFixed(2)}`;
    } else {
      const entryLow = currentPrice * (1 + 0.005 * riskMultiplier);
      const entryHigh = currentPrice * (1 + 0.01 * riskMultiplier);
      target = currentPrice * (1 - 0.08 * riskMultiplier);
      stopLoss = currentPrice * (1 + 0.04 * riskMultiplier);
      entryRange = `${entryLow.toFixed(2)} - ${entryHigh.toFixed(2)}`;
    }

    return {
      entry: entryRange,
      target: target.toFixed(2),
      stopLoss: stopLoss.toFixed(2)
    };
  }

  updatePortfolio() {
    // Simulate portfolio fluctuations
    const change = (Math.random() - 0.5) * 100;
    this.portfolio.portfolioValue = Math.max(10000, this.portfolio.portfolioValue + change);
    this.portfolio.dailyProfit += change;
    this.portfolio.openTrades = 6 + Math.floor(Math.random() * 5);
    this.portfolio.winRate = 70 + Math.floor(Math.random() * 15);
    this.portfolio.riskRatio = 1.2 + Math.random() * 0.8;
    this.portfolio.lastUpdate = new Date().toISOString();

    return this.portfolio;
  }
}

// Initialize services
const signalService = new SignalService();

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// ✅ FIXED: Serve static files from root directory (where index.html is located)
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    finnhub: !!FINNHUB_API_KEY ? 'Configured' : 'Not Configured - Using Mock Data'
  });
});

app.get('/api/signals', async (req, res) => {
  try {
    const signals = signalService.getSignals();
    res.json(signals);
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

app.get('/api/experts', (req, res) => {
  try {
    const experts = signalService.getExperts();
    res.json(experts);
  } catch (error) {
    console.error('Error fetching experts:', error);
    res.status(500).json({ error: 'Failed to fetch experts' });
  }
});

app.get('/api/portfolio', (req, res) => {
  try {
    const portfolio = signalService.getPortfolioData();
    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio data' });
  }
});

app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const finnhub = new FinnhubService();
    const quote = await finnhub.getStockQuote(symbol);
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

app.get('/api/generate-signals', async (req, res) => {
  try {
    const newSignals = await signalService.generateNewSignals();
    res.json({
      success: true,
      signals: newSignals,
      message: `Generated ${newSignals.length} new signals`
    });
  } catch (error) {
    console.error('Error generating signals:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate signals' 
    });
  }
});

// ✅ FIXED: Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: NODE_ENV === 'production' ? 'Something went wrong!' : err.message 
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial data
  socket.emit('signals', signalService.getSignals());
  socket.emit('portfolio', signalService.getPortfolioData());
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Real-time signal updates (every 3 minutes)
cron.schedule('*/3 * * * *', async () => {
  try {
    console.log('Generating new trading signals...');
    const newSignals = await signalService.generateNewSignals();
    
    if (newSignals.length > 0) {
      io.emit('new-signals', newSignals);
      console.log(`Emitted ${newSignals.length} new signals`);
    }
  } catch (error) {
    console.error('Error in signal generation cron job:', error);
  }
});

// Portfolio updates (every 2 minutes)
cron.schedule('*/2 * * * *', () => {
  try {
    const portfolioUpdate = signalService.updatePortfolio();
    io.emit('portfolio-update', portfolioUpdate);
    console.log('Portfolio data updated');
  } catch (error) {
    console.error('Error in portfolio update cron job:', error);
  }
});

// Health check cron (every 5 minutes)
cron.schedule('*/5 * * * *', () => {
  console.log('Server health check - Running OK');
});

server.listen(PORT, () => {
  console.log(`
🚀 TradeSafe Server Started!
📍 Port: ${PORT}
🌍 Environment: ${NODE_ENV}
📡 CORS Origin: ${CORS_ORIGIN}
🔑 Finnhub API: ${FINNHUB_API_KEY ? 'Configured' : 'Not Configured - Using Mock Data'}
⏰ Real-time Signals: Enabled
🕐 Signal Updates: Every 3 minutes
💼 Portfolio Updates: Every 2 minutes

📊 Endpoints:
   Health: http://localhost:${PORT}/api/health
   Signals: http://localhost:${PORT}/api/signals
   Experts: http://localhost:${PORT}/api/experts
   Portfolio: http://localhost:${PORT}/api/portfolio
   Generate Signals: http://localhost:${PORT}/api/generate-signals
   Quote: http://localhost:${PORT}/api/quote/AAPL

📁 Frontend served from: ${path.join(__dirname, 'index.html')}

🔧 To get real data:
   1. Get free API key from https://finnhub.io
   2. Set FINNHUB_API_KEY environment variable
   3. Restart the server
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
