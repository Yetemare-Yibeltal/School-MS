// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ACADEMIC VALIDATOR
// kat-school/server/src/validators/academic.validator.js
// ============================================

'use strict';

const Joi = require('joi');

const mongoId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Invalid ID format' });

const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

// ─── Academic Year ────────────────────────────
const createAcademicYearSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({ 'any.required': 'Academic year name is required' }),
  startDate: Joi.date().required().messages({ 'any.required': 'Start date is required' }),
  endDate: Joi.date().min(Joi.ref('startDate')).required().messages({
    'any.required': 'End date is required',
    'date.min': 'End date must be after start date',
  }),
  isCurrent: Joi.boolean().default(false),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

const updateAcademicYearSchema = Joi.object({
  name: Joi.string().trim().max(50).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  isCurrent: Joi.boolean().optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  status: Joi.string().valid('upcoming', 'active', 'completed', 'archived').optional(),
}).options({ stripUnknown: true });

// ─── Term ─────────────────────────────────────
const createTermSchema = Joi.object({
  name: Joi.string().trim().max(50).required(),
  termNumber: Joi.number().integer().min(1).max(4).required(),
  academicYear: mongoId.required(),
  startDate: Joi.date().required(),
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .required()
    .messages({ 'date.min': 'End date must be after start date' }),
  isCurrent: Joi.boolean().default(false),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Class ────────────────────────────────────
const createClassSchema = Joi.object({
  name: Joi.string().trim().max(50).required(),
  grade: Joi.string()
    .valid(...grades)
    .required(),
  academicYear: mongoId.required(),
  classTeacher: mongoId.allow(null).optional(),
  capacity: Joi.number().integer().min(1).max(100).default(50),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Section ──────────────────────────────────
const createSectionSchema = Joi.object({
  name: Joi.string().trim().uppercase().max(5).required(),
  class: mongoId.required(),
  grade: Joi.string()
    .valid(...grades)
    .required(),
  academicYear: mongoId.required(),
  classTeacher: mongoId.allow(null).optional(),
  capacity: Joi.number().integer().min(1).max(100).default(50),
  room: mongoId.allow(null).optional(),
}).options({ stripUnknown: true });

// ─── Subject ──────────────────────────────────
const createSubjectSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  code: Joi.string().trim().uppercase().max(10).required(),
  grades: Joi.array()
    .items(Joi.string().valid(...grades))
    .min(1)
    .required(),
  category: Joi.string()
    .valid(
      'Core',
      'Elective',
      'Languages',
      'Sciences',
      'Social Studies',
      'Vocational',
      'Arts',
      'Sports'
    )
    .required(),
  weeklyHours: Joi.number().integer().min(1).max(40).default(5),
  periodsPerWeek: Joi.number().integer().min(1).max(40).default(5),
  isCompulsory: Joi.boolean().default(true),
  passingScore: Joi.number().min(0).max(100).default(50),
  fullMarks: Joi.number().min(0).max(200).default(100),
  caMarks: Joi.number().min(0).max(200).default(50),
  examMarks: Joi.number().min(0).max(200).default(50),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Room ─────────────────────────────────────
const createRoomSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  code: Joi.string().trim().uppercase().max(20).required(),
  type: Joi.string()
    .valid(
      'Classroom',
      'Laboratory',
      'Library',
      'Office',
      'Hall',
      'Gymnasium',
      'Computer Lab',
      'Art Room',
      'Music Room',
      'Other'
    )
    .required(),
  capacity: Joi.number().integer().min(1).max(1000).required(),
  floor: Joi.string().trim().max(20).allow('', null).optional(),
  building: Joi.string().trim().max(100).allow('', null).optional(),
  facilities: Joi.array().items(Joi.string().trim()).default([]),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Exam ─────────────────────────────────────
const createExamSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  examType: mongoId.required(),
  academicYear: mongoId.required(),
  term: mongoId.required(),
  grade: Joi.string()
    .valid(...grades)
    .required(),
  section: mongoId.allow(null).optional(),
  subject: mongoId.required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  duration: Joi.number().integer().min(15).max(480).required(),
  room: mongoId.allow(null).optional(),
  invigilator: mongoId.allow(null).optional(),
  totalMarks: Joi.number().min(0).max(200).required(),
  passingMarks: Joi.number().min(0).max(200).required(),
  instructions: Joi.string().trim().max(2000).allow('', null).optional(),
  isOnline: Joi.boolean().default(false),
}).options({ stripUnknown: true });

// ─── Exam Result ──────────────────────────────
const createExamResultSchema = Joi.object({
  exam: mongoId.required(),
  student: mongoId.required(),
  marksObtained: Joi.number().min(0).max(200).required(),
  isAbsent: Joi.boolean().default(false),
  isExcused: Joi.boolean().default(false),
  remarks: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

const bulkExamResultSchema = Joi.object({
  exam: mongoId.required(),
  results: Joi.array()
    .items(
      Joi.object({
        student: mongoId.required(),
        marksObtained: Joi.number().min(0).max(200).required(),
        isAbsent: Joi.boolean().default(false),
        isExcused: Joi.boolean().default(false),
        remarks: Joi.string().trim().max(500).allow('', null).optional(),
      })
    )
    .min(1)
    .required(),
}).options({ stripUnknown: true });

// ─── Timetable ────────────────────────────────
const createTimetableSchema = Joi.object({
  academicYear: mongoId.required(),
  term: mongoId.required(),
  grade: Joi.string()
    .valid(...grades)
    .required(),
  section: mongoId.required(),
  effectiveFrom: Joi.date().required(),
  effectiveTo: Joi.date().min(Joi.ref('effectiveFrom')).required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

const createTimetableSlotSchema = Joi.object({
  timetable: mongoId.required(),
  dayOfWeek: Joi.string()
    .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
    .required(),
  periodNumber: Joi.number().integer().min(1).max(12).required(),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required(),
  subject: mongoId.required(),
  teacher: mongoId.required(),
  room: mongoId.allow(null).optional(),
  slotType: Joi.string().valid('Regular', 'Break', 'Assembly', 'Sport', 'Free').default('Regular'),
}).options({ stripUnknown: true });

// ─── Grade Scale ──────────────────────────────
const createGradeScaleSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  grades: Joi.array()
    .items(
      Joi.object({
        letter: Joi.string().trim().max(5).required(),
        minScore: Joi.number().min(0).max(100).required(),
        maxScore: Joi.number().min(0).max(100).required(),
        gradePoint: Joi.number().min(0).max(5).required(),
        description: Joi.string().trim().max(50).optional(),
      })
    )
    .min(1)
    .required(),
  isDefault: Joi.boolean().default(false),
}).options({ stripUnknown: true });

module.exports = {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  createTermSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
  createRoomSchema,
  createExamSchema,
  createExamResultSchema,
  bulkExamResultSchema,
  createTimetableSchema,
  createTimetableSlotSchema,
  createGradeScaleSchema,
};
