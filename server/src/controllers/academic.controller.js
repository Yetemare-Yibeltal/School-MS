// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ACADEMIC CONTROLLER
// kat-school/server/src/controllers/academic.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const Timetable = require('../models/Timetable');
const TimetableSlot = require('../models/TimetableSlot');
const GradeScale = require('../models/GradeScale');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Settings = require('../models/Settings');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const { buildSearchQuery } = require('../utils/pagination.util');

// ═══════════════════════════════════════════
// ACADEMIC YEAR
// ═══════════════════════════════════════════

exports.createAcademicYear = catchAsync(async (req, res) => {
  const { name, startDate, endDate, isCurrent, description } = req.body;

  const existing = await AcademicYear.findOne({ name });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'An academic year with this name already exists.',
    });
  }

  // If setting as current, deactivate others
  if (isCurrent) {
    await AcademicYear.updateMany({ isCurrent: true }, { isCurrent: false, status: 'completed' });
  }

  const academicYear = await AcademicYear.create({
    name,
    startDate,
    endDate,
    isCurrent: isCurrent || false,
    status: isCurrent ? 'active' : 'upcoming',
    description,
    createdBy: req.user._id,
  });

  // If setting as current, update system settings
  if (isCurrent) {
    await Settings.findOneAndUpdate(
      { key: 'system_settings' },
      {
        currentAcademicYear: academicYear._id,
        currentAcademicYearName: academicYear.name,
      }
    );
  }

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'academic_year',
    resourceId: academicYear._id,
    description: `Academic year created: ${name}`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Academic year created successfully.',
    data: { academicYear },
  });
});

exports.getAllAcademicYears = catchAsync(async (req, res) => {
  const academicYears = await AcademicYear.find().sort({ startDate: -1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Academic years fetched.',
    data: { academicYears },
  });
});

exports.getAcademicYearById = catchAsync(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id).populate('terms').lean();

  if (!academicYear) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Academic year fetched.',
    data: { academicYear },
  });
});

exports.updateAcademicYear = catchAsync(async (req, res) => {
  const { isCurrent } = req.body;

  if (isCurrent) {
    await AcademicYear.updateMany(
      { _id: { $ne: req.params.id }, isCurrent: true },
      { isCurrent: false, status: 'completed' }
    );
  }

  const academicYear = await AcademicYear.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!academicYear) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  if (isCurrent) {
    await Settings.findOneAndUpdate(
      { key: 'system_settings' },
      {
        currentAcademicYear: academicYear._id,
        currentAcademicYearName: academicYear.name,
      }
    );
  }

  await auditLog({
    req,
    action: 'UPDATE',
    resource: 'academic_year',
    resourceId: academicYear._id,
    description: `Academic year updated: ${academicYear.name}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Academic year updated.',
    data: { academicYear },
  });
});

exports.deleteAcademicYear = catchAsync(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id);

  if (!academicYear) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  if (academicYear.isCurrent) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot delete the current academic year.',
    });
  }

  await AcademicYear.findByIdAndDelete(req.params.id);

  await auditLog({
    req,
    action: 'DELETE',
    resource: 'academic_year',
    resourceId: req.params.id,
    description: `Academic year deleted: ${academicYear.name}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Academic year deleted.',
  });
});

exports.getCurrentAcademicYear = catchAsync(async (req, res) => {
  const academicYear = await AcademicYear.getCurrent();

  if (!academicYear) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'No active academic year found.',
    });
  }

  const terms = await Term.find({ academicYear: academicYear._id }).sort({ termNumber: 1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Current academic year fetched.',
    data: { academicYear: { ...academicYear.toObject(), terms } },
  });
});

// ═══════════════════════════════════════════
// TERM
// ═══════════════════════════════════════════

