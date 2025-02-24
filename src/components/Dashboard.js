import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Button, MenuItem, Select as MuiSelect } from '@mui/material';
import { FaBars } from 'react-icons/fa';
import Sidebar from './Sidebar';
import DashboardOverview from './DashboardOverview';
import ReactModal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { ThemeContext } from '../ThemeContext';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-toastify/dist/ReactToastify.css';
import 'react-circular-progressbar/dist/styles.css';

ReactModal.setAppElement('#root');

const OFFLINE_THRESHOLD = 15000; // 15 seconds

function isVMOffline(lastUpdated) {
  const now = new Date();
  const lastUpdate = new Date(lastUpdated);
  return now - lastUpdate > OFFLINE_THRESHOLD;
}

function isCritical(vm, cpuThreshold, memoryThreshold) {
  if (!vm.last_updated) return false;
  const offline = isVMOffline(vm.last_updated);
  return !offline && (vm.cpu > cpuThreshold || vm.memory > memoryThreshold);
}

function isIdle(vm, idleThreshold = 20) {
  if (!vm.last_updated) return false;
  const offline = isVMOffline(vm.last_updated);
  return !offline && (vm.cpu < idleThreshold && vm.memory < idleThreshold);
}

function isRunning(vm, cpuThreshold, memoryThreshold, idleThreshold = 20) {
  if (!vm.last_updated) return false;
  const offline = isVMOffline(vm.last_updated);
  return !offline && !isCritical(vm, cpuThreshold, memoryThreshold) && !isIdle(vm, idleThreshold);
}

