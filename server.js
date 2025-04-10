require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB (using your Azure Cosmos DB connection string)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Import routes
const authRouter = require('./routes/auth');
const vmRouter = require('./routes/vms');
const usersRouter = require('./routes/users'); // if applicable
const performanceRouter = require('./routes/performance');

// Mount the routes under /api
app.use('/api/auth', authRouter);
app.use('/api/vms', vmRouter);
app.use('/api/users', usersRouter);  // if you have this route
app.use('/api/performance', performanceRouter);  // New route for aggregated performance data
//app.use('/api/performance', require('./routes/performance'));

// Serve static files from the React app's build folder
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
