// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// REPORT CARD UTILITY
// kat-school/server/src/utils/reportCard.util.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  calculateFinalScore,
  getGradeLetter,
  getGradePoint,
  getGradeDescription,
  calculateGPA,
  calculateClassRank,
  ETHIOPIAN_GRADE_SCALE,
} = require('./gradeCalculator.util');
const { formatEthiopian } = require('./ethiopianDate.util');

// ─── Generate Report Card Data ────────────────
// Compiles all data needed for a student's report card
const generateReportCardData = async (studentId, academicYearId, termId) => {
  const Student = mongoose.model('Student');
  const ExamResult = mongoose.model('ExamResult');
  const Attendance = mongoose.model('Attendance');
  const Subject = mongoose.model('Subject');
  const Settings = mongoose.model('Settings');
  const Section = mongoose.model('Section');
  const ReportCard = mongoose.model('ReportCard');

  // ── Load Student ─────────────────────────────
  const student = await Student.findById(studentId)
    .populate('guardian', 'firstName fatherName phone email')
    .populate('section', 'name')
    .lean();

  if (!student) throw new Error('Student not found');

  // ── Load Settings ─────────────────────────────
  const settings = await Settings.getSettings();

  // ── Load Subjects for Grade ────────────────────
  const subjects = await Subject.find({
    grades: student.grade,
    isActive: true,
  }).lean();

  // ── Load Exam Results ─────────────────────────
  const results = await ExamResult.find({
    student: studentId,
    academicYear: academicYearId,
    term: termId,
    status: { $nin: ['cancelled'] },
  })
    .populate('exam', 'title examType')
    .populate('subject', 'name code creditHours isCompulsory')
    .lean();

  // ── Load Attendance ───────────────────────────
  const attendanceStats = await Attendance.getStudentStats(studentId, academicYearId, termId);

  // ── Group Results by Subject ──────────────────
  const subjectResultsMap = {};

  results.forEach((result) => {
    const subjectId = result.subject?._id?.toString();
    if (!subjectId) return;

    if (!subjectResultsMap[subjectId]) {
      subjectResultsMap[subjectId] = {
        subject: result.subject,
        caScore: 0,
        caTotal: 0,
        examScore: 0,
        examTotal: 0,
        isAbsent: false,
      };
    }

    const entry = subjectResultsMap[subjectId];
    const examType = result.exam?.examType?.toLowerCase() || '';

    if (examType.includes('ca') || examType.includes('continuous') || examType.includes('test')) {
      entry.caScore += result.marksObtained || 0;
      entry.caTotal += result.totalMarks || 50;
    } else {
      entry.examScore += result.marksObtained || 0;
      entry.examTotal += result.totalMarks || 50;
      if (result.isAbsent) entry.isAbsent = true;
    }
  });

  // ── Calculate Subject Scores ──────────────────
  const subjectScores = subjects.map((subject) => {
    const subjectId = subject._id.toString();
    const resultData = subjectResultsMap[subjectId];

    if (!resultData) {
      return {
        subject: subject.name,
        subjectCode: subject.code,
        creditHours: subject.creditHours || 1,
        isCompulsory: subject.isCompulsory !== false,
        caScore: null,
        caTotal: 50,
        examScore: null,
        examTotal: 50,
        finalScore: null,
        gradeLetter: null,
        gradePoint: null,
        gradeDescription: null,
        isPassed: null,
        isAbsent: false,
        hasResult: false,
      };
    }

    const finalScore = calculateFinalScore({
      caScore: resultData.caScore,
      caTotal: resultData.caTotal || 50,
      examScore: resultData.examScore,
      examTotal: resultData.examTotal || 50,
    });

    const gradeLetter = getGradeLetter(finalScore);
    const gradePoint = getGradePoint(finalScore);
    const gradeDescription = getGradeDescription(finalScore);
    const isPassed = finalScore !== null && finalScore >= 50;

    return {
      subject: subject.name,
      subjectCode: subject.code,
      creditHours: subject.creditHours || 1,
      isCompulsory: subject.isCompulsory !== false,
      caScore: resultData.caScore,
      caTotal: resultData.caTotal || 50,
      caPercentage:
        resultData.caTotal > 0
          ? Math.round((resultData.caScore / resultData.caTotal) * 5000) / 100
          : 0,
      examScore: resultData.examScore,
      examTotal: resultData.examTotal || 50,
      examPercentage:
        resultData.examTotal > 0
          ? Math.round((resultData.examScore / resultData.examTotal) * 5000) / 100
          : 0,
      finalScore,
      gradeLetter,
      gradePoint,
      gradeDescription,
      isPassed,
      isAbsent: resultData.isAbsent,
      hasResult: true,
    };
  });

  // ── Calculate GPA ─────────────────────────────
  const gpaData = calculateGPA(
    subjectScores
      .filter((s) => s.finalScore !== null)
      .map((s) => ({
        name: s.subject,
        finalScore: s.finalScore,
        creditHours: s.creditHours,
      }))
  );

  // ── Calculate Class Rank ──────────────────────
  // Get all students in the same section
  let classRank = null;
  let totalStudentsInClass = 0;

  try {
    const classReportCards = await ReportCard.find({
      section: student.section?._id,
      academicYear: academicYearId,
      term: termId,
      status: 'published',
    })
      .select('student totalScore')
      .lean();

    if (classReportCards.length > 0) {
      const thisCard = classReportCards.find((r) => r.student.toString() === studentId.toString());

      if (thisCard) {
        const ranked = calculateClassRank(
          classReportCards.map((r) => ({
            studentId: r.student,
            finalScore: r.totalScore,
          }))
        );

        const thisRank = ranked.find((r) => r.studentId.toString() === studentId.toString());

        classRank = thisRank?.rank || null;
        totalStudentsInClass = classReportCards.length;
      }
    }
  } catch (rankError) {
    console.error('Rank calculation error:', rankError.message);
  }

  // ── Build Final Report Card Data ──────────────
  const reportCardData = {
    // School info
    school: {
      name: settings.schoolName || 'Kat Secondary School',
      nameAmharic: settings.schoolNameAmharic || 'ካት ሁለተኛ ደረጃ ትምህርት ቤት',
      address: settings.schoolAddress || 'Addis Ababa, Ethiopia',
      phone: settings.schoolPhone,
      email: settings.schoolEmail,
      logoUrl: settings.logoUrl,
      motto: settings.schoolMotto,
      reportCardHeader: settings.reportCardHeader,
    },
    // Student info
    student: {
      id: student._id,
      studentId: student.studentId,
      admissionNumber: student.admissionNumber,
      fullName:
        `${student.firstName} ${student.fatherName} ${student.grandFatherName || ''}`.trim(),
      firstName: student.firstName,
      fatherName: student.fatherName,
      grandFatherName: student.grandFatherName,
      grade: student.grade,
      section: student.section?.name,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      photo: student.photo?.url,
      guardian: student.guardian
        ? {
            name: `${student.guardian.firstName} ${student.guardian.fatherName}`,
            phone: student.guardian.phone,
          }
        : null,
    },
    // Academic info
    academicYear: academicYearId,
    term: termId,
    // Subject results
    subjects: subjectScores,
    // GPA & performance
    performance: {
      gpa: gpaData.gpa,
      totalSubjects: gpaData.totalSubjects,
      passedSubjects: gpaData.passedSubjects,
      failedSubjects: gpaData.failedSubjects,
      classRank,
      totalStudentsInClass,
      rankDisplay: classRank ? `${classRank} / ${totalStudentsInClass}` : null,
    },
    // Attendance
    attendance: {
      totalDays: attendanceStats?.totalDays || 0,
      presentDays: attendanceStats?.presentDays || 0,
      absentDays: attendanceStats?.absentDays || 0,
      lateDays: attendanceStats?.lateDays || 0,
      leaveDays: attendanceStats?.leaveDays || 0,
      attendancePercentage: attendanceStats?.attendancePercentage || 0,
    },
    // Dates
    generatedAt: new Date(),
    generatedAtEthiopian: formatEthiopian(new Date()),
    printedAt: null,
  };

  return reportCardData;
};

