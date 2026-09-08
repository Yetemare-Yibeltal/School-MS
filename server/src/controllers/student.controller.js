// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// STUDENT CONTROLLER
// kat-school/server/src/controllers/student.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Guardian = require('../models/Guardian');
const User = require('../models/User');
const AcademicYear = require('../models/AcademicYear');
const Section = require('../models/Section');
const Attendance = require('../models/Attendance');
const ExamResult = require('../models/ExamResult');
const FeeAssignment = require('../models/FeeAssignment');
const Suspension = require('../models/Suspension');
const LibraryMember = require('../models/LibraryMember');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const {
  generateStudentId,
  generateAdmissionNumber,
  generateSecureToken,
} = require('../utils/generateId.util');
const { uploadProfilePhoto } = require('../utils/fileUpload.util');
const { sendWelcomeEmail } = require('../utils/email.util');
const { paginate, buildSearchQuery, buildDateRangeFilter } = require('../utils/pagination.util');

// ─── Create Student ───────────────────────────
exports.createStudent = catchAsync(async (req, res) => {
  const {
    firstName,
    fatherName,
    grandFatherName,
    firstNameAmharic,
    fatherNameAmharic,
    grandFatherNameAmharic,
    gender,
    dateOfBirth,
    nationality,
    religion,
    bloodGroup,
    grade,
    section,
    academicYear,
    admissionDate,
    admissionType,
    previousSchool,
    previousGrade,
    address,
    phone,
    email,
    medicalInfo,
    primaryGuardian,
    notes,
  } = req.body;

  // Get active academic year if not provided
  let academicYearId = academicYear;
  let academicYearDoc;

  if (!academicYearId) {
    academicYearDoc = await AcademicYear.getCurrent();
    if (!academicYearDoc) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No active academic year. Please set an academic year first.',
      });
    }
    academicYearId = academicYearDoc._id;
  } else {
    academicYearDoc = await AcademicYear.findById(academicYearId);
    if (!academicYearDoc) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Academic year not found.',
      });
    }
  }

  // Find section
  let sectionDoc = null;
  if (section) {
    sectionDoc = await Section.findById(section);
    if (!sectionDoc) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Section not found.',
      });
    }

    // Check section capacity
    if (sectionDoc.currentEnrollment >= sectionDoc.capacity) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Section ${sectionDoc.name} is at full capacity (${sectionDoc.capacity} students).`,
      });
    }
  }

  // Generate IDs
  const studentId = await generateStudentId(grade, academicYearId);
  const admissionNumber = await generateAdmissionNumber();

  // Create student record
  const student = await Student.create({
    firstName,
    fatherName,
    grandFatherName,
    firstNameAmharic,
    fatherNameAmharic,
    grandFatherNameAmharic,
    gender,
    dateOfBirth,
    nationality: nationality || 'Ethiopian',
    religion,
    bloodGroup,
    studentId,
    admissionNumber,
    grade,
    section: sectionDoc?._id || null,
    sectionName: sectionDoc?.name || null,
    academicYear: academicYearId,
    academicYearName: academicYearDoc.name,
    admissionDate: admissionDate || new Date(),
    admissionType: admissionType || 'New',
    previousSchool,
    previousGrade,
    address,
    phone,
    email,
    medicalInfo,
    notes,
    status: 'active',
    createdBy: req.user._id,
  });

  // Create guardian record
  let guardian = null;
  if (primaryGuardian) {
    // Check if user account already exists for guardian
    let guardianUser = await User.findOne({
      phone: primaryGuardian.phone,
    });

    if (!guardianUser) {
      // Create user account for guardian
      const tempPassword = generateSecureToken(8);
      guardianUser = await User.create({
        firstName: primaryGuardian.name.split(' ')[0],
        fatherName: primaryGuardian.name.split(' ')[1] || 'Guardian',
        phone: primaryGuardian.phone,
        email: primaryGuardian.email || undefined,
        role: 'parent',
        gender: 'Male',
        password: tempPassword,
        isTemporaryPassword: true,
        isActive: true,
        createdBy: req.user._id,
      });

      if (primaryGuardian.email) {
        try {
          await sendWelcomeEmail(guardianUser, tempPassword);
        } catch (err) {
          console.error('Guardian welcome email failed:', err.message);
        }
      }
    }

    guardian = await Guardian.create({
      firstName: primaryGuardian.name.split(' ')[0],
      fatherName: primaryGuardian.name.split(' ')[1] || '',
      relationship: primaryGuardian.relationship,
      phone: primaryGuardian.phone,
      alternatePhone: primaryGuardian.alternatePhone,
      email: primaryGuardian.email,
      occupation: primaryGuardian.occupation,
      address: primaryGuardian.address,
      user: guardianUser._id,
      students: [
        {
          student: student._id,
          studentName: `${firstName} ${fatherName}`,
          studentId: studentId,
          grade,
          relationship: primaryGuardian.relationship,
          isPrimary: true,
          canAccess: true,
        },
      ],
      createdBy: req.user._id,
    });

    // Link guardian to student
    student.guardians = [
      {
        guardian: guardian._id,
        guardianName: primaryGuardian.name,
        relationship: primaryGuardian.relationship,
        phone: primaryGuardian.phone,
        isPrimary: true,
        canPickup: true,
      },
    ];
    await student.save();
  }

  // Update section enrollment
  if (sectionDoc) {
    await Section.findByIdAndUpdate(sectionDoc._id, {
      $inc: { currentEnrollment: 1 },
      $addToSet: { students: student._id },
    });
  }

  // Auto-register as library member
  await LibraryMember.registerMember({
    memberType: 'student',
    memberId: studentId,
    memberName: `${firstName} ${fatherName}`,
    studentId: student._id,
    grade,
    section: sectionDoc?.name,
    photo: null,
    academicYearId,
    academicYearName: academicYearDoc.name,
    registeredBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'student',
    resourceId: student._id,
    description: `Student created: ${firstName} ${fatherName} (${studentId})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Student created successfully.',
    data: {
      student: {
        ...student.toObject(),
        guardian,
      },
    },
  });
});

