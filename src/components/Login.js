import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, TextField } from '@mui/material';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === 'admin' && password === 'password') {
      localStorage.setItem('authToken', 'mockToken123');
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f4f4f4',
      }}
    >
      <Box
        sx={{
          width: '300px',
          p: 2,
          border: '1px solid #ddd',
          borderRadius: '10px',
          backgroundColor: '#fff',
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          Login
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button onClick={handleLogin} variant="contained" fullWidth>
          Login
        </Button>
      </Box>
    </Box>
  );
}

export default Login;
