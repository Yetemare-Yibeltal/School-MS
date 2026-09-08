// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// AUTH ROUTES
// kat-school/server/src/routes/auth.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect, refreshAccessToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  loginLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
} = require('../middleware/rateLimiter.middleware');
const {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  resendVerificationSchema,
} = require('../validators/auth.validator');
const { validateMongoId } = require('../middleware/validate.middleware');
const { uploadImage } = require('../utils/fileUpload.util');

// ─── Public Routes ────────────────────────────

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', refreshAccessToken);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// POST /api/auth/reset-password/:token
router.post(
  '/reset-password/:token',
  passwordResetLimiter,
  validate(resetPasswordSchema, 'body'),
  authController.resetPassword
);

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', authController.verifyEmail);

// POST /api/auth/resend-verification
router.post(
  '/resend-verification',
  authLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification
);

// ─── Protected Routes ──────────────────────────

// POST /api/auth/logout
router.post('/logout', protect, authController.logout);

// GET /api/auth/me
router.get('/me', protect, authController.getMe);

// PATCH /api/auth/me
router.patch('/me', protect, validate(updateProfileSchema), authController.updateProfile);

// POST /api/auth/change-password
router.post(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);

// POST /api/auth/me/photo
router.post(
  '/me/photo',
  protect,
  uploadLimiter,
  uploadImage.single('photo'),
  authController.uploadProfilePhoto
);

// ─── Admin Routes ──────────────────────────────

// GET /api/auth/users
router.get('/users', protect, authorizeRoles('super_admin', 'admin'), authController.getAllUsers);

// GET /api/auth/users/stats
router.get(
  '/users/stats',
  protect,
  authorizeRoles('super_admin', 'admin'),
  authController.getAuthStats
);

// GET /api/auth/users/:id
router.get(
  '/users/:id',
  protect,
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  authController.getUserById
);

// PATCH /api/auth/users/:id
router.patch(
  '/users/:id',
  protect,
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  authController.updateUser
);

// PATCH /api/auth/users/:id/deactivate
router.patch(
  '/users/:id/deactivate',
  protect,
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  authController.deactivateUser
);

// PATCH /api/auth/users/:id/reactivate
router.patch(
  '/users/:id/reactivate',
  protect,
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  authController.reactivateUser
);

// POST /api/auth/users/:id/reset-password
router.post(
  '/users/:id/reset-password',
  protect,
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  authController.resetUserPassword
);

module.exports = router;
