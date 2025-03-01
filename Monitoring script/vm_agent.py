import os
import uuid
import socket
import platform
import time
import datetime
import psutil
import requests

# --- Utility: Get or Create a Local Agent ID ---
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

# Base URL configuration (make sure JSON Server is running on port 3001)
API_BASE_URL = "https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net/api/vms"
# Initially set API_URL using our local agent_id.
API_URL = f"{API_BASE_URL}/{agent_id}"

# --- Record Management on the Server ---
def create_vm_record(initial_data):
    """
    Create a new VM record on the server via POST.
    The record will be created with our supplied ID.
    """
    try:
        response = requests.post(API_BASE_URL, json=initial_data)
        if response.status_code in (200, 201):
            created_record = response.json()
            print("Created record response:", created_record)
            return created_record
        else:
            print("Failed to create VM record:", response.status_code)
    except Exception as e:
        print("Error creating VM record:", e)
    return None

def ensure_vm_record():
    """
    Ensure the current VM's record exists.
    If not (i.e. GET returns 404), create a new record with the supplied ID.
    """
    global agent_id, API_URL
    try:
        # Try to GET using the current API_URL.
        get_response = requests.get(API_URL)
        if get_response.status_code == 404:
            # Record not found; create a new record by supplying our own "id".
            initial_data = {
                "id": agent_id,  # Supply our own UUID
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
                "last_updated": datetime.datetime.utcnow().isoformat() + "Z"
            }
            created_record = create_vm_record(initial_data)
            if created_record:
                # Optionally, update agent_id if the response returns a different value.
                new_id = created_record.get("id")
                if new_id and new_id != agent_id:
                    agent_id = new_id
                    with open("agent_id.txt", "w") as f:
                        f.write(agent_id)
                    API_URL = f"{API_BASE_URL}/{agent_id}"
                    print(f"Updated agent_id to {agent_id}")
                else:
                    print("Using local agent_id:", agent_id)
        else:
            print("VM record already exists on the server.")
    except Exception as e:
        print("Error ensuring VM record exists:", e)

# Ensure that the VM record exists before starting metrics updates.
ensure_vm_record()

# --- Metrics Collection & Reporting ---
def collect_metrics():
    """
    Collect system metrics and include static fields so the record isn't overwritten.
    Timestamps are generated in UTC.
    """
    metrics = {
        "id": agent_id,         # Use the supplied agent_id
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
        "status": "Running",
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z"
    }
    return metrics

def send_metrics():
    """
    Send the collected metrics to the JSON Server using a PUT request.
    """
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
