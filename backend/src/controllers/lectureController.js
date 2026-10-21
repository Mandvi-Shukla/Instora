const Lecture = require('../models/Lecture');
const PaidNote = require('../models/PaidNote');
const PaidBatch = require('../models/PaidBatch');
const { getPrivateUploadUrl, deleteFromPrivateBucket } = require('../config/r2');

// Admin: request a presigned URL to upload a lecture video directly to R2
const getLectureUploadUrl = async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, message: 'fileName and contentType are required' });
    }
    const key = `lectures/${req.params.batchId}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const uploadUrl = await getPrivateUploadUrl(key, contentType);
    res.json({ success: true, data: { uploadUrl, key } });
  } catch (error) {
    next(error);
  }
};

// Admin: confirm upload finished, create the Lecture record
const createLecture = async (req, res, next) => {
  try {
    const { title, durationMinutes, videoKey, order } = req.body;
    if (!title || !videoKey) {
      return res.status(400).json({ success: false, message: 'title and videoKey are required' });
    }
    const batch = await PaidBatch.findById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    const lecture = await Lecture.create({
      batchId: req.params.batchId,
      title,
      videoKey,
      durationMinutes: Number(durationMinutes) || 0,
      order: Number(order) || 0,
    });

    // Keep batch stats roughly in sync automatically
    const totalLectures = await Lecture.countDocuments({ batchId: req.params.batchId });
    batch.stats.totalLectures = totalLectures;
    await batch.save();

    res.status(201).json({ success: true, message: 'Lecture added', data: lecture });
  } catch (error) {
    next(error);
  }
};

// Admin: list lectures for a batch (management view)
const getLecturesForAdmin = async (req, res, next) => {
  try {
    const lectures = await Lecture.find({ batchId: req.params.batchId }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: lectures });
  } catch (error) {
    next(error);
  }
};

// Admin: delete a lecture
const deleteLecture = async (req, res, next) => {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }
    deleteFromPrivateBucket(lecture.videoKey).catch(() => {}); // non-fatal cleanup

    const totalLectures = await Lecture.countDocuments({ batchId: lecture.batchId });
    await PaidBatch.findByIdAndUpdate(lecture.batchId, { 'stats.totalLectures': totalLectures });

    res.json({ success: true, message: 'Lecture deleted' });
  } catch (error) {
    next(error);
  }
};

// Admin: request upload URL for a note (PDF etc.)
const getNoteUploadUrl = async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, message: 'fileName and contentType are required' });
    }
    const key = `notes/${req.params.batchId}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const uploadUrl = await getPrivateUploadUrl(key, contentType);
    res.json({ success: true, data: { uploadUrl, key } });
  } catch (error) {
    next(error);
  }
};

// Admin: confirm note upload, create record
const createNote = async (req, res, next) => {
  try {
    const { title, fileKey, fileType } = req.body;
    if (!title || !fileKey) {
      return res.status(400).json({ success: false, message: 'title and fileKey are required' });
    }
    const note = await PaidNote.create({ batchId: req.params.batchId, title, fileKey, fileType });
    res.status(201).json({ success: true, message: 'Note added', data: note });
  } catch (error) {
    next(error);
  }
};

const getNotesForAdmin = async (req, res, next) => {
  try {
    const notes = await PaidNote.find({ batchId: req.params.batchId }).sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const note = await PaidNote.findByIdAndDelete(req.params.noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    deleteFromPrivateBucket(note.fileKey).catch(() => {});
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLectureUploadUrl, createLecture, getLecturesForAdmin, deleteLecture,
  getNoteUploadUrl, createNote, getNotesForAdmin, deleteNote,
};