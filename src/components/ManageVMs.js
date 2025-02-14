import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

function ManageVMs() {
  const [vms, setVMs] = useState([]);
  const [newVM, setNewVM] = useState({ name: '', os: '' });
  const [error, setError] = useState('');
  // State to track the currently editing VM
  const [editingVM, setEditingVM] = useState(null);
  // State to hold the edited data
  const [editedData, setEditedData] = useState({ name: '', os: '' });

  // Fetch the list of VMs from JSON Server
  const fetchVMs = async () => {
    try {
      const response = await axios.get('http://localhost:3001/vms');
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

  // Add a new VM via POST request
  const addVM = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/vms', {
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
      fetchVMs(); // Refresh the list of VMs
    } catch (err) {
      console.error('Error adding VM:', err);
      setError('Failed to add VM.');
    }
  };

  // Delete a VM via DELETE request
  const deleteVM = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/vms/${id}`);
      fetchVMs(); // Refresh the list after deletion
    } catch (err) {
      console.error('Error deleting VM:', err);
      setError('Failed to delete VM.');
    }
  };

  // Start editing a VM: set the editingVM state and pre-populate editedData
  const startEditing = (vm) => {
    setEditingVM(vm.id);
    setEditedData({ name: vm.name, os: vm.os });
  };

  // Handle changes in the edit form
  const handleEditChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  // Update the VM via a PUT request
  const updateVM = async (id) => {
    try {
      await axios.put(`http://localhost:3001/vms/${id}`, {
        ...vms.find((vm) => vm.id === id),
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

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Manage Virtual Machines</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Form to add a new VM */}
        <form onSubmit={addVM} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>VM Name:</label>
            <input
              type="text"
              name="name"
              value={newVM.name}
              onChange={handleInputChange}
              required
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
            />
          </div>
          <button type="submit" style={{ padding: '8px 12px', cursor: 'pointer' }}>
            Add VM
          </button>
        </form>

        {/* List of existing VMs */}
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
                }}
              >
                {editingVM === vm.id ? (
                  // Render edit form if this VM is being edited
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={editedData.name}
                      onChange={handleEditChange}
                      style={{ marginRight: '10px' }}
                    />
                    <input
                      type="text"
                      name="os"
                      value={editedData.os}
                      onChange={handleEditChange}
                      style={{ marginRight: '10px' }}
                    />
                    <button
                      onClick={() => updateVM(vm.id)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        marginRight: '5px',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingVM(null)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        backgroundColor: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  // Display VM details
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      {vm.name} ({vm.os})
                    </span>
                    <div>
                      <button
                        onClick={() => startEditing(vm)}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          marginRight: '5px',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVM(vm.id)}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                        }}
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
