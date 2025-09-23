# Quick Start with Eclipse Muto and Eclipse Symphony

## Introduction

This comprehensive quick start guide demonstrates how to set up and deploy Eclipse Muto with Eclipse Symphony integration for distributed ROS orchestration. Eclipse Muto is an open-source, declarative orchestrator that manages ROS (Robot Operating System) software stacks on edge devices, while Eclipse Symphony provides cloud-native orchestration capabilities for heterogeneous edge environments.

**What You'll Accomplish:**
- Deploy a complete Muto + Symphony infrastructure stack
- Configure distributed ROS orchestration with cloud management
- Deploy and manage ROS stacks remotely via Symphony
- Monitor and troubleshoot the integrated system

**Architecture Overview:**
```
Eclipse Symphony (Cloud Orchestration)
        ↓ MQTT/API
Eclipse Muto Agent (On-Vehicle Gateway)
        ↓ ROS Topics  
Eclipse Muto Composer (Stack Orchestration)
        ↓ Launch System
ROS 2 Nodes & Applications
```

**Integration Benefits:**
- **Centralized Management**: Control entire robot fleets from Symphony cloud interface
- **Declarative Deployments**: JSON-based stack definitions with version control
- **Self-Healing**: Automatic reconciliation and failure recovery
- **Scalable Operations**: Fleet-wide updates and configuration management

> **📖 For detailed technical information** about Eclipse Muto's architecture, components, and capabilities, see the [Eclipse Muto Overview](./muto-overview.md) document.

## Prerequisites

