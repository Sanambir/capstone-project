import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';

function Sidebar({ overviewData }) {
  const { theme } = useContext(ThemeContext);
  const backgroundColor = theme === 'light' ? '#343a40' : '#222';
  const textColor = '#fff';

  return (
    <div
      style={{
        width: '250px',
        backgroundColor: backgroundColor,
        color: textColor,
        height: '100vh',
        padding: '20px',
      }}
    >
      <h3 style={{ marginBottom: '20px' }}>Navigation</h3>
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '15px' }}>
          <Link 
            to="/dashboard" 
            style={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px'
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
              borderRadius: '5px'
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
              borderRadius: '5px'
            }}
          >
            Manage VMs
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
              borderRadius: '5px'
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
