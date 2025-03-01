import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { ThemeContext } from '../ThemeContext';
import { FaBars } from 'react-icons/fa';

function ManageVMs() {
  const { theme } = useContext(ThemeContext);
  const [vms, setVMs] = useState([]);
  const [newVM, setNewVM] = useState({ name: '', os: '' });
  const [error, setError] = useState('');
  const [editingVM, setEditingVM] = useState(null);
  const [editedData, setEditedData] = useState({ name: '', os: '' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch VMs from JSON Server
  const fetchVMs = async () => {
    try {
      const response = await axios.get('https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net/api/vms');
      setVMs(response.data);
    } catch (err) {
      console.error('Error fetching VMs:', err);
      setError('Failed to fetch VMs.');
    }
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  // Handle input changes for new VM creation
  const handleInputChange = (e) => {
    setNewVM({ ...newVM, [e.target.name]: e.target.value });
  };

  // Add a new VM
  const addVM = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net/api/vms', {
        ...newVM,
        cpu: 0,
        memory: 0,
        disk: 0,
        network: {
          bytes_sent: 0,
          bytes_recv: 0,
          packets_sent: 0,
          packets_recv: 0,
        },
        status: 'Running',
        last_updated: new Date().toISOString(),
      });
      setNewVM({ name: '', os: '' });
      fetchVMs();
    } catch (err) {
      console.error('Error adding VM:', err);
      setError('Failed to add VM.');
    }
  };

  // Delete a VM
  const deleteVM = async (id) => {
    try {
      await axios.delete(`https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net/api/vms/${id}`);
      fetchVMs();
    } catch (err) {
      console.error('Error deleting VM:', err);
      setError('Failed to delete VM.');
    }
  };

  // Start editing a VM
  const startEditing = (vm) => {
    setEditingVM(vm.id);
    setEditedData({ name: vm.name, os: vm.os });
  };

  // Handle changes in the edit form
  const handleEditChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  // Update the VM
  const updateVM = async (id) => {
    try {
      const vmToUpdate = vms.find((vm) => vm.id === id);
      await axios.put(`https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net/api/vms/${id}`, {
        ...vmToUpdate,
        ...editedData,
        last_updated: new Date().toISOString(),
      });
      setEditingVM(null);
      fetchVMs();
    } catch (err) {
      console.error('Error updating VM:', err);
      setError('Failed to update VM.');
    }
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Compute overview data for Sidebar (using stats from Alerts page style)
  const overviewData = {
    totalVMs: vms.length,
    runningVMs: vms.filter((vm) => vm.status === 'Running').length,
    criticalVMs: vms.filter((vm) => vm.status !== 'Running').length,
  };

  const containerStyle = {
    flex: 1,
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    marginLeft: sidebarOpen ? '250px' : '0',
  };

  return (
    <div style={{ display: 'flex' }}>
      {sidebarOpen && <Sidebar overviewData={overviewData} onClose={toggleSidebar} />}
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FaBars onClick={toggleSidebar} style={{ fontSize: '24px', cursor: 'pointer', marginRight: '10px' }} />
          <h2 style={{ margin: 0 }}>Manage Virtual Machines</h2>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={addVM} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>VM Name:</label>
            <input
              type="text"
              name="name"
              value={newVM.name}
              onChange={handleInputChange}
              required
              style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>Operating System:</label>
            <input
              type="text"
              name="os"
              value={newVM.os}
              onChange={handleInputChange}
              required
              style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>
          <button type="submit" style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
            Add VM
          </button>
        </form>
        <h3>Existing VMs</h3>
        {vms.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {vms.map((vm) => (
              <li
                key={vm.id}
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: theme === 'light' ? '#fff' : '#333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {editingVM === vm.id ? (
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={editedData.name}
                      onChange={handleEditChange}
                      style={{ marginRight: '10px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <input
                      type="text"
                      name="os"
                      value={editedData.os}
                      onChange={handleEditChange}
                      style={{ marginRight: '10px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <button
                      onClick={() => updateVM(vm.id)}
                      style={{ padding: '6px 10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingVM(null)}
                      style={{ padding: '6px 10px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>{vm.name} ({vm.os})</span>
                    <div>
                      <button
                        onClick={() => startEditing(vm)}
                        style={{ padding: '6px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVM(vm.id)}
                        style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No VMs found.</p>
        )}
      </div>
    </div>
  );
}

export default ManageVMs;
