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
    login_url = "http://localhost:3001/api/auth/login"
    try:
        response = requests.post(login_url, json={"email": email, "password": password}, headers={"Content-Type": "application/json"})
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
    url = "http://localhost:3001/api/users?email=" + email
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    }
    try:
        response = requests.get(url, headers=headers)
        print("User check response status:", response.status_code)
        print("User check response text:", response.text)
        if response.status_code == 200:
            if response.text.strip() == "":
                return False
            try:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    return True
                if isinstance(data, dict) and data.get("email") == email:
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

# Login to obtain JWT token automatically.
USER_EMAIL, USER_TOKEN = login_and_get_token()

# Check if the user is registered.
if not check_user_exists(USER_EMAIL, USER_TOKEN):
    print("This email is not registered on the dashboard. Please register there first.")
    exit(1)
else:
    print("User found. Proceeding with monitoring...")

# --- API Endpoint Configuration for VM Records ---
API_BASE_URL = "http://localhost:3001/api/vms"
API_URL = f"{API_BASE_URL}/{agent_id}"  # This will be used to get/update the VM record

# --- Record Management on the Server ---
def create_vm_record(initial_data):
    headers = {"Authorization": "Bearer " + USER_TOKEN}
    try:
        response = requests.post(API_BASE_URL, json=initial_data, headers=headers)
        if response.status_code in (200, 201):
            created_record = response.json()
            print("Created record response:", created_record)
            return created_record
        else:
            print("Failed to create VM record:", response.status_code, response.text)
    except Exception as e:
        print("Error creating VM record:", e)
    return None

def ensure_vm_record():
    global agent_id, API_URL
    headers = {"Authorization": "Bearer " + USER_TOKEN}
    try:
        get_response = requests.get(API_URL, headers=headers)
        print("GET response status:", get_response.status_code)
        print("GET response text:", get_response.text)
        # If record not found (404 or empty), create a new one.
        if get_response.status_code == 404 or get_response.text.strip() in ["", "{}", "null"]:
            initial_data = {
                "_id": agent_id,  # Use _id here
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
                "last_updated": get_current_timestamp(),
                "user": USER_EMAIL
            }
            created_record = create_vm_record(initial_data)
            if created_record:
                new_id = created_record.get("_id")
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

ensure_vm_record()

# --- Metrics Collection & Reporting ---
def collect_metrics():
    metrics = {
        "_id": agent_id,  # Use _id here as well
        "name": host_name,
        "os": os_type,
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
        "last_updated": get_current_timestamp(),
        "user": USER_EMAIL
    }
    return metrics

def send_metrics():
    data = collect_metrics()
    print("Sending metrics data:", data)
    headers = {"Authorization": "Bearer " + USER_TOKEN}
    try:
        response = requests.put(API_URL, json=data, headers=headers)
        if response.status_code in (200, 201):
            print("Metrics updated successfully.")
        else:
            print("Failed to update metrics:", response.status_code, response.text)
    except Exception as e:
        print("Error sending metrics:", e)

if __name__ == '__main__':
    while True:
        send_metrics()
        time.sleep(5)
