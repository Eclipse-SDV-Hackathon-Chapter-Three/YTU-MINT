const mqtt = require('mqtt');
const axios = require('axios');
const logger = require('../utils/logger');

class SymphonyProvider {
  constructor() {
    this.mqttClient = null;
    this.symphonyApiUrl = process.env.SYMPHONY_API_URL || 'http://localhost:8082/v1alpha2';
    this.mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    this.isConnected = false;
    this.updateCallbacks = new Map();
  }

  async connect() {
    try {
      // Connect to MQTT broker
      this.mqttClient = mqtt.connect(this.mqttBrokerUrl, {
        clientId: `fleet-dashboard-${Date.now()}`,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000
      });

      this.mqttClient.on('connect', () => {
        logger.info('Connected to MQTT broker');
        this.isConnected = true;
        this.subscribeToTopics();
      });

      this.mqttClient.on('error', (error) => {
        logger.error('MQTT connection error:', error);
        this.isConnected = false;
      });

      this.mqttClient.on('disconnect', () => {
        logger.warn('Disconnected from MQTT broker');
        this.isConnected = false;
      });

      // Test Symphony API connection
      await this.testSymphonyConnection();

    } catch (error) {
      logger.error('Failed to connect to Symphony services:', error);
      throw error;
    }
  }

  async testSymphonyConnection() {
    try {
      const response = await axios.get(`${this.symphonyApiUrl}/targets`, {
        timeout: 5000,
        auth: {
          username: 'admin',
          password: ''
        }
      });
      logger.info('Symphony API connection successful');
      return true;
    } catch (error) {
      logger.warn('Symphony API connection failed:', error.message);
      return false;
    }
  }

  subscribeToTopics() {
    if (!this.mqttClient) return;

    // Subscribe to update status topics
    this.mqttClient.subscribe('symphony/updates/+/status', (err) => {
      if (err) {
        logger.error('Failed to subscribe to update status:', err);
      } else {
        logger.info('Subscribed to update status topics');
      }
    });

    this.mqttClient.subscribe('symphony/updates/+/result', (err) => {
      if (err) {
        logger.error('Failed to subscribe to update results:', err);
      } else {
        logger.info('Subscribed to update result topics');
      }
    });

    // Handle incoming messages
    this.mqttClient.on('message', (topic, message) => {
      this.handleMqttMessage(topic, message);
    });
  }

  handleMqttMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      logger.debug(`Received MQTT message on ${topic}:`, data);

