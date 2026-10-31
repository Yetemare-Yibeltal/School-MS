// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXPRESS APP
// kat-school/server/src/app.js
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');

const app = express();

// ─── Security Middleware ───────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());
app.use(hpp());

// ─── CORS ─────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─── Logger ───────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files ─────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Health Check ─────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Kat School API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────
app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/students',       require('./routes/student.routes'));
app.use('/api/teachers',       require('./routes/teacher.routes'));
app.use('/api/employees',      require('./routes/employee.routes'));
app.use('/api/academic',       require('./routes/academic.routes'));
app.use('/api/attendance',     require('./routes/attendance.routes'));
app.use('/api/exams',          require('./routes/exam.routes'));
app.use('/api/report-cards',   require('./routes/reportCard.routes'));
app.use('/api/finance',        require('./routes/finance.routes'));
app.use('/api/hrm',            require('./routes/hrm.routes'));
app.use('/api/library',        require('./routes/library.routes'));
app.use('/api/communications', require('./routes/communication.routes'));
// app.use('/api/system',         require('./routes/system.routes'));
// app.use('/api/ai',             require('./routes/ai.routes'));

// ─── 404 Handler ──────────────────────────────
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

// ─── Global Error Handler ─────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', err);
    return res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ status: 'fail', message: errors.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ status: 'fail', message: `${field} already exists.` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ status: 'fail', message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ status: 'fail', message: 'Token expired.' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ status: 'fail', message: `Invalid ${err.path}: ${err.value}` });
  }

  res.status(statusCode).json({
    status,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
  });
});

module.exports = app;
