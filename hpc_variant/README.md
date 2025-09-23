# OTA Updates for ECUs (HPC Variant)

In this variant, you will develop an end-to-end Over-The-Air (OTA) update workflow using [Eclipse Symphony](https://projects.eclipse.org/projects/iot.symphony) as a cloud-based meta orchestrator and [Eclipse Ankaios](https://github.com/eclipse-ankaios/ankaios/tree/v0.6.0) as the in-vehicle embedded software orchestrator for managing SDV workloads.

At the end, Eclipse Symphony should push updates from the cloud to the Symphony Target Rust Provider workload, managed by Eclipse Ankaios inside the vehicle. To achieve this, you must implement a Rust provider and extend the existing Symphony Target Provider workload.

For quick onboarding, both the cloud (simulated locally on your machine) and the in-vehicle parts are preconfigured.

The cloud component is launched through a Docker Compose file that includes the Eclipse Symphony management plane, an MQTT broker (based on [Eclipse Mosquitto](https://mosquitto.org/)) for delivering updates to the vehicle, and a read-only Symphony portal.  

The in-vehicle component is managed via Eclipse Ankaios and comes with a predefined [Ankaios manifest](https://eclipse-ankaios.github.io/ankaios/0.6/reference/startup-configuration/) called [state.yaml](./samples/ankaios_provider/state.yaml), which launches the following workloads:

- `virtual_ecu`: a demo virtual ECU logging output to the console, representing a target that can be updated.
- `update_trigger`: a web-based workload accessible at `http://localhost:5500` with a button to instruct Eclipse Ankaios to start the `symphony` in-vehicle workload.
- `symphony`: the Symphony Target Provider workload that receives updates over MQTT from the Symphony management plane in the cloud.
- `Ankaios_Dashboard`: The [Ankaios Dashboard](https://github.com/eclipse-ankaios-dashboard/ankaios-dashboard/tree/v0.6.0) visualizing an Ankaios cluster in a WebUI.

The `update_trigger` workload uses the Ankaios SDK [ank-sdk-python](https://github.com/eclipse-ankaios/ank-sdk-python/tree/v0.6.0) to dynamically start the `symphony` in-vehicle workload. In real-world scenarios, ECU updates are typically triggered only under certain conditions (e.g., when the vehicle is parked at home). You can use Eclipse Ankaios’ dynamic features to start workloads programmatically. The workload runs a FastAPI backend that provides a simple `Update` button to trigger the update. Normally, a user must confirm an update, which serves as a foundation for an enhanced workflow. Once triggered, the Ankaios SDK instructs Ankaios to start the `symphony` provider workload, which fetches updates from the Symphony cloud control plane over MQTT. The demo does not update the `virtual_ecu`; implementing the update logic is your task by creating a `Symphony Target Rust Provider`. Feel free to enhance this basic scenario.

## Prerequisites

- Any Linux or WSL2 on Windows
- [Eclipse Symphony 0.48-proxy.40](https://github.com/eclipse-symphony/symphony/releases/tag/0.48-proxy.40)
- [Eclipse Ankaios v0.6.0](https://github.com/eclipse-ankaios/ankaios/releases/tag/v0.6.0)
- [Podman](https://podman.io/docs/installation#installing-on-linux)
- [Docker](https://www.docker.com/) with Compose support

## Installation

### Install Podman

On Ubuntu:

```
sudo apt-get update
sudo apt-get -y install podman
```

Otherwise follow the official [Podman installation instructions](https://podman.io/docs/installation#installing-on-linux).

### Install Docker

Follow the instructions in the official [Install Docker Engine Guideline](https://docs.docker.com/engine/install/). Next, [intall docker compose](https://docs.docker.com/compose/install/).

### Install Ankaios

Install Eclipse Ankaios with a single curl command as described in the [Ankaios installation guide](https://eclipse-ankaios.github.io/ankaios/latest/usage/installation).

Follow the `Setup with script` section and install version v0.6.0.

**Note:** On Ubuntu 24.04, disable AppArmor as described in the guide.

The installation script automatically creates systemd service files for the Ankaios server and agent.

To enable `ank-cli` shell completion (for auto-completing workload names and field masks), follow the [Ankaios shell completion setup](https://eclipse-ankaios.github.io/ankaios/0.6/usage/shell-completion).

### Install Symphony

No installation is required; the cloud component is launched via Docker Compose.

## Run the demo

### Start the cloud part

Launch Symphony, an MQTT broker, and a read-only Symphony portal using the provided Docker Compose file:

```bash
# From the current folder
# If your docker-compose.yaml file is under a different folder, use:
# docker compose -f /path/to/your/docker-compose.yml up -d
docker compose up -d
```

#### Verify Access to Services

* To check access to Symphony REST API, you can send a test request to a `/greetings` route using tools like `curl`:
    ```bash
    curl http://localhost:8082/v1alpha2/greetings
    ```
    You should see a string `Hello from Symphony K8s control plane (S8C)` in response.

* (optional) To check access to the read-only Symphony portal, open a browser and navigate to `http://localhost:3000`. Login with user `admin` without a password. You should see the Symphony portal page. During your experiments, you can browse the Targets by clicking on the `Targets` link in the left panel.

### Start the in-vehicle part

Start the Ankaios server and Ankaios agent with systemd:

```shell
sudo systemctl start ank-server ank-agent
```

To run the over-the-air (OTA) scenario, just apply the [state.yaml](./samples/ankaios_provider/state.yaml) containing the workloads of the demo screnario:

```shell
ank apply samples/ankaios_provider/state.yaml
```

For applying incremental changes during the development you might update the [state.yaml](./samples/ankaios_provider/state.yaml) multiple times. The `ank apply` command figures out changes to the manifest by itself and applies only the changes, which means you can apply the new manifest and the workloads will get updated. You can also remove all the applied workloads by simply running `ank apply -d samples/ankaios_provider/state.yaml`. Just stopping the Ankaios cluster using systemd keeps the workloads and containers on `Podman`.

### Do the demo

1. Open the Ankaios Dashboard at `http://localhost:5001` and go to the Workloads tab.
2. Open the `update_trigger` WebUI at `http://localhost:5500` and click the Trigger Update button. You should see a successfull toast message at the bottom.
3. The `update_trigger` workload sets the empty agent name of the `symphony` workload (Symphony Target Provider) to the running Ankaios Agent named `agent_A` via the Ankaios Python SDK. This instructs Ankaios to schedule and start the `symphony` workload.
4. The `symphony` workload connects to the Symphony cloud management plane via MQTT and is ready to receive updates.
5. You can see in the Ankaios Dashboard, that the `symphony` workload is running.

With executing `ank get workloads` in the terminal, you should see now all workloads running:

```text
WORKLOAD NAME       AGENT     RUNTIME   EXECUTION STATE   ADDITIONAL INFO
Ankaios_Dashboard   agent_A   podman    Running(Ok)
symphony            agent_A   podman    Running(Ok)
update_trigger      agent_A   podman    Running(Ok)
virtual_ecu         agent_A   podman    Running(Ok)
```

For debugging, view logs of any workload:

```shell
ank logs --follow <workload_name>
```

Replace `<workload_name>` with the workload name for which you want to see the logs.

Proceed to the next steps to enhance this basic scenario with your custom update workflow.

## Next Steps

* [Write a custom Symphony Target provider using Rust](./rust_provider.md)
* [Set up a Symphony Agent via Ankaios](./symphony_on_ankaios.md)
* [Set up a standalone Symphony Agent](./symphony_standalone.md)
* Write more custom workloads like [custom_workloads/update_trigger](./custom_workloads/update_trigger/) to enhance the update challenge