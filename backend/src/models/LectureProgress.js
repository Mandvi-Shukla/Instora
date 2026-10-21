const mongoose = require('mongoose');

const lectureProgressSchema = new mongoose.Schema({
  paidUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaidUser', required: true },
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaidBatch', required: true },
  watchedSeconds: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  lastWatchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

lectureProgressSchema.index({ paidUserId: 1, lectureId: 1 }, { unique: true });

module.exports = mongoose.model('LectureProgress', lectureProgressSchema);