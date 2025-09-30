#!/bin/bash

# Ankaios Cleanup Script
# This script helps clean up failed workloads and agents

echo "🧹 Ankaios Cleanup Script"
echo "========================"
echo ""

# Function to show current status
show_status() {
    echo "📊 Current Status:"
    echo "------------------"
    ank get workloads
    echo ""
    ank get agents
    echo ""
}

# Function to remove failed workloads
remove_failed() {
    echo "🗑️ Removing failed workloads..."
    failed_workloads=$(ank get workloads | grep -E "(Failed|Error)" | awk '{print $1}' | grep -v "WORKLOAD")
    
    if [ -z "$failed_workloads" ]; then
        echo "✅ No failed workloads found"
    else
        echo "Found failed workloads: $failed_workloads"
        for workload in $failed_workloads; do
            echo "Removing $workload..."
            ank delete workload "$workload"
        done
    fi
}

# Function to remove all workloads except test
remove_all_except_test() {
    echo "🗑️ Removing all workloads except test_workload..."
    all_workloads=$(ank get workloads | awk '{print $1}' | grep -v "WORKLOAD" | grep -v "test_workload")
    
    if [ -z "$all_workloads" ]; then
        echo "✅ No workloads to remove"
    else
        for workload in $all_workloads; do
            echo "Removing $workload..."
            ank delete workload "$workload"
        done
    fi
}

# Function to clean up containers
cleanup_containers() {
    echo "🧹 Cleaning up orphaned containers..."
    # Remove containers with car- prefix
    podman ps -a --format "{{.Names}}" | grep "car-" | xargs -r podman rm -f
    echo "✅ Container cleanup completed"
}

# Main menu
case "$1" in
    "status")
        show_status
        ;;
    "failed")
        remove_failed
        show_status
        ;;
    "all")
        remove_all_except_test
        show_status
        ;;
    "containers")
        cleanup_containers
        ;;
    "full")
        echo "🧹 Full cleanup..."
        remove_all_except_test
        cleanup_containers
        show_status
        ;;
    *)
        echo "Usage: $0 {status|failed|all|containers|full}"
        echo ""
        echo "Commands:"
        echo "  status     - Show current workload and agent status"
        echo "  failed     - Remove only failed workloads"
        echo "  all        - Remove all workloads except test_workload"
        echo "  containers - Clean up orphaned containers"
        echo "  full       - Full cleanup (all + containers)"
        echo ""
        echo "Examples:"
        echo "  $0 status"
        echo "  $0 failed"
        echo "  $0 full"
        ;;
esac
