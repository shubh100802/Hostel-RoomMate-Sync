// ============ WARDEN MODEL ============
const mongoose = require("mongoose");

const wardenSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: { type: String, required: true }
});

module.exports = mongoose.model("Warden", wardenSchema);
