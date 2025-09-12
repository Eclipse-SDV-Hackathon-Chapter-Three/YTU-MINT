# Set Up a Symphony Agent via Ankaios

Symphony supports an optional remote agent, which extends Symphony's state seeking to a separate process or network from the Symphony management plane. For example, you can have Symphony management plane running in a headquarter office, and remote agents installed on trucks on the road. The agents communicate with the management plane over a MQTT broker. In this challenge, you have the option of using Eclipse Ankaios to deploy your Symphony agent, as explained in the following steps.

## Prerequisites
* Eclipse Ankaios has been [configured and working](../ankaios/README.md)
* Eclipse Symphony has been [deployed and working](./README.md)

## Updating Ankaios state file
Since we are going to launch Symphony agent as an Ankaios workload, we need to pass in Symphony agent configuration as a mounted file. We provide a `symphony/symphony-agent-ankaios.json` file that you can use. This file needs to be base64 encoded and added to `symphony/samples/ankaios_provider/state.yaml` as `bin_config`.

To encode the file:
```bash
base64 symphony-agent-ankaios.json -w0
```
Then, copy the encoded string and replace the `bin_config` field in your `state.yaml` file.

## Apply the new Ankaios state file
Use these commands to refresh Ankaios with a new state file:
```bash
sudo systemctl stop ank-agent
sudo systemctl stop ank-server
sudo cp <your state.yaml file> /etc/ankaios/
# e.g. sudo cp ./samples/ankaios_provider/state.yaml /etc/ankaios/
sudo systemctl start ank-server
sudo systemctl start ank-agent
```
Once the agent is deployed, you should see the agent container running via Podman:
```bash
sudo podman ps
```
If the container fails to launch, look at `ank-agent` logs for clues:
```bash
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
        "ankaios.restartPolicy": "ALWAYS",
        "ankaios.runtimeConfig": "image: docker.io/library/nginx\ncommandOptions: [\"-p\", \"8080:80\"]"                   
    }
}
```
You can use the `samples/ankaios_provider/test_ankaios_provider.sh` script to create and then destroy a Target (named `ankaios-target`). After the Target is created, you should be able to observe the Ankaios payload getting launched in Podman:
```bash
sudo podman ps
```
And once you press `[Enter]` in the script, the Target is removed and the Nginx workload should be removed from Ankaios after a while.