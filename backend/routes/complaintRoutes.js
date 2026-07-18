const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  assignComplaint,
  addComment,
  deleteComplaint,
  getStats,
} = require("../controllers/complaintController");

router.use(protect);

router.get("/stats/summary", authorize("admin", "staff"), getStats);

// Any authenticated role can create a complaint (parent or staff); getComplaints is role-scoped internally.
router.route("/").post(createComplaint).get(getComplaints);

router
  .route("/:id")
  .get(getComplaintById)
  .delete(authorize("admin"), deleteComplaint);

router.put("/:id/status", authorize("admin"), updateStatus);
router.put("/:id/assign", authorize("admin"), assignComplaint);
router.post("/:id/comments", addComment);

module.exports = router;