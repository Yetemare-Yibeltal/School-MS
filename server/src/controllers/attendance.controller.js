// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ATTENDANCE CONTROLLER
// kat-school/server/src/controllers/attendance.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const TeacherAttendance = require('../models/TeacherAttendance');
const AttendanceSettings = require('../models/AttendanceSettings');
const Holiday = require('../models/Holiday');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Employee = require('../models/Employee');
const Section = require('../models/Section');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Guardian = require('../models/Guardian');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const { notifyAbsence } = require('../utils/notification.util');
const { sendAbsenceAlertEmail } = require('../utils/email.util');
const { buildDateRangeFilter } = require('../utils/pagination.util');

// ═══════════════════════════════════════════
// STUDENT ATTENDANCE
// ═══════════════════════════════════════════

// ─── Mark Single Attendance ───────────────────
exports.markAttendance = catchAsync(async (req, res) => {
  const {
    student,
    date,
    status,
    section,
    grade,
    academicYear,
    term,
    checkInTime,
    checkOutTime,
    lateMinutes,
    absenceType,
    isExcused,
    excuseReason,
    leaveApplication,
    remarks,
    notifyParent,
  } = req.body;

  // Check student exists
  const studentDoc = await Student.findById(student)
    .select('firstName fatherName studentId grade guardians status')
    .lean();

  if (!studentDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Student not found.',
    });
  }

  // Check for existing attendance on this date
  const existing = await Attendance.findOne({
    student,
    date: {
      $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
      $lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
    },
  });

  let attendance;

  if (existing) {
    // Update existing
    existing.status = status;
    existing.checkInTime = checkInTime || existing.checkInTime;
    existing.checkOutTime = checkOutTime || existing.checkOutTime;
    existing.lateMinutes = lateMinutes || 0;
    existing.absenceType = absenceType || existing.absenceType;
    existing.isExcused = isExcused || false;
    existing.excuseReason = excuseReason || null;
    existing.leaveApplication = leaveApplication || null;
    existing.remarks = remarks || null;
    existing.updatedBy = req.user._id;
    await existing.save();
    attendance = existing;
  } else {
    // Get current academic year if not provided
    let academicYearId = academicYear;
    let termId = term;

    if (!academicYearId) {
      const currentYear = await AcademicYear.getCurrent();
      academicYearId = currentYear?._id;
    }

    if (!termId) {
      const currentTerm = await Term.getCurrent();
      termId = currentTerm?._id;
    }

    attendance = await Attendance.create({
      student,
      studentName: `${studentDoc.firstName} ${studentDoc.fatherName}`,
      studentId: studentDoc.studentId,
      date: new Date(date),
      status,
      section: section || studentDoc.section,
      grade: grade || studentDoc.grade,
      academicYear: academicYearId,
      term: termId,
      checkInTime: checkInTime || null,
      checkOutTime: checkOutTime || null,
      lateMinutes: lateMinutes || 0,
      absenceType: absenceType || null,
      isExcused: isExcused || false,
      excuseReason: excuseReason || null,
      leaveApplication: leaveApplication || null,
      remarks: remarks || null,
      markedBy: req.user._id,
      markedByName: `${req.user.firstName} ${req.user.fatherName}`,
      markedAt: new Date(),
      createdBy: req.user._id,
    });
  }

  // Notify parent if absent and notification requested
  if ((status === 'absent' || status === 'late') && notifyParent) {
    try {
      const guardian = await Guardian.findOne({
        'students.student': student,
        'students.isPrimary': true,
      })
        .populate('user', 'email')
        .lean();

      if (guardian) {
        const dateStr = new Date(date).toLocaleDateString('en-ET', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

        // In-app notification
        if (guardian.user?._id) {
          await notifyAbsence(
            `${studentDoc.firstName} ${studentDoc.fatherName}`,
            studentDoc.grade,
            dateStr,
            guardian.user._id,
            student
          );
        }

        // Email notification
        if (guardian.user?.email) {
          await sendAbsenceAlertEmail(
            guardian.user.email,
            `${guardian.firstName} ${guardian.fatherName}`,
            `${studentDoc.firstName} ${studentDoc.fatherName}`,
            studentDoc.grade,
            dateStr,
            status
          );
        }
      }
    } catch (notifyErr) {
      console.error('Notification failed:', notifyErr.message);
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Attendance marked as ${status}.`,
    data: { attendance },
  });
});

// ─── Bulk Mark Attendance ─────────────────────
exports.bulkMarkAttendance = catchAsync(async (req, res) => {
  const { date, section, grade, academicYear, term, attendances, notifyParents } = req.body;

  // Get active academic year and term if not provided
  let academicYearId = academicYear;
  let termId = term;

  if (!academicYearId) {
    const currentYear = await AcademicYear.getCurrent();
    academicYearId = currentYear?._id;
  }

  if (!termId) {
    const currentTerm = await Term.getCurrent();
    termId = currentTerm?._id;
  }

  if (!academicYearId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Academic year is required.',
    });
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const results = {
    marked: 0,
    updated: 0,
    errors: [],
  };

  const absentStudents = [];

  for (const record of attendances) {
    try {
      const student = await Student.findById(record.student)
        .select('firstName fatherName studentId grade guardians')
        .lean();

      if (!student) {
        results.errors.push({
          studentId: record.student,
          error: 'Student not found',
        });
        continue;
      }

      const existing = await Attendance.findOne({
        student: record.student,
        date: {
          $gte: attendanceDate,
          $lte: new Date(attendanceDate.getTime() + 86399999),
        },
      });

      if (existing) {
        await Attendance.findByIdAndUpdate(existing._id, {
          status: record.status,
          checkInTime: record.checkInTime || null,
          lateMinutes: record.lateMinutes || 0,
          isExcused: record.isExcused || false,
          excuseReason: record.excuseReason || null,
          remarks: record.remarks || null,
          updatedBy: req.user._id,
        });
        results.updated++;
      } else {
        await Attendance.create({
          student: record.student,
          studentName: `${student.firstName} ${student.fatherName}`,
          studentId: student.studentId,
          date: attendanceDate,
          status: record.status,
          section,
          grade,
          academicYear: academicYearId,
          term: termId,
          checkInTime: record.checkInTime || null,
          lateMinutes: record.lateMinutes || 0,
          isExcused: record.isExcused || false,
          excuseReason: record.excuseReason || null,
          remarks: record.remarks || null,
          markedBy: req.user._id,
          markedByName: `${req.user.firstName} ${req.user.fatherName}`,
          markedAt: new Date(),
          createdBy: req.user._id,
        });
        results.marked++;
      }

      // Track absent students for notification
      if (notifyParents && (record.status === 'absent' || record.status === 'late')) {
        absentStudents.push({
          studentId: record.student,
          studentName: `${student.firstName} ${student.fatherName}`,
          grade,
          status: record.status,
        });
      }
    } catch (error) {
      results.errors.push({
        studentId: record.student,
        error: error.message,
      });
    }
  }

  // Send notifications asynchronously
  if (absentStudents.length > 0) {
    const dateStr = new Date(date).toLocaleDateString('en-ET', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    setImmediate(async () => {
      for (const s of absentStudents) {
        try {
          const guardian = await Guardian.findOne({
            'students.student': s.studentId,
            'students.isPrimary': true,
          })
            .populate('user', 'email _id')
            .lean();

          if (guardian?.user?._id) {
            await notifyAbsence(s.studentName, s.grade, dateStr, guardian.user._id, s.studentId);
          }
        } catch (err) {
          console.error('Bulk notify error:', err.message);
        }
      }
    });
  }

  await auditLog({
    req,
    action: 'BULK_MARK',
    resource: 'attendance',
    description: `Bulk attendance marked for section: ${section} on ${date}. Marked: ${results.marked}, Updated: ${results.updated}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Attendance recorded. Marked: ${results.marked}, Updated: ${results.updated}`,
    data: results,
  });
});

// ─── Update Attendance ────────────────────────
exports.updateAttendance = catchAsync(async (req, res) => {
  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!attendance) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Attendance record not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance updated.',
    data: { attendance },
  });
});

// ─── Get Attendance by Date and Section ───────
exports.getAttendanceByDateSection = catchAsync(async (req, res) => {
  const { date, section, grade, academicYear } = req.query;

  if (!date) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Date is required.',
    });
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const filter = {
    date: {
      $gte: attendanceDate,
      $lte: new Date(attendanceDate.getTime() + 86399999),
    },
  };

  if (section) filter.section = section;
  if (grade) filter.grade = grade;
  if (academicYear) filter.academicYear = academicYear;

  const attendance = await Attendance.find(filter)
    .sort({ studentName: 1 })
    .populate('student', 'firstName fatherName studentId photo gender rollNumber')
    .lean();

  // Get all students in section if section provided
  let allStudents = [];
  if (section) {
    allStudents = await Student.find({
      section,
      status: 'active',
    })
      .sort({ firstName: 1 })
      .select('firstName fatherName studentId photo gender rollNumber')
      .lean();
  }

  const attendanceMap = {};
  attendance.forEach((a) => {
    attendanceMap[a.student?._id?.toString() || ''] = a;
  });

  const summary = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    excused: attendance.filter((a) => a.status === 'excused').length,
    onLeave: attendance.filter((a) => a.status === 'on_leave').length,
  };

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance fetched.',
    data: {
      date,
      attendance,
      allStudents,
      attendanceMap,
      summary,
    },
  });
});

// ─── Get Student Attendance Report ────────────
exports.getStudentAttendanceReport = catchAsync(async (req, res) => {
  const { startDate, endDate, academicYear, term } = req.query;
  const { studentId } = req.params;

  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const filter = { student: studentId };
  if (currentYear) filter.academicYear = currentYear;
  if (term) filter.term = term;

  if (startDate || endDate) {
    Object.assign(filter, buildDateRangeFilter(startDate, endDate, 'date'));
  }

  const attendance = await Attendance.find(filter).sort({ date: -1 }).lean();

  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    excused: attendance.filter((a) => a.status === 'excused').length,
    onLeave: attendance.filter((a) => a.status === 'on_leave').length,
  };

  stats.attendancePercentage =
    stats.total > 0
      ? Math.round(((stats.present + stats.late * 0.5) / stats.total) * 100 * 10) / 10
      : 0;

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student attendance report fetched.',
    data: { attendance, stats },
  });
});

// ─── Get Section Attendance Report ────────────
exports.getSectionAttendanceReport = catchAsync(async (req, res) => {
  const { section } = req.params;
  const { startDate, endDate, academicYear, term } = req.query;

  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const filter = { section };
  if (currentYear) filter.academicYear = currentYear;
  if (term) filter.term = term;
  if (startDate || endDate) {
    Object.assign(filter, buildDateRangeFilter(startDate, endDate, 'date'));
  }

  // Get student-wise attendance summary
  const attendanceSummary = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$student',
        studentName: { $first: '$studentName' },
        studentId: { $first: '$studentId' },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } },
        onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
      },
    },
    {
      $addFields: {
        attendancePercentage: {
          $cond: [
            { $gt: ['$total', 0] },
            {
              $multiply: [
                {
                  $divide: [{ $add: ['$present', { $multiply: ['$late', 0.5] }] }, '$total'],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: { studentName: 1 } },
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Section attendance report fetched.',
    data: { attendanceSummary },
  });
});

// ─── Get Attendance Dashboard Stats ───────────
exports.getAttendanceDashboard = catchAsync(async (req, res) => {
  const { academicYear } = req.query;
  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayStats, weeklyTrend, lowAttendanceStudents, absentToday] = await Promise.all([
    Attendance.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(currentYear),
          date: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Attendance.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(currentYear),
          date: {
            $gte: new Date(today.getTime() - 7 * 86400000),
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Attendance.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(currentYear),
          status: { $in: ['absent', 'late'] },
        },
      },
      {
        $group: {
          _id: '$student',
          studentName: { $first: '$studentName' },
          studentId: { $first: '$studentId' },
          grade: { $first: '$grade' },
          totalAbsent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      {
        $addFields: {
          absenceRate: {
            $multiply: [{ $divide: ['$totalAbsent', '$total'] }, 100],
          },
        },
      },
      { $match: { absenceRate: { $gt: 25 } } },
      { $sort: { absenceRate: -1 } },
      { $limit: 10 },
    ]),
    Attendance.find({
      date: { $gte: today, $lt: tomorrow },
      status: 'absent',
    })
      .populate('student', 'firstName fatherName studentId grade photo')
      .limit(20)
      .lean(),
  ]);

  const todayStatsMap = {};
  todayStats.forEach((s) => {
    todayStatsMap[s._id] = s.count;
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance dashboard fetched.',
    data: {
      today: {
        present: todayStatsMap.present || 0,
        absent: todayStatsMap.absent || 0,
        late: todayStatsMap.late || 0,
        excused: todayStatsMap.excused || 0,
        total: Object.values(todayStatsMap).reduce((a, b) => a + b, 0),
      },
      weeklyTrend,
      lowAttendanceStudents,
      absentToday,
    },
  });
});

// ═══════════════════════════════════════════
// STAFF ATTENDANCE
// ═══════════════════════════════════════════

exports.markTeacherAttendance = catchAsync(async (req, res) => {
  const {
    teacher,
    employee,
    date,
    status,
    checkInTime,
    checkOutTime,
    lateMinutes,
    isExcused,
    leaveApplication,
    remarks,
  } = req.body;

  const staffId = teacher || employee;
  const staffType = teacher ? 'teacher' : 'employee';

  // Validate staff exists
  const staffDoc = teacher
    ? await Teacher.findById(staffId).select('firstName fatherName teacherId')
    : await Employee.findById(staffId).select('firstName fatherName employeeId');

  if (!staffDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: `${staffType === 'teacher' ? 'Teacher' : 'Employee'} not found.`,
    });
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Check existing
  const existing = await TeacherAttendance.findOne({
    [staffType]: staffId,
    date: {
      $gte: attendanceDate,
      $lte: new Date(attendanceDate.getTime() + 86399999),
    },
  });

  let attendance;

  if (existing) {
    existing.status = status;
    existing.checkInTime = checkInTime || null;
    existing.checkOutTime = checkOutTime || null;
    existing.lateMinutes = lateMinutes || 0;
    existing.isExcused = isExcused || false;
    existing.leaveApplication = leaveApplication || null;
    existing.remarks = remarks || null;
    existing.updatedBy = req.user._id;
    await existing.save();
    attendance = existing;
  } else {
    attendance = await TeacherAttendance.create({
      [staffType]: staffId,
      staffType,
      staffName: `${staffDoc.firstName} ${staffDoc.fatherName}`,
      staffId: staffDoc.teacherId || staffDoc.employeeId,
      date: attendanceDate,
      status,
      checkInTime: checkInTime || null,
      checkOutTime: checkOutTime || null,
      lateMinutes: lateMinutes || 0,
      isExcused: isExcused || false,
      leaveApplication: leaveApplication || null,
      remarks: remarks || null,
      markedBy: req.user._id,
      markedAt: new Date(),
      createdBy: req.user._id,
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Staff attendance marked as ${status}.`,
    data: { attendance },
  });
});

