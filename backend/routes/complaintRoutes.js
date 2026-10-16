const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const {
  getComplaints,
  getComplaintStats,
  createComplaint,
  updateComplaintStatus,
  addComment,
  deleteComplaint,
  getParentComplaints
} = require('../controllers/complaintController');


// ============================================
// GET PARENT COMPLAINTS
// ============================================
router.get(
  '/parent',
  authMiddleware,
  getParentComplaints
);


// ============================================
// GET ALL COMPLAINTS
// ============================================
router.get(
  '/',
  authMiddleware,
  getComplaints
);


// ============================================
// GET COMPLAINT STATISTICS
// ============================================
router.get(
  '/stats',
  authMiddleware,
  getComplaintStats
);


// ============================================
// CREATE NEW COMPLAINT
// ============================================
router.post(
  '/',
  authMiddleware,
  createComplaint
);


// ============================================
// UPDATE COMPLAINT STATUS
// ============================================
router.patch(
  '/:id/status',
  authMiddleware,
  updateComplaintStatus
);


// ============================================
// ADD COMMENT
// ============================================
router.post(
  '/:id/comments',
  authMiddleware,
  addComment
);


// ============================================
// DELETE COMPLAINT
// ============================================
router.delete(
  '/:id',
  authMiddleware,
  deleteComplaint
);


module.exports = router;