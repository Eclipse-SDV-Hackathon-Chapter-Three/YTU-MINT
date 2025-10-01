# Symphony Ankaios Target Provider

This is a Symphony-compatible Target Provider that handles deployments to Ankaios agents via MQTT communication with Symphony.

## Architecture

```
Symphony → MQTT → Target Provider → Ankaios (via ank CLI)
```

## Prerequisites

1. **Symphony** running on `localhost:8082`
2. **MQTT Broker** (Mosquitto) running on `localhost:1883`
3. **Ankaios** with `ank` CLI available
4. **Node.js** and npm

## Setup

1. **Install dependencies:**
   ```bash
   cd fleet_dashboard/backend/symphony-target-provider
   npm install
   ```

2. **Start the Target Provider:**
   ```bash
   npm start
   ```

3. **Register the target with Symphony:**
   ```bash
   ./register-target.sh
   ```

## How it works

1. **Symphony** sends deployment requests via MQTT to topic `coa-request`
2. **Target Provider** receives the request and processes Ankaios components
3. **Target Provider** creates Ankaios state files and applies them via `ank apply`
4. **Target Provider** sends response back to Symphony via MQTT topic `coa-response`

## MQTT Topics

- **`coa-request`**: Symphony sends deployment requests here
- **`coa-response`**: Target Provider sends responses back here

## Environment Variables

- `TARGET_PROVIDER_PORT`: Port for HTTP health check (default: 8081)
- `MQTT_BROKER`: MQTT broker URL (default: mqtt://localhost:1883)
- `ANKAIOS_PATH`: Path to `ank` CLI (default: /usr/local/bin/ank)

## Testing

1. **Health check:**
   ```bash
   curl http://localhost:8081/health
   ```

2. **Deploy via Symphony:**
   ```bash
   # First authenticate
   TOKEN=$(curl -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":""}' "http://localhost:8082/v1alpha2/users/auth" | jq -r '.accessToken')
   
   # Deploy
   curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     --data '{"target":"ankaios-fleet-target","components":["ecu-powertrain"]}' \
     "http://localhost:8082/v1alpha2/targets/registry/ankaios-fleet-target/deploy"
   ```

## Symphony Target Structure

The target provider expects Symphony targets with this structure:

```json
{
  "metadata": {
    "name": "ankaios-fleet-target"
  },
  "spec": {
    "forceRedeploy": true,
    "components": [
      {
        "name": "ecu-powertrain",
        "type": "ankaios",
        "properties": {
          "ankaios.runtime": "podman",
          "ankaios.agent": "test_agent",
          "ankaios.restartPolicy": "ON_FAILURE",
          "ankaios.runtimeConfig": "image: nginx:latest\ncommandOptions: [\"-p\", \"8080:80\"]"
        }
      }
    ],
    "topologies": [
      {
        "bindings": [
          {
            "role": "ankaios",
            "provider": "providers.target.mqtt",
            "config": {
              "name": "ankaios-target-provider",
              "brokerAddress": "tcp://127.0.0.1:1883",
              "clientID": "symphony-ankaios",
              "requestTopic": "coa-request",
              "responseTopic": "coa-response",
              "timeoutSeconds": "30"
            }
          }
        ]
      }
    ]
  }
}
```

## Logs

The Target Provider logs all MQTT messages and Ankaios operations. Check the console output for deployment status and any errors.
