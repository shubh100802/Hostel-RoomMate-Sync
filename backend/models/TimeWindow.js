// ============ TIME WINDOW MODEL ============
const mongoose = require('mongoose');

const timeWindowSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: true }
});

module.exports = mongoose.model('TimeWindow', timeWindowSchema); 