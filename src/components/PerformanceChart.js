import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Select from 'react-select';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';

function PerformanceChart() {
  // State for list of VMs, selected VMs (as an array of IDs), and historical data.
  const [vmList, setVmList] = useState([]);
  const [selectedVmIds, setSelectedVmIds] = useState([]);
  // For react-select, we use selectedOptions which are objects { value, label }
  const [selectedOptions, setSelectedOptions] = useState([]);
  // historyData maps vmId -> array of { time, cpu, memory, disk }
  const [historyData, setHistoryData] = useState({});

  // Fetch list of VMs on mount
  useEffect(() => {
    const fetchVms = async () => {
      try {
        const res = await fetch('http://localhost:3001/vms');
        if (res.ok) {
          const data = await res.json();
          setVmList(data);
          // If no VM is selected, default to the first one
          if (data.length > 0 && selectedVmIds.length === 0) {
            const defaultOption = { value: data[0].id, label: data[0].name };
            setSelectedOptions([defaultOption]);
            setSelectedVmIds([data[0].id]);
          }
        } else {
          console.error('Failed to fetch VMs for Performance Chart');
        }
      } catch (err) {
        console.error('Error fetching VM list:', err);
      }
    };
    fetchVms();
  }, []);

  // When selectedOptions change, update selectedVmIds.
  useEffect(() => {
    const ids = selectedOptions.map(option => option.value);
    setSelectedVmIds(ids);
  }, [selectedOptions]);

  // Poll the selected VM(s)' data every 5 seconds.
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
            const updatedHistory = [...prevHistory, newEntry].slice(-20);
            return { ...prev, [id]: updatedHistory };
          });
        } else {
          console.error(`Failed to fetch data for VM ${id}`);
        }
      } catch (err) {
        console.error(`Error fetching data for VM ${id}:`, err);
      }
    };

    // Reset history when selection changes.
    setHistoryData({});
    selectedVmIds.forEach((id) => {
      fetchDataForVm(id);
    });
    const interval = setInterval(() => {
      selectedVmIds.forEach((id) => {
        fetchDataForVm(id);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedVmIds]);

  // Prepare datasets for a given metric.
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

  // Colors for datasets.
  const colors = [
    'rgba(75,192,192,1)',
    'rgba(255,99,132,1)',
    'rgba(54,162,235,1)',
    'rgba(255,206,86,1)',
    'rgba(153,102,255,1)',
    'rgba(255,159,64,1)',
  ];

  // Chart options: time scale on x-axis.
  const chartOptions = {
    scales: {
      x: {
        type: 'time',
        time: { unit: 'second' },
        title: { display: true, text: 'Time' },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Usage (%)' },
      },
    },
  };

  // Function to download historical data as CSV.
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

  // Styling for container and cards.
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  };

  const chartCardStyle = {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px',
  };

  const downloadButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={containerStyle}>
        <h2>Performance Charts</h2>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Select VMs:</label>
          <Select
            options={vmList.map(vm => ({ value: vm.id, label: vm.name }))}
            isMulti
            value={selectedOptions}
            onChange={setSelectedOptions}
            placeholder="Select VMs..."
          />
        </div>
        {selectedVmIds.length === 0 ? (
          <p>Please select at least one VM to view performance history.</p>
        ) : (
          <>
            <div style={chartCardStyle}>
              <h3>CPU Usage (%)</h3>
              {selectedVmIds.some((id) => (historyData[id] || []).length >= 3) ? (
                <Line data={{ datasets: createDatasets('cpu') }} options={chartOptions} />
              ) : (
                <p>Data currently not available. Please come back later.</p>
              )}
            </div>
            <div style={chartCardStyle}>
              <h3>Memory Usage (%)</h3>
              {selectedVmIds.some((id) => (historyData[id] || []).length >= 3) ? (
                <Line data={{ datasets: createDatasets('memory') }} options={chartOptions} />
              ) : (
                <p>Data currently not available. Please come back later.</p>
              )}
            </div>
            <div style={chartCardStyle}>
              <h3>Disk Usage (%)</h3>
              {selectedVmIds.some((id) => (historyData[id] || []).length >= 3) ? (
                <Line data={{ datasets: createDatasets('disk') }} options={chartOptions} />
              ) : (
                <p>Data currently not available. Please come back later.</p>
              )}
            </div>
            <button style={downloadButtonStyle} onClick={downloadCSV}>
              Download Data as CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PerformanceChart;
