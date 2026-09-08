// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ACADEMIC ROUTES
// kat-school/server/src/routes/academic.routes.js
// ============================================

'use strict';

const express = require('express');
const router = express.Router();

const academicController = require('../controllers/academic.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate, validateMongoId } = require('../middleware/validate.middleware');
const {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  createTermSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
  createRoomSchema,
  createTimetableSchema,
  createTimetableSlotSchema,
  createGradeScaleSchema,
} = require('../validators/academic.validator');

router.use(protect);

const adminRoles = ['super_admin', 'admin'];
const staffRoles = ['super_admin', 'admin', 'teacher', 'receptionist'];

// ─── Dashboard ────────────────────────────────
router.get('/dashboard', academicController.getAcademicDashboard);

// ═══════════════════════════════════════════
// ACADEMIC YEAR ROUTES
// ═══════════════════════════════════════════
router.get('/years/current', academicController.getCurrentAcademicYear);
router.get('/years', academicController.getAllAcademicYears);
router.post(
  '/years',
  authorizeRoles(...adminRoles),
  validate(createAcademicYearSchema),
  academicController.createAcademicYear
);
router.get('/years/:id', validateMongoId('id'), academicController.getAcademicYearById);
router.patch(
  '/years/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  validate(updateAcademicYearSchema),
  academicController.updateAcademicYear
);
router.delete(
  '/years/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.deleteAcademicYear
);

// ═══════════════════════════════════════════
// TERM ROUTES
// ═══════════════════════════════════════════
router.get('/terms/current', academicController.getCurrentTerm);
router.get('/terms', academicController.getAllTerms);
router.post(
  '/terms',
  authorizeRoles(...adminRoles),
  validate(createTermSchema),
  academicController.createTerm
);
router.get('/terms/:id', validateMongoId('id'), academicController.getTermById);
router.patch(
  '/terms/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.updateTerm
);
router.delete(
  '/terms/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.deleteTerm
);

// ═══════════════════════════════════════════
// CLASS ROUTES
// ═══════════════════════════════════════════
router.get('/classes', authorizeRoles(...staffRoles), academicController.getAllClasses);
router.post(
  '/classes',
  authorizeRoles(...adminRoles),
  validate(createClassSchema),
  academicController.createClass
);
router.get(
  '/classes/:id',
  authorizeRoles(...staffRoles),
  validateMongoId('id'),
  academicController.getClassById
);
router.patch(
  '/classes/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.updateClass
);
router.delete(
  '/classes/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.deleteClass
);

// ═══════════════════════════════════════════
// SECTION ROUTES
// ═══════════════════════════════════════════
router.get('/sections', authorizeRoles(...staffRoles), academicController.getAllSections);
router.post(
  '/sections',
  authorizeRoles(...adminRoles),
  validate(createSectionSchema),
  academicController.createSection
);
router.get(
  '/sections/:id',
  authorizeRoles(...staffRoles),
  validateMongoId('id'),
  academicController.getSectionById
);
router.patch(
  '/sections/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.updateSection
);
router.delete(
  '/sections/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.deleteSection
);

// ═══════════════════════════════════════════
// SUBJECT ROUTES
// ═══════════════════════════════════════════
router.get('/subjects', academicController.getAllSubjects);
router.post(
  '/subjects',
  authorizeRoles(...adminRoles),
  validate(createSubjectSchema),
  academicController.createSubject
);
router.get('/subjects/:id', validateMongoId('id'), academicController.getSubjectById);
router.patch(
  '/subjects/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.updateSubject
);
router.delete(
  '/subjects/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.deleteSubject
);

// ═══════════════════════════════════════════
// ROOM ROUTES
// ═══════════════════════════════════════════
router.get('/rooms', authorizeRoles(...staffRoles), academicController.getAllRooms);
router.post(
  '/rooms',
  authorizeRoles(...adminRoles),
  validate(createRoomSchema),
  academicController.createRoom
);
router.get(
  '/rooms/:id',
  authorizeRoles(...staffRoles),
  validateMongoId('id'),
  academicController.getRoomById
);
router.patch(
  '/rooms/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.updateRoom
);
router.delete(
  '/rooms/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.deleteRoom
);

// ═══════════════════════════════════════════
// TIMETABLE ROUTES
// ═══════════════════════════════════════════
router.get('/timetables', academicController.getAllTimetables);
router.post(
  '/timetables',
  authorizeRoles(...adminRoles),
  validate(createTimetableSchema),
  academicController.createTimetable
);
router.get('/timetables/:id', validateMongoId('id'), academicController.getTimetableById);
router.delete(
  '/timetables/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.deleteTimetable
);

// Timetable Slots
router.post(
  '/timetables/:id/slots',
  authorizeRoles(...adminRoles),
  validate(createTimetableSlotSchema, 'body'),
  academicController.createTimetableSlot
);
router.patch(
  '/timetables/:id/slots/:slotId',
  authorizeRoles(...adminRoles),
  academicController.updateTimetableSlot
);
router.delete(
  '/timetables/:id/slots/:slotId',
  authorizeRoles(...adminRoles),
  academicController.deleteTimetableSlot
);

// ═══════════════════════════════════════════
// GRADE SCALE ROUTES
// ═══════════════════════════════════════════
router.get('/grade-scales', academicController.getAllGradeScales);
router.get('/grade-scales/default', academicController.getDefaultGradeScale);
router.post(
  '/grade-scales',
  authorizeRoles(...adminRoles),
  validate(createGradeScaleSchema),
  academicController.createGradeScale
);
router.patch(
  '/grade-scales/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.updateGradeScale
);
router.delete(
  '/grade-scales/:id',
  authorizeRoles(...adminRoles),
  validateMongoId('id'),
  academicController.deleteGradeScale
);

module.exports = router;
