import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Alerts from './components/Alerts';
import ManageVMs from './components/ManageVMs';
import PerformanceChart from './components/PerformanceChart';
import Settings from './components/Settings';
import Login from './components/Login';
import Signup from './components/Signup';
import { ThemeProvider } from './ThemeContext'; // Ensure this is your custom provider

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/manage" element={<ManageVMs />} />
          <Route path="/performance" element={<PerformanceChart />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
