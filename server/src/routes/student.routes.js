// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// STUDENT ROUTES
// kat-school/server/src/routes/student.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const studentController = require('../controllers/student.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles, checkStudentAccess } = require('../middleware/role.middleware');
const {
  validate,
  validateMongoId,
  validatePagination,
} = require('../middleware/validate.middleware');
const {
  createStudentSchema,
  updateStudentSchema,
  transferStudentSchema,
  studentFilterSchema,
} = require('../validators/student.validator');
const { uploadImage } = require('../utils/fileUpload.util');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');

// All routes require authentication
router.use(protect);

// ─── Stats ────────────────────────────────────
// GET /api/students/stats
router.get(
  '/stats',
  authorizeRoles('super_admin', 'admin', 'teacher', 'receptionist'),
  studentController.getDashboardStats
);

// ─── Bulk Operations ──────────────────────────
// POST /api/students/bulk-import
router.post(
  '/bulk-import',
  authorizeRoles('super_admin', 'admin', 'receptionist'),
  studentController.bulkImport
);

// POST /api/students/promote
router.post('/promote', authorizeRoles('super_admin', 'admin'), studentController.promoteStudents);

// ─── CRUD ─────────────────────────────────────
// GET /api/students
router.get(
  '/',
  authorizeRoles('super_admin', 'admin', 'teacher', 'receptionist', 'accountant', 'librarian'),
  validatePagination,
  studentController.getAllStudents
);

// POST /api/students
router.post(
  '/',
  authorizeRoles('super_admin', 'admin', 'receptionist'),
  validate(createStudentSchema),
  studentController.createStudent
);

// GET /api/students/:id
router.get('/:id', validateMongoId('id'), checkStudentAccess, studentController.getStudentById);

// PATCH /api/students/:id
router.patch(
  '/:id',
  authorizeRoles('super_admin', 'admin', 'receptionist', 'teacher'),
  validateMongoId('id'),
  validate(updateStudentSchema),
  studentController.updateStudent
);

// DELETE /api/students/:id
router.delete(
  '/:id',
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  studentController.deleteStudent
);

// ─── Photo ────────────────────────────────────
// POST /api/students/:id/photo
router.post(
  '/:id/photo',
  authorizeRoles('super_admin', 'admin', 'receptionist'),
  validateMongoId('id'),
  uploadLimiter,
  uploadImage.single('photo'),
  studentController.uploadPhoto
);

// ─── Transfer ─────────────────────────────────
// POST /api/students/:id/transfer
router.post(
  '/:id/transfer',
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  validate(transferStudentSchema),
  studentController.transferStudent
);

// ─── Student Detail Routes ────────────────────
// GET /api/students/:id/attendance
router.get(
  '/:id/attendance',
  validateMongoId('id'),
  checkStudentAccess,
  studentController.getAttendanceSummary
);

// GET /api/students/:id/fees
router.get('/:id/fees', validateMongoId('id'), checkStudentAccess, studentController.getFeeSummary);

// GET /api/students/:id/results
router.get(
  '/:id/results',
  validateMongoId('id'),
  checkStudentAccess,
  studentController.getExamResults
);

// GET /api/students/:id/suspensions
router.get(
  '/:id/suspensions',
  authorizeRoles('super_admin', 'admin', 'teacher'),
  validateMongoId('id'),
  studentController.getSuspensionHistory
);

// GET /api/students/:id/library
router.get(
  '/:id/library',
  validateMongoId('id'),
  checkStudentAccess,
  studentController.getLibraryHistory
);

module.exports = router;
