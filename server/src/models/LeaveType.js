// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LEAVE TYPE MODEL
// kat-school/server/src/models/LeaveType.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { DEFAULT_LEAVE_TYPES } = require('../config/constants');

const leaveTypeSchema = new mongoose.Schema(
  {
    // ─── Leave Type Identity ──────────────────
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },

    code: {
      type: String,
      required: [true, 'Code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [10, 'Code cannot exceed 10 characters'],
      match: [/^[A-Z0-9_]+$/, 'Code must be uppercase letters only'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ─── Days Allowed ─────────────────────────
    // Days allowed per year
    daysAllowedPerYear: {
      type: Number,
      required: [true, 'Days allowed per year is required'],
      min: [0, 'Days cannot be negative'],
      max: [365, 'Days cannot exceed 365'],
    },

    // Whether unused days carry over to next year
    carryOverAllowed: {
      type: Boolean,
      default: false,
    },

    // Maximum carry over days
    maxCarryOverDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Payment ──────────────────────────────
    isPaid: {
      type: Boolean,
      default: true,
    },

    // Percentage of salary paid during leave
    // 100 = full pay, 50 = half pay, 0 = no pay
    payPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    // ─── Applicability ────────────────────────
    // Which staff types can use this leave
    applicableTo: {
      type: [String],
      enum: {
        values: ['teacher', 'employee', 'both'],
        message: '{VALUE} is not valid',
      },
      default: ['teacher', 'employee'],
    },

    // Gender restriction
    genderRestriction: {
      type: String,
      enum: ['Male', 'Female', 'All'],
      default: 'All',
    },

    // Minimum service months required
    minimumServiceMonths: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Rules ───────────────────────────────
    // Whether prior approval is required
    requiresApproval: {
      type: Boolean,
      default: true,
    },

    // Whether supporting document is required
    requiresDocument: {
      type: Boolean,
      default: false,
    },

    // Required document description
    requiredDocumentDescription: {
      type: String,
      trim: true,
      default: null,
    },

    // Minimum advance notice in days
    advanceNoticeDays: {
      type: Number,
      default: 1,
      min: 0,
    },

    // Maximum consecutive days allowed
    maxConsecutiveDays: {
      type: Number,
      default: null,
      min: 1,
    },

    // Whether half-day leave is allowed
    halfDayAllowed: {
      type: Boolean,
      default: false,
    },

    // Whether leave can be taken in hours
    hourlyLeaveAllowed: {
      type: Boolean,
      default: false,
    },

    // Maximum times per year
    maxTimesPerYear: {
      type: Number,
      default: null,
      min: 1,
    },

    // ─── Encashment ───────────────────────────
    // Whether unused leave can be encashed
    encashmentAllowed: {
      type: Boolean,
      default: false,
    },

    // Maximum days that can be encashed
    maxEncashmentDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Accrual ──────────────────────────────
    // Whether leave accrues monthly
    monthlyAccrual: {
      type: Boolean,
      default: false,
    },

    // Days accrued per month
    daysAccruedPerMonth: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── UI Display ──────────────────────────
    color: {
      type: String,
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    bgColor: {
      type: String,
      default: '#eef2ff',
    },

    icon: {
      type: String,
      default: 'calendar',
      trim: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Type ────────────────────────────────
    isSystem: {
      type: Boolean,
      default: false,
    },

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

// ─── Indexes ──────────────────────────────────
leaveTypeSchema.index({ name: 1 }, { unique: true });
leaveTypeSchema.index({ code: 1 }, { unique: true });
leaveTypeSchema.index({ isActive: 1 });
leaveTypeSchema.index({ sortOrder: 1 });
leaveTypeSchema.index({ isPaid: 1 });

// ─── Virtuals ─────────────────────────────────
// Pay label
leaveTypeSchema.virtual('payLabel').get(function () {
  if (!this.isPaid) return 'Unpaid';
  if (this.payPercentage === 100) return 'Full Pay';
  if (this.payPercentage === 50) return 'Half Pay';
  return `${this.payPercentage}% Pay`;
});

// Is gender specific
leaveTypeSchema.virtual('isGenderSpecific').get(function () {
  return this.genderRestriction !== 'All';
});

// Display label
leaveTypeSchema.virtual('displayLabel').get(function () {
  return `${this.name} (${this.daysAllowedPerYear} days/year)`;
});

// ─── Static Methods ───────────────────────────

// Seed default leave types
leaveTypeSchema.statics.seedDefaultLeaveTypes = async function () {
  const leaveTypes = [
    {
      name: 'Annual Leave',
      code: 'AL',
      description: 'Regular annual vacation leave for all staff',
      daysAllowedPerYear: 21,
      carryOverAllowed: true,
      maxCarryOverDays: 7,
      isPaid: true,
      payPercentage: 100,
      applicableTo: ['teacher', 'employee'],
      genderRestriction: 'All',
      minimumServiceMonths: 6,
      requiresApproval: true,
      requiresDocument: false,
      advanceNoticeDays: 7,
      halfDayAllowed: true,
      color: '#4f46e5',
      bgColor: '#eef2ff',
      icon: 'calendar',
      sortOrder: 1,
      isSystem: true,
      encashmentAllowed: true,
      maxEncashmentDays: 10,
    },
    {
      name: 'Sick Leave',
      code: 'SL',
      description: 'Medical leave due to illness or injury',
      daysAllowedPerYear: 14,
      carryOverAllowed: false,
      maxCarryOverDays: 0,
      isPaid: true,
      payPercentage: 100,
      applicableTo: ['teacher', 'employee'],
      genderRestriction: 'All',
      minimumServiceMonths: 0,
      requiresApproval: true,
      requiresDocument: true,
      requiredDocumentDescription: 'Medical certificate from registered physician',
      advanceNoticeDays: 0,
      halfDayAllowed: true,
      color: '#ef4444',
      bgColor: '#fee2e2',
      icon: 'heart',
      sortOrder: 2,
      isSystem: true,
    },
    {
      name: 'Maternity Leave',
      code: 'ML',
      description: 'Paid maternity leave for female staff',
      daysAllowedPerYear: 90,
      carryOverAllowed: false,
      isPaid: true,
      payPercentage: 100,
      applicableTo: ['teacher', 'employee'],
      genderRestriction: 'Female',
      minimumServiceMonths: 12,
      requiresApproval: true,
      requiresDocument: true,
      requiredDocumentDescription: 'Medical certificate confirming pregnancy',
      advanceNoticeDays: 30,
      maxTimesPerYear: 1,
      halfDayAllowed: false,
      color: '#ec4899',
      bgColor: '#fce7f3',
      icon: 'baby',
      sortOrder: 3,
      isSystem: true,
    },
    {
      name: 'Paternity Leave',
      code: 'PL',
      description: 'Paid paternity leave for male staff',
      daysAllowedPerYear: 5,
      carryOverAllowed: false,
      isPaid: true,
      payPercentage: 100,
      applicableTo: ['teacher', 'employee'],
      genderRestriction: 'Male',
      minimumServiceMonths: 0,
      requiresApproval: true,
      requiresDocument: true,
      requiredDocumentDescription: 'Birth certificate or hospital documents',
      advanceNoticeDays: 7,
      maxTimesPerYear: 1,
      halfDayAllowed: false,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      icon: 'baby',
      sortOrder: 4,
      isSystem: true,
    },
    {
      name: 'Compassionate Leave',
      code: 'CL',
      description: 'Leave for bereavement or family emergency',
      daysAllowedPerYear: 5,
      carryOverAllowed: false,
      isPaid: true,
      payPercentage: 100,
      applicableTo: ['teacher', 'employee'],
      genderRestriction: 'All',
      minimumServiceMonths: 0,
      requiresApproval: true,
      requiresDocument: true,
      requiredDocumentDescription: 'Death certificate or other relevant document',
      advanceNoticeDays: 0,
      maxTimesPerYear: 2,
      halfDayAllowed: false,
      color: '#6b7280',
      bgColor: '#f3f4f6',
      icon: 'heart',
      sortOrder: 5,
      isSystem: true,
    },
    {
      name: 'Study Leave',
      code: 'STL',
      description: 'Leave for exams, training or professional development',
      daysAllowedPerYear: 10,
      carryOverAllowed: false,
      isPaid: false,
      payPercentage: 0,
      applicableTo: ['teacher', 'employee'],
      genderRestriction: 'All',
      minimumServiceMonths: 12,
      requiresApproval: true,
      requiresDocument: true,
      requiredDocumentDescription: 'Exam schedule or training confirmation letter',
      advanceNoticeDays: 14,
      maxTimesPerYear: 2,
      halfDayAllowed: true,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      icon: 'book-open',
      sortOrder: 6,
      isSystem: true,
    },
    {
      name: 'Emergency Leave',
      code: 'EML',
      description: 'Short-term leave for urgent personal emergencies',
      daysAllowedPerYear: 3,
      carryOverAllowed: false,
      isPaid: true,
      payPercentage: 100,
      applicableTo: ['teacher', 'employee'],
      genderRestriction: 'All',
      minimumServiceMonths: 0,
      requiresApproval: true,
      requiresDocument: false,
      advanceNoticeDays: 0,
      maxTimesPerYear: 3,
      halfDayAllowed: true,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: 'alert-triangle',
      sortOrder: 7,
      isSystem: true,
    },
    {
      name: 'Unpaid Leave',
      code: 'UPL',
      description: 'Leave without pay for personal reasons',
      daysAllowedPerYear: 30,
      carryOverAllowed: false,
      isPaid: false,
      payPercentage: 0,
      applicableTo: ['teacher', 'employee'],
      genderRestriction: 'All',
      minimumServiceMonths: 0,
      requiresApproval: true,
      requiresDocument: false,
      advanceNoticeDays: 7,
      halfDayAllowed: true,
      color: '#94a3b8',
      bgColor: '#f1f5f9',
      icon: 'calendar-x',
      sortOrder: 8,
      isSystem: true,
    },
  ];

  for (const leaveType of leaveTypes) {
    await this.findOneAndUpdate(
      { code: leaveType.code },
      {
        $setOnInsert: {
          ...leaveType,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${leaveTypes.length} leave types seeded`);
};

// Find by code
leaveTypeSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active leave types
leaveTypeSchema.statics.getAllActive = function () {
  return this.find({ isActive: true }).sort({
    sortOrder: 1,
    name: 1,
  });
};

// Get paid leave types
leaveTypeSchema.statics.getPaidLeaveTypes = function () {
  return this.find({
    isPaid: true,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Get leave types for a staff gender
leaveTypeSchema.statics.getForGender = function (gender) {
  return this.find({
    isActive: true,
    genderRestriction: { $in: [gender, 'All'] },
  }).sort({ sortOrder: 1 });
};

// Get leave types for a staff type
leaveTypeSchema.statics.getForStaffType = function (staffType) {
  return this.find({
    isActive: true,
    applicableTo: { $in: [staffType, 'both'] },
  }).sort({ sortOrder: 1 });
};

// Get dashboard stats
leaveTypeSchema.statics.getDashboardStats = async function () {
  const [total, paid, unpaid, byGender] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments({
      isActive: true,
      isPaid: true,
    }),
    this.countDocuments({
      isActive: true,
      isPaid: false,
    }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$genderRestriction',
          count: { $sum: 1 },
          totalDays: {
            $sum: '$daysAllowedPerYear',
          },
        },
      },
    ]),
  ]);

  return { total, paid, unpaid, byGender };
};

// ─── Instance Methods ─────────────────────────

// Check if staff is eligible for this leave
leaveTypeSchema.methods.isEligible = function (staff) {
  const issues = [];

  // Check gender restriction
  if (this.genderRestriction !== 'All' && staff.gender !== this.genderRestriction) {
    issues.push(`This leave is only available for ${this.genderRestriction} staff`);
  }

  // Check minimum service months
  if (this.minimumServiceMonths > 0 && staff.joinDate) {
    const monthsWorked = Math.floor(
      (new Date() - new Date(staff.joinDate)) / (1000 * 60 * 60 * 24 * 30)
    );
    if (monthsWorked < this.minimumServiceMonths) {
      issues.push(`Minimum ${this.minimumServiceMonths} months of service required`);
    }
  }

  return {
    eligible: issues.length === 0,
    issues,
  };
};

// Check if requested days are within allowed limit
leaveTypeSchema.methods.isWithinLimit = function (requestedDays, remainingBalance) {
  if (requestedDays > this.daysAllowedPerYear) {
    return {
      valid: false,
      reason: `Cannot exceed ${this.daysAllowedPerYear} days per year`,
    };
  }

  if (requestedDays > remainingBalance) {
    return {
      valid: false,
      reason: `Insufficient leave balance. Available: ${remainingBalance} days`,
    };
  }

  if (this.maxConsecutiveDays && requestedDays > this.maxConsecutiveDays) {
    return {
      valid: false,
      reason: `Cannot exceed ${this.maxConsecutiveDays} consecutive days`,
    };
  }

  return { valid: true };
};

// Calculate advance notice check
leaveTypeSchema.methods.hasAdequateNotice = function (startDate) {
  if (this.advanceNoticeDays === 0) return true;
  const today = new Date();
  const start = new Date(startDate);
  const daysDiff = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  return daysDiff >= this.advanceNoticeDays;
};

// ─── Create Model ─────────────────────────────
const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);

module.exports = LeaveType;
