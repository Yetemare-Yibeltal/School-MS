// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LIBRARY VALIDATOR
// kat-school/server/src/validators/library.validator.js
// ============================================

'use strict';

const Joi = require('joi');

const mongoId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Invalid ID format' });

// ─── Book Category ────────────────────────────
const createBookCategorySchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  code: Joi.string().trim().uppercase().max(10).required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  deweyDecimal: Joi.string().trim().max(20).allow('', null).optional(),
  parentCategory: mongoId.allow(null).optional(),
  suitableForGrades: Joi.array()
    .items(Joi.string().valid('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'))
    .default([]),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .default('#4f46e5'),
  icon: Joi.string().trim().max(50).default('book'),
  sortOrder: Joi.number().integer().min(0).default(0),
}).options({ stripUnknown: true });

// ─── Book ─────────────────────────────────────
const createBookSchema = Joi.object({
  title: Joi.string().trim().max(300).required(),
  isbn: Joi.string().trim().max(20).allow('', null).optional(),
  authors: Joi.array()
    .items(Joi.string().trim().max(100))
    .min(1)
    .required()
    .messages({ 'array.min': 'At least one author is required' }),
  editors: Joi.array().items(Joi.string().trim().max(100)).default([]),
  translators: Joi.array().items(Joi.string().trim().max(100)).default([]),
  publisher: Joi.string().trim().max(200).allow('', null).optional(),
  publicationYear: Joi.number()
    .integer()
    .min(1800)
    .max(new Date().getFullYear() + 1)
    .allow(null)
    .optional(),
  edition: Joi.string().trim().max(20).allow('', null).optional(),
  publicationPlace: Joi.string().trim().max(100).allow('', null).optional(),
  category: mongoId.required().messages({ 'any.required': 'Category is required' }),
  deweyDecimal: Joi.string().trim().max(20).allow('', null).optional(),
  subjects: Joi.array().items(Joi.string().trim()).default([]),
  suitableForGrades: Joi.array()
    .items(Joi.string().valid('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'))
    .default([]),
  language: Joi.string()
    .valid('Amharic', 'English', 'Oromiffa', 'Tigrinya', 'Somali', 'Arabic', 'French', 'Other')
    .default('English'),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  numberOfPages: Joi.number().integer().min(1).allow(null).optional(),
  totalCopies: Joi.number().integer().min(1).required(),
  copies: Joi.array()
    .items(
      Joi.object({
        copyNumber: Joi.string().trim().max(20).required(),
        barcode: Joi.string().trim().max(50).allow('', null).optional(),
        condition: Joi.string().valid('Excellent', 'Good', 'Fair', 'Poor').default('Good'),
        acquiredDate: Joi.date().allow(null).optional(),
        notes: Joi.string().trim().max(200).allow('', null).optional(),
      })
    )
    .optional(),
  shelfLocation: Joi.object({
    section: Joi.string().trim().max(20).allow('', null).optional(),
    row: Joi.string().trim().max(10).allow('', null).optional(),
    shelf: Joi.string().trim().max(10).allow('', null).optional(),
    position: Joi.string().trim().max(10).allow('', null).optional(),
  }).optional(),
  purchasePrice: Joi.number().min(0).default(0),
  finePerDay: Joi.number().min(0).default(2),
  acquisitionDate: Joi.date().allow(null).optional(),
  acquisitionSource: Joi.string()
    .valid('Purchase', 'Donation', 'Government', 'Exchange', 'Other', '')
    .default(''),
  donorName: Joi.string().trim().max(100).allow('', null).optional(),
  isReference: Joi.boolean().default(false),
  canBeIssued: Joi.boolean().default(true),
  notes: Joi.string().trim().max(1000).allow('', null).optional(),
}).options({ stripUnknown: true });

