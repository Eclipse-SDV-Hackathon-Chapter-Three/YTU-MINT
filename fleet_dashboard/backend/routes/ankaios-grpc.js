const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

module.exports = (ankaiosGrpcClient) => {
  const router = express.Router();

  const createAgentSchema = Joi.object({
    name: Joi.string().required(),
    version: Joi.string().optional(),
    capabilities: Joi.array().items(Joi.string()).optional()
  });

  // Create a new Ankaios agent via gRPC
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

      const result = await ankaiosGrpcClient.registerAgent(value);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Error creating Ankaios agent via gRPC:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get all connected agents
  router.get('/agents', async (req, res) => {
    try {
      const agents = ankaiosGrpcClient.getConnectedAgents();
      res.status(200).json({
        success: true,
        data: agents,
        count: agents.length
      });
    } catch (error) {
      logger.error('Error getting connected agents:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get a specific connected agent
  router.get('/agents/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const agents = ankaiosGrpcClient.getConnectedAgents();
      const agent = agents.find(a => a.name === name);
      
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
      logger.error(`Error getting agent ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Disconnect an agent
  router.delete('/agents/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const result = await ankaiosGrpcClient.disconnectAgent(name);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error(`Error disconnecting agent ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get gRPC client status
  router.get('/status', async (req, res) => {
    try {
      const status = ankaiosGrpcClient.getStatus();
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting gRPC client status:', error);
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
      client: ankaiosGrpcClient.isHealthy()
    });
  });

  return router;
};
