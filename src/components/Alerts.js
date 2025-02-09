import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

function Alerts() {
  const [vmData, setVmData] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
  const [filter, setFilter] = useState('All');
  const [autoEmail, setAutoEmail] = useState(false);
  // autoEmailSent now stores the timestamp (in ms) when the last auto-email was sent for each VM.
  const [autoEmailSent, setAutoEmailSent] = useState({});
  const [recipientEmail, setRecipientEmail] = useState('');

  // Fetch VM data every 5 seconds
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
        console.error('Error fetching VM data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter critical VMs (thresholds: CPU or Memory > 80) that haven't been acknowledged.
  const criticalVMs = vmData.filter((vm) => {
    if (acknowledgedAlerts[vm.id]) return false;
    if (filter === 'All') {
      return vm.cpu > 80 || vm.memory > 80;
    } else if (filter === 'CPU') {
      return vm.cpu > 80;
    } else if (filter === 'Memory') {
      return vm.memory > 80;
    }
    return false;
  });

  // Handler for acknowledging an alert (resets auto-email timestamp for that VM)
  const handleAcknowledge = (id) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
    setAutoEmailSent((prev) => ({ ...prev, [id]: 0 }));
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleEmailChange = (event) => {
    setRecipientEmail(event.target.value);
  };

  // Function to send an email alert (for both manual and automatic triggers)
  const sendEmailAlert = async (vm) => {
    try {
      const response = await axios.post('http://localhost:5000/send-alert', {
        vmName: vm.name,
        cpu: vm.cpu,
        memory: vm.memory,
        disk: vm.disk,
        recipientEmail: recipientEmail, // Pass the current recipient email
      });
      console.log(`Email alert sent for ${vm.name}`);
    } catch (error) {
      console.error('Error sending alert email:', error);
    }
  };

  // Automatically send email alerts if autoEmail is enabled.
  // For each critical VM, check if an email hasn't been sent in the last 5 minutes.
  useEffect(() => {
    if (autoEmail) {
      const now = Date.now();
      criticalVMs.forEach((vm) => {
        if (recipientEmail && recipientEmail.trim() !== '') {
          const lastSent = autoEmailSent[vm.id] || 0;
          // Check if 5 minutes (300000 ms) have passed since the last email
          if (now - lastSent > 300000) {
            sendEmailAlert(vm);
            setAutoEmailSent((prev) => ({ ...prev, [vm.id]: now }));
          }
        }
      });
    } else {
      // Reset autoEmailSent when auto email is turned off
      setAutoEmailSent({});
    }
  }, [autoEmail, criticalVMs, recipientEmail, autoEmailSent]);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f4f4' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <div style={{ padding: '20px' }}>
          {/* Recipient Email Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>
              Recipient Email:
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={handleEmailChange}
              placeholder="Enter email address"
              style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>

          {/* Automatic Email Alerts Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>
              Automatic Email Alerts:
            </label>
            <input
              type="checkbox"
              checked={autoEmail}
              onChange={(e) => setAutoEmail(e.target.checked)}
            />
          </div>

          {/* Filter Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>
              Filter Alerts:
            </label>
            <select
              value={filter}
              onChange={handleFilterChange}
              style={{
                padding: '5px 10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            >
              <option value="All">All</option>
              <option value="CPU">{'CPU > 80%'}</option>
              <option value="Memory">{'Memory > 80%'}</option>
            </select>
          </div>

          <h2>Critical Alerts</h2>
          {criticalVMs.length > 0 ? (
            <ul style={{ padding: 0, listStyle: 'none' }}>
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
                  <strong>{vm.name}</strong> is in a{' '}
                  <span style={{ color: 'red' }}>Critical</span> state (CPU: {vm.cpu}%, Memory: {vm.memory}%, Disk: {vm.disk}%)
                  <br />
                  <button
                    onClick={() => handleAcknowledge(vm.id)}
                    style={{
                      marginTop: '10px',
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
                      marginTop: '10px',
                      marginLeft: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Send Email Alert
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No critical alerts at the moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Alerts;