- **ROS 2** (Humble or later) with `colcon` build tools
- **Docker** with Compose support for Symphony services
- **Eclipse Symphony Setup** [Eclipse Symphony Quick Start](https://github.com/eclipse-symphony/symphony/blob/main/docs/README.md) or even better use the docker-compose setup described  [Eclipse Symphony Quick Start](../symphony/README.md)

## Getting Started

This guide walks you through setting up and running Eclipse Muto with Eclipse Symphony integration, including configuring the complete system for distributed ROS orchestration.

### 1. Launch Symphony Infrastructure

First, start the Symphony server and MQTT broker infrastructure using the provided Docker Compose configuration:

```bash
git clone git@github.com:Eclipse-SDV-Hackathon-Chapter-Three/challenge-mission-update-possible.git
# Navigate to the Symphony directory
cd challenge-mission-update-possible/symphony

# Start Symphony API, Portal, and Mosquitto MQTT broker
docker compose up -d
```

This launches:
- **Symphony API**: `http://localhost:8082` - REST API for orchestration management
- **Symphony Portal**: `http://localhost:3000` - Web interface for monitoring
- **Mosquitto MQTT**: `localhost:1883` - Message broker for communication

**Verify Symphony is running:**
```bash
# Test Symphony API connectivity
curl http://localhost:8082/v1alpha2/greetings
# Expected response: "Hello from Symphony K8s control plane (S8C)"
```

### 2. Configure Muto System
#### Create Muto Workspace
You can setup a [muto development workspace](./muto-overview.md#development-and-contribution) or a [development container](https://github.com/eclipse-muto/muto/blob/main/docs/development-container.md)
```bash
# Working folder (or wherever your ROS workspace is with your code and muto)
cd ~/muto
```
#### Main Configuration (`config/muto.yaml`)

Create a new configuration or edit the existing one.
The central configuration file defines all system parameters:

```yaml
/**:
  ros__parameters:
    # Core ROS Topics
    stack_topic: "stack"
    twin_topic: "twin"
    agent_to_gateway_topic: "agent_to_gateway"
    gateway_to_agent_topic: "gateway_to_agent"
    
    # Digital Twin Configuration
    twin_url: "https://ditto:ditto@sandbox.composiv.ai"
    host: sandbox.composiv.ai
    port: 1883
    
    # Vehicle Identity
    namespace: org.eclipse.muto.sandbox
    name: test-robot-debug
    type: real_car
    attributes: '{"brand": "muto", "model": "composer"}'
    
    # Symphony Integration
    symphony_enabled: True
    symphony_target_name: "test-robot-debug"
    symphony_host: "192.168.0.47"  # or localhost for local setup
    symphony_port: 1883
    symphony_api_url: "http://localhost:8082/v1alpha2/"
    symphony_provider_name: "providers.target.mqtt"
    symphony_client_id: "symphony"
    symphony_request_topic: "coa-request"
    symphony_response_topic: "coa-response"
    symphony_timeout_seconds: "30"
    symphony_auto_register: False
```

#### Launch Configuration (`launch/muto.launch.py`)

The main launch file orchestrates all Muto components:

```python
def generate_launch_description():
    # Key launch arguments
    declared_arguments = [
        DeclareLaunchArgument('enable_symphony', default_value='true'),
        DeclareLaunchArgument('vehicle_namespace', default_value="org.eclipse.muto.sandbox"),
        DeclareLaunchArgument('vehicle_name', description="Vehicle ID"),
        DeclareLaunchArgument('muto_config_file', 
                            default_value=os.path.join(config_dir, "muto.yaml")),
        DeclareLaunchArgument('log_level', default_value='INFO')
    ]
    ...
```

**Key Components Launched:**
- **Agent**: `muto_agent` - Central message router and orchestration coordinator
- **MQTT Gateway**: `mqtt` - Communication bridge to cloud systems
- **Command Plugin**: `commands` - ROS command execution interface
- **Core Twin**: `twin` - Digital twin management
- **Composer**: `muto_composer` - Stack orchestration engine
- **Compose Plugin**: `compose_plugin` - Stack composition services
- **Launch Plugin**: `launch_plugin` - ROS launch system integration
- **Symphony Provider**: `symphony_provider` - Symphony integration (conditional)

### 3. Launch Muto + Symphony System

#### Start Complete Muto System

```bash
# Navigate to workspace root
cd ~/muto
rosdep update
rosdep install --from-paths src --ignore-src -r -y

# Source ROS environment
source /opt/ros/humble/setup.bash
source install/setup.bash

# Launch Muto with Symphony integration
ros2 launch launch/muto.launch.py \
    vehicle_namespace:=org.eclipse.muto.test \
    vehicle_name:=test-robot-debug \
    enable_symphony:=true \
    log_level:=INFO
```

#### Launch Arguments Explained

- **`vehicle_namespace`**: Hierarchical namespace for device organization (e.g., `org.eclipse.muto.test`)
- **`vehicle_name`**: Unique device identifier (e.g., `test-robot-debug`)
- **`enable_symphony`**: Enable/disable Symphony integration (`true`/`false`)
- **`log_level`**: Logging verbosity (`DEBUG`, `INFO`, `WARN`, `ERROR`)

### 4. Verify System Operation

#### Check Running Nodes
```bash
# List all Muto nodes
ros2 node list | grep muto

# Expected output:
# /muto/agent
# /muto/gateway  
# /muto/commands_plugin
# /muto/core_twin
# /muto/muto_composer
# /muto/compose_plugin
# /muto/native_plugin
# /muto/launch_plugin
# /muto/muto_symphony_provider  # if Symphony enabled
```

#### Monitor System Topics
```bash
# Monitor stack deployment messages
ros2 topic echo /muto/stack

# Monitor twin synchronization
ros2 topic echo /muto/twin

# Check MQTT gateway communication
ros2 topic echo /muto/gateway_to_agent
```

#### Verify Symphony Integration
```bash
# Check Symphony targets (if auto-registration enabled)
curl -H "Content-Type: application/json" \
     http://localhost:8082/v1alpha2/targets

# Monitor Symphony provider logs
ros2 node info /muto/muto_symphony_provider
```



### 6. System Monitoring & Troubleshooting

#### Log Analysis
```bash
# Check specific node logs
ros2 run rqt_console rqt_console

```

#### Health Checks
```bash
# Symphony API health
curl http://localhost:8082/v1alpha2/greetings

# MQTT broker connectivity
mosquitto_pub -h localhost -p 1883 -t "test/topic" -m "test message"

# ROS system health
ros2 doctor
```

#### Common Issues
- **Symphony connection failed**: Verify Docker containers are running and ports are accessible
- **MQTT authentication errors**: Check credentials in `muto.yaml`
- **Node startup failures**: Verify ROS dependencies and package installations
- **Stack deployment errors**: Check JSON syntax and package availability

This setup provides a complete Muto + Symphony orchestration system ready for distributed ROS management and deployment.

## Symphony Integration Deep Dive

### Provider Architecture

The Symphony integration is built around the `MutoSymphonyProvider` class (`src/agent/agent/symphony/symphony_provider.py`), which implements a sophisticated adapter pattern:

- **Dual Interface Implementation**: Extends both `BaseNode` (ROS 2) and `SymphonyProvider` interfaces
- **MQTT Bridge**: Integrates with Muto's existing MQTT infrastructure via `MQTTBroker`
- **State Management**: Comprehensive state tracking and synchronization between Symphony and ROS systems
- **Component Lifecycle**: Full management of ROS 2 component deployment, monitoring, and cleanup

### Symphony SDK Components

The SDK provides enterprise-grade Symphony integration:

#### **API Client** (`sdk/symphony_api.py`)
- **Authentication**: Secure token-based authentication with Symphony servers
- **REST Operations**: Complete CRUD operations for targets, solutions, and instances
- **Error Handling**: Robust error handling with `SymphonyAPIError` exception hierarchy
- **Request Management**: Timeout handling, retry logic, and connection pooling

#### **Data Structures** (`sdk/symphony_sdk.py`)
- **Symphony Compatibility**: Full compliance with Symphony data models:
  - `ObjectMeta`: Kubernetes-style metadata management
  - `TargetSelector`: Sophisticated device selection and binding
  - `ComponentSpec`: Detailed component specification and configuration
  - `SolutionSpec`: Complete solution definitions with versioning
- **Serialization**: JSON serialization/deserialization with type safety
- **State Management**: Comprehensive state tracking with `State` enums

#### **Summary & Results** (`sdk/symphony_summary.py`)
- **Deployment Tracking**: Detailed deployment result tracking
- **Component Results**: Per-component status and outcome reporting  
- **Target Results**: Device-level deployment summaries
- **State Synchronization**: Real-time state reporting to Symphony

#### **Type System** (`sdk/symphony_types.py`)
- **State Enums**: Comprehensive state definitions (`Succeeded`, `Failed`, `Running`, etc.)
- **Constants**: Symphony-specific constants and configuration values
- **Type Safety**: Strong typing for all Symphony interactions

### Integration Patterns

#### **COA (Component Operational Agreement) Protocol**
- **Request/Response**: Structured COA request/response handling
- **Component Management**: Fine-grained component lifecycle control
- **State Synchronization**: Bi-directional state sync between Symphony and ROS
- **Error Propagation**: Comprehensive error reporting and handling

#### **MQTT Communication**
- **Topic Management**: Sophisticated topic routing and message handling
- **Security**: Secure MQTT communication with authentication
- **Reliability**: Message persistence and delivery guarantees
- **Scalability**: Support for fleet-wide communication patterns

### Quick Start: Using Eclipse Muto with Eclipse Symphony

This guide demonstrates how to define a Symphony target (robotic device), describe a Symphony solution (software stack), and match a solution to a target by creating a Symphony instance.

#### 1. Define a Symphony Target (ROS Robotic Device)

The target represents the robotic device on which the Muto agent runs. Register the target with Symphony using the API or CLI tools. Example target registration is handled in orchestration scripts and configuration files.

Symphony API can be used with curl and scripts. But, even better use a REST tools such 
as [Postman](https://www.postman.com/) and the 
[Eclipse Symphony Postman Collection](docs/symphony-book/api/symphony-api-postman-collection.json) to work with the API.


When muto agent starts, it will automatically registers itself as a target with Symphony withh the following congiguration:

```json
{
                "metadata": {
                    "name": symphony.target
                },
                "spec": {
                    "displayName": symphony.target,
                    "forceRedeploy": True,
                    "topologies": [
                        {
                            "bindings": [
                                {
                                    "role": "muto-agent",
                                    "provider": symphony.provider_name,
                                    "config": {
                                        "name": "proxy",
                                        "brokerAddress": symphony.broker_address,
                                        "clientID": symphony.client_id,
                                        "requestTopic": f"{symphony.topic_prefix}/{symphony.request_topic}",
                                        "responseTopic": f"{symphony.topic_prefix}/{symphony.response_topic}",
                                        "timeoutSeconds": symphony.timeout_seconds
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
````


#### 2. Define a Symphony Solution (Software Stack)

The solution describes the software stack to run on the robot. For example, a simple ROS 2 talker-listener stack:

File: `talker-listener.json`
```json
{
   "name": "Muto Simple Talker-Listener Stack",
   "context": "eteration_office",
   "stackId": "org.eclipse.muto.sandbox:talker_listener",
   "node": [
      {
         "name": "talker",
         "pkg": "demo_nodes_cpp",
         "exec": "talker"
      },
      {
         "name": "listener",
         "pkg": "demo_nodes_cpp",
         "exec": "listener"
      }
   ]
}
```
To define the solution run the script 
```bash
# base64 encode the stack as a component and 
# create a solution document and then post it to API
 ./define-solution.sh  talker-listener.json

```
Script: `src/agent/config/define-instance.sh`
```bash
#!/bin/bash


# Script to create and deploy solution with base64 encoded stack data
# Usage: ./define-solution.sh <json-file>

# Check if JSON file argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <json-file>"
    echo "Example: $0 talker-listener-stack.json"
    exit 1
fi

JSON_FILE="$1"

# Check if file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "Error: File '$JSON_FILE' not found!"
    exit 1
fi

# Extract solution name from filename (remove path and .json extension)
ROOT_NAME=$(basename "$JSON_FILE" .json)
SOLUTION_NAME="${ROOT_NAME}-v-1"

export SYMPHONY_API_URL=http://192.168.0.47:8082/v1alpha2/

# Get authentication token
TOKEN=$(curl -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":""}' "${SYMPHONY_API_URL}users/auth" | jq -r '.accessToken')

# Base64 encode the contents of the JSON file
STACK_DATA_BASE64=$(base64 -w 0 "$JSON_FILE")

# Create the solution JSON in a variable
SOLUTION_DATA=$(cat << EOF
{
    "metadata": {
        "namespace": "default",
        "name": "$SOLUTION_NAME"
    },
    "spec": {
        "displayName": "$SOLUTION_NAME",
        "rootResource": "$ROOT_NAME",
        "version": "1",
        "components": [
            {
                "name": "$SOLUTION_NAME",
                "type": "muto-agent",
                "properties": {
                    "type": "stack", 
                    "content-type": "application/json", 
                    "data": "$STACK_DATA_BASE64",
                    "foo": "bar",
                    "number": 123
                }
            }
        ]
    }
}
EOF
)

echo "Created solution JSON with base64 encoded stack data"
echo "Base64 encoded data length: ${#STACK_DATA_BASE64} characters"

# Show current solutions
# echo "Current solutions:"
# curl -s -X GET -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" "${SYMPHONY_API_URL}solutions" | jq .

echo "Posting $SOLUTION_NAME solution to Symphony..."

# Try to delete existing solution first (ignore errors if it doesn't exist)
# curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "${SYMPHONY_API_URL}solutions/$SOLUTION_NAME" > /dev/null 2>&1

# Post the new solution
curl -s -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$SOLUTION_DATA" "${SYMPHONY_API_URL}solutions/$SOLUTION_NAME"

```

#### 3. Match Solution with Target: Create a Symphony Instance

To deploy the solution to the target, create a Symphony instance that binds the solution to the device. This is typically done using the `define-instance.sh` script and an instance configuration file.


File: `src/agent/config/instance.json`
```json
{
      "metadata": {
            "name": "test-robot-debug-instance",
            "labels": {
                  "muto": "demo"
            }
      },
      "spec": {
            "solution": "talker-listener:1",
            "target": {
                  "name": "test-robot-debug"
            }
      }
}
```

Script: `src/agent/config/define-instance.sh`
```bash
#!/bin/bash

export SYMPHONY_API_URL=http://192.168.0.47:8082/v1alpha2/

TOKEN=$(curl -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":""}' "${SYMPHONY_API_URL}users/auth" | jq -r '.accessToken')

# Register and list instances
curl -v -s -X GET  -H "Content-Type: application/json"  -H "Authorization: Bearer $TOKEN"  "${SYMPHONY_API_URL}instances"

# Read instance.json and create Symphony instance
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOLUTION_DATA=$(cat "$SCRIPT_DIR/instance.json")

curl -v -s -X POST  -H "Content-Type: application/json"  -H "Authorization: Bearer $TOKEN" -d "$SOLUTION_DATA" "${SYMPHONY_API_URL}instances/test-robot-debug-instance"
```

This process:
- Registers the robotic device (target) with Symphony
- Defines the software stack (solution) to run
- Creates an instance binding the solution to the target, enabling Muto and Symphony to orchestrate the deployment and lifecycle of ROS components

For more details, see the SDK and provider documentation in `src/agent/agent/symphony/README.md`.

---

> **📚 Next Steps**: For comprehensive technical details about Eclipse Muto's architecture, advanced features, and development guide, see the [Eclipse Muto Overview](./muto-overview.md) document.