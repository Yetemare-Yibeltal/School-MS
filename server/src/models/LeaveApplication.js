// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LEAVE APPLICATION MODEL
// kat-school/server/src/models/LeaveApplication.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema(
  {
    // ─── Application Identity ─────────────────
    applicationNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ─── Applicant ────────────────────────────
    staffType: {
      type: String,
      enum: ['teacher', 'employee'],
      required: [true, 'Staff type is required'],
      index: true,
    },

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
    },

    department: {
      type: String,
      trim: true,
      default: null,
    },

    designation: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Leave Type ───────────────────────────
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: [true, 'Leave type is required'],
      index: true,
    },

    leaveTypeName: {
      type: String,
      trim: true,
    },

    leaveTypeCode: {
      type: String,
      trim: true,
    },

    isPaidLeave: {
      type: Boolean,
      default: true,
    },

    // ─── Dates ───────────────────────────────
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (endDate) {
          return endDate >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },

    // Number of days requested
    numberOfDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [0.5, 'Minimum 0.5 days required'],
    },

    // Is this a half day leave
    isHalfDay: {
      type: Boolean,
      default: false,
    },

    halfDayType: {
      type: String,
      enum: ['morning', 'afternoon', ''],
      default: '',
    },

    // ─── Reason ──────────────────────────────
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },

    // ─── Contact During Leave ─────────────────
    contactDuringLeave: {
      type: String,
      trim: true,
      default: null,
    },

    contactAddress: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Handover ────────────────────────────
    // Who will handle work during absence
    handoverTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    handoverToName: {
      type: String,
      trim: true,
      default: null,
    },

    handoverNotes: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Supporting Document ──────────────────
    document: {
      name: { type: String, trim: true },
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
      index: true,
    },

    academicYearName: {
      type: String,
      trim: true,
      default: null,
    },

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      default: null,
    },

    termName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Status & Approval ────────────────────
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled', 'on_hold'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },

    // First-level approval (HR Manager)
    firstApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      approvedByName: {
        type: String,
        trim: true,
        default: null,
      },
      approvedAt: {
        type: Date,
        default: null,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', ''],
        default: 'pending',
      },
      remarks: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // Second-level approval (Principal/Director)
    // Required for leaves > 7 days
    secondApproval: {
      required: {
        type: Boolean,
        default: false,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      approvedByName: {
        type: String,
        trim: true,
        default: null,
      },
      approvedAt: {
        type: Date,
        default: null,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', ''],
        default: '',
      },
      remarks: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // Rejection reason
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Balance Impact ───────────────────────
    // Leave balance before approval
    balanceBefore: {
      type: Number,
      default: null,
    },

    // Leave balance after approval
    balanceAfter: {
      type: Number,
      default: null,
    },

    // Whether balance has been deducted
    balanceDeducted: {
      type: Boolean,
      default: false,
    },

    balanceDeductedAt: {
      type: Date,
      default: null,
    },

    // ─── Attendance Auto-Mark ─────────────────
    // Whether attendance has been auto-marked
    attendanceMarked: {
      type: Boolean,
      default: false,
    },

    attendanceMarkedAt: {
      type: Date,
      default: null,
    },

    // ─── Cancellation ─────────────────────────
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },

    // Whether cancelled after approval (balance restored)
    balanceRestored: {
      type: Boolean,
      default: false,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // ─── Audit ───────────────────────────────
    appliedAt: {
      type: Date,
      default: Date.now,
    },

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
leaveApplicationSchema.index({
  teacher: 1,
  status: 1,
  startDate: -1,
});

leaveApplicationSchema.index({
  employee: 1,
  status: 1,
  startDate: -1,
});

leaveApplicationSchema.index({
  leaveType: 1,
  status: 1,
});

leaveApplicationSchema.index({
  academicYear: 1,
  status: 1,
});

leaveApplicationSchema.index({
  startDate: 1,
  endDate: 1,
});

leaveApplicationSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Is currently on leave
leaveApplicationSchema.virtual('isCurrentlyActive').get(function () {
  const today = new Date();
  return (
    this.status === 'approved' &&
    new Date(this.startDate) <= today &&
    new Date(this.endDate) >= today
  );
});

// Is upcoming
leaveApplicationSchema.virtual('isUpcoming').get(function () {
  return this.status === 'approved' && new Date(this.startDate) > new Date();
});

// Is past
leaveApplicationSchema.virtual('isPast').get(function () {
  return new Date(this.endDate) < new Date();
});

// Duration display
leaveApplicationSchema.virtual('durationDisplay').get(function () {
  if (this.isHalfDay) return '0.5 day';
  return `${this.numberOfDays} day${this.numberOfDays !== 1 ? 's' : ''}`;
});

// Days until leave starts
leaveApplicationSchema.virtual('daysUntilStart').get(function () {
  const now = new Date();
  const start = new Date(this.startDate);
  if (start <= now) return 0;
  return Math.ceil((start - now) / (1000 * 60 * 60 * 24));
});

// ─── Pre-Save Hook ────────────────────────────
leaveApplicationSchema.pre('save', async function (next) {
  // Auto-generate application number
  if (this.isNew && !this.applicationNumber) {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');

      const count = await mongoose.model('LeaveApplication').countDocuments({
        createdAt: {
          $gte: new Date(year, today.getMonth(), 1),
        },
      });

      const sequence = String(count + 1).padStart(4, '0');
      this.applicationNumber = `LEA-${year}${month}-${sequence}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Check if second approval needed (> 7 days)
  if (this.isModified('numberOfDays') && this.numberOfDays > 7) {
    this.secondApproval.required = true;
    this.secondApproval.status = 'pending';
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Get pending applications for approval
leaveApplicationSchema.statics.getPendingApprovals = function (approvalLevel = 'first') {
  const query = { status: 'pending' };

  if (approvalLevel === 'second') {
    query['firstApproval.status'] = 'approved';
    query['secondApproval.required'] = true;
    query['secondApproval.status'] = 'pending';
  } else {
    query['firstApproval.status'] = 'pending';
  }

  return this.find(query)
    .sort({ appliedAt: -1 })
    .populate('leaveType', 'name code color')
    .populate('teacher', 'firstName fatherName teacherId')
    .populate('employee', 'firstName fatherName employeeId');
};

// Get applications for a specific staff
leaveApplicationSchema.statics.getForStaff = function (staffId, staffType, filters = {}) {
  const query = staffType === 'teacher' ? { teacher: staffId } : { employee: staffId };

  return this.find({ ...query, ...filters })
    .sort({ appliedAt: -1 })
    .populate('leaveType', 'name code color icon');
};

// Get all approved leaves for date range
leaveApplicationSchema.statics.getApprovedForDateRange = function (startDate, endDate) {
  return this.find({
    status: 'approved',
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  })
    .populate('teacher', 'firstName fatherName teacherId')
    .populate('employee', 'firstName fatherName employeeId')
    .populate('leaveType', 'name code color');
};

// Get currently absent staff
leaveApplicationSchema.statics.getCurrentlyOnLeave = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    status: 'approved',
    startDate: { $lte: today },
    endDate: { $gte: today },
  })
    .populate('teacher', 'firstName fatherName teacherId primarySubject')
    .populate('employee', 'firstName fatherName employeeId departmentName')
    .populate('leaveType', 'name code color');
};

// Get leave statistics for a staff
leaveApplicationSchema.statics.getStaffLeaveStats = async function (
  staffId,
  staffType,
  academicYearId
) {
  const query = {
    academicYear: academicYearId,
    status: 'approved',
  };

  if (staffType === 'teacher') {
    query.teacher = staffId;
  } else {
    query.employee = staffId;
  }

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$leaveType',
        leaveTypeName: { $first: '$leaveTypeName' },
        leaveTypeCode: {
          $first: '$leaveTypeCode',
        },
        totalDays: { $sum: '$numberOfDays' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalDays: -1 } },
  ]);
};

// Get dashboard stats
leaveApplicationSchema.statics.getDashboardStats = async function (academicYearId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pending, approvedThisMonth, currentlyOnLeave, byLeaveType] = await Promise.all([
    this.countDocuments({ status: 'pending' }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'approved',
      approvedAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 1),
      },
    }),
    this.countDocuments({
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today },
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$leaveTypeName',
          count: { $sum: 1 },
          totalDays: { $sum: '$numberOfDays' },
        },
      },
      { $sort: { totalDays: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    pending,
    approvedThisMonth,
    currentlyOnLeave,
    byLeaveType,
  };
};

// Check for overlapping leaves
leaveApplicationSchema.statics.hasOverlap = async function (
  staffId,
  staffType,
  startDate,
  endDate,
  excludeId = null
) {
  const query = {
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
    status: { $in: ['pending', 'approved'] },
  };

  if (staffType === 'teacher') {
    query.teacher = staffId;
  } else {
    query.employee = staffId;
  }

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await this.findOne(query);
  return !!existing;
};

// ─── Instance Methods ─────────────────────────

// Approve at first level
leaveApplicationSchema.methods.approveFirst = async function (userId, userName, remarks = '') {
  this.firstApproval = {
    approvedBy: userId,
    approvedByName: userName,
    approvedAt: new Date(),
    status: 'approved',
    remarks,
  };

  // Check if second approval needed
  if (this.secondApproval.required) {
    this.secondApproval.status = 'pending';
  } else {
    this.status = 'approved';
    await this._deductBalance();
    await this._markAttendance();
  }

  await this.save();
  return this;
};

// Approve at second level
leaveApplicationSchema.methods.approveSecond = async function (userId, userName, remarks = '') {
  this.secondApproval = {
    ...this.secondApproval,
    approvedBy: userId,
    approvedByName: userName,
    approvedAt: new Date(),
    status: 'approved',
    remarks,
  };

  this.status = 'approved';
  await this._deductBalance();
  await this._markAttendance();
  await this.save();
  return this;
};

// Reject application
leaveApplicationSchema.methods.reject = async function (userId, userName, reason) {
  // Reject at whichever level it is at
  if (this.firstApproval.status === 'pending') {
    this.firstApproval.status = 'rejected';
    this.firstApproval.approvedBy = userId;
    this.firstApproval.approvedByName = userName;
    this.firstApproval.approvedAt = new Date();
    this.firstApproval.remarks = reason;
  } else {
    this.secondApproval.status = 'rejected';
    this.secondApproval.approvedBy = userId;
    this.secondApproval.approvedByName = userName;
    this.secondApproval.approvedAt = new Date();
    this.secondApproval.remarks = reason;
  }

  this.status = 'rejected';
  this.rejectionReason = reason;
  await this.save();
  return this;
};

// Cancel application
leaveApplicationSchema.methods.cancel = async function (userId, reason) {
  const wasApproved = this.status === 'approved';

  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;

  // Restore balance if was approved
  if (wasApproved && this.balanceDeducted) {
    await this._restoreBalance();
  }

  await this.save();
  return this;
};

// Deduct leave balance (internal)
leaveApplicationSchema.methods._deductBalance = async function () {
  const LeaveBalance = mongoose.model('LeaveBalance');

  const staffId = this.staffType === 'teacher' ? this.teacher : this.employee;

  const balance = await LeaveBalance.findOne({
    [this.staffType]: staffId,
    leaveType: this.leaveType,
  });

  if (balance) {
    this.balanceBefore = balance.availableDays;
    await balance.deduct(this.numberOfDays);
    this.balanceAfter = balance.availableDays - this.numberOfDays;
    this.balanceDeducted = true;
    this.balanceDeductedAt = new Date();
  }
};

// Restore leave balance on cancellation
leaveApplicationSchema.methods._restoreBalance = async function () {
  const LeaveBalance = mongoose.model('LeaveBalance');

  const staffId = this.staffType === 'teacher' ? this.teacher : this.employee;

  const balance = await LeaveBalance.findOne({
    [this.staffType]: staffId,
    leaveType: this.leaveType,
  });

  if (balance) {
    await balance.restore(this.numberOfDays);
    this.balanceRestored = true;
  }
};

// Auto-mark attendance as on_leave
leaveApplicationSchema.methods._markAttendance = async function () {
  const TeacherAttendance = mongoose.model('TeacherAttendance');

  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const current = new Date(start);

  const staffField = this.staffType === 'teacher' ? 'teacher' : 'employee';

  const staffId = this.staffType === 'teacher' ? this.teacher : this.employee;

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      await TeacherAttendance.findOneAndUpdate(
        {
          [staffField]: staffId,
          date: new Date(current),
        },
        {
          $setOnInsert: {
            [staffField]: staffId,
            date: new Date(current),
            status: 'on_leave',
            staffType: this.staffType,
            leaveApplication: this._id,
            leaveType: this.leaveTypeName,
            isPaidLeave: this.isPaidLeave,
            staffName: this.staffName,
            staffId: this.staffId,
          },
        },
        { upsert: true, new: true }
      );
    }
    current.setDate(current.getDate() + 1);
  }

  this.attendanceMarked = true;
  this.attendanceMarkedAt = new Date();
};

// Get date range display
leaveApplicationSchema.methods.getDateRangeDisplay = function () {
  const start = new Date(this.startDate).toLocaleDateString('en-ET', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (this.isHalfDay) return `${start} (Half Day)`;

  const end = new Date(this.endDate).toLocaleDateString('en-ET', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return start === end ? start : `${start} – ${end}`;
};

// ─── Create Model ─────────────────────────────
const LeaveApplication = mongoose.model('LeaveApplication', leaveApplicationSchema);

module.exports = LeaveApplication;
