// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LIBRARY MEMBER MODEL
// kat-school/server/src/models/LibraryMember.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const libraryMemberSchema = new mongoose.Schema(
  {
    // ─── Member Identity ──────────────────────
    // Unique library card number
    membershipId: {
      type: String,
      required: [true, 'Membership ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ─── Member Type ──────────────────────────
    memberType: {
      type: String,
      required: [true, 'Member type is required'],
      enum: {
        values: ['student', 'teacher', 'employee'],
        message: '{VALUE} is not a valid member type',
      },
      index: true,
    },

    // ─── Member References ────────────────────
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
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

    // Cached member info for quick access
    memberName: {
      type: String,
      trim: true,
    },

    memberId: {
      type: String,
      trim: true,
      index: true,
    },

    memberGrade: {
      type: String,
      trim: true,
      default: null,
    },

    memberSection: {
      type: String,
      trim: true,
      default: null,
    },

    memberDepartment: {
      type: String,
      trim: true,
      default: null,
    },

    memberPhoto: {
      url: { type: String, default: null },
    },

    // ─── Membership Details ───────────────────
    membershipStartDate: {
      type: Date,
      required: [true, 'Membership start date is required'],
      default: Date.now,
    },

    membershipEndDate: {
      type: Date,
      default: null,
    },

    // ─── Book Limits ──────────────────────────
    // Maximum books this member can borrow at once
    maxBooksAllowed: {
      type: Number,
      default: 2,
      min: 0,
      max: 10,
    },

    // Maximum days allowed to keep a book
    maxLoanDays: {
      type: Number,
      default: 14,
      min: 1,
      max: 30,
    },

    // ─── Current Usage ────────────────────────
    // Books currently issued to this member
    currentlyIssuedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total books ever issued
    totalBooksIssued: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total books returned
    totalBooksReturned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total books overdue (historical)
    totalOverdue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Currently overdue books count
    currentOverdueCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Fine Management ──────────────────────
    // Total fine accumulated
    totalFineAccumulated: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Fine paid so far
    totalFinePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Outstanding fine balance
    outstandingFine: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Academic Year ────────────────────────
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

    // ─── Status ──────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'expired', 'inactive'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
      index: true,
    },

    // Suspension reason
    suspensionReason: {
      type: String,
      trim: true,
      default: null,
    },

    suspendedUntil: {
      type: Date,
      default: null,
    },

    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // ─── Audit ───────────────────────────────
    registeredBy: {
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
libraryMemberSchema.index({ student: 1 }, { sparse: true });
libraryMemberSchema.index({ teacher: 1 }, { sparse: true });
libraryMemberSchema.index({ employee: 1 }, { sparse: true });
libraryMemberSchema.index({
  memberType: 1,
  status: 1,
});
libraryMemberSchema.index({ academicYear: 1 });
libraryMemberSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Can borrow more books
libraryMemberSchema.virtual('canBorrow').get(function () {
  if (this.status !== 'active') return false;
  if (this.outstandingFine > 0) return false;
  if (this.currentOverdueCount > 0) return false;
  return this.currentlyIssuedCount < this.maxBooksAllowed;
});

// Remaining borrow slots
libraryMemberSchema.virtual('remainingSlots').get(function () {
  return Math.max(0, this.maxBooksAllowed - this.currentlyIssuedCount);
});

// Is membership expired
libraryMemberSchema.virtual('isExpired').get(function () {
  if (!this.membershipEndDate) return false;
  return new Date(this.membershipEndDate) < new Date();
});

// Is suspended
libraryMemberSchema.virtual('isSuspended').get(function () {
  if (this.status !== 'suspended') return false;
  if (!this.suspendedUntil) return true;
  return new Date(this.suspendedUntil) > new Date();
});

// ─── Pre-Save Hook ────────────────────────────
libraryMemberSchema.pre('save', async function (next) {
  // Auto-generate membership ID if not provided
  if (this.isNew && !this.membershipId) {
    try {
      const count = await mongoose.model('LibraryMember').countDocuments();
      const prefix =
        this.memberType === 'student' ? 'LMS' : this.memberType === 'teacher' ? 'LMT' : 'LME';
      this.membershipId = `${prefix}-${String(count + 1).padStart(5, '0')}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Auto-set max books based on member type
  if (this.isNew && !this.maxBooksAllowed) {
    if (this.memberType === 'student') {
      this.maxBooksAllowed = 2;
      this.maxLoanDays = 14;
    } else if (this.memberType === 'teacher') {
      this.maxBooksAllowed = 5;
      this.maxLoanDays = 30;
    } else {
      this.maxBooksAllowed = 3;
      this.maxLoanDays = 21;
    }
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Find member by membership ID
libraryMemberSchema.statics.findByMembershipId = function (membershipId) {
  return this.findOne({
    membershipId: membershipId.toUpperCase(),
  })
    .populate('student', 'firstName fatherName studentId grade section photo')
    .populate('teacher', 'firstName fatherName teacherId primarySubject photo')
    .populate('employee', 'firstName fatherName employeeId departmentName photo');
};

// Find member by their primary ID
libraryMemberSchema.statics.findByMemberId = function (memberId) {
  return this.findOne({ memberId });
};

// Register a new library member
libraryMemberSchema.statics.registerMember = async function ({
  memberType,
  memberId,
  memberName,
  studentId,
  teacherId,
  employeeId,
  grade,
  section,
  department,
  photo,
  academicYearId,
  academicYearName,
  registeredBy,
}) {
  const existing = await this.findOne({
    memberId,
  });

  if (existing) {
    return {
      success: false,
      message: 'Member already registered',
      member: existing,
    };
  }

  const memberData = {
    memberType,
    memberName,
    memberId,
    memberGrade: grade || null,
    memberSection: section || null,
    memberDepartment: department || null,
    memberPhoto: { url: photo || null },
    academicYear: academicYearId,
    academicYearName,
    registeredBy,
    createdBy: registeredBy,
    status: 'active',
    membershipStartDate: new Date(),
  };

  if (studentId) memberData.student = studentId;
  if (teacherId) memberData.teacher = teacherId;
  if (employeeId) memberData.employee = employeeId;

  const member = await this.create(memberData);

  return {
    success: true,
    message: 'Member registered successfully',
    member,
  };
};

// Get all active members
libraryMemberSchema.statics.getAllActive = function (filters = {}) {
  return this.find({
    status: 'active',
    ...filters,
  })
    .sort({ memberName: 1 })
    .select(
      'membershipId memberType memberName memberId memberGrade memberSection memberPhoto currentlyIssuedCount outstandingFine status'
    );
};

// Get members with overdue books
libraryMemberSchema.statics.getWithOverdueBooks = function () {
  return this.find({
    currentOverdueCount: { $gt: 0 },
    status: 'active',
  }).sort({ currentOverdueCount: -1 });
};

// Get members with outstanding fines
libraryMemberSchema.statics.getWithOutstandingFines = function () {
  return this.find({
    outstandingFine: { $gt: 0 },
  })
    .sort({ outstandingFine: -1 })
    .select(
      'membershipId memberType memberName memberId outstandingFine totalFineAccumulated status'
    );
};

// Suspend a member
libraryMemberSchema.statics.suspend = async function (
  memberId,
  reason,
  suspendedUntil,
  suspendedBy
) {
  return this.findByIdAndUpdate(
    memberId,
    {
      status: 'suspended',
      suspensionReason: reason,
      suspendedUntil: suspendedUntil || null,
      suspendedBy,
    },
    { new: true }
  );
};

// Reactivate a suspended member
libraryMemberSchema.statics.reactivate = async function (memberId) {
  return this.findByIdAndUpdate(
    memberId,
    {
      status: 'active',
      suspensionReason: null,
      suspendedUntil: null,
      suspendedBy: null,
    },
    { new: true }
  );
};

// Get dashboard stats
libraryMemberSchema.statics.getDashboardStats = async function (academicYearId) {
  const [total, active, suspended, withOverdue, withFines, byType] = await Promise.all([
    this.countDocuments({
      academicYear: academicYearId,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'active',
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'suspended',
    }),
    this.countDocuments({
      currentOverdueCount: { $gt: 0 },
    }),
    this.countDocuments({
      outstandingFine: { $gt: 0 },
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
        },
      },
      {
        $group: {
          _id: '$memberType',
          count: { $sum: 1 },
          activeCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  return {
    total,
    active,
    suspended,
    withOverdue,
    withFines,
    byType,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if member can borrow a book
libraryMemberSchema.methods.checkBorrowEligibility = function () {
  const issues = [];

  if (this.status !== 'active') {
    issues.push(`Membership is ${this.status}`);
  }

  if (this.outstandingFine > 0) {
    issues.push(`Outstanding fine of ETB ${this.outstandingFine}`);
  }

  if (this.currentOverdueCount > 0) {
    issues.push(`${this.currentOverdueCount} overdue book(s)`);
  }

  if (this.currentlyIssuedCount >= this.maxBooksAllowed) {
    issues.push(`Maximum books limit reached (${this.maxBooksAllowed})`);
  }

  if (this.isExpired) {
    issues.push('Membership has expired');
  }

  return {
    eligible: issues.length === 0,
    issues,
  };
};

// Record book issue
libraryMemberSchema.methods.recordIssue = async function () {
  this.currentlyIssuedCount += 1;
  this.totalBooksIssued += 1;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Record book return
libraryMemberSchema.methods.recordReturn = async function (wasOverdue = false) {
  this.currentlyIssuedCount = Math.max(0, this.currentlyIssuedCount - 1);
  this.totalBooksReturned += 1;

  if (wasOverdue) {
    this.currentOverdueCount = Math.max(0, this.currentOverdueCount - 1);
    this.totalOverdue += 1;
  }

  await this.save({ validateBeforeSave: false });
  return this;
};

// Add fine to member
libraryMemberSchema.methods.addFine = async function (amount) {
  this.totalFineAccumulated += amount;
  this.outstandingFine += amount;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Pay fine
libraryMemberSchema.methods.payFine = async function (amount) {
  const actualPaid = Math.min(amount, this.outstandingFine);
  this.totalFinePaid += actualPaid;
  this.outstandingFine = Math.max(0, this.outstandingFine - actualPaid);
  await this.save({ validateBeforeSave: false });
  return this;
};

// Mark overdue book
libraryMemberSchema.methods.markOverdue = async function () {
  this.currentOverdueCount += 1;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Clear overdue
libraryMemberSchema.methods.clearOverdue = async function () {
  this.currentOverdueCount = Math.max(0, this.currentOverdueCount - 1);
  await this.save({ validateBeforeSave: false });
  return this;
};

// ─── Create Model ─────────────────────────────
const LibraryMember = mongoose.model('LibraryMember', libraryMemberSchema);

module.exports = LibraryMember;
