const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

// Register Controller
const register = async (req, res) => {
  try {
    const { fullName, email, password, role, department } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!db) {
      return res.status(500).json({ message: 'Database connection is not initialized' });
    }

    // Check if user already exists in Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      return res.status(400).json({ message: 'The email address is already in use by another account.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user document
    const newUserRef = usersRef.doc();
    const userData = {
      uid: newUserRef.id,
      fullName,
      email,
      password: hashedPassword,
      role,
      department: department || 'General',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await newUserRef.set(userData);

    // Generate JWT Token
    const token = jwt.sign(
      { id: newUserRef.id, email, role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUserRef.id,
        fullName,
        email,
        role,
        department: userData.department
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (!db) {
      return res.status(500).json({ message: 'Database connection is not initialized' });
    }

    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let userData = null;
    snapshot.forEach(doc => {
      userData = { id: doc.id, ...doc.data() };
    });

    // Check password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        name: userData.fullName || userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Explicit exports
module.exports = {
  register,
  login
};