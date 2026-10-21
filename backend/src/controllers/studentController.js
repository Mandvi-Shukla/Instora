const Student = require('../models/Student');
const User = require('../models/User');
const Fee = require('../models/Fee');
const bcrypt = require('bcryptjs');
const Payment = require('../models/Payment');

const createStudent = async (req, res, next) => {
  try {
    const { fullName, username, password, parentPhone, batchId, monthlyFee, initialFeeStatus, joiningDate } = req.body;
    if (!fullName || !username || !password || !parentPhone || !batchId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role: 'student' });

    // Use admin-provided joining date, fallback to today if not sent
    const resolvedJoiningDate = joiningDate ? new Date(joiningDate) : new Date();

    const feeAmount = Number(monthlyFee) || 0;
    const feeStatus = initialFeeStatus === 'paid' ? 'paid' : 'pending';
    const student = await Student.create({
      userId: user._id,
      fullName,
      parentPhone,
      batchId,
      monthlyFee: feeAmount,
      feeStatus: feeAmount > 0 ? feeStatus : 'pending',
      joiningDate: resolvedJoiningDate,
    });
   if (feeAmount > 0) {
  const endDate = new Date(resolvedJoiningDate);
  endDate.setMonth(endDate.getMonth() + 1);
  const fee = await Fee.create({
    studentId: student._id,
    batchId,
    amount: feeAmount,
    paidAmount: feeStatus === 'paid' ? feeAmount : 0,
    startDate: resolvedJoiningDate,
    endDate,
    status: feeStatus,
  });
  if (feeStatus === 'paid') {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        let receiptNumber = `RCP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
        let exists = await Payment.findOne({ receiptNumber });
        while (exists) {
          receiptNumber = `RCP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
          exists = await Payment.findOne({ receiptNumber });
        }
        await Payment.create({
          studentId: student._id,
          feeId: fee._id,
          amount: feeAmount,
          receiptNumber,
          paymentMethod: 'cash',
          note: 'Initial payment at admission',
          recordedBy: req.user.id,
        });
      }
    }
    const populated = await Student.findById(student._id)
      .populate('userId', 'username')
      .populate('batchId', 'name course');
    res.status(201).json({ success: true, message: 'Student created', data: populated });
  } catch (error) {
    next(error);
  }
};

const getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find()
      .populate('userId', 'username')
      .populate('batchId', 'name course')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'username')
      .populate('batchId', 'name course');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    await User.findByIdAndDelete(student.userId);
    await Fee.deleteMany({ studentId: student._id });
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('userId', 'username')
      .populate('batchId', 'name course');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

const updateJoiningDate = async (req, res, next) => {
  try {
    const { joiningDate } = req.body;
    if (!joiningDate) {
      return res.status(400).json({ success: false, message: 'joiningDate is required' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const feeCount = await Fee.countDocuments({ studentId: student._id });
    if (feeCount > 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change joining date — student already has multiple fee cycles generated. Please contact support to fix this manually.',
      });
    }

    const newJoiningDate = new Date(joiningDate);
    student.joiningDate = newJoiningDate;
    await student.save();

    // If exactly one fee record exists (the first cycle), realign it to the new date
    if (feeCount === 1) {
      const fee = await Fee.findOne({ studentId: student._id });
      const newEndDate = new Date(newJoiningDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      fee.startDate = newJoiningDate;
      fee.endDate = newEndDate;
      await fee.save();
    }

    const populated = await Student.findById(student._id)
      .populate('userId', 'username')
      .populate('batchId', 'name course');

    res.json({ success: true, message: 'Joining date updated', data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = { createStudent, getAllStudents, getStudentById, deleteStudent, getMyProfile, updateJoiningDate };
