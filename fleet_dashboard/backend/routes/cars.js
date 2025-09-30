const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');

const carSchema = Joi.object({
  region: Joi.string().valid('Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt').optional(),
  state: Joi.string().valid('parked', 'driving').optional(),
  version: Joi.string().optional(),
  metadata: Joi.any().optional()
});

const stateUpdateSchema = Joi.object({
  state: Joi.string().valid('parked', 'driving').required()
});

module.exports = (carManager, ankaiosController, symphonyProvider, wsManager) => {
  const router = express.Router();

  // Get all cars
  router.get('/', async (req, res) => {
    try {
      const cars = carManager.getAllCars();
      res.json({
        success: true,
        data: cars,
        count: cars.length
      });
    } catch (error) {
      logger.error('Failed to get cars:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cars'
      });
    }
  });

  // Get car by ID
  router.get('/:id', async (req, res) => {
    try {
      const car = carManager.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }

      // Get agent status
      const agentStatus = ankaiosController.getAgentStatus(req.params.id);
      car.agentStatus = agentStatus;

      res.json({
        success: true,
        data: car
      });
    } catch (error) {
      logger.error(`Failed to get car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve car'
      });
    }
  });

  // Create new car
  router.post('/', async (req, res) => {
    try {
      const { error, value } = carSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid car data',
          details: error.details
        });
      }

      // Handle empty metadata string
      const carData = { ...value };
      if (carData.metadata === '') {
        delete carData.metadata;
      }
      
      const car = carManager.createCar(carData);
      
      // Spawn Ankaios agent for the car
      try {
        await ankaiosController.spawnCarAgent(car);
        carManager.updateCarStatus(car.id, 'running');
      } catch (agentError) {
        logger.error(`Failed to spawn agent for car ${car.id}:`, agentError);
        carManager.updateCarStatus(car.id, 'failed');
        carManager.addLog(car.id, `Agent spawn failed: ${agentError.message}`, 'error');
      }

      // Create Symphony target
      try {
        await symphonyProvider.createTarget(car);
        carManager.addLog(car.id, 'Symphony target created');
      } catch (symphonyError) {
        logger.error(`Failed to create Symphony target for car ${car.id}:`, symphonyError);
        carManager.addLog(car.id, `Symphony target creation failed: ${symphonyError.message}`, 'error');
      }

      // Notify WebSocket clients
      wsManager.onCarCreated(car);

      res.status(201).json({
        success: true,
        data: car,
        message: 'Car created successfully'
      });
    } catch (error) {
      logger.error('Failed to create car:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create car'
      });
    }
  });

  // Update car state
  router.put('/:id/state', async (req, res) => {
    try {
      const { error, value } = stateUpdateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid state data',
          details: error.details
        });
      }

      const car = carManager.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }

      const oldState = car.state;
      const updatedCar = carManager.updateCarState(req.params.id, value.state);

      // Notify WebSocket clients
      wsManager.onCarStateChanged(req.params.id, oldState, value.state);
      wsManager.onCarUpdated(updatedCar);

      res.json({
        success: true,
        data: updatedCar,
        message: `Car state updated to ${value.state}`
      });
    } catch (error) {
      logger.error(`Failed to update car state ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update car state'
      });
    }
  });

  // Get cars by region
  router.get('/region/:region', async (req, res) => {
    try {
      const cars = carManager.getCarsByRegion(req.params.region);
      res.json({
        success: true,
        data: cars,
        count: cars.length,
        region: req.params.region
      });
    } catch (error) {
      logger.error(`Failed to get cars by region ${req.params.region}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cars by region'
      });
    }
  });

  // Get cars by state
  router.get('/state/:state', async (req, res) => {
    try {
      const cars = carManager.getCarsByState(req.params.state);
      res.json({
        success: true,
        data: cars,
        count: cars.length,
        state: req.params.state
      });
    } catch (error) {
      logger.error(`Failed to get cars by state ${req.params.state}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cars by state'
      });
    }
  });

  // Get cars by status
  router.get('/status/:status', async (req, res) => {
    try {
      const cars = carManager.getCarsByStatus(req.params.status);
      res.json({
        success: true,
        data: cars,
        count: cars.length,
        status: req.params.status
      });
    } catch (error) {
      logger.error(`Failed to get cars by status ${req.params.status}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cars by status'
      });
    }
  });

  // Delete car
  router.delete('/:id', async (req, res) => {
    try {
      const car = carManager.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }

      // Stop Ankaios agent
      try {
        await ankaiosController.stopCarAgent(req.params.id);
      } catch (agentError) {
        logger.error(`Failed to stop agent for car ${req.params.id}:`, agentError);
      }

      // Delete Symphony target
      try {
        await symphonyProvider.deleteTarget(req.params.id);
      } catch (symphonyError) {
        logger.error(`Failed to delete Symphony target for car ${req.params.id}:`, symphonyError);
      }

      // Remove from car manager
      carManager.deleteCar(req.params.id);

      // Notify WebSocket clients
      wsManager.onCarDeleted(req.params.id);

      res.json({
        success: true,
        message: 'Car deleted successfully'
      });
    } catch (error) {
      logger.error(`Failed to delete car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete car'
      });
    }
  });

  // Get car statistics
  router.get('/stats/overview', async (req, res) => {
    try {
      const stats = carManager.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get car statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  });

  return router;
};
