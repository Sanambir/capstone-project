// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000; // Use Azure-assigned port if available

app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

// Configure your email transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,          // Your Gmail address from Azure App Settings
    pass: process.env.EMAIL_PASS,          // Your app-specific password from Azure App Settings
  },
});

// Optional: Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error with email transporter configuration:', error);
  } else {
    console.log('Email transporter is configured correctly');
  }
});

// POST endpoint to send an alert email
app.post('/send-alert', (req, res) => {
  const { vmName, cpu, memory, disk, recipientEmail } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address from environment variable
    to: recipientEmail || process.env.RECIPIENT_DEFAULT, // Use provided recipient or default
    subject: `Critical Alert for ${vmName}`,
    text: `Alert: ${vmName} is in a critical state.\nCPU: ${cpu}%\nMemory: ${memory}%\nDisk: ${disk}%`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending alert email:', error);
      return res.status(500).json({ message: 'Failed to send alert email.' });
    } else {
      console.log('Alert email sent:', info.response);
      return res.status(200).json({ message: 'Alert email sent successfully.' });
    }
  });
});

app.listen(port, () => {
  console.log(`Alert server listening at http://localhost:${port}`);
});
