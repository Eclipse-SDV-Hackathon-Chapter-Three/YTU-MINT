const { exec } = require('child_process');
const util = require('util');
const logger = require('../utils/logger');

const execAsync = util.promisify(exec);

class AcmeController {
  constructor() {
    this.ankaiosPath = process.env.ANKAIOS_PATH || '/usr/local/bin/ank';
    this.symphonyApiUrl = process.env.SYMPHONY_API_URL || 'http://localhost:8082/v1alpha2';
    this.targetProviderUrl = process.env.TARGET_PROVIDER_URL || 'http://localhost:8080';
    this.logger = logger;
    logger.info('AcmeController initialized');
  }

  /**
   * Get all agents from Ankaios
   * @returns {Promise<Array>} - List of agents
   */
  async getAgents() {
    try {
      const { stdout, stderr } = await execAsync(`${this.ankaiosPath} get agents`);
      if (stderr) {
        logger.warn(`Ankaios get agents stderr: ${stderr}`);
      }

      // Parse the output to extract agent information
      const agents = this.parseAgentsOutput(stdout);
      logger.info(`Retrieved ${agents.length} agents from Ankaios`);
      return agents;
    } catch (error) {
      logger.error(`Error getting agents from Ankaios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get workloads for a specific agent
   * @param {string} agentName - Agent name
   * @returns {Promise<Array>} - List of workloads
   */
  async getAgentWorkloads(agentName) {
    try {
      const { stdout, stderr } = await execAsync(`${this.ankaiosPath} get workloads`);
      if (stderr) {
        logger.warn(`Ankaios get workloads stderr: ${stderr}`);
      }

      // Parse workloads and filter by agent
      const workloads = this.parseWorkloadsOutput(stdout);
      const agentWorkloads = workloads.filter(w => w.agent === agentName);

      logger.info(`Retrieved ${agentWorkloads.length} workloads for agent ${agentName}`);
      return agentWorkloads;
    } catch (error) {
      logger.error(`Error getting workloads for agent ${agentName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all workloads from Ankaios
   * @returns {Promise<Array>} - List of all workloads
   */
  async getAllWorkloads() {
    try {
      const { stdout, stderr } = await execAsync(`${this.ankaiosPath} get workloads`);
      if (stderr) {
        logger.warn(`Ankaios get workloads stderr: ${stderr}`);
      }

      const workloads = this.parseWorkloadsOutput(stdout);
      logger.info(`Retrieved ${workloads.length} total workloads from Ankaios`);
      return workloads;
    } catch (error) {
      logger.error(`Error getting all workloads from Ankaios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a Target.json for Symphony deployment
   * @param {Array} agentNames - List of agent names to target
   * @param {Object} deploymentConfig - Deployment configuration
   * @returns {Object} - Target.json structure
   */
  createTargetJson(agentNames, deploymentConfig = {}) {
    const target = {
      apiVersion: "v1",
      kind: "Target",
      metadata: {
        name: deploymentConfig.name || `deployment-${Date.now()}`,
        namespace: deploymentConfig.namespace || "default"
      },
      spec: {
        targetType: "Ankaios",
        targetSelector: {
          matchLabels: {
            "ankaios.io/agent": agentNames.join(",")
          }
        },
        deployment: {
          workload: {
            name: deploymentConfig.workloadName || "update-workload",
            image: deploymentConfig.image || "ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest",
            version: deploymentConfig.version || "latest",
            env: deploymentConfig.env || {}
          }
        }
      }
    };

    logger.info(`Created Target.json for agents: ${agentNames.join(', ')}`);
    return target;
  }

  /**
   * Deploy via Symphony (proper Symphony flow)
   * @param {Object} targetJson - Target.json structure
   * @returns {Promise<Object>} - Deployment result
   */
  async deployToSymphony(targetJson) {
    try {
      logger.info(`Deploying via Symphony: ${targetJson.metadata.name}`);

      // First, authenticate with Symphony
      const authResponse = await fetch(`${this.symphonyApiUrl}/users/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: ''
        })
      });

      if (!authResponse.ok) {
        throw new Error(`Symphony authentication failed: ${authResponse.status}`);
      }

      const authResult = await authResponse.json();
      const token = authResult.accessToken;

      if (!token) {
        throw new Error('Failed to get Symphony authentication token');
      }

      // Create Symphony-compatible target
      const symphonyTarget = this.createSymphonyTarget(targetJson);

      console.log(JSON.stringify(symphonyTarget, null, 2));

      // Register target with Symphony
      const registerResponse = await fetch(`${this.symphonyApiUrl}/targets/registry/${targetJson.metadata.name}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(symphonyTarget)
      });

      if (!registerResponse.ok) {
        throw new Error(`Failed to register target with Symphony: ${registerResponse.status}`);
      }

      // Deploy via Symphony
      const deployResponse = await fetch(`${this.symphonyApiUrl}/targets/registry/${targetJson.metadata.name}/deploy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: targetJson.metadata.name,
          components: [targetJson.spec.deployment.workload.name]
        })
      });

      if (!deployResponse.ok) {
        throw new Error(`Symphony deployment failed: ${deployResponse.status}`);
      }

