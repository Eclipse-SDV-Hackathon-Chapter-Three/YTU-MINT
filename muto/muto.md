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


For more details, see the [Muto documentation](https://github.com/eclipse-muto/muto).
