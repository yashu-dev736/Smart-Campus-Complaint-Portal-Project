const express = require('express');
const cors = require('cors');

// Import the database and admin instances from your clean config file
const { db } = require('./config/firebase');

// Import your route modules
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.send({ message: 'Smart Campus Complaint API is running successfully' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Server Port Configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Firebase Firestore Connected Successfully!`);
  console.log(`Server running on port ${PORT}`);
});

// Export app if needed for testing or external mounting
module.exports = app;