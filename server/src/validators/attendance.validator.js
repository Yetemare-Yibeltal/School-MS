// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ATTENDANCE VALIDATOR
// kat-school/server/src/validators/attendance.validator.js
// ============================================

'use strict';

const Joi = require('joi');

const mongoId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Invalid ID format' });

const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const attendanceStatuses = [
  'present',
  'absent',
  'late',
  'excused',
  'on_leave',
  'holiday',
  'suspended',
];

// ─── Mark Attendance ──────────────────────────
const markAttendanceSchema = Joi.object({
  student: mongoId.required().messages({ 'any.required': 'Student ID is required' }),
  date: Joi.date().max('now').required().messages({ 'any.required': 'Date is required' }),
  status: Joi.string()
    .valid(...attendanceStatuses)
    .required()
    .messages({ 'any.required': 'Status is required' }),
  section: mongoId.required().messages({ 'any.required': 'Section is required' }),
  grade: Joi.string()
    .valid(...grades)
    .required(),
  academicYear: mongoId.required(),
  term: mongoId.allow(null).optional(),
  checkInTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .allow('', null)
    .optional(),
  checkOutTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .allow('', null)
    .optional(),
  lateMinutes: Joi.number().integer().min(0).max(480).default(0),
  absenceType: Joi.string()
    .valid('Sick', 'Family Emergency', 'Transportation', 'Weather', 'Other')
    .when('status', { is: 'absent', then: Joi.optional(), otherwise: Joi.optional() }),
  isExcused: Joi.boolean().default(false),
  excuseReason: Joi.string().trim().max(500).allow('', null).optional(),
  leaveApplication: mongoId.allow(null).optional(),
  remarks: Joi.string().trim().max(500).allow('', null).optional(),
  notifyParent: Joi.boolean().default(false),
}).options({ stripUnknown: true });

// ─── Bulk Mark Attendance ─────────────────────
const bulkMarkAttendanceSchema = Joi.object({
  date: Joi.date().max('now').required(),
  section: mongoId.required(),
  grade: Joi.string()
    .valid(...grades)
    .required(),
  academicYear: mongoId.required(),
  term: mongoId.allow(null).optional(),
  attendances: Joi.array()
    .items(
      Joi.object({
        student: mongoId.required(),
        status: Joi.string()
          .valid(...attendanceStatuses)
          .required(),
        checkInTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .allow('', null)
          .optional(),
        lateMinutes: Joi.number().integer().min(0).max(480).default(0),
        isExcused: Joi.boolean().default(false),
        excuseReason: Joi.string().trim().max(500).allow('', null).optional(),
        remarks: Joi.string().trim().max(200).allow('', null).optional(),
      })
    )
    .min(1)
    .required(),
  notifyParents: Joi.boolean().default(false),
}).options({ stripUnknown: true });

// ─── Update Attendance ────────────────────────
const updateAttendanceSchema = Joi.object({
  status: Joi.string()
    .valid(...attendanceStatuses)
    .optional(),
  checkInTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .allow('', null)
    .optional(),
  checkOutTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .allow('', null)
    .optional(),
  lateMinutes: Joi.number().integer().min(0).max(480).optional(),
  absenceType: Joi.string()
    .valid('Sick', 'Family Emergency', 'Transportation', 'Weather', 'Other')
    .allow('', null)
    .optional(),
  isExcused: Joi.boolean().optional(),
  excuseReason: Joi.string().trim().max(500).allow('', null).optional(),
  remarks: Joi.string().trim().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Teacher Attendance ───────────────────────
const markTeacherAttendanceSchema = Joi.object({
  teacher: mongoId.optional(),
  employee: mongoId.optional(),
  date: Joi.date().max('now').required(),
  status: Joi.string()
    .valid('present', 'absent', 'late', 'on_leave', 'half_day', 'holiday')
    .required(),
  checkInTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .allow('', null)
    .optional(),
  checkOutTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .allow('', null)
    .optional(),
  lateMinutes: Joi.number().integer().min(0).max(480).default(0),
  isExcused: Joi.boolean().default(false),
  leaveApplication: mongoId.allow(null).optional(),
  remarks: Joi.string().trim().max(500).allow('', null).optional(),
})
  .or('teacher', 'employee')
  .options({ stripUnknown: true });

const bulkMarkTeacherAttendanceSchema = Joi.object({
  date: Joi.date().max('now').required(),
  attendances: Joi.array()
    .items(
      Joi.object({
        staffId: mongoId.required(),
        staffType: Joi.string().valid('teacher', 'employee').required(),
        status: Joi.string()
          .valid('present', 'absent', 'late', 'on_leave', 'half_day', 'holiday')
          .required(),
        checkInTime: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .allow('', null)
          .optional(),
        lateMinutes: Joi.number().integer().min(0).max(480).default(0),
        isExcused: Joi.boolean().default(false),
        remarks: Joi.string().trim().max(200).allow('', null).optional(),
      })
    )
    .min(1)
    .required(),
}).options({ stripUnknown: true });

// ─── Attendance Filter Schema ─────────────────
const attendanceFilterSchema = Joi.object({
  student: mongoId.optional(),
  section: mongoId.optional(),
  grade: Joi.string()
    .valid(...grades)
    .optional(),
  academicYear: mongoId.optional(),
  term: mongoId.optional(),
  status: Joi.string()
    .valid(...attendanceStatuses)
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  isExcused: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(50),
}).options({ stripUnknown: true });

// ─── Holiday Schema ───────────────────────────
const createHolidaySchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  type: Joi.string()
    .valid('National Holiday', 'Religious Holiday', 'School Event', 'Emergency', 'Other')
    .required(),
  academicYear: mongoId.required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  affectsAttendance: Joi.boolean().default(true),
}).options({ stripUnknown: true });

// ─── Attendance Settings Schema ───────────────
const updateAttendanceSettingsSchema = Joi.object({
  lateThresholdMinutes: Joi.number().integer().min(1).max(120).optional(),
  notifyParentOnAbsence: Joi.boolean().optional(),
  notifyParentOnLate: Joi.boolean().optional(),
  minimumAttendancePercentage: Joi.number().min(0).max(100).optional(),
  workingDays: Joi.object({
    monday: Joi.boolean().optional(),
    tuesday: Joi.boolean().optional(),
    wednesday: Joi.boolean().optional(),
    thursday: Joi.boolean().optional(),
    friday: Joi.boolean().optional(),
    saturday: Joi.boolean().optional(),
    sunday: Joi.boolean().optional(),
  }).optional(),
  schoolStartTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  schoolEndTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
}).options({ stripUnknown: true });

module.exports = {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  updateAttendanceSchema,
  markTeacherAttendanceSchema,
  bulkMarkTeacherAttendanceSchema,
  attendanceFilterSchema,
  createHolidaySchema,
  updateAttendanceSettingsSchema,
};
