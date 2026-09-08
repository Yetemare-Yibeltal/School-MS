// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// REPORT CARD CONTROLLER
// kat-school/server/src/controllers/reportCard.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const ReportCard = require('../models/ReportCard');
const Student = require('../models/Student');
const ExamResult = require('../models/ExamResult');
const Subject = require('../models/Subject');
const Section = require('../models/Section');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const {
  generateReportCardData,
  calculateTotalScore,
  getOverallGrade,
  buildReportCardHTML,
} = require('../utils/reportCard.util');
const {
  calculateFinalScore,
  getGradeLetter,
  getGradePoint,
  calculateGPA,
  calculateClassRank,
  ETHIOPIAN_GRADE_SCALE,
} = require('../utils/gradeCalculator.util');
const { uploadPDF, FOLDERS } = require('../utils/fileUpload.util');
const { notifyResultPublished } = require('../utils/notification.util');

// ─── Generate Report Card ─────────────────────
exports.generateReportCard = catchAsync(async (req, res) => {
  const { studentId, academicYearId, termId } = req.params;

  // Validate student
  const student = await Student.findById(studentId)
    .populate('section', 'name')
    .populate({
      path: 'guardians.guardian',
      select: 'firstName fatherName phone email user',
    })
    .lean();

  if (!student) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Student not found.',
    });
  }

  // Validate academic year and term
  const [academicYear, term] = await Promise.all([
    AcademicYear.findById(academicYearId),
    Term.findById(termId),
  ]);

  if (!academicYear || !term) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year or term not found.',
    });
  }

  // Check for existing report card
  let reportCard = await ReportCard.findOne({
    student: studentId,
    academicYear: academicYearId,
    term: termId,
  });

  // Get all subjects for this grade
  const subjects = await Subject.find({
    grades: student.grade,
    isActive: true,
  }).lean();

  if (subjects.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No subjects found for this grade.',
    });
  }

  // Get all exam results for this student/year/term
  const examResults = await ExamResult.find({
    student: studentId,
    academicYear: academicYearId,
    term: termId,
    status: { $in: ['draft', 'published'] },
  })
    .populate('exam', 'title examType examTypeName isCA isTerminal')
    .populate('subject', 'name code creditHours caMarks examMarks fullMarks')
    .lean();

  // Group results by subject
  const subjectResultsMap = {};
  examResults.forEach((result) => {
    const subId = result.subject?._id?.toString() || result.subjectCode;
    if (!subId) return;

    if (!subjectResultsMap[subId]) {
      subjectResultsMap[subId] = {
        subject: result.subject,
        subjectName: result.subjectName,
        subjectCode: result.subjectCode,
        caResults: [],
        examResults: [],
      };
    }

    const examTypeName = (result.examTypeName || '').toLowerCase();
    if (
      examTypeName.includes('ca') ||
      examTypeName.includes('continuous') ||
      examTypeName.includes('test') ||
      examTypeName.includes('quiz') ||
      result.exam?.isCA
    ) {
      subjectResultsMap[subId].caResults.push(result);
    } else {
      subjectResultsMap[subId].examResults.push(result);
    }
  });

  // Build subject scores array
  const subjectScores = subjects.map((subject) => {
    const subId = subject._id.toString();
    const resultData = subjectResultsMap[subId];

    if (!resultData) {
      return {
        subject: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        creditHours: subject.creditHours || 1,
        isCompulsory: subject.isCompulsory !== false,
        caScore: null,
        caTotal: subject.caMarks || 50,
        examScore: null,
        examTotal: subject.examMarks || 50,
        finalScore: null,
        gradeLetter: null,
        gradePoint: null,
        gradeDescription: null,
        isPassed: null,
        isAbsent: false,
        hasResult: false,
      };
    }

    // Sum CA scores
    const caScore = resultData.caResults.reduce(
      (sum, r) => sum + (r.isAbsent ? 0 : r.marksObtained),
      0
    );
    const caTotal = subject.caMarks || 50;

    // Sum exam scores
    const examScore = resultData.examResults.reduce(
      (sum, r) => sum + (r.isAbsent ? 0 : r.marksObtained),
      0
    );
    const examTotal = subject.examMarks || 50;

    const isAbsent =
      resultData.examResults.some((r) => r.isAbsent) ||
      resultData.caResults.some((r) => r.isAbsent);

    const finalScore = isAbsent
      ? 0
      : calculateFinalScore({
          caScore,
          caTotal,
          examScore,
          examTotal,
        });

    const gradeLetter = isAbsent ? 'F' : getGradeLetter(finalScore);
    const gradePoint = isAbsent ? 0 : getGradePoint(finalScore);
    const gradeDescription = isAbsent
      ? 'Absent'
      : ETHIOPIAN_GRADE_SCALE.find((g) => g.letter === gradeLetter)?.description || '';
    const isPassed = !isAbsent && finalScore >= 50;

    return {
      subject: subject._id,
      subjectName: subject.name,
      subjectCode: subject.code,
      creditHours: subject.creditHours || 1,
      isCompulsory: subject.isCompulsory !== false,
      caScore,
      caTotal,
      caPercentage: caTotal > 0 ? Math.round((caScore / caTotal) * 100 * 10) / 10 : 0,
      examScore,
      examTotal,
      examPercentage: examTotal > 0 ? Math.round((examScore / examTotal) * 100 * 10) / 10 : 0,
      finalScore,
      gradeLetter,
      gradePoint,
      gradeDescription,
      isPassed,
      isAbsent,
      hasResult: true,
    };
  });

  // Calculate GPA
  const validSubjects = subjectScores.filter((s) => s.finalScore !== null);
  const gpaData = calculateGPA(
    validSubjects.map((s) => ({
      name: s.subjectName,
      finalScore: s.finalScore,
      creditHours: s.creditHours,
    }))
  );

  // Calculate total score (simple average)
  const totalScore = calculateTotalScore(subjectScores);
  const overallGrade = getOverallGrade(subjectScores);

  // Get attendance
  const attendanceData = await Attendance.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        term: new mongoose.Types.ObjectId(termId),
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
        excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } },
      },
    },
  ]);

  const attendanceStats = attendanceData[0] || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    excused: 0,
  };

  attendanceStats.attendancePercentage =
    attendanceStats.total > 0
      ? Math.round(
          ((attendanceStats.present + attendanceStats.late * 0.5) / attendanceStats.total) *
            100 *
            10
        ) / 10
      : 0;

  // Get school settings
  const settings = await Settings.getSettings();

  // Create or update report card
  const reportCardData = {
    student: studentId,
    studentName:
      `${student.firstName} ${student.fatherName} ${student.grandFatherName || ''}`.trim(),
    studentId: student.studentId,
    admissionNumber: student.admissionNumber,
    grade: student.grade,
    section: student.section?._id || null,
    sectionName: student.section?.name || null,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    guardianName: student.guardians?.[0]?.guardianName || null,
    guardianPhone: student.guardians?.[0]?.phone || null,
    academicYear: academicYearId,
    academicYearName: academicYear.name,
    term: termId,
    termName: term.name,
    termNumber: term.termNumber,
    subjects: subjectScores,
    totalScore,
    overallGrade,
    gpa: gpaData.gpa,
    totalSubjects: gpaData.totalSubjects,
    passedSubjects: gpaData.passedSubjects,
    failedSubjects: gpaData.failedSubjects,
    attendanceDays: attendanceStats.total,
    presentDays: attendanceStats.present,
    absentDays: attendanceStats.absent,
    lateDays: attendanceStats.late,
    leaveDays: attendanceStats.onLeave,
    attendancePercentage: attendanceStats.attendancePercentage,
    schoolName: settings.schoolName,
    schoolAddress: settings.schoolAddress,
    schoolPhone: settings.schoolPhone,
    schoolLogo: settings.logoUrl,
    status: 'draft',
    generatedBy: req.user._id,
    generatedByName: `${req.user.firstName} ${req.user.fatherName}`,
    generatedAt: new Date(),
    updatedBy: req.user._id,
  };

  if (reportCard) {
    Object.assign(reportCard, reportCardData);
    await reportCard.save();
  } else {
    reportCard = await ReportCard.create({
      ...reportCardData,
      createdBy: req.user._id,
    });
  }

  await auditLog({
    req,
    action: 'GENERATE',
    resource: 'report_card',
    resourceId: reportCard._id,
    description: `Report card generated for ${student.firstName} ${student.fatherName} — ${term.name}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Report card generated successfully.',
    data: { reportCard },
  });
});

// ─── Get Report Card ──────────────────────────
exports.getReportCard = catchAsync(async (req, res) => {
  const { studentId, academicYearId, termId } = req.params;

  const reportCard = await ReportCard.findOne({
    student: studentId,
    academicYear: academicYearId,
    term: termId,
  })
    .populate('student', 'firstName fatherName studentId grade photo dateOfBirth')
    .populate('academicYear', 'name')
    .populate('term', 'name termNumber')
    .populate('section', 'name')
    .lean();

  if (!reportCard) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Report card not found. Please generate it first.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Report card fetched.',
    data: { reportCard },
  });
});

// ─── Get Student Report Cards ─────────────────
exports.getStudentReportCards = catchAsync(async (req, res) => {
  const { studentId } = req.params;

  const reportCards = await ReportCard.find({ student: studentId })
    .sort({ createdAt: -1 })
    .populate('academicYear', 'name')
    .populate('term', 'name termNumber')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student report cards fetched.',
    data: { reportCards },
  });
});

// ─── Publish Report Card ──────────────────────
exports.publishReportCard = catchAsync(async (req, res) => {
  const { id } = req.params;

  const reportCard = await ReportCard.findByIdAndUpdate(
    id,
    {
      status: 'published',
      publishedAt: new Date(),
      publishedBy: req.user._id,
      updatedBy: req.user._id,
    },
    { new: true }
  ).populate('student', 'firstName fatherName user guardians');

  if (!reportCard) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Report card not found.',
    });
  }

  // Notify student and parent
  try {
    if (reportCard.student?.user) {
      await notifyResultPublished(
        reportCard.student.user,
        null,
        `Term ${reportCard.termName}`,
        reportCard.grade,
        reportCard._id
      );
    }
  } catch (err) {
    console.error('Notification failed:', err.message);
  }

  await auditLog({
    req,
    action: 'PUBLISH',
    resource: 'report_card',
    resourceId: reportCard._id,
    description: `Report card published for ${reportCard.studentName} — ${reportCard.termName}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Report card published.',
    data: { reportCard },
  });
});

