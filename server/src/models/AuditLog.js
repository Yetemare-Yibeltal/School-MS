// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// AUDIT LOG MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../config/constants');

const auditLogSchema = new mongoose.Schema(
  {
    // ─── Actor ────────────────────────────────
    // The user who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Cached user info in case user is deleted later
    userSnapshot: {
      userId: String,
      fullName: String,
      email: String,
      role: String,
    },

    // ─── Action ───────────────────────────────
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: Object.values(AUDIT_ACTIONS),
      index: true,
    },

    // ─── Target Resource ──────────────────────
    // The type of resource that was affected
    resource: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: [
        'user',
        'student',
        'teacher',
        'guardian',
        'employee',
        'class',
        'section',
        'subject',
        'timetable',
        'academic_year',
        'term',
        'exam',
        'result',
        'report_card',
        'attendance',
        'teacher_attendance',
        'fee_type',
        'fee_group',
        'fee_discount',
        'fee_assignment',
        'fee_payment',
        'income',
        'expense',
        'payroll',
        'department',
        'designation',
        'leave_type',
        'leave',
        'book',
        'book_category',
        'book_issue',
        'library_member',
        'notice',
        'event',
        'message',
        'notification',
        'settings',
        'role',
        'permission',
        'document',
        'suspension',
        'ai',
        'system',
        'auth',
      ],
      index: true,
    },

    // ID of the specific record that was affected
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    // Human readable identifier of resource
    // e.g. student name, book title, employee name
    resourceName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },

    // ─── Change Details ───────────────────────
    // Description of what happened
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // Previous values before the change (for updates)
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // New values after the change (for creates/updates)
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Fields that were specifically changed
    changedFields: {
      type: [String],
      default: [],
    },

    // ─── Request Info ─────────────────────────
    ipAddress: {
      type: String,
      default: null,
      index: true,
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 500,
    },

    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'SYSTEM'],
      default: 'SYSTEM',
    },

    endpoint: {
      type: String,
      default: null,
      maxlength: 500,
    },

    // ─── Result ───────────────────────────────
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
      index: true,
    },

    // Error message if action failed
    errorMessage: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    // HTTP status code
    statusCode: {
      type: Number,
      default: 200,
    },

    // ─── Severity ─────────────────────────────
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },

    // ─── Additional Context ───────────────────
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Academic year context
    academicYear: {
      type: String,
      default: null,
    },

    // Term context
    term: {
      type: String,
      default: null,
    },

    // ─── Expiry ───────────────────────────────
    // Audit logs expire after 1 year
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── TTL Index ────────────────────────────────
// Auto-delete audit logs after 1 year
auditLogSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'audit_log_expiry_ttl',
  }
);

// ─── Compound Indexes ─────────────────────────
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Human readable time ago
auditLogSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
});

// ─── Static Methods ───────────────────────────

// Create a log entry — main method used everywhere
auditLogSchema.statics.log = async function ({
  user,
  action,
  resource,
  resourceId = null,
  resourceName = null,
  description,
  previousValues = null,
  newValues = null,
  changedFields = [],
  ipAddress = null,
  userAgent = null,
  method = 'SYSTEM',
  endpoint = null,
  status = 'success',
  errorMessage = null,
  statusCode = 200,
  severity = 'low',
  metadata = null,
  academicYear = null,
  term = null,
}) {
  try {
    // Build user snapshot
    let userSnapshot = null;
    if (user) {
      const User = mongoose.model('User');
      const userDoc = await User.findById(user).select('firstName fatherName email role');
      if (userDoc) {
        userSnapshot = {
          userId: userDoc._id.toString(),
          fullName: `${userDoc.firstName} ${userDoc.fatherName}`,
          email: userDoc.email,
          role: userDoc.role,
        };
      }
    }

    // Determine severity if not provided
    let logSeverity = severity;
    if (!severity || severity === 'low') {
      if (
        action === AUDIT_ACTIONS.DELETE ||
        action === AUDIT_ACTIONS.APPROVE ||
        action === AUDIT_ACTIONS.REJECT
      ) {
        logSeverity = 'medium';
      }
      if (
        resource === 'payroll' ||
        resource === 'fee_payment' ||
        resource === 'settings' ||
        resource === 'role' ||
        resource === 'permission'
      ) {
        logSeverity = 'high';
      }
      if (status === 'failure') {
        logSeverity = 'medium';
      }
    }

    await this.create({
      user: user || null,
      userSnapshot,
      action,
      resource,
      resourceId,
      resourceName,
      description,
      previousValues: sanitizeValues(previousValues),
      newValues: sanitizeValues(newValues),
      changedFields,
      ipAddress,
      userAgent: userAgent ? userAgent.substring(0, 500) : null,
      method,
      endpoint,
      status,
      errorMessage,
      statusCode,
      severity: logSeverity,
      metadata,
      academicYear,
      term,
    });
  } catch (error) {
    // Audit logging should never crash the app
    console.error('❌ Audit log creation failed:', error.message);
  }
};

