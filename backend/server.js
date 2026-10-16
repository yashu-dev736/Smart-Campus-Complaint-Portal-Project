const express = require("express");
const cors = require("cors");

// ============================================
// IMPORT FIREBASE CONFIGURATION
// ============================================

const { db } = require("./config/firebase");

// ============================================
// IMPORT ROUTES
// ============================================

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// ============================================
// INITIALIZE EXPRESS
// ============================================

const app = express();

// ============================================
// CORS CONFIGURATION
// ============================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  // Add your deployed frontend origin here if needed.
  // Example: "https://your-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked this origin: ${origin}`)
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// HEALTH CHECK ROUTE
// ============================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Smart Campus Complaint API is running successfully",
  });
});

// ============================================
// API ROUTES
// ============================================

// Authentication
app.use("/api/auth", authRoutes);

// Complaints
app.use("/api/complaints", complaintRoutes);

// Notifications
app.use("/api/notifications", notificationRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  // Return CORS-related errors clearly.
  if (err.message.startsWith("CORS blocked")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("====================================");
    console.log("Smart Campus Complaint Portal API");
    console.log("Firebase configuration loaded");
    console.log(`Server running on port ${PORT}`);
    console.log("====================================");
  });
}

// Export app for testing
module.exports = app;