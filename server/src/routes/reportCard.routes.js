// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// REPORT CARD ROUTES
// kat-school/server/src/routes/reportCard.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const reportCardController = require('../controllers/reportCard.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validateMongoId } = require('../middleware/validate.middleware');

router.use(protect);

const adminRoles = ['super_admin', 'admin'];
const teacherRoles = ['super_admin', 'admin', 'teacher'];

// ─── Dashboard ────────────────────────────────
router.get(
  '/dashboard',
  authorizeRoles(...teacherRoles, 'receptionist'),
  reportCardController.getReportCardDashboard
);

// ─── Bulk Operations ──────────────────────────
router.post(
  '/bulk-generate',
  authorizeRoles(...teacherRoles),
  reportCardController.bulkGenerateReportCards
);

router.post(
  '/bulk-publish',
  authorizeRoles(...adminRoles),
  reportCardController.bulkPublishReportCards
);

// ─── Generate for a Student ───────────────────
router.post(
  '/generate/:studentId/:academicYearId/:termId',
  authorizeRoles(...teacherRoles),
  validateMongoId('studentId'),
  validateMongoId('academicYearId'),
  validateMongoId('termId'),
  reportCardController.generateReportCard
);

// ─── Get for a Student ────────────────────────
router.get(
  '/student/:studentId',
  authorizeRoles(...teacherRoles, 'parent', 'student', 'receptionist'),
  validateMongoId('studentId'),
  reportCardController.getStudentReportCards
);

router.get(
  '/student/:studentId/:academicYearId/:termId',
  authorizeRoles(...teacherRoles, 'parent', 'student', 'receptionist'),
  validateMongoId('studentId'),
  validateMongoId('academicYearId'),
  validateMongoId('termId'),
  reportCardController.getReportCard
);

// ─── Get for a Section ────────────────────────
router.get(
  '/section/:sectionId',
  authorizeRoles(...teacherRoles, 'receptionist'),
  reportCardController.getSectionReportCards
);

// ─── Individual Report Card ───────────────────
router.get('/:id', validateMongoId('id'), reportCardController.downloadReportCard);

router.patch(
  '/:id/comment',
  authorizeRoles(...teacherRoles),
  validateMongoId('id'),
  reportCardController.updateComment
);

router.patch(
  '/:id/publish',
  authorizeRoles(...teacherRoles),
  validateMongoId('id'),
  reportCardController.publishReportCard
);

module.exports = router;
