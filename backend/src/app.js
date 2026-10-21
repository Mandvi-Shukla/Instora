const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const batchRoutes = require('./routes/batchRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feeRoutes = require('./routes/feeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const testRoutes = require('./routes/testRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const doubtRoutes = require('./routes/doubtRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const paidBatchRoutes = require('./routes/paidBatchRoutes');
const paidBatchPurchaseRoutes = require('./routes/paidBatchPurchaseRoutes');
const paidUserRoutes = require('./routes/paidUserRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const paidLearnerRoutes = require('./routes/paidLearnerRoutes');

const app = express();

// Configure CORS before other middleware and routes.
const allowedOrigins = [
  'https://instora-beta.vercel.app',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }

    console.error(`CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(helmet());

// Handle JSON requests up to 10 MB.
app.use(express.json({ limit: '10mb' }));

// NoSQL injection guard.
const hasInjection = (obj) => {
  if (typeof obj !== 'object' || obj === null) return false;

  return Object.keys(obj).some(
    key =>
      key.includes('$') ||
      key.includes('\x00') ||
      hasInjection(obj[key])
  );
};

const noSQLInjection = (req, res, next) => {
  if (hasInjection(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
    });
  }

  next();
};

app.use(noSQLInjection);

// Login rate limiter.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many login attempts. Try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/paid-batches/purchase', paidBatchPurchaseRoutes);
app.use('/api/admin/content', lectureRoutes);
app.use('/api/learn', paidLearnerRoutes);
app.use('/api/paid-batches', paidBatchRoutes);
app.use('/api/paid-users', paidUserRoutes);

// Health check.
app.get('/', (req, res) => {
  res.json({
    message: 'Instora API is running',
  });
});

// Global error handler.
app.use(errorHandler);

module.exports = app;