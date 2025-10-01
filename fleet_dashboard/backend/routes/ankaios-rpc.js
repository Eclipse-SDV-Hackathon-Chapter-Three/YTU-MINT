const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');

module.exports = (ankaiosRpcController) => {
  const router = express.Router();

  // Validation schemas
  const createAgentSchema = Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().valid('parked', 'driving').optional(),
    image: Joi.string().optional(),
    metadata: Joi.object().optional()
  });

  // Create a new car agent via RPC
  router.post('/agents', async (req, res) => {
    try {
      const { error, value } = createAgentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid car configuration',
          details: error.details
        });
      }

      const result = await ankaiosRpcController.createCarAgent(value);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result,
          message: `Agent ${result.agentName} created successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Error creating Ankaios agent:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get all active agents
  router.get('/agents', (req, res) => {
    try {
      const agents = ankaiosRpcController.getActiveAgents();
      res.status(200).json({
        success: true,
        data: agents,
        count: agents.length
      });
    } catch (error) {
      logger.error('Error getting agents:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get specific agent by ID
  router.get('/agents/:id', (req, res) => {
    try {
      const { id } = req.params;
      const agent = ankaiosRpcController.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: `Agent ${id} not found`
        });
      }

      res.status(200).json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error(`Error getting agent ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Delete an agent
  router.delete('/agents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ankaiosRpcController.deleteAgent(id);
      
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
      logger.error(`Error deleting agent ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get system status
  router.get('/status', async (req, res) => {
    try {
      const status = await ankaiosRpcController.getSystemStatus();
      
      if (status.success) {
        res.status(200).json({
          success: true,
          data: status
        });
      } else {
        res.status(500).json({
          success: false,
          error: status.error
        });
      }
    } catch (error) {
      logger.error('Error getting system status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Cleanup all agents
  router.post('/cleanup', async (req, res) => {
    try {
      const result = await ankaiosRpcController.cleanup();
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: `Cleaned up ${result.cleanedAgents} agents`,
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Error during cleanup:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Add ECU to car agent
  router.post('/agents/:carId/ecus', async (req, res) => {
    try {
      const { carId } = req.params;
      const { name, version, image } = req.body;
      
      const result = await ankaiosRpcController.addEcuToCar(carId, { name, version, image });
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.ecu,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      logger.error(`Error adding ECU to car ${req.params.carId}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Remove ECU from car agent
  router.delete('/agents/:carId/ecus/:ecuName', async (req, res) => {
    try {
      const { carId, ecuName } = req.params;
      const result = await ankaiosRpcController.removeEcuFromCar(carId, ecuName);
      
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
      logger.error(`Error removing ECU from car ${req.params.carId}:`, error);
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
      controller: ankaiosRpcController.isHealthy()
    });
  });

  return router;
};
