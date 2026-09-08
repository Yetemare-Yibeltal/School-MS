// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ATTENDANCE ROUTES
// kat-school/server/src/routes/attendance.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate, validateMongoId } = require('../middleware/validate.middleware');
const {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  updateAttendanceSchema,
  markTeacherAttendanceSchema,
  bulkMarkTeacherAttendanceSchema,
  createHolidaySchema,
  updateAttendanceSettingsSchema,
} = require('../validators/attendance.validator');

router.use(protect);

const adminRoles = ['super_admin', 'admin'];
const teacherRoles = ['super_admin', 'admin', 'teacher'];
const hrRoles = ['super_admin', 'admin', 'hr_manager'];

// ─── Dashboard ────────────────────────────────
router.get(
  '/dashboard',
  authorizeRoles(...teacherRoles, 'receptionist'),
  attendanceController.getAttendanceDashboard
);

// ─── Student Attendance ───────────────────────
router.post(
  '/mark',
  authorizeRoles(...teacherRoles),
  validate(markAttendanceSchema),
  attendanceController.markAttendance
);
router.post(
  '/bulk-mark',
  authorizeRoles(...teacherRoles),
  validate(bulkMarkAttendanceSchema),
  attendanceController.bulkMarkAttendance
);
router.patch(
  '/:id',
  authorizeRoles(...teacherRoles),
  validateMongoId('id'),
  validate(updateAttendanceSchema),
  attendanceController.updateAttendance
);
router.get(
  '/by-date',
  authorizeRoles(...teacherRoles, 'receptionist'),
  attendanceController.getAttendanceByDateSection
);
router.get(
  '/student/:studentId',
  authorizeRoles(...teacherRoles, 'parent', 'student'),
  validateMongoId('studentId'),
  attendanceController.getStudentAttendanceReport
);
router.get(
  '/section/:section/report',
  authorizeRoles(...teacherRoles),
  attendanceController.getSectionAttendanceReport
);

// ─── Staff Attendance ─────────────────────────
router.post(
  '/staff/mark',
  authorizeRoles(...hrRoles, ...teacherRoles),
  validate(markTeacherAttendanceSchema),
  attendanceController.markTeacherAttendance
);
router.post(
  '/staff/bulk-mark',
  authorizeRoles(...hrRoles),
  validate(bulkMarkTeacherAttendanceSchema),
  attendanceController.bulkMarkTeacherAttendance
);
router.get(
  '/staff/report',
  authorizeRoles(...hrRoles),
  attendanceController.getStaffAttendanceReport
);

// ─── Holidays ─────────────────────────────────
router.get('/holidays', attendanceController.getAllHolidays);
router.post(
  '/holidays',
  authorizeRoles(...adminRoles),
  validate(createHolidaySchema),
  attendanceController.createHoliday
);
router.patch(
  '/holidays/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  attendanceController.updateHoliday
);
router.delete(
  '/holidays/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  attendanceController.deleteHoliday
);

// ─── Settings ─────────────────────────────────
router.get('/settings', attendanceController.getAttendanceSettings);
router.patch(
  '/settings',
  authorizeRoles(...adminRoles),
  validate(updateAttendanceSettingsSchema),
  attendanceController.updateAttendanceSettings
);

module.exports = router;
