// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ROLE & PERMISSION MIDDLEWARE
// kat-school/server/src/middleware/role.middleware.js
// ============================================

'use strict';

const { ROLE_PERMISSIONS, ROLES, HTTP_STATUS } = require('../config/constants');

// ─── Authorize Roles ──────────────────────────
// Restricts route to specific roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
        code: 'NOT_AUTHENTICATED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE',
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
};

// ─── Authorize Permissions ────────────────────
// Checks if user has specific permission
const authorizePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      const userRole = req.user.role;

      // Super admin has all permissions
      if (userRole === ROLES.SUPER_ADMIN) {
        return next();
      }

      // Get role permissions from constants
      const rolePerms = ROLE_PERMISSIONS[userRole] || [];

      // Check custom permissions on user
      const customPerms = req.user.customPermissions || [];
      const deniedPerms = req.user.deniedPermissions || [];

      // Combine role + custom permissions
      const allPerms = [...new Set([...rolePerms, ...customPerms])].filter(
        (p) => !deniedPerms.includes(p)
      );

      if (!allPerms.includes(requiredPermission)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `Access denied. Missing permission: ${requiredPermission}`,
          code: 'INSUFFICIENT_PERMISSION',
          required: requiredPermission,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Permission check failed.',
      });
    }
  };
};

// ─── Authorize Multiple Permissions ──────────
// User must have ALL listed permissions
const authorizeAllPermissions = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      if (req.user.role === ROLES.SUPER_ADMIN) {
        return next();
      }

      const rolePerms = ROLE_PERMISSIONS[req.user.role] || [];
      const customPerms = req.user.customPermissions || [];
      const deniedPerms = req.user.deniedPermissions || [];

      const allPerms = [...new Set([...rolePerms, ...customPerms])].filter(
        (p) => !deniedPerms.includes(p)
      );

      const missing = permissions.filter((p) => !allPerms.includes(p));

      if (missing.length > 0) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `Missing permissions: ${missing.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          missing,
        });
      }

      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Permission check failed.',
      });
    }
  };
};

// ─── Authorize Any Permission ─────────────────
// User must have AT LEAST ONE of the listed permissions
const authorizeAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      if (req.user.role === ROLES.SUPER_ADMIN) {
        return next();
      }

      const rolePerms = ROLE_PERMISSIONS[req.user.role] || [];
      const customPerms = req.user.customPermissions || [];
      const deniedPerms = req.user.deniedPermissions || [];

      const allPerms = [...new Set([...rolePerms, ...customPerms])].filter(
        (p) => !deniedPerms.includes(p)
      );

      const hasAny = permissions.some((p) => allPerms.includes(p));

      if (!hasAny) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `Access denied. Required one of: ${permissions.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Permission check failed.',
      });
    }
  };
};

// ─── Admin Only ───────────────────────────────
const adminOnly = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN);

// ─── Staff Only ───────────────────────────────
const staffOnly = authorizeRoles(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.TEACHER,
  ROLES.LIBRARIAN,
  ROLES.ACCOUNTANT,
  ROLES.HR_MANAGER,
  ROLES.RECEPTIONIST
);

// ─── Teacher or Admin ─────────────────────────
const teacherOrAdmin = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER);

// ─── Finance Staff ────────────────────────────
const financeStaff = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT);

// ─── HR Staff ─────────────────────────────────
const hrStaff = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER);

// ─── Library Staff ────────────────────────────
const libraryStaff = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.LIBRARIAN);

// ─── Check Own Resource ───────────────────────
// Ensures user can only access their own resource
// unless they are admin/teacher
const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Admins can access any resource
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(req.user.role)) {
      return next();
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        code: 'NOT_OWNER',
      });
    }

    next();
  };
};

// ─── Check Student Access ─────────────────────
// Ensures teacher/parent can only access their own students
const checkStudentAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const role = req.user.role;

    // Admins and teachers see all students
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.RECEPTIONIST].includes(role)) {
      return next();
    }

    // Parents can only see their own children
    if (role === ROLES.PARENT) {
      const Guardian = require('../models/Guardian');
      const studentId = req.params.studentId || req.params.id;

      if (!studentId) return next();

      const guardian = await Guardian.findOne({
        user: req.user._id,
        'students.student': studentId,
        'students.canAccess': true,
      });

      if (!guardian) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Access denied. You can only view your own children.',
          code: 'NOT_GUARDIAN',
        });
      }

      req.isGuardianAccess = true;
    }

    // Students can only see their own data
    if (role === ROLES.STUDENT) {
      const studentId = req.params.studentId || req.params.id;

      if (studentId) {
        const Student = require('../models/Student');
        const student = await Student.findOne({
          _id: studentId,
          user: req.user._id,
        });

        if (!student) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'Access denied.',
            code: 'NOT_OWN_STUDENT',
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Student access check error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Access check failed.',
    });
  }
};

module.exports = {
  authorizeRoles,
  authorizePermission,
  authorizeAllPermissions,
  authorizeAnyPermission,
  adminOnly,
  staffOnly,
  teacherOrAdmin,
  financeStaff,
  hrStaff,
  libraryStaff,
  checkOwnership,
  checkStudentAccess,
};

