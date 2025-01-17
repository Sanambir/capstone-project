import React, { useState } from 'react';
import Sidebar from './Sidebar';


function Alerts() {
  // Example alert data
  const [alerts, setAlerts] = useState([
    { id: 1, name: 'VM 3', cpu: 85, memory: 90, acknowledged: false },
    { id: 2, name: 'VM 5', cpu: 50, memory: 40, acknowledged: false },
  ]);

  const [filter, setFilter] = useState('All');

  const handleAcknowledge = (id) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'All') return !alert.acknowledged;
    if (filter === 'CPU') return !alert.acknowledged && alert.cpu > 80;
    if (filter === 'Memory') return !alert.acknowledged && alert.memory > 80;
    return !alert.acknowledged;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f4f4' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Filter Alerts:</label>
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
          {filteredAlerts.length > 0 ? (
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {filteredAlerts.map((alert) => (
                <li
                  key={alert.id}
                  style={{
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <strong>{alert.name}</strong> is in a{' '}
                  <span style={{ color: 'red' }}>Critical</span> state (CPU: {alert.cpu}%, Memory: {alert.memory}%)
                  <br />
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
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
