// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// USER MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ROLES, ALL_ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    // ─── Basic Info ────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },

    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
      minlength: [2, "Father's name must be at least 2 characters"],
      maxlength: [50, "Father's name cannot exceed 50 characters"],
    },

    grandFatherName: {
      type: String,
      trim: true,
      maxlength: [50, "Grand father's name cannot exceed 50 characters"],
    },

    // ─── Contact ───────────────────────────────
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      match: [/^(\+251|0)[0-9]{9}$/, 'Please provide a valid Ethiopian phone number'],
    },

    // ─── Authentication ─────────────────────────
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },

    passwordChangedAt: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    isTemporaryPassword: {
      type: Boolean,
      default: false,
    },

    // ─── Role & Permissions ─────────────────────
    role: {
      type: String,
      enum: {
        values: ALL_ROLES,
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'User role is required'],
      default: ROLES.STUDENT,
      index: true,
    },

    // Custom permissions override
    customPermissions: {
      type: [String],
      default: [],
    },

    // Permissions explicitly denied
    deniedPermissions: {
      type: [String],
      default: [],
    },

    // ─── Profile Photo ─────────────────────────
    photo: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },

    // ─── Profile Links ──────────────────────────
    // Link to the specific profile based on role
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },

    teacherProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    employeeProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    // ─── Account Status ─────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // ─── Login History ──────────────────────────
    lastLogin: {
      type: Date,
      default: null,
    },

    lastLoginIP: {
      type: String,
      default: null,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    accountLockedUntil: {
      type: Date,
      default: null,
    },

    // ─── Preferences ────────────────────────────
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light',
      },
      language: {
        type: String,
        enum: ['en', 'am'],
        default: 'en',
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      dashboardLayout: {
        type: String,
        default: 'default',
      },
    },

    // ─── Notifications ──────────────────────────
    unreadNotifications: {
      type: Number,
      default: 0,
    },

    // ─── Device Tokens ──────────────────────────
    // For push notifications
    deviceTokens: {
      type: [String],
      default: [],
      select: false,
    },

    // ─── Created By ─────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ studentProfile: 1 });
userSchema.index({ teacherProfile: 1 });
userSchema.index({ employeeProfile: 1 });
userSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Full name virtual
userSchema.virtual('fullName').get(function () {
  const parts = [this.firstName, this.fatherName];
  if (this.grandFatherName) parts.push(this.grandFatherName);
  return parts.join(' ');
});

// Is account locked virtual
userSchema.virtual('isLocked').get(function () {
  return this.accountLockedUntil && this.accountLockedUntil > new Date();
});

// ─── Pre-Save Hooks ───────────────────────────

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);

    // Update passwordChangedAt when password changes
    // but not on first save (account creation)
    if (!this.isNew) {
      this.passwordChangedAt = new Date(Date.now() - 1000);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ─── Instance Methods ─────────────────────────

// Compare entered password with stored hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Check if password was changed after JWT was issued
userSchema.methods.passwordChangedAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Generate random 32-byte token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token and store in DB
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Token expires in 1 hour
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  // Return the plain token (sent to email)
  return resetToken;
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const verifyToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

  // Token expires in 24 hours
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return verifyToken;
};

// Increment failed login attempts
userSchema.methods.incrementFailedLogins = async function () {
  this.failedLoginAttempts += 1;

  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  await this.save({ validateBeforeSave: false });
};

// Reset failed login attempts on successful login
userSchema.methods.resetFailedLogins = async function (ip) {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  this.lastLogin = new Date();
  this.lastLoginIP = ip;
  this.loginCount += 1;

  await this.save({ validateBeforeSave: false });
};

// Check if account is locked
userSchema.methods.isAccountLocked = function () {
  return this.accountLockedUntil && this.accountLockedUntil > new Date();
};

// Get safe user object (without sensitive fields)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.passwordChangedAt;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.deviceTokens;
  delete obj.failedLoginAttempts;
  delete obj.accountLockedUntil;
  return obj;
};

// ─── Static Methods ───────────────────────────

// Find user by email with password
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Find active users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true });
};

// Find user and check if exists
userSchema.statics.findByIdOrFail = async function (id) {
  const user = await this.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

// ─── Query Middleware ─────────────────────────

// Always filter out inactive users in find queries
// unless explicitly searching for them
userSchema.pre(/^find/, function (next) {
  // Only apply if not explicitly looking for inactive users
  if (!this.getQuery().isActive === false) {
    // Do not auto-filter — let controllers decide
  }
  next();
});

// ─── Create Model ─────────────────────────────
const User = mongoose.model('User', userSchema);

module.exports = User;
