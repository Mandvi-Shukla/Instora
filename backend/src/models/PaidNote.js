const mongoose = require('mongoose');

const paidNoteSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaidBatch', required: true },
  title: { type: String, required: true },
  fileKey: { type: String, required: true }, // R2 object key, private bucket
  fileType: { type: String }, // e.g. 'application/pdf'
}, { timestamps: true });

module.exports = mongoose.model('PaidNote', paidNoteSchema);