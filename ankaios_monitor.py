#!/usr/bin/env python3
"""
Ankaios Workload Monitor - Desktop GUI
A simple desktop application to monitor failed workloads
"""

import tkinter as tk
from tkinter import ttk, scrolledtext
import subprocess
import threading
import time
import json

class AnkaiosMonitor:
    def __init__(self, root):
        self.root = root
        self.root.title("🚗 Ankaios Fleet Dashboard - Workload Monitor")
        self.root.geometry("1200x800")
        
        # Create main frame
        main_frame = ttk.Frame(root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title
        title_label = ttk.Label(main_frame, text="🚗 Ankaios Fleet Dashboard - Workload Monitor", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 10))
        
        # Status overview
        status_frame = ttk.LabelFrame(main_frame, text="📊 Workload Status Overview", padding="10")
        status_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        
        self.status_text = scrolledtext.ScrolledText(status_frame, height=15, width=100)
        self.status_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Failed workloads details
        failed_frame = ttk.LabelFrame(main_frame, text="❌ Failed Workloads Details", padding="10")
        failed_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        
        self.failed_text = scrolledtext.ScrolledText(failed_frame, height=10, width=100)
        self.failed_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Control buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=(10, 0))
        
        self.start_button = ttk.Button(button_frame, text="▶️ Start Monitoring", command=self.start_monitoring)
        self.start_button.grid(row=0, column=0, padx=(0, 10))
        
        self.stop_button = ttk.Button(button_frame, text="⏹️ Stop Monitoring", command=self.stop_monitoring, state="disabled")
        self.stop_button.grid(row=0, column=1, padx=(0, 10))
        
        self.refresh_button = ttk.Button(button_frame, text="🔄 Refresh Now", command=self.refresh_data)
        self.refresh_button.grid(row=0, column=2)
        
        # Status label
        self.status_label = ttk.Label(main_frame, text="Ready to start monitoring...")
        self.status_label.grid(row=4, column=0, columnspan=2, pady=(10, 0))
        
        # Configure grid weights
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)
        status_frame.columnconfigure(0, weight=1)
        status_frame.rowconfigure(0, weight=1)
        failed_frame.columnconfigure(0, weight=1)
        failed_frame.rowconfigure(0, weight=1)
        
        self.monitoring = False
        self.monitor_thread = None
        
    def get_workloads(self):
        """Get workload status from Ankaios"""
        try:
            result = subprocess.run(['ank', 'get', 'workloads'], 
                                 capture_output=True, text=True, timeout=10)
            return result.stdout
        except Exception as e:
            return f"Error getting workloads: {str(e)}"
    
    def get_detailed_state(self):
        """Get detailed state information"""
        try:
            result = subprocess.run(['ank', 'get', 'state'], 
                                 capture_output=True, text=True, timeout=10)
            return result.stdout
        except Exception as e:
            return f"Error getting state: {str(e)}"
    
    def refresh_data(self):
        """Refresh the display with current data"""
        self.status_text.delete(1.0, tk.END)
        self.failed_text.delete(1.0, tk.END)
        
        # Get workload status
        workloads = self.get_workloads()
        self.status_text.insert(tk.END, workloads)
        
        # Get detailed state for failed workloads
        state = self.get_detailed_state()
        failed_info = ""
        for line in state.split('\n'):
            if 'StartingFailed' in line or 'Error' in line or 'Failed' in line:
                failed_info += line + "\n"
        
        if failed_info:
            self.failed_text.insert(tk.END, failed_info)
        else:
            self.failed_text.insert(tk.END, "No failed workloads found")
        
        self.status_label.config(text=f"Last updated: {time.strftime('%H:%M:%S')}")
    
    def monitor_loop(self):
        """Main monitoring loop"""
        while self.monitoring:
            self.refresh_data()
            time.sleep(5)  # Update every 5 seconds
    
    def start_monitoring(self):
        """Start the monitoring process"""
        self.monitoring = True
        self.start_button.config(state="disabled")
        self.stop_button.config(state="normal")
        self.status_label.config(text="Monitoring started...")
        
        self.monitor_thread = threading.Thread(target=self.monitor_loop)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
    
    def stop_monitoring(self):
        """Stop the monitoring process"""
        self.monitoring = False
        self.start_button.config(state="normal")
        self.stop_button.config(state="disabled")
        self.status_label.config(text="Monitoring stopped")
    
    def on_closing(self):
        """Handle window closing"""
        self.monitoring = False
        self.root.destroy()

def main():
    root = tk.Tk()
    app = AnkaiosMonitor(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()
