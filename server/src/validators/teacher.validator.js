// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TEACHER VALIDATOR
// kat-school/server/src/validators/teacher.validator.js
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
      'string.min': `${label} must be at least 2 characters`,
    });

const phoneField = Joi.string().pattern(phonePattern).messages({
  'string.pattern.base': 'Please provide a valid Ethiopian phone number',
});

const subjectsList = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Amharic',
  'History',
  'Geography',
  'Civics',
  'Economics',
  'Business',
  'ICT',
  'Physical Education',
  'Art',
  'Music',
  'Other',
];

// ─── Create Teacher Schema ────────────────────
const createTeacherSchema = Joi.object({
  // Personal Info
  firstName: nameField('First name').required(),
  fatherName: nameField("Father's name").required(),
  grandFatherName: nameField("Grandfather's name").allow('', null).optional(),
  firstNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  fatherNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  gender: Joi.string()
    .valid('Male', 'Female')
    .required()
    .messages({ 'any.required': 'Gender is required' }),
  dateOfBirth: Joi.date()
    .max('now')
    .required()
    .messages({ 'any.required': 'Date of birth is required' }),
  nationality: Joi.string().trim().max(50).default('Ethiopian'),
  religion: Joi.string()
    .valid('Orthodox', 'Muslim', 'Protestant', 'Catholic', 'Traditional', 'Other')
    .allow('', null)
    .optional(),
  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .allow('', null)
    .optional(),

  // Contact
  phone: phoneField.required().messages({
    'any.required': 'Phone number is required',
  }),
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

  // Professional Info
  primarySubject: Joi.string()
    .valid(...subjectsList)
    .required()
    .messages({ 'any.required': 'Primary subject is required' }),
  secondarySubjects: Joi.array()
    .items(Joi.string().valid(...subjectsList))
    .default([]),
  gradesCanTeach: Joi.array()
    .items(Joi.string().valid('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'))
    .min(1)
    .required()
    .messages({ 'any.required': 'Grades this teacher can teach is required' }),
  qualification: Joi.string()
    .valid('Certificate', 'Diploma', 'Degree', 'Masters', 'PhD')
    .required()
    .messages({ 'any.required': 'Qualification is required' }),
  fieldOfStudy: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({ 'any.required': 'Field of study is required' }),
  university: Joi.string().trim().max(200).allow('', null).optional(),
  yearOfGraduation: Joi.number()
    .integer()
    .min(1970)
    .max(new Date().getFullYear())
    .allow(null)
    .optional(),
  teachingLicenseNumber: Joi.string().trim().max(50).allow('', null).optional(),
  teachingLicenseExpiry: Joi.date().allow(null).optional(),
  yearsOfExperience: Joi.number().integer().min(0).max(50).default(0),
  previousSchool: Joi.string().trim().max(200).allow('', null).optional(),

  // Employment
  joinDate: Joi.date().max('now').required().messages({ 'any.required': 'Join date is required' }),
  employmentType: Joi.string()
    .valid('Full-Time', 'Part-Time', 'Contract', 'Volunteer')
    .default('Full-Time'),
  contractEndDate: Joi.date().allow(null).optional(),
  isHomeRoomTeacher: Joi.boolean().default(false),
  homeRoomSection: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .optional(),

  // Salary
  salary: Joi.object({
    basicSalary: Joi.number().min(0).default(0),
    bankName: Joi.string().trim().max(100).allow('', null).optional(),
    bankAccountNumber: Joi.string().trim().max(50).allow('', null).optional(),
    bankBranch: Joi.string().trim().max(100).allow('', null).optional(),
  }).optional(),

  // IDs
  tinNumber: Joi.string().trim().max(20).allow('', null).optional(),
  pensionNumber: Joi.string().trim().max(30).allow('', null).optional(),
  nationalIdNumber: Joi.string().trim().max(30).allow('', null).optional(),

  notes: Joi.string().trim().max(1000).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Update Teacher Schema ────────────────────
const updateTeacherSchema = Joi.object({
  firstName: nameField('First name').optional(),
  fatherName: nameField("Father's name").optional(),
  grandFatherName: nameField("Grandfather's name").allow('', null).optional(),
  firstNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
  fatherNameAmharic: Joi.string().trim().max(50).allow('', null).optional(),
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
  primarySubject: Joi.string()
    .valid(...subjectsList)
    .optional(),
  secondarySubjects: Joi.array()
    .items(Joi.string().valid(...subjectsList))
    .optional(),
  gradesCanTeach: Joi.array()
    .items(Joi.string().valid('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'))
    .optional(),
  qualification: Joi.string()
    .valid('Certificate', 'Diploma', 'Degree', 'Masters', 'PhD')
    .optional(),
  fieldOfStudy: Joi.string().trim().max(100).optional(),
  university: Joi.string().trim().max(200).allow('', null).optional(),
  yearsOfExperience: Joi.number().integer().min(0).max(50).optional(),
  teachingLicenseNumber: Joi.string().trim().max(50).allow('', null).optional(),
  teachingLicenseExpiry: Joi.date().allow(null).optional(),
  joinDate: Joi.date().max('now').optional(),
  employmentType: Joi.string().valid('Full-Time', 'Part-Time', 'Contract', 'Volunteer').optional(),
  contractEndDate: Joi.date().allow(null).optional(),
  isHomeRoomTeacher: Joi.boolean().optional(),
  homeRoomSection: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .optional(),
  salary: Joi.object({
    basicSalary: Joi.number().min(0).optional(),
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

// ─── Teacher Filter Schema ────────────────────
const teacherFilterSchema = Joi.object({
  primarySubject: Joi.string()
    .valid(...subjectsList)
    .optional(),
  employmentType: Joi.string().valid('Full-Time', 'Part-Time', 'Contract', 'Volunteer').optional(),
  qualification: Joi.string()
    .valid('Certificate', 'Diploma', 'Degree', 'Masters', 'PhD')
    .optional(),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'terminated', 'resigned').optional(),
  gender: Joi.string().valid('Male', 'Female').optional(),
  search: Joi.string().trim().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  sort: Joi.string()
    .valid('firstName', 'teacherId', 'joinDate', 'primarySubject', 'createdAt')
    .default('firstName'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
}).options({ stripUnknown: true });

module.exports = {
  createTeacherSchema,
  updateTeacherSchema,
  teacherFilterSchema,
};
