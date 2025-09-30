#!/bin/bash

# Ankaios Workload Monitor
# This script provides a desktop-friendly view of failed workloads

echo "🚗 Ankaios Fleet Dashboard - Workload Monitor"
echo "=============================================="
echo ""

while true; do
    clear
    echo "🚗 Ankaios Fleet Dashboard - Workload Monitor"
    echo "=============================================="
    echo "Last updated: $(date)"
    echo ""
    
    echo "📊 WORKLOAD STATUS OVERVIEW:"
    echo "----------------------------"
    ank get workloads | while read line; do
        if [[ $line == *"Failed"* ]] || [[ $line == *"Error"* ]]; then
            echo "❌ $line"
        elif [[ $line == *"Running"* ]]; then
            echo "✅ $line"
        elif [[ $line == *"Pending"* ]]; then
            echo "⏳ $line"
        else
            echo "📋 $line"
        fi
    done
    
    echo ""
    echo "🔍 FAILED WORKLOADS DETAILS:"
    echo "----------------------------"
    ank get state | grep -A 5 -B 5 "StartingFailed\|Error" || echo "No failed workloads found"
    
    echo ""
    echo "Press Ctrl+C to exit"
    sleep 5
done
