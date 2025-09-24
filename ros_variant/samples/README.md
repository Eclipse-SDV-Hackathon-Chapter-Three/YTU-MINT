# ECU Updates for Robotics (ROS Variant)

## Example Scenarios

We have provided two demonstrative examples that who how muto and symphony work together to manage ROS software running on a robot:

- [**Simple Talker Listener**](talker-listener): This is one of the reference demonstrations that comes with ros. It is composed of two nodes one is the talker that publishes a message and a talker node that subscribes and prints the message. It runs forever until stopped.  This is the default demo yıu will find in [🚀 Quick Start with Eclipse Muto and Eclipse Symphony](./muto-quickstart.md). You can also review the specific muto stacks and sypmhony target/solution/instance definitions in the [talker-listener](talker-listener) folder

- [**AptilTag Detection**](april-tag-robot/README.md): This is a slighly more interesting example. An AprilTag is a visual reference system or a visual target. AprilTags can be detected by sensors such as cameras or lasers.  It is composed of two nodes for detecting the AprilTag. You can run it with a simulator (i.e. gazebo) or with a real robot with a camera attached to it.  You can simply update the stacks, solutions, instance in [Quick Start ](../muto-quickstart.md) and to run it. You can read more about thi scenario here and check the files in  [april-tag-robot](april-tag-robot) folder
