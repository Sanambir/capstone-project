// routes/vms.js
const express = require('express');
const router = express.Router();
const VM = require('../models/VM'); // Create a VM model as shown below

// GET all VMs
router.get('/', async (req, res) => {
  try {
    const vms = await VM.find({});
    res.json(vms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving VMs' });
  }
});

// GET a specific VM by id
router.get('/:id', async (req, res) => {
  try {
    const vm = await VM.findById(req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    res.json(vm);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving VM' });
  }
});

// POST a new VM
router.post('/', async (req, res) => {
  try {
    const newVM = new VM(req.body);
    await newVM.save();
    res.status(201).json(newVM);
  } catch (error) {
    res.status(500).json({ message: 'Error creating VM' });
  }
});

// PUT update a VM
router.put('/:id', async (req, res) => {
  try {
    const updatedVM = await VM.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedVM) return res.status(404).json({ error: 'VM not found' });
    res.json(updatedVM);
  } catch (error) {
    res.status(500).json({ message: 'Error updating VM' });
  }
});

// DELETE a VM
router.delete('/:id', async (req, res) => {
  try {
    await VM.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting VM' });
  }
});

module.exports = router;
