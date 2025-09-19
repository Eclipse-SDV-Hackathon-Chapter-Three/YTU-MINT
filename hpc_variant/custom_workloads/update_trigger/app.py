from ankaios_sdk import Workload, Ankaios, WorkloadStateEnum, AnkaiosException
import sys, signal

SYMPHONY_WORKLOAD_FIELD_MASK = "desiredState.workloads.symphony"
AGENT_NAME = "agent_A"

# Create a new Ankaios object.
# The connection to the control interface is automatically done at this step.
# The Ankaios class supports context manager syntax:
with Ankaios() as ankaios:

    def signal_handler(sig, frame):
        global ankaios
        del ankaios
        sys.exit(0)

    # Add a SIGTERM handler to allow a clean shutdown
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        # Get the current state and workload config from the unscheduled symphony workload
        # (a workload with an empty agent field is not scheduled by Ankaios)
        current_state = ankaios.get_state(field_masks=[SYMPHONY_WORKLOAD_FIELD_MASK])

        print("Current state: ", current_state)

        unscheduled_symphony_workload = current_state.get_workload("symphony")
        unscheduled_symphony_workload.update_agent_name(AGENT_NAME) # Assign the workload to a specific agent so that it is started

        # Apply the updated workload configuration
        update_response = ankaios.apply_workload(unscheduled_symphony_workload)
        print("Update response: ", update_response)

        workload_instance_name = update_response.added_workloads[0]

        # Request the execution state based on the workload instance name
        ret = ankaios.get_execution_state_for_instance_name(
            workload_instance_name
        )
        if ret is not None:
            print(
                f"State: {ret.state}, substate: {ret.substate}, info: {ret.additional_info}"
            )

        # Wait until the workload reaches the running state
        try:
            ankaios.wait_for_workload_to_reach_state(
                workload_instance_name,
                state=WorkloadStateEnum.RUNNING,
                timeout=10,
            )
        except TimeoutError:
            print("Workload didn't reach the required state in time.")
        else:
            print("Workload reached the RUNNING state.")

    # Catch the AnkaiosException in case something went wrong with apply_workload
    except AnkaiosException as e:
        print("Ankaios Exception occurred: ", e)