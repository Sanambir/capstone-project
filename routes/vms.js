// routes/vms.js
const express = require('express');
const router = express.Router();
const VM = require('../models/VM');
const authMiddleware = require('../middleware/auth');

// All VM routes below require authentication
router.use(authMiddleware);

// GET all VMs for the logged-in user
router.get('/', async (req, res) => {
  try {
    const vms = await VM.find({ user: req.user.id });
    res.json(vms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving VMs' });
  }
});

// GET a specific VM by ID (only if it belongs to the user)
router.get('/:id', async (req, res) => {
  try {
    const vm = await VM.findOne({ _id: req.params.id, user: req.user.id });
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    res.json(vm);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving VM' });
  }
});

// POST a new VM; automatically associate it with the logged-in user
router.post('/', async (req, res) => {
  try {
    const newVM = new VM({
      ...req.body,
      user: req.user.id, // Associate with current user
    });
    await newVM.save();
    res.status(201).json(newVM);
  } catch (error) {
    res.status(500).json({ message: 'Error creating VM' });
  }
});

// PUT update a VM by ID (only if it belongs to the user)
router.put('/:id', async (req, res) => {
  try {
    const updatedVM = await VM.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedVM) return res.status(404).json({ error: 'VM not found' });
    res.json(updatedVM);
  } catch (error) {
    res.status(500).json({ message: 'Error updating VM' });
  }
});

// DELETE a VM by ID (only if it belongs to the user)
router.delete('/:id', async (req, res) => {
  try {
    const deletedVM = await VM.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedVM) return res.status(404).json({ error: 'VM not found' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting VM' });
  }
});

module.exports = router;
