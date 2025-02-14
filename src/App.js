import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import Login from './components/Login';
import ManageVMs from './components/ManageVMs';
import PerformanceChart from './components/PerformanceChart';

// Wrapper component to extract vmId from the URL parameters
function PerformanceChartWrapper() {
  const { vmId } = useParams();
  return <PerformanceChart vmId={vmId} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/manage" element={<ManageVMs />} />
        <Route path="/performance/:vmId" element={<PerformanceChartWrapper />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
