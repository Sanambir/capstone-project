import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { ThemeContext } from '../ThemeContext';
import { FaBars } from 'react-icons/fa';
import ReactModal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select as MuiSelect
} from '@mui/material';

ReactModal.setAppElement('#root');

// Custom ToggleSwitch component using MUI's Box
function ToggleSwitch({ checked, onChange }) {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
        width: '50px',
        height: '24px',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <Box
        sx={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? '#28a745' : '#ccc',
          transition: '.4s',
          borderRadius: '24px',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          height: '18px',
          width: '18px',
          left: checked ? '26px' : '4px',
          bottom: '3px',
          backgroundColor: 'white',
          transition: '.4s',
          borderRadius: '50%',
        }}
      />
    </Box>
  );
}

const OFFLINE_THRESHOLD = 15000; // 15 seconds

// Helper: Check if a VM is offline.
function isVMOffline(lastUpdated) {
  const now = new Date();
  const lastUpdate = new Date(lastUpdated);
  return now - lastUpdate > OFFLINE_THRESHOLD;
}

// Helper: Determine if a VM is critical.
function isCritical(vm, cpuThreshold, memoryThreshold) {
  if (!vm.last_updated) return false;
  const offline = isVMOffline(vm.last_updated);
  return !offline && (vm.cpu > cpuThreshold || vm.memory > memoryThreshold);
}

