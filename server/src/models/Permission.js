// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// PERMISSION MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { PERMISSIONS } = require('../config/constants');

const permissionSchema = new mongoose.Schema(
  {
    // ─── Permission Identity ──────────────────
    // The unique permission key used in code
    // e.g. "create_student", "view_reports"
    key: {
      type: String,
      required: [true, 'Permission key is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^[a-z][a-z0-9_]*$/, 'Permission key must be lowercase with underscores only'],
    },

    // Human readable name
    // e.g. "Create Student", "View Reports"
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Detailed description of what this permission allows
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ─── Grouping ─────────────────────────────
    // Module this permission belongs to
    // Used to group permissions in the UI
    module: {
      type: String,
      required: [true, 'Module is required'],
      enum: [
        'students',
        'teachers',
        'guardians',
        'academic',
        'attendance',
        'finance',
        'hrm',
        'library',
        'communication',
        'reports',
        'settings',
        'ai',
        'system',
      ],
      index: true,
    },

    // Sub-module for more granular grouping
    subModule: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Permission Type ──────────────────────
    // CRUD type for easy filtering
    action: {
      type: String,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'manage',
        'approve',
        'export',
        'import',
        'print',
        'use',
        'view',
        'mark',
        'generate',
        'enter',
        'collect',
        'issue',
        'send',
        'other',
      ],
      default: 'other',
    },

    // ─── Risk Level ───────────────────────────
    // How sensitive this permission is
    // critical = only super_admin should have
    // high = admin level
    // medium = department managers
    // low = general staff
    riskLevel: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'low',
    },

    // ─── Dependencies ─────────────────────────
    // Permissions that must also be granted
    // for this permission to work properly
    // e.g. "create_student" requires "read_student"
    dependencies: {
      type: [String],
      default: [],
    },

    // ─── UI Display ───────────────────────────
    // Icon for displaying in UI
    icon: {
      type: String,
      default: 'lock',
      trim: true,
    },

    // Color for displaying in UI
    color: {
      type: String,
      default: '#6366f1',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    // Display order within module group
    sortOrder: {
      type: Number,
      default: 0,
    },

    // Whether to show in the permissions UI
    isVisible: {
      type: Boolean,
      default: true,
    },

    // ─── Status ───────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // System permissions cannot be deleted
    isSystem: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────
permissionSchema.index({ key: 1 }, { unique: true });
permissionSchema.index({ module: 1, sortOrder: 1 });
permissionSchema.index({ module: 1, isActive: 1 });
permissionSchema.index({ action: 1 });
permissionSchema.index({ riskLevel: 1 });

// ─── Virtuals ─────────────────────────────────
// Full permission label for display
permissionSchema.virtual('label').get(function () {
  return `${this.module}.${this.key}`;
});

// ─── Static Methods ───────────────────────────

// Seed all system permissions from constants
permissionSchema.statics.seedPermissions = async function () {
  const permissionsToSeed = [
    // ── Students ─────────────────────────────
    {
      key: PERMISSIONS.CREATE_STUDENT,
      name: 'Create Student',
      description: 'Add new students to the system',
      module: 'students',
      action: 'create',
      riskLevel: 'medium',
      icon: 'user-plus',
      color: '#4f46e5',
      sortOrder: 1,
      dependencies: [PERMISSIONS.READ_STUDENT],
    },
    {
      key: PERMISSIONS.READ_STUDENT,
      name: 'View Students',
      description: 'View student list and profiles',
      module: 'students',
      action: 'read',
      riskLevel: 'low',
      icon: 'eye',
      color: '#3b82f6',
      sortOrder: 2,
      dependencies: [],
    },
    {
      key: PERMISSIONS.UPDATE_STUDENT,
      name: 'Edit Student',
      description: 'Edit student information and records',
      module: 'students',
      action: 'update',
      riskLevel: 'medium',
      icon: 'user-edit',
      color: '#f59e0b',
      sortOrder: 3,
      dependencies: [PERMISSIONS.READ_STUDENT],
    },
    {
      key: PERMISSIONS.DELETE_STUDENT,
      name: 'Delete Student',
      description: 'Permanently delete student records',
      module: 'students',
      action: 'delete',
      riskLevel: 'high',
      icon: 'user-times',
      color: '#ef4444',
      sortOrder: 4,
      dependencies: [PERMISSIONS.READ_STUDENT],
    },

    // ── Teachers ──────────────────────────────
    {
      key: PERMISSIONS.CREATE_TEACHER,
      name: 'Create Teacher',
      description: 'Add new teachers to the system',
      module: 'teachers',
      action: 'create',
      riskLevel: 'medium',
      icon: 'chalkboard-teacher',
      color: '#4f46e5',
      sortOrder: 1,
      dependencies: [PERMISSIONS.READ_TEACHER],
    },
    {
      key: PERMISSIONS.READ_TEACHER,
      name: 'View Teachers',
      description: 'View teacher list and profiles',
      module: 'teachers',
      action: 'read',
      riskLevel: 'low',
      icon: 'eye',
      color: '#3b82f6',
      sortOrder: 2,
      dependencies: [],
    },
    {
      key: PERMISSIONS.UPDATE_TEACHER,
      name: 'Edit Teacher',
      description: 'Edit teacher information and records',
      module: 'teachers',
      action: 'update',
      riskLevel: 'medium',
      icon: 'user-edit',
      color: '#f59e0b',
      sortOrder: 3,
      dependencies: [PERMISSIONS.READ_TEACHER],
    },
    {
      key: PERMISSIONS.DELETE_TEACHER,
      name: 'Delete Teacher',
      description: 'Remove teacher records from the system',
      module: 'teachers',
      action: 'delete',
      riskLevel: 'high',
      icon: 'trash',
      color: '#ef4444',
      sortOrder: 4,
      dependencies: [PERMISSIONS.READ_TEACHER],
    },

    // ── Academic ──────────────────────────────
    {
      key: PERMISSIONS.CREATE_CLASS,
      name: 'Create Class',
      description: 'Create new classes and sections',
      module: 'academic',
      action: 'create',
      riskLevel: 'medium',
      icon: 'school',
      color: '#4f46e5',
      sortOrder: 1,
      dependencies: [PERMISSIONS.READ_CLASS],
    },
    {
      key: PERMISSIONS.READ_CLASS,
      name: 'View Classes',
      description: 'View class list and details',
      module: 'academic',
      action: 'read',
      riskLevel: 'low',
      icon: 'eye',
      color: '#3b82f6',
      sortOrder: 2,
      dependencies: [],
    },
    {
      key: PERMISSIONS.UPDATE_CLASS,
      name: 'Edit Class',
      description: 'Edit class and section information',
      module: 'academic',
      action: 'update',
      riskLevel: 'medium',
      icon: 'edit',
      color: '#f59e0b',
      sortOrder: 3,
      dependencies: [PERMISSIONS.READ_CLASS],
    },
    {
      key: PERMISSIONS.DELETE_CLASS,
      name: 'Delete Class',
      description: 'Delete class records',
      module: 'academic',
      action: 'delete',
      riskLevel: 'high',
      icon: 'trash',
      color: '#ef4444',
      sortOrder: 4,
      dependencies: [PERMISSIONS.READ_CLASS],
    },
    {
      key: PERMISSIONS.MANAGE_TIMETABLE,
      name: 'Manage Timetable',
      description: 'Create and edit class timetables',
      module: 'academic',
      action: 'manage',
      riskLevel: 'medium',
      icon: 'calendar-alt',
      color: '#8b5cf6',
      sortOrder: 5,
      dependencies: [PERMISSIONS.READ_CLASS],
    },
    {
      key: PERMISSIONS.MANAGE_EXAMS,
      name: 'Manage Exams',
      description: 'Create and manage exam schedules',
      module: 'academic',
      action: 'manage',
      riskLevel: 'medium',
      icon: 'clipboard-list',
      color: '#ec4899',
      sortOrder: 6,
      dependencies: [],
    },
    {
      key: PERMISSIONS.ENTER_MARKS,
      name: 'Enter Marks',
      description: 'Enter and edit student exam marks',
      module: 'academic',
      action: 'enter',
      riskLevel: 'medium',
      icon: 'keyboard',
      color: '#14b8a6',
      sortOrder: 7,
      dependencies: [PERMISSIONS.VIEW_RESULTS],
    },
    {
      key: PERMISSIONS.VIEW_RESULTS,
      name: 'View Results',
      description: 'View student exam results and grades',
      module: 'academic',
      action: 'view',
      riskLevel: 'low',
      icon: 'chart-bar',
      color: '#3b82f6',
      sortOrder: 8,
      dependencies: [],
    },
    {
      key: PERMISSIONS.GENERATE_REPORT_CARD,
      name: 'Generate Report Card',
      description: 'Generate and print student report cards',
      module: 'academic',
      action: 'generate',
      riskLevel: 'medium',
      icon: 'file-alt',
      color: '#22c55e',
      sortOrder: 9,
      dependencies: [PERMISSIONS.VIEW_RESULTS],
    },

    // ── Attendance ────────────────────────────
    {
      key: PERMISSIONS.MARK_ATTENDANCE,
      name: 'Mark Attendance',
      description: 'Mark student and teacher attendance',
      module: 'attendance',
      action: 'mark',
      riskLevel: 'medium',
      icon: 'calendar-check',
      color: '#22c55e',
      sortOrder: 1,
      dependencies: [PERMISSIONS.VIEW_ATTENDANCE],
    },
    {
      key: PERMISSIONS.VIEW_ATTENDANCE,
      name: 'View Attendance',
      description: 'View attendance records and reports',
      module: 'attendance',
      action: 'view',
      riskLevel: 'low',
      icon: 'eye',
      color: '#3b82f6',
      sortOrder: 2,
      dependencies: [],
    },
    {
      key: PERMISSIONS.EDIT_ATTENDANCE,
      name: 'Edit Attendance',
      description: 'Edit and correct attendance records',
      module: 'attendance',
      action: 'update',
      riskLevel: 'medium',
      icon: 'edit',
      color: '#f59e0b',
      sortOrder: 3,
      dependencies: [PERMISSIONS.VIEW_ATTENDANCE],
    },

    // ── Finance ───────────────────────────────
    {
      key: PERMISSIONS.COLLECT_FEES,
      name: 'Collect Fees',
      description: 'Collect and record fee payments',
      module: 'finance',
      action: 'collect',
      riskLevel: 'high',
      icon: 'coins',
      color: '#f59e0b',
      sortOrder: 1,
      dependencies: [PERMISSIONS.VIEW_FEES],
    },
    {
      key: PERMISSIONS.VIEW_FEES,
      name: 'View Fees',
      description: 'View fee records and payment history',
      module: 'finance',
      action: 'view',
      riskLevel: 'low',
      icon: 'eye',
      color: '#3b82f6',
      sortOrder: 2,
      dependencies: [],
    },
    {
      key: PERMISSIONS.MANAGE_FEE_TYPES,
      name: 'Manage Fee Types',
      description: 'Create and edit fee types, groups and discounts',
      module: 'finance',
      action: 'manage',
      riskLevel: 'high',
      icon: 'tags',
      color: '#ec4899',
      sortOrder: 3,
      dependencies: [PERMISSIONS.VIEW_FEES],
    },
    {
      key: PERMISSIONS.MANAGE_INCOME,
      name: 'Manage Income',
      description: 'Record and manage school income',
      module: 'finance',
      action: 'manage',
      riskLevel: 'high',
      icon: 'arrow-up',
      color: '#22c55e',
      sortOrder: 4,
      dependencies: [],
    },
    {
      key: PERMISSIONS.MANAGE_EXPENSE,
      name: 'Manage Expenses',
      description: 'Record and manage school expenses',
      module: 'finance',
      action: 'manage',
      riskLevel: 'high',
      icon: 'arrow-down',
      color: '#ef4444',
      sortOrder: 5,
      dependencies: [],
    },
    {
      key: PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      name: 'View Financial Reports',
      description: 'View income, expense and financial summaries',
      module: 'finance',
      action: 'view',
      riskLevel: 'high',
      icon: 'chart-line',
      color: '#8b5cf6',
      sortOrder: 6,
      dependencies: [],
    },

    // ── HRM ───────────────────────────────────
    {
      key: PERMISSIONS.MANAGE_EMPLOYEES,
      name: 'Manage Employees',
      description: 'Add, edit and manage employee records',
      module: 'hrm',
      action: 'manage',
      riskLevel: 'high',
      icon: 'id-badge',
      color: '#4f46e5',
      sortOrder: 1,
      dependencies: [PERMISSIONS.VIEW_HRM],
    },
    {
      key: PERMISSIONS.MANAGE_PAYROLL,
      name: 'Manage Payroll',
      description: 'Process and manage employee salary payroll',
      module: 'hrm',
      action: 'manage',
      riskLevel: 'critical',
      icon: 'money-bill',
      color: '#22c55e',
      sortOrder: 2,
      dependencies: [PERMISSIONS.VIEW_HRM],
    },
    {
      key: PERMISSIONS.APPROVE_LEAVE,
      name: 'Approve Leave',
      description: 'Approve or reject leave applications',
      module: 'hrm',
      action: 'approve',
      riskLevel: 'medium',
      icon: 'check-circle',
      color: '#22c55e',
      sortOrder: 3,
      dependencies: [PERMISSIONS.VIEW_HRM],
    },
    {
      key: PERMISSIONS.VIEW_HRM,
      name: 'View HRM',
      description: 'View employee records, departments and HRM data',
      module: 'hrm',
      action: 'view',
      riskLevel: 'medium',
      icon: 'eye',
      color: '#3b82f6',
      sortOrder: 4,
      dependencies: [],
    },

    // ── Library ───────────────────────────────
    {
      key: PERMISSIONS.MANAGE_BOOKS,
      name: 'Manage Books',
      description: 'Add, edit, and delete books from catalog',
      module: 'library',
      action: 'manage',
      riskLevel: 'medium',
      icon: 'book',
      color: '#8b5cf6',
      sortOrder: 1,
      dependencies: [PERMISSIONS.VIEW_LIBRARY],
    },
    {
      key: PERMISSIONS.ISSUE_BOOKS,
      name: 'Issue & Return Books',
      description: 'Issue books to members and process returns',
      module: 'library',
      action: 'issue',
      riskLevel: 'medium',
      icon: 'book-open',
      color: '#14b8a6',
      sortOrder: 2,
      dependencies: [PERMISSIONS.VIEW_LIBRARY],
    },
    {
      key: PERMISSIONS.VIEW_LIBRARY,
      name: 'View Library',
      description: 'View book catalog and library records',
      module: 'library',
      action: 'view',
      riskLevel: 'low',
      icon: 'eye',
      color: '#3b82f6',
      sortOrder: 3,
      dependencies: [],
    },

    // ── Communication ─────────────────────────
    {
      key: PERMISSIONS.CREATE_NOTICE,
      name: 'Create Notice',
      description: 'Create and publish notices and announcements',
      module: 'communication',
      action: 'create',
      riskLevel: 'medium',
      icon: 'bullhorn',
      color: '#f97316',
      sortOrder: 1,
      dependencies: [PERMISSIONS.VIEW_NOTICE],
    },
    {
      key: PERMISSIONS.VIEW_NOTICE,
      name: 'View Notices',
      description: 'View school notices and announcements',
      module: 'communication',
      action: 'view',
      riskLevel: 'low',
      icon: 'eye',
      color: '#3b82f6',
      sortOrder: 2,
      dependencies: [],
    },
    {
      key: PERMISSIONS.SEND_MESSAGE,
      name: 'Send Messages',
      description: 'Send internal messages to staff and students',
      module: 'communication',
      action: 'send',
      riskLevel: 'low',
      icon: 'comment-dots',
      color: '#22c55e',
      sortOrder: 3,
      dependencies: [],
    },
    {
      key: PERMISSIONS.MANAGE_EVENTS,
      name: 'Manage Events',
      description: 'Create and manage school events',
      module: 'communication',
      action: 'manage',
      riskLevel: 'medium',
      icon: 'calendar-alt',
      color: '#ec4899',
      sortOrder: 4,
      dependencies: [],
    },

    // ── System ────────────────────────────────
    {
      key: PERMISSIONS.MANAGE_SETTINGS,
      name: 'Manage Settings',
      description: 'Access and modify system settings',
      module: 'settings',
      action: 'manage',
      riskLevel: 'critical',
      icon: 'cog',
      color: '#6b7280',
      sortOrder: 1,
      dependencies: [],
    },
    {
      key: PERMISSIONS.VIEW_REPORTS,
      name: 'View Reports',
      description: 'View all system reports and analytics',
      module: 'reports',
      action: 'view',
      riskLevel: 'medium',
      icon: 'chart-bar',
      color: '#3b82f6',
      sortOrder: 1,
      dependencies: [],
    },
    {
      key: PERMISSIONS.MANAGE_ROLES,
      name: 'Manage Roles',
      description: 'Create and manage user roles and permissions',
      module: 'settings',
      action: 'manage',
      riskLevel: 'critical',
      icon: 'user-shield',
      color: '#ef4444',
      sortOrder: 2,
      dependencies: [PERMISSIONS.MANAGE_SETTINGS],
    },
    {
      key: PERMISSIONS.VIEW_AUDIT_LOGS,
      name: 'View Audit Logs',
      description: 'View system audit and activity logs',
      module: 'system',
      action: 'view',
      riskLevel: 'high',
      icon: 'history',
      color: '#64748b',
      sortOrder: 1,
      dependencies: [],
    },

    // ── AI ────────────────────────────────────
    {
      key: PERMISSIONS.USE_AI,
      name: 'Use AI Features',
      description: 'Access AI assistant, chatbot and AI-powered features',
      module: 'ai',
      action: 'use',
      riskLevel: 'low',
      icon: 'robot',
      color: '#8b5cf6',
      sortOrder: 1,
      dependencies: [],
    },
  ];

  // Upsert all permissions
  for (const permData of permissionsToSeed) {
    await this.findOneAndUpdate(
      { key: permData.key },
      { $setOnInsert: permData },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${permissionsToSeed.length} permissions seeded successfully`);
};

// Get all permissions grouped by module
permissionSchema.statics.getGroupedPermissions = async function () {
  const permissions = await this.find({
    isActive: true,
    isVisible: true,
  }).sort({ module: 1, sortOrder: 1 });

  // Group by module
  const grouped = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  return grouped;
};

// Get all permissions by module
permissionSchema.statics.getByModule = function (module) {
  return this.find({ module, isActive: true }).sort({
    sortOrder: 1,
  });
};

// Find permission by key
permissionSchema.statics.findByKey = function (key) {
  return this.findOne({ key, isActive: true });
};

// Validate permission keys exist
permissionSchema.statics.validatePermissionKeys = async function (keys) {
  if (!keys || keys.length === 0) return true;

  const found = await this.find({
    key: { $in: keys },
    isActive: true,
  }).select('key');

  const foundKeys = found.map((p) => p.key);
  const invalidKeys = keys.filter((k) => !foundKeys.includes(k));

  return {
    valid: invalidKeys.length === 0,
    invalidKeys,
  };
};

// Get permissions with dependencies resolved
permissionSchema.statics.withDependencies = async function (permissionKeys) {
  if (!permissionKeys || permissionKeys.length === 0) return [];

  const perms = await this.find({
    key: { $in: permissionKeys },
    isActive: true,
  });

  // Collect all dependency keys
  const allKeys = new Set(permissionKeys);
  perms.forEach((perm) => {
    perm.dependencies.forEach((dep) => allKeys.add(dep));
  });

  return [...allKeys];
};

// ─── Create Model ─────────────────────────────
const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
