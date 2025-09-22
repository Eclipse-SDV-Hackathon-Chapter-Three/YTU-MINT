# Getting Started

[Eclipse Symphony](https://projects.eclipse.org/projects/iot.symphony) brings consistent workload and device management experience to heterogeneous edge. It's an extensible management plane that allows different types of workloads and devices to be incorporated into consistent management workflows across cloud and edge.

For the hackathon, Eclipse Symphony version [0.48-proxy.40](https://github.com/eclipse-symphony/symphony/releases/tag/0.48-proxy.40) is used. To facilitate setups, we provide a Docker Compose file in the repo that you can use to launch a standalone Symphony environment, together with a MQTT broker (based on [Eclipse Mosquitto](https://mosquitto.org/)) and a Symphony read-only portal. 

## Prerequisites

- Any Linux or WSL2 on Windows
- Docker with Compose support (if you use the provided Docker Compose file)

## Installation

- Launch Symphony, a Test MQTT broker, and a read-only Symphony portal using the provided Docker Compose file in this folder.

```bash
# From the current folder
# If your docker-compose.yaml file is under a different folder, use:
# docker compose -f /path/to/your/docker-compose.yml up -d
docker compose up -d
```

## Verify Access to Services

* To check access to Symphony REST API, you can send a test request to a `/greetings` route using tools like `curl`:
    ```bash
    curl http://localhost:8082/v1alpha2/greetings
    ```
    You should see a string `Hello from Symphony K8s control plane (S8C)` in response.

* (optional) To check access to the read-only Symphony portal, open a browser and navigate to `http://localhost:3000`. Login with user `admin` without a password. You should see the Symphony portal page. During your experiments, you can browse the Targets by clicking on the `Targets` link in the left panel.

## Next Steps

* [Write a custom Symphony Target provider using Rust](./rust_provider.md)
* [Set up a Symphony Agent via Ankaios](./agent_on_ankaios.md)
* [Set up a standalone Symphony Agent](./agent_standalone.md)
