// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FINANCE ROUTES
// kat-school/server/src/routes/finance.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const financeController = require('../controllers/finance.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  validate,
  validateMongoId,
  validatePagination,
} = require('../middleware/validate.middleware');
const {
  createFeeTypeSchema,
  createFeeGroupSchema,
  createFeeDiscountSchema,
  createFeeAssignmentSchema,
  createFeePaymentSchema,
  refundPaymentSchema,
  createIncomeSchema,
  createExpenseSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
} = require('../validators/fee.validator');
const { auditFinancial } = require('../middleware/audit.middleware');

router.use(protect);

const adminRoles = ['super_admin', 'admin'];
const financeRoles = ['super_admin', 'admin', 'accountant'];

// ─── Dashboard & Reports ──────────────────────
router.get('/dashboard', authorizeRoles(...financeRoles), financeController.getFinancialDashboard);
router.get('/report', authorizeRoles(...financeRoles), financeController.getFinancialReport);
router.get('/payments/stats', authorizeRoles(...financeRoles), financeController.getPaymentStats);

// ═══════════════════════════════════════════
// FEE TYPE ROUTES
// ═══════════════════════════════════════════
router.get(
  '/fee-types',
  authorizeRoles(...financeRoles, 'receptionist'),
  financeController.getAllFeeTypes
);
router.post(
  '/fee-types',
  authorizeRoles(...adminRoles, 'accountant'),
  validate(createFeeTypeSchema),
  financeController.createFeeType
);
router.get(
  '/fee-types/:id',
  authorizeRoles(...financeRoles),
  validateMongoId('id'),
  financeController.getFeeTypeById
);
router.patch(
  '/fee-types/:id',
  authorizeRoles(...adminRoles, 'accountant'),
  validateMongoId('id'),
  financeController.updateFeeType
);
router.delete(
  '/fee-types/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  financeController.deleteFeeType
);

// ═══════════════════════════════════════════
// FEE GROUP ROUTES
// ═══════════════════════════════════════════
router.get('/fee-groups', authorizeRoles(...financeRoles), financeController.getAllFeeGroups);
router.post(
  '/fee-groups',
  authorizeRoles(...adminRoles, 'accountant'),
  validate(createFeeGroupSchema),
  financeController.createFeeGroup
);
router.patch(
  '/fee-groups/:id',
  authorizeRoles(...adminRoles, 'accountant'),
  validateMongoId('id'),
  financeController.updateFeeGroup
);
router.delete(
  '/fee-groups/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  financeController.deleteFeeGroup
);

// ═══════════════════════════════════════════
// FEE DISCOUNT ROUTES
// ═══════════════════════════════════════════
router.get('/discounts', authorizeRoles(...financeRoles), financeController.getAllFeeDiscounts);
router.post(
  '/discounts',
  authorizeRoles(...adminRoles, 'accountant'),
  validate(createFeeDiscountSchema),
  financeController.createFeeDiscount
);
router.patch(
  '/discounts/:id',
  authorizeRoles(...adminRoles, 'accountant'),
  validateMongoId('id'),
  financeController.updateFeeDiscount
);
router.delete(
  '/discounts/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  financeController.deleteFeeDiscount
);

// ═══════════════════════════════════════════
// FEE ASSIGNMENT ROUTES
// ═══════════════════════════════════════════
router.get(
  '/assignments',
  authorizeRoles(...financeRoles, 'receptionist'),
  validatePagination,
  financeController.getFeeAssignments
);
router.post(
  '/assignments',
  authorizeRoles(...financeRoles),
  validate(createFeeAssignmentSchema),
  financeController.assignFee
);
router.post('/assignments/bulk', authorizeRoles(...financeRoles), financeController.bulkAssignFees);
router.get(
  '/assignments/:id',
  authorizeRoles(...financeRoles, 'receptionist', 'parent', 'student'),
  validateMongoId('id'),
  financeController.getFeeAssignmentById
);
router.patch(
  '/assignments/:id',
  authorizeRoles(...financeRoles),
  validateMongoId('id'),
  financeController.updateFeeAssignment
);
router.post(
  '/assignments/:id/cancel',
  authorizeRoles(...adminRoles, 'accountant'),
  validateMongoId('id'),
  financeController.cancelFeeAssignment
);

// ═══════════════════════════════════════════
// FEE PAYMENT ROUTES
// ═══════════════════════════════════════════
router.get(
  '/payments',
  authorizeRoles(...financeRoles, 'receptionist'),
  validatePagination,
  financeController.getAllPayments
);
router.post(
  '/payments',
  authorizeRoles(...financeRoles, 'receptionist'),
  auditFinancial,
  validate(createFeePaymentSchema),
  financeController.collectPayment
);
router.get(
  '/payments/:id',
  authorizeRoles(...financeRoles, 'receptionist', 'parent', 'student'),
  validateMongoId('id'),
  financeController.getPaymentById
);
router.post(
  '/payments/:id/refund',
  authorizeRoles(...adminRoles, 'accountant'),
  auditFinancial,
  validateMongoId('id'),
  validate(refundPaymentSchema),
  financeController.refundPayment
);

// ═══════════════════════════════════════════
// INCOME ROUTES
// ═══════════════════════════════════════════
router.get(
  '/income',
  authorizeRoles(...financeRoles),
  validatePagination,
  financeController.getAllIncome
);
router.post(
  '/income',
  authorizeRoles(...financeRoles),
  validate(createIncomeSchema),
  financeController.createIncome
);
router.patch(
  '/income/:id',
  authorizeRoles(...financeRoles),
  validateMongoId('id'),
  financeController.updateIncome
);
router.delete(
  '/income/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  financeController.deleteIncome
);

// ═══════════════════════════════════════════
// EXPENSE CATEGORY ROUTES
// ═══════════════════════════════════════════
router.get(
  '/expense-categories',
  authorizeRoles(...financeRoles, 'admin'),
  financeController.getAllExpenseCategories
);
router.post(
  '/expense-categories',
  authorizeRoles(...adminRoles),
  financeController.createExpenseCategory
);

// ═══════════════════════════════════════════
// EXPENSE ROUTES
// ═══════════════════════════════════════════
router.get(
  '/expenses',
  authorizeRoles(...financeRoles, 'hr_manager', 'admin'),
  validatePagination,
  financeController.getAllExpenses
);
router.post(
  '/expenses',
  authorizeRoles(...financeRoles, 'hr_manager', 'teacher', 'receptionist'),
  validate(createExpenseSchema),
  financeController.createExpense
);
router.get(
  '/expenses/:id',
  authorizeRoles(...financeRoles, 'hr_manager', 'admin', 'teacher'),
  validateMongoId('id'),
  financeController.getExpenseById
);
router.patch(
  '/expenses/:id',
  authorizeRoles(...financeRoles, 'hr_manager'),
  validateMongoId('id'),
  financeController.updateExpense
);
router.post(
  '/expenses/:id/approve',
  authorizeRoles(...financeRoles),
  auditFinancial,
  validateMongoId('id'),
  validate(approveExpenseSchema),
  financeController.approveExpense
);
router.post(
  '/expenses/:id/reject',
  authorizeRoles(...financeRoles, 'admin'),
  validateMongoId('id'),
  validate(rejectExpenseSchema),
  financeController.rejectExpense
);
router.post(
  '/expenses/:id/mark-paid',
  authorizeRoles(...financeRoles),
  validateMongoId('id'),
  financeController.markExpensePaid
);
router.delete(
  '/expenses/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  financeController.deleteExpense
);

module.exports = router;