// Log login event
auditLogSchema.statics.logLogin = async function ({
  user,
  ipAddress,
  userAgent,
  success,
  reason = null,
}) {
  return this.log({
    user: success ? user : null,
    action: AUDIT_ACTIONS.LOGIN,
    resource: 'auth',
    description: success
      ? `User logged in successfully`
      : `Failed login attempt${reason ? `: ${reason}` : ''}`,
    ipAddress,
    userAgent,
    method: 'POST',
    endpoint: '/api/auth/login',
    status: success ? 'success' : 'failure',
    severity: success ? 'low' : 'medium',
    metadata: { success, reason },
  });
};

// Log logout event
auditLogSchema.statics.logLogout = async function ({ user, ipAddress, userAgent }) {
  return this.log({
    user,
    action: AUDIT_ACTIONS.LOGOUT,
    resource: 'auth',
    description: 'User logged out',
    ipAddress,
    userAgent,
    method: 'POST',
    endpoint: '/api/auth/logout',
    status: 'success',
    severity: 'low',
  });
};

// Log create action
auditLogSchema.statics.logCreate = async function ({
  user,
  resource,
  resourceId,
  resourceName,
  newValues,
  ipAddress,
  description,
}) {
  return this.log({
    user,
    action: AUDIT_ACTIONS.CREATE,
    resource,
    resourceId,
    resourceName,
    description: description || `Created ${resource}: ${resourceName}`,
    newValues,
    ipAddress,
    method: 'POST',
    status: 'success',
    severity: 'low',
  });
};

// Log update action
auditLogSchema.statics.logUpdate = async function ({
  user,
  resource,
  resourceId,
  resourceName,
  previousValues,
  newValues,
  changedFields,
  ipAddress,
  description,
}) {
  return this.log({
    user,
    action: AUDIT_ACTIONS.UPDATE,
    resource,
    resourceId,
    resourceName,
    description: description || `Updated ${resource}: ${resourceName}`,
    previousValues,
    newValues,
    changedFields,
    ipAddress,
    method: 'PUT',
    status: 'success',
    severity: 'low',
  });
};

// Log delete action
auditLogSchema.statics.logDelete = async function ({
  user,
  resource,
  resourceId,
  resourceName,
  previousValues,
  ipAddress,
  description,
}) {
  return this.log({
    user,
    action: AUDIT_ACTIONS.DELETE,
    resource,
    resourceId,
    resourceName,
    description: description || `Deleted ${resource}: ${resourceName}`,
    previousValues,
    ipAddress,
    method: 'DELETE',
    status: 'success',
    severity: 'medium',
  });
};

// Log settings change
auditLogSchema.statics.logSettingsChange = async function ({
  user,
  previousValues,
  newValues,
  changedFields,
  ipAddress,
  description,
}) {
  return this.log({
    user,
    action: AUDIT_ACTIONS.CHANGE_SETTINGS,
    resource: 'settings',
    description: description || `System settings changed: ${changedFields.join(', ')}`,
    previousValues,
    newValues,
    changedFields,
    ipAddress,
    method: 'PUT',
    status: 'success',
    severity: 'high',
  });
};

// Log export action
auditLogSchema.statics.logExport = async function ({
  user,
  resource,
  description,
  metadata,
  ipAddress,
}) {
  return this.log({
    user,
    action: AUDIT_ACTIONS.EXPORT,
    resource,
    description: description || `Exported ${resource} data`,
    ipAddress,
    method: 'GET',
    status: 'success',
    severity: 'medium',
    metadata,
  });
};

