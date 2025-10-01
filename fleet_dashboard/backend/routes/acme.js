const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');

module.exports = (acmeController) => {
  const router = express.Router();

  const deploymentSchema = Joi.object({
    agentNames: Joi.array().items(Joi.string()).min(1).required(),
    workloadName: Joi.string().optional(),
    image: Joi.string().optional(),
    version: Joi.string().optional(),
    env: Joi.object().optional(),
    name: Joi.string().optional(),
    namespace: Joi.string().optional()
  });

  // Get all agents from Ankaios
  router.get('/agents', async (req, res) => {
    try {
      const agents = await acmeController.getAgents();
      res.status(200).json({
        success: true,
        data: agents,
        count: agents.length
      });
    } catch (error) {
      logger.error('Error getting agents from Ankaios:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get a specific agent with details
  router.get('/agents/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const agentDetails = await acmeController.getAgentDetails(name);
      res.status(200).json({
        success: true,
        data: agentDetails
      });
    } catch (error) {
      logger.error(`Error getting agent details for ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get workloads for a specific agent
  router.get('/agents/:name/workloads', async (req, res) => {
    try {
      const { name } = req.params;
      const workloads = await acmeController.getAgentWorkloads(name);
      res.status(200).json({
        success: true,
        data: workloads,
        count: workloads.length
      });
    } catch (error) {
      logger.error(`Error getting workloads for agent ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get all workloads
  router.get('/workloads', async (req, res) => {
    try {
      const workloads = await acmeController.getAllWorkloads();
      res.status(200).json({
        success: true,
        data: workloads,
        count: workloads.length
      });
    } catch (error) {
      logger.error('Error getting all workloads:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Create Target.json for deployment
  router.post('/target', async (req, res) => {
    try {
      const { error, value } = deploymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid deployment configuration',
          details: error.details
        });
      }

      const targetJson = acmeController.createTargetJson(value.agentNames, value);
      res.status(200).json({
        success: true,
        data: targetJson,
        message: 'Target.json created successfully'
      });
    } catch (error) {
      logger.error('Error creating Target.json:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Deploy to Symphony
  router.post('/deploy', async (req, res) => {
    try {
      const { error, value } = deploymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid deployment configuration',
          details: error.details
        });
      }

      // Create Target.json
      const targetJson = acmeController.createTargetJson(value.agentNames, value);
      
      // Deploy to Symphony
      const deploymentResult = await acmeController.deployToSymphony(targetJson);
      
      res.status(200).json({
        success: true,
        data: {
          target: targetJson,
          deployment: deploymentResult
        },
        message: 'Deployment initiated successfully'
      });
    } catch (error) {
      logger.error('Error deploying to Symphony:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get controller status
  router.get('/status', async (req, res) => {
    try {
      const status = acmeController.getStatus();
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting ACME controller status:', error);
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
      controller: acmeController.isHealthy()
    });
  });

  return router;
};