exports.createTerm = catchAsync(async (req, res) => {
  const { name, termNumber, academicYear, startDate, endDate, isCurrent, description } = req.body;

  const academicYearDoc = await AcademicYear.findById(academicYear);
  if (!academicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  const existing = await Term.findOne({ name, academicYear });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'A term with this name already exists in this academic year.',
    });
  }

  if (isCurrent) {
    await Term.updateMany({ academicYear, isCurrent: true }, { isCurrent: false });
  }

  const term = await Term.create({
    name,
    termNumber,
    academicYear,
    academicYearName: academicYearDoc.name,
    startDate,
    endDate,
    isCurrent: isCurrent || false,
    status: isCurrent ? 'active' : 'upcoming',
    description,
    createdBy: req.user._id,
  });

  if (isCurrent) {
    await Settings.findOneAndUpdate(
      { key: 'system_settings' },
      {
        currentTerm: term._id,
        currentTermName: term.name,
      }
    );
  }

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'term',
    resourceId: term._id,
    description: `Term created: ${name}`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Term created successfully.',
    data: { term },
  });
});

exports.getAllTerms = catchAsync(async (req, res) => {
  const { academicYear } = req.query;
  const filter = {};
  if (academicYear) filter.academicYear = academicYear;

  const terms = await Term.find(filter)
    .sort({ termNumber: 1 })
    .populate('academicYear', 'name')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Terms fetched.',
    data: { terms },
  });
});

exports.getTermById = catchAsync(async (req, res) => {
  const term = await Term.findById(req.params.id).populate('academicYear', 'name').lean();

  if (!term) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Term not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Term fetched.',
    data: { term },
  });
});

exports.updateTerm = catchAsync(async (req, res) => {
  if (req.body.isCurrent) {
    const term = await Term.findById(req.params.id);
    if (term) {
      await Term.updateMany(
        { academicYear: term.academicYear, _id: { $ne: req.params.id }, isCurrent: true },
        { isCurrent: false }
      );
    }
  }

  const term = await Term.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!term) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Term not found.',
    });
  }

  if (req.body.isCurrent) {
    await Settings.findOneAndUpdate(
      { key: 'system_settings' },
      { currentTerm: term._id, currentTermName: term.name }
    );
  }

  await auditLog({
    req,
    action: 'UPDATE',
    resource: 'term',
    resourceId: term._id,
    description: `Term updated: ${term.name}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Term updated.',
    data: { term },
  });
});

exports.deleteTerm = catchAsync(async (req, res) => {
  const term = await Term.findById(req.params.id);
  if (!term) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Term not found.',
    });
  }

  if (term.isCurrent) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot delete the current term.',
    });
  }

  await Term.findByIdAndDelete(req.params.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Term deleted.',
  });
});

exports.getCurrentTerm = catchAsync(async (req, res) => {
  const term = await Term.getCurrent();
  if (!term) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'No active term found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Current term fetched.',
    data: { term },
  });
});

// ═══════════════════════════════════════════
// CLASS
// ═══════════════════════════════════════════

exports.createClass = catchAsync(async (req, res) => {
  const { name, grade, academicYear, classTeacher, capacity, description } = req.body;

  const academicYearDoc = await AcademicYear.findById(academicYear);
  if (!academicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  const existing = await Class.findOne({ name, grade, academicYear });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'A class with this name already exists for this grade and year.',
    });
  }

  let classTeacherName = null;
  if (classTeacher) {
    const teacher = await Teacher.findById(classTeacher).select('firstName fatherName');
    if (teacher) {
      classTeacherName = `${teacher.firstName} ${teacher.fatherName}`;
    }
  }

  const classDoc = await Class.create({
    name,
    grade,
    academicYear,
    academicYearName: academicYearDoc.name,
    classTeacher: classTeacher || null,
    classTeacherName,
    capacity: capacity || 50,
    description,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'class',
    resourceId: classDoc._id,
    description: `Class created: ${name} (${grade})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Class created successfully.',
    data: { class: classDoc },
  });
});

