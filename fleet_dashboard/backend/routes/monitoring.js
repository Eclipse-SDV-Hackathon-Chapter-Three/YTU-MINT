const express = require('express');
const logger = require('../utils/logger');

module.exports = (carManager, ankaiosController, wsManager) => {
  const router = express.Router();

  // Get car logs
  router.get('/:id/logs', async (req, res) => {
    try {
      const car = carManager.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }

      const { limit = 50, level } = req.query;
      let logs = car.logs || [];

      // Filter by level if specified
      if (level) {
        logs = logs.filter(log => log.level === level);
      }

      // Limit results
      if (limit) {
        logs = logs.slice(-parseInt(limit));
      }

      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      logger.error(`Failed to get logs for car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve logs'
      });
    }
  });

  // Get car status
  router.get('/:id/status', async (req, res) => {
    try {
      const car = carManager.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }

      const agentStatus = ankaiosController.getAgentStatus(req.params.id);
      
      res.json({
        success: true,
        data: {
          car: {
            id: car.id,
            name: car.name,
            region: car.region,
            state: car.state,
            status: car.status,
            version: car.version,
            lastUpdated: car.lastUpdated
          },
          agent: agentStatus,
          health: {
            car: car.status === 'running',
            agent: agentStatus.status === 'running',
            overall: car.status === 'running' && agentStatus.status === 'running'
          }
        }
      });
    } catch (error) {
      logger.error(`Failed to get status for car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve status'
      });
    }
  });

  // Get agent status
  router.get('/:id/agent', async (req, res) => {
    try {
      const agentStatus = ankaiosController.getAgentStatus(req.params.id);
      
      res.json({
        success: true,
        data: agentStatus
      });
    } catch (error) {
      logger.error(`Failed to get agent status for car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent status'
      });
    }
  });

  // Get all agents
  router.get('/agents/all', async (req, res) => {
    try {
      const agents = ankaiosController.getAllAgents();
      
      res.json({
        success: true,
        data: agents,
        count: agents.length
      });
    } catch (error) {
      logger.error('Failed to get all agents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agents'
      });
    }
  });

  // Get system health
  router.get('/health', async (req, res) => {
    try {
      const cars = carManager.getAllCars();
      const agents = ankaiosController.getAllAgents();
      const wsClients = wsManager.getConnectedClients();

      const health = {
        timestamp: new Date().toISOString(),
        services: {
          carManager: carManager.isHealthy(),
          ankaiosController: ankaiosController.isHealthy(),
          webSocket: wsClients > 0
        },
        statistics: {
          totalCars: cars.length,
          activeAgents: agents.length,
          connectedClients: wsClients,
          carsByStatus: cars.reduce((acc, car) => {
            acc[car.status] = (acc[car.status] || 0) + 1;
            return acc;
          }, {}),
          carsByRegion: cars.reduce((acc, car) => {
            acc[car.region] = (acc[car.region] || 0) + 1;
            return acc;
          }, {}),
          agentsByStatus: agents.reduce((acc, agent) => {
            acc[agent.status] = (acc[agent.status] || 0) + 1;
            return acc;
          }, {})
        }
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Failed to get system health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system health'
      });
    }
  });

  // Get real-time metrics
  router.get('/metrics', async (req, res) => {
    try {
      const cars = carManager.getAllCars();
      const agents = ankaiosController.getAllAgents();
      
      const metrics = {
        timestamp: new Date().toISOString(),
        cars: {
          total: cars.length,
          byStatus: cars.reduce((acc, car) => {
            acc[car.status] = (acc[car.status] || 0) + 1;
            return acc;
          }, {}),
          byState: cars.reduce((acc, car) => {
            acc[car.state] = (acc[car.state] || 0) + 1;
            return acc;
          }, {}),
          byRegion: cars.reduce((acc, car) => {
            acc[car.region] = (acc[car.region] || 0) + 1;
            return acc;
          }, {}),
          byVersion: cars.reduce((acc, car) => {
            acc[car.version] = (acc[car.version] || 0) + 1;
            return acc;
          }, {})
        },
        agents: {
          total: agents.length,
          byStatus: agents.reduce((acc, agent) => {
            acc[agent.status] = (acc[agent.status] || 0) + 1;
            return acc;
          }, {})
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          connectedClients: wsManager.getConnectedClients()
        }
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Failed to get metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics'
      });
    }
  });

  // Get WebSocket client info
  router.get('/websocket/clients', async (req, res) => {
    try {
      const clientInfo = wsManager.getClientInfo();
      
      res.json({
        success: true,
        data: {
          connected: wsManager.getConnectedClients(),
          clients: clientInfo
        }
      });
    } catch (error) {
      logger.error('Failed to get WebSocket client info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve WebSocket client info'
      });
    }
  });

  // Force refresh car status
  router.post('/:id/refresh', async (req, res) => {
    try {
      const car = carManager.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }

      // Get fresh agent status
      const agentStatus = ankaiosController.getAgentStatus(req.params.id);
      
      // Update car status based on agent status
      if (agentStatus.status === 'running') {
        carManager.updateCarStatus(req.params.id, 'running');
      } else if (agentStatus.status === 'failed' || agentStatus.status === 'error') {
        carManager.updateCarStatus(req.params.id, 'failed');
      }

      // Notify WebSocket clients
      wsManager.onCarUpdated(carManager.getCar(req.params.id));
      wsManager.onAgentStatusChanged(req.params.id, agentStatus.status);

      res.json({
        success: true,
        data: {
          car: carManager.getCar(req.params.id),
          agent: agentStatus
        },
        message: 'Car status refreshed'
      });
    } catch (error) {
      logger.error(`Failed to refresh car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh car status'
      });
    }
  });

  return router;
};
