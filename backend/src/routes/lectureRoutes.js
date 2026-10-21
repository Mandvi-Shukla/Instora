const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getLectureUploadUrl, createLecture, getLecturesForAdmin, deleteLecture,
  getNoteUploadUrl, createNote, getNotesForAdmin, deleteNote,
} = require('../controllers/lectureController');

router.use(protect, authorize('admin'));

router.get('/:batchId/lectures', getLecturesForAdmin);
router.post('/:batchId/lectures/upload-url', getLectureUploadUrl);
router.post('/:batchId/lectures', createLecture);
router.delete('/lectures/:lectureId', deleteLecture);

router.get('/:batchId/notes', getNotesForAdmin);
router.post('/:batchId/notes/upload-url', getNoteUploadUrl);
router.post('/:batchId/notes', createNote);
router.delete('/notes/:noteId', deleteNote);

module.exports = router;