import React, { useState, useEffect, useContext } from 'react';
import Select from 'react-select';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import Sidebar from './Sidebar';
import { ThemeContext } from '../ThemeContext';
import { FaBars } from 'react-icons/fa';
import { Box, Typography, Button } from '@mui/material';

function PerformanceChart() {
  const { theme } = useContext(ThemeContext);
  const [vmList, setVmList] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [selectedVmIds, setSelectedVmIds] = useState([]);
  const [historyData, setHistoryData] = useState({}); // { vmId: [{ time, cpu, memory, disk }, ...] }
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Optionally include token if your API requires it.
  const token = localStorage.getItem('authToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch VMs on mount.
  useEffect(() => {
    const fetchVms = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || 'https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net'}/api/vms`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setVmList(data);
          // Set a default selected VM if none is selected yet.
          if (data.length > 0 && selectedOptions.length === 0) {
            const defaultOption = { value: data[0]._id, label: data[0].name };
            setSelectedOptions([defaultOption]);
            setSelectedVmIds([data[0]._id]);
          }
        } else {
          console.error('Failed to fetch VMs');
        }
      } catch (error) {
        console.error('Error fetching VMs:', error);
      }
    };
    fetchVms();
  }, []); // Only on mount.

  // Update selectedVmIds when selectedOptions change.
  useEffect(() => {
    const ids = selectedOptions.map((option) => option.value);
    setSelectedVmIds(ids);
  }, [selectedOptions]);

  // Poll historical data for each selected VM every 5 seconds.
  useEffect(() => {
    if (selectedVmIds.length === 0) return;
    const fetchDataForVm = async (id) => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || 'https://capstone-ctfhh0dvb6ehaxaw.canadacentral-01.azurewebsites.net'}/api/vms/${id}`,
          { headers }
        );
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
            // Keep last 100 entries.
            const updatedHistory = [...prevHistory, newEntry].slice(-100);
            return { ...prev, [id]: updatedHistory };
          });
        } else {
          console.error(`Failed to fetch data for VM ${id}`);
        }
      } catch (error) {
        console.error(`Error fetching data for VM ${id}:`, error);
      }
    };

    selectedVmIds.forEach((id) => fetchDataForVm(id));
    const interval = setInterval(() => {
      selectedVmIds.forEach((id) => fetchDataForVm(id));
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedVmIds]);

  // Aggregate historical data into a fixed number of points (default 20).
  const aggregateData = (data, desiredPoints = 20) => {
    if (data.length <= desiredPoints) return data;
    const groupSize = Math.floor(data.length / desiredPoints);
    const aggregated = [];
    for (let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize);
      const avgTime = new Date(
        group.reduce((acc, cur) => acc + cur.time.getTime(), 0) / group.length
      );
      const avgCpu = group.reduce((acc, cur) => acc + cur.cpu, 0) / group.length;
      const avgMemory = group.reduce((acc, cur) => acc + cur.memory, 0) / group.length;
      const avgDisk = group.reduce((acc, cur) => acc + cur.disk, 0) / group.length;
      aggregated.push({ time: avgTime, cpu: avgCpu, memory: avgMemory, disk: avgDisk });
    }
    return aggregated;
  };

  // Create datasets for a given metric.
  const createDatasets = (metric) =>
    selectedVmIds.map((id, index) => {
      const vm = vmList.find((vm) => vm._id === id);
      const history = historyData[id] || [];
      const aggregatedHistory = aggregateData(history, 20);
      const colors = [
        'rgba(75,192,192,1)',
        'rgba(255,99,132,1)',
        'rgba(54,162,235,1)',
        'rgba(255,206,86,1)',
        'rgba(153,102,255,1)',
        'rgba(255,159,64,1)',
      ];
      return {
        label: vm ? vm.name : id,
        data: aggregatedHistory.map((entry) => ({ x: entry.time, y: entry[metric] })),
        fill: false,
        borderColor: colors[index % colors.length],
        tension: 0.1,
      };
    });

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

  // Download CSV function.
  const downloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'VM Name,Time,CPU,Memory,Disk\n';
    selectedVmIds.forEach((id) => {
      const vm = vmList.find((vm) => vm._id === id);
      const history = historyData[id] || [];
      const aggregatedHistory = aggregateData(history, 20);
      aggregatedHistory.forEach((entry) => {
        const row = `${vm ? vm.name : id},${entry.time.toISOString()},${entry.cpu.toFixed(
          2
        )},${entry.memory.toFixed(2)},${entry.disk.toFixed(2)}`;
        csvContent += row + '\n';
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

  // Layout styles.
  const mainContainerStyle = {
    marginLeft: sidebarOpen ? '250px' : '0',
    padding: '20px',
    backgroundColor: theme === 'light' ? '#f4f4f4' : '#222',
    color: theme === 'light' ? '#000' : '#fff',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease, background-color 0.3s ease, color 0.3s ease',
    flex: 1,
  };

  const chartContainerStyle = {
    marginBottom: '30px',
    height: '250px', // Adjust height as needed
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Compute overview data for Sidebar.
  const overviewData = {
    totalVMs: vmList.length,
    runningVMs: vmList.filter((vm) => vm.status === 'Running').length,
    criticalVMs: vmList.filter((vm) => vm.status !== 'Running').length,
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {sidebarOpen && <Sidebar overviewData={overviewData} onClose={toggleSidebar} />}
      <Box sx={mainContainerStyle}>
        {/* Header with burger menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FaBars onClick={toggleSidebar} style={{ fontSize: '24px', cursor: 'pointer', mr: '10px' }} />
          <Typography variant="h4">Performance Charts</Typography>
        </Box>

        {/* Multi-select dropdown to choose VMs */}
        <Box sx={{ mb: 2, maxWidth: '300px' }}>
          <Typography component="label" sx={{ fontWeight: 'bold', mr: 1 }}>
            Select VMs:
          </Typography>
          <Select
            options={vmList.map((vm) => ({ value: vm._id, label: vm.name }))}
            isMulti
            value={selectedOptions}
            onChange={(selected) => setSelectedOptions(selected)}
            placeholder="Select VMs..."
          />
        </Box>

        {selectedVmIds.length === 0 ? (
          <Typography>Please select at least one VM to view performance history.</Typography>
        ) : (
          <>
            <Box sx={chartContainerStyle}>
              <Typography variant="h6" sx={{ mb: 1 }}>CPU Usage (%)</Typography>
              <Line data={{ datasets: createDatasets('cpu') }} options={chartOptions} />
            </Box>
            <Box sx={chartContainerStyle}>
              <Typography variant="h6" sx={{ mb: 1 }}>Memory Usage (%)</Typography>
              <Line data={{ datasets: createDatasets('memory') }} options={chartOptions} />
            </Box>
            <Box sx={chartContainerStyle}>
              <Typography variant="h6" sx={{ mb: 1 }}>Disk Usage (%)</Typography>
              <Line data={{ datasets: createDatasets('disk') }} options={chartOptions} />
            </Box>
            <Button variant="contained" onClick={downloadCSV}>
              Download CSV
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}

export default PerformanceChart;
