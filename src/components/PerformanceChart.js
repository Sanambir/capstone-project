import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Select from 'react-select';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import ReactModal from 'react-modal';

ReactModal.setAppElement('#root');

// Helper function: Aggregate data into a desired number of points by averaging.
function aggregateData(data, desiredPoints = 20) {
  if (data.length <= desiredPoints) return data;
  const groupSize = Math.floor(data.length / desiredPoints);
  const aggregated = [];
  for (let i = 0; i < data.length; i += groupSize) {
    const group = data.slice(i, i + groupSize);
    const avgTime =
      new Date(
        group.reduce((acc, cur) => acc + cur.time.getTime(), 0) / group.length
      );
    const avgCpu = group.reduce((acc, cur) => acc + cur.cpu, 0) / group.length;
    const avgMemory =
      group.reduce((acc, cur) => acc + cur.memory, 0) / group.length;
    const avgDisk = group.reduce((acc, cur) => acc + cur.disk, 0) / group.length;
    aggregated.push({ time: avgTime, cpu: avgCpu, memory: avgMemory, disk: avgDisk });
  }
  return aggregated;
}

function PerformanceChart() {
  // State for list of VMs and selected VM IDs
  const [vmList, setVmList] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  // selectedVmIds will be derived from selectedOptions
  const [selectedVmIds, setSelectedVmIds] = useState([]);
  // historyData: object mapping vmId -> array of { time, cpu, memory, disk }
  const [historyData, setHistoryData] = useState({});

  // Fetch the list of VMs on mount
  useEffect(() => {
    const fetchVms = async () => {
      try {
        const res = await fetch('http://localhost:3001/vms');
        if (res.ok) {
          const data = await res.json();
          setVmList(data);
          // Set default if none selected
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
            // Instead of slicing to last 20 entries immediately, store up to 100 data points.
            const prevHistory = prev[id] || [];
            const newEntry = { 
              time: new Date(data.last_updated), 
              cpu: data.cpu, 
              memory: data.memory, 
              disk: data.disk 
            };
            const updatedHistory = [...prevHistory, newEntry].slice(-100);
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

  // Create datasets for a given metric using aggregated data.
  const createDatasets = (metric) =>
    selectedVmIds.map((id, index) => {
      const vm = vmList.find((vm) => vm.id === id);
      const history = historyData[id] || [];
      const aggregatedHistory = aggregateData(history, 20);
      return {
        label: vm ? vm.name : id,
        data: aggregatedHistory.map((entry) => ({ x: entry.time, y: entry[metric] })),
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

  // Styling objects
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
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Select VM(s):</label>
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
