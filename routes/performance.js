// routes/performance.js
const express = require('express');
const router = express.Router();
const PerformanceHistory = require('../models/PerformanceHistory');
const authMiddleware = require('../middleware/auth');

// Protect the route with authentication.
router.use(authMiddleware);

// POST /api/performance
router.post('/', async (req, res) => {
  try {
    const { vmId, avgCpu, avgMemory, avgDisk, sampleCount } = req.body;
    if (!vmId) {
      return res.status(400).json({ message: 'vmId is required' });
    }
    // For example, set the aggregation date to the start of today.
    const now = new Date();
    const aggregationDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const newHistory = new PerformanceHistory({
      vmId,
      date: aggregationDate,
      avgCpu,
      avgMemory,
      avgDisk,
      sampleCount,
      timestamp: new Date(),
    });
    
    await newHistory.save();
    res.status(201).json({ message: 'Performance history saved', record: newHistory });
  } catch (error) {
    console.error('Error saving performance history:', error);
    res.status(500).json({ message: 'Error saving performance history' });
  }
});

module.exports = router;
