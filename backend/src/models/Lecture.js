const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaidBatch', required: true },
  title: { type: String, required: true },
  videoKey: { type: String, required: true }, // R2 object key, private bucket
  durationMinutes: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Lecture', lectureSchema);