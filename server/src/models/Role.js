// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ROLE MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { ROLES, ALL_ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('../config/constants');

const roleSchema = new mongoose.Schema(
  {
    // ─── Role Identity ────────────────────────────
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, 'Role name must be at least 2 characters'],
      maxlength: [50, 'Role name cannot exceed 50 characters'],
      index: true,
    },

    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      minlength: [2, 'Display name must be at least 2 characters'],
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },

    // ─── Role Type ────────────────────────────────
    // System roles cannot be deleted or renamed
    isSystemRole: {
      type: Boolean,
      default: false,
    },

    // Whether this role is currently active
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Permissions ─────────────────────────────
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function (permissions) {
          const validPermissions = Object.values(PERMISSIONS);
          return permissions.every((perm) => validPermissions.includes(perm));
        },
        message: 'One or more invalid permissions provided',
      },
    },

    // ─── Role Hierarchy ───────────────────────────
    // Higher level = more authority
    // super_admin: 100, admin: 90, teacher: 50,
    // student: 10, parent: 10
    level: {
      type: Number,
      default: 10,
      min: [1, 'Level must be at least 1'],
      max: [100, 'Level cannot exceed 100'],
    },

    // ─── UI Settings ─────────────────────────────
    // Color used to display this role in the UI
    color: {
      type: String,
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
    },

    // Icon name (from lucide-react or heroicons)
    icon: {
      type: String,
      default: 'user',
      trim: true,
    },

    // ─── Dashboard Redirect ───────────────────────
    // Where to redirect after login for this role
    dashboardPath: {
      type: String,
      default: '/dashboard',
      trim: true,
    },

    // ─── Access Restrictions ──────────────────────
    // Restrict access to specific IP ranges
    allowedIPs: {
      type: [String],
      default: [],
    },

    // Maximum sessions allowed at once
    maxSessions: {
      type: Number,
      default: 5,
      min: [1, 'Max sessions must be at least 1'],
      max: [20, 'Max sessions cannot exceed 20'],
    },

    // Session timeout in minutes
    sessionTimeout: {
      type: Number,
      default: 60,
      min: [5, 'Session timeout must be at least 5 minutes'],
      max: [1440, 'Session timeout cannot exceed 24 hours'],
    },

    // ─── Audit ───────────────────────────────────
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

    // Number of users assigned to this role
    userCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────
roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ isSystemRole: 1, isActive: 1 });
roleSchema.index({ level: -1 });

// ─── Virtuals ─────────────────────────────────
// Total number of permissions
roleSchema.virtual('permissionCount').get(function () {
  return this.permissions.length;
});

// Whether this role has all permissions
roleSchema.virtual('isSuperRole').get(function () {
  const allPerms = Object.values(PERMISSIONS);
  return allPerms.every((perm) => this.permissions.includes(perm));
});

