# Cloud-Based Virtual Machine (VM) Monitoring System

A comprehensive system for monitoring virtual machine performance in real time. This project includes:

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
- [Project Structure](#project-structure)
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

## Project Structure

