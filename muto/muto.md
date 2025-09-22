# Eclipse Muto

## Documentation Structure

This documentation has been restructured into focused guides:

- **[🚀 Quick Start with Eclipse Muto and Eclipse Symphony](./muto-quickstart.md)** - Step-by-step deployment guide with practical examples
- **[📚 Eclipse Muto Overview](./muto-overview.md)** - Comprehensive technical architecture and development reference

## Introduction

**Eclipse Muto** is an open-source, declarative orchestrator for managing ROS (Robot Operating System) software stacks on edge devices. It ensures that the state of the software running on a robot matches the prescribed model, enabling robust, self-healing, and flexible deployments for fleets of robots and vehicles. Eclipse Muto provides a modular architecture built around two core components that work together to deliver robust model-based orchestration for ROS-based systems:

```
Cloud Backend (any orchestrator)
        |
     [Agent]  <---  On-vehicle Plugins: Protocol (MQTT, HTTP, Zenoh, uProtocol), Digital Twin (Ditto), Orchestration (Symphony)
        |
     [Composer] <--- On-vehicle, manages ROS stack lifecycle
        |
   ROS Nodes / Software Stack
```

- **Agent**: Secure gateway, protocol-agnostic, delivers the model.
- **Composer**: Enforces the model, manages pipelines, builds, and launches.

### **Orchestration Capabilities**
- **Declarative Configuration**: Stack definitions with comprehensive node specifications
- **State Reconciliation**: Automatic convergence to a desired state
- **Version Control**: Stack versioning with rollback capabilities


### Core Components

#### **Agent** (`src/agent/`)
The Agent serves as an on-vehicle intelligent communication bridge and orchestration coordinator:

- **Core Implementation**: `MutoAgent` acts as a centralized message router with modular message handlers
- **Configuration Management**: ROS2 based configuration system for MQTT, Symphony, and digital twin configurations
- **Message Handling**: Agent has specialized handlers for different message types:
  - `GatewayMessageHandler`: Processes messages from cloud gateways
  - `ComposerMessageHandler`: Manages communication with on-vehicle composers  
  - `CommandMessageHandler`: Handles command execution and routing
- **Protocol Support**: Currently, muto has builtin support for Extensible MQTT iand HTTP nfrastructure with secure authentication


#### **Composer** (`src/composer/`)
The Composer is an on-vehicle reconciliation and orchestration engine:

- **Core Engine**: `MutoComposer` class manages the complete ROS stack lifecycle
- **Workflow Management**: Advanced pipeline system (`workflow/pipeline.py`) with:
  - Step-by-step execution with context preservation
  - Compensation mechanisms for failure recovery
  - Plugin-based extensibility for custom operations
  - Safe evaluation engine for secure script execution
- **Stack Management**: Comprehensive `Stack` class (`model/stack.py`) handles:
  - ROS node lifecycle (start/stop/load operations)
  - Launch description generation and management
  - Dependency resolution and build orchestration
  - Introspection capabilities for system analysis
- **Model Reconciliation**: Continuous monitoring and convergence to desired state



## Extensibility

Muto is designed to be extensible with plugins in three areas:

1. **Protocol**: Supports multiple transport protocols such as HTTP, MQTT, and in the future Zenoh and uProtocol.
2. **Digital Twin**: Integrates with digital twin technologies like Eclipse Ditto to represent and synchronize the state of physical devices.
3. **Distributed Cloud Orchestration Engine**: Connects to cloud orchestrators such as Eclipse Symphony for scalable, policy-driven management of fleets and updates.


#### **Muto Stacks - Declarative Models**

Muto's core innovation lies in its **declarative model definition** of ROS 2 systems through serializable stack representations. A **Muto Stack** is a comprehensive, remotely-manageable model that preserves complete ROS 2 logic while enabling distributed orchestration.

**Stack as Serializable ROS 2 Launch Model**

