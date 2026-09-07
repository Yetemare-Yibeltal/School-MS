// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EMPLOYEE VALIDATOR
// kat-school/server/src/validators/employee.validator.js
// ============================================

'use strict';

const Joi = require('joi');

const namePattern = /^[A-Za-z\u1200-\u137F\s'-]+$/;
const phonePattern = /^(\+251|251|0)?[79]\d{8}$/;

const nameField = (label) =>
  Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(namePattern)
    .messages({
      'string.pattern.base': `${label} can only contain letters`,
    });

const phoneField = Joi.string().pattern(phonePattern).messages({
  'string.pattern.base': 'Please provide a valid Ethiopian phone number',
});

const mongoIdField = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Invalid ID format' });

// ─── Create Employee Schema ───────────────────
const createEmployeeSchema = Joi.object({
  // Personal Info
  firstName: nameField('First name').required(),
  fatherName: nameField("Father's name").required(),
  grandFatherName: nameField("Grandfather's name").allow('', null).optional(),
  firstNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  fatherNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  gender: Joi.string().valid('Male', 'Female').required(),
  dateOfBirth: Joi.date().max('now').required(),
  nationality: Joi.string().trim().max(50).default('Ethiopian'),
  religion: Joi.string()
    .valid('Orthodox', 'Muslim', 'Protestant', 'Catholic', 'Traditional', 'Other')
    .allow('', null)
    .optional(),
  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .allow('', null)
    .optional(),
  maritalStatus: Joi.string()
    .valid('Single', 'Married', 'Divorced', 'Widowed')
    .allow('', null)
    .optional(),
  numberOfDependents: Joi.number().integer().min(0).max(20).default(0),

  // Contact
  phone: phoneField.required(),
  alternatePhone: phoneField.allow('', null).optional(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(150)
    .allow('', null)
    .optional(),
  address: Joi.object({
    region: Joi.string().trim().max(100).optional(),
    woreda: Joi.string().trim().max(100).optional(),
    kebele: Joi.string().trim().max(50).optional(),
    houseNumber: Joi.string().trim().max(50).optional(),
    specificLocation: Joi.string().trim().max(200).optional(),
  }).optional(),

  // Emergency Contact
  emergencyContact: Joi.object({
    name: nameField('Emergency contact name').required(),
    relationship: Joi.string().trim().max(50).required(),
    phone: phoneField.required(),
    alternatePhone: phoneField.allow('', null).optional(),
    address: Joi.string().trim().max(200).allow('', null).optional(),
  }).required(),

  // Professional
  department: mongoIdField.required().messages({ 'any.required': 'Department is required' }),
  designation: mongoIdField.required().messages({ 'any.required': 'Designation is required' }),
  qualification: Joi.string()
    .valid(
      'No formal education',
      'Primary (Grade 1-8)',
      'Secondary (Grade 9-12)',
      'Certificate',
      'Diploma',
      'Degree',
      'Masters',
      'PhD'
    )
    .required(),
  fieldOfStudy: Joi.string().trim().max(100).allow('', null).optional(),
  university: Joi.string().trim().max(200).allow('', null).optional(),
  yearsOfExperience: Joi.number().integer().min(0).max(50).default(0),

  // Employment
  joinDate: Joi.date().max('now').required(),
  employmentType: Joi.string()
    .valid('Full-Time', 'Part-Time', 'Contract', 'Volunteer', 'Intern')
    .default('Full-Time'),
  contractEndDate: Joi.date().allow(null).optional(),

  // Salary
  salary: Joi.object({
    basicSalary: Joi.number().min(0).required(),
    housingAllowance: Joi.number().min(0).default(0),
    transportAllowance: Joi.number().min(0).default(0),
    medicalAllowance: Joi.number().min(0).default(0),
    otherAllowances: Joi.number().min(0).default(0),
    bankName: Joi.string().trim().max(100).allow('', null).optional(),
    bankAccountNumber: Joi.string().trim().max(50).allow('', null).optional(),
    bankBranch: Joi.string().trim().max(100).allow('', null).optional(),
  }).required(),

  // IDs
  tinNumber: Joi.string().trim().max(20).allow('', null).optional(),
  pensionNumber: Joi.string().trim().max(30).allow('', null).optional(),
  nationalIdNumber: Joi.string().trim().max(30).allow('', null).optional(),

  notes: Joi.string().trim().max(1000).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Update Employee Schema ───────────────────
const updateEmployeeSchema = Joi.object({
  firstName: nameField('First name').optional(),
  fatherName: nameField("Father's name").optional(),
  grandFatherName: nameField("Grandfather's name").allow('', null).optional(),
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
  maritalStatus: Joi.string()
    .valid('Single', 'Married', 'Divorced', 'Widowed')
    .allow('', null)
    .optional(),
  numberOfDependents: Joi.number().integer().min(0).max(20).optional(),
  phone: phoneField.optional(),
  alternatePhone: phoneField.allow('', null).optional(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(150)
    .allow('', null)
    .optional(),
  address: Joi.object({
    region: Joi.string().trim().max(100).optional(),
    woreda: Joi.string().trim().max(100).optional(),
    kebele: Joi.string().trim().max(50).optional(),
    houseNumber: Joi.string().trim().max(50).optional(),
    specificLocation: Joi.string().trim().max(200).optional(),
  }).optional(),
  emergencyContact: Joi.object({
    name: nameField('Emergency contact name').optional(),
    relationship: Joi.string().trim().max(50).optional(),
    phone: phoneField.optional(),
    alternatePhone: phoneField.allow('', null).optional(),
    address: Joi.string().trim().max(200).allow('', null).optional(),
  }).optional(),
  department: mongoIdField.optional(),
  designation: mongoIdField.optional(),
  qualification: Joi.string()
    .valid(
      'No formal education',
      'Primary (Grade 1-8)',
      'Secondary (Grade 9-12)',
      'Certificate',
      'Diploma',
      'Degree',
      'Masters',
      'PhD'
    )
    .optional(),
  fieldOfStudy: Joi.string().trim().max(100).allow('', null).optional(),
  yearsOfExperience: Joi.number().integer().min(0).max(50).optional(),
  joinDate: Joi.date().max('now').optional(),
  employmentType: Joi.string()
    .valid('Full-Time', 'Part-Time', 'Contract', 'Volunteer', 'Intern')
    .optional(),
  contractEndDate: Joi.date().allow(null).optional(),
  salary: Joi.object({
    basicSalary: Joi.number().min(0).optional(),
    housingAllowance: Joi.number().min(0).optional(),
    transportAllowance: Joi.number().min(0).optional(),
    medicalAllowance: Joi.number().min(0).optional(),
    otherAllowances: Joi.number().min(0).optional(),
    bankName: Joi.string().trim().max(100).allow('', null).optional(),
    bankAccountNumber: Joi.string().trim().max(50).allow('', null).optional(),
    bankBranch: Joi.string().trim().max(100).allow('', null).optional(),
  }).optional(),
  tinNumber: Joi.string().trim().max(20).allow('', null).optional(),
  pensionNumber: Joi.string().trim().max(30).allow('', null).optional(),
  nationalIdNumber: Joi.string().trim().max(30).allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'terminated', 'resigned').optional(),
  notes: Joi.string().trim().max(1000).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Employee Filter Schema ───────────────────
const employeeFilterSchema = Joi.object({
  department: mongoIdField.optional(),
  designation: mongoIdField.optional(),
  employmentType: Joi.string()
    .valid('Full-Time', 'Part-Time', 'Contract', 'Volunteer', 'Intern')
    .optional(),
  qualification: Joi.string()
    .valid(
      'No formal education',
      'Primary (Grade 1-8)',
      'Secondary (Grade 9-12)',
      'Certificate',
      'Diploma',
      'Degree',
      'Masters',
      'PhD'
    )
    .optional(),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'terminated', 'resigned').optional(),
  gender: Joi.string().valid('Male', 'Female').optional(),
  search: Joi.string().trim().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  sort: Joi.string()
    .valid('firstName', 'employeeId', 'joinDate', 'departmentName', 'createdAt')
    .default('firstName'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
}).options({ stripUnknown: true });

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeFilterSchema,
};
