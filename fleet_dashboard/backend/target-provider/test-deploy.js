const fetch = require('node-fetch');

async function testDeploy() {
  const deploymentRequest = {
    target: {
      apiVersion: "v1",
      kind: "Target",
      metadata: {
        name: "test-deployment",
        namespace: "default"
      },
      spec: {
        targetType: "Ankaios",
        targetSelector: {
          matchLabels: {
            "ankaios.io/agent": "test_agent"
          }
        },
        deployment: {
          workload: {
            name: "ecu-powertrain",
            image: "ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest",
            version: "v2.1",
            env: {
              ECU_TYPE: "ecu-powertrain",
              ECU_CATEGORY: "Critical"
            }
          }
        }
      }
    },
    action: "deploy"
  };

  try {
    console.log('Testing deployment...');
    const response = await fetch('http://localhost:8080/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentRequest)
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDeploy();
