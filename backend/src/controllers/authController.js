const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PaidUser = require('../models/PaidUser');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { id: user._id, role: user.role, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ success: true, token, role: user.role, username: user.username });
    }

    // Not found in User — check PaidUser (identifier is their email, entered in the same field)
    const paidUser = await PaidUser.findOne({ email: username.toLowerCase().trim() });
    if (paidUser) {
      const isMatch = await bcrypt.compare(password, paidUser.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { id: paidUser._id, role: 'paiduser', email: paidUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        token,
        role: 'paiduser',
        username: paidUser.email,
        mustChangePassword: paidUser.mustChangePassword,
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };