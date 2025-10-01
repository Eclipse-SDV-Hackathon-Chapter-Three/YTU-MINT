const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

class AnkaiosRpcController {
  constructor() {
    this.ankaiosPath = process.env.ANKAIOS_PATH || '/usr/local/bin/ank';
    this.stateFilePath = process.env.STATE_FILE_PATH || './ankaios_states';
    this.activeAgents = new Map();
    this.ensureStateDirectory();
  }

  async ensureStateDirectory() {
    try {
      await fs.ensureDir(this.stateFilePath);
    } catch (error) {
      logger.error('Failed to create state directory:', error);
    }
  }

  /**
   * Create a new car agent with RPC communication
   * @param {Object} carConfig - Car configuration
   * @returns {Promise<Object>} - Created car agent info
   */
  async createCarAgent(carConfig) {
    try {
      const carId = carConfig.id || `car-${Date.now()}`;
      const carName = carConfig.name || `car-${carId}`;
      
      logger.info(`Creating car agent: ${carName}`);

      // Create state file for the car agent
      const stateFile = await this.createCarAgentStateFile(carId, carName, carConfig);
      
      // Apply the state using ank CLI
      const result = await this.applyAgentState(stateFile);
      
      if (result.success) {
        // Store car agent info
        this.activeAgents.set(carId, {
          id: carId,
          name: carName,
          type: 'car',
          stateFile,
          createdAt: new Date().toISOString(),
          status: 'running',
          config: carConfig,
          workloads: [] // Will be populated when ECUs are added
        });

        logger.info(`Successfully created car agent: ${carName}`);
        return {
          success: true,
          carId,
          carName,
          stateFile,
          message: `Car agent ${carName} created successfully`
        };
      } else {
        throw new Error(`Failed to apply car agent state: ${result.error}`);
      }

    } catch (error) {
      logger.error(`Failed to create car agent:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create state file for a new car agent
   * @param {string} carId - Unique car ID
   * @param {string} carName - Car name
   * @param {Object} config - Car configuration
   * @returns {Promise<string>} - Path to created state file
   */
  async createCarAgentStateFile(carId, carName, config) {
    // Create car agent as a workload (this is how Ankaios works)
    const stateContent = {
      apiVersion: 'v0.1',
      workloads: {
        [carName]: {
          runtime: 'podman',
          agent: carName, // The car is its own agent
          restartPolicy: 'ON_FAILURE',
          runtimeConfig: `image: ${config.image || 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest'}\n  commandOptions: ["--name","${carName}","--env","CAR_ID=${carId}","--env","CAR_NAME=${carName}","--env","CITY=${config.city || 'Unknown'}","--env","STATE=${config.state || 'parked'}","--env","AGENT_TYPE=car"]`
        }
      }
    };

    const stateFile = path.join(this.stateFilePath, `car-${carId}.yaml`);
    await fs.writeFile(stateFile, this.yamlStringify(stateContent));
    
    logger.info(`Created state file: ${stateFile}`);
    return stateFile;
  }

