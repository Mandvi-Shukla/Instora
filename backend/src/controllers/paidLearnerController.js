const Lecture = require('../models/Lecture');
const PaidNote = require('../models/PaidNote');
const LectureProgress = require('../models/LectureProgress');
const PaidUser = require('../models/PaidUser');
const { getPrivateWatchUrl } = require('../config/r2');

const verifyAccess = async (paidUserId, batchId) => {
  const paidUser = await PaidUser.findById(paidUserId);
  if (!paidUser) return false;
  return paidUser.purchasedBatches.some(b => b.toString() === batchId.toString());
};

// Learner: list lectures for a purchased batch, with their own progress attached
const getLecturesForLearner = async (req, res, next) => {
  try {
    const hasAccess = await verifyAccess(req.user._id, req.params.batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You do not have access to this batch' });
    }
    const lectures = await Lecture.find({ batchId: req.params.batchId }).sort({ order: 1, createdAt: 1 });
    const progressRecords = await LectureProgress.find({ paidUserId: req.user._id, batchId: req.params.batchId });
    const progressMap = Object.fromEntries(progressRecords.map(p => [p.lectureId.toString(), p]));

    const data = lectures.map(l => ({
      _id: l._id,
      title: l.title,
      durationMinutes: l.durationMinutes,
      order: l.order,
      watchedSeconds: progressMap[l._id.toString()]?.watchedSeconds || 0,
      isCompleted: progressMap[l._id.toString()]?.isCompleted || false,
    }));

    const completedCount = data.filter(l => l.isCompleted).length;
    const percentComplete = data.length ? Math.round((completedCount / data.length) * 100) : 0;

    res.json({ success: true, data: { lectures: data, percentComplete } });
  } catch (error) {
    next(error);
  }
};

// Learner: get a signed, short-lived watch URL for one lecture
const getWatchUrl = async (req, res, next) => {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }
    const hasAccess = await verifyAccess(req.user._id, lecture.batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You do not have access to this batch' });
    }
    const watchUrl = await getPrivateWatchUrl(lecture.videoKey, 7200); // 2-hour expiry
    res.json({ success: true, data: { watchUrl, title: lecture.title } });
  } catch (error) {
    next(error);
  }
};

// Learner: update watch progress (called periodically by the video player)
const updateProgress = async (req, res, next) => {
  try {
    const { watchedSeconds, durationSeconds } = req.body;
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }
    const hasAccess = await verifyAccess(req.user._id, lecture.batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You do not have access to this batch' });
    }

    const isCompleted = durationSeconds > 0 && (watchedSeconds / durationSeconds) >= 0.9;

    await LectureProgress.findOneAndUpdate(
      { paidUserId: req.user._id, lectureId: lecture._id },
      {
        paidUserId: req.user._id,
        lectureId: lecture._id,
        batchId: lecture.batchId,
        watchedSeconds: Math.round(watchedSeconds),
        isCompleted,
        lastWatchedAt: new Date(),
      },
      { upsert: true }
    );

    res.json({ success: true, message: 'Progress saved' });
  } catch (error) {
    next(error);
  }
};

// Learner: list notes for a purchased batch, with signed download URLs
const getNotesForLearner = async (req, res, next) => {
  try {
    const hasAccess = await verifyAccess(req.user._id, req.params.batchId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'You do not have access to this batch' });
    }
    const notes = await PaidNote.find({ batchId: req.params.batchId }).sort({ createdAt: -1 });
    const data = await Promise.all(notes.map(async (n) => ({
      _id: n._id,
      title: n.title,
      downloadUrl: await getPrivateWatchUrl(n.fileKey, 1800), // 30 min, enough to download
    })));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Learner: overall progress across all purchased batches — for the dashboard cards
const getMyProgressSummary = async (req, res, next) => {
  try {
    const paidUser = await PaidUser.findById(req.user._id);
    const batchIds = paidUser.purchasedBatches;
    const summary = {};
    for (const batchId of batchIds) {
      const lectures = await Lecture.countDocuments({ batchId });
      const completed = await LectureProgress.countDocuments({ paidUserId: req.user._id, batchId, isCompleted: true });
      summary[batchId] = { total: lectures, completed, percent: lectures ? Math.round((completed / lectures) * 100) : 0 };
    }
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLecturesForLearner, getWatchUrl, updateProgress, getNotesForLearner, getMyProgressSummary };