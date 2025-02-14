import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function PerformanceChart({ vmId }) {
  // Store a history of metrics. We'll limit to the most recent 20 updates.
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let interval = null;
    if (vmId) {
      // Poll every 5 seconds
      interval = setInterval(() => {
        fetch(`http://localhost:3001/vms/${vmId}`)
          .then((res) => res.json())
          .then((data) => {
            setHistory((prev) => {
              const newHistory = [...prev, { 
                time: new Date(data.last_updated), 
                cpu: data.cpu 
              }];
              // Keep only the last 20 data points
              return newHistory.slice(-20);
            });
          })
          .catch((err) => console.error('Error fetching metrics:', err));
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [vmId]);

  const chartData = {
    labels: history.map((item) => item.time.toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: history.map((item) => item.cpu),
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Performance Chart for VM: {vmId}</h3>
      <Line data={chartData} />
    </div>
  );
}

export default PerformanceChart;
