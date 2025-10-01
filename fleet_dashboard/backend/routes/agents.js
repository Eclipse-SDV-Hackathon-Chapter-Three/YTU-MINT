const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');

const router = express.Router();

module.exports = (agentManager, ankaiosController, symphonyProvider, wsManager, ankaiosGrpcClient) => {
  // Validation schemas
  const agentSchema = Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional(), // Allow name field for car agents
    city: Joi.string().valid('Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt').optional(),
    state: Joi.string().valid('parked', 'driving').optional(),
    version: Joi.string().optional(), // Allow version field from frontend
    metadata: Joi.any().optional(), // Allow metadata field from frontend
    workloads: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        version: Joi.string().required(),
        status: Joi.string().valid('running', 'updating', 'failed', 'stopped').optional()
      })
    ).optional()
  });

  const workloadUpdateSchema = Joi.object({
    workloadName: Joi.string().required(),
    newVersion: Joi.string().required()
  });

  // Create agent
  router.post('/', async (req, res) => {
    try {
      const { error, value } = agentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid agent data',
          details: error.details
        });
      }

      const agent = agentManager.createAgent(value);
      
      // Register Ankaios agent via gRPC (creates AGENT, not workload)
      try {
        const grpcResult = await ankaiosGrpcClient.registerAgent({
          name: agent.name || `car-${agent.id}`,
          version: '1.0.0',
          capabilities: ['workload-execution', 'control-interface']
        });
        logger.info(`Successfully registered agent via gRPC: ${agent.id}`);
      } catch (grpcError) {
        logger.error(`Failed to register agent via gRPC ${agent.id}:`, grpcError);
        // Don't fail the request, agent is created but not registered
      }

      // Broadcast to WebSocket clients
      wsManager.broadcast({
        type: 'agent_created',
        data: agent
      });

      res.status(201).json({
        success: true,
        data: agent
      });

    } catch (error) {
      logger.error('Error creating agent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create agent',
        details: error.message
      });
    }
  });

  // Get all agents
  router.get('/', (req, res) => {
    try {
      const agents = agentManager.getAllAgents();
      res.json({
        success: true,
        data: agents
      });
    } catch (error) {
      logger.error('Error getting agents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get agents'
      });
    }
  });

  // Get agent by ID
  router.get('/:id', (req, res) => {
    try {
      const agent = agentManager.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error('Error getting agent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get agent'
      });
    }
  });

  // Update agent state
  router.put('/:id/state', (req, res) => {
    try {
      const { state } = req.body;
      if (!state) {
        return res.status(400).json({
          success: false,
          error: 'State is required'
        });
      }

      const agent = agentManager.updateAgentState(req.params.id, state);
      
      // Broadcast to WebSocket clients
      wsManager.broadcast({
        type: 'agent_state_changed',
        data: { agentId: agent.id, newState: state }
      });

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error('Error updating agent state:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Update agent status
  router.put('/:id/status', (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      const agent = agentManager.updateAgentStatus(req.params.id, status);
      
      // Broadcast to WebSocket clients
      wsManager.broadcast({
        type: 'agent_status_changed',
        data: { agentId: agent.id, newStatus: status }
      });

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error('Error updating agent status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Update ECU version
  router.put('/:id/workloads/:workloadName/version', (req, res) => {
    try {
      const { newVersion } = req.body;
      if (!newVersion) {
        return res.status(400).json({
          success: false,
          error: 'New version is required'
        });
      }

      const agent = agentManager.updateWorkloadVersion(
        req.params.id, 
        req.params.workloadName, 
        newVersion
      );
      
      // Broadcast to WebSocket clients
      wsManager.broadcast({
        type: 'ecu_version_updated',
        data: { 
          agentId: agent.id, 
          workloadName: req.params.workloadName,
          newVersion 
        }
      });

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error('Error updating ECU version:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Add ECU to agent
  router.post('/:id/workloads', (req, res) => {
    try {
      const { name, version } = req.body;
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'ECU name is required'
        });
      }

      const agent = agentManager.addWorkload(req.params.id, { name, version });
      
      // Broadcast to WebSocket clients
      wsManager.broadcast({
        type: 'ecu_added',
        data: { agentId: agent.id, workloadName: name, version }
      });

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error('Error adding ECU:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Remove ECU from agent
  router.delete('/:id/workloads/:workloadName', (req, res) => {
    try {
      const agent = agentManager.removeWorkload(req.params.id, req.params.workloadName);
      
      // Broadcast to WebSocket clients
      wsManager.broadcast({
        type: 'ecu_removed',
        data: { agentId: agent.id, workloadName: req.params.workloadName }
      });

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error('Error removing ECU:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Delete agent
  router.delete('/:id', (req, res) => {
    try {
      agentManager.deleteAgent(req.params.id);
      
      // Broadcast to WebSocket clients
      wsManager.broadcast({
        type: 'agent_deleted',
        data: { agentId: req.params.id }
      });

      res.json({
        success: true,
        message: 'Agent deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting agent:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get agents by city
  router.get('/city/:city', (req, res) => {
    try {
      const agents = agentManager.getAgentsByCity(req.params.city);
      res.json({
        success: true,
        data: agents
      });
    } catch (error) {
      logger.error('Error getting agents by city:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get agents by city'
      });
    }
  });

  // Get agents by state
  router.get('/state/:state', (req, res) => {
    try {
      const agents = agentManager.getAgentsByState(req.params.state);
      res.json({
        success: true,
        data: agents
      });
    } catch (error) {
      logger.error('Error getting agents by state:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get agents by state'
      });
    }
  });

  // Get agent statistics
  router.get('/stats/overview', (req, res) => {
    try {
      const stats = agentManager.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting agent statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get agent statistics'
      });
    }
  });

  // Export agent data
  router.get('/export/data', (req, res) => {
    try {
      const data = agentManager.exportData();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error exporting agent data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export agent data'
      });
    }
  });

  return router;
};