exports.getAllClasses = catchAsync(async (req, res) => {
  const { grade, academicYear, search } = req.query;
  const filter = {};
  if (grade) filter.grade = grade;
  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['name', 'grade']));
  }

  const classes = await Class.find(filter)
    .sort({ grade: 1, name: 1 })
    .populate('classTeacher', 'firstName fatherName photo')
    .populate('academicYear', 'name')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Classes fetched.',
    data: { classes },
  });
});

exports.getClassById = catchAsync(async (req, res) => {
  const classDoc = await Class.findById(req.params.id)
    .populate('classTeacher', 'firstName fatherName photo primarySubject')
    .populate('sections')
    .populate('academicYear', 'name')
    .lean();

  if (!classDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Class not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Class fetched.',
    data: { class: classDoc },
  });
});

exports.updateClass = catchAsync(async (req, res) => {
  const classDoc = await Class.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!classDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Class not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Class updated.',
    data: { class: classDoc },
  });
});

exports.deleteClass = catchAsync(async (req, res) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Class not found.',
    });
  }

  const sectionsCount = await Section.countDocuments({ class: req.params.id });
  if (sectionsCount > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot delete class with ${sectionsCount} section(s). Delete sections first.`,
    });
  }

  await Class.findByIdAndDelete(req.params.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Class deleted.',
  });
});

// ═══════════════════════════════════════════
// SECTION
// ═══════════════════════════════════════════

exports.createSection = catchAsync(async (req, res) => {
  const { name, class: classId, grade, academicYear, classTeacher, capacity, room } = req.body;

  const [classDoc, academicYearDoc] = await Promise.all([
    Class.findById(classId),
    AcademicYear.findById(academicYear),
  ]);

  if (!classDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Class not found.',
    });
  }

  const existing = await Section.findOne({
    name: name.toUpperCase(),
    class: classId,
    academicYear,
  });

  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Section ${name} already exists in this class.`,
    });
  }

  let classTeacherName = null;
  if (classTeacher) {
    const teacher = await Teacher.findById(classTeacher).select('firstName fatherName');
    if (teacher) classTeacherName = `${teacher.firstName} ${teacher.fatherName}`;
  }

  const section = await Section.create({
    name: name.toUpperCase(),
    class: classId,
    className: classDoc.name,
    grade: grade || classDoc.grade,
    academicYear,
    academicYearName: academicYearDoc?.name || '',
    classTeacher: classTeacher || null,
    classTeacherName,
    capacity: capacity || 50,
    room: room || null,
    currentEnrollment: 0,
    createdBy: req.user._id,
  });

  // Link section to class
  await Class.findByIdAndUpdate(classId, {
    $addToSet: { sections: section._id },
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'section',
    resourceId: section._id,
    description: `Section created: ${grade} - Section ${name}`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Section created successfully.',
    data: { section },
  });
});

exports.getAllSections = catchAsync(async (req, res) => {
  const { grade, academicYear, classId, search } = req.query;
  const filter = {};
  if (grade) filter.grade = grade;
  if (classId) filter.class = classId;
  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['name', 'grade', 'classTeacherName']));
  }

  const sections = await Section.find(filter)
    .sort({ grade: 1, name: 1 })
    .populate('classTeacher', 'firstName fatherName photo primarySubject')
    .populate('room', 'name code')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Sections fetched.',
    data: { sections },
  });
});

exports.getSectionById = catchAsync(async (req, res) => {
  const section = await Section.findById(req.params.id)
    .populate('classTeacher', 'firstName fatherName photo primarySubject')
    .populate('room', 'name code capacity')
    .populate('class', 'name grade')
    .populate('academicYear', 'name')
    .lean();

  if (!section) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Section not found.',
    });
  }

  // Get students in this section
  const students = await Student.find({
    section: section._id,
    status: 'active',
  })
    .sort({ firstName: 1 })
    .select('firstName fatherName studentId gender photo rollNumber')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Section fetched.',
    data: { section, students },
  });
});

exports.updateSection = catchAsync(async (req, res) => {
  const section = await Section.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!section) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Section not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Section updated.',
    data: { section },
  });
});

