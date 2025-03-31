const mongoose = require('mongoose');

const serveAttemptSchema = new mongoose.Schema({
  client_id: {
    type: String,
    required: true,
  },
  case_number: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    default: 'pending',
  },
  notes: {
    type: String,
    required: false,
  },
  coordinates: {
    type: Object,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  image_data: {
    type: String,
    required: false,
  },
  attempt_number: {
    type: Number,
    default: 1,
  }
});

const ServeAttempt = mongoose.model('ServeAttempt', serveAttemptSchema);
module.exports = ServeAttempt;
