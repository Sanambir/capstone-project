import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import { FaBars } from 'react-icons/fa';
import Sidebar from './Sidebar';
import { ThemeContext } from '../ThemeContext';

function Settings() {
  const [cpuThreshold, setCpuThreshold] = useState(80);
  const [memoryThreshold, setMemoryThreshold] = useState(80);
  const [emailFrequency, setEmailFrequency] = useState(5);
  const [message, setMessage] = useState('');
  const [vmData, setVmData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const idleThreshold = 20;
  const cpuThresholdLocal = Number(localStorage.getItem('cpuThreshold')) || 80;
  const memoryThresholdLocal = Number(localStorage.getItem('memoryThreshold')) || 80;

  useEffect(() => {
    const fetchVmData = async () => {
      try {
        const response = await fetch('https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net/vms');
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

    fetchVmData();
    const interval = setInterval(fetchVmData, 5000);
    return () => clearInterval(interval);
  }, []);

  function isVMOffline(lastUpdated) {
    const now = new Date();
    const lastUpdate = new Date(lastUpdated);
    const OFFLINE_THRESHOLD = 15000;
    return now - lastUpdate > OFFLINE_THRESHOLD;
  }

  function isCritical(vm, cpuThreshold, memoryThreshold) {
    if (!vm.last_updated) return false;
    const offline = isVMOffline(vm.last_updated);
    return !offline && (vm.cpu > cpuThreshold || vm.memory > memoryThreshold);
  }

  function isIdle(vm, idleThreshold = 20) {
    if (!vm.last_updated) return false;
    const offline = isVMOffline(vm.last_updated);
    return !offline && (vm.cpu < idleThreshold && vm.memory < idleThreshold);
  }

  function isRunning(vm, cpuThreshold, memoryThreshold, idleThreshold = 20) {
    if (!vm.last_updated) return false;
    const offline = isVMOffline(vm.last_updated);
    return !offline && !isCritical(vm, cpuThreshold, memoryThreshold) && !isIdle(vm, idleThreshold);
  }

  const overviewData = {
    totalVMs: vmData.length,
    runningVMs: vmData.filter(
      (vm) =>
        vm.last_updated &&
        !isVMOffline(vm.last_updated) &&
        isRunning(vm, cpuThresholdLocal, memoryThresholdLocal, idleThreshold)
    ).length,
    criticalVMs: vmData.filter((vm) => isCritical(vm, cpuThresholdLocal, memoryThresholdLocal)).length,
  };

  useEffect(() => {
    const storedCpu = localStorage.getItem('cpuThreshold');
    const storedMemory = localStorage.getItem('memoryThreshold');
    const storedEmailFrequency = localStorage.getItem('emailFrequency');

    if (storedCpu) setCpuThreshold(Number(storedCpu));
    if (storedMemory) setMemoryThreshold(Number(storedMemory));
    if (storedEmailFrequency) setEmailFrequency(Number(storedEmailFrequency));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('cpuThreshold', cpuThreshold);
    localStorage.setItem('memoryThreshold', memoryThreshold);
    localStorage.setItem('emailFrequency', emailFrequency);
    setMessage('Settings saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const containerStyle = {
    marginLeft: sidebarOpen ? '250px' : '0',
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease, background-color 0.3s ease, color 0.3s ease',
    flex: 1,
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {sidebarOpen && <Sidebar overviewData={overviewData} onClose={toggleSidebar} />}
      <Box sx={containerStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FaBars onClick={toggleSidebar} style={{ fontSize: '24px', cursor: 'pointer', mr: '10px' }} />
          <Typography variant="h4">Settings</Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
          <Box sx={{ mb: 1 }}>
            <TextField
              label="CPU Critical Threshold (%)"
              type="number"
              value={cpuThreshold}
              onChange={(e) => setCpuThreshold(Number(e.target.value))}
              required
              size="small"
            />
          </Box>
          <Box sx={{ mb: 1 }}>
            <TextField
              label="Memory Critical Threshold (%)"
              type="number"
              value={memoryThreshold}
              onChange={(e) => setMemoryThreshold(Number(e.target.value))}
              required
              size="small"
            />
          </Box>
          <Box sx={{ mb: 1 }}>
            <TextField
              label="Automatic Email Frequency (minutes)"
              type="number"
              value={emailFrequency}
              onChange={(e) => setEmailFrequency(Number(e.target.value))}
              required
              size="small"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
              Dark Mode:
            </Typography>
            <Button
              type="button"
              onClick={toggleTheme}
              variant="contained"
              sx={{
                backgroundColor: theme === 'light' ? '#007bff' : '#444',
                color: '#fff',
                borderRadius: '5px',
              }}
            >
              {theme === 'light' ? 'Enable Dark Mode' : 'Disable Dark Mode'}
            </Button>
          </Box>
          <Button type="submit" variant="contained" color="success">
            Save Settings
          </Button>
        </Box>
        {message && <Typography color="success.main">{message}</Typography>}
      </Box>
    </Box>
  );
}

export default Settings;
