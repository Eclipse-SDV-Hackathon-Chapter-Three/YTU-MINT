# Set Up a Symphony Agent via Ankaios

You will deploy your Symphony Agent Rust Provider using Eclipse Ankaios. The Symphony Agent connects to the Symphony management plane in the cloud over MQTT.

## Prerequisites
* Eclipse Symphony and Eclipse Ankaios has been [configured and working](./README.md)

## Apply the new Ankaios state file
Use the `ank apply` command to apply the updated manifest to Ankaios:
```bash
ank apply ./samples/ankaios_provider/state.yaml
```
If you want to make the new Ankaios manifest persistent, then copy it to `/etc/ankaios/state.yaml`.

If you start Ankaios again next time with the following commands, the new Ankaios manifest is used:

```bash
ank apply -d ./samples/ankaios_provider/state.yaml # delete all workloads of the current manifest
sudo systemctl stop ank-server ank-agent
sudo systemctl start ank-server ank-agent
```
Once the agent is deployed, you can check the states of all workloads with:
```bash
ank get workloads
```
If a workload fails to launch, look at its logs:
```bash
ank logs -f symphony
```
And finally, if you encounter an issue with an Ankaios component, use one of the following commands to display the logs of the Ankaios server or agent:
```bash
sudo journalctl -u ank-server -n 50
sudo journalctl -u ank-agent -n 50
```

## Test Ankaios target
We provide a sample Target definition at `samples/ankaios_provider/target.json`. It contains a single component that defines an Ankaios payload, which is a Nginx server:

```json
{
    "name": "ankaios-app",   
    "type": "ankaios-workload",             
    "properties": {
        "ankaios.runtime": "podman",
        "ankaios.agent": "agent_A",
        "ankaios.restartPolicy": "NEVER",
        "ankaios.runtimeConfig": "image: docker.io/library/nginx\ncommandOptions: [\"-p\", \"8080:80\"]"                   
    }
}
```
You can use the `samples/ankaios_provider/test_ankaios_provider.sh` script to create and then destroy a Target (named `ankaios-target`). After the Target is created, you should be able to observe new workload:
```bash
ank get workloads
```
And once you press `[Enter]` in the script, the Target is removed and the Nginx workload should be removed from Ankaios after a while.

# Additional Ankaios commands

```
ank get state // Retrieve information about the current Ankaios system
ank get workload // Information about the worloads running in the Ankaios system
ank get agent // Information about the Ankaios agents connected to the Ankaios server
ank logs <workload_name> // Retrieve the logs from a workload
ank help // Get the help
```