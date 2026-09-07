// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// VALIDATION MIDDLEWARE
// kat-school/server/src/middleware/validate.middleware.js
// ============================================

'use strict';

const { HTTP_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

// ─── Validate Request Body ────────────────────
// Uses Joi schemas or custom validator functions
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!schema) return next();

    const data = req[property];

    // If schema has a validate method (Joi-style)
    if (typeof schema.validate === 'function') {
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
      });

      if (error) {
        const errors = error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
        }));

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Validation failed',
          errors,
          code: 'VALIDATION_ERROR',
        });
      }

      req[property] = value;
      return next();
    }

    // If schema is a function (custom validator)
    if (typeof schema === 'function') {
      const result = schema(data, req);
      if (result.errors && result.errors.length > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Validation failed',
          errors: result.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      return next();
    }

    next();
  };
};

// ─── Validate MongoDB ID ──────────────────────
const validateMongoId = (...paramNames) => {
  return (req, res, next) => {
    const names = paramNames.length > 0 ? paramNames : ['id'];

    for (const name of names) {
      const value = req.params[name] || req.body[name];

      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Invalid ID format for parameter: ${name}`,
          code: 'INVALID_ID',
          field: name,
        });
      }
    }

    next();
  };
};

// ─── Validate Required Fields ─────────────────
const requireFields = (...fields) => {
  return (req, res, next) => {
    const missing = [];

    fields.forEach((field) => {
      const keys = field.split('.');
      let value = req.body;

      for (const key of keys) {
        if (value === undefined || value === null) {
          missing.push(field);
          break;
        }
        value = value[key];
      }

      if (value === undefined || value === null || value === '') {
        if (!missing.includes(field)) {
          missing.push(field);
        }
      }
    });

    if (missing.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Required fields are missing',
        errors: missing.map((f) => ({
          field: f,
          message: `${f} is required`,
        })),
        code: 'MISSING_REQUIRED_FIELDS',
      });
    }

    next();
  };
};

// ─── Sanitize Input ───────────────────────────
// Removes dangerous characters from string fields
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove script tags and HTML
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (
      value !== null &&
      typeof value === 'object' &&
      !(value instanceof mongoose.Types.ObjectId)
    ) {
      const sanitized = {};
      Object.keys(value).forEach((key) => {
        // Remove keys starting with $ (NoSQL injection prevention)
        if (!key.startsWith('$')) {
          sanitized[key] = sanitizeValue(value[key]);
        }
      });
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

// ─── Validate Pagination ──────────────────────
const validatePagination = (req, res, next) => {
  let { page, limit, sort, order } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: sort || 'createdAt',
    order: order === 'asc' ? 1 : -1,
  };

  next();
};

// ─── Validate Date Range ──────────────────────
const validateDateRange = (startField = 'startDate', endField = 'endDate') => {
  return (req, res, next) => {
    const startDate = req.query[startField] || req.body[startField];
    const endDate = req.query[endField] || req.body[endField];

    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid ${startField} format`,
        code: 'INVALID_DATE',
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid ${endField} format`,
        code: 'INVALID_DATE',
      });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `${startField} must be before ${endField}`,
        code: 'INVALID_DATE_RANGE',
      });
    }

    next();
  };
};

// ─── Validate File Upload ─────────────────────
const validateFileUpload = (required = true, allowedTypes = null, maxSizeMB = 5) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      if (required) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'No file uploaded.',
          code: 'NO_FILE',
        });
      }
      return next();
    }

    const file = req.file || req.files?.[0];

    if (file && allowedTypes) {
      const ext = file.originalname.split('.').pop().toLowerCase();

      if (!allowedTypes.includes(ext)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `File type not allowed. Allowed: ${allowedTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE',
        });
      }
    }

    if (file) {
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `File too large. Maximum size: ${maxSizeMB}MB`,
          code: 'FILE_TOO_LARGE',
        });
      }
    }

    next();
  };
};

// ─── Validate Academic Year ───────────────────
const validateAcademicYear = async (req, res, next) => {
  try {
    const AcademicYear = require('../models/AcademicYear');

    const current = await AcademicYear.getCurrent();

    if (!current) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No active academic year found. Please set an academic year first.',
        code: 'NO_ACTIVE_ACADEMIC_YEAR',
      });
    }

    req.currentAcademicYear = current;
    req.academicYearId = current._id;
    req.academicYearName = current.name;

    next();
  } catch (error) {
    console.error('Academic year validation error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to validate academic year.',
    });
  }
};

// ─── Validate Current Term ────────────────────
const validateCurrentTerm = async (req, res, next) => {
  try {
    const Term = require('../models/Term');
    const current = await Term.getCurrent();

    if (!current) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No active term found. Please set a term first.',
        code: 'NO_ACTIVE_TERM',
      });
    }

    req.currentTerm = current;
    req.termId = current._id;
    req.termName = current.name;

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to validate current term.',
    });
  }
};

module.exports = {
  validate,
  validateMongoId,
  requireFields,
  sanitizeInput,
  validatePagination,
  validateDateRange,
  validateFileUpload,
  validateAcademicYear,
  validateCurrentTerm,
};