// ─── Bulk Generate Report Cards ───────────────
exports.bulkGenerateReportCards = catchAsync(async (req, res) => {
  const { grade, section, academicYearId, termId } = req.body;

  if (!grade || !academicYearId || !termId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Grade, academicYearId, and termId are required.',
    });
  }

  const filter = { grade, status: 'active' };
  if (section) filter.section = section;

  const students = await Student.find(filter).select('_id').lean();

  if (students.length === 0) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'No students found for this grade/section.',
      data: { generated: 0, errors: [] },
    });
  }

  const results = { generated: 0, errors: [] };

  // Process in batches of 10 to avoid overwhelming the server
  const batchSize = 10;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (s) => {
        try {
          // Simulate calling the generate logic inline
          const student = await Student.findById(s._id).populate('section', 'name').lean();

          const [academicYear, term, settings] = await Promise.all([
            AcademicYear.findById(academicYearId),
            Term.findById(termId),
            Settings.getSettings(),
          ]);

          const subjects = await Subject.find({
            grades: student.grade,
            isActive: true,
          }).lean();

          const examResults = await ExamResult.find({
            student: s._id,
            academicYear: academicYearId,
            term: termId,
            status: { $in: ['draft', 'published'] },
          })
            .populate('subject', 'name code creditHours caMarks examMarks fullMarks')
            .lean();

          // Build subject scores (same logic as generateReportCard)
          const subjectResultsMap = {};
          examResults.forEach((result) => {
            const subId = result.subject?._id?.toString();
            if (!subId) return;
            if (!subjectResultsMap[subId]) {
              subjectResultsMap[subId] = { caResults: [], examResults: [] };
            }
            const examTypeName = (result.examTypeName || '').toLowerCase();
            if (
              examTypeName.includes('ca') ||
              examTypeName.includes('continuous') ||
              examTypeName.includes('test')
            ) {
              subjectResultsMap[subId].caResults.push(result);
            } else {
              subjectResultsMap[subId].examResults.push(result);
            }
          });

          const subjectScores = subjects.map((subject) => {
            const subId = subject._id.toString();
            const rd = subjectResultsMap[subId];
            if (!rd) {
              return {
                subject: subject._id,
                subjectName: subject.name,
                subjectCode: subject.code,
                creditHours: subject.creditHours || 1,
                isCompulsory: subject.isCompulsory !== false,
                caScore: null,
                caTotal: subject.caMarks || 50,
                examScore: null,
                examTotal: subject.examMarks || 50,
                finalScore: null,
                gradeLetter: null,
                gradePoint: null,
                gradeDescription: null,
                isPassed: null,
                isAbsent: false,
                hasResult: false,
              };
            }
            const caScore = rd.caResults.reduce(
              (sum, r) => sum + (r.isAbsent ? 0 : r.marksObtained),
              0
            );
            const examScore = rd.examResults.reduce(
              (sum, r) => sum + (r.isAbsent ? 0 : r.marksObtained),
              0
            );
            const isAbsent = rd.examResults.some((r) => r.isAbsent);
            const finalScore = isAbsent
              ? 0
              : calculateFinalScore({
                  caScore,
                  caTotal: subject.caMarks || 50,
                  examScore,
                  examTotal: subject.examMarks || 50,
                });
            const gradeLetter = isAbsent ? 'F' : getGradeLetter(finalScore);
            const gradePoint = isAbsent ? 0 : getGradePoint(finalScore);
            const isPassed = !isAbsent && finalScore >= 50;
            return {
              subject: subject._id,
              subjectName: subject.name,
              subjectCode: subject.code,
              creditHours: subject.creditHours || 1,
              isCompulsory: subject.isCompulsory !== false,
              caScore,
              caTotal: subject.caMarks || 50,
              examScore,
              examTotal: subject.examMarks || 50,
              finalScore,
              gradeLetter,
              gradePoint,
              gradeDescription: isAbsent
                ? 'Absent'
                : ETHIOPIAN_GRADE_SCALE.find((g) => g.letter === gradeLetter)?.description || '',
              isPassed,
              isAbsent,
              hasResult: true,
            };
          });

          const validSubjects = subjectScores.filter((s) => s.finalScore !== null);
          const gpaData = calculateGPA(
            validSubjects.map((s) => ({
              name: s.subjectName,
              finalScore: s.finalScore,
              creditHours: s.creditHours,
            }))
          );
          const totalScore = calculateTotalScore(subjectScores);
          const overallGrade = getOverallGrade(subjectScores);

          const attendanceData = await Attendance.aggregate([
            {
              $match: {
                student: new mongoose.Types.ObjectId(s._id),
                academicYear: new mongoose.Types.ObjectId(academicYearId),
                term: new mongoose.Types.ObjectId(termId),
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
              },
            },
          ]);
          const att = attendanceData[0] || { total: 0, present: 0, absent: 0, late: 0, onLeave: 0 };
          const attendancePercentage =
            att.total > 0
              ? Math.round(((att.present + att.late * 0.5) / att.total) * 100 * 10) / 10
              : 0;

          await ReportCard.findOneAndUpdate(
            { student: s._id, academicYear: academicYearId, term: termId },
            {
              $set: {
                student: s._id,
                studentName: `${student.firstName} ${student.fatherName}`,
                studentId: student.studentId,
                admissionNumber: student.admissionNumber,
                grade: student.grade,
                section: student.section?._id || null,
                sectionName: student.section?.name || null,
                gender: student.gender,
                academicYear: academicYearId,
                academicYearName: academicYear.name,
                term: termId,
                termName: term.name,
                termNumber: term.termNumber,
                subjects: subjectScores,
                totalScore,
                overallGrade,
                gpa: gpaData.gpa,
                totalSubjects: gpaData.totalSubjects,
                passedSubjects: gpaData.passedSubjects,
                failedSubjects: gpaData.failedSubjects,
                attendanceDays: att.total,
                presentDays: att.present,
                absentDays: att.absent,
                lateDays: att.late,
                leaveDays: att.onLeave,
                attendancePercentage,
                schoolName: settings.schoolName,
                schoolAddress: settings.schoolAddress,
                schoolPhone: settings.schoolPhone,
                schoolLogo: settings.logoUrl,
                status: 'draft',
                generatedBy: req.user._id,
                generatedAt: new Date(),
                updatedBy: req.user._id,
              },
              $setOnInsert: { createdBy: req.user._id },
            },
            { upsert: true, new: true }
          );

          results.generated++;
        } catch (error) {
          results.errors.push({ studentId: s._id, error: error.message });
        }
      })
    );
  }

  await auditLog({
    req,
    action: 'BULK_GENERATE',
    resource: 'report_card',
    description: `Bulk report cards generated for ${grade}${section ? ` section ${section}` : ''}. Generated: ${results.generated}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Generated ${results.generated} report cards. ${results.errors.length} errors.`,
    data: results,
  });
});

