const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

// Configure your email transporter (example using Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sanambirsingh2@gmail.com',           // Replace with your Gmail address
    pass: 'qvdm vkbt hsoq sisd',       // Replace with your app-specific password
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
    from: 'sanambirsingh2@gmail.com', // Sender address (same as above)
    to: recipientEmail || 'recipient@example.com', // Use provided recipient email or fallback
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
