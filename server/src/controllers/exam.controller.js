// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXAM CONTROLLER
// kat-school/server/src/controllers/exam.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const ExamType = require('../models/ExamType');
const ExamResult = require('../models/ExamResult');
const GradeScale = require('../models/GradeScale');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Section = require('../models/Section');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Teacher = require('../models/Teacher');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const {
  calculateFinalScore,
  getGradeLetter,
  getGradePoint,
  getGradeDescription,
  calculateClassRank,
  ETHIOPIAN_GRADE_SCALE,
} = require('../utils/gradeCalculator.util');
const { buildSearchQuery } = require('../utils/pagination.util');

// ═══════════════════════════════════════════
// EXAM TYPE
// ═══════════════════════════════════════════

exports.createExamType = catchAsync(async (req, res) => {
  const { name, code, description, totalMarks, isCA, isTerminal, isMandatory, sortOrder } =
    req.body;

  const existing = await ExamType.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Exam type with code ${code} already exists.`,
    });
  }

  const examType = await ExamType.create({
    name,
    code: code.toUpperCase(),
    description,
    totalMarks: totalMarks || 100,
    isCA: isCA || false,
    isTerminal: isTerminal || false,
    isMandatory: isMandatory !== false,
    sortOrder: sortOrder || 0,
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Exam type created.',
    data: { examType },
  });
});

exports.getAllExamTypes = catchAsync(async (req, res) => {
  const examTypes = await ExamType.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam types fetched.',
    data: { examTypes },
  });
});

exports.updateExamType = catchAsync(async (req, res) => {
  const examType = await ExamType.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!examType) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam type not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam type updated.',
    data: { examType },
  });
});

exports.deleteExamType = catchAsync(async (req, res) => {
  await ExamType.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam type deactivated.',
  });
});

// ═══════════════════════════════════════════
// EXAM
// ═══════════════════════════════════════════

exports.createExam = catchAsync(async (req, res) => {
  const {
    title,
    examType,
    academicYear,
    term,
    grade,
    section,
    subject,
    startDate,
    endDate,
    startTime,
    endTime,
    duration,
    room,
    invigilator,
    totalMarks,
    passingMarks,
    instructions,
    isOnline,
  } = req.body;

  // Validate references
  const [examTypeDoc, academicYearDoc, termDoc, subjectDoc] = await Promise.all([
    ExamType.findById(examType),
    AcademicYear.findById(academicYear),
    Term.findById(term),
    Subject.findById(subject).select('name code'),
  ]);

  if (!examTypeDoc || !academicYearDoc || !termDoc || !subjectDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'One or more referenced documents not found.',
    });
  }

  let sectionDoc = null;
  if (section) {
    sectionDoc = await Section.findById(section).select('name');
  }

  let invigilatorDoc = null;
  if (invigilator) {
    invigilatorDoc = await Teacher.findById(invigilator).select('firstName fatherName');
  }

  const exam = await Exam.create({
    title,
    examType,
    examTypeName: examTypeDoc.name,
    examTypeCode: examTypeDoc.code,
    academicYear,
    academicYearName: academicYearDoc.name,
    term,
    termName: termDoc.name,
    grade,
    section: section || null,
    sectionName: sectionDoc?.name || null,
    subject,
    subjectName: subjectDoc.name,
    subjectCode: subjectDoc.code,
    startDate,
    endDate,
    startTime,
    endTime,
    duration,
    room: room || null,
    invigilator: invigilator || null,
    invigilatorName: invigilatorDoc
      ? `${invigilatorDoc.firstName} ${invigilatorDoc.fatherName}`
      : null,
    totalMarks: totalMarks || 100,
    passingMarks: passingMarks || 50,
    instructions,
    isOnline: isOnline || false,
    status: 'scheduled',
    isActive: true,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'exam',
    resourceId: exam._id,
    description: `Exam created: ${title} — ${subjectDoc.name} (${grade})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Exam scheduled successfully.',
    data: { exam },
  });
});

