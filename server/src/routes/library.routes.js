// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LIBRARY ROUTES
// kat-school/server/src/routes/library.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const libraryController = require('../controllers/library.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  validate,
  validateMongoId,
  validatePagination,
} = require('../middleware/validate.middleware');
const {
  createBookCategorySchema,
  createBookSchema,
  updateBookSchema,
  registerLibraryMemberSchema,
  issueBookSchema,
  returnBookSchema,
  renewBookSchema,
  createReservationSchema,
} = require('../validators/library.validator');
const { uploadImage } = require('../utils/fileUpload.util');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');

router.use(protect);

const libRoles = ['super_admin', 'admin', 'librarian'];
const adminRoles = ['super_admin', 'admin'];

// ─── Dashboard ────────────────────────────────
router.get(
  '/dashboard',
  authorizeRoles(...libRoles, 'teacher', 'receptionist'),
  libraryController.getLibraryDashboard
);

// ─── Overdue Management ───────────────────────
router.post('/overdue/check', authorizeRoles(...libRoles), libraryController.checkOverdueBooks);
router.post(
  '/overdue/notify',
  authorizeRoles(...libRoles),
  libraryController.sendOverdueNotifications
);

// ═══════════════════════════════════════════
// BOOK CATEGORY ROUTES
// ═══════════════════════════════════════════
router.get('/categories', libraryController.getAllBookCategories);
router.post(
  '/categories',
  authorizeRoles(...libRoles),
  validate(createBookCategorySchema),
  libraryController.createBookCategory
);
router.patch(
  '/categories/:id',
  authorizeRoles(...libRoles),
  validateMongoId('id'),
  libraryController.updateBookCategory
);
router.delete(
  '/categories/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  libraryController.deleteBookCategory
);

// ═══════════════════════════════════════════
// BOOK ROUTES
// ═══════════════════════════════════════════
router.get('/books', libraryController.getAllBooks);
router.post(
  '/books',
  authorizeRoles(...libRoles),
  validate(createBookSchema),
  libraryController.addBook
);
router.get('/books/:id', validateMongoId('id'), libraryController.getBookById);
router.patch(
  '/books/:id',
  authorizeRoles(...libRoles),
  validateMongoId('id'),
  validate(updateBookSchema),
  libraryController.updateBook
);
router.delete(
  '/books/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  libraryController.deleteBook
);
router.post(
  '/books/:id/cover',
  authorizeRoles(...libRoles),
  validateMongoId('id'),
  uploadLimiter,
  uploadImage.single('cover'),
  libraryController.uploadBookCoverImage
);

// ═══════════════════════════════════════════
// LIBRARY MEMBER ROUTES
// ═══════════════════════════════════════════
router.get(
  '/members',
  authorizeRoles(...libRoles, 'receptionist'),
  validatePagination,
  libraryController.getAllMembers
);
router.post(
  '/members',
  authorizeRoles(...libRoles, 'receptionist'),
  validate(registerLibraryMemberSchema),
  libraryController.registerMember
);
router.get(
  '/members/by-membership/:membershipId',
  authorizeRoles(...libRoles, 'receptionist'),
  libraryController.getMemberByMembershipId
);
router.get(
  '/members/:id',
  authorizeRoles(...libRoles, 'receptionist', 'student', 'teacher'),
  validateMongoId('id'),
  libraryController.getMemberById
);
router.patch(
  '/members/:id',
  authorizeRoles(...libRoles),
  validateMongoId('id'),
  libraryController.updateMember
);
router.post(
  '/members/:id/suspend',
  authorizeRoles(...libRoles),
  validateMongoId('id'),
  libraryController.suspendMember
);
router.post(
  '/members/:id/reactivate',
  authorizeRoles(...libRoles),
  validateMongoId('id'),
  libraryController.reactivateMember
);

// ═══════════════════════════════════════════
// BOOK ISSUE ROUTES
// ═══════════════════════════════════════════
router.get(
  '/issues',
  authorizeRoles(...libRoles, 'receptionist'),
  validatePagination,
  libraryController.getAllIssues
);
router.post(
  '/issues',
  authorizeRoles(...libRoles, 'receptionist'),
  validate(issueBookSchema),
  libraryController.issueBook
);
router.get(
  '/issues/:id',
  authorizeRoles(...libRoles, 'receptionist', 'student', 'teacher'),
  validateMongoId('id'),
  libraryController.getIssueById
);
router.post(
  '/issues/:id/return',
  authorizeRoles(...libRoles, 'receptionist'),
  validateMongoId('id'),
  validate(returnBookSchema),
  libraryController.returnBook
);
router.post(
  '/issues/:id/renew',
  authorizeRoles(...libRoles, 'receptionist', 'student', 'teacher'),
  validateMongoId('id'),
  validate(renewBookSchema),
  libraryController.renewBook
);
router.post(
  '/issues/:id/pay-fine',
  authorizeRoles(...libRoles, 'receptionist'),
  validateMongoId('id'),
  libraryController.payFine
);

// ═══════════════════════════════════════════
// BOOK RESERVATION ROUTES
// ═══════════════════════════════════════════
router.get(
  '/reservations',
  authorizeRoles(...libRoles, 'receptionist'),
  validatePagination,
  libraryController.getAllReservations
);
router.post('/reservations', validate(createReservationSchema), libraryController.placeReservation);
router.post('/reservations/:id/cancel', validateMongoId('id'), libraryController.cancelReservation);

module.exports = router;
