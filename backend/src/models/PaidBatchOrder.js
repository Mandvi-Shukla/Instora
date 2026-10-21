const mongoose = require('mongoose');

const paidBatchOrderSchema = new mongoose.Schema({
  paidUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaidUser' },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaidBatch', required: true },
  fullName: String,
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  razorpayOrderId: { type: String, unique: true },
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
}, { timestamps: true });

module.exports = mongoose.model('PaidBatchOrder', paidBatchOrderSchema);