// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// STUDENT ATTENDANCE MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { ATTENDANCE_STATUS, ATTENDANCE_STATUS_COLORS, GRADE_NAMES } = require('../config/constants');

const attendanceSchema = new mongoose.Schema(
  {
    // ─── Student ──────────────────────────────
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
      index: true,
    },

    // Cached student info for quick reporting
    studentName: {
      type: String,
      trim: true,
    },

    studentId: {
      type: String,
      trim: true,
      index: true,
    },

    // ─── Class & Section ──────────────────────
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      index: true,
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section is required'],
      index: true,
    },

    sectionName: {
      type: String,
      trim: true,
    },

    grade: {
      type: String,
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      index: true,
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
      index: true,
    },

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      required: [true, 'Term is required'],
      index: true,
    },

    // ─── Date ─────────────────────────────────
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },

    // Day of the week
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },

    // Ethiopian calendar date fields
    ethiopianDate: {
      day: { type: Number },
      month: { type: Number },
      year: { type: Number },
      monthName: { type: String, trim: true },
    },

    // ─── Attendance Status ────────────────────
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(ATTENDANCE_STATUS),
        message: '{VALUE} is not a valid status',
      },
      default: ATTENDANCE_STATUS.PRESENT,
      index: true,
    },

    // ─── Absence Details ──────────────────────
    // Reason for absence or late arrival
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      default: null,
    },

    // Type of absence
    absenceType: {
      type: String,
      enum: ['Sick', 'Family Emergency', 'Religious Holiday', 'Official', 'Unknown', 'Other', ''],
      default: '',
    },

    // Whether absence is excused officially
    isExcused: {
      type: Boolean,
      default: false,
    },

    // Supporting document for excuse
    excuseDocument: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },

    // ─── Late Arrival ─────────────────────────
    // Time arrived if late
    arrivalTime: {
      type: String,
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
      default: null,
    },

    // Minutes late
    minutesLate: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Period-wise Attendance ───────────────
    // For tracking attendance per period
    // (more detailed tracking)
    periodAttendance: [
      {
        period: {
          type: Number,
          min: 1,
          max: 12,
        },
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        subjectName: { type: String, trim: true },
        status: {
          type: String,
          enum: Object.values(ATTENDANCE_STATUS),
          default: ATTENDANCE_STATUS.PRESENT,
        },
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
        },
      },
    ],

    // ─── Marked By ────────────────────────────
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marked by is required'],
    },

    markedByName: {
      type: String,
      trim: true,
    },

    markedAt: {
      type: Date,
      default: Date.now,
    },

    // Whether attendance was marked late
    // (after school hours)
    isLateMarking: {
      type: Boolean,
      default: false,
    },

    // ─── Edit History ─────────────────────────
    // Track changes to attendance records
    editHistory: [
      {
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        editedAt: { type: Date },
        previousStatus: {
          type: String,
          enum: Object.values(ATTENDANCE_STATUS),
        },
        newStatus: {
          type: String,
          enum: Object.values(ATTENDANCE_STATUS),
        },
        reason: { type: String, trim: true },
      },
    ],

    // ─── Notification ─────────────────────────
    // Whether parent was notified of absence
    parentNotified: {
      type: Boolean,
      default: false,
    },

    parentNotifiedAt: {
      type: Date,
      default: null,
    },

    parentNotificationMethod: {
      type: String,
      enum: ['SMS', 'Email', 'Both', 'None', ''],
      default: '',
    },

    // ─── Notes ────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },

    // ─── Audit ────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound Indexes ─────────────────────────
// Prevent duplicate attendance for same student/date
attendanceSchema.index(
  {
    student: 1,
    date: 1,
    section: 1,
  },
  { unique: true }
);

attendanceSchema.index({
  section: 1,
  date: 1,
  status: 1,
});

attendanceSchema.index({
  student: 1,
  academicYear: 1,
  term: 1,
});

attendanceSchema.index({
  section: 1,
  academicYear: 1,
  term: 1,
});

attendanceSchema.index({
  grade: 1,
  date: 1,
  status: 1,
});

attendanceSchema.index({
  academicYear: 1,
  term: 1,
  date: 1,
});

attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ parentNotified: 1 });

// ─── Virtuals ─────────────────────────────────
// Status color for UI
attendanceSchema.virtual('statusColor').get(function () {
  return ATTENDANCE_STATUS_COLORS[this.status] || '#6b7280';
});

// Is absent
attendanceSchema.virtual('isAbsent').get(function () {
  return this.status === ATTENDANCE_STATUS.ABSENT;
});

// Is present
attendanceSchema.virtual('isPresent').get(function () {
  return this.status === ATTENDANCE_STATUS.PRESENT;
});

// Is late
attendanceSchema.virtual('isLate').get(function () {
  return this.status === ATTENDANCE_STATUS.LATE;
});

