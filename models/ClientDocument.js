const mongoose = require('mongoose');

const clientDocumentSchema = new mongoose.Schema({
  client_id: {
    type: String,
    required: true,
  },
  case_number: {
    type: String,
    required: false,
  },
  file_name: {
    type: String,
    required: true,
  },
  file_path: {
    type: String,
    required: true,
  },
  file_type: {
    type: String,
    required: false,
  },
  file_size: {
    type: Number,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const ClientDocument = mongoose.model('ClientDocument', clientDocumentSchema);
module.exports = ClientDocument;
