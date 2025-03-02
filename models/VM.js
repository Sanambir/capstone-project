// models/VM.js
const mongoose = require('mongoose');

const VMSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Use our own agent ID as the _id
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
  // Store the user's email as a string
  user: { type: String, required: true }
});

module.exports = mongoose.model('VM', VMSchema);
