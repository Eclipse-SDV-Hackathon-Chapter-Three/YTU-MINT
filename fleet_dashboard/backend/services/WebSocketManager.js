const logger = require('../utils/logger');

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  initialize(wss) {
    this.wss = wss;
    
    wss.on('connection', (ws, req) => {
      logger.info('New WebSocket connection established');
      this.clients.add(ws);
      
      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'connection',
        message: 'Connected to Fleet Dashboard',
        timestamp: new Date().toISOString()
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error);
        }
      });
    });
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      case 'subscribe':
        // Handle subscription to specific car updates
        if (data.carId) {
          ws.carId = data.carId;
        }
        break;
      default:
        logger.warn('Unknown WebSocket message type:', data.type);
    }
  }

  sendToClient(ws, data) {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        logger.error('Failed to send WebSocket message:', error);
        this.clients.delete(ws);
      }
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          logger.error('Failed to broadcast WebSocket message:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  sendToCarSubscribers(carId, data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === client.OPEN && 
          (client.carId === carId || !client.carId)) {
        try {
          client.send(message);
        } catch (error) {
          logger.error('Failed to send car-specific WebSocket message:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  // Car-related events
  onCarCreated(car) {
    this.broadcast({
      type: 'car_created',
      data: car,
      timestamp: new Date().toISOString()
    });
  }

  onCarUpdated(car) {
    this.broadcast({
      type: 'car_updated',
      data: car,
      timestamp: new Date().toISOString()
    });
  }

  onCarDeleted(carId) {
    this.broadcast({
      type: 'car_deleted',
      data: { carId },
      timestamp: new Date().toISOString()
    });
  }

  onCarStateChanged(carId, oldState, newState) {
    this.broadcast({
      type: 'car_state_changed',
      data: { carId, oldState, newState },
      timestamp: new Date().toISOString()
    });
  }

  onCarStatusChanged(carId, oldStatus, newStatus) {
    this.broadcast({
      type: 'car_status_changed',
      data: { carId, oldStatus, newStatus },
      timestamp: new Date().toISOString()
    });
  }

  onCarVersionUpdated(carId, oldVersion, newVersion) {
    this.broadcast({
      type: 'car_version_updated',
      data: { carId, oldVersion, newVersion },
      timestamp: new Date().toISOString()
    });
  }

  onUpdateStarted(carId, version) {
    this.sendToCarSubscribers(carId, {
      type: 'update_started',
      data: { carId, version },
      timestamp: new Date().toISOString()
    });
  }

  onUpdateCompleted(carId, version, success) {
    this.sendToCarSubscribers(carId, {
      type: 'update_completed',
      data: { carId, version, success },
      timestamp: new Date().toISOString()
    });
  }

  onUpdateFailed(carId, version, error) {
    this.sendToCarSubscribers(carId, {
      type: 'update_failed',
      data: { carId, version, error },
      timestamp: new Date().toISOString()
    });
  }

  onRollbackStarted(carId, version) {
    this.sendToCarSubscribers(carId, {
      type: 'rollback_started',
      data: { carId, version },
      timestamp: new Date().toISOString()
    });
  }

  onRollbackCompleted(carId, version, success) {
    this.sendToCarSubscribers(carId, {
      type: 'rollback_completed',
      data: { carId, version, success },
      timestamp: new Date().toISOString()
    });
  }

  onStagedRolloutStarted(phases, version) {
    this.broadcast({
      type: 'staged_rollout_started',
      data: { phases, version },
      timestamp: new Date().toISOString()
    });
  }

  onStagedRolloutPhaseCompleted(phase, results) {
    this.broadcast({
      type: 'staged_rollout_phase_completed',
      data: { phase, results },
      timestamp: new Date().toISOString()
    });
  }

  onStagedRolloutCompleted(results) {
    this.broadcast({
      type: 'staged_rollout_completed',
      data: { results },
      timestamp: new Date().toISOString()
    });
  }

  onStagedRolloutFailed(phase, error) {
    this.broadcast({
      type: 'staged_rollout_failed',
      data: { phase, error },
      timestamp: new Date().toISOString()
    });
  }

  onLogAdded(carId, logEntry) {
    this.sendToCarSubscribers(carId, {
      type: 'log_added',
      data: { carId, logEntry },
      timestamp: new Date().toISOString()
    });
  }

  onAgentStatusChanged(carId, status) {
    this.sendToCarSubscribers(carId, {
      type: 'agent_status_changed',
      data: { carId, status },
      timestamp: new Date().toISOString()
    });
  }

  getConnectedClients() {
    return this.clients.size;
  }

  getClientInfo() {
    return Array.from(this.clients).map(client => ({
      readyState: client.readyState,
      carId: client.carId,
      connected: client.readyState === client.OPEN
    }));
  }
}

module.exports = WebSocketManager;
