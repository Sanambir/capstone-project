import React from 'react';

function DashboardOverview({ vmData, cpuThreshold, memoryThreshold }) {
  const totalVMs = vmData.length;
  const runningVMs = vmData.filter(vm => vm.status === 'Running').length;
  const criticalVMs = vmData.filter(vm => vm.cpu > cpuThreshold || vm.memory > memoryThreshold).length;

  const avgCPU =
    totalVMs > 0
      ? (vmData.reduce((sum, vm) => sum + (vm.cpu || 0), 0) / totalVMs).toFixed(1)
      : 0;
  const avgMemory =
    totalVMs > 0
      ? (vmData.reduce((sum, vm) => sum + (vm.memory || 0), 0) / totalVMs).toFixed(1)
      : 0;
  const avgDisk =
    totalVMs > 0
      ? (vmData.reduce((sum, vm) => sum + (vm.disk || 0), 0) / totalVMs).toFixed(1)
      : 0;

  const cardStyle = {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    margin: '10px',
    flex: '1',
    textAlign: 'center',
  };

  return (
    <div style={{ display: 'flex', marginBottom: '20px', flexWrap: 'wrap' }}>
      <div style={cardStyle}>
        <h4>Total VMs</h4>
        <p>{totalVMs}</p>
      </div>
      <div style={cardStyle}>
        <h4>Running VMs</h4>
        <p>{runningVMs}</p>
      </div>
      <div style={cardStyle}>
        <h4>Critical VMs</h4>
        <p>{criticalVMs}</p>
      </div>
      <div style={cardStyle}>
        <h4>Avg CPU (%)</h4>
        <p>{avgCPU}</p>
      </div>
      <div style={cardStyle}>
        <h4>Avg Memory (%)</h4>
        <p>{avgMemory}</p>
      </div>
      <div style={cardStyle}>
        <h4>Avg Disk (%)</h4>
        <p>{avgDisk}</p>
      </div>
    </div>
  );
}

export default DashboardOverview;
