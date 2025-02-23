import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';
import { FaTimes } from 'react-icons/fa';

function Sidebar({ overviewData, onClose, style }) {
  const { theme } = useContext(ThemeContext);
  const backgroundColor = theme === 'light' ? '#343a40' : '#111';
  const cardBackground = theme === 'light' ? '#495057' : '#333';

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '250px',
    backgroundColor,
    color: '#fff',
    overflowY: 'auto',
    padding: '20px',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    ...style, // merge any passed style
  };

  return (
    <div style={sidebarStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ marginBottom: '20px' }}>Navigation</h3>
        {onClose && <FaTimes onClick={onClose} style={{ cursor: 'pointer', fontSize: '20px' }} />}
      </div>
      {overviewData && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: cardBackground,
            borderRadius: '5px',
            fontSize: '0.9em',
          }}
        >
          <p>Total VMs: {overviewData.totalVMs}</p>
          <p>Running: {overviewData.runningVMs}</p>
          <p>Critical: {overviewData.criticalVMs}</p>
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '15px' }}>
          <Link
            to="/dashboard"
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Dashboard
          </Link>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <Link
            to="/alerts"
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Alerts
          </Link>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <Link
            to="/manage"
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Manage VMs
          </Link>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <Link
            to="/performance"
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Performance
          </Link>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <Link
            to="/settings"
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Settings
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
