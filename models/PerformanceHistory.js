// models/PerformanceHistory.js
const mongoose = require('mongoose');

const PerformanceHistorySchema = new mongoose.Schema({
  vmId: { type: String, required: true },
  date: { type: Date, default: Date.now }, // Default to current date if not provided
  avgCpu: { type: Number, default: 0 },
  avgMemory: { type: Number, default: 0 },
  avgDisk: { type: Number, default: 0 },
  sampleCount: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PerformanceHistory', PerformanceHistorySchema);