exports.deleteSection = catchAsync(async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Section not found.',
    });
  }

  if (section.currentEnrollment > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot delete section with ${section.currentEnrollment} enrolled student(s).`,
    });
  }

  await Section.findByIdAndDelete(req.params.id);

  // Remove from class
  await Class.findByIdAndUpdate(section.class, {
    $pull: { sections: section._id },
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Section deleted.',
  });
});

// ═══════════════════════════════════════════
// SUBJECT
// ═══════════════════════════════════════════

exports.createSubject = catchAsync(async (req, res) => {
  const {
    name,
    code,
    grades,
    category,
    weeklyHours,
    periodsPerWeek,
    isCompulsory,
    passingScore,
    fullMarks,
    caMarks,
    examMarks,
    description,
  } = req.body;

  const existing = await Subject.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Subject with code ${code} already exists.`,
    });
  }

  const subject = await Subject.create({
    name,
    code: code.toUpperCase(),
    grades: grades || [],
    category,
    weeklyHours: weeklyHours || 5,
    periodsPerWeek: periodsPerWeek || 5,
    isCompulsory: isCompulsory !== false,
    passingScore: passingScore || 50,
    fullMarks: fullMarks || 100,
    caMarks: caMarks || 50,
    examMarks: examMarks || 50,
    creditHours: weeklyHours || 1,
    description,
    isActive: true,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'subject',
    resourceId: subject._id,
    description: `Subject created: ${name} (${code})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Subject created successfully.',
    data: { subject },
  });
});

exports.getAllSubjects = catchAsync(async (req, res) => {
  const { grade, category, isActive = true, search } = req.query;
  const filter = {};
  if (grade) filter.grades = grade;
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['name', 'code', 'category']));
  }

  const subjects = await Subject.find(filter).sort({ name: 1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Subjects fetched.',
    data: { subjects },
  });
});

exports.getSubjectById = catchAsync(async (req, res) => {
  const subject = await Subject.findById(req.params.id).lean();

  if (!subject) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Subject not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Subject fetched.',
    data: { subject },
  });
});

exports.updateSubject = catchAsync(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!subject) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Subject not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Subject updated.',
    data: { subject },
  });
});

exports.deleteSubject = catchAsync(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { isActive: false, updatedBy: req.user._id },
    { new: true }
  );

  if (!subject) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Subject not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Subject deactivated.',
  });
});

// ═══════════════════════════════════════════
// ROOM
// ═══════════════════════════════════════════

exports.createRoom = catchAsync(async (req, res) => {
  const { name, code, type, capacity, floor, building, facilities, description } = req.body;

  const existing = await Room.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Room with code ${code} already exists.`,
    });
  }

  const room = await Room.create({
    name,
    code: code.toUpperCase(),
    type,
    capacity,
    floor,
    building,
    facilities: facilities || [],
    description,
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Room created successfully.',
    data: { room },
  });
});

exports.getAllRooms = catchAsync(async (req, res) => {
  const { type, isActive = true, search } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['name', 'code', 'type', 'building']));
  }

  const rooms = await Room.find(filter).sort({ name: 1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Rooms fetched.',
    data: { rooms },
  });
});

exports.getRoomById = catchAsync(async (req, res) => {
  const room = await Room.findById(req.params.id).lean();
  if (!room) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Room not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Room fetched.',
    data: { room },
  });
});

exports.updateRoom = catchAsync(async (req, res) => {
  const room = await Room.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!room) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Room not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Room updated.',
    data: { room },
  });
});

exports.deleteRoom = catchAsync(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!room) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Room not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Room deactivated.',
  });
});

// ═══════════════════════════════════════════
// TIMETABLE
// ═══════════════════════════════════════════

