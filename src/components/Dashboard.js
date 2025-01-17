import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import ReactModal from 'react-modal';
import Sidebar from './Sidebar'; // Import Sidebar component

ReactModal.setAppElement('#root');

const CRITICAL_THRESHOLD = 80; // Critical threshold percentage

function Dashboard() {
  const [vmData, setVmData] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedVM, setSelectedVM] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://localhost:3001/vms');
      const data = await response.json();
      setVmData(data);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear the token
    window.location.href = '/'; // Redirect to login page
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredData = vmData.filter((vm) => {
    if (filter === 'All') return true;
    if (filter === 'Critical' && (vm.cpu > CRITICAL_THRESHOLD || vm.memory > CRITICAL_THRESHOLD)) return true;
    return vm.status === filter;
  });

  const openModal = (vm) => {
    setSelectedVM(vm);
  };

  const closeModal = () => {
    setSelectedVM(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f4f4' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Dashboard</h2>
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

        {/* Filter Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Filter by Status:</label>
          <select
            value={filter}
            onChange={handleFilterChange}
            style={{
              padding: '5px 10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
            }}
          >
            <option value="All">All</option>
            <option value="Running">Running</option>
            <option value="Idle">Idle</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* VM Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredData.map((vm) => (
            <div
              key={vm.id}
              onClick={() => openModal(vm)}
              style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <h3 style={{ color: '#333', marginBottom: '10px' }}>{vm.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {/* CPU Usage */}
                <div style={{ width: '40%', textAlign: 'center' }}>
                  <h4 style={{ marginBottom: '5px', color: '#666' }}>CPU Usage</h4>
                  <CircularProgressbar
                    value={vm.cpu.toFixed(2)}
                    text={`${vm.cpu.toFixed(2)}%`}
                    styles={buildStyles({
                      pathColor: `rgba(255, 0, 0, ${vm.cpu / 100})`,
                      textColor: '#333',
                      trailColor: '#ddd',
                    })}
                  />
                </div>

                {/* Memory Usage */}
                <div style={{ width: '40%', textAlign: 'center' }}>
                  <h4 style={{ marginBottom: '5px', color: '#666' }}>Memory Usage</h4>
                  <CircularProgressbar
                    value={vm.memory.toFixed(2)}
                    text={`${vm.memory.toFixed(2)}%`}
                    styles={buildStyles({
                      pathColor: `rgba(255, 0, 0, ${vm.memory / 100})`,
                      textColor: '#333',
                      trailColor: '#ddd',
                    })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for VM Details */}
        {selectedVM && (
          <ReactModal
            isOpen={!!selectedVM}
            onRequestClose={closeModal}
            contentLabel="VM Details"
            style={{
              content: { maxWidth: '500px', margin: 'auto', borderRadius: '10px', padding: '20px' },
            }}
          >
            <h2 style={{ marginBottom: '20px' }}>Details for {selectedVM.name}</h2>
            <p><strong>ID:</strong> {selectedVM.id}</p>
            <p><strong>CPU Usage:</strong> {selectedVM.cpu.toFixed(2)}%</p>
            <p><strong>Memory Usage:</strong> {selectedVM.memory.toFixed(2)}%</p>
            <p><strong>Status:</strong> {selectedVM.status}</p>
            <button
              onClick={closeModal}
              style={{
                marginTop: '20px',
                padding: '10px 15px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </ReactModal>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
