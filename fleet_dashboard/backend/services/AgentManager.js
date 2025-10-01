const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class AgentManager {
  constructor() {
    this.agents = new Map();
    this.cities = ['Munich', 'Berlin', 'Hamburg', 'Cologne', 'Frankfurt'];
    this.ecuTypes = ['ecu-powertrain', 'ecu-infotainment', 'ecu-safety', 'ecu-chassis', 'ecu-body'];
    this.versions = ['v1.0', 'v1.1', 'v1.2', 'v2.0', 'v2.1'];
    this.states = ['parked', 'driving'];
    this.statuses = ['running', 'updating', 'failed', 'stopped'];
  }

  createAgent(agentData) {
    const id = agentData.id || `car${this.agents.size + 1}-${agentData.city?.toLowerCase() || 'munich'}`;
    const city = agentData.city || this.getRandomCity();
    const state = agentData.state || 'parked';
    const workloads = agentData.workloads || this.generateDefaultWorkloads();
    
    const agent = {
      id,
      city,
      state,
      status: 'running',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      workloads,
      metadata: {
        agentName: id, // Use the agent ID as the Ankaios agent name
        containerImage: 'ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest'
      },
      logs: [],
      updateHistory: []
    };

    this.agents.set(id, agent);
    logger.info(`Created agent ${id} in city ${city} with ${workloads.length} ECUs`);
    return agent;
  }

  generateDefaultWorkloads() {
    // Generate 2-4 random ECUs for each agent
    const numECUs = Math.floor(Math.random() * 3) + 2; // 2-4 ECUs
    const selectedECUs = this.ecuTypes
      .sort(() => 0.5 - Math.random())
      .slice(0, numECUs);
    
    return selectedECUs.map(ecu => ({
      name: ecu,
      version: this.getRandomVersion(),
      status: 'running'
    }));
  }

  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  updateAgentState(agentId, newState) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!this.states.includes(newState)) {
      throw new Error(`Invalid state: ${newState}. Must be one of: ${this.states.join(', ')}`);
    }

    agent.state = newState;
    agent.lastUpdated = new Date().toISOString();
    
    this.addLog(agentId, `State changed to ${newState}`);
    logger.info(`Agent ${agentId} state changed to ${newState}`);
    return agent;
  }

  updateAgentStatus(agentId, status) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!this.statuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${this.statuses.join(', ')}`);
    }

    agent.status = status;
    agent.lastUpdated = new Date().toISOString();
    
    this.addLog(agentId, `Status changed to ${status}`);
    logger.info(`Agent ${agentId} status changed to ${status}`);
    return agent;
  }

  updateWorkloadVersion(agentId, workloadName, newVersion) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const workload = agent.workloads.find(w => w.name === workloadName);
    if (!workload) {
      throw new Error(`Workload ${workloadName} not found on agent ${agentId}`);
    }

    const oldVersion = workload.version;
    workload.version = newVersion;
    workload.lastUpdated = new Date().toISOString();
    agent.lastUpdated = new Date().toISOString();
    
    // Add to update history
    agent.updateHistory.push({
      workload: workloadName,
      from: oldVersion,
      to: newVersion,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
    
    this.addLog(agentId, `ECU ${workloadName} updated from ${oldVersion} to ${newVersion}`);
    logger.info(`Agent ${agentId} ECU ${workloadName} updated from ${oldVersion} to ${newVersion}`);
    return agent;
  }

  addWorkload(agentId, workloadData) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const workload = {
      name: workloadData.name,
      version: workloadData.version || this.getRandomVersion(),
      status: 'running',
      addedAt: new Date().toISOString()
    };

    agent.workloads.push(workload);
    agent.lastUpdated = new Date().toISOString();
    
    this.addLog(agentId, `Added ECU ${workload.name} version ${workload.version}`);
    logger.info(`Added ECU ${workload.name} to agent ${agentId}`);
    return agent;
  }

  removeWorkload(agentId, workloadName) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const workloadIndex = agent.workloads.findIndex(w => w.name === workloadName);
    if (workloadIndex === -1) {
      throw new Error(`Workload ${workloadName} not found on agent ${agentId}`);
    }

    agent.workloads.splice(workloadIndex, 1);
    agent.lastUpdated = new Date().toISOString();
    
    this.addLog(agentId, `Removed ECU ${workloadName}`);
    logger.info(`Removed ECU ${workloadName} from agent ${agentId}`);
    return agent;
  }

  addLog(agentId, message, level = 'info') {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    agent.logs.push(logEntry);
    
    // Keep only last 100 logs
    if (agent.logs.length > 100) {
      agent.logs = agent.logs.slice(-100);
    }
  }

  getAgentsByCity(city) {
    return this.getAllAgents().filter(agent => agent.city === city);
  }

  getAgentsByState(state) {
    return this.getAllAgents().filter(agent => agent.state === state);
  }

  getAgentsByStatus(status) {
    return this.getAllAgents().filter(agent => agent.status === status);
  }

  deleteAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.agents.delete(agentId);
    logger.info(`Deleted agent ${agentId}`);
    return true;
  }

  getRandomCity() {
    return this.cities[Math.floor(Math.random() * this.cities.length)];
  }

  getRandomVersion() {
    return this.versions[Math.floor(Math.random() * this.versions.length)];
  }

  isHealthy() {
    return true;
  }

  async cleanup() {
    logger.info('Cleaning up AgentManager');
    this.agents.clear();
  }

  // Statistics
  getStats() {
    const agents = this.getAllAgents();
    const totalECUs = agents.reduce((sum, agent) => sum + agent.workloads.length, 0);
    
    return {
      totalAgents: agents.length,
      totalECUs,
      byCity: this.cities.reduce((acc, city) => {
        acc[city] = agents.filter(agent => agent.city === city).length;
        return acc;
      }, {}),
      byState: this.states.reduce((acc, state) => {
        acc[state] = agents.filter(agent => agent.state === state).length;
        return acc;
      }, {}),
      byStatus: this.statuses.reduce((acc, status) => {
        acc[status] = agents.filter(agent => agent.status === status).length;
        return acc;
      }, {}),
      ecuDistribution: agents.reduce((acc, agent) => {
        agent.workloads.forEach(workload => {
          acc[workload.name] = (acc[workload.name] || 0) + 1;
        });
        return acc;
      }, {}),
      versionDistribution: agents.reduce((acc, agent) => {
        agent.workloads.forEach(workload => {
          acc[workload.version] = (acc[workload.version] || 0) + 1;
        });
        return acc;
      }, {})
    };
  }

  // Export data in the format you suggested
  exportData() {
    return {
      agents: this.getAllAgents().map(agent => ({
        id: agent.id,
        city: agent.city,
        state: agent.state,
        status: agent.status,
        workloads: agent.workloads.map(workload => ({
          name: workload.name,
          version: workload.version,
          status: workload.status
        }))
      }))
    };
  }
}

module.exports = AgentManager;
