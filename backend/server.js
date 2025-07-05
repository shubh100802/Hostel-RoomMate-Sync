const dotenv = require("dotenv");
dotenv.config({ path: './.env' });

const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB before handling requests
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/healthz", (req, res) => res.status(200).send("OK"));

// API Routes
const authRoutes = require("./routes/authRoutes");
const wardenRoutes = require("./routes/wardenRoutes");
const studentRoutes = require("./routes/studentRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/warden", wardenRoutes);
app.use("/api/students", studentRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// SPA fallback: serve index.html for any unmatched non-API route
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/index.html"));
});

// 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ msg: "API endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ msg: "Internal server error" });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
