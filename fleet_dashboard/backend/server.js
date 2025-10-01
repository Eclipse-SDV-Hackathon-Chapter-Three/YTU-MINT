const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
require('dotenv').config();

const CarManager = require('./services/CarManager');
const AgentManager = require('./services/AgentManager');
const AnkaiosController = require('./services/AnkaiosController');
const AnkaiosRpcController = require('./services/AnkaiosRpcController');
const AnkaiosGrpcClient = require('./services/AnkaiosGrpcClient');
const CarAgentManager = require('./services/CarAgentManager');
const AcmeController = require('./services/AcmeController');
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
const agentManager = new AgentManager();
const ankaiosController = new AnkaiosController();
const ankaiosRpcController = new AnkaiosRpcController();
const ankaiosGrpcClient = new AnkaiosGrpcClient();
const carAgentManager = new CarAgentManager();
const acmeController = new AcmeController();
const symphonyProvider = new SymphonyProvider();
const wsManager = new WebSocketManager();

// WebSocket server
const wss = new WebSocket.Server({ server });
wsManager.initialize(wss);

// API Routes
const carRoutes = require('./routes/cars')(carManager, ankaiosController, symphonyProvider, wsManager);
const agentRoutes = require('./routes/agents')(agentManager, ankaiosController, symphonyProvider, wsManager, ankaiosGrpcClient);
const ankaiosRpcRoutes = require('./routes/ankaios-rpc')(ankaiosRpcController);
const ankaiosGrpcRoutes = require('./routes/ankaios-grpc')(ankaiosGrpcClient);
const carAgentRoutes = require('./routes/car-agents')(carAgentManager);
const acmeRoutes = require('./routes/acme')(acmeController);
const updateRoutes = require('./routes/updates')(carManager, symphonyProvider, wsManager);
const monitoringRoutes = require('./routes/monitoring')(carManager, ankaiosController, wsManager);

app.use('/api/cars', carRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/ankaios', ankaiosRpcRoutes);
app.use('/api/ankaios-grpc', ankaiosGrpcRoutes);
app.use('/api/car-agents', carAgentRoutes);
app.use('/api/acme', acmeRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      carManager: carManager.isHealthy(),
      agentManager: agentManager.isHealthy(),
      ankaiosController: ankaiosController.isHealthy(),
      ankaiosRpcController: ankaiosRpcController.isHealthy(),
      ankaiosGrpcClient: ankaiosGrpcClient.isHealthy(),
      carAgentManager: carAgentManager.isHealthy(),
      acmeController: acmeController.isHealthy(),
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