      const deploymentResult = {
        success: true,
        deploymentId: `symphony-${Date.now()}`,
        targetAgents: targetJson.spec.targetSelector.matchLabels["ankaios.io/agent"].split(","),
        status: "deployed",
        timestamp: new Date().toISOString(),
        message: "Deployed via Symphony",
        symphonyTarget: symphonyTarget
      };

      logger.info(`Symphony deployment successful: ${deploymentResult.deploymentId}`);
      return deploymentResult;

    } catch (error) {
      logger.error(`Error deploying via Symphony: ${error.message}`);

      // Fallback to direct Target Provider if Symphony is not available
      logger.warn('Symphony not available, falling back to direct Target Provider');
      return await this.deployDirectly(targetJson);
    }
  }

  /**
   * Create Symphony-compatible target from ACME target
   * @param {Object} targetJson - ACME target structure
   * @returns {Object} - Symphony target structure
   */
  createSymphonyTarget(targetJson) {
    const workload = targetJson.spec.deployment.workload;
    const targetAgents = targetJson.spec.targetSelector.matchLabels["ankaios.io/agent"].split(",");

    return {
      metadata: {
        name: targetJson.metadata.name
      },
      spec: {
        displayName: targetJson.metadata.name,
        components: targetAgents.map(agentName => ({
          name: workload.name,
          type: "ankaios",
          properties: {
            "ankaios.runtime": "podman",
            "ankaios.agent": agentName,
            "ankaios.restartPolicy": "ALWAYS",
            "ankaios.runtimeConfig": "image: docker.io/library/nginx\ncommandOptions: [\"-p\", \"8080:80\"]"
          }
        })),
        topologies: [
          {
            bindings: [
              {
                role: "ankaios",
                provider: "providers.target.mqtt",
                config: {
                  name: "proxy",
                  brokerAddress: "tcp://127.0.0.1:1883",
                  clientID: "symphony",
                  requestTopic: "coa-request",
                  responseTopic: "coa-response",
                  timeoutSeconds: "30"
                }
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Fallback: Deploy directly to Target Provider
   * @param {Object} targetJson - Target structure
   * @returns {Promise<Object>} - Deployment result
   */
  async deployDirectly(targetJson) {
    try {
      logger.info(`Deploying directly via Target Provider: ${targetJson.metadata.name}`);

      const targetProviderResponse = await fetch(`${this.targetProviderUrl}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: targetJson,
          action: 'deploy'
        })
      });

      if (!targetProviderResponse.ok) {
        throw new Error(`Target Provider error: ${targetProviderResponse.status}`);
      }

      const providerResult = await targetProviderResponse.json();

      return {
        success: providerResult.success,
        deploymentId: providerResult.deployment_id || `direct-${Date.now()}`,
        targetAgents: targetJson.spec.targetSelector.matchLabels["ankaios.io/agent"].split(","),
        status: providerResult.success ? "deployed" : "failed",
        timestamp: new Date().toISOString(),
        message: providerResult.message,
        results: providerResult.results,
        note: "Deployed directly (Symphony not available)"
      };

    } catch (error) {
      logger.error(`Direct deployment failed: ${error.message}`);

      return {
        success: false,
        deploymentId: `failed-${Date.now()}`,
        targetAgents: targetJson.spec.targetSelector.matchLabels["ankaios.io/agent"].split(","),
        status: "failed",
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Parse agents output from ank get agents
   * @param {string} output - Raw output from ank get agents
   * @returns {Array} - Parsed agents
   */
  parseAgentsOutput(output) {
    const lines = output.trim().split('\n');
    const agents = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          agents.push({
            name: parts[0],
            workloads: parseInt(parts[1]) || 0,
            cpuUsage: parts[2],
            freeMemory: parts[3] || 'N/A',
            status: 'running'
          });
        }
      }
    }

    return agents;
  }

  /**
   * Parse workloads output from ank get workloads
   * @param {string} output - Raw output from ank get workloads
   * @returns {Array} - Parsed workloads
   */
  parseWorkloadsOutput(output) {
    const lines = output.trim().split('\n');
    const workloads = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          workloads.push({
            name: parts[0],
            agent: parts[1],
            runtime: parts[2],
            executionState: parts[3],
            additionalInfo: parts[4] || ''
          });
        }
      }
    }

    return workloads;
  }

  /**
   * Get agent details with workloads
   * @param {string} agentName - Agent name
   * @returns {Promise<Object>} - Agent details
   */
  async getAgentDetails(agentName) {
    try {
      const [agents, workloads] = await Promise.all([
        this.getAgents(),
        this.getAgentWorkloads(agentName)
      ]);

      const agent = agents.find(a => a.name === agentName);
      if (!agent) {
        throw new Error(`Agent ${agentName} not found`);
      }

      return {
        ...agent,
        workloads: workloads,
        workloadCount: workloads.length
      };
    } catch (error) {
      logger.error(`Error getting agent details for ${agentName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if controller is healthy
   * @returns {boolean} - Health status
   */
  isHealthy() {
    return true;
  }

  /**
   * Get controller status
   * @returns {Object} - Controller status
   */
  getStatus() {
    return {
      ankaiosPath: this.ankaiosPath,
      symphonyApiUrl: this.symphonyApiUrl,
      healthy: this.isHealthy()
    };
  }
}

module.exports = AcmeController;
