const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: String,
    authorRole: String,
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedByName: String,
    note: String,
  },
  { timestamps: true }
);

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Hostel", "IT/WiFi", "Electrical", "Plumbing", "Canteen", "Academics", "Library", "Transport", "Other"],
      default: "Other",
    },
    location: { type: String, default: "" },
    // Contact email captured at submission time. Only ever returned to admins in API responses
    // (see complaintController) — staff and parents never see this field.
    contactEmail: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    comments: [commentSchema],
    history: [historySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
