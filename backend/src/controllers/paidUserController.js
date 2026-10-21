const bcrypt = require('bcryptjs');
const PaidUser = require('../models/PaidUser');

const getMyProfile = async (req, res, next) => {
  try {
    const paidUser = await PaidUser.findById(req.user._id)
      .select('-password')
      .populate('purchasedBatches', 'title thumbnailUrl description stats curriculumPreview faqs syllabus');
    if (!paidUser) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, data: paidUser });
  } catch (error) {
    next(error);
  }
};

const changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const paidUser = await PaidUser.findById(req.user._id);
    if (!paidUser) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // If this isn't their forced first change, verify current password
    if (!paidUser.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(currentPassword, paidUser.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    paidUser.password = await bcrypt.hash(newPassword, 10);
    paidUser.mustChangePassword = false;
    await paidUser.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyProfile, changeMyPassword };