exports.getAllExams = catchAsync(async (req, res) => {
  const {
    academicYear,
    term,
    grade,
    section,
    subject,
    examType,
    status,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { isActive: true };
  if (academicYear) filter.academicYear = academicYear;
  if (term) filter.term = term;
  if (grade) filter.grade = grade;
  if (section) filter.section = section;
  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;
  if (status) filter.status = status;

  if (!academicYear) {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['title', 'subjectName', 'grade']));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [exams, total] = await Promise.all([
    Exam.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('examType', 'name code')
      .populate('subject', 'name code')
      .lean(),
    Exam.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exams fetched.',
    data: { exams },
    pagination: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getExamById = catchAsync(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('examType', 'name code isCA isTerminal')
    .populate('subject', 'name code fullMarks caMarks examMarks')
    .populate('invigilator', 'firstName fatherName')
    .populate('room', 'name code capacity')
    .lean();

  if (!exam) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam not found.',
    });
  }

  // Get result statistics if any results exist
  const resultStats = await ExamResult.aggregate([
    {
      $match: { exam: new mongoose.Types.ObjectId(exam._id) },
    },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$isAbsent', false] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ['$isAbsent', true] }, 1, 0] },
        },
        passed: {
          $sum: { $cond: [{ $gte: ['$marksObtained', exam.passingMarks] }, 1, 0] },
        },
        highest: { $max: '$marksObtained' },
        lowest: { $min: '$marksObtained' },
        average: { $avg: '$marksObtained' },
      },
    },
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam fetched.',
    data: { exam, resultStats: resultStats[0] || null },
  });
});

exports.updateExam = catchAsync(async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!exam) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam updated.',
    data: { exam },
  });
});

exports.deleteExam = catchAsync(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam not found.',
    });
  }

  if (exam.status === 'completed') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot delete a completed exam.',
    });
  }

  await Exam.findByIdAndUpdate(req.params.id, { isActive: false });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam deleted.',
  });
});

exports.updateExamStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];

  if (!validStatuses.includes(status)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
    });
  }

  const exam = await Exam.findByIdAndUpdate(
    req.params.id,
    { status, updatedBy: req.user._id },
    { new: true }
  );

  if (!exam) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Exam status updated to ${status}.`,
    data: { exam },
  });
});

// ═══════════════════════════════════════════
// EXAM RESULTS
// ═══════════════════════════════════════════

exports.enterExamResult = catchAsync(async (req, res) => {
  const { exam, student, marksObtained, isAbsent, isExcused, remarks } = req.body;

  const examDoc = await Exam.findById(exam);
  if (!examDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam not found.',
    });
  }

  if (marksObtained > examDoc.totalMarks) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Marks obtained (${marksObtained}) cannot exceed total marks (${examDoc.totalMarks}).`,
    });
  }

  const studentDoc = await Student.findById(student)
    .select('firstName fatherName studentId grade')
    .lean();

  if (!studentDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Student not found.',
    });
  }

  // Calculate percentage and grade
  const percentage = isAbsent
    ? 0
    : Math.round((marksObtained / examDoc.totalMarks) * 100 * 100) / 100;

  const gradeLetter = isAbsent ? 'F' : getGradeLetter(percentage);
  const gradePoint = isAbsent ? 0 : getGradePoint(percentage);
  const gradeDescription = isAbsent ? 'Absent' : getGradeDescription(percentage);
  const isPassed = !isAbsent && marksObtained >= examDoc.passingMarks;

  const existing = await ExamResult.findOne({ exam, student });

  let result;
  if (existing) {
    existing.marksObtained = marksObtained;
    existing.isAbsent = isAbsent || false;
    existing.isExcused = isExcused || false;
    existing.percentage = percentage;
    existing.gradeLetter = gradeLetter;
    existing.gradePoint = gradePoint;
    existing.gradeDescription = gradeDescription;
    existing.isPassed = isPassed;
    existing.remarks = remarks || null;
    existing.enteredBy = req.user._id;
    existing.enteredByName = `${req.user.firstName} ${req.user.fatherName}`;
    existing.updatedBy = req.user._id;
    await existing.save();
    result = existing;
  } else {
    result = await ExamResult.create({
      exam,
      examTitle: examDoc.title,
      examType: examDoc.examType,
      examTypeName: examDoc.examTypeName,
      student,
      studentName: `${studentDoc.firstName} ${studentDoc.fatherName}`,
      studentId: studentDoc.studentId,
      subject: examDoc.subject,
      subjectName: examDoc.subjectName,
      subjectCode: examDoc.subjectCode,
      grade: examDoc.grade,
      section: examDoc.section,
      sectionName: examDoc.sectionName,
      academicYear: examDoc.academicYear,
      academicYearName: examDoc.academicYearName,
      term: examDoc.term,
      termName: examDoc.termName,
      totalMarks: examDoc.totalMarks,
      passingMarks: examDoc.passingMarks,
      marksObtained: isAbsent ? 0 : marksObtained,
      isAbsent: isAbsent || false,
      isExcused: isExcused || false,
      percentage,
      gradeLetter,
      gradePoint,
      gradeDescription,
      isPassed,
      remarks: remarks || null,
      status: 'draft',
      enteredBy: req.user._id,
      enteredByName: `${req.user.firstName} ${req.user.fatherName}`,
      createdBy: req.user._id,
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Result entered successfully.',
    data: { result },
  });
});

