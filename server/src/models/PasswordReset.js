// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// PASSWORD RESET MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema(
  {
    // ─── User Reference ──────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },

    // ─── Token ───────────────────────────────────
    // Hashed token stored in DB
    // Plain token is sent to user email
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
    },

    // ─── Status ──────────────────────────────────
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    isExpired: {
      type: Boolean,
      default: false,
    },

    // ─── Expiry ───────────────────────────────────
    // Token expires after 1 hour
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // ─── Security Tracking ───────────────────────
    // IP address that requested the reset
    requestedFromIP: {
      type: String,
      default: null,
    },

    // IP address that used the reset link
    usedFromIP: {
      type: String,
      default: null,
    },

    // User agent of requester
    userAgent: {
      type: String,
      default: null,
      maxlength: 500,
    },

    // How many times the reset was attempted
    // with this token (detect brute force)
    attemptCount: {
      type: Number,
      default: 0,
    },

    // Lock token after 5 failed attempts
    isLocked: {
      type: Boolean,
      default: false,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    // ─── Type ────────────────────────────────────
    // Whether this is a password reset or
    // a first-time password set
    type: {
      type: String,
      enum: ['reset', 'set', 'admin_reset'],
      default: 'reset',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── TTL Index ────────────────────────────────
// MongoDB automatically deletes expired records
passwordResetSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'password_reset_expiry_ttl',
  }
);

// ─── Compound Indexes ─────────────────────────
passwordResetSchema.index({ user: 1, isUsed: 1 });
passwordResetSchema.index({ email: 1, isUsed: 1 });
passwordResetSchema.index({ tokenHash: 1, isUsed: 1 });

// ─── Virtuals ─────────────────────────────────
// Check if token is still valid
passwordResetSchema.virtual('isValid').get(function () {
  return !this.isUsed && !this.isLocked && this.expiresAt > new Date() && this.attemptCount < 5;
});

// Minutes remaining until expiry
passwordResetSchema.virtual('minutesRemaining').get(function () {
  const remaining = this.expiresAt - new Date();
  return Math.max(0, Math.floor(remaining / (1000 * 60)));
});

// ─── Static Methods ───────────────────────────

// Generate a secure reset token
passwordResetSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

// Hash a token for storage
passwordResetSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Create a new password reset record
passwordResetSchema.statics.createResetToken = async function ({
  userId,
  email,
  ipAddress,
  userAgent,
  type = 'reset',
  expiryMinutes = 60,
}) {
  // Invalidate any existing unused tokens for this user
  await this.updateMany({ user: userId, isUsed: false }, { isUsed: true, usedAt: new Date() });

  // Generate new token
  const plainToken = this.generateToken();
  const tokenHash = this.hashToken(plainToken);

  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Create the reset record
  await this.create({
    user: userId,
    email: email.toLowerCase(),
    tokenHash,
    requestedFromIP: ipAddress,
    userAgent: userAgent ? userAgent.substring(0, 500) : null,
    type,
    expiresAt,
  });

  // Return plain token to be sent in email
  return plainToken;
};

// Find a valid reset record by plain token
passwordResetSchema.statics.findValidToken = async function (plainToken) {
  const tokenHash = this.hashToken(plainToken);

  return this.findOne({
    tokenHash,
    isUsed: false,
    isLocked: false,
    expiresAt: { $gt: new Date() },
  }).populate('user');
};

// Mark token as used after successful reset
passwordResetSchema.statics.markAsUsed = async function (plainToken, usedFromIP) {
  const tokenHash = this.hashToken(plainToken);

  return this.findOneAndUpdate(
    { tokenHash },
    {
      isUsed: true,
      usedAt: new Date(),
      usedFromIP,
    },
    { new: true }
  );
};

// Increment attempt count and lock if too many
passwordResetSchema.statics.incrementAttempt = async function (plainToken) {
  const tokenHash = this.hashToken(plainToken);

  const record = await this.findOne({ tokenHash });

  if (!record) return null;

  record.attemptCount += 1;

  // Lock after 5 failed attempts
  if (record.attemptCount >= 5) {
    record.isLocked = true;
    record.lockedAt = new Date();
  }

  await record.save({ validateBeforeSave: false });
  return record;
};

// Invalidate all reset tokens for a user
passwordResetSchema.statics.invalidateUserTokens = async function (userId) {
  return this.updateMany(
    { user: userId, isUsed: false },
    {
      isUsed: true,
      usedAt: new Date(),
    }
  );
};

// Count recent reset requests from an IP
// Used to prevent abuse
passwordResetSchema.statics.countRecentFromIP = async function (ipAddress, windowMinutes = 60) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  return this.countDocuments({
    requestedFromIP: ipAddress,
    createdAt: { $gte: windowStart },
  });
};

// Count recent reset requests for an email
passwordResetSchema.statics.countRecentForEmail = async function (email, windowMinutes = 60) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  return this.countDocuments({
    email: email.toLowerCase(),
    createdAt: { $gte: windowStart },
  });
};

// Clean up old used/expired tokens
passwordResetSchema.statics.cleanOldTokens = function () {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return this.deleteMany({
    $or: [
      { isUsed: true, usedAt: { $lt: thirtyDaysAgo } },
      {
        expiresAt: { $lt: new Date() },
        isUsed: false,
      },
    ],
  });
};

// Get reset history for a user
passwordResetSchema.statics.getUserResetHistory = function (userId, limit = 10) {
  return this.find({ user: userId }).select('-tokenHash').sort({ createdAt: -1 }).limit(limit);
};

// ─── Instance Methods ─────────────────────────

// Check if token is still valid
passwordResetSchema.methods.checkValidity = function () {
  if (this.isUsed) {
    return {
      valid: false,
      reason: 'Token has already been used',
    };
  }

  if (this.isLocked) {
    return {
      valid: false,
      reason: 'Token has been locked due to too many failed attempts',
    };
  }

  if (this.expiresAt < new Date()) {
    return {
      valid: false,
      reason: 'Token has expired. Please request a new password reset',
    };
  }

  if (this.attemptCount >= 5) {
    return {
      valid: false,
      reason: 'Maximum attempts exceeded',
    };
  }

  return { valid: true };
};

// ─── Create Model ─────────────────────────────
const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;