exports.createTimetable = catchAsync(async (req, res) => {
  const { academicYear, term, grade, section, effectiveFrom, effectiveTo, description } = req.body;

  const [academicYearDoc, termDoc, sectionDoc] = await Promise.all([
    AcademicYear.findById(academicYear),
    Term.findById(term),
    Section.findById(section),
  ]);

  if (!academicYearDoc || !termDoc || !sectionDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year, term, or section not found.',
    });
  }

  const existing = await Timetable.findOne({
    academicYear,
    term,
    section,
    isActive: true,
  });

  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'An active timetable already exists for this section and term.',
    });
  }

  const timetable = await Timetable.create({
    academicYear,
    academicYearName: academicYearDoc.name,
    term,
    termName: termDoc.name,
    grade,
    section,
    sectionName: sectionDoc.name,
    effectiveFrom,
    effectiveTo,
    description,
    isActive: true,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'timetable',
    resourceId: timetable._id,
    description: `Timetable created for ${grade} - Section ${sectionDoc.name}`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Timetable created.',
    data: { timetable },
  });
});

exports.getAllTimetables = catchAsync(async (req, res) => {
  const { academicYear, term, grade, section } = req.query;
  const filter = {};
  if (academicYear) filter.academicYear = academicYear;
  if (term) filter.term = term;
  if (grade) filter.grade = grade;
  if (section) filter.section = section;

  const timetables = await Timetable.find(filter)
    .sort({ grade: 1, sectionName: 1 })
    .populate('section', 'name grade')
    .populate('academicYear', 'name')
    .populate('term', 'name termNumber')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Timetables fetched.',
    data: { timetables },
  });
});

exports.getTimetableById = catchAsync(async (req, res) => {
  const timetable = await Timetable.findById(req.params.id)
    .populate('section', 'name grade classTeacher')
    .populate('academicYear', 'name')
    .populate('term', 'name termNumber')
    .lean();

  if (!timetable) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Timetable not found.',
    });
  }

  // Get all slots for this timetable
  const slots = await TimetableSlot.find({
    timetable: timetable._id,
    isActive: true,
  })
    .sort({ dayOfWeek: 1, periodNumber: 1 })
    .populate('subject', 'name code color')
    .populate('teacher', 'firstName fatherName photo')
    .populate('room', 'name code')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Timetable fetched.',
    data: { timetable, slots },
  });
});

exports.createTimetableSlot = catchAsync(async (req, res) => {
  const {
    timetable,
    dayOfWeek,
    periodNumber,
    startTime,
    endTime,
    subject,
    teacher,
    room,
    slotType,
  } = req.body;

  // Check for teacher conflict
  const teacherConflict = await TimetableSlot.findOne({
    timetable,
    dayOfWeek,
    periodNumber,
    teacher,
    isActive: true,
  });

  if (teacherConflict) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Teacher is already assigned to another class during this period.',
    });
  }

  // Check for room conflict
  if (room) {
    const roomConflict = await TimetableSlot.findOne({
      dayOfWeek,
      periodNumber,
      room,
      isActive: true,
    });

    if (roomConflict) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Room is already occupied during this period.',
      });
    }
  }

  const timetableDoc = await Timetable.findById(timetable);
  if (!timetableDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Timetable not found.',
    });
  }

  const [subjectDoc, teacherDoc, roomDoc] = await Promise.all([
    Subject.findById(subject).select('name code'),
    Teacher.findById(teacher).select('firstName fatherName'),
    room ? Room.findById(room).select('name code') : Promise.resolve(null),
  ]);

  const slot = await TimetableSlot.create({
    timetable,
    dayOfWeek,
    periodNumber,
    startTime,
    endTime,
    subject,
    subjectName: subjectDoc?.name,
    subjectCode: subjectDoc?.code,
    teacher,
    teacherName: teacherDoc ? `${teacherDoc.firstName} ${teacherDoc.fatherName}` : null,
    room: room || null,
    roomName: roomDoc?.name || null,
    slotType: slotType || 'Regular',
    grade: timetableDoc.grade,
    section: timetableDoc.section,
    sectionName: timetableDoc.sectionName,
    academicYear: timetableDoc.academicYear,
    term: timetableDoc.term,
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Timetable slot created.',
    data: { slot },
  });
});

