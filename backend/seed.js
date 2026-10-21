const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const NEW_ADMIN = {
  username: 'mandvi',
  password: '123456789',
  fullName: 'Mandvi', // change if you want a different display name
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ username: NEW_ADMIN.username });
    if (existing) {
      console.log(`User "${NEW_ADMIN.username}" already exists (role: ${existing.role}). No changes made.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(NEW_ADMIN.password, 10);

    const admin = await User.create({
      username: NEW_ADMIN.username,
      password: hashedPassword,
      role: 'admin',
      fullName: NEW_ADMIN.fullName,
    });

    console.log('Admin created successfully:');
    console.log({ username: admin.username, role: admin.role, id: admin._id });
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }
};

run();