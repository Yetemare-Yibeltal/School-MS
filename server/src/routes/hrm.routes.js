// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// HRM ROUTES
// kat-school/server/src/routes/hrm.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const hrmController = require('../controllers/hrm.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate, validateMongoId } = require('../middleware/validate.middleware');

router.use(protect);

const adminRoles = ['super_admin', 'admin'];
const hrRoles = ['super_admin', 'admin', 'hr_manager'];

// ─── Dashboard ────────────────────────────────
router.get('/dashboard', authorizeRoles(...hrRoles), hrmController.getHRMDashboard);

// ═══════════════════════════════════════════
// DEPARTMENT ROUTES
// ═══════════════════════════════════════════
router.get('/departments', hrmController.getAllDepartments);
router.post('/departments', authorizeRoles(...adminRoles), hrmController.createDepartment);
router.get('/departments/:id', validateMongoId('id'), hrmController.getDepartmentById);
router.patch(
  '/departments/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  hrmController.updateDepartment
);
router.delete(
  '/departments/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  hrmController.deleteDepartment
);

// ═══════════════════════════════════════════
// DESIGNATION ROUTES
// ═══════════════════════════════════════════
router.get('/designations', hrmController.getAllDesignations);
router.post('/designations', authorizeRoles(...adminRoles), hrmController.createDesignation);
router.get('/designations/:id', validateMongoId('id'), hrmController.getDesignationById);
router.patch(
  '/designations/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  hrmController.updateDesignation
);
router.delete(
  '/designations/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  hrmController.deleteDesignation
);

// ═══════════════════════════════════════════
// SALARY STRUCTURE ROUTES
// ═══════════════════════════════════════════
router.get(
  '/salary-structures',
  authorizeRoles(...hrRoles, 'accountant'),
  hrmController.getAllSalaryStructures
);
router.post('/salary-structures', authorizeRoles(...hrRoles), hrmController.createSalaryStructure);
router.get(
  '/salary-structures/:id',
  authorizeRoles(...hrRoles, 'accountant'),
  validateMongoId('id'),
  hrmController.getSalaryStructureById
);
router.patch(
  '/salary-structures/:id',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  hrmController.updateSalaryStructure
);
router.post(
  '/salary-structures/:id/preview',
  authorizeRoles(...hrRoles, 'accountant'),
  validateMongoId('id'),
  hrmController.calculateSalaryPreview
);

// ═══════════════════════════════════════════
// SALARY COMPONENT ROUTES
// ═══════════════════════════════════════════
router.get(
  '/salary-components',
  authorizeRoles(...hrRoles, 'accountant'),
  hrmController.getAllSalaryComponents
);
router.post(
  '/salary-components',
  authorizeRoles(...adminRoles),
  hrmController.createSalaryComponent
);
router.patch(
  '/salary-components/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  hrmController.updateSalaryComponent
);

// ═══════════════════════════════════════════
// PAYROLL ROUTES
// ═══════════════════════════════════════════
router.get(
  '/payroll/dashboard',
  authorizeRoles(...hrRoles, 'accountant'),
  hrmController.getPayrollDashboard
);
router.post(
  '/payroll/process',
  authorizeRoles(...hrRoles, 'accountant'),
  hrmController.processMonthlyPayroll
);
router.get('/payroll', authorizeRoles(...hrRoles, 'accountant'), hrmController.getMonthlyPayroll);
router.get(
  '/payroll/:id',
  authorizeRoles(...hrRoles, 'accountant'),
  validateMongoId('id'),
  hrmController.getPayrollById
);
router.post(
  '/payroll/:id/approve',
  authorizeRoles(...adminRoles, 'accountant'),
  validateMongoId('id'),
  hrmController.approvePayroll
);
router.post(
  '/payroll/batch/approve',
  authorizeRoles(...adminRoles, 'accountant'),
  hrmController.approvePayrollBatch
);
router.post(
  '/payroll/:id/mark-paid',
  authorizeRoles(...hrRoles, 'accountant'),
  validateMongoId('id'),
  hrmController.markPayrollPaid
);
router.post(
  '/payroll/batch/mark-paid',
  authorizeRoles(...hrRoles, 'accountant'),
  hrmController.markBatchPaid
);

// ═══════════════════════════════════════════
// LEAVE TYPE ROUTES
// ═══════════════════════════════════════════
router.get('/leave-types', hrmController.getAllLeaveTypes);
router.post('/leave-types', authorizeRoles(...adminRoles), hrmController.createLeaveType);
router.patch(
  '/leave-types/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  hrmController.updateLeaveType
);
router.delete(
  '/leave-types/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  hrmController.deleteLeaveType
);

// ═══════════════════════════════════════════
// LEAVE APPLICATION ROUTES
// ═══════════════════════════════════════════
router.get('/leaves', authorizeRoles(...hrRoles, 'teacher'), hrmController.getAllLeaveApplications);
router.post('/leaves', authorizeRoles(...hrRoles, 'teacher'), hrmController.applyLeave);
router.get('/leaves/on-leave-now', authorizeRoles(...hrRoles), hrmController.getCurrentlyOnLeave);
router.get('/leaves/:id', validateMongoId('id'), hrmController.getLeaveApplicationById);
router.post(
  '/leaves/:id/approve',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  hrmController.approveLeave
);
router.post(
  '/leaves/:id/reject',
  authorizeRoles(...hrRoles),
  validateMongoId('id'),
  hrmController.rejectLeave
);
router.post('/leaves/:id/cancel', validateMongoId('id'), hrmController.cancelLeave);

// ─── Leave Balances ───────────────────────────
router.get(
  '/leave-balances/:staffType/:staffId',
  authorizeRoles(...hrRoles, 'teacher'),
  hrmController.getLeaveBalances
);
router.post(
  '/leave-balances/initialize',
  authorizeRoles(...adminRoles),
  hrmController.initializeLeaveBalances
);

module.exports = router;
