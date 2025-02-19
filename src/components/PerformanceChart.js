import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function PerformanceChart() {
  // State for list of all VMs, selected VM IDs, and historical data
  const [vmList, setVmList] = useState([]);
  const [selectedVmIds, setSelectedVmIds] = useState([]);
  // historyData is an object mapping vmId -> array of { time, cpu, memory, disk }
  const [historyData, setHistoryData] = useState({});

  // Fetch list of VMs on mount
  useEffect(() => {
    const fetchVms = async () => {
      try {
        const res = await fetch('http://localhost:3001/vms');
        if (res.ok) {
          const data = await res.json();
          setVmList(data);
          // If no VM is selected, default to the first VM
          if (data.length > 0 && selectedVmIds.length === 0) {
            setSelectedVmIds([data[0].id]);
          }
        } else {
          console.error('Failed to fetch VM list');
        }
      } catch (err) {
        console.error('Error fetching VM list:', err);
      }
    };
    fetchVms();
  }, [selectedVmIds]);

  // Poll historical data for each selected VM every 5 seconds.
  useEffect(() => {
    if (selectedVmIds.length === 0) return;

    const fetchDataForVm = async (id) => {
      try {
        const res = await fetch(`http://localhost:3001/vms/${id}`);
        if (res.ok) {
          const data = await res.json();
          setHistoryData((prev) => {
            const prevHistory = prev[id] || [];
            const newEntry = { 
              time: new Date(data.last_updated), 
              cpu: data.cpu, 
              memory: data.memory, 
              disk: data.disk 
            };
            // Keep only the most recent 20 entries
            return { ...prev, [id]: [...prevHistory, newEntry].slice(-20) };
          });
        } else {
          console.error(`Failed to fetch data for VM ${id}`);
        }
      } catch (err) {
        console.error(`Error fetching data for VM ${id}:`, err);
      }
    };

    const interval = setInterval(() => {
      selectedVmIds.forEach((id) => {
        fetchDataForVm(id);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedVmIds]);

  // Colors for datasets (cycled if more than available colors)
  const colors = [
    'rgba(75,192,192,1)',
    'rgba(255,99,132,1)',
    'rgba(54,162,235,1)',
    'rgba(255,206,86,1)',
    'rgba(153,102,255,1)',
    'rgba(255,159,64,1)',
  ];

  // Create datasets for a given metric from the historical data of selected VMs.
  const createDatasets = (metric) =>
    selectedVmIds.map((id, index) => {
      const vm = vmList.find((vm) => vm.id === id);
      const history = historyData[id] || [];
      return {
        label: vm ? vm.name : id,
        data: history.map((entry) => ({ x: entry.time, y: entry[metric] })),
        fill: false,
        borderColor: colors[index % colors.length],
        tension: 0.1,
      };
    });

  // Chart options: use time scale on x-axis.
  const chartOptions = {
    scales: {
      x: {
        type: 'time',
        time: { unit: 'second' },
        title: { display: true, text: 'Time' },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Value (%)' },
      },
    },
  };

  // Function to download the historical data as a CSV file.
  const downloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'VM Name,Time,CPU,Memory,Disk\r\n';
    selectedVmIds.forEach((id) => {
      const vm = vmList.find((vm) => vm.id === id);
      const history = historyData[id] || [];
      history.forEach((entry) => {
        const row = `${vm ? vm.name : id},${entry.time.toISOString()},${entry.cpu},${entry.memory},${entry.disk}`;
        csvContent += row + '\r\n';
      });
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'vm_performance_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Performance Charts</h2>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="vmSelect" style={{ fontWeight: 'bold', marginRight: '10px' }}>
            Select VMs:
          </label>
          <select
            id="vmSelect"
            multiple
            value={selectedVmIds}
            onChange={(e) =>
              setSelectedVmIds(Array.from(e.target.selectedOptions, (option) => option.value))
            }
            style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc', minWidth: '200px' }}
          >
            {vmList.map((vm) => (
              <option key={vm.id} value={vm.id}>
                {vm.name}
              </option>
            ))}
          </select>
        </div>

        {selectedVmIds.length === 0 ? (
          <p>Please select at least one VM to view performance history.</p>
        ) : (
          <>
            {/* CPU Chart */}
            <h3>CPU Usage (%)</h3>
            {selectedVmIds.some((id) => (historyData[id] || []).length >= 3) ? (
              <Line data={{ datasets: createDatasets('cpu') }} options={chartOptions} />
            ) : (
              <p>Data currently not available. Please come back later.</p>
            )}

            {/* Memory Chart */}
            <h3>Memory Usage (%)</h3>
            {selectedVmIds.some((id) => (historyData[id] || []).length >= 3) ? (
              <Line data={{ datasets: createDatasets('memory') }} options={chartOptions} />
            ) : (
              <p>Data currently not available. Please come back later.</p>
            )}

            {/* Disk Chart */}
            <h3>Disk Usage (%)</h3>
            {selectedVmIds.some((id) => (historyData[id] || []).length >= 3) ? (
              <Line data={{ datasets: createDatasets('disk') }} options={chartOptions} />
            ) : (
              <p>Data currently not available. Please come back later.</p>
            )}

            {/* Download Button */}
            <button
              onClick={downloadCSV}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Download Data as CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PerformanceChart;