// Formatted date
attendanceSchema.virtual('formattedDate').get(function () {
  if (!this.date) return '';
  return new Date(this.date).toLocaleDateString('en-ET', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// ─── Pre-Save Hook ────────────────────────────
attendanceSchema.pre('save', function (next) {
  // Auto-set day of week
  if (this.isModified('date') && this.date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.dayOfWeek = days[new Date(this.date).getDay()];
  }

  // Auto-set isExcused when status is excused
  if (this.isModified('status') && this.status === ATTENDANCE_STATUS.EXCUSED) {
    this.isExcused = true;
  }

  // Set markedAt if not set
  if (this.isNew && !this.markedAt) {
    this.markedAt = new Date();
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Mark attendance for entire section at once
attendanceSchema.statics.markSectionAttendance = async function (
  sectionId,
  date,
  attendanceData,
  markedBy,
  markedByName,
  academicYearId,
  termId,
  classId,
  grade
) {
  const results = {
    marked: 0,
    updated: 0,
    errors: [],
  };

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[attendanceDate.getDay()];

  for (const record of attendanceData) {
    try {
      const existing = await this.findOne({
        student: record.studentId,
        date: attendanceDate,
        section: sectionId,
      });

      if (existing) {
        // Track edit history
        if (existing.status !== record.status) {
          existing.editHistory.push({
            editedBy: markedBy,
            editedAt: new Date(),
            previousStatus: existing.status,
            newStatus: record.status,
            reason: record.reason || 'Corrected',
          });
          existing.status = record.status;
          existing.reason = record.reason || existing.reason;
          existing.updatedBy = markedBy;
          await existing.save();
          results.updated++;
        }
      } else {
        await this.create({
          student: record.studentId,
          studentName: record.studentName,
          studentId: record.studentDisplayId,
          class: classId,
          section: sectionId,
          sectionName: record.sectionName,
          grade,
          academicYear: academicYearId,
          term: termId,
          date: attendanceDate,
          dayOfWeek,
          status: record.status,
          reason: record.reason || null,
          arrivalTime: record.arrivalTime || null,
          minutesLate: record.minutesLate || 0,
          markedBy,
          markedByName,
          markedAt: new Date(),
          createdBy: markedBy,
        });
        results.marked++;
      }
    } catch (error) {
      results.errors.push({
        student: record.studentId,
        error: error.message,
      });
    }
  }

  return results;
};

// Get attendance for a section on a specific date
attendanceSchema.statics.getSectionDayAttendance = function (sectionId, date) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return this.find({
    section: sectionId,
    date: {
      $gte: attendanceDate,
      $lt: nextDay,
    },
  })
    .sort({ studentName: 1 })
    .populate('student', 'firstName fatherName studentId photo')
    .populate('markedBy', 'firstName fatherName');
};

// Get student attendance summary for a term
attendanceSchema.statics.getStudentTermSummary = async function (studentId, termId) {
  const stats = await this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        term: new mongoose.Types.ObjectId(termId),
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
          },
        },
        late: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
          },
        },
        excused: {
          $sum: {
            $cond: [{ $eq: ['$status', 'excused'] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      percentage: 0,
    };
  }

  const s = stats[0];
  const percentage = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;

  return { ...s, percentage };
};

// Get monthly attendance for a student
attendanceSchema.statics.getStudentMonthlyAttendance = async function (
  studentId,
  year,
  month,
  academicYearId
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return this.find({
    student: studentId,
    academicYear: academicYearId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });
};

// Get attendance report for section in date range
attendanceSchema.statics.getSectionReport = async function (
  sectionId,
  startDate,
  endDate,
  academicYearId
) {
  return this.aggregate([
    {
      $match: {
        section: new mongoose.Types.ObjectId(sectionId),
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: '$student',
        studentName: { $first: '$studentName' },
        studentId: { $first: '$studentId' },
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
          },
        },
        late: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
          },
        },
        excused: {
          $sum: {
            $cond: [{ $eq: ['$status', 'excused'] }, 1, 0],
          },
        },
      },
    },
    {
      $addFields: {
        percentage: {
          $multiply: [{ $divide: ['$present', '$total'] }, 100],
        },
      },
    },
    { $sort: { studentName: 1 } },
  ]);
};

// Get students with low attendance
attendanceSchema.statics.getLowAttendanceStudents = async function (
  sectionId,
  academicYearId,
  termId,
  threshold = 75
) {
  const report = await this.aggregate([
    {
      $match: {
        section: new mongoose.Types.ObjectId(sectionId),
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        term: new mongoose.Types.ObjectId(termId),
      },
    },
    {
      $group: {
        _id: '$student',
        studentName: { $first: '$studentName' },
        studentId: { $first: '$studentId' },
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
          },
        },
      },
    },
    {
      $addFields: {
        percentage: {
          $multiply: [{ $divide: ['$present', '$total'] }, 100],
        },
      },
    },
    {
      $match: {
        percentage: { $lt: threshold },
      },
    },
    { $sort: { percentage: 1 } },
  ]);

  return report;
};

