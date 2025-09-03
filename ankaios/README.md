[Eclipse Ankaios](https://eclipse-ankaios.github.io/ankaios/0.6) provides workload and container orchestration for automotive High Performance Computing Platforms (HPCs). It supports various container runtimes and it is independent of existing communication frameworks like SOME/IP, DDS, or REST API.

For the hackathon, Eclipse Ankaios version v0.6.0 and [Podman](https://docs.podman.io/en/latest/) as container runtime are used.

To understand the next steps, please check out the [Eclipse Ankaios Architecture](https://eclipse-ankaios.github.io/ankaios/0.6/architecture).

# Prerequisites

- Any Linux or WSL2 on Windows

Recommendation: Ubuntu-24.04 native or on WSL2

# Install Podman

You can install Podman easily with the package manager like in Ubuntu:

```
sudo apt-get update
sudo apt-get -y install podman
```

Otherwise follow the official [Podman installation instructions](https://podman.io/docs/installation#installing-on-linux).

# Install Ankaios

Install Eclipse Ankaios with a single curl according to the [Ankaios installation guide](https://eclipse-ankaios.github.io/ankaios/latest/usage/installation).

Follow the `Setup with script` section and install the version Eclipse Ankaios v0.6.0.

**Note:** When using Ubuntu-24.04 disable AppArmor like discribed in the Ankaios installation guide.

The installation script will automatically create a systemd service file for the Ankaios server and an Ankaios agent.

# One time adaptions

In the file `/etc/ankaios/ank-agent.conf` in the field `name` set "hpc1".

To enable `ank-cli` shell completion (for auto-completing workload names and field masks), add the short config for your shell according to the [Ankaios shell completion setup](https://eclipse-ankaios.github.io/ankaios/0.6/usage/shell-completion).

# Run Ankaios

Start the Ankaios server and Ankaios agent with systemd:

```shell
sudo systemctl start ank-server ank-agent
```

# Apply the manifest

To run the over-the-air (OTA) scenario, just apply the [ota-manifest](./ota-manifest.yaml) containing workloads for updating a virtual demo ECU:

```shell
ank -k apply ota-manifest.yaml
```

**Note:**: Per default, Ankaios runs in insecure mode (no mTLS), so `ank-cli` requires `--insecure` (`-k`). To avoid typing `-k` each time, set `export ANK_INSECURE=true`.

For applying incremental changes during the development you might update the [ota-manifest](./ota-manifest.yaml) multiple times. The `ank apply` command figures out changes to the manifest by itself and applies only the changes, which means you can apply the new manifest and the workloads will get updated. You can also remove all the applied workloads by simply running `ank -k apply -d ota-manifest.yaml`.

# Additional Ankaios commands

```
ank get state // Retrieve information about the current Ankaios system
ank get workload // Information about the worloads running in the Ankaios system
ank get agent // Information about the Ankaios agents connected to the Ankaios server
ank logs <workload_name> // Retrieve the logs from a workload
ank help // Get the help
```

# Stop the scenario

**Note:** A stop of the ank-server and ank-agent will not delete any workload on the container runtime. This is intentional for automotive use-cases. Please delete the workloads with using the `ank-cli` in case of a full "cleanup" is required.

```shell
ank -k apply -d ota-manifest.yaml
```

Now you can update the scenario and apply an extended version again using `ank apply` like above.

Optionally, stop the Ankaios server and agent, when a complete shutdown of all components of the challenge is required:

```shell
sudo systemctl stop ank-server ank-agent
```

---
### Eclipse Projects Referenced
- [Eclipse Symphony](https://projects.eclipse.org/projects/automotive.symphony)
- [Eclipse uProtocol](https://projects.eclipse.org/projects/automotive.uprotocol)
- [Eclipse Ankaios](https://eclipse-ankaios.github.io/ankaios/)
- [Eclipse Muto](https://projects.eclipse.org/projects/automotive.muto)