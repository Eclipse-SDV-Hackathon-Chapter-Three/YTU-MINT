const express = require('express');
const mqtt = require('mqtt');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const yaml = require('js-yaml');

const execAsync = util.promisify(exec);

const app = express();
app.use(express.json());

const PORT = process.env.TARGET_PROVIDER_PORT || 8081;
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const ANKAIOS_PATH = process.env.ANKAIOS_PATH || '/usr/local/bin/ank';

console.log('🚀 Symphony Ankaios Target Provider starting...');
console.log(`📡 MQTT Broker: ${MQTT_BROKER}`);
console.log(`🔧 Ankaios Path: ${ANKAIOS_PATH}`);

// MQTT Client
let mqttClient = null;

// Connect to MQTT broker
async function connectMQTT() {
  try {
    mqttClient = mqtt.connect(MQTT_BROKER);
    
    mqttClient.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
      
      // Subscribe to Symphony request topics
      mqttClient.subscribe('coa-request', (err) => {
        if (err) {
          console.error('❌ Failed to subscribe to coa-request:', err);
        } else {
          console.log('📡 Subscribed to coa-request topic');
        }
      });
    });
    
    mqttClient.on('message', async (topic, message) => {
      try {
        console.log(`📨 Received message on ${topic}:`);
        console.log(`📨 Raw message: ${message.toString()}`);
        
        const requestData = JSON.parse(message.toString());
        console.log(`📨 Parsed request:`, JSON.stringify(requestData, null, 2));
        
        await handleSymphonyRequest(requestData);
      } catch (error) {
        console.error('❌ Error handling Symphony request:', error);
        console.error('❌ Raw message was:', message.toString());
      }
    });
    
    mqttClient.on('error', (err) => {
      console.error('❌ MQTT error:', err);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MQTT broker:', error);
  }
}

// Handle Symphony deployment requests
async function handleSymphonyRequest(request) {
  try {
    console.log('📦 Processing Symphony request:', JSON.stringify(request, null, 2));
    
    // Symphony can send different request formats, let's handle both
    let target, action, components;
    
    if (request.target && request.spec && request.spec.components) {
      // Direct target specification
      target = request;
      action = 'deploy';
      components = request.spec.components;
    } else if (request.target && request.components) {
      // Deployment request format
      target = { metadata: { name: request.target } };
      action = 'deploy';
      components = request.components.map(comp => ({
        name: comp,
        type: 'ankaios',
        properties: {
          'ankaios.runtime': 'podman',
          'ankaios.agent': 'test_agent',
          'ankaios.restartPolicy': 'ON_FAILURE',
          'ankaios.runtimeConfig': `image: ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest\ncommandOptions: ["--name","${comp}","--env","ECU_TYPE=${comp}","--env","ECU_VERSION=v1.0"]`
        }
      }));
    } else if (request.spec && request.spec.components) {
      // Standard target format
      target = request;
      action = 'deploy';
      components = request.spec.components;
    } else {
      throw new Error('Invalid target specification - unknown format');
    }
    
    console.log('🎯 Parsed target:', target);
    console.log('🔧 Components to deploy:', components);
    
    // Process each component
    const results = [];
    for (const component of components) {
      if (component.type === 'ankaios') {
        const result = await deployAnkaiosComponent(component, target.metadata.name);
        results.push(result);
      }
    }
    
    // Send response back to Symphony
    const response = {
      success: results.every(r => r.success),
      target: target.metadata.name,
      action: action,
      results: results,
      timestamp: new Date().toISOString()
    };
    
    if (mqttClient && mqttClient.connected) {
      mqttClient.publish('coa-response', JSON.stringify(response));
      console.log('📤 Sent response to Symphony:', response);
    }
    
  } catch (error) {
    console.error('❌ Error processing Symphony request:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    if (mqttClient && mqttClient.connected) {
      mqttClient.publish('coa-response', JSON.stringify(errorResponse));
    }
  }
}

// Deploy Ankaios component
async function deployAnkaiosComponent(component, targetName) {
  try {
    console.log(`🔧 Deploying Ankaios component: ${component.name}`);
    
    const agentName = component.properties['ankaios.agent'];
    const runtime = component.properties['ankaios.runtime'] || 'podman';
    const restartPolicy = component.properties['ankaios.restartPolicy'] || 'ON_FAILURE';
    const runtimeConfig = component.properties['ankaios.runtimeConfig'];
    
    if (!agentName) {
      throw new Error('Missing ankaios.agent property');
    }
    
    // Create Ankaios state file
    const stateFile = await createAnkaiosState(component, targetName, agentName);
    
    // Apply the state
    await applyAnkaiosState(stateFile);
    
    console.log(`✅ Successfully deployed ${component.name} to agent ${agentName}`);
    
    return {
      component: component.name,
      agent: agentName,
      success: true,
      message: `Deployed ${component.name} to ${agentName}`
    };
    
  } catch (error) {
    console.error(`❌ Failed to deploy component ${component.name}:`, error);
    return {
      component: component.name,
      success: false,
      error: error.message
    };
  }
}

// Create Ankaios state file
async function createAnkaiosState(component, targetName, agentName) {
  const workloadName = `${component.name}-${targetName}`;
  
  // Parse runtime config to extract image and command options
  const runtimeConfig = component.properties['ankaios.runtimeConfig'];
  const lines = runtimeConfig.split('\n');
  const imageLine = lines.find(line => line.trim().startsWith('image:'));
  const commandLine = lines.find(line => line.trim().startsWith('commandOptions:'));
  
  const image = imageLine ? imageLine.split('image:')[1].trim() : 'nginx:latest';
  const commandOptions = commandLine ? commandLine.split('commandOptions:')[1].trim() : '[]';
  
  // Create proper YAML content
  const yamlContent = `apiVersion: v0.1
workloads:
  ${workloadName}:
    runtime: ${component.properties['ankaios.runtime'] || 'podman'}
    agent: ${agentName}
    restartPolicy: ${component.properties['ankaios.restartPolicy'] || 'ON_FAILURE'}
    runtimeConfig: |
      image: ${image}
      commandOptions: ${commandOptions}`;
  
  // Write to temporary file
  const stateFile = `/tmp/ankaios-symphony-${workloadName}.yaml`;
  await fs.writeFile(stateFile, yamlContent);
  
  console.log(`📄 Created state file: ${stateFile}`);
  console.log(`📄 State content:\n${yamlContent}`);
  return stateFile;
}

// Apply Ankaios state
async function applyAnkaiosState(stateFile) {
  try {
    const { stdout, stderr } = await execAsync(`${ANKAIOS_PATH} apply ${stateFile}`);
    console.log(`✅ Applied Ankaios state: ${stateFile}`);
    if (stdout) console.log('Ankaios output:', stdout);
    if (stderr) console.log('Ankaios stderr:', stderr);
  } catch (error) {
    console.error(`❌ Failed to apply Ankaios state: ${error.message}`);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mqtt: mqttClient ? mqttClient.connected : false
  });
});

// Start MQTT connection
connectMQTT();

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🌐 Target Provider running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   MQTT coa-request - Symphony deployment requests`);
  console.log(`   MQTT coa-response - Symphony deployment responses`);
});

module.exports = app;
