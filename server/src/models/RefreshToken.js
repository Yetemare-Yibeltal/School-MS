// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// REFRESH TOKEN MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    // ─── Token Data ────────────────────────────
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },

    // Hashed version of token stored in DB
    // The plain token is sent to client
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ─── User Reference ─────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    // ─── Token Status ───────────────────────────
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedReason: {
      type: String,
      enum: [
        'logout',
        'password_change',
        'account_disabled',
        'token_rotation',
        'admin_revoke',
        'suspicious_activity',
        null,
      ],
      default: null,
    },

    // ─── Token Rotation ──────────────────────────
    // When a token is used and rotated, track the
    // new token that replaced it
    replacedByToken: {
      type: String,
      default: null,
    },

    // How many times this token has been used
    useCount: {
      type: Number,
      default: 0,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    // ─── Device Info ────────────────────────────
    // Track which device/browser issued this token
    deviceInfo: {
      userAgent: {
        type: String,
        default: null,
        maxlength: 500,
      },
      browser: {
        type: String,
        default: null,
      },
      os: {
        type: String,
        default: null,
      },
      device: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown',
      },
      deviceName: {
        type: String,
        default: null,
      },
    },

    // ─── Network Info ────────────────────────────
    ipAddress: {
      type: String,
      default: null,
    },

    // ─── Expiry ──────────────────────────────────
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // ─── Family ──────────────────────────────────
    // Token family is used to detect token reuse attacks
    // All tokens from the same login session share a family ID
    // If a revoked token is used, all tokens in the family are revoked
    family: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── TTL Index ────────────────────────────────
// MongoDB automatically deletes expired tokens
// This keeps the collection clean without manual cleanup
refreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'token_expiry_ttl',
  }
);

// ─── Compound Indexes ─────────────────────────
refreshTokenSchema.index({ user: 1, isRevoked: 1 });
refreshTokenSchema.index({ user: 1, family: 1 });
refreshTokenSchema.index({ tokenHash: 1, isRevoked: 1 });
refreshTokenSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Check if token is expired
refreshTokenSchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date();
});

// Check if token is valid (not revoked and not expired)
refreshTokenSchema.virtual('isValid').get(function () {
  return !this.isRevoked && this.expiresAt > new Date();
});

// Time remaining until expiry in seconds
refreshTokenSchema.virtual('timeRemainingSeconds').get(function () {
  const remaining = this.expiresAt - new Date();
  return Math.max(0, Math.floor(remaining / 1000));
});

// ─── Static Methods ───────────────────────────

// Generate a new refresh token
refreshTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(64).toString('hex');
};

// Hash a token for storage
refreshTokenSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate a family ID for a new login session
refreshTokenSchema.statics.generateFamily = function () {
  return crypto.randomBytes(16).toString('hex');
};

// Create a new refresh token document
refreshTokenSchema.statics.createToken = async function ({
  userId,
  ipAddress,
  userAgent,
  family,
  expiryDays = 7,
}) {
  const token = this.generateToken();
  const tokenHash = this.hashToken(token);
  const tokenFamily = family || this.generateFamily();

  // Parse device info from user agent
  const deviceInfo = parseUserAgent(userAgent);

  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  const refreshToken = await this.create({
    token,
    tokenHash,
    user: userId,
    ipAddress,
    deviceInfo,
    family: tokenFamily,
    expiresAt,
  });

  return {
    token,
    tokenHash,
    family: tokenFamily,
    expiresAt,
    id: refreshToken._id,
  };
};

// Find valid token by plain token value
refreshTokenSchema.statics.findValidToken = async function (token) {
  const tokenHash = this.hashToken(token);

  return this.findOne({
    tokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).populate('user');
};

// Revoke a single token
refreshTokenSchema.statics.revokeToken = async function (token, reason = 'logout') {
  const tokenHash = this.hashToken(token);

  return this.findOneAndUpdate(
    { tokenHash },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
    { new: true }
  );
};

// Revoke all tokens for a user
refreshTokenSchema.statics.revokeAllUserTokens = async function (userId, reason = 'logout') {
  return this.updateMany(
    { user: userId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    }
  );
};

// Revoke all tokens in a family (detect reuse attack)
refreshTokenSchema.statics.revokeFamily = async function (family, reason = 'suspicious_activity') {
  return this.updateMany(
    { family, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    }
  );
};

// Rotate token — revoke old, create new
refreshTokenSchema.statics.rotateToken = async function ({
  oldToken,
  userId,
  ipAddress,
  userAgent,
  family,
}) {
  // Hash old token
  const oldTokenHash = this.hashToken(oldToken);

  // Generate new token
  const newToken = this.generateToken();
  const newTokenHash = this.hashToken(newToken);
  const deviceInfo = parseUserAgent(userAgent);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Revoke old token and create new in parallel
  const [, newRefreshToken] = await Promise.all([
    this.findOneAndUpdate(
      { tokenHash: oldTokenHash },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'token_rotation',
        replacedByToken: newTokenHash,
      }
    ),
    this.create({
      token: newToken,
      tokenHash: newTokenHash,
      user: userId,
      ipAddress,
      deviceInfo,
      family,
      expiresAt,
    }),
  ]);

  return {
    token: newToken,
    tokenHash: newTokenHash,
    expiresAt,
    id: newRefreshToken._id,
  };
};

// Get all active sessions for a user
refreshTokenSchema.statics.getUserSessions = function (userId) {
  return this.find({
    user: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })
    .select('-tokenHash -token -replacedByToken')
    .sort({ createdAt: -1 });
};

// Clean up expired tokens (manual cleanup if TTL doesn't run)
refreshTokenSchema.statics.cleanExpiredTokens = function () {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      {
        isRevoked: true,
        revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    ],
  });
};

// ─── Instance Methods ─────────────────────────

// Mark token as used
refreshTokenSchema.methods.markAsUsed = async function () {
  this.useCount += 1;
  this.lastUsedAt = new Date();
  await this.save({ validateBeforeSave: false });
};

// ─── Helper Functions ─────────────────────────

// Parse user agent string to extract device info
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      userAgent: null,
      browser: 'Unknown',
      os: 'Unknown',
      device: 'unknown',
      deviceName: 'Unknown Device',
    };
  }

  // Simple UA parsing
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'unknown';

  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  } else if (userAgent.includes('Postman')) {
    browser = 'Postman';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (
    userAgent.includes('iOS') ||
    userAgent.includes('iPhone') ||
    userAgent.includes('iPad')
  ) {
    os = 'iOS';
  }

  // Detect device type
  if (
    userAgent.includes('Mobile') ||
    userAgent.includes('Android') ||
    userAgent.includes('iPhone')
  ) {
    device = 'mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    device = 'tablet';
  } else {
    device = 'desktop';
  }

  return {
    userAgent: userAgent.substring(0, 500),
    browser,
    os,
    device,
    deviceName: `${browser} on ${os}`,
  };
};

// ─── Create Model ─────────────────────────────
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