// ─── Calculate Total Score ────────────────────
const calculateTotalScore = (subjectScores) => {
  const validScores = subjectScores.filter((s) => s.finalScore !== null);
  if (validScores.length === 0) return 0;

  const total = validScores.reduce((sum, s) => sum + s.finalScore, 0);
  return Math.round((total / validScores.length) * 100) / 100;
};

// ─── Get Overall Grade ────────────────────────
const getOverallGrade = (subjectScores) => {
  const total = calculateTotalScore(subjectScores);
  return getGradeLetter(total);
};

// ─── Build Report Card HTML ───────────────────
// A simple HTML template for PDF generation
const buildReportCardHTML = (reportData) => {
  const { school, student, subjects, performance, attendance, generatedAtEthiopian } = reportData;

  const subjectRows = subjects
    .map(
      (s) => `
    <tr>
      <td>${s.subject} (${s.subjectCode})</td>
      <td>${s.caScore !== null ? `${s.caScore}/${s.caTotal}` : '-'}</td>
      <td>${s.examScore !== null ? `${s.examScore}/${s.examTotal}` : '-'}</td>
      <td><strong>${s.finalScore !== null ? s.finalScore.toFixed(1) : '-'}</strong></td>
      <td style="color:${s.gradeLetter === 'F' ? '#dc2626' : s.gradeLetter === 'A' ? '#16a34a' : '#374151'};">
        <strong>${s.gradeLetter || '-'}</strong>
      </td>
      <td>${s.gradeDescription || '-'}</td>
      <td>${s.isPassed === null ? '-' : s.isPassed ? '✓' : '✗'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { color: #4f46e5; margin: 0; font-size: 18px; }
    .header h2 { color: #374151; margin: 4px 0; font-size: 14px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .info-item { display: flex; gap: 8px; }
    .info-label { font-weight: bold; color: #4f46e5; min-width: 120px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background-color: #4f46e5; color: white; padding: 8px 4px; text-align: left; font-size: 11px; }
    td { padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .summary { background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 12px; margin-bottom: 16px; }
    .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #6b7280; }
    .signature-area { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 24px; }
    .signature-box { border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${school.name}</h1>
    <h2>${school.nameAmharic}</h2>
    <p style="margin:0;color:#6b7280;font-size:11px;">${school.address} | ${school.phone || ''}</p>
    <h2 style="color:#4f46e5;margin:8px 0 0;">Student Report Card</h2>
  </div>

  <div class="info-grid">
    <div class="info-item"><span class="info-label">Student Name:</span>${student.fullName}</div>
    <div class="info-item"><span class="info-label">Student ID:</span>${student.studentId}</div>
    <div class="info-item"><span class="info-label">Grade:</span>${student.grade}</div>
    <div class="info-item"><span class="info-label">Section:</span>${student.section || '-'}</div>
    <div class="info-item"><span class="info-label">Gender:</span>${student.gender}</div>
    <div class="info-item"><span class="info-label">Guardian:</span>${student.guardian?.name || '-'}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th>CA Score</th>
        <th>Exam Score</th>
        <th>Total (100)</th>
        <th>Grade</th>
        <th>Description</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${subjectRows}</tbody>
  </table>

  <div class="summary">
    <strong>Summary:</strong>
    GPA: ${performance.gpa} |
    Passed: ${performance.passedSubjects}/${performance.totalSubjects} subjects |
    Rank: ${performance.rankDisplay || 'N/A'} |
    Attendance: ${attendance.attendancePercentage}%
    (${attendance.presentDays}/${attendance.totalDays} days)
  </div>

  <div class="signature-area">
    <div class="signature-box">Class Teacher</div>
    <div class="signature-box">Registrar / Principal</div>
    <div class="signature-box">Parent / Guardian</div>
  </div>

  <div class="footer">
    Generated: ${generatedAtEthiopian} | Kat Secondary School Management System
  </div>
</body>
</html>
  `;
};

module.exports = {
  generateReportCardData,
  calculateTotalScore,
  getOverallGrade,
  buildReportCardHTML,
};
