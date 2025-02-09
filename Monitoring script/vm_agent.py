import os
import uuid
import socket
import platform
import time
import datetime
import psutil
import requests

# --- Utility to Get or Create a Unique Agent ID ---
def get_agent_id():
    agent_file = "agent_id.txt"
    if os.path.exists(agent_file):
        with open(agent_file, "r") as f:
            agent_id = f.read().strip()
    else:
        agent_id = str(uuid.uuid4())
        with open(agent_file, "w") as f:
            f.write(agent_id)
    return agent_id

# Get system details
agent_id = get_agent_id()
host_name = socket.gethostname()
os_type = platform.system()

# Base URL configuration (ensure JSON Server is running on port 3001)
API_BASE_URL = "http://localhost:3001/vms"
API_URL = f"{API_BASE_URL}/{agent_id}"

# --- Record Management on the Server ---
def create_vm_record(initial_data):
    try:
        response = requests.post(API_BASE_URL, json=initial_data)
        if response.status_code in (200, 201):
            print("Created new VM record on server.")
        else:
            print("Failed to create VM record:", response.status_code)
    except Exception as e:
        print("Error creating VM record:", e)

def ensure_vm_record():
    try:
        get_response = requests.get(API_URL)
        if get_response.status_code == 404:
            # Record not found; create a new record with initial data.
            initial_data = {
                "id": agent_id,
                "name": host_name,
                "os": os_type,
                "cpu": 0,
                "memory": 0,
                "disk": 0,
                "network": {
                    "bytes_sent": 0,
                    "bytes_recv": 0,
                    "packets_sent": 0,
                    "packets_recv": 0
                },
                "status": "Running",
                "last_updated": datetime.datetime.now().isoformat()
            }
            create_vm_record(initial_data)
        else:
            print("VM record already exists on the server.")
    except Exception as e:
        print("Error ensuring VM record exists:", e)

# Ensure that the VM record exists before starting metrics updates
ensure_vm_record()

# --- Metrics Collection & Reporting ---
def collect_metrics():
    """
    Collect system metrics and include static fields so that the record isn't overwritten.
    """
    metrics = {
        "id": agent_id,         # Unique ID for this VM
        "name": host_name,      # System name
        "os": os_type,          # Operating system
        "cpu": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "network": {
            "bytes_sent": psutil.net_io_counters().bytes_sent,
            "bytes_recv": psutil.net_io_counters().bytes_recv,
            "packets_sent": psutil.net_io_counters().packets_sent,
            "packets_recv": psutil.net_io_counters().packets_recv
        },
        "status": "Running",  # You can update this based on your own logic if needed
        "last_updated": datetime.datetime.now().isoformat()
    }
    return metrics

def send_metrics():
    data = collect_metrics()
    try:
        response = requests.put(API_URL, json=data)
        if response.status_code in (200, 201):
            print("Metrics updated successfully.")
        else:
            print("Failed to update metrics:", response.status_code)
    except Exception as e:
        print("Error sending metrics:", e)

# --- Main Loop ---
if __name__ == '__main__':
    while True:
        send_metrics()
        time.sleep(5)
