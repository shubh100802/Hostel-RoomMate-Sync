// ============ STUDENT MODEL ============
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  regno: { type: String, required: true },
  bedType: String,
  password: { type: String, required: true },
  mutualPreferences: [String],
  hasSubmittedMutualForm: { type: Boolean, default: false },
  isCommittedToRoommate: { type: Boolean, default: false },
  committedRoommateRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoommateRequest'
  },
  finalRoomNo: { type: String, default: '' }
});

module.exports = mongoose.model("Student", studentSchema);
