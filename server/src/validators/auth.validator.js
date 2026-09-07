// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// AUTH VALIDATOR
// kat-school/server/src/validators/auth.validator.js
// ============================================

'use strict';

const Joi = require('joi');

// ─── Common Schemas ───────────────────────────
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  });

const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .max(150)
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  });

const phoneSchema = Joi.string()
  .pattern(/^(\+251|251|0)?[79]\d{8}$/)
  .messages({
    'string.pattern.base': 'Please provide a valid Ethiopian phone number (e.g. +251911234567)',
  });

// ─── Login Schema ─────────────────────────────
const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().min(1).max(128).required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
  rememberMe: Joi.boolean().default(false),
}).options({ stripUnknown: true });

// ─── Register Schema ──────────────────────────
const registerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\u1200-\u137F\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name can only contain letters',
      'any.required': 'First name is required',
    }),
  fatherName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\u1200-\u137F\s]+$/)
    .required()
    .messages({
      'any.required': "Father's name is required",
    }),
  grandFatherName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\u1200-\u137F\s]+$/)
    .allow('', null)
    .optional(),
  email: emailSchema.required(),
  phone: phoneSchema.required().messages({
    'any.required': 'Phone number is required',
  }),
  password: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
  role: Joi.string()
    .valid(
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'librarian',
      'hr_manager',
      'receptionist'
    )
    .required()
    .messages({
      'any.only': 'Invalid role selected',
      'any.required': 'Role is required',
    }),
  gender: Joi.string().valid('Male', 'Female').required().messages({
    'any.required': 'Gender is required',
  }),
}).options({ stripUnknown: true });

// ─── Change Password Schema ───────────────────
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: passwordSchema.required().messages({
    'any.required': 'New password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your new password',
  }),
}).options({ stripUnknown: true });

// ─── Forgot Password Schema ───────────────────
const forgotPasswordSchema = Joi.object({
  email: emailSchema.required(),
}).options({ stripUnknown: true });

// ─── Reset Password Schema ────────────────────
const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
}).options({ stripUnknown: true });

// ─── Update Profile Schema ────────────────────
const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  fatherName: Joi.string().trim().min(2).max(50).optional(),
  grandFatherName: Joi.string().trim().min(2).max(50).allow('', null).optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: Joi.date().max('now').optional().messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  bio: Joi.string().trim().max(500).allow('', null).optional(),
  address: Joi.string().trim().max(200).allow('', null).optional(),
}).options({ stripUnknown: true });

// ─── Two Factor Schema ────────────────────────
const twoFactorSchema = Joi.object({
  token: Joi.string().trim().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'Two-factor code must be exactly 6 digits',
    'string.pattern.base': 'Two-factor code must contain only digits',
    'any.required': 'Two-factor code is required',
  }),
}).options({ stripUnknown: true });

// ─── Refresh Token Schema ─────────────────────
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().optional(),
}).options({ stripUnknown: true });

// ─── Verify Email Schema ──────────────────────
const verifyEmailSchema = Joi.object({
  token: Joi.string().trim().required().messages({
    'any.required': 'Verification token is required',
  }),
}).options({ stripUnknown: true });

// ─── Resend Verification Schema ───────────────
const resendVerificationSchema = Joi.object({
  email: emailSchema.required(),
}).options({ stripUnknown: true });

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  twoFactorSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
};