      if (topic.includes('/status')) {
        this.handleUpdateStatus(topic, data);
      } else if (topic.includes('/result')) {
        this.handleUpdateResult(topic, data);
      }
    } catch (error) {
      logger.error('Failed to parse MQTT message:', error);
    }
  }

  handleUpdateStatus(topic, data) {
    const carId = this.extractCarIdFromTopic(topic);
    if (carId && this.updateCallbacks.has(carId)) {
      const callback = this.updateCallbacks.get(carId);
      callback('status', data);
    }
  }

  handleUpdateResult(topic, data) {
    const carId = this.extractCarIdFromTopic(topic);
    if (carId && this.updateCallbacks.has(carId)) {
      const callback = this.updateCallbacks.get(carId);
      callback('result', data);
    }
  }

  extractCarIdFromTopic(topic) {
    const parts = topic.split('/');
    return parts[2]; // symphony/updates/{carId}/status
  }

  async createTarget(car, targetConfig) {
    try {
      const target = {
        apiVersion: 'symphony.microsoft.com/v1',
        kind: 'Target',
        metadata: {
          name: `target-${car.id}`,
          namespace: 'default'
        },
        spec: {
          displayName: `Car ${car.name} Target`,
          scope: {
            targetType: 'ankaios',
            targetSelector: {
              matchLabels: {
                'car.id': car.id,
                'car.region': car.region
              }
            }
          },
          properties: {
            'ankaios.agent': car.metadata.agentName,
            'ankaios.workload': car.metadata.workloadName,
            'ankaios.runtime': 'podman',
            'ankaios.restartPolicy': 'ON_FAILURE',
            'ankaios.runtimeConfig': JSON.stringify({
              image: car.metadata.containerImage,
              commandOptions: [
                '-p', '8080:80',
                '--name', `car-${car.id}`,
                '--env', `CAR_ID=${car.id}`,
                '--env', `CAR_REGION=${car.region}`,
                '--env', `CAR_STATE=${car.state}`,
                '--env', `CAR_VERSION=${car.version}`
              ]
            })
          }
        }
      };

      const response = await axios.post(`${this.symphonyApiUrl}/targets`, target, {
        auth: {
          username: 'admin',
          password: ''
        }
      });
      logger.info(`Created Symphony target for car ${car.id}`);
      return response.data;

    } catch (error) {
      logger.warn(`Symphony target creation failed for car ${car.id}:`, error.message);
      // Don't throw error - allow car creation to continue without Symphony
      return { success: false, error: error.message };
    }
  }

  async updateCar(car, newVersion, updateConfig = {}) {
    try {
      // Validate car state for updates
      if (car.state !== 'parked') {
        throw new Error(`Car ${car.id} must be parked to receive updates. Current state: ${car.state}`);
      }

      // Create update payload
      const updatePayload = {
        targetId: `target-${car.id}`,
        version: newVersion,
        updateType: 'workload',
        properties: {
          'ankaios.runtimeConfig': JSON.stringify({
            image: updateConfig.image || car.metadata.containerImage,
            commandOptions: [
              '-p', '8080:80',
              '--name', `car-${car.id}`,
              '--env', `CAR_ID=${car.id}`,
              '--env', `CAR_REGION=${car.region}`,
              '--env', `CAR_STATE=${car.state}`,
              '--env', `CAR_VERSION=${newVersion}`
            ]
          })
        },
        metadata: {
          carId: car.id,
          carName: car.name,
          region: car.region,
          timestamp: new Date().toISOString()
        }
      };

      // Send update via MQTT
      const topic = `symphony/updates/${car.id}/command`;
      this.mqttClient.publish(topic, JSON.stringify(updatePayload));

      // Set up callback for update status
      this.updateCallbacks.set(car.id, (type, data) => {
        logger.info(`Update ${type} for car ${car.id}:`, data);
      });

      logger.info(`Initiated update for car ${car.id} to version ${newVersion}`);
      return { success: true, message: 'Update initiated' };

    } catch (error) {
      logger.error(`Failed to update car ${car.id}:`, error);
      throw error;
    }
  }

  async rollbackCar(car, targetVersion) {
    try {
      const rollbackPayload = {
        targetId: `target-${car.id}`,
        version: targetVersion,
        updateType: 'rollback',
        properties: {
          'ankaios.runtimeConfig': JSON.stringify({
            image: car.metadata.containerImage,
            commandOptions: [
              '-p', '8080:80',
              '--name', `car-${car.id}`,
              '--env', `CAR_ID=${car.id}`,
              '--env', `CAR_REGION=${car.region}`,
              '--env', `CAR_STATE=${car.state}`,
              '--env', `CAR_VERSION=${targetVersion}`
            ]
          })
        },
        metadata: {
          carId: car.id,
          carName: car.name,
          region: car.region,
          timestamp: new Date().toISOString()
        }
      };

      const topic = `symphony/updates/${car.id}/rollback`;
      this.mqttClient.publish(topic, JSON.stringify(rollbackPayload));

      logger.info(`Initiated rollback for car ${car.id} to version ${targetVersion}`);
      return { success: true, message: 'Rollback initiated' };

    } catch (error) {
      logger.error(`Failed to rollback car ${car.id}:`, error);
      throw error;
    }
  }

  async stagedRollout(cars, newVersion, rolloutConfig = {}) {
    const { phases = ['Munich', 'Berlin'], successThreshold = 0.8, waitTime = 300000 } = rolloutConfig;
    const results = {};

    try {
      for (const phase of phases) {
        logger.info(`Starting rollout phase: ${phase}`);
        
        const phaseCars = cars.filter(car => car.region === phase);
        if (phaseCars.length === 0) {
          logger.warn(`No cars found in region ${phase}`);
          continue;
        }

        // Update all cars in this phase
        const updatePromises = phaseCars.map(car => 
          this.updateCar(car, newVersion).catch(error => ({
            carId: car.id,
            error: error.message
          }))
        );

        const phaseResults = await Promise.all(updatePromises);
        const successful = phaseResults.filter(result => result.success);
        const failed = phaseResults.filter(result => result.error);

        results[phase] = {
          total: phaseCars.length,
          successful: successful.length,
          failed: failed.length,
          successRate: successful.length / phaseCars.length
        };

        logger.info(`Phase ${phase} completed: ${successful.length}/${phaseCars.length} successful`);

        // Check if phase was successful enough to continue
        if (results[phase].successRate < successThreshold) {
          logger.error(`Phase ${phase} failed success threshold (${successRate} < ${successThreshold})`);
          
          // Rollback this phase
          await this.rollbackPhase(phaseCars, car.version);
          throw new Error(`Phase ${phase} failed, rollout stopped`);
        }

        // Wait before next phase
        if (phase !== phases[phases.length - 1]) {
          logger.info(`Waiting ${waitTime}ms before next phase...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      logger.info('Staged rollout completed successfully');
      return { success: true, results };

    } catch (error) {
      logger.error('Staged rollout failed:', error);
      throw error;
    }
  }

  async rollbackPhase(cars, targetVersion) {
    logger.info(`Rolling back ${cars.length} cars to version ${targetVersion}`);
    
    const rollbackPromises = cars.map(car => 
      this.rollbackCar(car, targetVersion).catch(error => ({
        carId: car.id,
        error: error.message
      }))
    );

    const results = await Promise.all(rollbackPromises);
    const successful = results.filter(result => result.success);
    const failed = results.filter(result => result.error);

    logger.info(`Rollback completed: ${successful.length}/${cars.length} successful`);
    return { successful, failed };
  }

  async deleteTarget(carId) {
    try {
      await axios.delete(`${this.symphonyApiUrl}/targets/target-${carId}`, {
        auth: {
          username: 'admin',
          password: ''
        }
      });
      logger.info(`Deleted Symphony target for car ${carId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete Symphony target for car ${carId}:`, error);
      throw error;
    }
  }

  isHealthy() {
    return this.isConnected && this.mqttClient && this.mqttClient.connected;
  }

  async cleanup() {
    logger.info('Cleaning up SymphonyProvider');
    
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    
    this.updateCallbacks.clear();
  }
}

module.exports = SymphonyProvider;
