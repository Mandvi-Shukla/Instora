const mongoose = require('mongoose');

const paidUserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  mustChangePassword: { type: Boolean, default: true },
  purchasedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PaidBatch' }],
}, { timestamps: true });

module.exports = mongoose.model('PaidUser', paidUserSchema);