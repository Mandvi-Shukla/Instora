const crypto = require('crypto');
const Razorpay = require('razorpay');
const PaidBatch = require('../models/PaidBatch');
const PaidUser = require('../models/PaidUser');
const PaidBatchOrder = require('../models/PaidBatchOrder');
const { sendPasswordEmail } = require('../config/mailer');
const bcrypt = require('bcryptjs');

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured in environment variables');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const generatePassword = () => crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);

// Step 1: create Razorpay order for a batch purchase
const createBatchOrder = async (req, res, next) => {
  try {
    const { batchId, fullName, email } = req.body;
    if (!batchId || !fullName || !email) {
      return res.status(400).json({ success: false, message: 'batchId, fullName and email are required' });
    }

    const batch = await PaidBatch.findOne({ _id: batchId, isPublished: true });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const amount = batch.discountedPrice || batch.price;
    const amountInPaise = amount * 100;
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `batch_${Date.now()}`,
    });

    await PaidBatchOrder.create({
      batchId,
      fullName,
      email: email.toLowerCase().trim(),
      amount,
      razorpayOrderId: order.id,
      status: 'created',
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountInPaise,
        keyId: process.env.RAZORPAY_KEY_ID,
        batchTitle: batch.title,
        fullName,
        email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Step 2: verify payment, create/update PaidUser, send email
const verifyBatchPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const orderRecord = await PaidBatchOrder.findOne({ razorpayOrderId: razorpay_order_id });
    if (!orderRecord) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (orderRecord.status === 'paid') {
      // idempotency guard — same pattern as your existing fee payment flow
      return res.json({ success: true, message: 'Already verified', data: { alreadyProcessed: true } });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      orderRecord.status = 'failed';
      await orderRecord.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Signature valid — find or create the PaidUser
    let paidUser = await PaidUser.findOne({ email: orderRecord.email });
    let isNewUser = false;
    let plainPassword = null;

    if (!paidUser) {
      isNewUser = true;
      plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      paidUser = await PaidUser.create({
        fullName: orderRecord.fullName,
        email: orderRecord.email,
        password: hashedPassword,
        purchasedBatches: [orderRecord.batchId],
      });
    } else {
      if (!paidUser.purchasedBatches.includes(orderRecord.batchId)) {
        paidUser.purchasedBatches.push(orderRecord.batchId);
        await paidUser.save();
      }
    }

    orderRecord.status = 'paid';
    orderRecord.razorpayPaymentId = razorpay_payment_id;
    orderRecord.razorpaySignature = razorpay_signature;
    orderRecord.paidUserId = paidUser._id;
    await orderRecord.save();

    const batch = await PaidBatch.findById(orderRecord.batchId);

    if (isNewUser) {
      try {
        await sendPasswordEmail(paidUser.email, paidUser.fullName, plainPassword, batch.title);
      } catch (emailErr) {
        // Non-fatal — payment succeeded, log for manual follow-up rather than failing the request
        console.error('Failed to send password email:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified',
      data: { isNewUser, email: paidUser.email, batchTitle: batch.title },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBatchOrder, verifyBatchPayment };