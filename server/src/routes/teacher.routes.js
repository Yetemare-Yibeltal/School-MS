// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TEACHER ROUTES
// kat-school/server/src/routes/teacher.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const teacherController = require('../controllers/teacher.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  validate,
  validateMongoId,
  validatePagination,
} = require('../middleware/validate.middleware');
const { createTeacherSchema, updateTeacherSchema } = require('../validators/teacher.validator');
const { uploadImage } = require('../utils/fileUpload.util');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');

router.use(protect);

// ─── Stats ────────────────────────────────────
// GET /api/teachers/stats
router.get(
  '/stats',
  authorizeRoles('super_admin', 'admin', 'hr_manager'),
  teacherController.getDashboardStats
);

// ─── CRUD ─────────────────────────────────────
// GET /api/teachers
router.get(
  '/',
  authorizeRoles('super_admin', 'admin', 'hr_manager', 'receptionist'),
  validatePagination,
  teacherController.getAllTeachers
);

// POST /api/teachers
router.post(
  '/',
  authorizeRoles('super_admin', 'admin', 'hr_manager'),
  validate(createTeacherSchema),
  teacherController.createTeacher
);

// GET /api/teachers/:id
router.get(
  '/:id',
  authorizeRoles('super_admin', 'admin', 'hr_manager', 'teacher', 'receptionist'),
  validateMongoId('id'),
  teacherController.getTeacherById
);

// PATCH /api/teachers/:id
router.patch(
  '/:id',
  authorizeRoles('super_admin', 'admin', 'hr_manager'),
  validateMongoId('id'),
  validate(updateTeacherSchema),
  teacherController.updateTeacher
);

// DELETE /api/teachers/:id
router.delete(
  '/:id',
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  teacherController.deleteTeacher
);

// ─── Photo ────────────────────────────────────
// POST /api/teachers/:id/photo
router.post(
  '/:id/photo',
  authorizeRoles('super_admin', 'admin', 'hr_manager'),
  validateMongoId('id'),
  uploadLimiter,
  uploadImage.single('photo'),
  teacherController.uploadPhoto
);

// ─── Teacher Detail Routes ────────────────────
// GET /api/teachers/:id/timetable
router.get(
  '/:id/timetable',
  authorizeRoles('super_admin', 'admin', 'teacher', 'receptionist'),
  validateMongoId('id'),
  teacherController.getTeacherTimetable
);

// GET /api/teachers/:id/attendance
router.get(
  '/:id/attendance',
  authorizeRoles('super_admin', 'admin', 'hr_manager', 'teacher'),
  validateMongoId('id'),
  teacherController.getAttendanceSummary
);

// GET /api/teachers/:id/leave-balances
router.get(
  '/:id/leave-balances',
  authorizeRoles('super_admin', 'admin', 'hr_manager', 'teacher'),
  validateMongoId('id'),
  teacherController.getLeaveBalances
);

// GET /api/teachers/:id/leave-applications
router.get(
  '/:id/leave-applications',
  authorizeRoles('super_admin', 'admin', 'hr_manager', 'teacher'),
  validateMongoId('id'),
  teacherController.getLeaveApplications
);

// GET /api/teachers/:id/payroll
router.get(
  '/:id/payroll',
  authorizeRoles('super_admin', 'admin', 'hr_manager', 'accountant'),
  validateMongoId('id'),
  teacherController.getPayrollHistory
);

module.exports = router;
