const Complaint = require("../models/Complaint");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// Admins see everything. Staff should not see WHO filed a complaint (no name),
// and never see any email. Parents only ever see their own complaints, so their
// own name is harmless to show them.
const sanitizeForRole = (complaintDoc, role) => {
  const obj = complaintDoc.toObject();
  delete obj.contactEmail;
  if (obj.createdBy) {
    delete obj.createdBy.email;
    if (role === "staff") delete obj.createdBy.name;
  }
  if (obj.assignedTo) {
    delete obj.assignedTo.email;
  }
  return obj;
};

// @route POST /api/complaints  (parent, staff, admin)
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, location, priority, contactEmail } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      location,
      priority,
      contactEmail: contactEmail || req.user.email,
      createdBy: req.user._id,
      history: [
        {
          status: "Pending",
          changedBy: req.user._id,
          changedByName: req.user.name,
          note: "Complaint submitted",
        },
      ],
    });

    // Notify all staff/admins in the same department category (best-effort, non-blocking)
    User.find({ role: { $in: ["staff", "admin"] } })
      .select("email name")
      .then((recipients) => {
        recipients.forEach((r) => {
          sendEmail({
            to: r.email,
            subject: `New Complaint Submitted: ${title}`,
            html: `<p>Hi ${r.name},</p><p>A new complaint "<b>${title}</b>" (${category || "Other"}) was submitted by ${req.user.name}.</p>`,
          });
        });
      })
      .catch(() => {});

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Failed to create complaint", error: err.message });
  }
};

// @route GET /api/complaints (role-scoped)
const getComplaints = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "parent") {
      filter = { createdBy: req.user._id };
    } else if (req.user.role === "staff") {
      // staff sees complaints assigned to them, plus unassigned ones they could pick up
      filter = { $or: [{ assignedTo: req.user._id }, { assignedTo: null }] };
    }
    // admin sees everything -> filter stays {}

    const { status, category, priority } = req.query;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate("createdBy", "name email department")
      .populate("assignedTo", "name email department")
      .sort({ createdAt: -1 });

    // contactEmail is admin-only; createdBy.name is also hidden from staff specifically
    const payload =
      req.user.role === "admin"
        ? complaints
        : complaints.map((c) => sanitizeForRole(c, req.user.role));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch complaints", error: err.message });
  }
};

// @route GET /api/complaints/:id
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("createdBy", "name email department")
      .populate("assignedTo", "name email department")
      .populate("comments.author", "name role");

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const isOwner = complaint.createdBy._id.toString() === req.user._id.toString();
    if (req.user.role === "parent" && !isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }

    // contactEmail is admin-only; createdBy.name is also hidden from staff specifically
    if (req.user.role !== "admin") {
      return res.json(sanitizeForRole(complaint, req.user.role));
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch complaint", error: err.message });
  }
};

// @route PUT /api/complaints/:id/status  (admin only)
const updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const complaint = await Complaint.findById(req.params.id).populate("createdBy", "name email");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.status = status;
    complaint.history.push({
      status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: note || "",
    });

    await complaint.save();

    sendEmail({
      to: complaint.createdBy.email,
      subject: `Your complaint status changed to "${status}"`,
      html: `<p>Hi ${complaint.createdBy.name},</p><p>Your complaint "<b>${complaint.title}</b>" is now marked as <b>${status}</b>.</p>${
        note ? `<p>Note: ${note}</p>` : ""
      }`,
    });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};

// @route PUT /api/complaints/:id/assign  (admin)
const assignComplaint = async (req, res) => {
  try {
    const { staffId } = req.body;

    const staff = await User.findOne({ _id: staffId, role: "staff" });
    if (!staff) return res.status(400).json({ message: "Invalid staff member" });

    const complaint = await Complaint.findById(req.params.id).populate("createdBy", "name email");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.assignedTo = staff._id;
    if (complaint.status === "Pending") complaint.status = "In Progress";
    complaint.history.push({
      status: complaint.status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: `Assigned to ${staff.name}`,
    });

    await complaint.save();

    sendEmail({
      to: staff.email,
      subject: `New complaint assigned to you: ${complaint.title}`,
      html: `<p>Hi ${staff.name},</p><p>The complaint "<b>${complaint.title}</b>" has been assigned to you.</p>`,
    });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Failed to assign complaint", error: err.message });
  }
};

// @route POST /api/complaints/:id/comments
const addComment = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Comment message is required" });

    const complaint = await Complaint.findById(req.params.id).populate("createdBy", "name email");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.comments.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      message,
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
};

// @route DELETE /api/complaints/:id  (admin only)
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json({ message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete complaint", error: err.message });
  }
};

// @route GET /api/complaints/stats/summary  (admin, staff)
const getStats = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: "Pending" });
    const inProgress = await Complaint.countDocuments({ status: "In Progress" });
    const resolved = await Complaint.countDocuments({ status: "Resolved" });
    const rejected = await Complaint.countDocuments({ status: "Rejected" });

    const byCategory = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({ total, pending, inProgress, resolved, rejected, byCategory });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  assignComplaint,
  addComment,
  deleteComplaint,
  getStats,
};