import platform
import psutil
import requests
import uuid
import time

# Backend URL (Replace with your actual backend URL)
BACKEND_URL = "http://localhost:3001/vms"

# Generate a unique ID for the VM based on the hostname or a static UUID
VM_ID = str(uuid.uuid5(uuid.NAMESPACE_DNS, platform.node()))  # Consistent UUID for the machine

def get_cpu_usage():
    # Get per-core CPU usage percentages
    core_usages = psutil.cpu_percent(interval=1, percpu=True)
    # Calculate the average across all cores
    total_cpu_usage = sum(core_usages) / len(core_usages)
    return total_cpu_usage


def get_system_metrics():
    """
    Collect system metrics such as CPU usage, memory usage, and disk usage.  
    """
    try:
        # Get accurate CPU usage
        total_cpu_usage = get_cpu_usage()

        metrics = {
            "id": VM_ID,  # Unique identifier for the VM
            "name": platform.node(),  # Hostname of the machine
            "os": platform.system(),  # Operating system
            "cpu": total_cpu_usage,  # Total CPU usage
            "memory": psutil.virtual_memory().percent,  # Memory usage percentage
            "disk": psutil.disk_usage('/').percent,  # Disk usage percentage
            "status": "Running"
        }
        return metrics
    except Exception as e:
        print(f"Error collecting system metrics: {e}")
        return None




def send_metrics_to_server(metrics):
    """
    Send collected metrics to the backend server.
    """
    try:
        # First, try PUT to update
        response = requests.put(f"{BACKEND_URL}/{metrics['id']}", json=metrics)

        # If resource doesn't exist, fallback to POST
        if response.status_code == 404:
            response = requests.post(BACKEND_URL, json=metrics)

        if response.status_code in [200, 201]:
            print(f"Metrics sent successfully: {metrics}")
        else:
            print(f"Failed to send metrics. Status Code: {response.status_code}")
    except Exception as e:
        print(f"Error sending metrics to server: {e}")



def main():
    """
    Main function to run the monitoring agent.
    """
    while True:
        metrics = get_system_metrics()
        if metrics:
            send_metrics_to_server(metrics)
        time.sleep(5)  # Send data every 5 seconds

if __name__ == "__main__":
    main()
