const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const KeepAliveService = require('./utils/keepAlive');
const WebSocketHandler = require('./routes/websocket');
const testAiStudioRouter = require('./routes/test-ai-studio');

// Initialize Express app
const app = express();
const server = createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://daggerheartmud.vercel.app',
        'https://daggerheartmud-git-main.vercel.app',
        'https://daggerheartmud-git-develop.vercel.app'
      ]
    : process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Test AI Studio route
app.use('/api/test-ai-studio', testAiStudioRouter);


// Configure Socket.IO
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeSessions: wsHandler.gameStateManager.getActiveSessions().length
  });
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    server: 'Daggerheart MUD Backend',
    version: '1.0.0',
    status: 'running',
    activeSessions: wsHandler.gameStateManager.getActiveSessions().length
  });
});

// Serve static files (if needed)
app.use(express.static(path.join(__dirname, '../public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Daggerheart MUD Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`WebSocket server ready for connections`);
});

// Start keep-alive service (for Render deployment)
if (process.env.NODE_ENV === 'production' && process.env.KEEP_ALIVE_URL) {
  const keepAlive = new KeepAliveService();
  keepAlive.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    keepAlive.stop();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, io };
