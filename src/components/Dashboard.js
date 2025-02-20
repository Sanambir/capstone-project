import React, { useState, useEffect, useContext } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Sidebar from './Sidebar';
import DashboardOverview from './DashboardOverview';
import ReactModal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeContext } from '../ThemeContext';

ReactModal.setAppElement('#root');

const OFFLINE_THRESHOLD = 15000; // 15 seconds

// Helper: Check if a VM is offline.
function isVMOffline(lastUpdated) {
  const now = new Date();
  const lastUpdate = new Date(lastUpdated);
  return now - lastUpdate > OFFLINE_THRESHOLD;
}

// Helper: Determine if a VM is critical.
function isCritical(vm, cpuThreshold, memoryThreshold) {
  if (!vm.last_updated) return false;
  const offline = isVMOffline(vm.last_updated);
  return !offline && (vm.cpu > cpuThreshold || vm.memory > memoryThreshold);
}

// Helper: Determine if a VM is idle (e.g., both CPU and memory below idleThreshold).
function isIdle(vm, idleThreshold = 20) {
  if (!vm.last_updated) return false;
  const offline = isVMOffline(vm.last_updated);
  return !offline && (vm.cpu < idleThreshold && vm.memory < idleThreshold);
}

// Helper: Determine if a VM is running (online but not critical and not idle).
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
  const rowsPerPage = 5;

  // Retrieve thresholds (defaults: 80 for cpu and memory, 20 for idle)
  const cpuThreshold = Number(localStorage.getItem('cpuThreshold')) || 80;
  const memoryThreshold = Number(localStorage.getItem('memoryThreshold')) || 80;
  const idleThreshold = 20;

  // Fetch VM data every 5 seconds.
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

  // Update selectedVM when vmData changes.
  useEffect(() => {
    if (selectedVM) {
      const updatedVM = vmData.find((vm) => vm.id === selectedVM.id);
      if (updatedVM && updatedVM.last_updated !== selectedVM.last_updated) {
        setSelectedVM(updatedVM);
      }
    }
  }, [vmData, selectedVM]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // Handle filter change.
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  // Filtering logic.
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

  // Pagination logic.
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openModal = (vm) => setSelectedVM(vm);
  const closeModal = () => setSelectedVM(null);

  const selectedOffline =
    selectedVM && selectedVM.last_updated ? isVMOffline(selectedVM.last_updated) : false;

  // Toast notifications for critical VMs.
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

  // Compute overview data.
  const overviewData = {
    totalVMs: vmData.length,
    runningVMs: vmData.filter((vm) => vm.last_updated && !isVMOffline(vm.last_updated) && isRunning(vm, cpuThreshold, memoryThreshold, idleThreshold)).length,
    criticalVMs: vmData.filter((vm) => isCritical(vm, cpuThreshold, memoryThreshold)).length,
  };

  // Container style based on theme.
  const containerStyle = {
    flex: 1,
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar overviewData={overviewData} />
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>Dashboard</h2>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 15px',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>

        {/* Dashboard Overview */}
        <DashboardOverview {...overviewData} />

        {/* Filter Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="filter">Filter by Status: </label>
          <select id="filter" value={filter} onChange={handleFilterChange}>
            <option value="All">All</option>
            <option value="Running">Running</option>
            <option value="Idle">Idle</option>
            <option value="Critical">Critical</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        {/* VM Cards */}
        {currentRows.map((vm) => {
          const offline = !vm.last_updated || isVMOffline(vm.last_updated);
          let bgColor = '#fff';
          if (offline) {
            bgColor = '#e0e0e0';
          } else if (isCritical(vm, cpuThreshold, memoryThreshold)) {
            bgColor = '#ffcccc';
          }
          return (
            <div
              key={vm.id}
              onClick={() => openModal(vm)}
              style={{
                marginBottom: '20px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                backgroundColor: bgColor,
                cursor: 'pointer',
              }}
            >
              <h3>{vm.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <h4>CPU Usage</h4>
                  <CircularProgressbar
                    value={offline ? 0 : vm.cpu || 0}
                    text={`${offline ? 0 : vm.cpu || 0}%`}
                    styles={buildStyles({
                      pathColor: `rgba(255, 0, 0, ${offline ? 0 : vm.cpu / 100})`,
                      textColor: theme === 'light' ? '#000' : '#fff',
                      trailColor: '#d6d6d6',
                    })}
                  />
                </div>
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <h4>Memory Usage</h4>
                  <CircularProgressbar
                    value={offline ? 0 : vm.memory || 0}
                    text={`${offline ? 0 : vm.memory || 0}%`}
                    styles={buildStyles({
                      pathColor: `rgba(255, 0, 0, ${offline ? 0 : vm.memory / 100})`,
                      textColor: theme === 'light' ? '#000' : '#fff',
                      trailColor: '#d6d6d6',
                    })}
                  />
                </div>
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <h4>Disk Usage</h4>
                  <CircularProgressbar
                    value={offline ? 0 : vm.disk || 0}
                    text={`${offline ? 0 : vm.disk || 0}%`}
                    styles={buildStyles({
                      pathColor: `rgba(0, 0, 255, ${offline ? 0 : vm.disk / 100})`,
                      textColor: theme === 'light' ? '#000' : '#fff',
                      trailColor: '#d6d6d6',
                    })}
                  />
                </div>
              </div>
              {offline && (
                <div style={{ textAlign: 'center', marginTop: '10px', color: '#dc3545', fontWeight: 'bold' }}>
                  Offline
                </div>
              )}
            </div>
          );
        })}

        {/* Pagination */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </button>
          <span style={{ margin: '0 10px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>

        {/* Modal for VM Details */}
        {selectedVM && (
          <ReactModal isOpen={!!selectedVM} onRequestClose={closeModal} contentLabel="VM Details">
            <h2>{selectedVM.name} Details</h2>
            <p>
              <strong>CPU Usage:</strong> {selectedOffline ? '0%' : `${selectedVM.cpu || 0}%`}
            </p>
            <p>
              <strong>Memory Usage:</strong> {selectedOffline ? '0%' : `${selectedVM.memory || 0}%`}
            </p>
            <p>
              <strong>Disk Usage:</strong> {selectedOffline ? '0%' : `${selectedVM.disk || 0}%`}
            </p>
            <p>
              <strong>Network Usage:</strong>
            </p>
            {selectedOffline ? (
              <p>Offline</p>
            ) : (
              <div>
                <p>
                  <strong>Bytes Sent:</strong> {selectedVM.network?.bytes_sent?.toLocaleString() || 0} B
                </p>
                <p>
                  <strong>Bytes Received:</strong> {selectedVM.network?.bytes_recv?.toLocaleString() || 0} B
                </p>
              </div>
            )}
            <button onClick={closeModal} style={{ marginTop: '15px' }}>
              Close
            </button>
          </ReactModal>
        )}
        <ToastContainer />
      </div>
    </div>
  );
}

export default Dashboard;
