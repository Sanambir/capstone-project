import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';
import { FaTimes } from 'react-icons/fa';
import { Box, Button, Typography } from '@mui/material';

function Sidebar({ overviewData, onClose, style }) {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('User');

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
    display: 'flex',
    flexDirection: 'column',
    ...style,
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    navigate('/');
  };

  // Instead of decoding JWT, retrieve the username from localStorage.
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <div style={sidebarStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Navigation
        </Typography>
        {onClose && <FaTimes onClick={onClose} style={{ cursor: 'pointer', fontSize: '20px' }} />}
      </div>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Welcome, {username}!
      </Typography>
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
          <Typography variant="body2">Total VMs: {overviewData.totalVMs}</Typography>
          <Typography variant="body2">Running: {overviewData.runningVMs}</Typography>
          <Typography variant="body2">Critical: {overviewData.criticalVMs}</Typography>
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, flexGrow: 1 }}>
        <li style={{ marginBottom: '15px' }}>
          <Typography
            component={Link}
            to="/dashboard"
            variant="body1"
            sx={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Dashboard
          </Typography>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <Typography
            component={Link}
            to="/alerts"
            variant="body1"
            sx={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Alerts
          </Typography>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <Typography
            component={Link}
            to="/manage"
            variant="body1"
            sx={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Manage VMs
          </Typography>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <Typography
            component={Link}
            to="/performance"
            variant="body1"
            sx={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Performance
          </Typography>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <Typography
            component={Link}
            to="/settings"
            variant="body1"
            sx={{
              color: '#fff',
              textDecoration: 'none',
              padding: '10px',
              display: 'block',
              borderRadius: '5px',
            }}
          >
            Settings
          </Typography>
        </li>
      </ul>
      <Box sx={{ mt: 'auto' }}>
        <Button variant="contained" color="error" onClick={handleLogout} fullWidth>
          Logout
        </Button>
      </Box>
    </div>
  );
}

export default Sidebar;