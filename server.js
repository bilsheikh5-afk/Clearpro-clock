const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const signalService = require('./services/signalService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.get('/api/signals', (req, res) => {
  const signals = signalService.getSignals();
  res.json(signals);
});

app.get('/api/experts', (req, res) => {
  const experts = signalService.getExperts();
  res.json(experts);
});

app.get('/api/portfolio', (req, res) => {
  const portfolio = signalService.getPortfolioData();
  res.json(portfolio);
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
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

// Simulate real-time signal updates every 2 minutes
cron.schedule('*/2 * * * *', () => {
  const newSignals = signalService.generateNewSignals();
  io.emit('new-signals', newSignals);
  console.log('New signals generated:', new Date().toISOString());
});

// Simulate portfolio updates every minute
cron.schedule('*/1 * * * *', () => {
  const portfolioUpdate = signalService.updatePortfolio();
  io.emit('portfolio-update', portfolioUpdate);
});

server.listen(PORT, () => {
  console.log(`Trading app backend running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
});
