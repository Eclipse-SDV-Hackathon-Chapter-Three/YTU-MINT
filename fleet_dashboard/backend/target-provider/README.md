# Ankaios Target Provider

A Target Provider for Eclipse Symphony that deploys workloads to Ankaios agents.

## Overview

This Target Provider receives deployment requests from Symphony and applies them to Ankaios agents using the `ank` CLI.

## Architecture

```
Symphony → Target Provider → Ankaios (via ank CLI)
```

## Features

- **Deploy Workloads**: Deploy ECU workloads to specific Ankaios agents
- **Multi-Agent Support**: Deploy to multiple agents simultaneously
- **State Management**: Creates and applies Ankaios state files
- **Error Handling**: Comprehensive error reporting and rollback support

## Usage

### Start the Target Provider

```bash
# Install dependencies
npm install

# Start the provider
npm start

# Or for development
npm run dev
```

### Environment Variables

- `TARGET_PROVIDER_PORT`: Port to run on (default: 8080)
- `ANKAIOS_PATH`: Path to ank CLI (default: /usr/local/bin/ank)

### API Endpoints

#### Health Check
```bash
GET /health
```

#### Deploy Workload
```bash
POST /deploy
Content-Type: application/json

{
  "target": {
    "apiVersion": "v1",
    "kind": "Target",
    "metadata": {
      "name": "deployment-123",
      "namespace": "default"
    },
    "spec": {
      "targetType": "Ankaios",
      "targetSelector": {
        "matchLabels": {
          "ankaios.io/agent": "test_agent,car-berlin-1"
        }
      },
      "deployment": {
        "workload": {
          "name": "ecu-powertrain",
          "image": "ghcr.io/eclipse-sdv-hackathon-chapter-three/mission-update/update_trigger:latest",
          "version": "v2.1",
          "env": {
            "ECU_TYPE": "ecu-powertrain",
            "ECU_CATEGORY": "Critical"
          }
        }
      }
    }
  },
  "action": "deploy"
}
```

## How It Works

1. **Receive Request**: Target Provider receives deployment request from Symphony
2. **Parse Target**: Extracts target agents and workload configuration
3. **Create State**: Generates Ankaios state file for each agent
4. **Apply State**: Uses `ank apply` to deploy workload to agents
5. **Report Results**: Returns deployment status to Symphony

## Integration with Symphony

To integrate with Symphony, configure Symphony to use this Target Provider:

```yaml
# Symphony configuration
targetProviders:
  - name: "ankaios-provider"
    url: "http://localhost:8080"
    type: "http"
    capabilities:
      - "deploy"
      - "update"
      - "rollback"
```

## Error Handling

The Target Provider handles various error scenarios:

- **Invalid Target**: Returns 400 for malformed requests
- **Agent Not Found**: Reports which agents failed
- **Ankaios Errors**: Captures and reports `ank` CLI errors
- **Network Issues**: Handles connection problems gracefully

## Development

### Prerequisites

- Node.js 16+
- Ankaios CLI (`ank`) installed and configured
- Access to Ankaios agents

### Testing

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test deployment
curl -X POST http://localhost:8080/deploy \
  -H "Content-Type: application/json" \
  -d @test-deployment.json
```

## License

MIT License - see LICENSE file for details.
