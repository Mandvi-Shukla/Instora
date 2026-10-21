const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getLecturesForLearner, getWatchUrl, updateProgress, getNotesForLearner, getMyProgressSummary,
} = require('../controllers/paidLearnerController');

router.use(protect, authorize('paiduser'));

router.get('/progress-summary', getMyProgressSummary);
router.get('/:batchId/lectures', getLecturesForLearner);
router.get('/:batchId/notes', getNotesForLearner);
router.get('/lectures/:lectureId/watch', getWatchUrl);
router.post('/lectures/:lectureId/progress', updateProgress);

module.exports = router;