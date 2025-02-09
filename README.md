# Cloud-Based Virtual Machine (VM) Monitoring System

A comprehensive system for monitoring virtual machine performance in real-time. This project includes:

- **Frontend (React Dashboard):**  
  Visualizes VM performance metrics (CPU, Memory, Disk, Network), handles real-time updates, filtering, sorting, and provides detailed modal views.

- **Backend (JSON Server):**  
  Simulates a RESTful API for VM data storage and retrieval. It is used by both the React dashboard and the Python monitoring agent.

- **Monitoring Agent (Python):**  
  A cross-platform script that collects VM performance metrics using `psutil` and periodically updates the backend via HTTP requests.

- **Alert Server (Node.js/Express with Nodemailer):**  
  Sends email notifications for critical VM alerts. Users can manually trigger emails or enable an automatic email option with configurable delays and recipient addresses. Sensitive credentials are managed through environment variables.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Setup Instructions](#setup-instructions)
- [Usage](#usage)
  - [Running the Frontend](#running-the-frontend)
  - [Starting the Backend (JSON Server)](#starting-the-backend-json-server)
  - [Launching the Monitoring Agent](#launching-the-monitoring-agent)
  - [Running the Alert Server](#running-the-alert-server)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Features

- **Real-Time Monitoring:**  
  The dashboard updates VM metrics every 5 seconds. Offline detection is implemented based on the last updated timestamp (using UTC for consistency across time zones).

- **Detailed Visualization:**  
  Circular progress bars and modals provide detailed insights into CPU, Memory, Disk, and Network usage.

- **Alerts and Email Notifications:**  
  The system detects critical VM states (e.g., CPU or Memory usage exceeding 80%) and can send email alerts either manually or automatically with configurable delays (e.g., one email every 5 minutes for persistent critical states). Users can also specify the recipient email address via the dashboard.

- **Cross-Platform Monitoring Agent:**  
  The Python script runs on both Windows and Linux, using `psutil` to gather system metrics.

- **Easy Configuration:**  
  Email credentials and other sensitive data are managed through environment variables to ensure security.

---

## Installation

### Prerequisites

- **Node.js and npm:** Required for running the React frontend, JSON Server, and the alert server.
- **Python 3:** Required for running the monitoring agent.
- **Git:** To clone the repository.
- **(Optional) Global Installation of JSON Server:**  
  ```bash
  npm install -g json-server
  ```

### Setup Instructions

1. **Clone the Repository:**  
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

2. **Install Frontend Dependencies:**  
   ```bash
   npm install
   ```

3. **Set Up JSON Server:**  
   Ensure `db.json` is in the project root. Then, run:
   ```bash
   json-server --watch db.json --port 3001
   ```

4. **Install Python Dependencies for the Monitoring Agent:**  
   Navigate to the `Monitoring script/` folder and install required packages:
   ```bash
   cd "Monitoring script"
   pip install psutil requests
   ```

5. **Set Up the Alert Server:**  
   Navigate to the `alert-server/` folder and install dependencies:
   ```bash
   cd ../alert-server
   npm install
   ```

6. **Configure Environment Variables:**  
   Create a `.env` file in the `alert-server/` folder and add:
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   RECIPIENT_DEFAULT=recipient@example.com
   ```
   **Note:** Ensure the `.env` file is listed in `.gitignore` so that sensitive credentials aren’t pushed to GitHub.

---

## Usage

### Running the Frontend

From the project root, start the React app:

```bash
npm start
```
This will launch the dashboard (typically at http://localhost:3000).

### Starting the Backend (JSON Server)

From the project root, run:

```bash
json-server --watch db.json --port 3001
```
This simulates the backend API for storing and retrieving VM data.

### Launching the Monitoring Agent

In a separate terminal, navigate to the `Monitoring script/` folder and run:

```bash
python vm_agent.py
```
The agent will collect system metrics and update `db.json` every 5 seconds.

### Running the Alert Server

In another terminal, navigate to the `alert-server/` folder and run:

```bash
node server.js
```
The alert server listens on port 5000 and handles email notifications.

---

## Configuration

### Email Credentials

All sensitive email credentials for the alert server are stored in the `.env` file inside the `alert-server/` folder. Make sure this file is kept out of Git (check your `.gitignore`).

### Thresholds and Timings

- The dashboard marks a VM as **“offline”** if no update is received within a specified threshold (standardized using UTC).  
- Email alerts for critical VMs are sent manually or automatically with a delay (e.g., one email every 5 minutes for a VM in continuous critical state). These timings can be adjusted in the code.

### Automatic vs. Manual Alerts

- Users can toggle automatic email notifications on the Alerts page and also set a custom recipient email.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive messages.
4. Push your branch and create a pull request.
5. Ensure that your code follows the existing coding style and passes any tests.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- **React** for the frontend framework.  
- **JSON Server** for simulating the backend API.  
- **Nodemailer** for email notifications.  
- **psutil** for collecting system metrics.  
- Special thanks to the open-source community for inspiration and support.
