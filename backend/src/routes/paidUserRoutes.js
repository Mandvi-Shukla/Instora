const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getMyProfile, changeMyPassword } = require('../controllers/paidUserController');

router.use(protect, authorize('paiduser'));
router.get('/me', getMyProfile);
router.patch('/change-password', changeMyPassword);

module.exports = router;