// ─── Bulk Publish Report Cards ────────────────
exports.bulkPublishReportCards = catchAsync(async (req, res) => {
  const { grade, section, academicYearId, termId } = req.body;

  const filter = {
    grade,
    academicYear: academicYearId,
    term: termId,
    status: 'draft',
  };
  if (section) filter.section = section;

  const result = await ReportCard.updateMany(filter, {
    status: 'published',
    publishedAt: new Date(),
    publishedBy: req.user._id,
    updatedBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'BULK_PUBLISH',
    resource: 'report_card',
    description: `Bulk published ${result.modifiedCount} report cards for ${grade}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${result.modifiedCount} report cards published.`,
    data: { published: result.modifiedCount },
  });
});

// ─── Get Section Report Cards ─────────────────
exports.getSectionReportCards = catchAsync(async (req, res) => {
  const { sectionId } = req.params;
  const { academicYear, term } = req.query;

  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;
  const currentTerm = term || (await Term.getCurrent())?._id;

  const filter = { section: sectionId };
  if (currentYear) filter.academicYear = currentYear;
  if (currentTerm) filter.term = currentTerm;

  const reportCards = await ReportCard.find(filter)
    .sort({ totalScore: -1 })
    .populate('student', 'firstName fatherName studentId photo')
    .select(
      'studentName studentId totalScore overallGrade gpa passedSubjects failedSubjects attendancePercentage status rank'
    )
    .lean();

  // Calculate ranks
  const ranked = reportCards.map((card, index) => ({
    ...card,
    rank: index + 1,
  }));

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Section report cards fetched.',
    data: { reportCards: ranked },
  });
});

