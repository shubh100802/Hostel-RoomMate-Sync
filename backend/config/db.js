// ============ DATABASE CONFIGURATION ============
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mutual-hostel-manager";
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Connection Failed", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
