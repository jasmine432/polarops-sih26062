const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// ===============================
// Middleware
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// Root Route
// ===============================

app.get("/", (req, res) => {
  res.json({
    service: "Polar Expedition Logistics Backend",
    status: "running",
    version: "1.0.0"
  });
});

// ===============================
// Health Check
// ===============================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});