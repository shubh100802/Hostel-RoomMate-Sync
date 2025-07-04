// ============ SERVER CONFIGURATION ============
const dotenv = require("dotenv");
dotenv.config({ path: './.env' });

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const wardenRoutes = require("./routes/wardenRoutes");
const studentRoutes = require("./routes/studentRoutes");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE SETUP ============
app.use(cors());
app.use(express.json());

// ============ ROUTES SETUP ============
app.use("/api/auth", authRoutes);
app.use("/api/warden", wardenRoutes);
app.use("/api/students", studentRoutes);

// ============ SERVE FRONTEND STATIC FILES ============
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ============ SERVER STARTUP ============
connectDB();
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