// ─── Download Report Card PDF ─────────────────
exports.downloadReportCard = catchAsync(async (req, res) => {
  const { id } = req.params;

  const reportCard = await ReportCard.findById(id)
    .populate('student', 'firstName fatherName studentId grade photo dateOfBirth')
    .populate('academicYear', 'name')
    .populate('term', 'name termNumber')
    .lean();

  if (!reportCard) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Report card not found.',
    });
  }

  // Check if PDF already generated
  if (reportCard.pdfUrl) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Report card PDF URL fetched.',
      data: { pdfUrl: reportCard.pdfUrl },
    });
  }

  // Generate PDF HTML
  const htmlContent = buildReportCardHTML({
    school: {
      name: reportCard.schoolName,
      nameAmharic: 'ካት ሁለተኛ ደረጃ ትምህርት ቤት',
      address: reportCard.schoolAddress,
      phone: reportCard.schoolPhone,
      logoUrl: reportCard.schoolLogo,
      motto: 'Excellence in Education',
    },
    student: {
      fullName: reportCard.studentName,
      studentId: reportCard.studentId,
      grade: reportCard.grade,
      section: reportCard.sectionName,
      gender: reportCard.gender,
      guardian: { name: reportCard.guardianName },
    },
    subjects: reportCard.subjects,
    performance: {
      gpa: reportCard.gpa,
      totalSubjects: reportCard.totalSubjects,
      passedSubjects: reportCard.passedSubjects,
      failedSubjects: reportCard.failedSubjects,
      rankDisplay: reportCard.rank ? `${reportCard.rank}` : null,
    },
    attendance: {
      totalDays: reportCard.attendanceDays,
      presentDays: reportCard.presentDays,
      absentDays: reportCard.absentDays,
      attendancePercentage: reportCard.attendancePercentage,
    },
    generatedAtEthiopian: new Date().toLocaleDateString('en-ET'),
  });

  // For now, return HTML — PDF generation uses puppeteer in production
  // Update the report card print count
  await ReportCard.findByIdAndUpdate(id, {
    $inc: { printCount: 1 },
    lastPrintedAt: new Date(),
    lastPrintedBy: req.user._id,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Report card HTML generated.',
    data: {
      html: htmlContent,
      reportCard,
    },
  });
});

