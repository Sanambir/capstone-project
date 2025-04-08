import React, { useState, useContext } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import Sidebar from './Sidebar';
import { ThemeContext } from '../ThemeContext';

function DownloadScript() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const overviewData = {
    totalVMs: 0,
    runningVMs: 0,
    criticalVMs: 0,
  };

  const mainContainerStyle = {
    flex: 1,
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease, background-color 0.3s ease, color 0.3s ease',
    marginLeft: sidebarOpen ? '250px' : '0',
  };

  const handleDownload = async () => {
    try {
      const url = "https://raw.githubusercontent.com/Sanambir/capstone-project/refs/heads/main/Monitoring%20script/vm_agent.py";
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'vm_agent.py');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {sidebarOpen && <Sidebar overviewData={overviewData} onClose={toggleSidebar} />}
      <Box sx={mainContainerStyle}>
        {/* Header with burger menu and Back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FaBars 
            onClick={toggleSidebar} 
            style={{ fontSize: '24px', cursor: 'pointer', marginRight: '10px' }} 
          />
        </Box>

        {/* Download Script Section */}
        <Typography variant="h4" sx={{ mb: 2 }}>
          Download Monitoring Script
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Click the button below to download the monitoring script (vm_agent.py) directly from GitHub.
        </Typography>
        <Button
          variant="contained"
          onClick={handleDownload}
          sx={{ mb: 2 }}
        >
          Download vm_agent.py
        </Button>

        {/* Instructions Section */}
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          How to Run the Monitoring Script
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Prerequisites:</strong>
        </Typography>
        <Typography variant="body2" sx={{ ml: 2, mb: 2 }}>
          <ul>
            <li>
              <strong>Python 3.6+</strong> — Ensure Python is installed on your system.
            </li>
            <li>
              <strong>Required Python Packages:</strong> psutil, requests. Install them using:
              <code> pip install psutil requests </code>
            </li>
          </ul>
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Instructions by Operating System:</strong>
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          <ul>
            <li>
              <strong>Windows:</strong> Open Command Prompt, navigate to the folder where you saved the script, then run:
              <code> python vm_agent.py </code>
            </li>
            <li>
              <strong>Linux/macOS:</strong> Open Terminal, navigate to the folder where you saved the script, then run:
              <code> python3 vm_agent.py </code>
            </li>
          </ul>
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Follow any additional on-screen instructions provided by the script.
        </Typography>
      </Box>
    </Box>
  );
}

export default DownloadScript;