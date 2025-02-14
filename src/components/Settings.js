import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

function Settings() {
  const [cpuThreshold, setCpuThreshold] = useState(80);
  const [memoryThreshold, setMemoryThreshold] = useState(80);
  const [emailFrequency, setEmailFrequency] = useState(5);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load settings from localStorage (if available)
    const storedCpu = localStorage.getItem('cpuThreshold');
    const storedMemory = localStorage.getItem('memoryThreshold');
    const storedEmailFrequency = localStorage.getItem('emailFrequency');

    if (storedCpu) setCpuThreshold(Number(storedCpu));
    if (storedMemory) setMemoryThreshold(Number(storedMemory));
    if (storedEmailFrequency) setEmailFrequency(Number(storedEmailFrequency));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save settings to localStorage
    localStorage.setItem('cpuThreshold', cpuThreshold);
    localStorage.setItem('memoryThreshold', memoryThreshold);
    localStorage.setItem('emailFrequency', emailFrequency);
    setMessage('Settings saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Settings</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ marginRight: '10px' }}>
              CPU Critical Threshold (%):
            </label>
            <input
              type="number"
              value={cpuThreshold}
              onChange={(e) => setCpuThreshold(e.target.value)}
              required
              style={{ padding: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ marginRight: '10px' }}>
              Memory Critical Threshold (%):
            </label>
            <input
              type="number"
              value={memoryThreshold}
              onChange={(e) => setMemoryThreshold(e.target.value)}
              required
              style={{ padding: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ marginRight: '10px' }}>
              Automatic Email Frequency (minutes):
            </label>
            <input
              type="number"
              value={emailFrequency}
              onChange={(e) => setEmailFrequency(e.target.value)}
              required
              style={{ padding: '5px' }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            Save Settings
          </button>
        </form>
        {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      </div>
    </div>
  );
}

export default Settings;