// Get daily attendance summary for a section
attendanceSchema.statics.getDailySummary = async function (sectionId, date) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const stats = await this.aggregate([
    {
      $match: {
        section: new mongoose.Types.ObjectId(sectionId),
        date: {
          $gte: attendanceDate,
          $lt: nextDay,
        },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
  };

  stats.forEach((s) => {
    summary[s._id] = s.count;
    summary.total += s.count;
  });

  summary.presentPercentage =
    summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  return summary;
};

// Get absentees who were not notified
attendanceSchema.statics.getUnnotifiedAbsences = function (date) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return this.find({
    date: { $gte: attendanceDate, $lt: nextDay },
    status: ATTENDANCE_STATUS.ABSENT,
    parentNotified: false,
  })
    .populate('student', 'firstName fatherName guardian.phone guardian.email guardian.name')
    .populate('section', 'fullName grade');
};

// Mark parent as notified
attendanceSchema.statics.markParentNotified = async function (attendanceId, method) {
  return this.findByIdAndUpdate(
    attendanceId,
    {
      parentNotified: true,
      parentNotifiedAt: new Date(),
      parentNotificationMethod: method,
    },
    { new: true }
  );
};

// Get attendance trend for AI analysis
attendanceSchema.statics.getStudentAttendanceTrend = async function (studentId, academicYearId) {
  return this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        academicYear: new mongoose.Types.ObjectId(academicYearId),
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          year: { $year: '$date' },
        },
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
          },
        },
      },
    },
    {
      $addFields: {
        percentage: {
          $multiply: [{ $divide: ['$present', '$total'] }, 100],
        },
      },
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
      },
    },
  ]);
};

// Get school-wide attendance for dashboard
attendanceSchema.statics.getSchoolWideSummary = async function (date, academicYearId) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const stats = await this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        date: {
          $gte: attendanceDate,
          $lt: nextDay,
        },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
  };

  stats.forEach((s) => {
    summary[s._id] = s.count;
    summary.total += s.count;
  });

  summary.attendanceRate =
    summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  return summary;
};

// Get attendance heatmap data for a student
attendanceSchema.statics.getAttendanceHeatmap = async function (studentId, academicYearId) {
  return this.find({
    student: studentId,
    academicYear: academicYearId,
  })
    .select('date status dayOfWeek')
    .sort({ date: 1 });
};

// Check if attendance was already marked today
attendanceSchema.statics.isAlreadyMarked = async function (sectionId, date) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const count = await this.countDocuments({
    section: sectionId,
    date: {
      $gte: attendanceDate,
      $lt: nextDay,
    },
  });

  return count > 0;
};

// Get consecutive absences for alert system
attendanceSchema.statics.getConsecutiveAbsences = async function (studentId, minDays = 3) {
  const records = await this.find({
    student: studentId,
    status: ATTENDANCE_STATUS.ABSENT,
  })
    .sort({ date: -1 })
    .limit(30);

  let consecutive = 0;
  let prevDate = null;

  for (const record of records) {
    const recDate = new Date(record.date);
    if (!prevDate) {
      consecutive = 1;
      prevDate = recDate;
      continue;
    }

    const dayDiff = Math.round((prevDate - recDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1 || dayDiff === 3) {
      // Allow for weekends
      consecutive++;
      prevDate = recDate;
    } else {
      break;
    }
  }

  return {
    consecutive,
    isAlert: consecutive >= minDays,
  };
};

// Get dashboard stats
attendanceSchema.statics.getDashboardStats = async function (academicYearId, termId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const match = {
    academicYear: new mongoose.Types.ObjectId(academicYearId),
  };
  if (termId) {
    match.term = new mongoose.Types.ObjectId(termId);
  }

  const [todayStats, termStats] = await Promise.all([
    this.aggregate([
      {
        $match: {
          ...match,
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
    this.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const formatStats = (stats) => {
    const result = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0,
    };
    stats.forEach((s) => {
      result[s._id] = s.count;
      result.total += s.count;
    });
    result.rate = result.total > 0 ? Math.round((result.present / result.total) * 100) : 0;
    return result;
  };

  return {
    today: formatStats(todayStats),
    term: formatStats(termStats),
  };
};

// ─── Instance Methods ─────────────────────────

// Add edit history
attendanceSchema.methods.addEdit = async function (userId, previousStatus, newStatus, reason) {
  this.editHistory.push({
    editedBy: userId,
    editedAt: new Date(),
    previousStatus,
    newStatus,
    reason,
  });
  this.status = newStatus;
  this.updatedBy = userId;
  await this.save();
  return this;
};

// Mark parent as notified
attendanceSchema.methods.notifyParent = async function (method) {
  this.parentNotified = true;
  this.parentNotifiedAt = new Date();
  this.parentNotificationMethod = method;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Get status display
attendanceSchema.methods.getStatusDisplay = function () {
  const displays = {
    present: '✅ Present',
    absent: '❌ Absent',
    late: '⏰ Late',
    excused: '📋 Excused',
    holiday: '🎉 Holiday',
  };
  return displays[this.status] || this.status;
};

// ─── Create Model ─────────────────────────────
const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
