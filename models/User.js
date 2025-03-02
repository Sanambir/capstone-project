// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
  // You can add more fields if needed.
});

module.exports = mongoose.model('User', UserSchema);
