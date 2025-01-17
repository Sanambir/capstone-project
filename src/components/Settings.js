import React, { useState } from 'react';
import Sidebar from './Sidebar';

function Settings() {
  const [cpuThreshold, setCpuThreshold] = useState(80);
  const [memoryThreshold, setMemoryThreshold] = useState(80);

  const handleThresholdChange = () => {
    localStorage.setItem('cpuThreshold', cpuThreshold);
    localStorage.setItem('memoryThreshold', memoryThreshold);
    alert('Thresholds updated successfully!');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Settings</h2>
        <div>
          <h3>Alert Thresholds</h3>
          <label>
            CPU Threshold (%):
            <input
              type="number"
              value={cpuThreshold}
              onChange={(e) => setCpuThreshold(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
          <br />
          <label>
            Memory Threshold (%):
            <input
              type="number"
              value={memoryThreshold}
              onChange={(e) => setMemoryThreshold(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
          <br />
          <button onClick={handleThresholdChange}>Save Thresholds</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
