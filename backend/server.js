const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());

// FIXED: Added both local and production URLs to the allowed list
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://smart-campus-complaint-portal-us1b-v0qwpns8e.vercel.app"
    ],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

app.get("/", (req, res) => {
  res.send("Smart Campus Complaint Portal API Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});