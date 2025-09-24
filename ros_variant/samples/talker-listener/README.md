
# Talker Listener

This is a simple example wit two processes (nodes) one called talker  and another one called listener. For former writes data on a topic while the latter listens to that topic and print the received messages. Typically you can start it with:

```bash
# Let’s first launch the listener in background:

ros2 run demo_nodes_cpp listener &

#Now let’s launch the talker and see the logs of both nodes:

ros2 run demo_nodes_cpp talker

#After running the talker you should see something like the messages below:
[INFO] [talker]: Publishing: "Hello world: 1"
[INFO] [listener]: I heard: [Hello world: 1] 
[INFO] [talker]: Publishing: "Hello world: 2"
[INFO] [listener]: I heard: [Hello world: 2] 
````

## Running Talker-Listener with muto and symphony

[**Simple Talker Listener**]((samples/talker-listener/README.md))  This is the default demo in [🚀 Quick Start with Eclipse Muto and Eclipse Symphony](./muto-quickstart.md). You can also review the specific muto stacks and sypmhony target/solution/instance definitions in the [samples/talker-listener](../../samples/talker-listener) folder


#References

[See the demo_nodes_cpp package](https://docs.ros.org/en/iron/p/demo_nodes_cpp/)