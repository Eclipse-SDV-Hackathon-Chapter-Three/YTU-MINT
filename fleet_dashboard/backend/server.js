const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
require('dotenv').config();

const CarManager = require('./services/CarManager');
const AnkaiosController = require('./services/AnkaiosController');
const SymphonyProvider = require('./services/SymphonyProvider');
const WebSocketManager = require('./services/WebSocketManager');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Initialize services
const carManager = new CarManager();
const ankaiosController = new AnkaiosController();
const symphonyProvider = new SymphonyProvider();
const wsManager = new WebSocketManager();

// WebSocket server
const wss = new WebSocket.Server({ server });
wsManager.initialize(wss);

// API Routes
const carRoutes = require('./routes/cars')(carManager, ankaiosController, symphonyProvider, wsManager);
const updateRoutes = require('./routes/updates')(carManager, symphonyProvider, wsManager);
const monitoringRoutes = require('./routes/monitoring')(carManager, ankaiosController, wsManager);

app.use('/api/cars', carRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      carManager: carManager.isHealthy(),
      ankaiosController: ankaiosController.isHealthy(),
      symphonyProvider: symphonyProvider.isHealthy()
    }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await carManager.cleanup();
  await ankaiosController.cleanup();
  await symphonyProvider.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await carManager.cleanup();
  await ankaiosController.cleanup();
  await symphonyProvider.cleanup();
  process.exit(0);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Fleet Dashboard Backend running on port ${PORT}`);
  logger.info(`WebSocket server running on ws://localhost:${PORT}`);
});

module.exports = app;
