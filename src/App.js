import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Alerts from './components/Alerts';
import ManageVMs from './components/ManageVMs';
import PerformanceChart from './components/PerformanceChart';
import Settings from './components/Settings';
import Login from './components/Login';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light', // Change dynamically as needed
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/manage" element={<ManageVMs />} />
            <Route path="/performance" element={<PerformanceChart />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
