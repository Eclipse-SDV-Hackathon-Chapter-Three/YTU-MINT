const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');

class AnkaiosController {
  constructor() {
    this.activeAgents = new Map();
    this.ankaiosPath = process.env.ANKAIOS_PATH || '/usr/local/bin/ank';
    this.stateFilePath = process.env.STATE_FILE_PATH || './ankaios_states';
    this.ensureStateDirectory();
  }

  async ensureStateDirectory() {
    try {
      await fs.ensureDir(this.stateFilePath);
    } catch (error) {
      logger.error('Failed to create state directory:', error);
    }
  }

  async cleanupExistingContainer(carId) {
    try {
      // Remove any existing containers with the same name
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      // Try to stop and remove existing container
      await execAsync(`podman stop car-${carId} 2>/dev/null || true`);
      await execAsync(`podman rm car-${carId} 2>/dev/null || true`);
      
      logger.info(`Cleaned up existing container for car ${carId}`);
    } catch (error) {
      // Ignore cleanup errors - container might not exist
      logger.debug(`Cleanup for car ${carId} completed (container may not have existed)`);
    }
  }

  async spawnCarAgent(agent) {
    const agentName = agent.metadata.agentName;
    
    try {
      // Clean up any existing containers with the same name
      await this.cleanupExistingContainer(agent.id);
      
      // Create Ankaios state file for this agent
      const stateFile = await this.createStateFile(agent);
      
      // Spawn Ankaios agent as child process
      logger.info(`Spawning Ankaios agent for agent ${agent.id} with state file: ${stateFile}`);
      const agentProcess = spawn(this.ankaiosPath, ['apply', stateFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          AGENT_ID: agent.id,
          AGENT_CITY: agent.city,
          AGENT_STATE: agent.state,
          AGENT_STATUS: agent.status
        }
      });

      // Store agent process
      this.activeAgents.set(agent.id, {
        process: agentProcess,
        agentId: agent.id,
        agentName,
        stateFile,
        startTime: new Date().toISOString()
      });

      // Handle process events
      agentProcess.on('error', (error) => {
        logger.error(`Ankaios agent ${agentName} error:`, error);
        this.handleAgentError(agent.id, error);
      });

      agentProcess.on('exit', (code, signal) => {
        logger.info(`Ankaios agent ${agentName} exited with code ${code}, signal ${signal}`);
        this.handleAgentExit(agent.id, code, signal);
      });

      // Handle stdout/stderr
      agentProcess.stdout.on('data', (data) => {
        const output = data.toString();
        logger.debug(`Ankaios agent ${agentName} stdout:`, output);
        this.handleAgentOutput(agent.id, output, 'stdout');
      });

      agentProcess.stderr.on('data', (data) => {
        const output = data.toString();
        logger.debug(`Ankaios agent ${agentName} stderr:`, output);
        this.handleAgentOutput(agent.id, output, 'stderr');
      });

      logger.info(`Spawned Ankaios agent ${agentName} for agent ${agent.id}`);
      return { success: true, agentName, stateFile };

    } catch (error) {
      logger.error(`Failed to spawn Ankaios agent for agent ${agent.id}:`, error);
      throw error;
    }
  }

  async getAvailablePort() {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Try to find an available port
    for (let i = 0; i < 10; i++) {
      const port = 9000 + Math.floor(Math.random() * 1000);
      try {
        await execAsync(`netstat -ln | grep :${port} || true`);
        // If no output, port is likely available
        return port;
      } catch (error) {
        // Continue to next port
        continue;
      }
    }
    // Fallback to a random port
    return 9000 + Math.floor(Math.random() * 1000);
  }

  async createStateFile(agent) {
    // Get an available port
    const uniquePort = await this.getAvailablePort();
    
    // Create the car agent itself (not workloads on test_agent)
    const agentName = agent.name || `car-${agent.id}`;
    
    // Create workloads for each ECU that run on THIS car agent
    const workloads = {};
    agent.workloads.forEach((ecu, index) => {
      const workloadName = `${ecu.name}-${agent.id}`;
      workloads[workloadName] = {
        runtime: 'podman',
        agent: agentName, // Run on the car agent, not test_agent
        restartPolicy: 'ON_FAILURE',
        runtimeConfig: `image: ${agent.metadata.containerImage}\n  commandOptions: ["-p","${uniquePort + index}:80","--name","${ecu.name}-${agent.id}","--env","AGENT_ID=${agent.id}","--env","ECU_NAME=${ecu.name}","--env","ECU_VERSION=${ecu.version}","--env","CITY=${agent.city}","--env","STATE=${agent.state}"]`
      };
    });
    
    const stateContent = {
      apiVersion: 'v0.1',
      workloads
    };

    const stateFile = path.join(this.stateFilePath, `state-${agent.id}.yaml`);
    await fs.writeFile(stateFile, this.yamlStringify(stateContent));
    
    return stateFile;
  }

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
            // Remove leading spaces from the line since we're adding our own indentation
            const trimmedLine = line.trim();
            yaml += `${spaces}  ${trimmedLine}\n`;
          } else {
            yaml += `${spaces}  \n`;
          }
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  handleAgentError(carId, error) {
    const agent = this.activeAgents.get(carId);
    if (agent) {
      agent.error = error.message;
      agent.status = 'error';
    }
  }

  handleAgentExit(carId, code, signal) {
    const agent = this.activeAgents.get(carId);
    if (agent) {
      agent.exitCode = code;
      agent.exitSignal = signal;
      agent.status = code === 0 ? 'stopped' : 'failed';
      agent.endTime = new Date().toISOString();
    }
  }

  handleAgentOutput(carId, output, type) {
    const agent = this.activeAgents.get(carId);
    if (agent) {
      if (!agent.output) agent.output = [];
      agent.output.push({
        timestamp: new Date().toISOString(),
        type,
        message: output.trim()
      });
      
      // Keep only last 50 output entries
      if (agent.output.length > 50) {
        agent.output = agent.output.slice(-50);
      }
    }
  }

  async stopCarAgent(carId) {
    const agent = this.activeAgents.get(carId);
    if (!agent) {
      throw new Error(`Agent for car ${carId} not found`);
    }

    try {
      // Kill the agent process
      agent.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          agent.process.kill('SIGKILL');
          resolve();
        }, 5000);
        
        agent.process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      // Clean up state file
      try {
        await fs.remove(agent.stateFile);
      } catch (error) {
        logger.warn(`Failed to remove state file ${agent.stateFile}:`, error);
      }

      this.activeAgents.delete(carId);
      logger.info(`Stopped Ankaios agent for car ${carId}`);
      return true;

    } catch (error) {
      logger.error(`Failed to stop Ankaios agent for car ${carId}:`, error);
      throw error;
    }
  }

  getAgentStatus(carId) {
    const agent = this.activeAgents.get(carId);
    if (!agent) {
      return { status: 'not_found' };
    }

    return {
      status: agent.status || 'running',
      agentName: agent.agentName,
      workloadName: agent.workloadName,
      startTime: agent.startTime,
      endTime: agent.endTime,
      exitCode: agent.exitCode,
      exitSignal: agent.exitSignal,
      error: agent.error,
      output: agent.output || []
    };
  }

  getAllAgents() {
    return Array.from(this.activeAgents.entries()).map(([carId, agent]) => ({
      carId,
      ...this.getAgentStatus(carId)
    }));
  }

  isHealthy() {
    return true; // Simple health check
  }

  async cleanup() {
    logger.info('Cleaning up AnkaiosController');
    
    // Stop all active agents
    const stopPromises = Array.from(this.activeAgents.keys()).map(carId => 
      this.stopCarAgent(carId).catch(error => 
        logger.error(`Failed to stop agent for car ${carId}:`, error)
      )
    );
    
    await Promise.all(stopPromises);
    
    // Clean up state directory
    try {
      await fs.remove(this.stateFilePath);
    } catch (error) {
      logger.warn('Failed to clean up state directory:', error);
    }
  }
}

module.exports = AnkaiosController;
