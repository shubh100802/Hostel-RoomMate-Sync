// ============ ROOMMATE REQUEST MODEL ============
const mongoose = require("mongoose");

const roommateRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  requestedStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    respondedAt: Date
  }],
  bedType: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
});

module.exports = mongoose.model("RoommateRequest", roommateRequestSchema); 