Muto stacks are built on the foundation of [ROS 2 Launch System](https://docs.ros.org/en/kilted/Tutorials/Intermediate/Launch/Launch-Main.html) but extend it with two key features:

**Remote Management Capabilities**: Unlike traditional ROS 2 launch files that must be executed locally on the robot, Muto stacks can be defined, modified, and deployed remotely from cloud orchestration systems. This enables fleet-wide updates, centralized configuration management, and remote troubleshooting without physical access to devices.

**Declarative Serialization**: While ROS 2 launch files are typically Python scripts with imperative logic, Muto transforms them into declarative JSON/binary formats that can be transmitted over networks, stored in databases, version-controlled, and processed by different systems. This serialization preserves the complete launch logic while making it transportable and manageable at scale.

**Stack Representation Formats**

Muto supports multiple stack representation formats to accommodate different system complexities and deployment scenarios:

1. **JSON Format** (Declarative Schema): For simpler systems, stacks can be defined as human-readable JSON documents. The schema closely mirrors the ROS 2 Launch model but uses declarative syntax instead of imperative Python code. This format is ideal for:
   - Simple node configurations
   - Parameter-based deployments  
   - Human-readable stack definitions
   - Version control and configuration management

2. **Binary Archive Format** (Complete Workspace): For complex systems, stacks can be packaged as compressed binary archives containing complete launch workspaces with multiple layered scripts, configuration files, dependencies, and resources. This format supports:
   - Complex multi-file launch configurations
   - Custom launch scripts and logic
   - Asset bundling (configuration files, models, etc.)
   - Complete workspace portability

A simple JSON format example demonstrating the declarative schema:

```json
{
  "name": "Muto Simple Talker-Listener Stack",
  "context": "production_environment",
  "stackId": "org.eclipse.muto.sandbox:talker_listener:v1.0",
  "param": [
    {"name": "use_sim_time", "value": false},
    {"name": "log_level", "value": "info"}
  ],
  "arg": [
    {"name": "namespace", "value": "/robot1"}
  ],
  "node": [
    {
      "name": "talker",
      "pkg": "demo_nodes_cpp",
      "exec": "talker",
      "namespace": "/demo",
      "output": "screen",
      "param": [{"name": "topic", "value": "chatter"}],
      "remap": [{"from": "chatter", "to": "custom_topic"}],
      "lifecycle": true,
      "action": "start"
    },
    {
      "name": "listener", 
      "pkg": "demo_nodes_cpp",
      "exec": "listener",
      "namespace": "/demo",
      "output": "screen"
    }
  ],
  "composable": [
    {
      "name": "vision_container",
      "package": "rclcpp_components",
      "executable": "component_container",
      "namespace": "/perception",
      "node": [
        {
          "name": "camera_driver",
          "pkg": "camera_package", 
          "plugin": "camera::CameraDriver"
        }
      ]
    }
  ]
}
```

**Stacks Support**

- **Stack** implementing:
  - **Manifest Processing**: Conversion between JSON and internal ROS2 representations
  - **Node Lifecycle Management**: Complete ROS 2 node start/stop/load operations  
  - **Composable Node Support**: Advanced composable container management
  - **Parameter Resolution**: Dynamic parameter and argument resolution with expressions
  - **State Comparison**: Intelligent diffing between current and desired states
  - **Launch Generation**: Automatic ROS 2 launch description creation

- **Node Management** Individual ROS 2 node representation with:
  - **Lifecycle Support**: Full lifecycle node management capabilities
  - **Parameter Handling**: Dynamic parameter setting and runtime updates
  - **Remapping**: Topic and service remapping configuration
  - **Namespace Management**: Hierarchical namespace organization

- **Composable Containers**  Efficient composable node management:
  - **Container Lifecycle**: Complete container start/stop operations
  - **Node Composition**: Dynamic loading/unloading of composable nodes
  - **Resource Optimization**: Shared memory and process optimization

**Other Capabilities**

- **Expression Resolution**: Dynamic resolution of `$(find)`, `$(env)`, `$(arg)` expressions
- **State Reconciliation**: Intelligent comparison and merging of stack states
- **Runtime Parameter Updates**: Live parameter changes without node restart
- **Failure Recovery**: Automatic rollback and compensation mechanisms

### **Pipeline System**
- **Workflow Engine**: Multi-step pipeline execution with context preservation
- **Compensation Logic**: Automated failure recovery with compensation steps
- **Plugin Architecture**: Extensible plugin system for custom operations
- **Safe Execution**: Secure script evaluation with sandboxing

### **Communication Infrastructure**
- **Multi-Protocol Support**: MQTT, HTTP, and future Zenoh/uProtocol support
- **Message Routing**: Intelligent message routing with topic parsing
- **Security**: Comprehensive authentication and secure communication
- **Scalability**: Fleet-wide communication patterns with load balancing

### **Digital Twin**
- **Eclipse Ditto Integration**: Full digital twin representation and synchronization
- **Telemetry**: Live system state reporting and monitoring
- **Device Management**: Registration, configuration, and status tracking
- **Synchronization**: Bi-directional state sync with cloud platforms

### **Native ROS2 Native Integration**
- **Launch System**: Advanced ROS 2 launch description generation and management  
- **Node Lifecycle**: Complete control over ROS node start/stop/load operations
- **Service Integration**: Native ROS2 service calls and message handling
- **Introspection**: Deep system introspection and analysis capabilities


## Technical Architecture

### Message System (`src/messages/`)

Muto employs a sophisticated ROS 2 message system for inter-component communication:

#### **Core Messages**
- **`MutoAction.msg`**: Central action message supporting multiple stack formats (JSON, URL-based, launch descriptions)
- **`StackManifest.msg`**: Complete stack definition with context, nodes, and configuration
- **`Gateway.msg`**: Gateway communication protocol messages
- **`Thing.msg` & `ThingHeaders.msg`**: Digital twin representation and metadata

#### **Service Definitions**
- **`CoreTwin.srv`**: Digital twin service interface
- **`CommandPlugin.srv`**: Command execution service
- **`ComposePlugin.srv`**: Composition service for stack management
- **`LaunchPlugin.srv`** & **`NativePlugin.srv`**: Plugin execution services

### Source Structure

#### **Agent Module** (`src/agent/`)
```
agent/
├── muto_agent.py          # Central message router and coordinator
├── config.py              # Configuration management system  
├── message_handlers.py    # Modular message processing
├── mqtt_manager.py        # MQTT communication infrastructure
├── command_executor.py    # Command execution engine
├── topic_parser.py        # Topic parsing and routing
├── interfaces.py          # Core interfaces and base classes
├── ros/                   # ROS-specific utilities
└── symphony/              # Symphony integration
    ├── symphony_provider.py    # Main Symphony provider
    ├── symphony_broker.py     # MQTT broker integration  
    └── sdk/                   # Symphony SDK
        ├── symphony_api.py         # REST API client
        ├── symphony_sdk.py         # Data structures
        ├── symphony_summary.py     # Results tracking
        └── symphony_types.py       # Type definitions
```

#### **Composer Module** (`src/composer/`)
```
composer/
├── muto_composer.py       # Main orchestration engine
├── model/
│   └── stack.py          # Stack management and lifecycle
├── workflow/
│   ├── pipeline.py       # Pipeline execution engine
│   ├── router.py         # Message routing
│   ├── launcher.py       # Launch system integration
│   ├── safe_evaluator.py # Secure script execution
│   └── schemas/          # Validation schemas
├── introspection/        # System introspection tools
└── plugins/              # Extensible plugin system
```

#### **Core Services** (`src/core/`)
```
core/
├── twin.py               # Digital twin implementation
└── twin_services.py      # Twin service integration
```

### Communication Patterns

#### **Message Flow Architecture**
1. **Cloud → Agent**: Cloud messages arrive via MQTT
2. **Agent → Composer**: Processed and routed via ROS Topics
3. **Composer → Stack**: Pipeline execution and ROS node management
4. **Twin ← → Cloud**: Digital twin synchronization (MQTT)

#### **State Management**
- **Declarative Models**: Stack definitions
- **Reconciliation Loops**: Continuous state convergence
- **Event-Driven Updates**: Real-time change propagation  
- **Rollback Mechanisms**: Automated failure recovery

## Getting Started

This guide walks you through setting up and running Eclipse Muto with Eclipse Symphony integration, including configuring the complete system for distributed ROS orchestration.

### Prerequisites

- **ROS 2** (Humble or later) with `colcon` build tools
- **Docker** with Compose support for Symphony services
- **Python 3.8+** with required dependencies
- **MQTT Broker** (provided via Docker Compose)

### 1. Launch Symphony Infrastructure

First, start the Symphony server and MQTT broker infrastructure using the provided Docker Compose configuration:

```bash
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

#### Main Configuration (`config/muto.yaml`)

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
cd /home/ws

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

### 5. Deploy Your First Stack

#### Create Stack Definition
```json
{
  "name": "Test ROS Stack",
  "context": "development",
  "stackId": "org.eclipse.muto.test:hello_world:v1.0",
  "node": [
    {
      "name": "talker",
      "pkg": "demo_nodes_cpp", 
      "exec": "talker",
      "namespace": "/demo"
    },
    {
      "name": "listener",
      "pkg": "demo_nodes_cpp",
      "exec": "listener", 
      "namespace": "/demo"
    }
  ]
}
```

#### Deploy via Symphony (if integrated)
```bash
# Register target and deploy solution using Symphony API
# See Symphony integration section for detailed examples
```

#### Deploy via ROS Topic (direct)
```bash
# Publish stack directly to Muto composer
ros2 topic pub /muto/stack muto_msgs/MutoAction "{
  method: 'apply',
  payload: '{\"name\":\"Test Stack\", \"node\":[{\"name\":\"talker\",\"pkg\":\"demo_nodes_cpp\",\"exec\":\"talker\"}]}'
}"
```

### 6. System Monitoring & Troubleshooting

#### Log Analysis
```bash
# Check specific node logs
ros2 run rqt_console rqt_console