const updateBookSchema = Joi.object({
  title: Joi.string().trim().max(300).optional(),
  isbn: Joi.string().trim().max(20).allow('', null).optional(),
  authors: Joi.array().items(Joi.string().trim().max(100)).min(1).optional(),
  publisher: Joi.string().trim().max(200).allow('', null).optional(),
  publicationYear: Joi.number()
    .integer()
    .min(1800)
    .max(new Date().getFullYear() + 1)
    .allow(null)
    .optional(),
  edition: Joi.string().trim().max(20).allow('', null).optional(),
  category: mongoId.optional(),
  subjects: Joi.array().items(Joi.string().trim()).optional(),
  language: Joi.string()
    .valid('Amharic', 'English', 'Oromiffa', 'Tigrinya', 'Somali', 'Arabic', 'French', 'Other')
    .optional(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  totalCopies: Joi.number().integer().min(1).optional(),
  shelfLocation: Joi.object({
    section: Joi.string().trim().max(20).allow('', null).optional(),
    row: Joi.string().trim().max(10).allow('', null).optional(),
    shelf: Joi.string().trim().max(10).allow('', null).optional(),
    position: Joi.string().trim().max(10).allow('', null).optional(),
  }).optional(),
  finePerDay: Joi.number().min(0).optional(),
  isReference: Joi.boolean().optional(),
  canBeIssued: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  notes: Joi.string().trim().max(1000).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Library Member ───────────────────────────
const registerLibraryMemberSchema = Joi.object({
  memberType: Joi.string().valid('student', 'teacher', 'employee').required(),
  student: mongoId.when('memberType', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  teacher: mongoId.when('memberType', {
    is: 'teacher',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  employee: mongoId.when('memberType', {
    is: 'employee',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  academicYear: mongoId.required(),
  maxBooksAllowed: Joi.number().integer().min(1).max(10).optional(),
  maxLoanDays: Joi.number().integer().min(1).max(60).optional(),
  notes: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Book Issue ───────────────────────────────
const issueBookSchema = Joi.object({
  book: mongoId.required().messages({ 'any.required': 'Book is required' }),
  bookCopyNumber: Joi.string().trim().max(20).allow('', null).optional(),
  libraryMember: mongoId.required().messages({ 'any.required': 'Library member is required' }),
  loanDays: Joi.number().integer().min(1).max(60).optional(),
  academicYear: mongoId.required(),
  term: mongoId.allow(null).optional(),
  notes: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

const returnBookSchema = Joi.object({
  returnCondition: Joi.string()
    .valid('Excellent', 'Good', 'Fair', 'Poor', 'Damaged', 'Lost')
    .required()
    .messages({ 'any.required': 'Return condition is required' }),
  returnRemarks: Joi.string().trim().max(500).allow('', null).optional(),
  payFine: Joi.boolean().default(false),
  waiveFine: Joi.boolean().default(false),
  waivedAmount: Joi.number()
    .min(0)
    .when('waiveFine', { is: true, then: Joi.required() })
    .optional(),
  waivedReason: Joi.string()
    .trim()
    .max(500)
    .when('waiveFine', { is: true, then: Joi.required() })
    .optional(),
}).options({ stripUnknown: true });

const renewBookSchema = Joi.object({
  additionalDays: Joi.number().integer().min(1).max(30).default(7),
}).options({ stripUnknown: true });

// ─── Book Reservation ─────────────────────────
const createReservationSchema = Joi.object({
  book: mongoId.required(),
  libraryMember: mongoId.required(),
  academicYear: mongoId.required(),
  notes: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

const cancelReservationSchema = Joi.object({
  reason: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Fine Payment ─────────────────────────────
const payLibraryFineSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  paidBy: Joi.string().trim().max(100).required(),
  paymentMethod: Joi.string()
    .valid('Cash', 'Bank Transfer', 'Telebirr', 'CBE Birr', 'Other')
    .default('Cash'),
}).options({ stripUnknown: true });

// ─── Book Filter Schema ───────────────────────
const bookFilterSchema = Joi.object({
  category: mongoId.optional(),
  language: Joi.string()
    .valid('Amharic', 'English', 'Oromiffa', 'Tigrinya', 'Somali', 'Arabic', 'French', 'Other')
    .optional(),
  grade: Joi.string().valid('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12').optional(),
  isAvailable: Joi.boolean().optional(),
  isReference: Joi.boolean().optional(),
  acquisitionSource: Joi.string()
    .valid('Purchase', 'Donation', 'Government', 'Exchange', 'Other')
    .optional(),
  search: Joi.string().trim().max(200).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  sort: Joi.string()
    .valid('title', 'author', 'createdAt', 'stats.totalIssues', 'publicationYear')
    .default('title'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
}).options({ stripUnknown: true });

module.exports = {
  createBookCategorySchema,
  createBookSchema,
  updateBookSchema,
  registerLibraryMemberSchema,
  issueBookSchema,
  returnBookSchema,
  renewBookSchema,
  createReservationSchema,
  cancelReservationSchema,
  payLibraryFineSchema,
  bookFilterSchema,
};
