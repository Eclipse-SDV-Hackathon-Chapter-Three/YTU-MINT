const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

module.exports = (carAgentManager) => {
  const router = express.Router();

  const createAgentSchema = Joi.object({
    name: Joi.string().required(),
    city: Joi.string().valid('Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt').optional(),
    state: Joi.string().valid('parked', 'driving').optional(),
    logLevel: Joi.string().valid('debug', 'info', 'warn', 'error').optional(),
    image: Joi.string().optional()
  });

  // Create a new car agent
  router.post('/agents', async (req, res) => {
    try {
      const { error, value } = createAgentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid agent configuration',
          details: error.details
        });
      }

      const carId = uuidv4();
      const agentName = value.name;

      logger.info(`Creating car agent: ${agentName}`);

      const result = await carAgentManager.spawnCarAgent(carId, agentName, {
        city: value.city,
        state: value.state,
        logLevel: value.logLevel,
        image: value.image
      });

      res.status(201).json({
        success: true,
        data: {
          carId: carId,
          agentName: result,
          message: `Car agent ${result} created successfully`
        }
      });

    } catch (error) {
      logger.error('Error creating car agent:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get all active car agents
  router.get('/agents', async (req, res) => {
    try {
      const agents = carAgentManager.getActiveAgents();
      res.status(200).json({
        success: true,
        data: agents,
        count: agents.length
      });
    } catch (error) {
      logger.error('Error getting car agents:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get a specific car agent
  router.get('/agents/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const agent = carAgentManager.getAgent(name);
      
      if (agent) {
        res.status(200).json({
          success: true,
          data: agent
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }
    } catch (error) {
      logger.error(`Error getting car agent ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Stop a car agent
  router.delete('/agents/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const success = carAgentManager.stopCarAgent(name);
      
      if (success) {
        res.status(200).json({
          success: true,
          message: `Agent ${name} stopped successfully`
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }
    } catch (error) {
      logger.error(`Error stopping car agent ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Stop all car agents
  router.post('/agents/stop-all', async (req, res) => {
    try {
      const stoppedCount = carAgentManager.stopAllAgents();
      res.status(200).json({
        success: true,
        message: `Stopped ${stoppedCount} agents`,
        stoppedCount: stoppedCount
      });
    } catch (error) {
      logger.error('Error stopping all car agents:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get manager status
  router.get('/status', async (req, res) => {
    try {
      const status = carAgentManager.getStatus();
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting car agent manager status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Health check
  router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      manager: carAgentManager.isHealthy()
    });
  });

  return router;
};