exports.bulkMarkTeacherAttendance = catchAsync(async (req, res) => {
  const { date, attendances } = req.body;

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const results = { marked: 0, updated: 0, errors: [] };

  for (const record of attendances) {
    try {
      const staffType = record.staffType;
      const staffId = record.staffId;

      const staffDoc =
        staffType === 'teacher'
          ? await Teacher.findById(staffId).select('firstName fatherName teacherId').lean()
          : await Employee.findById(staffId).select('firstName fatherName employeeId').lean();

      if (!staffDoc) {
        results.errors.push({ staffId, error: 'Staff not found' });
        continue;
      }

      const existing = await TeacherAttendance.findOne({
        [staffType]: staffId,
        date: {
          $gte: attendanceDate,
          $lte: new Date(attendanceDate.getTime() + 86399999),
        },
      });

      if (existing) {
        await TeacherAttendance.findByIdAndUpdate(existing._id, {
          status: record.status,
          checkInTime: record.checkInTime || null,
          lateMinutes: record.lateMinutes || 0,
          isExcused: record.isExcused || false,
          remarks: record.remarks || null,
          updatedBy: req.user._id,
        });
        results.updated++;
      } else {
        await TeacherAttendance.create({
          [staffType]: staffId,
          staffType,
          staffName: `${staffDoc.firstName} ${staffDoc.fatherName}`,
          staffId: staffDoc.teacherId || staffDoc.employeeId,
          date: attendanceDate,
          status: record.status,
          checkInTime: record.checkInTime || null,
          lateMinutes: record.lateMinutes || 0,
          isExcused: record.isExcused || false,
          remarks: record.remarks || null,
          markedBy: req.user._id,
          markedAt: new Date(),
          createdBy: req.user._id,
        });
        results.marked++;
      }
    } catch (error) {
      results.errors.push({ staffId: record.staffId, error: error.message });
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Staff attendance recorded. Marked: ${results.marked}, Updated: ${results.updated}`,
    data: results,
  });
});

exports.getStaffAttendanceReport = catchAsync(async (req, res) => {
  const { staffType, staffId, month, year } = req.query;
  const currentDate = new Date();
  const queryMonth = parseInt(month) || currentDate.getMonth() + 1;
  const queryYear = parseInt(year) || currentDate.getFullYear();

  const startDate = new Date(queryYear, queryMonth - 1, 1);
  const endDate = new Date(queryYear, queryMonth, 0, 23, 59, 59);

  const filter = {
    date: { $gte: startDate, $lte: endDate },
  };

  if (staffType) filter.staffType = staffType;
  if (staffId) filter[staffType || 'teacher'] = staffId;

  const attendance = await TeacherAttendance.find(filter)
    .sort({ date: 1 })
    .populate('teacher', 'firstName fatherName teacherId photo primarySubject')
    .populate('employee', 'firstName fatherName employeeId photo departmentName')
    .lean();

  const statsByStaff = {};
  attendance.forEach((a) => {
    const key = a.teacher?._id?.toString() || a.employee?._id?.toString() || 'unknown';
    if (!statsByStaff[key]) {
      statsByStaff[key] = {
        staff: a.teacher || a.employee,
        staffName: a.staffName,
        staffId: a.staffId,
        staffType: a.staffType,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        onLeave: 0,
        halfDay: 0,
      };
    }
    statsByStaff[key].total++;
    statsByStaff[key][
      a.status === 'on_leave' ? 'onLeave' : a.status === 'half_day' ? 'halfDay' : a.status
    ] =
      (statsByStaff[key][
        a.status === 'on_leave' ? 'onLeave' : a.status === 'half_day' ? 'halfDay' : a.status
      ] || 0) + 1;
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Staff attendance report fetched.',
    data: {
      month: queryMonth,
      year: queryYear,
      attendance,
      statsByStaff: Object.values(statsByStaff),
    },
  });
});

// ═══════════════════════════════════════════
// HOLIDAYS
// ═══════════════════════════════════════════

exports.createHoliday = catchAsync(async (req, res) => {
  const { name, startDate, endDate, type, academicYear, description, affectsAttendance } = req.body;

  const academicYearDoc = await AcademicYear.findById(academicYear);
  if (!academicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  const holiday = await Holiday.create({
    name,
    startDate,
    endDate,
    type,
    academicYear,
    academicYearName: academicYearDoc.name,
    description,
    affectsAttendance: affectsAttendance !== false,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Holiday created.',
    data: { holiday },
  });
});

exports.getAllHolidays = catchAsync(async (req, res) => {
  const { academicYear, type } = req.query;
  const filter = {};
  if (academicYear) filter.academicYear = academicYear;
  if (type) filter.type = type;

  const holidays = await Holiday.find(filter).sort({ startDate: 1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Holidays fetched.',
    data: { holidays },
  });
});

exports.updateHoliday = catchAsync(async (req, res) => {
  const holiday = await Holiday.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!holiday) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Holiday not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Holiday updated.',
    data: { holiday },
  });
});

exports.deleteHoliday = catchAsync(async (req, res) => {
  await Holiday.findByIdAndDelete(req.params.id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Holiday deleted.',
  });
});

// ═══════════════════════════════════════════
// ATTENDANCE SETTINGS
// ═══════════════════════════════════════════

exports.getAttendanceSettings = catchAsync(async (req, res) => {
  let settings = await AttendanceSettings.findOne();
  if (!settings) {
    settings = await AttendanceSettings.create({
      lateThresholdMinutes: 15,
      notifyParentOnAbsence: true,
      notifyParentOnLate: false,
      minimumAttendancePercentage: 75,
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      schoolStartTime: '07:45',
      schoolEndTime: '17:00',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance settings fetched.',
    data: { settings },
  });
});

exports.updateAttendanceSettings = catchAsync(async (req, res) => {
  let settings = await AttendanceSettings.findOne();

  if (!settings) {
    settings = await AttendanceSettings.create({
      ...req.body,
      updatedBy: req.user._id,
    });
  } else {
    Object.assign(settings, req.body);
    settings.updatedBy = req.user._id;
    await settings.save();
  }

  await auditLog({
    req,
    action: 'UPDATE_SETTINGS',
    resource: 'attendance_settings',
    description: 'Attendance settings updated',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance settings updated.',
    data: { settings },
  });
});
