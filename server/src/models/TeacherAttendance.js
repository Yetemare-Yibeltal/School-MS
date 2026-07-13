// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TEACHER ATTENDANCE MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema(
  {
    // ─── Staff Member ─────────────────────────
    // Can be teacher or employee
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
      index: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },

    // Cached staff info
    staffName: {
      type: String,
      trim: true,
    },

    staffId: {
      type: String,
      trim: true,
      index: true,
    },

    // Staff type
    staffType: {
      type: String,
      enum: ['teacher', 'employee'],
      required: [true, 'Staff type is required'],
      index: true,
    },

    // Department (for employees)
    department: {
      type: String,
      trim: true,
      default: null,
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
      default: null,
      index: true,
    },

    // ─── Date ─────────────────────────────────
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },

    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },

    // ─── Attendance Status ────────────────────
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: [
          'present',
          'absent',
          'late',
          'half_day',
          'on_leave',
          'holiday',
          'work_from_home',
          'official_duty',
        ],
        message: '{VALUE} is not a valid status',
      },
      default: 'present',
      index: true,
    },

    // ─── Time Tracking ────────────────────────
    // Time arrived at school
    arrivalTime: {
      type: String,
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
      default: null,
    },

    // Time departed from school
    departureTime: {
      type: String,
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
      default: null,
    },

    // Total working hours
    workingHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },

    // Expected working hours
    expectedHours: {
      type: Number,
      default: 8,
    },

    // Minutes late
    minutesLate: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Leave Reference ──────────────────────
    // If status is on_leave link to leave application
    leaveApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveApplication',
      default: null,
    },

    leaveType: {
      type: String,
      trim: true,
      default: null,
    },

    isPaidLeave: {
      type: Boolean,
      default: true,
    },

    // ─── Absence Details ──────────────────────
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      default: null,
    },

    isExcused: {
      type: Boolean,
      default: false,
    },

    // Supporting document
    excuseDocument: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    // ─── Half Day ────────────────────────────
    halfDayType: {
      type: String,
      enum: ['morning', 'afternoon', ''],
      default: '',
    },

    // ─── Official Duty ────────────────────────
    officialDutyDetails: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Substitute ──────────────────────────
    // If absent, who substituted
    substituteTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    substituteTeacherName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Payroll Impact ──────────────────────
    // Whether this absence affects salary
    affectsSalary: {
      type: Boolean,
      default: false,
    },

    // Deduction amount if affects salary
    salaryDeductionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Whether deduction was applied in payroll
    deductionApplied: {
      type: Boolean,
      default: false,
    },

    payrollMonth: {
      type: String,
      default: null,
      // Format: "YYYY-MM"
    },

    // ─── Marked By ───────────────────────────
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    markedByName: {
      type: String,
      trim: true,
      default: null,
    },

    markedAt: {
      type: Date,
      default: Date.now,
    },

    // ─── Edit History ─────────────────────────
    editHistory: [
      {
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        editedAt: { type: Date },
        previousStatus: { type: String },
        newStatus: { type: String },
        reason: { type: String, trim: true },
      },
    ],

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },

    // ─── Audit ───────────────────────────────
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
// Prevent duplicate attendance per staff per date
teacherAttendanceSchema.index(
  {
    teacher: 1,
    date: 1,
  },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      teacher: { $exists: true, $ne: null },
    },
  }
);

teacherAttendanceSchema.index(
  {
    employee: 1,
    date: 1,
  },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      employee: { $exists: true, $ne: null },
    },
  }
);

teacherAttendanceSchema.index({
  staffType: 1,
  date: 1,
  status: 1,
});

teacherAttendanceSchema.index({
  teacher: 1,
  academicYear: 1,
  term: 1,
});

teacherAttendanceSchema.index({
  employee: 1,
  academicYear: 1,
});

teacherAttendanceSchema.index({
  date: -1,
  status: 1,
});

teacherAttendanceSchema.index({
  payrollMonth: 1,
  affectsSalary: 1,
});

// ─── Virtuals ─────────────────────────────────
// Is present
teacherAttendanceSchema.virtual('isPresent').get(function () {
  return (
    this.status === 'present' || this.status === 'work_from_home' || this.status === 'official_duty'
  );
});

// Is absent
teacherAttendanceSchema.virtual('isAbsent').get(function () {
  return this.status === 'absent' || (this.status === 'half_day' && this.halfDayType === 'morning');
});

