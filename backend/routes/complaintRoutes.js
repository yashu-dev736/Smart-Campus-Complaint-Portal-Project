const express = require('express');
const router = express.Router();

// Import controller functions safely
const { 
  getComplaints, 
  getComplaintStats, 
  createComplaint 
} = require('../controllers/complaintController');

const verifyToken = require('../middleware/authMiddleware');

// Define routes with proper functions
router.get('/', verifyToken, getComplaints);
router.get('/stats', verifyToken, getComplaintStats);
router.post('/', verifyToken, createComplaint);

module.exports = router;