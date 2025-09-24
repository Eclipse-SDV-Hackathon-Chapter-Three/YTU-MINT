# ECU Updates for Robotics (ROS Variant)

## Documentation Structure

This documentation has been restructured into focused guides:

- **[🚀 Quick Start with Eclipse Muto and Eclipse Symphony](./muto-quickstart.md)** - Step-by-step deployment guide with practical examples
- **[📚 Eclipse Muto Overview](./muto-overview.md)** - Comprehensive technical architecture and development reference

## Example Scenarios

We have provided two demonstrative examples that who how muto and symphony work together to manage ROS software running on a robot:

- [**Simple Talker Listener**]((samples/talker-listener/README.md)): This is one of the reference demonstrations that comes with ros. It is composed of two nodes one is the talker that publishes a message and a talker node that subscribes and prints the message. It runs forever until stopped.  This is the default demo yıu will find in [🚀 Quick Start with Eclipse Muto and Eclipse Symphony](./muto-quickstart.md). You can also review the specific muto stacks and sypmhony target/solution/instance definitions in the [samples/talker-listener](samples/talker-listener) folder

- [**AptilTag Detection**](samples/april-tag-robot/README.md): This is a slighly more interesting example. An AprilTag is a visual reference system or a visual target. AprilTags can be detected by sensors such as cameras or lasers.  It is composed of two nodes for detecting the AprilTag. You can run it with a simulator (i.e. gazebo) or with a real robot with a camera attached to it.  You can simply update the stacks, solutions, instance in [Quick Start ](./muto-quickstart.md) and to run it. You can read more about thi scenario here and check the files in  [samples/april-tag-robot](samples/april-tag-robot) folder

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

### **Orchestration**
- **Declarative Configuration**: Stack definitions with comprehensive node specifications
- **State Reconciliation**: Automatic convergence to a desired state
- **Version Control**: Stack versioning with rollback capabilities


For more details, see the [Muto documentation](https://github.com/eclipse-muto/muto).
