// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FEE VALIDATOR
// kat-school/server/src/validators/fee.validator.js
// ============================================

'use strict';

const Joi = require('joi');

const mongoId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Invalid ID format' });

const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const paymentMethods = ['Cash', 'Bank Transfer', 'Telebirr', 'CBE Birr', 'Cheque', 'Other'];

// ─── Fee Type ─────────────────────────────────
const createFeeTypeSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  code: Joi.string().trim().uppercase().max(10).required(),
  category: Joi.string()
    .valid(
      'Tuition',
      'Registration',
      'Exam',
      'Library',
      'Sport',
      'Transport',
      'Medical',
      'Uniform',
      'Activity',
      'Boarding',
      'Other'
    )
    .required(),
  amount: Joi.number().min(0).required(),
  frequency: Joi.string().valid('one_time', 'per_term', 'per_year', 'monthly').default('per_year'),
  applicableGrades: Joi.array()
    .items(Joi.string().valid(...grades))
    .min(1)
    .required(),
  isMandatory: Joi.boolean().default(true),
  isRefundable: Joi.boolean().default(false),
  refundPolicy: Joi.string().trim().max(500).allow('', null).optional(),
  lateFineEnabled: Joi.boolean().default(false),
  lateFineAmount: Joi.number().min(0).default(0),
  lateFinePerDay: Joi.number().min(0).default(0),
  gracePeriodDays: Joi.number().integer().min(0).default(0),
  dueDate: Joi.date().allow(null).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .default('#4f46e5'),
}).options({ stripUnknown: true });

// ─── Fee Group ────────────────────────────────
const createFeeGroupSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  code: Joi.string().trim().uppercase().max(10).required(),
  feeTypes: Joi.array().items(mongoId).min(1).required(),
  applicableGrades: Joi.array()
    .items(Joi.string().valid(...grades))
    .min(1)
    .required(),
  academicYear: mongoId.required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Fee Discount ─────────────────────────────
const createFeeDiscountSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  code: Joi.string().trim().uppercase().max(10).required(),
  type: Joi.string().valid('percentage', 'fixed').required(),
  value: Joi.number().min(0).required(),
  applicableTo: Joi.string().valid('specific_fee', 'all_fees', 'fee_group').required(),
  feeType: mongoId.when('applicableTo', {
    is: 'specific_fee',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  maxDiscountAmount: Joi.number().min(0).allow(null).optional(),
  category: Joi.string()
    .valid(
      'Academic Excellence',
      'Financial Need',
      'Staff Child',
      'Orphan',
      'Sibling',
      'Scholarship',
      'Government',
      'Other'
    )
    .required(),
  applicableGrades: Joi.array()
    .items(Joi.string().valid(...grades))
    .default([]),
  validFrom: Joi.date().optional(),
  validTo: Joi.date().min(Joi.ref('validFrom')).optional(),
  requiresApproval: Joi.boolean().default(false),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Fee Assignment ───────────────────────────
const createFeeAssignmentSchema = Joi.object({
  student: mongoId.required(),
  feeType: mongoId.required(),
  academicYear: mongoId.required(),
  term: mongoId.allow(null).optional(),
  amount: Joi.number().min(0).required(),
  dueDate: Joi.date().required(),
  discounts: Joi.array()
    .items(
      Joi.object({
        discount: mongoId.required(),
        discountAmount: Joi.number().min(0).required(),
      })
    )
    .default([]),
  allowInstallments: Joi.boolean().default(false),
  installmentCount: Joi.number()
    .integer()
    .min(2)
    .max(12)
    .when('allowInstallments', { is: true, then: Joi.required() })
    .optional(),
  notes: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Fee Payment ──────────────────────────────
const createFeePaymentSchema = Joi.object({
  feeAssignment: mongoId.required(),
  student: mongoId.required(),
  amount: Joi.number().min(1).required(),
  method: Joi.string()
    .valid(...paymentMethods)
    .required(),
  paymentDate: Joi.date().max('now').required(),
  transactionReference: Joi.string().trim().max(100).allow('', null).optional(),
  bankName: Joi.string().trim().max(100).allow('', null).optional(),
  chequeNumber: Joi.string().trim().max(50).allow('', null).optional(),
  mobileTransactionId: Joi.string().trim().max(100).allow('', null).optional(),
  paidBy: Joi.object({
    name: Joi.string().trim().max(100).required(),
    relationship: Joi.string().trim().max(50).default('Parent/Guardian'),
    phone: Joi.string().trim().max(20).allow('', null).optional(),
  }).required(),
  guardian: mongoId.allow(null).optional(),
  isInstallment: Joi.boolean().default(false),
  installmentNumber: Joi.number().integer().min(1).allow(null).optional(),
  notes: Joi.string().trim().max(500).allow('', null).optional(),
  generateReceipt: Joi.boolean().default(true),
  sendEmailReceipt: Joi.boolean().default(false),
}).options({ stripUnknown: true });

// ─── Fee Payment Refund ───────────────────────
const refundPaymentSchema = Joi.object({
  refundAmount: Joi.number().min(0).optional(),
  refundReason: Joi.string().trim().max(500).required(),
  refundDate: Joi.date().max('now').optional(),
}).options({ stripUnknown: true });

// ─── Income ───────────────────────────────────
const createIncomeSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  category: Joi.string()
    .valid(
      'Government Grant',
      'Donation',
      'Rental Income',
      'Canteen Income',
      'Event Income',
      'Bank Interest',
      'Sale of Assets',
      'Registration Fee',
      'Tuition Fee',
      'Exam Fee',
      'Library Fee',
      'Sports Fee',
      'Laboratory Fee',
      'Uniform Fee',
      'Transport Fee',
      'Medical Fee',
      'Activity Fee',
      'Other Fee',
      'Other'
    )
    .required(),
  amount: Joi.number().min(1).required(),
  paymentMethod: Joi.string()
    .valid(...paymentMethods)
    .required(),
  date: Joi.date().max('now').required(),
  academicYear: mongoId.required(),
  term: mongoId.allow(null).optional(),
  source: Joi.string().trim().max(200).allow('', null).optional(),
  transactionReference: Joi.string().trim().max(100).allow('', null).optional(),
  invoiceNumber: Joi.string().trim().max(50).allow('', null).optional(),
  description: Joi.string().trim().max(1000).allow('', null).optional(),
  notes: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Expense ──────────────────────────────────
const createExpenseSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  category: mongoId.required(),
  amount: Joi.number().min(1).required(),
  taxAmount: Joi.number().min(0).default(0),
  date: Joi.date().max('now').required(),
  academicYear: mongoId.required(),
  term: mongoId.allow(null).optional(),
  vendor: Joi.object({
    name: Joi.string().trim().max(200).allow('', null).optional(),
    phone: Joi.string().trim().max(20).allow('', null).optional(),
    address: Joi.string().trim().max(200).allow('', null).optional(),
    tinNumber: Joi.string().trim().max(30).allow('', null).optional(),
  }).optional(),
  department: mongoId.allow(null).optional(),
  invoiceNumber: Joi.string().trim().max(50).allow('', null).optional(),
  isBudgeted: Joi.boolean().default(false),
  budgetedAmount: Joi.number().min(0).default(0),
  isRecurring: Joi.boolean().default(false),
  recurringFrequency: Joi.string().valid('monthly', 'quarterly', 'annual', '').default(''),
  description: Joi.string().trim().max(1000).allow('', null).optional(),
  notes: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Approve/Reject Expense ───────────────────
const approveExpenseSchema = Joi.object({
  remarks: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

const rejectExpenseSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .max(500)
    .required()
    .messages({ 'any.required': 'Rejection reason is required' }),
}).options({ stripUnknown: true });

// ─── Fee Filter Schema ─────────────────────────
const feeFilterSchema = Joi.object({
  student: mongoId.optional(),
  feeType: mongoId.optional(),
  academicYear: mongoId.optional(),
  term: mongoId.optional(),
  grade: Joi.string()
    .valid(...grades)
    .optional(),
  status: Joi.string()
    .valid('paid', 'partial', 'unpaid', 'overdue', 'waived', 'cancelled')
    .optional(),
  paymentMethod: Joi.string()
    .valid(...paymentMethods)
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  sort: Joi.string()
    .valid('paymentDate', 'amount', 'createdAt', 'studentName')
    .default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
}).options({ stripUnknown: true });

module.exports = {
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
  feeFilterSchema,
};
