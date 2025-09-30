const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');

const updateSchema = Joi.object({
  version: Joi.string().required(),
  image: Joi.string().optional(),
  force: Joi.boolean().default(false)
});

const bulkUpdateSchema = Joi.object({
  carIds: Joi.array().items(Joi.string()).min(1).required(),
  version: Joi.string().required(),
  image: Joi.string().optional(),
  force: Joi.boolean().default(false)
});

const stagedRolloutSchema = Joi.object({
  phases: Joi.array().items(Joi.string()).min(1).required(),
  version: Joi.string().required(),
  image: Joi.string().optional(),
  successThreshold: Joi.number().min(0).max(1).default(0.8),
  waitTime: Joi.number().min(0).default(300000)
});

const rollbackSchema = Joi.object({
  targetVersion: Joi.string().required(),
  reason: Joi.string().optional()
});

module.exports = (carManager, symphonyProvider, wsManager) => {
  const router = express.Router();

  // Update single car
  router.post('/:id', async (req, res) => {
    try {
      const { error, value } = updateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid update data',
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

      // Check if car is in a valid state for updates
      if (!value.force && car.state !== 'parked') {
        return res.status(400).json({
          success: false,
          error: `Car must be parked to receive updates. Current state: ${car.state}`,
          suggestion: 'Set car state to parked or use force=true'
        });
      }

      // Update car status to updating
      carManager.updateCarStatus(req.params.id, 'updating');
      wsManager.onUpdateStarted(req.params.id, value.version);

      try {
        // Perform update via Symphony Provider
        const result = await symphonyProvider.updateCar(car, value.version, {
          image: value.image
        });

        // Update car version in manager
        carManager.updateCarVersion(req.params.id, value.version);
        carManager.updateCarStatus(req.params.id, 'running');
        
        // Notify WebSocket clients
        wsManager.onUpdateCompleted(req.params.id, value.version, true);
        wsManager.onCarUpdated(carManager.getCar(req.params.id));

        res.json({
          success: true,
          data: result,
          message: `Update initiated for car ${req.params.id} to version ${value.version}`
        });

      } catch (updateError) {
        logger.error(`Update failed for car ${req.params.id}:`, updateError);
        
        // Update car status to failed
        carManager.updateCarStatus(req.params.id, 'failed');
        carManager.addLog(req.params.id, `Update failed: ${updateError.message}`, 'error');
        
        // Notify WebSocket clients
        wsManager.onUpdateFailed(req.params.id, value.version, updateError.message);
        wsManager.onCarUpdated(carManager.getCar(req.params.id));

        res.status(500).json({
          success: false,
          error: 'Update failed',
          details: updateError.message
        });
      }

    } catch (error) {
      logger.error(`Failed to update car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate update'
      });
    }
  });

  // Bulk update multiple cars
  router.post('/bulk', async (req, res) => {
    try {
      const { error, value } = bulkUpdateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bulk update data',
          details: error.details
        });
      }

      const results = [];
      const errors = [];

      for (const carId of value.carIds) {
        try {
          const car = carManager.getCar(carId);
          if (!car) {
            errors.push({ carId, error: 'Car not found' });
            continue;
          }

          if (!value.force && car.state !== 'parked') {
            errors.push({ 
              carId, 
              error: `Car must be parked. Current state: ${car.state}` 
            });
            continue;
          }

          // Update car status
          carManager.updateCarStatus(carId, 'updating');
          wsManager.onUpdateStarted(carId, value.version);

          // Perform update
          const result = await symphonyProvider.updateCar(car, value.version, {
            image: value.image
          });

          // Update car version
          carManager.updateCarVersion(carId, value.version);
          carManager.updateCarStatus(carId, 'running');
          
          results.push({ carId, success: true, result });
          wsManager.onUpdateCompleted(carId, value.version, true);

        } catch (carError) {
          logger.error(`Bulk update failed for car ${carId}:`, carError);
          carManager.updateCarStatus(carId, 'failed');
          carManager.addLog(carId, `Bulk update failed: ${carError.message}`, 'error');
          
          errors.push({ carId, error: carError.message });
          wsManager.onUpdateFailed(carId, value.version, carError.message);
        }
      }

      res.json({
        success: true,
        data: {
          successful: results.length,
          failed: errors.length,
          results,
          errors
        },
        message: `Bulk update completed: ${results.length} successful, ${errors.length} failed`
      });

    } catch (error) {
      logger.error('Failed to perform bulk update:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform bulk update'
      });
    }
  });

  // Staged rollout
  router.post('/staged-rollout', async (req, res) => {
    try {
      const { error, value } = stagedRolloutSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid staged rollout data',
          details: error.details
        });
      }

      // Get cars by phases
      const phaseCars = {};
      for (const phase of value.phases) {
        phaseCars[phase] = carManager.getCarsByRegion(phase);
        if (phaseCars[phase].length === 0) {
          return res.status(400).json({
            success: false,
            error: `No cars found in region ${phase}`
          });
        }
      }

      // Notify WebSocket clients
      wsManager.onStagedRolloutStarted(value.phases, value.version);

      try {
        // Perform staged rollout
        const allCars = Object.values(phaseCars).flat();
        const result = await symphonyProvider.stagedRollout(allCars, value.version, {
          phases: value.phases,
          successThreshold: value.successThreshold,
          waitTime: value.waitTime
        });

        // Update car versions
        for (const car of allCars) {
          carManager.updateCarVersion(car.id, value.version);
          carManager.updateCarStatus(car.id, 'running');
        }

        // Notify completion
        wsManager.onStagedRolloutCompleted(result.results);

        res.json({
          success: true,
          data: result,
          message: 'Staged rollout completed successfully'
        });

      } catch (rolloutError) {
        logger.error('Staged rollout failed:', rolloutError);
        
        // Notify failure
        wsManager.onStagedRolloutFailed(rolloutError.phase || 'unknown', rolloutError.message);

        res.status(500).json({
          success: false,
          error: 'Staged rollout failed',
          details: rolloutError.message
        });
      }

    } catch (error) {
      logger.error('Failed to perform staged rollout:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform staged rollout'
      });
    }
  });

  // Rollback car
  router.post('/:id/rollback', async (req, res) => {
    try {
      const { error, value } = rollbackSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rollback data',
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

      // Update car status
      carManager.updateCarStatus(req.params.id, 'updating');
      carManager.addLog(req.params.id, `Rollback initiated to version ${value.targetVersion}`, 'info');
      wsManager.onRollbackStarted(req.params.id, value.targetVersion);

      try {
        // Perform rollback via Symphony Provider
        const result = await symphonyProvider.rollbackCar(car, value.targetVersion);

        // Update car version
        carManager.updateCarVersion(req.params.id, value.targetVersion);
        carManager.updateCarStatus(req.params.id, 'running');
        carManager.addLog(req.params.id, `Rollback completed to version ${value.targetVersion}`, 'info');

        // Notify WebSocket clients
        wsManager.onRollbackCompleted(req.params.id, value.targetVersion, true);
        wsManager.onCarUpdated(carManager.getCar(req.params.id));

        res.json({
          success: true,
          data: result,
          message: `Rollback completed for car ${req.params.id} to version ${value.targetVersion}`
        });

      } catch (rollbackError) {
        logger.error(`Rollback failed for car ${req.params.id}:`, rollbackError);
        
        // Update car status to failed
        carManager.updateCarStatus(req.params.id, 'failed');
        carManager.addLog(req.params.id, `Rollback failed: ${rollbackError.message}`, 'error');
        
        // Notify WebSocket clients
        wsManager.onRollbackCompleted(req.params.id, value.targetVersion, false);
        wsManager.onCarUpdated(carManager.getCar(req.params.id));

        res.status(500).json({
          success: false,
          error: 'Rollback failed',
          details: rollbackError.message
        });
      }

    } catch (error) {
      logger.error(`Failed to rollback car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate rollback'
      });
    }
  });

  // Get update history for a car
  router.get('/:id/history', async (req, res) => {
    try {
      const car = carManager.getCar(req.params.id);
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }

      res.json({
        success: true,
        data: car.updateHistory || []
      });
    } catch (error) {
      logger.error(`Failed to get update history for car ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve update history'
      });
    }
  });

  return router;
};