function Dashboard() {
  const { theme } = useContext(ThemeContext);
  const [vmData, setVmData] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedVM, setSelectedVM] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const rowsPerPage = 5;

  const cpuThreshold = Number(localStorage.getItem('cpuThreshold')) || 80;
  const memoryThreshold = Number(localStorage.getItem('memoryThreshold')) || 80;
  const idleThreshold = 20;

  // Fetch VM data every 5 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/vms');
        if (response.ok) {
          const data = await response.json();
          setVmData(data);
        } else {
          console.error('Failed to fetch VM data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update selected VM if its data changes.
  useEffect(() => {
    if (selectedVM) {
      const updatedVM = vmData.find((vm) => vm.id === selectedVM.id);
      if (updatedVM && updatedVM.last_updated !== selectedVM.last_updated) {
        setSelectedVM(updatedVM);
      }
    }
  }, [vmData, selectedVM]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const filteredData = vmData.filter((vm) => {
    const offline = !vm.last_updated || isVMOffline(vm.last_updated);
    const critical = isCritical(vm, cpuThreshold, memoryThreshold);
    const idle = !offline && isIdle(vm, idleThreshold);
    const running = !offline && isRunning(vm, cpuThreshold, memoryThreshold, idleThreshold);
    if (filter === 'All') return true;
    if (filter === 'Offline') return offline;
    if (filter === 'Critical') return critical;
    if (filter === 'Idle') return idle;
    if (filter === 'Running') return running;
    return false;
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const openModal = (vm) => setSelectedVM(vm);
  const closeModal = () => setSelectedVM(null);

  // Trigger toast for critical VMs
  useEffect(() => {
    filteredData.forEach((vm) => {
      const offline = !vm.last_updated || isVMOffline(vm.last_updated);
      if (!offline && isCritical(vm, cpuThreshold, memoryThreshold)) {
        toast.error(`VM ${vm.name} is in critical state!`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    });
  }, [filteredData, cpuThreshold, memoryThreshold]);

  const overviewData = {
    totalVMs: vmData.length,
    runningVMs: vmData.filter(
      (vm) => vm.last_updated && !isVMOffline(vm.last_updated) && isRunning(vm, cpuThreshold, memoryThreshold, idleThreshold)
    ).length,
    criticalVMs: vmData.filter((vm) => isCritical(vm, cpuThreshold, memoryThreshold)).length,
  };

  const mainContainerStyle = {
    marginLeft: sidebarOpen ? '250px' : '0',
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease, background-color 0.3s ease, color 0.3s ease',
    flex: 1,
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Card background colors
  const defaultCardBg = theme === 'light' ? '#fff' : '#333';
  const offlineCardBg = theme === 'light' ? '#e0e0e0' : '#444';
  const criticalCardBg = theme === 'light' ? '#ffcccc' : '#a94442';

  return (
    <Box sx={{ display: 'flex' }}>
      {sidebarOpen && <Sidebar overviewData={overviewData} onClose={toggleSidebar} />}
      <Box sx={mainContainerStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FaBars onClick={toggleSidebar} style={{ fontSize: '24px', cursor: 'pointer', marginRight: '10px' }} />
          <Typography variant="h4">Dashboard</Typography>
        </Box>
        <DashboardOverview {...overviewData} />
        <Box sx={{ mb: 2 }}>
          <Typography component="label" sx={{ fontWeight: 'bold', mr: 1 }}>
            Filter by Status:
          </Typography>
          <MuiSelect
            value={filter}
            onChange={handleFilterChange}
            sx={{ width: '200px', p: '5px 10px', borderRadius: '5px' }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Running">Running</MenuItem>
            <MenuItem value="Idle">Idle</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
            <MenuItem value="Offline">Offline</MenuItem>
          </MuiSelect>
        </Box>
        {currentRows.map((vm) => {
          const offline = !vm.last_updated || isVMOffline(vm.last_updated);
          let bgColor = defaultCardBg;
          if (offline) bgColor = offlineCardBg;
          else if (isCritical(vm, cpuThreshold, memoryThreshold)) bgColor = criticalCardBg;

          // If offline, we want to show "Offline" instead of numerical values.
          const cpuValue = offline ? 0 : vm.cpu || 0;
          const memValue = offline ? 0 : vm.memory || 0;
          const diskValue = offline ? 0 : vm.disk || 0;

          return (
            <Box
              key={vm.id}
              onClick={() => openModal(vm)}
              sx={{
                mb: 2,
                p: 2,
                border: '1px solid #ddd',
                borderRadius: '10px',
                backgroundColor: bgColor,
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
            >
              <Typography variant="h6">{vm.name}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                <Box sx={{ width: '80px', textAlign: 'center' }}>
                  <Typography variant="body2">CPU</Typography>
                  {offline ? (
                    <Typography variant="caption">Offline</Typography>
                  ) : (
                    <CircularProgressbar
                      value={cpuValue}
                      text={`${cpuValue}%`}
                      styles={buildStyles({
                        pathColor: `rgba(255, 0, 0, ${cpuValue / 100})`,
                        textColor: theme === 'light' ? '#000' : '#fff',
                        trailColor: '#d6d6d6',
                      })}
                    />
                  )}
                </Box>
                <Box sx={{ width: '80px', textAlign: 'center' }}>
                  <Typography variant="body2">Memory</Typography>
                  {offline ? (
                    <Typography variant="caption">Offline</Typography>
                  ) : (
                    <CircularProgressbar
                      value={memValue}
                      text={`${memValue}%`}
                      styles={buildStyles({
                        pathColor: `rgba(0, 0, 255, ${memValue / 100})`,
                        textColor: theme === 'light' ? '#000' : '#fff',
                        trailColor: '#d6d6d6',
                      })}
                    />
                  )}
                </Box>
                <Box sx={{ width: '80px', textAlign: 'center' }}>
                  <Typography variant="body2">Disk</Typography>
                  {offline ? (
                    <Typography variant="caption">Offline</Typography>
                  ) : (
                    <CircularProgressbar
                      value={diskValue}
                      text={`${diskValue}%`}
                      styles={buildStyles({
                        pathColor: `rgba(0, 255, 0, ${diskValue / 100})`,
                        textColor: theme === 'light' ? '#000' : '#fff',
                        trailColor: '#d6d6d6',
                      })}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button variant="contained" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} sx={{ mr: 1 }}>
            Previous
          </Button>
          <Typography variant="body1" component="span" sx={{ mx: 1 }}>
            Page {currentPage} of {totalPages}
          </Typography>
          <Button variant="contained" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} sx={{ ml: 1 }}>
            Next
          </Button>
        </Box>
        <ReactModal
          isOpen={!!selectedVM}
          onRequestClose={closeModal}
          contentLabel="VM Details"
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
            content: { backgroundColor: theme === 'light' ? '#fff' : '#444', color: theme === 'light' ? '#000' : '#fff' },
          }}
        >
          {selectedVM && (
            <>
              <Typography variant="h5">{selectedVM.name} Details</Typography>
              <Typography variant="body1">
                <strong>CPU Usage:</strong>{' '}
                {selectedVM.last_updated && isVMOffline(selectedVM.last_updated)
                  ? 'Offline'
                  : `${selectedVM.cpu || 0}%`}
              </Typography>
              <Typography variant="body1">
                <strong>Memory Usage:</strong>{' '}
                {selectedVM.last_updated && isVMOffline(selectedVM.last_updated)
                  ? 'Offline'
                  : `${selectedVM.memory || 0}%`}
              </Typography>
              <Typography variant="body1">
                <strong>Disk Usage:</strong>{' '}
                {selectedVM.last_updated && isVMOffline(selectedVM.last_updated)
                  ? 'Offline'
                  : `${selectedVM.disk || 0}%`}
              </Typography>
              <Typography variant="body1">
                <strong>Network Usage:</strong>
              </Typography>
              {selectedVM.last_updated && isVMOffline(selectedVM.last_updated) ? (
                <Typography variant="body1">Offline</Typography>
              ) : (
                <Box>
                  <Typography variant="body1">
                    <strong>Bytes Sent:</strong> {selectedVM.network?.bytes_sent?.toLocaleString() || 0} B
                  </Typography>
                  <Typography variant="body1">
                    <strong>Bytes Received:</strong> {selectedVM.network?.bytes_recv?.toLocaleString() || 0} B
                  </Typography>
                </Box>
              )}
              <Button variant="contained" onClick={closeModal} sx={{ mt: 2 }}>
                Close
              </Button>
            </>
          )}
        </ReactModal>
        <ToastContainer />
      </Box>
    </Box>
  );
}

export default Dashboard;