function Alerts() {
  const { theme } = useContext(ThemeContext);
  const [vmData, setVmData] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
  const [autoEmail, setAutoEmail] = useState(false);
  const [autoEmailSent, setAutoEmailSent] = useState({});
  const [recipientEmail, setRecipientEmail] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmail, setEditingEmail] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const rowsPerPage = 5;
  const emailFrequency = Number(localStorage.getItem('emailFrequency')) || 5; // minutes

  // Define thresholds (defaults: 80 for CPU/Memory)
  const cpuThreshold = Number(localStorage.getItem('cpuThreshold')) || 80;
  const memoryThreshold = Number(localStorage.getItem('memoryThreshold')) || 80;

  // Load saved settings on mount.
  useEffect(() => {
    const storedRecipientEmail = localStorage.getItem('recipientEmail');
    if (storedRecipientEmail) setRecipientEmail(storedRecipientEmail);
    const storedAutoEmail = localStorage.getItem('autoEmail');
    if (storedAutoEmail !== null) setAutoEmail(storedAutoEmail === 'true');
    const storedAutoEmailSent = localStorage.getItem('autoEmailSent');
    if (storedAutoEmailSent) setAutoEmailSent(JSON.parse(storedAutoEmailSent));
  }, []);

  useEffect(() => {
    localStorage.setItem('autoEmailSent', JSON.stringify(autoEmailSent));
  }, [autoEmailSent]);

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

  // Determine critical alerts: online VMs exceeding CPU or Memory thresholds.
  const allCriticalVMs = vmData.filter((vm) => {
    const online = vm.last_updated && !isVMOffline(vm.last_updated);
    return online && (vm.cpu > cpuThreshold || vm.memory > memoryThreshold);
  });

  // Apply filter: "All", "CPU", "Memory"
  const filteredCriticalVMs = allCriticalVMs.filter((vm) => {
    if (filter === 'All') return true;
    if (filter === 'CPU') return vm.cpu > cpuThreshold;
    if (filter === 'Memory') return vm.memory > memoryThreshold;
    return true;
  });

  const unacknowledgedCritical = filteredCriticalVMs.filter((vm) => !acknowledgedAlerts[vm.id]);
  const acknowledgedCritical = filteredCriticalVMs.filter((vm) => acknowledgedAlerts[vm.id]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = unacknowledgedCritical.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(unacknowledgedCritical.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleAcknowledge = (id) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
    setAutoEmailSent((prev) => ({ ...prev, [id]: 0 }));
  };

  const handleUnacknowledge = (id) => {
    setAcknowledgedAlerts((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRecipientChange = (e) => setRecipientEmail(e.target.value);
  const handleEmailSave = () => {
    localStorage.setItem('recipientEmail', recipientEmail);
    setEditingEmail(false);
    alert('Email saved successfully!');
  };

  const handleAutoEmailToggle = (e) => {
    const isEnabled = e.target.checked;
    setAutoEmail(isEnabled);
    localStorage.setItem('autoEmail', isEnabled);
  };

  const sendEmailAlert = async (vm) => {
    try {
      const response = await axios.post('http://localhost:5000/send-alert', {
        vmName: vm.name,
        cpu: vm.cpu,
        memory: vm.memory,
        disk: vm.disk,
        recipientEmail,
      });
      console.log(`Email alert sent for ${vm.name}:`, response.data.message);
    } catch (error) {
      console.error('Error sending alert email:', error);
    }
  };

  useEffect(() => {
    if (autoEmail) {
      const now = Date.now();
      const frequencyMs = emailFrequency * 60 * 1000;
      unacknowledgedCritical.forEach((vm) => {
        const lastSent = autoEmailSent[vm.id];
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
  }, [autoEmail, unacknowledgedCritical, emailFrequency, recipientEmail]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const overviewData = {
    totalVMs: vmData.length,
    runningVMs: vmData.filter(
      (vm) =>
        vm.last_updated &&
        !isVMOffline(vm.last_updated) &&
        (vm.cpu <= cpuThreshold && vm.memory <= memoryThreshold)
    ).length,
    criticalVMs: vmData.filter((vm) => isCritical(vm, cpuThreshold, memoryThreshold)).length,
  };

  // Main container style (center column) – reserves left margin for Sidebar and fixed width for User Info panel.
  const mainContainerStyle = {
    marginLeft: sidebarOpen ? '250px' : '0',
    marginRight: '300px', // Reserve 300px for User Info panel
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
    transition: 'margin 0.3s ease, background-color 0.3s ease, color 0.3s ease',
    flex: 2,
  };

  // User Info panel style (right column) – fixed width.
  const userInfoStyle = {
    width: '300px',
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f9f9f9' : '#333',
    borderLeft: '1px solid #ddd',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    flex: 1,
  };

  // Card background colors.
  const defaultCardBg = theme === 'light' ? '#fff' : '#333';
  const offlineCardBg = theme === 'light' ? '#e0e0e0' : '#444';
  const criticalCardBg = theme === 'light' ? '#ffcccc' : '#a94442';

  return (
    <Box sx={{ display: 'flex' }}>
      {sidebarOpen && <Sidebar overviewData={overviewData} onClose={toggleSidebar} />}
      <Box sx={mainContainerStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FaBars onClick={toggleSidebar} style={{ fontSize: '24px', cursor: 'pointer', mr: '10px' }} />
          <Typography variant="h4">Alerts</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography component="label" sx={{ fontWeight: 'bold', mr: 1 }}>
            Filter Alerts:
          </Typography>
          <MuiSelect
            value={filter}
            onChange={handleFilterChange}
            sx={{ width: '200px', p: '5px 10px', borderRadius: '5px' }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="CPU">{`CPU > ${cpuThreshold}%`}</MenuItem>
            <MenuItem value="Memory">{`Memory > ${memoryThreshold}%`}</MenuItem>
          </MuiSelect>
        </Box>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Unacknowledged Alerts
        </Typography>
        {currentRows.length > 0 ? (
          <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
            {currentRows.map((vm) => (
              <Box
                key={vm.id}
                onClick={() => setSelectedAlert(vm)}
                sx={{
                  mb: 2,
                  p: 2,
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: defaultCardBg,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                }}
              >
                <Typography variant="h6">{vm.name}</Typography>
                <Button variant="contained" onClick={() => handleAcknowledge(vm.id)} sx={{ ml: 1 }}>
                  Acknowledge
                </Button>
                <Button variant="contained" onClick={() => sendEmailAlert(vm)} sx={{ ml: 1 }}>
                  Send Email
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography>No critical alerts at the moment.</Typography>
        )}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button variant="contained" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} sx={{ mr: 1 }}>
            Previous
          </Button>
          <Typography variant="body1" component="span" sx={{ mx: 1 }}>
            Page {currentPage} of {totalPages}
          </Typography>
          <Button variant="contained" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} sx={{ ml: 1 }}>
            Next
          </Button>
        </Box>
        <Typography variant="h5" sx={{ mt: 4 }}>
          Acknowledged Alerts
        </Typography>
        {acknowledgedCritical.length > 0 ? (
          <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
            {acknowledgedCritical.map((vm) => (
              <Box
                key={vm.id}
                sx={{
                  mb: 2,
                  p: 2,
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <Typography variant="h6">{vm.name} (Acknowledged)</Typography>
                <Button variant="contained" onClick={() => handleUnacknowledge(vm.id)} sx={{ ml: 1 }}>
                  Remove Acknowledgement
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography>No acknowledged alerts.</Typography>
        )}
      </Box>
      <Box sx={userInfoStyle}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          User Info
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            <strong>Saved Email:</strong> {recipientEmail ? recipientEmail : 'Not set'}
          </Typography>
          {editingEmail ? (
            <>
              <TextField
                type="email"
                value={recipientEmail}
                onChange={handleRecipientChange}
                size="small"
                sx={{ mt: 1 }}
              />
              <Button variant="contained" onClick={handleEmailSave} sx={{ ml: 1, mt: 1 }}>
                Save
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setEditingEmail(true)} sx={{ mt: 1 }}>
              Edit Email
            </Button>
          )}
        </Box>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Automatic Email Alerts:</strong> {autoEmail ? 'ON' : 'OFF'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mr: 1 }}>
            Toggle Auto Email:
          </Typography>
          <ToggleSwitch checked={autoEmail} onChange={handleAutoEmailToggle} />
        </Box>
      </Box>
      <ReactModal
        isOpen={!!selectedAlert}
        onRequestClose={() => setSelectedAlert(null)}
        contentLabel="Alert Details"
        style={{
          overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
          content: { backgroundColor: theme === 'light' ? '#fff' : '#444', color: theme === 'light' ? '#000' : '#fff' },
        }}
      >
        {selectedAlert && (
          <>
            <Typography variant="h5">{selectedAlert.name} Details</Typography>
            <Typography variant="body1">
              <strong>CPU Usage:</strong>{' '}
              {selectedAlert.last_updated && isVMOffline(selectedAlert.last_updated) ? '0%' : `${selectedAlert.cpu || 0}%`}
            </Typography>
            <Typography variant="body1">
              <strong>Memory Usage:</strong>{' '}
              {selectedAlert.last_updated && isVMOffline(selectedAlert.last_updated) ? '0%' : `${selectedAlert.memory || 0}%`}
            </Typography>
            <Typography variant="body1">
              <strong>Disk Usage:</strong>{' '}
              {selectedAlert.last_updated && isVMOffline(selectedAlert.last_updated) ? '0%' : `${selectedAlert.disk || 0}%`}
            </Typography>
            <Typography variant="body1">
              <strong>Network Usage:</strong>
            </Typography>
            {selectedAlert.last_updated && isVMOffline(selectedAlert.last_updated) ? (
              <Typography variant="body1">Offline</Typography>
            ) : (
              <Box>
                <Typography variant="body1">
                  <strong>Bytes Sent:</strong> {selectedAlert.network?.bytes_sent?.toLocaleString() || 0} B
                </Typography>
                <Typography variant="body1">
                  <strong>Bytes Received:</strong> {selectedAlert.network?.bytes_recv?.toLocaleString() || 0} B
                </Typography>
              </Box>
            )}
            <Button variant="contained" onClick={() => setSelectedAlert(null)} sx={{ mt: 2 }}>
              Close
            </Button>
          </>
        )}
      </ReactModal>
      <ToastContainer />
    </Box>
  );
}

export default Alerts;
