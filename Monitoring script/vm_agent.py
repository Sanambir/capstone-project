import os
import json
import uuid
import socket
import platform
import time
import datetime
import psutil
import requests
import getpass
import threading

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

# --- Login Function ---
def login_and_get_token():
    email = input("Enter your email address: ").strip()
    password = getpass.getpass("Enter your password: ")
    login_url = "https://test.sanambir.com/api/auth/login"
    try:
        response = requests.post(
            login_url,
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code in (200, 201):
            data = response.json()
            token = data.get("token")
            if token:
                print("Login successful.")
                return email, token
            else:
                print("Login failed: Token not received.")
                exit(1)
        else:
            print("Login failed:", response.text)
            exit(1)
    except Exception as e:
        print("Error during login:", e)
        exit(1)

# --- Function to Check if User is Registered ---
def check_user_exists(email, token):
    url = "https://test.sanambir.com/api/users?email=" + email
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    }
    try:
        response = requests.get(url, headers=headers)
        print("User check response status:", response.status_code)
        if response.status_code == 200:
            if response.text.strip() == "":
                return False
            try:
                data = response.json()
                if (isinstance(data, list) and len(data) > 0) or (isinstance(data, dict) and data.get("email") == email):
                    return True
                return False
            except Exception as e:
                print("Error parsing JSON:", e)
                return False
        else:
            return False
    except Exception as e:
        print("Error checking user existence:", e)
        return False

# --- Timestamp Helper ---
def get_current_timestamp():
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

# --- Main Initialization ---
agent_id = get_agent_id()
host_name = socket.gethostname()
os_type = platform.system()

USER_EMAIL, USER_TOKEN = login_and_get_token()

if not check_user_exists(USER_EMAIL, USER_TOKEN):
    print("This email is not registered on the dashboard. Please register there first.")
    exit(1)
else:
    print("User found. Proceeding with monitoring...")

# --- API Endpoints ---
# Real-time update endpoint (PUT) and VM creation endpoint (POST)
API_BASE_URL = "https://test.sanambir.com/api/vms"
API_URL = f"{API_BASE_URL}/{agent_id}"
# Aggregated performance endpoint (POST)
PERFORMANCE_URL = "https://test.sanambir.com/api/performance"

# --- Real-Time Metrics Collection ---
def collect_metrics():
    return {
        "cpu": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
    }

# --- Helper: Create VM Record if Not Found ---
def create_vm():
    vm_data = {
        "_id": agent_id,
        "name": host_name,
        "os": os_type,
        "cpu": 0,
        "memory": 0,
        "disk": 0,
        "network": {
            "bytes_sent": 0,
            "bytes_recv": 0,
            "packets_sent": 0,
            "packets_recv": 0,
        },
        "status": "Running",
        "last_updated": get_current_timestamp(),
        "user": USER_EMAIL
    }
    headers = {"Authorization": "Bearer " + USER_TOKEN}
    try:
        response = requests.post(API_BASE_URL, json=vm_data, headers=headers)
        if response.status_code in (200, 201):
            print("VM created successfully in database.")
            return True
        else:
            print("Failed to create VM:", response.status_code, response.text)
            return False
    except Exception as e:
        print("Error creating VM:", e)
        return False

def update_realtime():
    while True:
        data = collect_metrics()
        realtime_data = {
            "_id": agent_id,
            "name": host_name,
            "os": os_type,
            "cpu": data["cpu"],
            "memory": data["memory"],
            "disk": data["disk"],
            "network": {
                "bytes_sent": psutil.net_io_counters().bytes_sent,
                "bytes_recv": psutil.net_io_counters().bytes_recv,
                "packets_sent": psutil.net_io_counters().packets_sent,
                "packets_recv": psutil.net_io_counters().packets_recv,
            },
            "status": "Running",
            "last_updated": get_current_timestamp(),
            "user": USER_EMAIL
        }
        headers = {"Authorization": "Bearer " + USER_TOKEN}
        try:
            response = requests.put(API_URL, json=realtime_data, headers=headers)
            if response.status_code in (200, 201):
                print("Real-time metrics updated successfully.")
            elif response.status_code == 404:
                print("VM not found, attempting to create a new record...")
                if create_vm():
                    print("New VM record created, retrying update...")
                    response = requests.put(API_URL, json=realtime_data, headers=headers)
                    if response.status_code in (200, 201):
                        print("Real-time metrics updated successfully after creation.")
                    else:
                        print("Failed to update VM after creation:", response.status_code, response.text)
                else:
                    print("Unable to create new VM record.")
            else:
                print("Failed to update real-time metrics:", response.status_code, response.text)
        except Exception as e:
            print("Error updating real-time metrics:", e)
        time.sleep(5)

# --- Aggregated Performance Data ---
AGGREGATION_WINDOW = 300  # seconds (5 minutes)
SAMPLE_INTERVAL = 5       # seconds

def aggregate_and_send():
    while True:
        samples = []
        start_time = time.time()
        print("Starting aggregation for a 5-minute window...")
        while time.time() - start_time < AGGREGATION_WINDOW:
            sample = collect_metrics()
            samples.append(sample)
            time.sleep(SAMPLE_INTERVAL)
        if samples:
            avgCpu = sum(s['cpu'] for s in samples) / len(samples)
            avgMemory = sum(s['memory'] for s in samples) / len(samples)
            avgDisk = sum(s['disk'] for s in samples) / len(samples)
            aggregatedData = {
                "vmId": agent_id,
                "avgCpu": avgCpu,
                "avgMemory": avgMemory,
                "avgDisk": avgDisk,
                "sampleCount": len(samples)
            }
            headers = {"Authorization": "Bearer " + USER_TOKEN}
            try:
                response = requests.post(PERFORMANCE_URL, json=aggregatedData, headers=headers)
                if response.status_code in (200, 201):
                    print("Aggregated performance data sent successfully.")
                else:
                    print("Failed to send aggregated performance data:", response.status_code, response.text)
            except Exception as e:
                print("Error sending aggregated performance data:", e)
        else:
            print("No samples collected for aggregation.")

# --- Run Both Loops Concurrently ---
realtime_thread = threading.Thread(target=update_realtime, daemon=True)
aggregation_thread = threading.Thread(target=aggregate_and_send, daemon=True)

realtime_thread.start()
aggregation_thread.start()

# Keep the main thread alive.
while True:
    time.sleep(1)