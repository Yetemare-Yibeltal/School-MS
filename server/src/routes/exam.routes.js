// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXAM ROUTES
// kat-school/server/src/routes/exam.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const examController = require('../controllers/exam.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate, validateMongoId } = require('../middleware/validate.middleware');
const {
  createExamSchema,
  createExamResultSchema,
  bulkExamResultSchema,
} = require('../validators/academic.validator');

router.use(protect);

const adminRoles = ['super_admin', 'admin'];
const teacherRoles = ['super_admin', 'admin', 'teacher'];

// ─── Dashboard ────────────────────────────────
router.get(
  '/dashboard',
  authorizeRoles(...teacherRoles, 'receptionist'),
  examController.getExamDashboard
);

// ─── Exam Types ───────────────────────────────
router.get('/types', examController.getAllExamTypes);
router.post('/types', authorizeRoles(...adminRoles), examController.createExamType);
router.patch(
  '/types/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  examController.updateExamType
);
router.delete(
  '/types/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  examController.deleteExamType
);

// ─── Exams ────────────────────────────────────
router.get('/', authorizeRoles(...teacherRoles, 'student', 'parent'), examController.getAllExams);
router.post(
  '/',
  authorizeRoles(...teacherRoles),
  validate(createExamSchema),
  examController.createExam
);
router.get('/:id', validateMongoId('id'), examController.getExamById);
router.patch(
  '/:id',
  authorizeRoles(...teacherRoles),
  validateMongoId('id'),
  examController.updateExam
);
router.delete(
  '/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  examController.deleteExam
);
router.patch(
  '/:id/status',
  authorizeRoles(...teacherRoles),
  validateMongoId('id'),
  examController.updateExamStatus
);

// ─── Exam Results ─────────────────────────────
router.get(
  '/:examId/results',
  authorizeRoles(...teacherRoles, 'receptionist'),
  examController.getExamResults
);
router.post(
  '/results',
  authorizeRoles(...teacherRoles),
  validate(createExamResultSchema),
  examController.enterExamResult
);
router.post(
  '/results/bulk',
  authorizeRoles(...teacherRoles),
  validate(bulkExamResultSchema),
  examController.bulkEnterResults
);
router.post('/:examId/publish', authorizeRoles(...teacherRoles), examController.publishResults);

// ─── Student Results ──────────────────────────
router.get(
  '/student/:studentId/results',
  authorizeRoles(...teacherRoles, 'parent', 'student'),
  validateMongoId('studentId'),
  examController.getStudentResults
);

module.exports = router;
