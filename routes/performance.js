const express = require('express');
const router = express.Router();
const PerformanceHistory = require('../models/PerformanceHistory');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// POST aggregated performance data
router.post('/', async (req, res) => {
  const performanceData = req.body;
  // Add a timestamp if needed
  performanceData.timestamp = new Date();
  try {
    const entry = await PerformanceHistory.create(performanceData);
    res.status(201).json({ message: 'Performance history saved', entry });
  } catch (error) {
    console.error('Error saving performance data:', error);
    res.status(500).json({ message: 'Error saving performance data', error: error.toString() });
  }
});

// GET /api/performance/history?vmId=<id>&startDate=<ISO>&endDate=<ISO>
router.get('/history', async (req, res) => {
  const { vmId, startDate, endDate } = req.query;
  if (!vmId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing vmId, startDate, or endDate in query parameters.' });
  }
  try {
    const history = await PerformanceHistory.find({
      vmId,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ timestamp: 1 });
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching performance history:', error);
    res.status(500).json({ message: 'Error fetching performance history' });
  }
});

module.exports = router;