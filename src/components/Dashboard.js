import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Sidebar from './Sidebar';
import ReactModal from 'react-modal';

ReactModal.setAppElement('#root');

const CRITICAL_THRESHOLD = 80;
const OFFLINE_THRESHOLD = 10000; // 10 seconds

function Dashboard() {
  const [vmData, setVmData] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedVM, setSelectedVM] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Helper function to check if a VM is offline based on its last_updated timestamp.
  const isVMOffline = (lastUpdated) => {
    const now = new Date();
    const lastUpdate = new Date(lastUpdated);
    return now - lastUpdate > OFFLINE_THRESHOLD;
  };

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
  }, []); // Runs once on mount

  // Update the selected VM when either vmData or selectedVM changes.
  useEffect(() => {
    if (selectedVM) {
      const updatedVM = vmData.find((vm) => vm.id === selectedVM.id);
      // Only update if there's a change (compare last_updated timestamps)
      if (updatedVM && updatedVM.last_updated !== selectedVM.last_updated) {
        setSelectedVM(updatedVM);
      }
    }
  }, [vmData, selectedVM]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  // Filter VMs based on the selected filter.
  const filteredData = vmData.filter((vm) => {
    if (filter === 'All') return true;
    if (
      filter === 'Critical' &&
      (vm.cpu > CRITICAL_THRESHOLD || vm.memory > CRITICAL_THRESHOLD)
    )
      return true;
    return vm.status === filter;
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

  // Determine offline status for the modal.
  const selectedOffline =
    selectedVM && selectedVM.last_updated ? isVMOffline(selectedVM.last_updated) : false;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
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

        {/* Filter */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="filter">Filter by Status: </label>
          <select id="filter" value={filter} onChange={handleFilterChange}>
            <option value="All">All</option>
            <option value="Running">Running</option>
            <option value="Idle">Idle</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* VM Cards */}
        {currentRows.map((vm) => {
          const offline = vm.last_updated && isVMOffline(vm.last_updated);
          return (
            <div
              key={vm.id}
              onClick={() => openModal(vm)}
              style={{
                marginBottom: '20px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                backgroundColor:
                  vm.cpu > CRITICAL_THRESHOLD || vm.memory > CRITICAL_THRESHOLD ? '#ffcccc' : '#fff',
                cursor: 'pointer',
              }}
            >
              <h3>{vm.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                {/* CPU Usage */}
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <h4>CPU Usage</h4>
                  <CircularProgressbar
                    value={offline ? 0 : vm.cpu || 0}
                    text={`${offline ? 0 : vm.cpu || 0}%`}
                    styles={buildStyles({
                      pathColor: `rgba(255, 0, 0, ${(offline ? 0 : vm.cpu) / 100})`,
                      textColor: '#000',
                      trailColor: '#d6d6d6',
                    })}
                  />
                </div>
                {/* Memory Usage */}
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <h4>Memory Usage</h4>
                  <CircularProgressbar
                    value={offline ? 0 : vm.memory || 0}
                    text={`${offline ? 0 : vm.memory || 0}%`}
                    styles={buildStyles({
                      pathColor: `rgba(255, 0, 0, ${(offline ? 0 : vm.memory) / 100})`,
                      textColor: '#000',
                      trailColor: '#d6d6d6',
                    })}
                  />
                </div>
                {/* Disk Usage */}
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <h4>Disk Usage</h4>
                  <CircularProgressbar
                    value={offline ? 0 : vm.disk || 0}
                    text={`${offline ? 0 : vm.disk || 0}%`}
                    styles={buildStyles({
                      pathColor: `rgba(0, 0, 255, ${(offline ? 0 : vm.disk) / 100})`,
                      textColor: '#000',
                      trailColor: '#d6d6d6',
                    })}
                  />
                </div>
                {/* Network Usage */}
                <div style={{ width: '150px', textAlign: 'center' }}>
                  <h4>Network Usage</h4>
                  {offline ? (
                    <p>Offline</p>
                  ) : vm.network &&
                    vm.network.bytes_sent !== undefined &&
                    vm.network.bytes_recv !== undefined ? (
                    <div>
                      <p>Bytes Sent: {vm.network.bytes_sent.toLocaleString()} B</p>
                      <p>Bytes Received: {vm.network.bytes_recv.toLocaleString()} B</p>
                    </div>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>
              </div>
              {offline && (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    color: '#dc3545',
                    fontWeight: 'bold',
                  }}
                >
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
      </div>
    </div>
  );
}

export default Dashboard;
