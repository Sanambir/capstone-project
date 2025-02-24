// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Helper functions to read and write the JSON file
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { vms: [] };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// API Endpoints

// GET all VMs
app.get('/vms', (req, res) => {
  const db = readDB();
  res.json(db.vms);
});

// GET a specific VM by id
app.get('/vms/:id', (req, res) => {
  const db = readDB();
  const vm = db.vms.find((v) => v.id === req.params.id);
  if (vm) {
    res.json(vm);
  } else {
    res.status(404).json({ error: 'VM not found' });
  }
});

// POST a new VM
app.post('/vms', (req, res) => {
  const db = readDB();
  const newVM = req.body;
  db.vms.push(newVM);
  writeDB(db);
  res.status(201).json(newVM);
});

// PUT update a VM by id
app.put('/vms/:id', (req, res) => {
  const db = readDB();
  const index = db.vms.findIndex((v) => v.id === req.params.id);
  if (index !== -1) {
    db.vms[index] = { ...db.vms[index], ...req.body };
    writeDB(db);
    res.json(db.vms[index]);
  } else {
    res.status(404).json({ error: 'VM not found' });
  }
});

// DELETE a VM by id
app.delete('/vms/:id', (req, res) => {
  const db = readDB();
  const newVms = db.vms.filter((v) => v.id !== req.params.id);
  db.vms = newVms;
  writeDB(db);
  res.status(204).end();
});

// Serve static files from the React app's build folder
app.use(express.static(path.join(__dirname, 'build')));

// The "catchall" handler: for any request that doesn't match one above, send back index.html.
// This allows React Router to handle client-side routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