// Log AI usage
auditLogSchema.statics.logAIUsage = async function ({ user, feature, prompt, ipAddress, success }) {
  return this.log({
    user,
    action: AUDIT_ACTIONS.VIEW,
    resource: 'ai',
    description: `AI feature used: ${feature}`,
    ipAddress,
    method: 'POST',
    status: success ? 'success' : 'failure',
    severity: 'low',
    metadata: {
      feature,
      promptLength: prompt ? prompt.length : 0,
    },
  });
};

// Get logs for a specific user
auditLogSchema.statics.getUserLogs = function (userId, options = {}) {
  const {
    limit = 50,
    page = 1,
    action = null,
    resource = null,
    status = null,
    startDate = null,
    endDate = null,
  } = options;

  const query = { user: userId };

  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('user', 'firstName fatherName email role photo');
};

// Get logs for a specific resource record
auditLogSchema.statics.getResourceLogs = function (resource, resourceId, limit = 20) {
  return this.find({ resource, resourceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'firstName fatherName email role photo');
};

// Get recent security events
auditLogSchema.statics.getSecurityEvents = function (limit = 100) {
  return this.find({
    $or: [
      { action: AUDIT_ACTIONS.LOGIN, status: 'failure' },
      { severity: { $in: ['high', 'critical'] } },
      { action: AUDIT_ACTIONS.DELETE },
      { action: AUDIT_ACTIONS.CHANGE_SETTINGS },
      { resource: 'role' },
      { resource: 'permission' },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'firstName fatherName email role');
};

// Get dashboard stats for audit log page
auditLogSchema.statics.getDashboardStats = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const [
    totalToday,
    totalYesterday,
    failedLogins,
    highSeverity,
    actionBreakdown,
    resourceBreakdown,
  ] = await Promise.all([
    this.countDocuments({ createdAt: { $gte: today } }),
    this.countDocuments({
      createdAt: { $gte: yesterday, $lt: today },
    }),
    this.countDocuments({
      action: AUDIT_ACTIONS.LOGIN,
      status: 'failure',
      createdAt: { $gte: lastWeek },
    }),
    this.countDocuments({
      severity: { $in: ['high', 'critical'] },
      createdAt: { $gte: lastWeek },
    }),
    this.aggregate([
      { $match: { createdAt: { $gte: lastWeek } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: lastWeek } } },
      { $group: { _id: '$resource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    totalToday,
    totalYesterday,
    changePercent:
      totalYesterday > 0 ? Math.round(((totalToday - totalYesterday) / totalYesterday) * 100) : 0,
    failedLogins,
    highSeverity,
    actionBreakdown,
    resourceBreakdown,
  };
};

// Search audit logs
auditLogSchema.statics.search = function ({
  query = '',
  action = null,
  resource = null,
  status = null,
  severity = null,
  userId = null,
  ipAddress = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 20,
} = {}) {
  const filter = {};

  if (query) {
    filter.$or = [
      {
        description: { $regex: query, $options: 'i' },
      },
      {
        resourceName: { $regex: query, $options: 'i' },
      },
      {
        'userSnapshot.fullName': {
          $regex: query,
          $options: 'i',
        },
      },
      {
        'userSnapshot.email': {
          $regex: query,
          $options: 'i',
        },
      },
    ];
  }

  if (action) filter.action = action;
  if (resource) filter.resource = resource;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (userId) filter.user = userId;
  if (ipAddress) filter.ipAddress = ipAddress;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .populate('user', 'firstName fatherName email role photo');
};

// ─── Helper: Sanitize sensitive values ────────
// Remove passwords and tokens from logged values
const sanitizeValues = (values) => {
  if (!values || typeof values !== 'object') return values;

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'hash',
    'passwordResetToken',
    'emailVerificationToken',
    'tokenHash',
    'apiKey',
    'accessToken',
    'refreshToken',
  ];

  const sanitized = { ...values };

  sensitiveFields.forEach((field) => {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

// ─── Create Model ─────────────────────────────
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
