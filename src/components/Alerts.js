import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

// Custom ToggleSwitch component
function ToggleSwitch({ checked, onChange }) {
  const switchContainer = {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '24px',
  };

  const sliderStyle = {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: checked ? '#28a745' : '#ccc',
    transition: '.4s',
    borderRadius: '24px',
  };

  const circleStyle = {
    position: 'absolute',
    height: '18px',
    width: '18px',
    left: checked ? '26px' : '4px',
    bottom: '3px',
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%',
  };

  return (
    <label style={switchContainer}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={sliderStyle}></span>
      <span style={circleStyle}></span>
    </label>
  );
}

function Alerts() {
  const [vmData, setVmData] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
  const [autoEmail, setAutoEmail] = useState(false);
  // autoEmailSent stores the last sent timestamp for each VM (persisted in localStorage)
  const [autoEmailSent, setAutoEmailSent] = useState({});
  const [recipientEmail, setRecipientEmail] = useState('');
  const [filter, setFilter] = useState('All');
  // Pagination state added here:
  const [currentPage, setCurrentPage] = useState(1);

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

  // Determine critical VMs (online and meeting threshold criteria).
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

  // Automatic email effect: for each unacknowledged critical VM,
  // if there's no previous timestamp, initialize it to now without sending an email.
  // Otherwise, send an email only if enough time has passed.
  useEffect(() => {
    if (autoEmail) {
      const now = Date.now();
      const frequencyMs = emailFrequency * 60 * 1000; // Convert minutes to ms.
      unacknowledgedCritical.forEach((vm) => {
        const lastSent = autoEmailSent[vm.id];
        if (!lastSent) {
          // Initialize the timestamp without sending an email.
          setAutoEmailSent((prev) => ({ ...prev, [vm.id]: now }));
        } else if (now - lastSent > frequencyMs) {
          if (recipientEmail && recipientEmail.trim() !== '') {
            sendEmailAlert(vm);
            setAutoEmailSent((prev) => ({ ...prev, [vm.id]: now }));
          }
        }
      });
    }
  }, [autoEmail, unacknowledgedCritical, emailFrequency, recipientEmail]);

  // Pagination logic.
  const rowsPerPage = 5;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = criticalVMs.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(criticalVMs.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f4f4' }}>
      <Sidebar />
      {/* Left Column: Alerts List */}
      <div style={{ flex: 2, padding: '20px' }}>
        <h2>Critical Alerts</h2>
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

        <h3>Unacknowledged Alerts</h3>
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

        {/* Pagination */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </button>
          <span style={{ margin: '0 10px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>

      {/* Right Column: User Settings */}
      <div
        style={{
          flex: 1,
          padding: '20px',
          borderLeft: '1px solid #ddd',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3>User Info</h3>
        <p>
          <strong>Saved Email:</strong>{' '}
          {recipientEmail ? recipientEmail : 'Not set'}
        </p>
        <p>
          <strong>Automatic Email Alerts:</strong> {autoEmail ? 'ON' : 'OFF'}
        </p>
        <div style={{ marginTop: '10px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>
            Toggle Auto Email:
          </label>
          <ToggleSwitch checked={autoEmail} onChange={handleAutoEmailToggle} />
        </div>
      </div>
    </div>
  );
}

export default Alerts;
