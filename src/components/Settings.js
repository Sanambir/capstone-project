import React, { useState, useEffect, useContext } from 'react';
import { FaBars } from 'react-icons/fa';
import Sidebar from './Sidebar';
import { ThemeContext } from '../ThemeContext';

function Settings() {
  // Settings state
  const [cpuThreshold, setCpuThreshold] = useState(80);
  const [memoryThreshold, setMemoryThreshold] = useState(80);
  const [emailFrequency, setEmailFrequency] = useState(5);
  const [message, setMessage] = useState('');
  // For VM stats and sidebar integration
  const [vmData, setVmData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const idleThreshold = 20;
  const cpuThresholdLocal = Number(localStorage.getItem('cpuThreshold')) || 80;
  const memoryThresholdLocal = Number(localStorage.getItem('memoryThreshold')) || 80;

  // Fetch VM data every 5 seconds
  useEffect(() => {
    const fetchVmData = async () => {
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

    fetchVmData();
    const interval = setInterval(fetchVmData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper functions (similar to Dashboard.js)
  function isVMOffline(lastUpdated) {
    const now = new Date();
    const lastUpdate = new Date(lastUpdated);
    const OFFLINE_THRESHOLD = 15000; // 15 seconds
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

  // Calculate overview data from the fetched VM stats
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

  // Load saved settings from localStorage
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
    flex: 1,
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease, color 0.3s ease'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header with burger menu and page title */}
      
      <div style={{ display: 'flex' }}>
        {sidebarOpen && <Sidebar overviewData={overviewData} onClose={toggleSidebar} />}
        <div style={containerStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FaBars onClick={toggleSidebar} style={{ fontSize: '24px', cursor: 'pointer', marginRight: '10px' }} />
            <h2 style={{ margin: 0 }}>Settings</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ marginRight: '10px' }}>CPU Critical Threshold (%):</label>
              <input
                type="number"
                value={cpuThreshold}
                onChange={(e) => setCpuThreshold(Number(e.target.value))}
                required
                style={{ padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ marginRight: '10px' }}>Memory Critical Threshold (%):</label>
              <input
                type="number"
                value={memoryThreshold}
                onChange={(e) => setMemoryThreshold(Number(e.target.value))}
                required
                style={{ padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ marginRight: '10px' }}>Automatic Email Frequency (minutes):</label>
              <input
                type="number"
                value={emailFrequency}
                onChange={(e) => setEmailFrequency(Number(e.target.value))}
                required
                style={{ padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Dark Mode:</label>
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  padding: '10px 15px',
                  backgroundColor: theme === 'light' ? '#007bff' : '#444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {theme === 'light' ? 'Enable Dark Mode' : 'Disable Dark Mode'}
              </button>
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '5px'
              }}
            >
              Save Settings
            </button>
          </form>
          {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default Settings;
