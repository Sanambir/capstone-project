import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { ThemeContext } from '../ThemeContext';
import { FaBars } from 'react-icons/fa';
import ReactModal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Typography, Button, TextField, Switch } from '@mui/material';

ReactModal.setAppElement('#root');

const OFFLINE_THRESHOLD = 15000; // 15 seconds

function isVMOffline(lastUpdated) {
  const now = new Date();
  const lastUpdate = new Date(lastUpdated);
  return now - lastUpdate > OFFLINE_THRESHOLD;
}

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
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmail, setEditingEmail] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const rowsPerPage = 5;
  const emailFrequency = Number(localStorage.getItem('emailFrequency')) || 5; // minutes

  const cpuThreshold = Number(localStorage.getItem('cpuThreshold')) || 80;
  const memoryThreshold = Number(localStorage.getItem('memoryThreshold')) || 80;

  // Define default card background.
  const defaultCardBg = theme === 'light' ? '#fff' : '#333';

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
        const response = await fetch(
          'https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net/vms'
        );
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

  // Determine critical alerts.
  const allCriticalVMs = vmData.filter((vm) => {
    const online = vm.last_updated && !isVMOffline(vm.last_updated);
    return online && (vm.cpu > cpuThreshold || vm.memory > memoryThreshold);
  });

  const unacknowledgedCritical = allCriticalVMs.filter((vm) => !acknowledgedAlerts[vm.id]);
  const acknowledgedCritical = allCriticalVMs.filter((vm) => acknowledgedAlerts[vm.id]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = unacknowledgedCritical.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(unacknowledgedCritical.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // Handler functions.
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

  // Wrap sendEmailAlert in useCallback.
  const sendEmailAlert = useCallback(
    async (vm, e) => {
      if (e) e.stopPropagation();
      try {
        const response = await axios.post('https://capstone-email-server-cxcaazggfrg2g6hc.canadacentral-01.azurewebsites.net/send-alert', {
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
    },
    [recipientEmail]
  );

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
  }, [autoEmail, unacknowledgedCritical, emailFrequency, recipientEmail, autoEmailSent, sendEmailAlert]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Modal open and close handlers.
  const openModal = (vm, e) => {
    if (e) e.stopPropagation();
    setSelectedAlert(vm);
  };
  const closeModal = () => setSelectedAlert(null);

  // Trigger toast for critical alerts.
  useEffect(() => {
    allCriticalVMs.forEach((vm) => {
      const offline = !vm.last_updated || isVMOffline(vm.last_updated);
      if (!offline && isCritical(vm, cpuThreshold, memoryThreshold)) {
        toast.error(`VM ${vm.name} is in critical state!`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    });
  }, [allCriticalVMs, cpuThreshold, memoryThreshold]);

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

  const mainContainerStyle = {
    marginLeft: sidebarOpen ? '250px' : '0',
    marginRight: '0px', // Reserve 300px for User Info panel
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
    transition: 'margin 0.3s ease, background-color 0.3s ease, color 0.3s ease',
    flex: 2,
  };

  const userInfoStyle = {
    width: '300px',
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f9f9f9' : '#333',
    borderLeft: '1px solid #ddd',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    flex: 1,
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {sidebarOpen && <Sidebar overviewData={overviewData} onClose={toggleSidebar} />}
      <Box sx={mainContainerStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FaBars onClick={toggleSidebar} style={{ fontSize: '24px', cursor: 'pointer', marginRight: '10px' }} />
          <Typography variant="h4">Alerts</Typography>
        </Box>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Unacknowledged Alerts
        </Typography>
        {currentRows.length > 0 ? (
          <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
            {currentRows.map((vm) => (
              <Box
                key={vm.id}
                onClick={(e) => openModal(vm, e)}
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
                <Box sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    onClick={(e) => { e.stopPropagation(); handleAcknowledge(vm.id); }}
                    sx={{ mr: 1 }}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    variant="contained"
                    onClick={(e) => { e.stopPropagation(); sendEmailAlert(vm, e); }}
                    sx={{ ml: 1 }}
                  >
                    Send Email
                  </Button>
                </Box>
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
                onChange={(e) => setRecipientEmail(e.target.value)}
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
          <Switch checked={autoEmail} onChange={handleAutoEmailToggle} />
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
              {selectedAlert.last_updated && isVMOffline(selectedAlert.last_updated)
                ? 'Offline'
                : `${selectedAlert.cpu || 0}%`}
            </Typography>
            <Typography variant="body1">
              <strong>Memory Usage:</strong>{' '}
              {selectedAlert.last_updated && isVMOffline(selectedAlert.last_updated)
                ? 'Offline'
                : `${selectedAlert.memory || 0}%`}
            </Typography>
            <Typography variant="body1">
              <strong>Disk Usage:</strong>{' '}
              {selectedAlert.last_updated && isVMOffline(selectedAlert.last_updated)
                ? 'Offline'
                : `${selectedAlert.disk || 0}%`}
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