# Monitor system-wide logs
journalctl -f | grep muto
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

## Eclipse Symphony Provider for Muto

Eclipse Muto integrates seamlessly with Eclipse Symphony through a comprehensive provider implementation that bridges Muto's ROS-native orchestration with Symphony's distributed cloud management capabilities.

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
- **Scalability**: Support for fleet-wide communication patterns## Quick Start: Using Eclipse Muto with Eclipse Symphony

This guide demonstrates how to define a Symphony target (robotic device), describe a Symphony solution (software stack), and match a solution to a target by creating a Symphony instance.

### 1. Define a Symphony Target (ROS Robotic Device)

The target represents the robotic device on which the Muto agent runs. Register the target with Symphony using the API or CLI tools. Example target registration is handled in orchestration scripts and configuration files.

### 2. Define a Symphony Solution (Software Stack)

The solution describes the software stack to run on the robot. For example, a simple ROS 2 talker-listener stack:

File: `src/agent/config/talker-listener.json`
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

### 3. Match Solution with Target: Create a Symphony Instance

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

---

## Quick Reference

For detailed information, please refer to:

- **[🚀 Quick Start Guide](./muto-quickstart.md)** - Get up and running quickly with Symphony + Muto
- **[📚 Technical Overview](./muto-overview.md)** - Deep dive into architecture and development

This process:
- Registers the robotic device (target) with Symphony
- Defines the software stack (solution) to run
- Creates an instance binding the solution to the target, enabling Muto and Symphony to orchestrate the deployment and lifecycle of ROS components

For more details, see the SDK and provider documentation in `src/agent/agent/symphony/README.md`.
