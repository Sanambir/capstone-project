import React, { useState, useEffect } from 'react';

function ActivityLog() {
  const [logEntries, setLogEntries] = useState([]);

  // Load the activity log from localStorage on mount.
  useEffect(() => {
    const storedLog = localStorage.getItem('activityLog');
    if (storedLog) {
      setLogEntries(JSON.parse(storedLog));
    }
  }, []);

  // Function to add a log entry and persist it.
  const addLogEntry = (message) => {
    const newEntry = { message, time: new Date() };
    const updatedLog = [newEntry, ...logEntries].slice(0, 50); // keep the 50 latest entries
    setLogEntries(updatedLog);
    localStorage.setItem('activityLog', JSON.stringify(updatedLog));
  };

  // For demonstration, we'll also expose the addLogEntry function on window.
  // In a real app you might use a context or a global store.
  window.addActivityLogEntry = addLogEntry;

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Activity Log</h3>
      {logEntries.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {logEntries.map((entry, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <strong>{new Date(entry.time).toLocaleString()}:</strong> {entry.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ActivityLog;
