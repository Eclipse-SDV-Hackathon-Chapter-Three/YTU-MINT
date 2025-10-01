const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const execAsync = util.promisify(exec);

const app = express();
app.use(express.json());

const PORT = process.env.TARGET_PROVIDER_PORT || 8080;
const ANKAIOS_PATH = process.env.ANKAIOS_PATH || '/usr/local/bin/ank';

console.log('🚀 Ankaios Target Provider starting...');
console.log('📡 Ready to receive deployment requests from Symphony');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Deployment endpoint
app.post('/deploy', async (req, res) => {
  try {
    console.log('📦 Received deployment request:', JSON.stringify(req.body, null, 2));
    
    const { target, action = 'deploy' } = req.body;
    
    console.log('Target:', JSON.stringify(target, null, 2));
    console.log('Target spec:', JSON.stringify(target.spec, null, 2));
    console.log('Target selector:', JSON.stringify(target.spec?.targetSelector, null, 2));
    
    if (!target || !target.spec || !target.spec.targetSelector) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target specification - missing targetSelector',
        debug: {
          hasTarget: !!target,
          hasSpec: !!target?.spec,
          hasTargetSelector: !!target?.spec?.targetSelector
        }
      });
    }
    
    const targetAgents = target.spec.targetSelector.matchLabels['ankaios.io/agent']
      ?.split(',')
      .map(agent => agent.trim()) || [];
    
    console.log('🎯 Target agents:', targetAgents);
    
    if (targetAgents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No target agents specified'
      });
    }
    
    // Deploy to each agent
    const results = [];
    for (const agentName of targetAgents) {
      try {
        const stateFile = await createAnkaiosState(target, agentName);
        await applyAnkaiosState(stateFile);
        results.push({ agent: agentName, success: true });
        console.log(`✅ Deployed to agent: ${agentName}`);
      } catch (error) {
        console.error(`❌ Failed to deploy to agent ${agentName}:`, error.message);
        results.push({ agent: agentName, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const deploymentId = `deployment-${Date.now()}`;
    
    res.json({
      success: successCount > 0,
      message: `Deployed to ${successCount}/${targetAgents.length} agents`,
      deployment_id: deploymentId,
      target_agents: targetAgents,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

async function createAnkaiosState(target, agentName) {
  const workload = target.spec.deployment.workload;
  const workloadName = `${workload.name}-${agentName}`;
  
  // Create proper YAML content manually to avoid syntax issues
  const yamlContent = `apiVersion: v0.1
workloads:
  ${workloadName}:
    runtime: podman
    agent: ${agentName}
    restartPolicy: ON_FAILURE
    runtimeConfig: |
      image: ${workload.image}
      commandOptions: ["--name","${workloadName}","--env","ECU_TYPE=${workload.name}","--env","ECU_VERSION=${workload.version}","--env","AGENT_NAME=${agentName}"]`;
  
  // Write to temporary file
  const stateFile = `/tmp/ankaios-state-${workload.name}-${agentName}.yaml`;
  await fs.writeFile(stateFile, yamlContent);
  
  console.log(`📄 Created state file: ${stateFile}`);
  console.log(`📄 State content:\n${yamlContent}`);
  return stateFile;
}

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

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Target Provider running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /deploy - Deploy workload to agents`);
});

module.exports = app;
