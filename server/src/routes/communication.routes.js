// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// COMMUNICATION ROUTES
// kat-school/server/src/routes/communication.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const commController = require('../controllers/communication.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  validate,
  validateMongoId,
  validatePagination,
} = require('../middleware/validate.middleware');
const { uploadDocument_ } = require('../utils/fileUpload.util');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');

router.use(protect);

const adminRoles = ['super_admin', 'admin'];
const staffRoles = [
  'super_admin',
  'admin',
  'teacher',
  'receptionist',
  'librarian',
  'accountant',
  'hr_manager',
];

// ═══════════════════════════════════════════
// NOTICE ROUTES
// ═══════════════════════════════════════════
router.get(
  '/notices/dashboard',
  authorizeRoles(...adminRoles, 'teacher', 'receptionist'),
  commController.getNoticeDashboard
);
router.get('/notices/published', commController.getPublishedNotices);
router.get(
  '/notices',
  authorizeRoles(...staffRoles),
  validatePagination,
  commController.getAllNotices
);
router.post('/notices', authorizeRoles(...adminRoles, 'teacher'), commController.createNotice);
router.get('/notices/:id', validateMongoId('id'), commController.getNoticeById);
router.patch(
  '/notices/:id',
  authorizeRoles(...adminRoles, 'teacher'),
  validateMongoId('id'),
  commController.updateNotice
);
router.delete(
  '/notices/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  commController.deleteNotice
);
router.post(
  '/notices/:id/publish',
  authorizeRoles(...adminRoles, 'teacher'),
  validateMongoId('id'),
  commController.publishNotice
);
router.post(
  '/notices/:id/recall',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  commController.recallNotice
);
router.post(
  '/notices/:id/pin',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  commController.pinNotice
);
router.post(
  '/notices/:id/unpin',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  commController.unpinNotice
);

// ═══════════════════════════════════════════
// EVENT ROUTES
// ═══════════════════════════════════════════
router.get(
  '/events/dashboard',
  authorizeRoles(...adminRoles, 'teacher', 'receptionist'),
  commController.getEventDashboard
);
router.get('/events/calendar', commController.getCalendar);
router.get('/events', commController.getAllEvents);
router.post('/events', authorizeRoles(...adminRoles, 'teacher'), commController.createEvent);
router.get('/events/:id', validateMongoId('id'), commController.getEventById);
router.patch(
  '/events/:id',
  authorizeRoles(...adminRoles, 'teacher'),
  validateMongoId('id'),
  commController.updateEvent
);
router.delete(
  '/events/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  commController.deleteEvent
);
router.post(
  '/events/:id/publish',
  authorizeRoles(...adminRoles, 'teacher'),
  validateMongoId('id'),
  commController.publishEvent
);
router.post('/events/:id/register', commController.registerForEvent);

// ═══════════════════════════════════════════
// MESSAGING ROUTES
// ═══════════════════════════════════════════
router.get('/messages/inbox', commController.getInbox);
router.post('/messages/send', commController.sendMessage);
router.get('/messages/search', commController.searchThreads);
router.get(
  '/messages/thread/:threadId',
  validateMongoId('threadId'),
  commController.getThreadMessages
);
router.post(
  '/messages/thread/:threadId/reply',
  validateMongoId('threadId'),
  commController.replyToThread
);
router.delete('/messages/:messageId', validateMongoId('messageId'), commController.deleteMessage);

// ═══════════════════════════════════════════
// NOTIFICATION ROUTES
// ═══════════════════════════════════════════
router.get('/notifications', commController.getNotifications);
router.post('/notifications/mark-all-read', commController.markAllNotificationsRead);
router.post('/notifications/clear-all', commController.clearAllNotifications);
router.patch('/notifications/:id/read', validateMongoId('id'), commController.markNotificationRead);
router.delete('/notifications/:id', validateMongoId('id'), commController.deleteNotification);

// ═══════════════════════════════════════════
// DOCUMENT ROUTES
// ═══════════════════════════════════════════
router.get(
  '/documents',
  authorizeRoles(...adminRoles, 'receptionist', 'hr_manager'),
  validatePagination,
  commController.getDocuments
);
router.post(
  '/documents',
  uploadLimiter,
  uploadDocument_.single('document'),
  commController.uploadDocument
);
router.post(
  '/documents/:id/verify',
  authorizeRoles(...adminRoles, 'receptionist', 'hr_manager'),
  validateMongoId('id'),
  commController.verifyDocument
);
router.post(
  '/documents/:id/reject',
  authorizeRoles(...adminRoles, 'receptionist', 'hr_manager'),
  validateMongoId('id'),
  commController.rejectDocument
);
router.delete(
  '/documents/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  commController.deleteDocument
);

// ═══════════════════════════════════════════
// SUSPENSION ROUTES
// ═══════════════════════════════════════════
router.get(
  '/suspensions/dashboard',
  authorizeRoles(...adminRoles, 'teacher'),
  commController.getSuspensionDashboard
);
router.get(
  '/suspensions',
  authorizeRoles(...adminRoles, 'teacher', 'receptionist'),
  validatePagination,
  commController.getAllSuspensions
);
router.post(
  '/suspensions',
  authorizeRoles(...adminRoles, 'teacher'),
  commController.createSuspension
);
router.get(
  '/suspensions/:id',
  authorizeRoles(...adminRoles, 'teacher'),
  validateMongoId('id'),
  commController.getSuspensionById
);
router.post(
  '/suspensions/:id/approve',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  commController.approveSuspension
);
router.post(
  '/suspensions/:id/reinstate',
  authorizeRoles(...adminRoles, 'teacher'),
  validateMongoId('id'),
  commController.reinstateSuspension
);

module.exports = router;