exports.updateTimetableSlot = catchAsync(async (req, res) => {
  const slot = await TimetableSlot.findByIdAndUpdate(
    req.params.slotId,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!slot) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Timetable slot not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Timetable slot updated.',
    data: { slot },
  });
});

exports.deleteTimetableSlot = catchAsync(async (req, res) => {
  await TimetableSlot.findByIdAndUpdate(req.params.slotId, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Timetable slot removed.',
  });
});

exports.deleteTimetable = catchAsync(async (req, res) => {
  const timetable = await Timetable.findById(req.params.id);
  if (!timetable) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Timetable not found.',
    });
  }

  await Promise.all([
    Timetable.findByIdAndDelete(req.params.id),
    TimetableSlot.updateMany({ timetable: req.params.id }, { isActive: false }),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Timetable deleted.',
  });
});

// ═══════════════════════════════════════════
// GRADE SCALE
// ═══════════════════════════════════════════

exports.createGradeScale = catchAsync(async (req, res) => {
  const { name, grades, isDefault } = req.body;

  if (isDefault) {
    await GradeScale.updateMany({ isDefault: true }, { isDefault: false });
  }

  const gradeScale = await GradeScale.create({
    name,
    grades,
    isDefault: isDefault || false,
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Grade scale created.',
    data: { gradeScale },
  });
});

exports.getAllGradeScales = catchAsync(async (req, res) => {
  const gradeScales = await GradeScale.find({ isActive: true }).sort({ name: 1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Grade scales fetched.',
    data: { gradeScales },
  });
});

exports.getDefaultGradeScale = catchAsync(async (req, res) => {
  const gradeScale = await GradeScale.findOne({
    isDefault: true,
    isActive: true,
  }).lean();

  if (!gradeScale) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'No default grade scale found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Default grade scale fetched.',
    data: { gradeScale },
  });
});

exports.updateGradeScale = catchAsync(async (req, res) => {
  if (req.body.isDefault) {
    await GradeScale.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
  }

  const gradeScale = await GradeScale.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!gradeScale) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Grade scale not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Grade scale updated.',
    data: { gradeScale },
  });
});

exports.deleteGradeScale = catchAsync(async (req, res) => {
  const gradeScale = await GradeScale.findById(req.params.id);
  if (!gradeScale) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Grade scale not found.',
    });
  }

  if (gradeScale.isDefault) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot delete the default grade scale.',
    });
  }

  await GradeScale.findByIdAndUpdate(req.params.id, { isActive: false });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Grade scale deactivated.',
  });
});

// ═══════════════════════════════════════════
// ACADEMIC DASHBOARD
// ═══════════════════════════════════════════

exports.getAcademicDashboard = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();
  const currentTerm = await Term.getCurrent();

  const [
    totalClasses,
    totalSections,
    totalSubjects,
    totalRooms,
    totalStudents,
    totalTeachers,
    sectionsByGrade,
  ] = await Promise.all([
    Class.countDocuments({ academicYear: currentYear?._id }),
    Section.countDocuments({ academicYear: currentYear?._id }),
    Subject.countDocuments({ isActive: true }),
    Room.countDocuments({ isActive: true }),
    Student.countDocuments({
      academicYear: currentYear?._id,
      status: 'active',
    }),
    Teacher.countDocuments({ status: 'active' }),
    Section.aggregate([
      { $match: { academicYear: currentYear?._id } },
      {
        $group: {
          _id: '$grade',
          sections: { $sum: 1 },
          students: { $sum: '$currentEnrollment' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Academic dashboard fetched.',
    data: {
      currentAcademicYear: currentYear,
      currentTerm,
      totalClasses,
      totalSections,
      totalSubjects,
      totalRooms,
      totalStudents,
      totalTeachers,
      sectionsByGrade,
    },
  });
});
