import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || ''}/api/auth/login`,
        { email, password }
      );
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        if (response.data.username) {
          localStorage.setItem('username', response.data.username);
        } else {
          const userRes = await axios.get(
            `${process.env.REACT_APP_API_URL || ''}/api/users?email=${email}`
          );
          if (userRes.data && Array.isArray(userRes.data) && userRes.data.length > 0) {
            localStorage.setItem('username', userRes.data[0].username);
          }
        }
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f4f4f4',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}
      >
        <img
          src="/logo192.png" // Replace with the path to your logo
          alt="Logo"
          style={{ width: '100px', marginBottom: '20px' }}
        />
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>
        {error && (
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <TextField
          label="Email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2, width: '100%' }}
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2, width: '100%' }}
        />
        <Button variant="contained" onClick={handleLogin} sx={{ width: '100%', mb: 2 }}>
          Login
        </Button>
        <Typography variant="body2">
          Don't have an account?{' '}
          <Link to="/signup" style={{ textDecoration: 'none', color: '#1976d2' }}>
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

export default Login;