// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// STUDENT VALIDATOR
// kat-school/server/src/validators/student.validator.js
// ============================================

'use strict';

const Joi = require('joi');

// ─── Common ───────────────────────────────────
const namePattern = /^[A-Za-z\u1200-\u137F\s'-]+$/;
const phonePattern = /^(\+251|251|0)?[79]\d{8}$/;
const ethiopianGrades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const nameField = (label) =>
  Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(namePattern)
    .messages({
      'string.pattern.base': `${label} can only contain letters`,
      'string.min': `${label} must be at least 2 characters`,
      'string.max': `${label} cannot exceed 50 characters`,
    });

const phoneField = Joi.string().pattern(phonePattern).messages({
  'string.pattern.base': 'Please provide a valid Ethiopian phone number',
});

// ─── Create Student Schema ────────────────────
const createStudentSchema = Joi.object({
  // Personal Info
  firstName: nameField('First name').required(),
  fatherName: nameField("Father's name").required(),
  grandFatherName: nameField("Grandfather's name").allow('', null).optional(),
  firstNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  fatherNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  grandFatherNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  gender: Joi.string()
    .valid('Male', 'Female')
    .required()
    .messages({ 'any.required': 'Gender is required' }),
  dateOfBirth: Joi.date().max('now').required().messages({
    'date.max': 'Date of birth cannot be in the future',
    'any.required': 'Date of birth is required',
  }),
  nationality: Joi.string().trim().max(50).default('Ethiopian'),
  religion: Joi.string()
    .valid('Orthodox', 'Muslim', 'Protestant', 'Catholic', 'Traditional', 'Other')
    .allow('', null)
    .optional(),
  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .allow('', null)
    .optional(),

  // Academic Info
  grade: Joi.string()
    .valid(...ethiopianGrades)
    .required()
    .messages({ 'any.required': 'Grade is required' }),
  section: Joi.string().trim().uppercase().max(5).allow('', null).optional(),
  rollNumber: Joi.number().integer().min(1).allow(null).optional(),
  academicYear: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Academic year is required',
      'string.pattern.base': 'Invalid academic year ID',
    }),
  admissionDate: Joi.date().max('now').required().messages({
    'any.required': 'Admission date is required',
  }),
  admissionType: Joi.string().valid('New', 'Transfer', 'Re-admission').default('New'),
  previousSchool: Joi.string().trim().max(200).allow('', null).optional(),
  previousGrade: Joi.string().trim().max(20).allow('', null).optional(),

  // Contact Info
  address: Joi.object({
    region: Joi.string().trim().max(100).optional(),
    zone: Joi.string().trim().max(100).optional(),
    woreda: Joi.string().trim().max(100).optional(),
    kebele: Joi.string().trim().max(50).optional(),
    houseNumber: Joi.string().trim().max(50).optional(),
    specificLocation: Joi.string().trim().max(200).optional(),
  }).optional(),
  phone: phoneField.allow('', null).optional(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(150)
    .allow('', null)
    .optional(),

  // Medical Info
  medicalInfo: Joi.object({
    hasDisability: Joi.boolean().default(false),
    disabilityDescription: Joi.string().trim().max(500).allow('', null).optional(),
    allergies: Joi.array().items(Joi.string().trim()).default([]),
    medications: Joi.array().items(Joi.string().trim()).default([]),
    medicalNotes: Joi.string().trim().max(1000).allow('', null).optional(),
    emergencyMedicalInfo: Joi.string().trim().max(500).allow('', null).optional(),
  }).optional(),

  // Guardian (at least one required)
  primaryGuardian: Joi.object({
    name: nameField('Guardian name').required(),
    relationship: Joi.string()
      .valid(
        'Father',
        'Mother',
        'Brother',
        'Sister',
        'Uncle',
        'Aunt',
        'Grandfather',
        'Grandmother',
        'Guardian',
        'Other'
      )
      .required(),
    phone: phoneField.required(),
    alternatePhone: phoneField.allow('', null).optional(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .lowercase()
      .allow('', null)
      .optional(),
    occupation: Joi.string().trim().max(100).allow('', null).optional(),
    address: Joi.string().trim().max(200).allow('', null).optional(),
    isEmergencyContact: Joi.boolean().default(true),
  }).required(),

  notes: Joi.string().trim().max(1000).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Update Student Schema ────────────────────
const updateStudentSchema = Joi.object({
  firstName: nameField('First name').optional(),
  fatherName: nameField("Father's name").optional(),
  grandFatherName: nameField("Grandfather's name").allow('', null).optional(),
  firstNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  fatherNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  grandFatherNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  gender: Joi.string().valid('Male', 'Female').optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  nationality: Joi.string().trim().max(50).optional(),
  religion: Joi.string()
    .valid('Orthodox', 'Muslim', 'Protestant', 'Catholic', 'Traditional', 'Other')
    .allow('', null)
    .optional(),
  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .allow('', null)
    .optional(),
  grade: Joi.string()
    .valid(...ethiopianGrades)
    .optional(),
  section: Joi.string().trim().uppercase().max(5).allow('', null).optional(),
  rollNumber: Joi.number().integer().min(1).allow(null).optional(),
  address: Joi.object({
    region: Joi.string().trim().max(100).optional(),
    zone: Joi.string().trim().max(100).optional(),
    woreda: Joi.string().trim().max(100).optional(),
    kebele: Joi.string().trim().max(50).optional(),
    houseNumber: Joi.string().trim().max(50).optional(),
    specificLocation: Joi.string().trim().max(200).optional(),
  }).optional(),
  phone: phoneField.allow('', null).optional(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(150)
    .allow('', null)
    .optional(),
  medicalInfo: Joi.object({
    hasDisability: Joi.boolean().optional(),
    disabilityDescription: Joi.string().trim().max(500).allow('', null).optional(),
    allergies: Joi.array().items(Joi.string().trim()).optional(),
    medications: Joi.array().items(Joi.string().trim()).optional(),
    medicalNotes: Joi.string().trim().max(1000).allow('', null).optional(),
    emergencyMedicalInfo: Joi.string().trim().max(500).allow('', null).optional(),
  }).optional(),
  notes: Joi.string().trim().max(1000).allow('', null).optional(),
  status: Joi.string()
    .valid('active', 'inactive', 'graduated', 'transferred', 'expelled', 'suspended')
    .optional(),
}).options({ stripUnknown: true });

// ─── Transfer Student Schema ──────────────────
const transferStudentSchema = Joi.object({
  newGrade: Joi.string()
    .valid(...ethiopianGrades)
    .required()
    .messages({ 'any.required': 'New grade is required' }),
  newSection: Joi.string().trim().uppercase().max(5).allow('', null).optional(),
  newAcademicYear: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'any.required': 'New academic year is required' }),
  transferReason: Joi.string().trim().max(500).allow('', null).optional(),
  transferDate: Joi.date().max('now').optional(),
}).options({ stripUnknown: true });

// ─── Student Filter/Search Schema ─────────────
const studentFilterSchema = Joi.object({
  grade: Joi.string()
    .valid(...ethiopianGrades)
    .optional(),
  section: Joi.string().trim().uppercase().max(5).optional(),
  gender: Joi.string().valid('Male', 'Female').optional(),
  status: Joi.string()
    .valid('active', 'inactive', 'graduated', 'transferred', 'expelled', 'suspended')
    .optional(),
  academicYear: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  search: Joi.string().trim().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  sort: Joi.string()
    .valid('firstName', 'grade', 'studentId', 'admissionDate', 'createdAt')
    .default('firstName'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
}).options({ stripUnknown: true });

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  transferStudentSchema,
  studentFilterSchema,
};
