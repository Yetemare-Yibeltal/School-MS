// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// AUDIT MIDDLEWARE
// kat-school/server/src/middleware/audit.middleware.js
// ============================================

'use strict';

const AuditLog = require('../models/AuditLog');
const { AUDIT_ACTIONS } = require('../config/constants');

// ─── Auto Audit Middleware ────────────────────
// Automatically logs API requests to audit log
const autoAudit = (options = {}) => {
  return async (req, res, next) => {
    // Skip GET requests unless explicitly requested
    if (req.method === 'GET' && !options.logGET) {
      return next();
    }

    // Skip health check endpoint
    if (req.path === '/api/health') {
      return next();
    }

    // Capture original response methods
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    let responseBody = null;
    let statusCode = null;

    // Intercept response
    res.json = function (data) {
      responseBody = data;
      statusCode = res.statusCode;
      return originalJson(data);
    };

    res.send = function (data) {
      if (!responseBody) {
        try {
          responseBody = typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
          responseBody = null;
        }
      }
      statusCode = res.statusCode;
      return originalSend(data);
    };

    // After response is sent
    res.on('finish', async () => {
      try {
        const method = req.method;
        const isSuccess = statusCode >= 200 && statusCode < 400;

        // Map HTTP method to audit action
        const actionMap = {
          POST: AUDIT_ACTIONS.CREATE,
          PUT: AUDIT_ACTIONS.UPDATE,
          PATCH: AUDIT_ACTIONS.UPDATE,
          DELETE: AUDIT_ACTIONS.DELETE,
          GET: AUDIT_ACTIONS.VIEW,
        };

        const action = options.action || actionMap[method] || 'SYSTEM_ACTION';

        // Determine resource from path
        const pathParts = req.path.split('/').filter(Boolean);
        const resource = options.resource || pathParts[1] || 'system';

        // Get resource ID from params
        const resourceId =
          req.params?.id ||
          req.params?.studentId ||
          req.params?.teacherId ||
          req.params?.employeeId ||
          null;

        // Only log if important or failed
        const shouldLog = method !== 'GET' || !isSuccess || options.forceLog;

        if (!shouldLog) return;

        await AuditLog.log({
          user: req.user?._id || null,
          action,
          resource,
          resourceId,
          description: options.description || `${method} ${req.path}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers?.['user-agent'],
          method,
          endpoint: req.originalUrl,
          status: isSuccess ? 'success' : 'failure',
          statusCode: statusCode || 500,
          errorMessage: isSuccess ? null : responseBody?.message || null,
          severity: isSuccess ? 'low' : 'medium',
          metadata: options.includeBody
            ? {
                body: req.body,
                query: req.query,
              }
            : null,
        });
      } catch (error) {
        // Audit logging should never crash the app
        console.error('❌ Audit middleware error:', error.message);
      }
    });

    next();
  };
};

// ─── Manual Audit Logger ──────────────────────
// Used inside controllers for specific events
const auditLog = async ({
  req,
  action,
  resource,
  resourceId = null,
  resourceName = null,
  description,
  previousValues = null,
  newValues = null,
  changedFields = [],
  severity = 'low',
  metadata = null,
}) => {
  try {
    await AuditLog.log({
      user: req?.user?._id || null,
      action,
      resource,
      resourceId,
      resourceName,
      description,
      previousValues,
      newValues,
      changedFields,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.headers?.['user-agent'] || null,
      method: req?.method || 'SYSTEM',
      endpoint: req?.originalUrl || null,
      status: 'success',
      severity,
      metadata,
    });
  } catch (error) {
    console.error('❌ Manual audit log error:', error.message);
  }
};

// ─── Audit Create ─────────────────────────────
const auditCreate = (resource) => {
  return async (req, res, next) => {
    req._auditResource = resource;
    req._auditAction = AUDIT_ACTIONS.CREATE;
    next();
  };
};

// ─── Audit Update ─────────────────────────────
const auditUpdate = (resource) => {
  return async (req, res, next) => {
    req._auditResource = resource;
    req._auditAction = AUDIT_ACTIONS.UPDATE;
    next();
  };
};

// ─── Audit Delete ─────────────────────────────
const auditDelete = (resource) => {
  return async (req, res, next) => {
    req._auditResource = resource;
    req._auditAction = AUDIT_ACTIONS.DELETE;
    next();
  };
};

// ─── Sensitive Operation Audit ────────────────
// Forces audit logging with high severity
const auditSensitive = (resource, action, description) => {
  return autoAudit({
    resource,
    action,
    description,
    severity: 'high',
    forceLog: true,
    includeBody: false,
  });
};

// ─── Financial Audit ──────────────────────────
const auditFinancial = autoAudit({
  resource: 'finance',
  severity: 'high',
  forceLog: true,
});

// ─── Settings Change Audit ────────────────────
const auditSettings = autoAudit({
  resource: 'settings',
  action: AUDIT_ACTIONS.CHANGE_SETTINGS,
  severity: 'high',
  forceLog: true,
});

// ─── Export Audit ─────────────────────────────
const auditExport = (resource) => {
  return autoAudit({
    resource,
    action: AUDIT_ACTIONS.EXPORT,
    severity: 'medium',
    forceLog: true,
  });
};

module.exports = {
  autoAudit,
  auditLog,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditSensitive,
  auditFinancial,
  auditSettings,
  auditExport,
};
