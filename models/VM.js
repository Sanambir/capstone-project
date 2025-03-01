// models/VM.js
const mongoose = require('mongoose');

const VMSchema = new mongoose.Schema({
  name: { type: String, required: true },
  os: { type: String },
  cpu: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  disk: { type: Number, default: 0 },
  network: {
    bytes_sent: { type: Number, default: 0 },
    bytes_recv: { type: Number, default: 0 },
    packets_sent: { type: Number, default: 0 },
    packets_recv: { type: Number, default: 0 }
  },
  status: { type: String, default: 'Running' },
  last_updated: { type: Date, default: Date.now },
  // Associate this VM with a User (required)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('VM', VMSchema);
