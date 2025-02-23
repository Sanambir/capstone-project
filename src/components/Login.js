import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Mock authentication logic
    if (username === 'admin' && password === 'password') {
      localStorage.setItem('authToken', 'mockToken123');
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f4f4f4'
    }}>
      <div style={{
        width: '300px', 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '10px', 
        backgroundColor: '#fff'
      }}>
        <h2>Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '90%', margin: '10px 0', padding: '10px' }}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '90%', margin: '10px 0', padding: '10px' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleLogin}
            style={{
              width: '30%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              textAlign: 'center',
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
