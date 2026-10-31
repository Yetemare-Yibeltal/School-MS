// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EMPLOYEE ROUTES
// kat-school/server/src/routes/employee.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employee.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  validate,
  validateMongoId,
  validatePagination,
} = require('../middleware/validate.middleware');
const { createEmployeeSchema, updateEmployeeSchema } = require('../validators/employee.validator');
const { uploadImage } = require('../utils/fileUpload.util');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');

router.use(protect);

const hrRoles = ['super_admin', 'admin', 'hr_manager'];

// GET /api/employees/stats
router.get('/stats', authorizeRoles(...hrRoles), employeeController.getDashboardStats);

// GET /api/employees
router.get(
  '/',
  authorizeRoles(...hrRoles, 'receptionist'),
  validatePagination,
  employeeController.getAllEmployees
);

// POST /api/employees
router.post(
  '/',
  authorizeRoles(...hrRoles),
  validate(createEmployeeSchema),
  employeeController.createEmployee
);

// GET /api/employees/:id
router.get(
  '/:id',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  employeeController.getEmployeeById
);

// PATCH /api/employees/:id
router.patch(
  '/:id',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);

// DELETE /api/employees/:id
router.delete(
  '/:id',
  authorizeRoles('super_admin', 'admin'),
  validateMongoId('id'),
  employeeController.deleteEmployee
);

// POST /api/employees/:id/photo
router.post(
  '/:id/photo',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  uploadLimiter,
  uploadImage.single('photo'),
  employeeController.uploadPhoto
);

// GET /api/employees/:id/attendance
router.get(
  '/:id/attendance',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  employeeController.getAttendanceSummary
);

// GET /api/employees/:id/leave-balances
router.get(
  '/:id/leave-balances',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  employeeController.getLeaveBalances
);

// GET /api/employees/:id/leave-applications
router.get(
  '/:id/leave-applications',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  employeeController.getLeaveApplications
);

// GET /api/employees/:id/payroll
router.get(
  '/:id/payroll',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  employeeController.getPayrollHistory
);

module.exports = router;