// Is on leave
teacherAttendanceSchema.virtual('isOnLeave').get(function () {
  return this.status === 'on_leave';
});

// Working hours display
teacherAttendanceSchema.virtual('workingHoursDisplay').get(function () {
  const hours = Math.floor(this.workingHours);
  const minutes = Math.round((this.workingHours - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// Formatted date
teacherAttendanceSchema.virtual('formattedDate').get(function () {
  if (!this.date) return '';
  return new Date(this.date).toLocaleDateString('en-ET', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// ─── Pre-Save Hook ────────────────────────────
teacherAttendanceSchema.pre('save', function (next) {
  // Auto-set day of week
  if (this.isModified('date') && this.date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.dayOfWeek = days[new Date(this.date).getDay()];
  }

  // Auto-calculate working hours
  if (this.isModified('arrivalTime') || this.isModified('departureTime')) {
    if (this.arrivalTime && this.departureTime) {
      const [ah, am] = this.arrivalTime.split(':').map(Number);
      const [dh, dm] = this.departureTime.split(':').map(Number);
      const arrivalMinutes = ah * 60 + am;
      const departureMinutes = dh * 60 + dm;

      if (departureMinutes > arrivalMinutes) {
        this.workingHours = parseFloat(((departureMinutes - arrivalMinutes) / 60).toFixed(2));
      }
    }
  }

  // Auto-calculate minutes late
  if (this.isModified('arrivalTime') && this.arrivalTime) {
    const expectedArrival = '07:45';
    const [eh, em] = expectedArrival.split(':').map(Number);
    const [ah, am] = this.arrivalTime.split(':').map(Number);
    const expectedMinutes = eh * 60 + em;
    const actualMinutes = ah * 60 + am;

    if (actualMinutes > expectedMinutes) {
      this.minutesLate = actualMinutes - expectedMinutes;
      if (this.minutesLate > 15) {
        this.status = 'late';
      }
    }
  }

  // Set affectsSalary for absent without excuse
  if (this.isModified('status')) {
    if (this.status === 'absent' && !this.isExcused) {
      this.affectsSalary = true;
    } else {
      this.affectsSalary = false;
    }
  }

  // Set markedAt if not set
  if (this.isNew && !this.markedAt) {
    this.markedAt = new Date();
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Mark attendance for all teachers at once
teacherAttendanceSchema.statics.markBulkAttendance = async function (
  attendanceData,
  markedBy,
  markedByName
) {
  const results = {
    marked: 0,
    updated: 0,
    errors: [],
  };

  for (const record of attendanceData) {
    try {
      const query = record.teacher
        ? { teacher: record.teacher, date: record.date }
        : { employee: record.employee, date: record.date };

      const existing = await this.findOne(query);

      if (existing) {
        if (existing.status !== record.status) {
          existing.editHistory.push({
            editedBy: markedBy,
            editedAt: new Date(),
            previousStatus: existing.status,
            newStatus: record.status,
            reason: 'Updated by admin',
          });
          existing.status = record.status;
          existing.updatedBy = markedBy;
          await existing.save();
          results.updated++;
        }
      } else {
        await this.create({
          ...record,
          markedBy,
          markedByName,
          markedAt: new Date(),
          createdBy: markedBy,
        });
        results.marked++;
      }
    } catch (error) {
      results.errors.push({
        staff: record.teacher || record.employee,
        error: error.message,
      });
    }
  }

  return results;
};

// Get teacher attendance for a date
teacherAttendanceSchema.statics.getByDate = function (date, staffType = null) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const query = {
    date: { $gte: attendanceDate, $lt: nextDay },
  };

  if (staffType) {
    query.staffType = staffType;
  }

  return this.find(query)
    .sort({ staffName: 1 })
    .populate('teacher', 'firstName fatherName teacherId photo primarySubject')
    .populate('employee', 'firstName fatherName employeeId photo departmentName');
};

// Get monthly summary for a teacher
teacherAttendanceSchema.statics.getTeacherMonthlySummary = async function (teacherId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const stats = await this.aggregate([
    {
      $match: {
        teacher: new mongoose.Types.ObjectId(teacherId),
        date: {
          $gte: startDate,
          $lte: endDate,
        },
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
        onLeave: {
          $sum: {
            $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0],
          },
        },
        halfDay: {
          $sum: {
            $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0],
          },
        },
        totalWorkingHours: {
          $sum: '$workingHours',
        },
        daysAffectingSalary: {
          $sum: {
            $cond: [{ $eq: ['$affectsSalary', true] }, 1, 0],
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
      onLeave: 0,
      halfDay: 0,
      totalWorkingHours: 0,
      daysAffectingSalary: 0,
      attendanceRate: 0,
    };
  }

  const s = stats[0];
  s.attendanceRate = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;

  return s;
};

// Get all absent teachers for a date
teacherAttendanceSchema.statics.getAbsentStaff = function (date) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return this.find({
    date: { $gte: attendanceDate, $lt: nextDay },
    status: 'absent',
  })
    .populate('teacher', 'firstName fatherName teacherId primarySubject')
    .populate('employee', 'firstName fatherName employeeId departmentName');
};

// Get attendance for payroll processing
teacherAttendanceSchema.statics.getForPayroll = async function (staffId, staffType, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const query = {
    date: { $gte: startDate, $lte: endDate },
  };

  if (staffType === 'teacher') {
    query.teacher = staffId;
  } else {
    query.employee = staffId;
  }

  const records = await this.find(query).sort({
    date: 1,
  });

  const summary = {
    totalDays: records.length,
    presentDays: records.filter((r) => r.status === 'present').length,
    absentDays: records.filter((r) => r.status === 'absent').length,
    lateDays: records.filter((r) => r.status === 'late').length,
    leaveDays: records.filter((r) => r.status === 'on_leave').length,
    halfDays: records.filter((r) => r.status === 'half_day').length,
    unauthorizedAbsences: records.filter((r) => r.affectsSalary).length,
    totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
    records,
  };

  return summary;
};

// Get school-wide attendance summary for a date
teacherAttendanceSchema.statics.getSchoolSummary = async function (date) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const stats = await this.aggregate([
    {
      $match: {
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
    on_leave: 0,
    half_day: 0,
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

// Get attendance trend for AI analysis
teacherAttendanceSchema.statics.getAttendanceTrend = async function (teacherId, academicYearId) {
  return this.aggregate([
    {
      $match: {
        teacher: new mongoose.Types.ObjectId(teacherId),
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
        avgWorkingHours: {
          $avg: '$workingHours',
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

// Check if already marked for today
teacherAttendanceSchema.statics.isAlreadyMarked = async function (staffId, staffType, date) {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(attendanceDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const query = {
    date: { $gte: attendanceDate, $lt: nextDay },
  };

  if (staffType === 'teacher') {
    query.teacher = staffId;
  } else {
    query.employee = staffId;
  }

  const existing = await this.findOne(query);
  return !!existing;
};

// Get dashboard stats
teacherAttendanceSchema.statics.getDashboardStats = async function (academicYearId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayStats, monthStats] = await Promise.all([
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
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
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          date: {
            $gte: new Date(today.getFullYear(), today.getMonth(), 1),
            $lte: today,
          },
        },
      },
      {
        $group: {
          _id: '$staffType',
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const formatStats = (stats) => {
    const result = {
      present: 0,
      absent: 0,
      late: 0,
      on_leave: 0,
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
    month: monthStats,
  };
};

// ─── Instance Methods ─────────────────────────

// Add edit to history
teacherAttendanceSchema.methods.addEdit = async function (
  userId,
  previousStatus,
  newStatus,
  reason
) {
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

// Calculate salary deduction for this absence
teacherAttendanceSchema.methods.calculateDeduction = async function (dailySalary) {
  if (!this.affectsSalary) return 0;

  if (this.status === 'half_day') {
    this.salaryDeductionAmount = dailySalary / 2;
  } else if (this.status === 'absent') {
    this.salaryDeductionAmount = dailySalary;
  }

  await this.save({ validateBeforeSave: false });
  return this.salaryDeductionAmount;
};

// Mark deduction as applied in payroll
teacherAttendanceSchema.methods.applyDeduction = async function (payrollMonth) {
  this.deductionApplied = true;
  this.payrollMonth = payrollMonth;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Get status display
teacherAttendanceSchema.methods.getStatusDisplay = function () {
  const displays = {
    present: '✅ Present',
    absent: '❌ Absent',
    late: '⏰ Late',
    half_day: '½ Half Day',
    on_leave: '📋 On Leave',
    holiday: '🎉 Holiday',
    work_from_home: '🏠 Work From Home',
    official_duty: '🏢 Official Duty',
  };
  return displays[this.status] || this.status;
};

// ─── Create Model ─────────────────────────────
const TeacherAttendance = mongoose.model('TeacherAttendance', teacherAttendanceSchema);

module.exports = TeacherAttendance;
