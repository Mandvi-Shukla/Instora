const express = require('express');
const router = express.Router();
const { createBatchOrder, verifyBatchPayment } = require('../controllers/paidBatchPurchaseController');

// Public routes — buyer isn't logged in yet at this point
router.post('/create-order', createBatchOrder);
router.post('/verify', verifyBatchPayment);

module.exports = router;