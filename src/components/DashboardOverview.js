import React, { useContext } from 'react';
import { ThemeContext } from '../ThemeContext';

function DashboardOverview({ totalVMs = 0, runningVMs = 0, criticalVMs = 0 }) {
  const { theme } = useContext(ThemeContext);

  // Define styles based on theme
  const cardStyle = {
    backgroundColor: theme === 'light' ? '#fff' : '#444', // white for light, dark gray for dark mode
    border: `1px solid ${theme === 'light' ? '#ddd' : '#666'}`,
    borderRadius: '8px',
    padding: '20px',
    margin: '10px',
    flex: '1',
    textAlign: 'center',
    color: theme === 'light' ? '#000' : '#fff',
  };

  return (
    <div style={{ display: 'flex', marginBottom: '20px', flexWrap: 'wrap' }}>
      <div style={cardStyle}>
        <h4>Total VMs</h4>
        <p>{totalVMs}</p>
      </div>
      <div style={cardStyle}>
        <h4>Running VMs</h4>
        <p>{runningVMs}</p>
      </div>
      <div style={cardStyle}>
        <h4>Critical VMs</h4>
        <p>{criticalVMs}</p>
      </div>
    </div>
  );
}

export default DashboardOverview;
