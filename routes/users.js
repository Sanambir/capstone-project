// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users?email=<email>
// Returns a list of users matching the email.
router.get('/', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter required' });
    }
    const users = await User.find({ email: email });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

module.exports = router;
