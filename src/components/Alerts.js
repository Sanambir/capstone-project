import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

function Alerts() {
  const [vmData, setVmData] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
  const [autoEmail, setAutoEmail] = useState(false);
  const [autoEmailSent, setAutoEmailSent] = useState({});
  const [recipientEmail, setRecipientEmail] = useState('');
  const [filter, setFilter] = useState('All');

  // Dynamic thresholds (with defaults)
  const cpuThreshold = Number(localStorage.getItem('cpuThreshold')) || 80;
  const memoryThreshold = Number(localStorage.getItem('memoryThreshold')) || 80;
  const emailFrequency = Number(localStorage.getItem('emailFrequency')) || 5; // in minutes

  // Offline threshold is 15 seconds (to match Dashboard)
  const OFFLINE_THRESHOLD = 15000; // ms

  // On mount, load recipientEmail and autoEmail from localStorage
  useEffect(() => {
    const storedRecipientEmail = localStorage.getItem('recipientEmail');
    if (storedRecipientEmail) {
      setRecipientEmail(storedRecipientEmail);
    }
    const storedAutoEmail = localStorage.getItem('autoEmail');
    if (storedAutoEmail !== null) {
      setAutoEmail(storedAutoEmail === 'true');
    }
  }, []);

  // Helper: Check if a VM is offline based on its last_updated timestamp.
  const isVMOffline = (lastUpdated) => {
    const now = new Date();
    const lastUpdate = new Date(lastUpdated);
    return now - lastUpdate > OFFLINE_THRESHOLD;
  };

  // Fetch VM data every 5 seconds.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/vms');
        if (response.ok) {
          const data = await response.json();
          setVmData(data);
        } else {
          console.error('Failed to fetch VM data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter critical VMs that are online and in a critical state.
  const criticalVMs = vmData.filter((vm) => {
    const online = vm.last_updated && !isVMOffline(vm.last_updated);
    const isCritical = vm.cpu > cpuThreshold || vm.memory > memoryThreshold;
    return online && isCritical && !acknowledgedAlerts[vm.id];
  });

  // Handle manual acknowledgement: mark alert as acknowledged and reset auto-email timestamp.
  const handleAcknowledge = (id) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
    setAutoEmailSent((prev) => ({ ...prev, [id]: 0 }));
  };

  // Handle filter change.
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Handle changes to recipient email and store in localStorage.
  const handleRecipientChange = (e) => {
    const email = e.target.value;
    setRecipientEmail(email);
    localStorage.setItem('recipientEmail', email);
  };

  // Handle auto email toggle change and store in localStorage.
  const handleAutoEmailToggle = (e) => {
    const isEnabled = e.target.checked;
    setAutoEmail(isEnabled);
    localStorage.setItem('autoEmail', isEnabled);
  };

  // Function to send an email alert.
  const sendEmailAlert = async (vm) => {
    try {
      const response = await axios.post('http://localhost:5000/send-alert', {
        vmName: vm.name,
        cpu: vm.cpu,
        memory: vm.memory,
        disk: vm.disk,
        recipientEmail: recipientEmail,
      });
      console.log(`Email alert sent for ${vm.name}:`, response.data.message);
    } catch (error) {
      console.error('Error sending alert email:', error);
    }
  };

  // Automatic email effect: for each critical VM, send an email if autoEmail is enabled and enough time has passed.
  useEffect(() => {
    if (autoEmail) {
      const now = Date.now();
      const frequencyMs = emailFrequency * 60 * 1000; // convert minutes to ms
      criticalVMs.forEach((vm) => {
        const lastSent = autoEmailSent[vm.id] || 0;
        if (now - lastSent > frequencyMs) {
          if (recipientEmail && recipientEmail.trim() !== '') {
            sendEmailAlert(vm);
            setAutoEmailSent((prev) => ({ ...prev, [vm.id]: now }));
          }
        }
      });
    } else {
      // Reset autoEmailSent if auto email is disabled.
      setAutoEmailSent({});
    }
  }, [autoEmail, criticalVMs, emailFrequency, recipientEmail, autoEmailSent]);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f4f4' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Critical Alerts</h2>

        {/* Recipient Email Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Recipient Email:</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={handleRecipientChange}
            placeholder="Enter email address"
            style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Automatic Email Alerts Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Automatic Email Alerts:</label>
          <input
            type="checkbox"
            checked={autoEmail}
            onChange={handleAutoEmailToggle}
          />
        </div>

        {/* Filter Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Filter Alerts:</label>
          <select
            value={filter}
            onChange={handleFilterChange}
            style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid #ccc' }}
          >
            <option value="All">All</option>
            <option value="CPU">{'CPU > ' + cpuThreshold + '%'}</option>
            <option value="Memory">{'Memory > ' + memoryThreshold + '%'}</option>
          </select>
        </div>

        {criticalVMs.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {criticalVMs.map((vm) => (
              <li
                key={vm.id}
                style={{
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                <strong>{vm.name}</strong> is in critical state (CPU: {vm.cpu}%, Memory: {vm.memory}%)
                <button
                  onClick={() => handleAcknowledge(vm.id)}
                  style={{
                    marginLeft: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => sendEmailAlert(vm)}
                  style={{
                    marginLeft: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Send Email
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No critical alerts at the moment.</p>
        )}
      </div>
    </div>
  );
}

export default Alerts;