exports.bulkEnterResults = catchAsync(async (req, res) => {
  const { exam, results } = req.body;

  const examDoc = await Exam.findById(exam);
  if (!examDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam not found.',
    });
  }

  const response = { saved: 0, errors: [] };

  for (const record of results) {
    try {
      const studentDoc = await Student.findById(record.student)
        .select('firstName fatherName studentId')
        .lean();

      if (!studentDoc) {
        response.errors.push({ studentId: record.student, error: 'Student not found' });
        continue;
      }

      const marksObtained = record.isAbsent ? 0 : record.marksObtained || 0;
      const percentage = record.isAbsent
        ? 0
        : Math.round((marksObtained / examDoc.totalMarks) * 100 * 100) / 100;

      const gradeLetter = record.isAbsent ? 'F' : getGradeLetter(percentage);
      const gradePoint = record.isAbsent ? 0 : getGradePoint(percentage);
      const gradeDescription = record.isAbsent ? 'Absent' : getGradeDescription(percentage);
      const isPassed = !record.isAbsent && marksObtained >= examDoc.passingMarks;

      await ExamResult.findOneAndUpdate(
        { exam, student: record.student },
        {
          $set: {
            exam,
            examTitle: examDoc.title,
            examType: examDoc.examType,
            examTypeName: examDoc.examTypeName,
            student: record.student,
            studentName: `${studentDoc.firstName} ${studentDoc.fatherName}`,
            studentId: studentDoc.studentId,
            subject: examDoc.subject,
            subjectName: examDoc.subjectName,
            subjectCode: examDoc.subjectCode,
            grade: examDoc.grade,
            section: examDoc.section,
            sectionName: examDoc.sectionName,
            academicYear: examDoc.academicYear,
            academicYearName: examDoc.academicYearName,
            term: examDoc.term,
            termName: examDoc.termName,
            totalMarks: examDoc.totalMarks,
            passingMarks: examDoc.passingMarks,
            marksObtained,
            isAbsent: record.isAbsent || false,
            isExcused: record.isExcused || false,
            percentage,
            gradeLetter,
            gradePoint,
            gradeDescription,
            isPassed,
            remarks: record.remarks || null,
            status: 'draft',
            enteredBy: req.user._id,
            enteredByName: `${req.user.firstName} ${req.user.fatherName}`,
            updatedBy: req.user._id,
          },
          $setOnInsert: {
            createdBy: req.user._id,
          },
        },
        { upsert: true, new: true }
      );

      response.saved++;
    } catch (error) {
      response.errors.push({
        studentId: record.student,
        error: error.message,
      });
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${response.saved} results saved. ${response.errors.length} errors.`,
    data: response,
  });
});

exports.publishResults = catchAsync(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam not found.',
    });
  }

  // Update all draft results to published
  const updateResult = await ExamResult.updateMany(
    { exam: examId, status: 'draft' },
    {
      status: 'published',
      publishedAt: new Date(),
      publishedBy: req.user._id,
      updatedBy: req.user._id,
    }
  );

  // Update exam status to completed
  await Exam.findByIdAndUpdate(examId, { status: 'completed' });

  await auditLog({
    req,
    action: 'PUBLISH',
    resource: 'exam_result',
    resourceId: examId,
    description: `Results published for exam: ${exam.title}. ${updateResult.modifiedCount} results published.`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${updateResult.modifiedCount} results published.`,
    data: { published: updateResult.modifiedCount },
  });
});

