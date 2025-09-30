const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class CarManager {
  constructor() {
    this.cars = new Map();
    this.regions = ['Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt'];
    this.versions = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '2.0.0'];
    this.states = ['parked', 'driving'];
    this.statuses = ['running', 'updating', 'failed', 'stopped'];
  }

  createCar(metadata = {}) {
    const carId = uuidv4();
    const region = metadata.region || this.getRandomRegion();
    const state = metadata.state || 'parked';
    const version = metadata.version || this.getRandomVersion();
    
    const car = {
      id: carId,
      name: `car_${carId.substring(0, 8)}`,
      region,
      state,
      version,
      status: 'running',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...metadata,
        agentName: `agent_${carId.substring(0, 8)}`,
        workloadName: `workload_${carId.substring(0, 8)}`,
        containerImage: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest'
      },
      logs: [],
      updateHistory: []
    };

    this.cars.set(carId, car);
    logger.info(`Created car ${carId} in region ${region}`);
    return car;
  }

  getCar(carId) {
    return this.cars.get(carId);
  }

  getAllCars() {
    return Array.from(this.cars.values());
  }

  updateCarState(carId, newState) {
    const car = this.cars.get(carId);
    if (!car) {
      throw new Error(`Car ${carId} not found`);
    }

    if (!this.states.includes(newState)) {
      throw new Error(`Invalid state: ${newState}. Must be one of: ${this.states.join(', ')}`);
    }

    car.state = newState;
    car.lastUpdated = new Date().toISOString();
    
    // Add to logs
    this.addLog(carId, `State changed to ${newState}`);
    
    logger.info(`Car ${carId} state changed to ${newState}`);
    return car;
  }

  updateCarStatus(carId, status) {
    const car = this.cars.get(carId);
    if (!car) {
      throw new Error(`Car ${carId} not found`);
    }

    if (!this.statuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${this.statuses.join(', ')}`);
    }

    car.status = status;
    car.lastUpdated = new Date().toISOString();
    
    // Add to logs
    this.addLog(carId, `Status changed to ${status}`);
    
    logger.info(`Car ${carId} status changed to ${status}`);
    return car;
  }

  updateCarVersion(carId, newVersion) {
    const car = this.cars.get(carId);
    if (!car) {
      throw new Error(`Car ${carId} not found`);
    }

    const oldVersion = car.version;
    car.version = newVersion;
    car.lastUpdated = new Date().toISOString();
    
    // Add to update history
    car.updateHistory.push({
      from: oldVersion,
      to: newVersion,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
    
    // Add to logs
    this.addLog(carId, `Version updated from ${oldVersion} to ${newVersion}`);
    
    logger.info(`Car ${carId} version updated from ${oldVersion} to ${newVersion}`);
    return car;
  }

  addLog(carId, message, level = 'info') {
    const car = this.cars.get(carId);
    if (!car) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    car.logs.push(logEntry);
    
    // Keep only last 100 logs
    if (car.logs.length > 100) {
      car.logs = car.logs.slice(-100);
    }
  }

  getCarsByRegion(region) {
    return this.getAllCars().filter(car => car.region === region);
  }

  getCarsByState(state) {
    return this.getAllCars().filter(car => car.state === state);
  }

  getCarsByStatus(status) {
    return this.getAllCars().filter(car => car.status === status);
  }

  deleteCar(carId) {
    const car = this.cars.get(carId);
    if (!car) {
      throw new Error(`Car ${carId} not found`);
    }

    this.cars.delete(carId);
    logger.info(`Deleted car ${carId}`);
    return true;
  }

  getRandomRegion() {
    return this.regions[Math.floor(Math.random() * this.regions.length)];
  }

  getRandomVersion() {
    return this.versions[Math.floor(Math.random() * this.versions.length)];
  }

  isHealthy() {
    return true; // Simple health check
  }

  async cleanup() {
    logger.info('Cleaning up CarManager');
    this.cars.clear();
  }

  // Statistics
  getStats() {
    const cars = this.getAllCars();
    return {
      total: cars.length,
      byRegion: this.regions.reduce((acc, region) => {
        acc[region] = cars.filter(car => car.region === region).length;
        return acc;
      }, {}),
      byState: this.states.reduce((acc, state) => {
        acc[state] = cars.filter(car => car.state === state).length;
        return acc;
      }, {}),
      byStatus: this.statuses.reduce((acc, status) => {
        acc[status] = cars.filter(car => car.status === status).length;
        return acc;
      }, {}),
      byVersion: cars.reduce((acc, car) => {
        acc[car.version] = (acc[car.version] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = CarManager;
