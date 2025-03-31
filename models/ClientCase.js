const mongoose = require('mongoose');

const clientCaseSchema = new mongoose.Schema({
  case_number: {
    type: String,
    required: true,
  },
  case_name: {
    type: String,
    required: false,
  },
  client_id: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: false,
  },
  home_address: {
    type: String,
    required: false,
  },
  work_address: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const ClientCase = mongoose.model('ClientCase', clientCaseSchema);
module.exports = ClientCase;
