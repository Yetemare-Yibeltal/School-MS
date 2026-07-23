// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LEAVE BALANCE MODEL
// kat-school/server/src/models/LeaveBalance.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
  {
    // ─── Staff Reference ──────────────────────
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
      index: true,
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

    // ─── Academic Year ────────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
      index: true,
    },

    academicYearName: {
      type: String,
      trim: true,
    },

    // ─── Balance ─────────────────────────────
    // Total entitled days for this year
    entitledDays: {
      type: Number,
      required: [true, 'Entitled days is required'],
      min: 0,
    },

    // Carry-over days from previous year
    carryOverDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Extra days added manually (e.g. bonus leave)
    additionalDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total available days
    // = entitledDays + carryOverDays + additionalDays
    totalAvailableDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Days used (approved and completed/ongoing)
    usedDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Days pending approval
    pendingDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Remaining days
    // = totalAvailableDays - usedDays - pendingDays
    availableDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Days encashed
    encashedDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Usage History ────────────────────────
    usageHistory: [
      {
        leaveApplication: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LeaveApplication',
        },
        action: {
          type: String,
          enum: ['deducted', 'restored', 'added', 'carry_over', 'encashed'],
        },
        days: { type: Number },
        balanceBefore: { type: Number },
        balanceAfter: { type: Number },
        date: { type: Date, default: Date.now },
        notes: { type: String, trim: true },
        processedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // ─── Status ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // ─── Audit ───────────────────────────────
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
// Prevent duplicate balance per staff per leave type per year
leaveBalanceSchema.index(
  {
    teacher: 1,
    leaveType: 1,
    academicYear: 1,
  },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      teacher: { $exists: true, $ne: null },
    },
  }
);

leaveBalanceSchema.index(
  {
    employee: 1,
    leaveType: 1,
    academicYear: 1,
  },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      employee: { $exists: true, $ne: null },
    },
  }
);

leaveBalanceSchema.index({
  academicYear: 1,
  staffType: 1,
  isActive: 1,
});

leaveBalanceSchema.index({ leaveType: 1 });
leaveBalanceSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Usage percentage
leaveBalanceSchema.virtual('usagePercentage').get(function () {
  if (!this.totalAvailableDays) return 0;
  return Math.round((this.usedDays / this.totalAvailableDays) * 100);
});

// Is balance exhausted
leaveBalanceSchema.virtual('isExhausted').get(function () {
  return this.availableDays <= 0;
});

// Is low balance (less than 3 days)
leaveBalanceSchema.virtual('isLowBalance').get(function () {
  return this.availableDays > 0 && this.availableDays <= 3;
});

