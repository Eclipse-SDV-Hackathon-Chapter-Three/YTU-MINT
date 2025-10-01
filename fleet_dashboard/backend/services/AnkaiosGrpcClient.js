const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('../utils/logger');

class AnkaiosGrpcClient {
  constructor() {
    this.serverUrl = process.env.ANKAIOS_GRPC_URL || 'localhost:50051';
    this.client = null;
    this.connectedAgents = new Map();
    this.initializeClient();
  }

  initializeClient() {
    try {
      // Load the proto file
      const PROTO_PATH = path.join(__dirname, '../proto/grpc_api.proto');
      
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [path.join(__dirname, '../proto')]
      });

      const grpcApiProto = grpc.loadPackageDefinition(packageDefinition).grpc_api;
      
      // Create gRPC client
      this.client = new grpcApiProto.AgentConnection(
        this.serverUrl,
        grpc.credentials.createInsecure()
      );

      logger.info(`Ankaios gRPC client initialized, connecting to: ${this.serverUrl}`);
    } catch (error) {
      logger.error('Failed to initialize Ankaios gRPC client:', error);
      throw error;
    }
  }

  /**
   * Register a new agent with Ankaios server using streaming connection
   * @param {Object} agentConfig - Agent configuration
   * @returns {Promise<Object>} - Registration result
   */
  async registerAgent(agentConfig) {
    return new Promise((resolve, reject) => {
      const agentName = agentConfig.name || `agent-${Date.now()}`;
      const protocolVersion = agentConfig.version || '1.0.0';

      logger.info(`Registering agent via gRPC: ${agentName}`);

      // Create streaming connection
      const call = this.client.ConnectAgent();

      // Handle responses from server
      call.on('data', (response) => {
        logger.info(`Received response from Ankaios server:`, response);
        
        // Check if this is a ServerHello response
        if (response.serverHello) {
          logger.info(`Agent ${agentName} registered successfully`);
          
          // Store agent info
          this.connectedAgents.set(agentName, {
            name: agentName,
            version: protocolVersion,
            status: 'connected',
            connectedAt: new Date().toISOString(),
            call: call // Store the call for later use
          });

          resolve({
            success: true,
            agentName: agentName,
            message: 'Agent registered successfully'
          });
        }
      });

      call.on('error', (error) => {
        logger.error(`Failed to register agent ${agentName}:`, error);
        reject({
          success: false,
          error: error.message
        });
      });

      call.on('end', () => {
        logger.info(`Connection ended for agent ${agentName}`);
      });

      // Send AgentHello message
      const agentHello = {
        agentHello: {
          agentName: agentName,
          protocolVersion: protocolVersion
        }
      };

      call.write(agentHello);
    });
  }

  /**
   * Disconnect an agent from Ankaios server
   * @param {string} agentName - Agent name
   * @returns {Promise<Object>} - Disconnection result
   */
  async disconnectAgent(agentName) {
    return new Promise((resolve, reject) => {
      const agent = this.connectedAgents.get(agentName);
      if (!agent) {
        reject({
          success: false,
          error: `Agent ${agentName} not found`
        });
        return;
      }

      logger.info(`Disconnecting agent via gRPC: ${agentName}`);

      try {
        // Send Goodbye message
        const goodbye = {
          goodbye: {}
        };

        if (agent.call) {
          agent.call.write(goodbye);
          agent.call.end();
        }

        // Remove from connected agents
        this.connectedAgents.delete(agentName);

        logger.info(`Agent ${agentName} disconnected successfully`);
        resolve({
          success: true,
          message: 'Agent disconnected successfully'
        });
      } catch (error) {
        logger.error(`Failed to disconnect agent ${agentName}:`, error);
        reject({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Update agent state
   * @param {string} agentName - Agent name
   * @param {string} state - New state
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Update result
   */
  async updateAgentState(agentName, state, metadata = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        agent_name: agentName,
        state: state,
        metadata: metadata
      };

      logger.info(`Updating agent state via gRPC: ${agentName} -> ${state}`);

      this.client.UpdateState(request, (error, response) => {
        if (error) {
          logger.error(`Failed to update agent state for ${agentName}:`, error);
          reject({
            success: false,
            error: error.message
          });
        } else {
          logger.info(`Agent ${agentName} state updated to ${state}`);
          resolve({
            success: true,
            message: response.message
          });
        }
      });
    });
  }

  /**
   * Get agent state
   * @param {string} agentName - Agent name
   * @returns {Promise<Object>} - Agent state
   */
  async getAgentState(agentName) {
    return new Promise((resolve, reject) => {
      const request = {
        agent_name: agentName
      };

      this.client.GetState(request, (error, response) => {
        if (error) {
          logger.error(`Failed to get agent state for ${agentName}:`, error);
          reject({
            success: false,
            error: error.message
          });
        } else {
          resolve({
            success: true,
            state: response.state,
            metadata: response.metadata
          });
        }
      });
    });
  }

  /**
   * Get all connected agents
   * @returns {Array} - List of connected agents
   */
  getConnectedAgents() {
    return Array.from(this.connectedAgents.values());
  }

  /**
   * Check if client is healthy
   * @returns {boolean} - Health status
   */
  isHealthy() {
    return this.client !== null;
  }

  /**
   * Get client status
   * @returns {Object} - Client status
   */
  getStatus() {
    return {
      connected: this.client !== null,
      serverUrl: this.serverUrl,
      connectedAgents: this.connectedAgents.size,
      agents: this.getConnectedAgents()
    };
  }
}

module.exports = AnkaiosGrpcClient;
