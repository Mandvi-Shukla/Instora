const PaidBatch = require('../models/PaidBatch');
const PaidUser = require('../models/PaidUser');
const PaidBatchOrder = require('../models/PaidBatchOrder');
const Lecture = require('../models/Lecture');
const PaidNote = require('../models/PaidNote');
const { uploadThumbnailToR2, deleteFromR2,deleteFromPrivateBucket  } = require('../config/r2');

// Admin: create a new batch (title, price, thumbnail only — details filled in later via edit)
const createPaidBatch = async (req, res, next) => {
  try {
    const { title, price, discountedPrice } = req.body;
    if (!title || !price) {
      return res.status(400).json({ success: false, message: 'Title and price are required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Thumbnail image is required' });
    }

    const key = `paid-batches/thumbnails/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
    const thumbnailUrl = await uploadThumbnailToR2(req.file.buffer, req.file.mimetype, key);

    const batch = await PaidBatch.create({
      title,
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
      thumbnailUrl,
      thumbnailKey: key,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, message: 'Batch created', data: batch });
  } catch (error) {
    next(error);
  }
};

// Admin: list all batches (published + draft)
const getAllPaidBatchesAdmin = async (req, res, next) => {
  try {
    const batches = await PaidBatch.find().sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
};

// Public: only published batches, for landing page cards
const getPublishedBatches = async (req, res, next) => {
  try {
    const batches = await PaidBatch.find({ isPublished: true })
      .select('title thumbnailUrl price discountedPrice shortDescription stats')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
};

// Public: single batch detail (only if published)
const getPublicBatchById = async (req, res, next) => {
  try {
    const batch = await PaidBatch.findOne({ _id: req.params.id, isPublished: true });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
};

// Admin: get single batch (published or draft) for editing
const getAdminBatchById = async (req, res, next) => {
  try {
    const batch = await PaidBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
};

// Admin: edit title / price / thumbnail
const updatePaidBatch = async (req, res, next) => {
  try {
    const batch = await PaidBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const { title, price, discountedPrice } = req.body;
    if (title) batch.title = title;
    if (price) batch.price = Number(price);
    if (discountedPrice !== undefined) batch.discountedPrice = discountedPrice ? Number(discountedPrice) : undefined;

    if (req.file) {
      const oldKey = batch.thumbnailKey;
      const key = `paid-batches/thumbnails/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      const thumbnailUrl = await uploadThumbnailToR2(req.file.buffer, req.file.mimetype, key);
      batch.thumbnailUrl = thumbnailUrl;
      batch.thumbnailKey = key;
      // best-effort cleanup, non-fatal like your doubt cleanup job
      deleteFromR2(oldKey).catch(() => {});
    }

    await batch.save();
    res.json({ success: true, message: 'Batch updated', data: batch });
  } catch (error) {
    next(error);
  }
};

// Admin: toggle publish on/off
const togglePublishBatch = async (req, res, next) => {
  try {
    const batch = await PaidBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    batch.isPublished = !batch.isPublished;
    await batch.save();
    res.json({ success: true, message: `Batch ${batch.isPublished ? 'published' : 'unpublished'}`, data: batch });
  } catch (error) {
    next(error);
  }
};
const updateBatchOverview = async (req, res, next) => {
  try {
    const batch = await PaidBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    const { shortDescription, description, stats, syllabus } = req.body;
    if (shortDescription !== undefined) batch.shortDescription = shortDescription;
    if (description !== undefined) batch.description = description;
    if (stats) batch.stats = { ...batch.stats.toObject(), ...stats };
    if (syllabus) batch.syllabus = syllabus;
    await batch.save();
    res.json({ success: true, message: 'Overview updated', data: batch });
  } catch (error) {
    next(error);
  }
};
const updateBatchCurriculum = async (req, res, next) => {
  try {
    const batch = await PaidBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    const { curriculumPreview } = req.body;
    if (!Array.isArray(curriculumPreview)) {
      return res.status(400).json({ success: false, message: 'curriculumPreview must be an array' });
    }
    batch.curriculumPreview = curriculumPreview;
    await batch.save();
    res.json({ success: true, message: 'Curriculum updated', data: batch });
  } catch (error) {
    next(error);
  }
};
const updateBatchFaqs = async (req, res, next) => {
  try {
    const batch = await PaidBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    const { faqs } = req.body;
    if (!Array.isArray(faqs)) {
      return res.status(400).json({ success: false, message: 'faqs must be an array' });
    }
    batch.faqs = faqs;
    await batch.save();
    res.json({ success: true, message: 'FAQs updated', data: batch });
  } catch (error) {
    next(error);
  }
};

const deletePaidBatch = async (req, res, next) => {
  try {
    const batch = await PaidBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Block if anyone has purchased this batch
    const buyerCount = await PaidUser.countDocuments({ purchasedBatches: batch._id });
    if (buyerCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${buyerCount} student${buyerCount !== 1 ? 's have' : ' has'} already purchased this batch. Unpublish it instead to stop new sales.`,
      });
    }

    // Safe to delete — cascade cleanup
    const lectures = await Lecture.find({ batchId: batch._id });
    const notes = await PaidNote.find({ batchId: batch._id });

    // Best-effort R2 cleanup, non-fatal (same pattern as your doubt cleanup job)
    await Promise.allSettled([
      deleteFromR2(batch.thumbnailKey),
      ...lectures.map(l => deleteFromPrivateBucket(l.videoKey)),
      ...notes.map(n => deleteFromPrivateBucket(n.fileKey)),
    ]);

    await Lecture.deleteMany({ batchId: batch._id });
    await PaidNote.deleteMany({ batchId: batch._id });
    await PaidBatchOrder.deleteMany({ batchId: batch._id }); // only 'created'/'failed' orders can exist here, since 'paid' ones would've blocked above
    await PaidBatch.findByIdAndDelete(batch._id);

    res.json({ success: true, message: 'Batch deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};