const mongoose = require('mongoose');

const paidBatchSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  thumbnailUrl: { type: String, required: true },
  thumbnailKey: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number },
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },
  syllabus: [{
    topic: String,
    description: String,
  }],
  curriculumPreview: [{
    title: String,
    durationMinutes: Number,
  }],
  faqs: [{
    question: String,
    answer: String,
  }],
  stats: {
    totalLectures: { type: Number, default: 0 },
    totalDurationHours: { type: Number, default: 0 },
    videosPerDay: { type: Number, default: 0 },
    validityMonths: { type: Number, default: 12 },
  },
  isPublished: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PaidBatch', paidBatchSchema);