exports.getExamResults = catchAsync(async (req, res) => {
  const { examId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const exam = await Exam.findById(examId).lean();
  if (!exam) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Exam not found.',
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [results, total] = await Promise.all([
    ExamResult.find({ exam: examId })
      .sort({ marksObtained: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('student', 'firstName fatherName studentId photo gender')
      .lean(),
    ExamResult.countDocuments({ exam: examId }),
  ]);

  // Calculate ranks
  const rankedResults = calculateClassRank(
    results.map((r) => ({
      ...r,
      finalScore: r.marksObtained || 0,
    }))
  );

  // Statistics
  const validMarks = results.filter((r) => !r.isAbsent).map((r) => r.marksObtained);

  const stats = {
    total,
    present: results.filter((r) => !r.isAbsent).length,
    absent: results.filter((r) => r.isAbsent).length,
    passed: results.filter((r) => r.isPassed).length,
    failed: results.filter((r) => !r.isPassed && !r.isAbsent).length,
    highest: validMarks.length > 0 ? Math.max(...validMarks) : 0,
    lowest: validMarks.length > 0 ? Math.min(...validMarks) : 0,
    average:
      validMarks.length > 0
        ? Math.round((validMarks.reduce((a, b) => a + b, 0) / validMarks.length) * 100) / 100
        : 0,
    passRate:
      results.length > 0
        ? Math.round((results.filter((r) => r.isPassed).length / results.length) * 100)
        : 0,
  };

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam results fetched.',
    data: {
      exam,
      results: rankedResults,
      stats,
    },
    pagination: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getStudentResults = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const { academicYear, term, subject } = req.query;

  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const filter = { student: studentId };
  if (currentYear) filter.academicYear = currentYear;
  if (term) filter.term = term;
  if (subject) filter.subject = subject;

  const results = await ExamResult.find(filter)
    .sort({ createdAt: -1 })
    .populate('exam', 'title startDate')
    .populate('subject', 'name code creditHours')
    .lean();

  // Group by subject
  const bySubject = {};
  results.forEach((r) => {
    const subId = r.subject?._id?.toString() || r.subjectName;
    if (!bySubject[subId]) {
      bySubject[subId] = {
        subject: r.subject || { name: r.subjectName, code: r.subjectCode },
        results: [],
      };
    }
    bySubject[subId].results.push(r);
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student results fetched.',
    data: {
      results,
      bySubject: Object.values(bySubject),
    },
  });
});

// ─── Exam Dashboard Stats ─────────────────────
exports.getExamDashboard = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();
  const currentTerm = await Term.getCurrent();

  const [totalExams, scheduled, completed, ongoing, recentResults, examsByGrade] =
    await Promise.all([
      Exam.countDocuments({
        academicYear: currentYear?._id,
        isActive: true,
      }),
      Exam.countDocuments({
        academicYear: currentYear?._id,
        status: 'scheduled',
        isActive: true,
      }),
      Exam.countDocuments({
        academicYear: currentYear?._id,
        status: 'completed',
        isActive: true,
      }),
      Exam.countDocuments({
        academicYear: currentYear?._id,
        status: 'ongoing',
        isActive: true,
      }),
      ExamResult.find({
        academicYear: currentYear?._id,
        status: 'published',
      })
        .sort({ publishedAt: -1 })
        .limit(5)
        .populate('exam', 'title')
        .populate('student', 'firstName fatherName studentId')
        .select('studentName marksObtained gradeLetter isPassed publishedAt')
        .lean(),
      Exam.aggregate([
        {
          $match: {
            academicYear: currentYear?._id,
            isActive: true,
          },
        },
        {
          $group: {
            _id: '$grade',
            count: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam dashboard fetched.',
    data: {
      currentAcademicYear: currentYear,
      currentTerm,
      totalExams,
      scheduled,
      completed,
      ongoing,
      recentResults,
      examsByGrade,
    },
  });
});
