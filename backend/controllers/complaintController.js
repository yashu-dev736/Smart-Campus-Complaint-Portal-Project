// Import the initialized database instance from the config folder
const { db } = require('../config/firebase');

// Get all complaints with optional filtering
const getComplaints = async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = db.collection('complaints');

    if (status && status !== 'All' && status !== 'All statuses') {
      query = query.where('status', '==', status);
    }
    if (category && category !== 'All') {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get summary statistics for complaints
const getComplaintStats = async (req, res) => {
  try {
    const snapshot = await db.collection('complaints').get();
    const complaints = snapshot.docs.map(doc => doc.data());

    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    res.status(200).json({ total, pending, resolved });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new complaint
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, department } = req.body;
    
    const newComplaint = {
      title,
      description,
      category: category || 'General',
      department: department || 'General',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      userId: req.user ? req.user.uid : 'anonymous'
    };

    const docRef = await db.collection('complaints').add(newComplaint);
    res.status(201).json({ id: docRef.id, message: 'Complaint created successfully', ...newComplaint });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getComplaints,
  getComplaintStats,
  createComplaint
};