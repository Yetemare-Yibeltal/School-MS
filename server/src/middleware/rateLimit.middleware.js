// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// RATE LIMITER MIDDLEWARE
// kat-school/server/src/middleware/rateLimiter.middleware.js
// ============================================

'use strict';

const rateLimit = require('express-rate-limit');
const { HTTP_STATUS } = require('../config/constants');

// ─── Base Rate Limiter Config ─────────────────
const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      success: false,
      message: options.message || 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000 / 60),
    },
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS || 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?._id?.toString() || req.ip || 'unknown';
    },
    skip: (req) => {
      // Skip rate limiting for super admins
      return req.user?.role === 'super_admin';
    },
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });
};

// ─── Global Rate Limiter ──────────────────────
// Applied to all API routes
const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: 'Too many requests from this IP.',
});

// ─── Auth Rate Limiter ────────────────────────
// Strict limiter for login and password reset
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

// ─── Login Rate Limiter ───────────────────────
// Very strict for login endpoint
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Account may be locked. Try again in 15 minutes.',
  keyGenerator: (req) => {
    // Rate limit by email + IP
    const email = req.body?.email || '';
    return `${email}:${req.ip}`;
  },
});

// ─── Password Reset Limiter ───────────────────
const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests. Please try again in 1 hour.',
});

// ─── File Upload Limiter ──────────────────────
const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many file uploads. Please try again later.',
});

// ─── AI Feature Limiter ───────────────────────
const aiLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'AI feature usage limit reached. Please try again in 1 hour.',
});

// ─── Strict Limiter ───────────────────────────
// For very sensitive operations
const strictLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Rate limit exceeded for this operation.',
});

// ─── Attendance Marking Limiter ───────────────
const attendanceLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: 'Too many attendance requests.',
});

// ─── API Key Limiter ──────────────────────────
// For public API endpoints
const apiKeyLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: 'API rate limit exceeded.',
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip || 'unknown';
  },
});

// ─── Report Generation Limiter ────────────────
const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many report generation requests. Please try again later.',
});

// ─── SMS/Email Limiter ────────────────────────
const notificationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Notification limit reached for this hour.',
});

// ─── Dynamic Rate Limiter ─────────────────────
// Creates rate limiter on the fly with custom options
const dynamicLimiter = (maxRequests, windowMinutes = 15) => {
  return createLimiter({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: `Rate limit: max ${maxRequests} requests per ${windowMinutes} minutes.`,
  });
};

module.exports = {
  globalLimiter,
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  uploadLimiter,
  aiLimiter,
  strictLimiter,
  attendanceLimiter,
  apiKeyLimiter,
  reportLimiter,
  notificationLimiter,
  dynamicLimiter,
  createLimiter,
};
