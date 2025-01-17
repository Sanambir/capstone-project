import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div
      style={{
        width: '250px',
        backgroundColor: '#343a40',
        color: '#fff',
        height: '100vh',
        padding: '20px',
      }}
    >
      <h3 style={{ color: '#fff', marginBottom: '20px' }}>Navigation</h3>
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
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#495057')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
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
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#495057')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            Alerts
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
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#495057')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            Settings
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