// ─── Pre-Save Hook ────────────────────────────
leaveBalanceSchema.pre('save', function (next) {
  // Always recalculate totalAvailableDays
  if (
    this.isModified('entitledDays') ||
    this.isModified('carryOverDays') ||
    this.isModified('additionalDays')
  ) {
    this.totalAvailableDays =
      (this.entitledDays || 0) + (this.carryOverDays || 0) + (this.additionalDays || 0);
  }

  // Always recalculate availableDays
  if (
    this.isModified('totalAvailableDays') ||
    this.isModified('usedDays') ||
    this.isModified('pendingDays') ||
    this.isModified('encashedDays')
  ) {
    this.availableDays = Math.max(
      0,
      this.totalAvailableDays -
        (this.usedDays || 0) -
        (this.pendingDays || 0) -
        (this.encashedDays || 0)
    );
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Initialize leave balances for all staff
// Called at start of new academic year
leaveBalanceSchema.statics.initializeForYear = async function (
  academicYearId,
  academicYearName,
  previousYearId = null,
  createdBy = null
) {
  const Teacher = mongoose.model('Teacher');
  const Employee = mongoose.model('Employee');
  const LeaveType = mongoose.model('LeaveType');

  const [teachers, employees, leaveTypes] = await Promise.all([
    Teacher.find({ status: 'active' }).select('firstName fatherName teacherId'),
    Employee.find({ status: 'active' }).select(
      'firstName fatherName employeeId departmentName designationName'
    ),
    LeaveType.find({ isActive: true }),
  ]);

  const results = {
    created: 0,
    errors: [],
  };

  // Initialize for teachers
  for (const teacher of teachers) {
    for (const leaveType of leaveTypes) {
      // Check eligibility
      const eligible =
        leaveType.applicableTo.includes('teacher') || leaveType.applicableTo.includes('both');

      if (!eligible) continue;

      // Check gender restriction
      if (leaveType.genderRestriction !== 'All' && teacher.gender !== leaveType.genderRestriction)
        continue;

      try {
        // Get carry-over days from previous year
        let carryOverDays = 0;
        if (previousYearId && leaveType.carryOverAllowed) {
          const prevBalance = await this.findOne({
            teacher: teacher._id,
            leaveType: leaveType._id,
            academicYear: previousYearId,
          });

          if (prevBalance) {
            carryOverDays = Math.min(prevBalance.availableDays, leaveType.maxCarryOverDays || 0);
          }
        }

        await this.findOneAndUpdate(
          {
            teacher: teacher._id,
            leaveType: leaveType._id,
            academicYear: academicYearId,
          },
          {
            $setOnInsert: {
              staffType: 'teacher',
              teacher: teacher._id,
              staffName: `${teacher.firstName} ${teacher.fatherName}`,
              staffId: teacher.teacherId,
              leaveType: leaveType._id,
              leaveTypeName: leaveType.name,
              leaveTypeCode: leaveType.code,
              academicYear: academicYearId,
              academicYearName,
              entitledDays: leaveType.daysAllowedPerYear,
              carryOverDays,
              additionalDays: 0,
              totalAvailableDays: leaveType.daysAllowedPerYear + carryOverDays,
              usedDays: 0,
              pendingDays: 0,
              availableDays: leaveType.daysAllowedPerYear + carryOverDays,
              isActive: true,
              createdBy,
            },
          },
          { upsert: true, new: true }
        );

        results.created++;
      } catch (error) {
        results.errors.push({
          staff: teacher.teacherId,
          leaveType: leaveType.name,
          error: error.message,
        });
      }
    }
  }

  // Initialize for employees
  for (const employee of employees) {
    for (const leaveType of leaveTypes) {
      const eligible =
        leaveType.applicableTo.includes('employee') || leaveType.applicableTo.includes('both');

      if (!eligible) continue;

      if (leaveType.genderRestriction !== 'All' && employee.gender !== leaveType.genderRestriction)
        continue;

      try {
        let carryOverDays = 0;
        if (previousYearId && leaveType.carryOverAllowed) {
          const prevBalance = await this.findOne({
            employee: employee._id,
            leaveType: leaveType._id,
            academicYear: previousYearId,
          });

          if (prevBalance) {
            carryOverDays = Math.min(prevBalance.availableDays, leaveType.maxCarryOverDays || 0);
          }
        }

        await this.findOneAndUpdate(
          {
            employee: employee._id,
            leaveType: leaveType._id,
            academicYear: academicYearId,
          },
          {
            $setOnInsert: {
              staffType: 'employee',
              employee: employee._id,
              staffName: `${employee.firstName} ${employee.fatherName}`,
              staffId: employee.employeeId,
              department: employee.departmentName,
              designation: employee.designationName,
              leaveType: leaveType._id,
              leaveTypeName: leaveType.name,
              leaveTypeCode: leaveType.code,
              academicYear: academicYearId,
              academicYearName,
              entitledDays: leaveType.daysAllowedPerYear,
              carryOverDays,
              additionalDays: 0,
              totalAvailableDays: leaveType.daysAllowedPerYear + carryOverDays,
              usedDays: 0,
              pendingDays: 0,
              availableDays: leaveType.daysAllowedPerYear + carryOverDays,
              isActive: true,
              createdBy,
            },
          },
          { upsert: true, new: true }
        );

        results.created++;
      } catch (error) {
        results.errors.push({
          staff: employee.employeeId,
          leaveType: leaveType.name,
          error: error.message,
        });
      }
    }
  }

  console.info(`✅ ${results.created} leave balances initialized for ${academicYearName}`);
  return results;
};

// Get all balances for a staff member
leaveBalanceSchema.statics.getForStaff = function (staffId, staffType, academicYearId) {
  const query = {
    academicYear: academicYearId,
    isActive: true,
  };

  if (staffType === 'teacher') {
    query.teacher = staffId;
  } else {
    query.employee = staffId;
  }

  return this.find(query).sort({ leaveTypeName: 1 }).populate('leaveType', 'name code color icon');
};

// Get balance for a specific staff and leave type
leaveBalanceSchema.statics.getBalance = async function (
  staffId,
  staffType,
  leaveTypeId,
  academicYearId
) {
  const query = {
    leaveType: leaveTypeId,
    academicYear: academicYearId,
  };

  if (staffType === 'teacher') {
    query.teacher = staffId;
  } else {
    query.employee = staffId;
  }

  return this.findOne(query);
};

// Get staff with low leave balance
leaveBalanceSchema.statics.getLowBalanceStaff = async function (academicYearId, threshold = 3) {
  return this.find({
    academicYear: academicYearId,
    isActive: true,
    availableDays: {
      $gt: 0,
      $lte: threshold,
    },
  })
    .populate('teacher', 'firstName fatherName teacherId')
    .populate('employee', 'firstName fatherName employeeId')
    .populate('leaveType', 'name code')
    .sort({ availableDays: 1 });
};

// Get all balances grouped by department
leaveBalanceSchema.statics.getDepartmentSummary = async function (academicYearId) {
  return this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        staffType: 'employee',
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$department',
        staffCount: {
          $addToSet: '$employee',
        },
        totalEntitled: {
          $sum: '$entitledDays',
        },
        totalUsed: { $sum: '$usedDays' },
        totalAvailable: {
          $sum: '$availableDays',
        },
      },
    },
    {
      $addFields: {
        staffCount: { $size: '$staffCount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Get dashboard stats
leaveBalanceSchema.statics.getDashboardStats = async function (academicYearId) {
  const [totalStaff, exhaustedBalance, lowBalance, byLeaveType] = await Promise.all([
    this.distinct(staffType === 'teacher' ? 'teacher' : 'employee', {
      academicYear: academicYearId,
      isActive: true,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      isActive: true,
      availableDays: 0,
      usedDays: { $gt: 0 },
    }),
    this.countDocuments({
      academicYear: academicYearId,
      isActive: true,
      availableDays: { $gt: 0, $lte: 3 },
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$leaveTypeName',
          totalEntitled: {
            $sum: '$entitledDays',
          },
          totalUsed: { $sum: '$usedDays' },
          totalAvailable: {
            $sum: '$availableDays',
          },
          staffCount: { $sum: 1 },
        },
      },
      { $sort: { totalUsed: -1 } },
    ]),
  ]);

  return {
    totalStaff: totalStaff.length,
    exhaustedBalance,
    lowBalance,
    byLeaveType,
  };
};

// Add days to balance manually
leaveBalanceSchema.statics.addDays = async function (
  staffId,
  staffType,
  leaveTypeId,
  academicYearId,
  days,
  reason,
  processedBy
) {
  const query = {
    leaveType: leaveTypeId,
    academicYear: academicYearId,
  };

  if (staffType === 'teacher') {
    query.teacher = staffId;
  } else {
    query.employee = staffId;
  }

  const balance = await this.findOne(query);
  if (!balance) {
    throw new Error('Leave balance record not found');
  }

  const balanceBefore = balance.availableDays;
  balance.additionalDays += days;
  balance.usageHistory.push({
    action: 'added',
    days,
    balanceBefore,
    balanceAfter: balanceBefore + days,
    date: new Date(),
    notes: reason,
    processedBy,
  });

  await balance.save();
  return balance;
};

// ─── Instance Methods ─────────────────────────

// Deduct days from balance
leaveBalanceSchema.methods.deduct = async function (days, leaveApplicationId = null) {
  const balanceBefore = this.availableDays;

  this.usedDays += days;

  this.usageHistory.push({
    leaveApplication: leaveApplicationId,
    action: 'deducted',
    days,
    balanceBefore,
    balanceAfter: Math.max(0, balanceBefore - days),
    date: new Date(),
  });

  await this.save();
  return this;
};

// Restore days to balance (on cancellation)
leaveBalanceSchema.methods.restore = async function (days, leaveApplicationId = null) {
  const balanceBefore = this.availableDays;

  this.usedDays = Math.max(0, this.usedDays - days);

  this.usageHistory.push({
    leaveApplication: leaveApplicationId,
    action: 'restored',
    days,
    balanceBefore,
    balanceAfter: balanceBefore + days,
    date: new Date(),
  });

  await this.save();
  return this;
};

// Add pending days (when application is submitted)
leaveBalanceSchema.methods.addPending = async function (days) {
  this.pendingDays += days;
  await this.save();
  return this;
};

// Remove pending days
leaveBalanceSchema.methods.removePending = async function (days) {
  this.pendingDays = Math.max(0, this.pendingDays - days);
  await this.save();
  return this;
};

// Check if enough balance for requested days
leaveBalanceSchema.methods.hasEnoughBalance = function (days) {
  return this.availableDays >= days;
};

// Get balance summary
leaveBalanceSchema.methods.getSummary = function () {
  return {
    leaveType: this.leaveTypeName,
    entitled: this.entitledDays,
    carryOver: this.carryOverDays,
    additional: this.additionalDays,
    total: this.totalAvailableDays,
    used: this.usedDays,
    pending: this.pendingDays,
    available: this.availableDays,
    encashed: this.encashedDays,
    usagePercentage: this.usagePercentage,
    isExhausted: this.isExhausted,
    isLowBalance: this.isLowBalance,
  };
};

// ─── Create Model ─────────────────────────────
const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

module.exports = LeaveBalance;
