require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const userRoutes = require("./routes/userRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://agent-6a5c81052fe53e354--stellar-monstera-21d205.netlify.app"
  ],
  credentials: true
}));

app.use(express.json());
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Smart Campus Complaint Backend is Running",
  });
});
// Root Route
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Smart Campus Complaint Backend is Running",
  });
});

// Health Check Route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Server Error",
    error: err.message,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