// ─── Get All Students ─────────────────────────
exports.getAllStudents = catchAsync(async (req, res) => {
  const {
    grade,
    section,
    gender,
    status = 'active',
    academicYear,
    search,
    page = 1,
    limit = 20,
    sort = 'firstName',
    order = 'asc',
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  if (grade) filter.grade = grade;
  if (section) filter.section = section;
  if (gender) filter.gender = gender;
  if (status) filter.status = status;

  // Academic year filter
  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  // Date range filter (admission date)
  if (startDate || endDate) {
    const dateFilter = buildDateRangeFilter(startDate, endDate, 'admissionDate');
    Object.assign(filter, dateFilter);
  }

  // Search filter
  if (search) {
    const searchQ = buildSearchQuery(search, [
      'firstName',
      'fatherName',
      'grandFatherName',
      'studentId',
      'admissionNumber',
      'phone',
      'email',
    ]);
    Object.assign(filter, searchQ);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [students, total] = await Promise.all([
    Student.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('section', 'name')
      .populate('academicYear', 'name')
      .select('-guardians -documents -medicalInfo')
      .lean(),
    Student.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Students fetched successfully.',
    data: { students },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPreviousPage: parseInt(page) > 1,
    },
  });
});

// ─── Get Student by ID ────────────────────────
exports.getStudentById = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('section', 'name grade classTeacher')
    .populate('academicYear', 'name startDate endDate')
    .populate({
      path: 'guardians.guardian',
      select: 'firstName fatherName relationship phone email occupation',
    })
    .lean();

  if (!student) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Student not found.',
    });
  }

  // Check parent access
  if (req.user.role === 'parent') {
    const guardian = await Guardian.findOne({
      user: req.user._id,
      'students.student': student._id,
      'students.canAccess': true,
    });

    if (!guardian) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied.',
      });
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student fetched.',
    data: { student },
  });
});

// ─── Update Student ───────────────────────────
exports.updateStudent = catchAsync(async (req, res) => {
  const forbiddenFields = ['studentId', 'admissionNumber', 'academicYear', 'createdBy'];
  forbiddenFields.forEach((f) => delete req.body[f]);

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  )
    .populate('section', 'name')
    .populate('academicYear', 'name');

  if (!student) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Student not found.',
    });
  }

  await auditLog({
    req,
    action: 'UPDATE',
    resource: 'student',
    resourceId: student._id,
    description: `Student updated: ${student.fullName} (${student.studentId})`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student updated successfully.',
    data: { student },
  });
});