// ─── Get Report Card Dashboard ────────────────
exports.getReportCardDashboard = catchAsync(async (req, res) => {
  const { academicYear, term } = req.query;
  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;
  const currentTerm = term || (await Term.getCurrent())?._id;

  const filter = {};
  if (currentYear) filter.academicYear = currentYear;
  if (currentTerm) filter.term = currentTerm;

  const [total, draft, published, byGrade, topStudents] = await Promise.all([
    ReportCard.countDocuments(filter),
    ReportCard.countDocuments({ ...filter, status: 'draft' }),
    ReportCard.countDocuments({ ...filter, status: 'published' }),
    ReportCard.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          avgGpa: { $avg: '$gpa' },
          avgScore: { $avg: '$totalScore' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ReportCard.find({ ...filter, status: 'published' })
      .sort({ totalScore: -1 })
      .limit(10)
      .populate('student', 'firstName fatherName studentId photo')
      .select('studentName studentId grade totalScore gpa overallGrade attendancePercentage')
      .lean(),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Report card dashboard fetched.',
    data: {
      total,
      draft,
      published,
      byGrade,
      topStudents,
    },
  });
});

// ─── Update Report Card Comment ───────────────
exports.updateComment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { teacherComment, principalComment, conductGrade, effortGrade } = req.body;

  const reportCard = await ReportCard.findByIdAndUpdate(
    id,
    {
      teacherComment,
      principalComment,
      conductGrade,
      effortGrade,
      updatedBy: req.user._id,
    },
    { new: true }
  );

  if (!reportCard) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Report card not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Report card comment updated.',
    data: { reportCard },
  });
});