  /**
   * Apply agent state using ank CLI
   * @param {string} stateFile - Path to state file
   * @returns {Promise<Object>} - Result of applying state
   */
  async applyAgentState(stateFile) {
    try {
      const { stdout, stderr } = await execAsync(`${this.ankaiosPath} apply ${stateFile}`);
      
      if (stderr && !stderr.includes('Successfully applied')) {
        logger.warn(`Ank apply stderr: ${stderr}`);
      }

      logger.info(`Applied state file: ${stateFile}`);
      return {
        success: true,
        stdout,
        stderr
      };
    } catch (error) {
      logger.error(`Failed to apply state file ${stateFile}:`, error);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  }

  /**
   * Add ECU workload to a car agent
   * @param {string} carId - Car agent ID
   * @param {Object} ecuConfig - ECU configuration
   * @returns {Promise<Object>} - Result of adding ECU
   */
  async addEcuToCar(carId, ecuConfig) {
    try {
      const car = this.activeAgents.get(carId);
      if (!car) {
        return {
          success: false,
          error: `Car agent ${carId} not found`
        };
      }

      const ecuName = ecuConfig.name || `ecu-${Date.now()}`;
      const ecuVersion = ecuConfig.version || 'v1.0';
      
      // Create ECU workload state
      const ecuStateContent = {
        apiVersion: 'v0.1',
        workloads: {
          [`${ecuName}-${carId}`]: {
            runtime: 'podman',
            agent: car.name, // Run on the car agent
            restartPolicy: 'ON_FAILURE',
            runtimeConfig: `image: ${ecuConfig.image || 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest'}\n  commandOptions: ["--name","${ecuName}-${carId}","--env","ECU_NAME=${ecuName}","--env","ECU_VERSION=${ecuVersion}","--env","CAR_ID=${carId}","--env","CAR_NAME=${car.name}"]`
          }
        }
      };

      const ecuStateFile = path.join(this.stateFilePath, `ecu-${ecuName}-${carId}.yaml`);
      await fs.writeFile(ecuStateFile, this.yamlStringify(ecuStateContent));
      
      // Apply ECU workload
      const result = await this.applyAgentState(ecuStateFile);
      
      if (result.success) {
        // Add ECU to car's workload list
        const ecu = {
          name: ecuName,
          version: ecuVersion,
          status: 'running',
          createdAt: new Date().toISOString(),
          stateFile: ecuStateFile
        };
        
        car.workloads.push(ecu);
        
        logger.info(`Added ECU ${ecuName} to car ${carId}`);
        return {
          success: true,
          ecu,
          message: `ECU ${ecuName} added to car ${carId}`
        };
      } else {
        throw new Error(`Failed to apply ECU workload: ${result.error}`);
      }

    } catch (error) {
      logger.error(`Failed to add ECU to car ${carId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove ECU workload from a car agent
   * @param {string} carId - Car agent ID
   * @param {string} ecuName - ECU name
   * @returns {Promise<Object>} - Result of removing ECU
   */
  async removeEcuFromCar(carId, ecuName) {
    try {
      const car = this.activeAgents.get(carId);
      if (!car) {
        return {
          success: false,
          error: `Car agent ${carId} not found`
        };
      }

      const workloadName = `${ecuName}-${carId}`;
      
      // Delete ECU workload using ank CLI
      await execAsync(`${this.ankaiosPath} delete workload ${workloadName}`);

      // Remove ECU from car's workload list
      car.workloads = car.workloads.filter(ecu => ecu.name !== ecuName);

      logger.info(`Removed ECU ${ecuName} from car ${carId}`);
      return {
        success: true,
        message: `ECU ${ecuName} removed from car ${carId}`
      };

    } catch (error) {
      logger.error(`Failed to remove ECU from car ${carId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all active car agents
   * @returns {Array} - List of active car agents
   */
  getActiveAgents() {
    return Array.from(this.activeAgents.values());
  }

  /**
   * Get agent by ID
   * @param {string} agentId - Agent ID
   * @returns {Object|null} - Agent info or null
   */
  getAgent(agentId) {
    return this.activeAgents.get(agentId) || null;
  }

  /**
   * Delete an agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteAgent(agentId) {
    try {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        return {
          success: false,
          error: `Agent ${agentId} not found`
        };
      }

      // Delete car agent workload using ank CLI
      await execAsync(`${this.ankaiosPath} delete workload ${agent.name}`);

      // Remove from active agents
      this.activeAgents.delete(agentId);

      // Clean up state file
      try {
        await fs.remove(agent.stateFile);
      } catch (error) {
        logger.warn(`Failed to remove state file ${agent.stateFile}:`, error);
      }

      logger.info(`Successfully deleted agent: ${agentId}`);
      return {
        success: true,
        message: `Agent ${agentId} deleted successfully`
      };

    } catch (error) {
      logger.error(`Failed to delete agent ${agentId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Ankaios system status
   * @returns {Promise<Object>} - System status
   */
  async getSystemStatus() {
    try {
      const { stdout: agentsOutput } = await execAsync(`${this.ankaiosPath} get agents`);
      const { stdout: workloadsOutput } = await execAsync(`${this.ankaiosPath} get workloads`);

      return {
        success: true,
        agents: agentsOutput.trim(),
        workloads: workloadsOutput.trim(),
        activeAgents: this.getActiveAgents().length
      };
    } catch (error) {
      logger.error('Failed to get system status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert object to YAML string
   * @param {Object} obj - Object to convert
   * @param {number} indent - Indentation level
   * @returns {string} - YAML string
   */
  yamlStringify(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.yamlStringify(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.yamlStringify(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (key === 'runtimeConfig' && typeof value === 'string' && value.includes('\n')) {
        // Handle YAML block strings (like runtimeConfig)
        yaml += `${spaces}${key}: |\n`;
        const lines = value.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            yaml += `${spaces}  ${line}\n`;
          }
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  /**
   * Health check
   * @returns {boolean} - Controller health status
   */
  isHealthy() {
    return true;
  }

  /**
   * Cleanup all agents
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanup() {
    try {
      const agentIds = Array.from(this.activeAgents.keys());
      const results = [];

      for (const agentId of agentIds) {
        const result = await this.deleteAgent(agentId);
        results.push({ agentId, result });
      }

      logger.info(`Cleaned up ${agentIds.length} agents`);
      return {
        success: true,
        cleanedAgents: agentIds.length,
        results
      };
    } catch (error) {
      logger.error('Failed to cleanup agents:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AnkaiosRpcController;