// ─── Delete Student ───────────────────────────
exports.deleteStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Student not found.',
    });
  }

  // Soft delete — change status to inactive
  student.status = 'inactive';
  student.updatedBy = req.user._id;
  await student.save();

  await auditLog({
    req,
    action: 'DELETE',
    resource: 'student',
    resourceId: student._id,
    description: `Student deactivated: ${student.fullName} (${student.studentId})`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student deactivated successfully.',
  });
});

// ─── Transfer Student ─────────────────────────
exports.transferStudent = catchAsync(async (req, res) => {
  const { newGrade, newSection, newAcademicYear, transferReason } = req.body;
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Student not found.',
    });
  }

  const previousGrade = student.grade;
  const previousSection = student.section;
  const previousAcademicYear = student.academicYear;

  // Remove from old section
  if (previousSection) {
    await Section.findByIdAndUpdate(previousSection, {
      $inc: { currentEnrollment: -1 },
      $pull: { students: student._id },
    });
  }

  // Add to new section
  let newSectionDoc = null;
  if (newSection) {
    newSectionDoc = await Section.findById(newSection);
    if (!newSectionDoc) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'New section not found.',
      });
    }

    await Section.findByIdAndUpdate(newSection, {
      $inc: { currentEnrollment: 1 },
      $addToSet: { students: student._id },
    });
  }

  // Get new academic year
  let newAcademicYearDoc = null;
  if (newAcademicYear) {
    newAcademicYearDoc = await AcademicYear.findById(newAcademicYear);
  }

  // Update student
  student.grade = newGrade || student.grade;
  student.section = newSection || null;
  student.sectionName = newSectionDoc?.name || null;
  student.academicYear = newAcademicYear || student.academicYear;
  student.academicYearName = newAcademicYearDoc?.name || student.academicYearName;
  student.updatedBy = req.user._id;

  // Track transfer history
  if (!student.transferHistory) student.transferHistory = [];
  student.transferHistory.push({
    fromGrade: previousGrade,
    fromSection: previousSection,
    fromAcademicYear: previousAcademicYear,
    toGrade: newGrade,
    toSection: newSection,
    toAcademicYear: newAcademicYear,
    transferDate: new Date(),
    reason: transferReason,
    transferredBy: req.user._id,
  });

  await student.save();

  await auditLog({
    req,
    action: 'TRANSFER',
    resource: 'student',
    resourceId: student._id,
    description: `Student transferred: ${student.fullName} from ${previousGrade} to ${newGrade}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student transferred successfully.',
    data: { student },
  });
});

// ─── Upload Student Photo ─────────────────────
exports.uploadPhoto = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Please upload a photo.',
    });
  }

  const result = await uploadProfilePhoto(req.file.path, 'student');

  if (!result.success) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Photo upload failed.',
    });
  }

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    {
      'photo.url': result.url,
      'photo.publicId': result.publicId,
      updatedBy: req.user._id,
    },
    { new: true }
  );

  if (!student) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Student not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Photo uploaded successfully.',
    data: { photo: student.photo },
  });
});

// ─── Get Student Attendance Summary ───────────
exports.getAttendanceSummary = catchAsync(async (req, res) => {
  const { academicYear, term } = req.query;

  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const stats = await Attendance.getStudentStats(req.params.id, currentYear, term || null);

  const recentAttendance = await Attendance.find({
    student: req.params.id,
    academicYear: currentYear,
    ...(term ? { term } : {}),
  })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance summary fetched.',
    data: {
      stats,
      recentAttendance,
    },
  });
});

// ─── Get Student Fee Summary ──────────────────
exports.getFeeSummary = catchAsync(async (req, res) => {
  const { academicYear } = req.query;
  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const feeSummary = await FeeAssignment.getStudentFeeSummary(req.params.id, currentYear);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee summary fetched.',
    data: feeSummary,
  });
});

// ─── Get Student Exam Results ─────────────────
exports.getExamResults = catchAsync(async (req, res) => {
  const { academicYear, term } = req.query;
  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const results = await ExamResult.find({
    student: req.params.id,
    academicYear: currentYear,
    ...(term ? { term } : {}),
  })
    .sort({ createdAt: -1 })
    .populate('exam', 'title startDate examType')
    .populate('subject', 'name code')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam results fetched.',
    data: { results },
  });
});

// ─── Get Student Suspension History ───────────
exports.getSuspensionHistory = catchAsync(async (req, res) => {
  const suspensions = await Suspension.find({
    student: req.params.id,
  })
    .sort({ startDate: -1 })
    .populate('issuedBy', 'firstName fatherName role')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Suspension history fetched.',
    data: { suspensions },
  });
});

// ─── Get Student Library History ──────────────
exports.getLibraryHistory = catchAsync(async (req, res) => {
  const BookIssue = require('../models/BookIssue');

  const member = await LibraryMember.findOne({
    student: req.params.id,
  });

  if (!member) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Library history fetched.',
      data: { issues: [], member: null },
    });
  }

  const issues = await BookIssue.find({
    libraryMember: member._id,
  })
    .sort({ issueDate: -1 })
    .limit(50)
    .populate('book', 'title accessionNumber coverImage')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Library history fetched.',
    data: {
      member,
      issues,
    },
  });
});

// ─── Get Dashboard Stats ──────────────────────
exports.getDashboardStats = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();
  const academicYearId = currentYear?._id;

  const [totalStudents, activeStudents, byGrade, byGender, recentAdmissions, suspendedStudents] =
    await Promise.all([
      Student.countDocuments({ academicYear: academicYearId }),
      Student.countDocuments({ academicYear: academicYearId, status: 'active' }),
      Student.aggregate([
        { $match: { academicYear: academicYearId, status: 'active' } },
        { $group: { _id: '$grade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Student.aggregate([
        { $match: { academicYear: academicYearId, status: 'active' } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]),
      Student.find({ academicYear: academicYearId })
        .sort({ admissionDate: -1 })
        .limit(5)
        .select('firstName fatherName studentId grade photo admissionDate')
        .lean(),
      Student.countDocuments({
        academicYear: academicYearId,
        status: 'suspended',
      }),
    ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student dashboard stats fetched.',
    data: {
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      suspendedStudents,
      byGrade,
      byGender,
      recentAdmissions,
    },
  });
});

// ─── Bulk Import Students ─────────────────────
exports.bulkImport = catchAsync(async (req, res) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Please provide a list of students to import.',
    });
  }

  if (students.length > 100) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Maximum 100 students can be imported at once.',
    });
  }

  const currentYear = await AcademicYear.getCurrent();
  if (!currentYear) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No active academic year found.',
    });
  }

  const results = {
    success: [],
    errors: [],
    totalProcessed: 0,
  };

  for (const studentData of students) {
    try {
      const studentId = await generateStudentId(studentData.grade, currentYear._id);
      const admissionNumber = await generateAdmissionNumber();

      const student = await Student.create({
        ...studentData,
        studentId,
        admissionNumber,
        academicYear: currentYear._id,
        academicYearName: currentYear.name,
        admissionDate: studentData.admissionDate || new Date(),
        status: 'active',
        createdBy: req.user._id,
      });

      results.success.push({
        studentId: student.studentId,
        name: student.fullName,
      });
    } catch (error) {
      results.errors.push({
        name: `${studentData.firstName} ${studentData.fatherName}`,
        error: error.message,
      });
    }

    results.totalProcessed++;
  }

  await auditLog({
    req,
    action: 'BULK_IMPORT',
    resource: 'student',
    description: `Bulk imported ${results.success.length} students`,
    metadata: { success: results.success.length, errors: results.errors.length },
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Imported ${results.success.length} students. ${results.errors.length} failed.`,
    data: results,
  });
});

// ─── Promote Students ─────────────────────────
exports.promoteStudents = catchAsync(async (req, res) => {
  const { fromGrade, toGrade, fromAcademicYear, toAcademicYear, studentIds } = req.body;

  if (!fromGrade || !toGrade || !toAcademicYear) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'fromGrade, toGrade, and toAcademicYear are required.',
    });
  }

  const newAcademicYearDoc = await AcademicYear.findById(toAcademicYear);
  if (!newAcademicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Target academic year not found.',
    });
  }

  const filter = { grade: fromGrade, status: 'active' };
  if (fromAcademicYear) filter.academicYear = fromAcademicYear;
  if (studentIds && studentIds.length > 0) filter._id = { $in: studentIds };

  const result = await Student.updateMany(filter, {
    grade: toGrade,
    academicYear: toAcademicYear,
    academicYearName: newAcademicYearDoc.name,
    section: null,
    sectionName: null,
    updatedBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'PROMOTE',
    resource: 'student',
    description: `Promoted ${result.modifiedCount} students from ${fromGrade} to ${toGrade}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${result.modifiedCount} students promoted from ${fromGrade} to ${toGrade}.`,
    data: { promoted: result.modifiedCount },
  });
});
