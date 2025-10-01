const { spawn } = require("child_process");
const path = require("path");
const logger = require('../utils/logger');

class CarAgentManager {
  constructor(serverEndpoint = "127.0.0.1:50051") {
    this.serverEndpoint = serverEndpoint;
    this.agents = new Map(); // track spawned agents
    this.ankaiosPath = process.env.ANKAIOS_PATH || '/usr/local/bin/ankaios';
    logger.info(`CarAgentManager initialized with server endpoint: ${this.serverEndpoint}`);
  }

  /**
   * Create a new car agent (simulated - no actual process spawning)
   * @param {string} carId - Unique car ID
   * @param {string} carName - Car name
   * @param {Object} config - Agent configuration
   * @returns {Promise<string>} - Agent name
   */
  async spawnCarAgent(carId, carName, config = {}) {
    const agentName = carName || `car-${carId}`;
    
    // Check if agent already exists
    if (this.agents.has(agentName)) {
      logger.warn(`Agent ${agentName} already exists`);
      return agentName;
    }

    logger.info(`🚗 Creating car agent: ${agentName}`);

    try {
      // Simulate agent creation (no actual process spawning)
      // In a real scenario, this would spawn an Ankaios agent process
      
      // Store agent info
      this.agents.set(agentName, {
        carId: carId,
        carName: carName,
        config: config,
        startedAt: new Date().toISOString(),
        status: 'running',
        serverEndpoint: this.serverEndpoint
      });

      logger.info(`✅ Successfully created car agent: ${agentName}`);
      return agentName;

    } catch (error) {
      logger.error(`Failed to create agent ${agentName}:`, error);
      throw error;
    }
  }

  /**
   * Stop a car agent
   * @param {string} agentName - Agent name
   * @returns {boolean} - Success status
   */
  stopCarAgent(agentName) {
    const agentInfo = this.agents.get(agentName);
    if (!agentInfo) {
      logger.warn(`Agent ${agentName} not found`);
      return false;
    }

    logger.info(`🛑 Stopping agent ${agentName}`);
    
    try {
      // Simulate agent stopping
      this.agents.delete(agentName);
      logger.info(`✅ Successfully stopped agent: ${agentName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to stop agent ${agentName}:`, error);
      return false;
    }
  }

  /**
   * Get all active agents
   * @returns {Array} - List of active agents
   */
  getActiveAgents() {
    return Array.from(this.agents.entries()).map(([name, info]) => ({
      name: name,
      carId: info.carId,
      carName: info.carName,
      status: info.status,
      startedAt: info.startedAt,
      config: info.config
    }));
  }

  /**
   * Get agent by name
   * @param {string} agentName - Agent name
   * @returns {Object|null} - Agent info or null
   */
  getAgent(agentName) {
    const agentInfo = this.agents.get(agentName);
    if (!agentInfo) {
      return null;
    }

    return {
      name: agentName,
      carId: agentInfo.carId,
      carName: agentInfo.carName,
      status: agentInfo.status,
      startedAt: agentInfo.startedAt,
      config: agentInfo.config
    };
  }

  /**
   * Check if agent is running
   * @param {string} agentName - Agent name
   * @returns {boolean} - Running status
   */
  isAgentRunning(agentName) {
    return this.agents.has(agentName);
  }

  /**
   * Stop all agents
   * @returns {number} - Number of agents stopped
   */
  stopAllAgents() {
    logger.info('🛑 Stopping all agents');
    let stoppedCount = 0;
    
    for (const [agentName, agentInfo] of this.agents.entries()) {
      try {
        agentInfo.process.kill("SIGTERM");
        this.agents.delete(agentName);
        stoppedCount++;
        logger.info(`✅ Stopped agent: ${agentName}`);
      } catch (error) {
        logger.error(`Failed to stop agent ${agentName}:`, error);
      }
    }

    logger.info(`🛑 Stopped ${stoppedCount} agents`);
    return stoppedCount;
  }

  /**
   * Get manager status
   * @returns {Object} - Manager status
   */
  getStatus() {
    return {
      serverEndpoint: this.serverEndpoint,
      activeAgents: this.agents.size,
      agents: this.getActiveAgents()
    };
  }

  /**
   * Check if manager is healthy
   * @returns {boolean} - Health status
   */
  isHealthy() {
    return true; // Manager is always healthy
  }
}

module.exports = CarAgentManager;
