# Cloud-Based Virtual Machine (VM) Monitoring System

A comprehensive system for monitoring virtual machine performance in real-time. This project comprises a full‑stack solution with a React dashboard, a simulated backend API, a Python monitoring agent for collecting metrics, and a Node.js-based alert server for issuing notifications.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
  - [Frontend](#frontend)
  - [Backend (JSON Server)](#backend-json-server)
  - [Monitoring Agent](#monitoring-agent)
  - [Alert Server](#alert-server)
- [Running the Project](#running-the-project)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Overview

This project provides a cloud-based solution for monitoring virtual machines (VMs) using a real-time dashboard and alerting system. It leverages multiple technologies:
- **React** for the dashboard user interface.
- **JSON Server** to simulate a backend REST API.
- **Python (psutil, requests)** for collecting VM performance metrics.
- **Node.js/Express** with **Nodemailer** to send email alerts when a VM crosses defined thresholds.

## Features

- **Real-Time Metrics:**  
  Continuously displays CPU, Memory, Disk, and Network usage.
- **Alerts and Notifications:**  
  Critical VMs trigger warning toast notifications and email alerts.
- **Acknowledgement System:**  
  Alerts can be acknowledged to prevent repeated notifications.
- **Responsive Dashboard:**  
  A Material UI themed interface for visualizing VM performance.
- **Configurable Thresholds:**  
  Customize CPU and Memory thresholds and email alert timings.
- **Cross-Platform Monitoring:**  
  Works on multiple platforms including Windows, Linux, and VMware environments.

## Requirements

- **Node.js** (v14 or higher) and **npm**
- **Python 3** (v3.6 or higher) with the packages:
  - `psutil`
  - `requests`
- **Git** for cloning the repository
- (Optional) Global installation of **JSON Server**:
  ```bash
  npm install -g json-server
  ```

## Project Structure

```
.
├── .env
├── .gitignore
├── db.json
├── package.json
├── README.md
├── server.js
├── alert-server/
│   ├── .env
│   ├── package.json
│   └── server.js
├── build/
├── middleware/
├── models/
├── Monitoring script/
│   ├── .env
│   ├── agent_id.txt
│   ├── pip_install.py
│   └── vm_agent.py
├── public/
├── routes/
├── server/
└── src/
```

## Installation and Setup

### Frontend

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

### Backend (JSON Server)

1. **Ensure `db.json` is in the project root.**

2. **Start the JSON Server (simulate REST API):**
   ```bash
   json-server --watch db.json --port 3001
   ```

### Monitoring Agent

1. **Navigate to the `Monitoring script/` folder:**
   ```bash
   cd "Monitoring script"
   ```

2. **Install required Python packages:**
   ```bash
   pip install psutil requests
   ```

3. **Run the monitoring agent:**
   ```bash
   python vm_agent.py
   ```

### Alert Server

1. **Navigate to the `alert-server/` folder:**
   ```bash
   cd alert-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your alert credentials in the `.env` file** found in this folder.

4. **Start the alert server:**
   ```bash
   node server.js
   ```

## Running the Project

1. **Start the React dashboard:**
   ```bash
   npm start
   ```
   This will launch the frontend (default URL: [http://localhost:3000](http://localhost:3000)).

2. **Ensure the JSON Server is running** on port 3001 to provide VM data.

3. **Run the monitoring agent** to send system metrics to the backend.

4. **Launch the alert server** if you want to enable email notifications for critical alerts.

## Configuration

- **Environment Variables:**  
  The project uses `.env` files in the root and in the `alert-server/` and `Monitoring script/` folders for sensitive configuration like database URIs and email credentials.
  
- **Thresholds:**  
  CPU and Memory thresholds (default to 80%) can be adjusted via localStorage (set in your dashboard settings).

- **Email Settings:**  
  Configure your email credentials (e.g. `EMAIL_USER`, `EMAIL_PASS`, `RECIPIENT_DEFAULT`) in the alert server’s `.env` file.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with descriptive messages.
4. Push your branch and open a pull request.
5. Ensure your code follows the existing coding style and passes tests.

## License

This project is licensed under the MIT License.

---

Happy Monitoring!
