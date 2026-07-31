const express = require('express');
const router = express.Router();

// Import controller functions matching the exports above
const { register, login } = require('../controllers/authController');

// Define routes with proper callback assignments
router.post('/register', register);
router.post('/login', login);

module.exports = router;
