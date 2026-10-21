const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  createPaidBatch,
  getAllPaidBatchesAdmin,
  getPublishedBatches,
  getPublicBatchById,
  getAdminBatchById,
  updatePaidBatch,
  togglePublishBatch,
  updateBatchOverview,
  updateBatchCurriculum,
  updateBatchFaqs,
  deletePaidBatch,
} = require('../controllers/paidBatchController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/public', getPublishedBatches);
router.get('/public/:id', getPublicBatchById);

router.use(protect);
router.get('/', authorize('admin'), getAllPaidBatchesAdmin);
router.get('/:id', authorize('admin'), getAdminBatchById);
router.post('/', authorize('admin'), upload.single('thumbnail'), createPaidBatch);
router.patch('/:id', authorize('admin'), upload.single('thumbnail'), updatePaidBatch);
router.patch('/:id/publish', authorize('admin'), togglePublishBatch);
router.patch('/:id/overview', authorize('admin'), updateBatchOverview);
router.patch('/:id/curriculum', authorize('admin'), updateBatchCurriculum);
router.patch('/:id/faqs', authorize('admin'), updateBatchFaqs);
router.delete('/:id', authorize('admin'), deletePaidBatch);


module.exports = router;