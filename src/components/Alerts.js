import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

function Alerts() {
  const [vmData, setVmData] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
  const [autoEmail, setAutoEmail] = useState(false);
  // autoEmailSent stores the last sent timestamp for each VM (persisted in localStorage)
  const [autoEmailSent, setAutoEmailSent] = useState({});
  const [recipientEmail, setRecipientEmail] = useState('');
  const [filter, setFilter] = useState('All');

  // Dynamic thresholds with defaults
  const cpuThreshold = Number(localStorage.getItem('cpuThreshold')) || 80;
  const memoryThreshold = Number(localStorage.getItem('memoryThreshold')) || 80;
  const emailFrequency = Number(localStorage.getItem('emailFrequency')) || 5; // in minutes
  const OFFLINE_THRESHOLD = 15000; // 15 seconds in ms

  // On mount, load recipientEmail, autoEmail, and autoEmailSent from localStorage.
  useEffect(() => {
    const storedRecipientEmail = localStorage.getItem('recipientEmail');
    if (storedRecipientEmail) {
      setRecipientEmail(storedRecipientEmail);
    }
    const storedAutoEmail = localStorage.getItem('autoEmail');
    if (storedAutoEmail !== null) {
      setAutoEmail(storedAutoEmail === 'true');
    }
    const storedAutoEmailSent = localStorage.getItem('autoEmailSent');
    if (storedAutoEmailSent) {
      setAutoEmailSent(JSON.parse(storedAutoEmailSent));
    }
  }, []);

  // Persist autoEmailSent changes to localStorage.
  useEffect(() => {
    localStorage.setItem('autoEmailSent', JSON.stringify(autoEmailSent));
  }, [autoEmailSent]);

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

  // Filter VMs that are online and in a critical state.
  const criticalVMs = vmData.filter((vm) => {
    const online = vm.last_updated && !isVMOffline(vm.last_updated);
    const isCritical = vm.cpu > cpuThreshold || vm.memory > memoryThreshold;
    return online && isCritical;
  });

  // Separate critical VMs into unacknowledged and acknowledged.
  const unacknowledgedCritical = criticalVMs.filter((vm) => !acknowledgedAlerts[vm.id]);
  const acknowledgedCritical = criticalVMs.filter((vm) => acknowledgedAlerts[vm.id]);

  // Handle manual acknowledgement.
  const handleAcknowledge = (id) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
    setAutoEmailSent((prev) => ({ ...prev, [id]: 0 }));
  };

  // Handle "Remove Acknowledgement" (unacknowledge).
  const handleUnacknowledge = (id) => {
    setAcknowledgedAlerts((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  // Handle filter change.
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Handle changes to the recipient email input.
  const handleRecipientChange = (e) => {
    setRecipientEmail(e.target.value);
  };

  // Save the recipient email to localStorage.
  const handleEmailSave = () => {
    localStorage.setItem('recipientEmail', recipientEmail);
    alert('Email saved successfully!');
  };

  // Handle auto email toggle change.
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

  // Automatic email effect: for each unacknowledged critical VM, send an email if autoEmail is enabled and enough time has passed.
  useEffect(() => {
    if (autoEmail) {
      const now = Date.now();
      const frequencyMs = emailFrequency * 60 * 1000; // Convert minutes to ms.
      unacknowledgedCritical.forEach((vm) => {
        let lastSent = autoEmailSent[vm.id];
        // If no record exists, initialize it to now (but do not send email immediately).
        if (!lastSent) {
          setAutoEmailSent((prev) => ({ ...prev, [vm.id]: now }));
        } else if (now - lastSent > frequencyMs) {
          if (recipientEmail && recipientEmail.trim() !== '') {
            sendEmailAlert(vm);
            setAutoEmailSent((prev) => ({ ...prev, [vm.id]: now }));
          }
        }
      });
    }
  }, [autoEmail, unacknowledgedCritical, emailFrequency, recipientEmail, autoEmailSent]);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f4f4' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Critical Alerts</h2>

        {/* Recipient Email Input with Save Button */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Recipient Email:</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={handleRecipientChange}
            placeholder="Enter email address"
            style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleEmailSave}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              cursor: 'pointer',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            Save Email
          </button>
        </div>

        {/* Automatic Email Alerts Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Automatic Email Alerts:</label>
          <input type="checkbox" checked={autoEmail} onChange={handleAutoEmailToggle} />
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

        {/* Unacknowledged Critical Alerts Section */}
        <h3>Critical Alerts</h3>
        {unacknowledgedCritical.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {unacknowledgedCritical.map((vm) => (
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

        {/* Acknowledged Alerts Section */}
        <h3>Acknowledged Alerts</h3>
        {acknowledgedCritical.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {acknowledgedCritical.map((vm) => (
              <li
                key={vm.id}
                style={{
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}
              >
                <strong>{vm.name}</strong> (Acknowledged)
                <button
                  onClick={() => handleUnacknowledge(vm.id)}
                  style={{
                    marginLeft: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#ffc107',
                    color: '#000',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Remove Acknowledgement
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No acknowledged alerts.</p>
        )}
      </div>
    </div>
  );
}

export default Alerts;