// ─── Pre-Save Hooks ───────────────────────────
// Ensure system roles always have correct permissions
roleSchema.pre('save', function (next) {
  // Normalize role name to lowercase
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase().replace(/\s+/g, '_');
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Initialize default system roles
// Called during database seeding
roleSchema.statics.initializeSystemRoles = async function () {
  const systemRoles = [
    {
      name: ROLES.SUPER_ADMIN,
      displayName: 'Super Admin',
      description: 'Full system access — cannot be modified',
      isSystemRole: true,
      isActive: true,
      permissions: Object.values(PERMISSIONS),
      level: 100,
      color: '#dc2626',
      icon: 'shield-check',
      dashboardPath: '/dashboard',
      maxSessions: 10,
      sessionTimeout: 120,
    },
    {
      name: ROLES.ADMIN,
      displayName: 'Administrator',
      description: 'School administrator — manages all school operations',
      isSystemRole: true,
      isActive: true,
      permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
      level: 90,
      color: '#4f46e5',
      icon: 'user-cog',
      dashboardPath: '/dashboard',
      maxSessions: 5,
      sessionTimeout: 120,
    },
    {
      name: ROLES.TEACHER,
      displayName: 'Teacher',
      description: 'Teaching staff — manages classes, marks, and attendance',
      isSystemRole: true,
      isActive: true,
      permissions: ROLE_PERMISSIONS[ROLES.TEACHER],
      level: 50,
      color: '#0891b2',
      icon: 'chalkboard-teacher',
      dashboardPath: '/dashboard',
      maxSessions: 3,
      sessionTimeout: 60,
    },
    {
      name: ROLES.STUDENT,
      displayName: 'Student',
      description: 'Enrolled student — views results, attendance, and fees',
      isSystemRole: true,
      isActive: true,
      permissions: ROLE_PERMISSIONS[ROLES.STUDENT],
      level: 10,
      color: '#16a34a',
      icon: 'user-graduate',
      dashboardPath: '/student/dashboard',
      maxSessions: 3,
      sessionTimeout: 60,
    },
    {
      name: ROLES.PARENT,
      displayName: 'Parent / Guardian',
      description: "Parent or guardian — monitors child's progress and fees",
      isSystemRole: true,
      isActive: true,
      permissions: ROLE_PERMISSIONS[ROLES.PARENT],
      level: 10,
      color: '#7c3aed',
      icon: 'users',
      dashboardPath: '/parent/dashboard',
      maxSessions: 3,
      sessionTimeout: 60,
    },
    {
      name: ROLES.LIBRARIAN,
      displayName: 'Librarian',
      description: 'Library staff — manages books and library members',
      isSystemRole: true,
      isActive: true,
      permissions: ROLE_PERMISSIONS[ROLES.LIBRARIAN],
      level: 30,
      color: '#b45309',
      icon: 'book-open',
      dashboardPath: '/dashboard',
      maxSessions: 2,
      sessionTimeout: 60,
    },
    {
      name: ROLES.ACCOUNTANT,
      displayName: 'Accountant',
      description: 'Finance staff — manages fees, income, and expenses',
      isSystemRole: true,
      isActive: true,
      permissions: ROLE_PERMISSIONS[ROLES.ACCOUNTANT],
      level: 40,
      color: '#047857',
      icon: 'calculator',
      dashboardPath: '/dashboard',
      maxSessions: 2,
      sessionTimeout: 60,
    },
    {
      name: ROLES.HR_MANAGER,
      displayName: 'HR Manager',
      description: 'HR staff — manages employees, leave, and payroll',
      isSystemRole: true,
      isActive: true,
      permissions: ROLE_PERMISSIONS[ROLES.HR_MANAGER],
      level: 40,
      color: '#be185d',
      icon: 'id-badge',
      dashboardPath: '/dashboard',
      maxSessions: 2,
      sessionTimeout: 60,
    },
    {
      name: ROLES.RECEPTIONIST,
      displayName: 'Receptionist',
      description: 'Front desk staff — manages student admissions and inquiries',
      isSystemRole: true,
      isActive: true,
      permissions: ROLE_PERMISSIONS[ROLES.RECEPTIONIST],
      level: 20,
      color: '#0369a1',
      icon: 'concierge-bell',
      dashboardPath: '/dashboard',
      maxSessions: 2,
      sessionTimeout: 60,
    },
  ];

  for (const roleData of systemRoles) {
    await this.findOneAndUpdate(
      { name: roleData.name },
      { $setOnInsert: roleData },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${systemRoles.length} system roles initialized`);
};

// Find role by name
roleSchema.statics.findByName = function (name) {
  return this.findOne({
    name: name.toLowerCase(),
    isActive: true,
  });
};

// Get all active roles
roleSchema.statics.getActiveRoles = function () {
  return this.find({ isActive: true }).sort({ level: -1 });
};

// Get roles with specific permission
roleSchema.statics.getRolesWithPermission = function (permission) {
  return this.find({
    permissions: permission,
    isActive: true,
  });
};

// Update user count for a role
roleSchema.statics.updateUserCount = async function (roleName) {
  const User = mongoose.model('User');
  const count = await User.countDocuments({
    role: roleName,
    isActive: true,
  });

  return this.findOneAndUpdate({ name: roleName }, { userCount: count }, { new: true });
};

// Check if a role has a specific permission
roleSchema.statics.hasPermission = async function (roleName, permission) {
  const role = await this.findOne({
    name: roleName.toLowerCase(),
    isActive: true,
  });

  if (!role) return false;
  return role.permissions.includes(permission);
};

// ─── Instance Methods ─────────────────────────

// Check if role has a specific permission
roleSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// Add permission to role
roleSchema.methods.addPermission = async function (permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
    await this.save();
  }
  return this;
};

// Remove permission from role
roleSchema.methods.removePermission = async function (permission) {
  this.permissions = this.permissions.filter((p) => p !== permission);
  await this.save();
  return this;
};

// Set all permissions at once
roleSchema.methods.setPermissions = async function (permissions) {
  const validPermissions = Object.values(PERMISSIONS);
  this.permissions = permissions.filter((p) => validPermissions.includes(p));
  await this.save();
  return this;
};

// ─── Create Model ─────────────────────────────
const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
