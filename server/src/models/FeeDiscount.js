// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FEE DISCOUNT MODEL
// kat-school/server/src/models/FeeDiscount.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADE_NAMES } = require('../config/constants');

const feeDiscountSchema = new mongoose.Schema(
  {
    // ─── Discount Identity ────────────────────
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true,
      maxlength: [
        200,
        'Name cannot exceed 200 characters',
      ],
      index: true,
    },

    code: {
      type: String,
      required: [true, 'Code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'Description cannot exceed 500 characters',
      ],
    },

    // ─── Discount Type ────────────────────────
    type: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: {
        values: [
          'scholarship',
          'sibling',
          'staff_child',
          'merit',
          'need_based',
          'category',
          'custom',
        ],
        message: '{VALUE} is not a valid discount type',
      },
      index: true,
    },

    // ─── Discount Value ───────────────────────
    // Type of discount calculation
    discountMethod: {
      type: String,
      required: [true, 'Discount method is required'],
      enum: {
        values: ['percentage', 'fixed_amount'],
        message: '{VALUE} is not a valid method',
      },
      default: 'percentage',
    },

    // Discount percentage (0-100)
    percentage: {
      type: Number,
      default: 0,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },

    // Fixed discount amount in ETB
    fixedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },

    // Maximum discount amount cap
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    // ─── Applicability ────────────────────────
    // Which fee types this discount applies to
    // Empty = all fee types
    applicableFeeTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeType',
      },
    ],

    // Whether discount applies to all fee types
    appliesToAllFeeTypes: {
      type: Boolean,
      default: true,
    },

    // Which grades this discount applies to
    applicableGrades: {
      type: [String],
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      default: [],
    },

    appliesToAllGrades: {
      type: Boolean,
      default: true,
    },

    // Linked student category
    studentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentCategory',
      default: null,
    },

    // ─── Validity ────────────────────────────
    // Academic year this discount is valid for
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

    // Valid from date
    validFrom: {
      type: Date,
      default: null,
    },

    // Valid until date
    validUntil: {
      type: Date,
      default: null,
    },

    // ─── Eligibility Criteria ─────────────────
    // Minimum GPA required for this discount
    minimumGPA: {
      type: Number,
      default: null,
      min: 0,
      max: 4,
    },

    // Minimum attendance percentage required
    minimumAttendance: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // Maximum family income in ETB
    maximumFamilyIncome: {
      type: Number,
      default: null,
      min: 0,
    },

    // Additional eligibility notes
    eligibilityNotes: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Required Documents ───────────────────
    requiredDocuments: {
      type: [String],
      default: [],
    },

    // ─── Approval ────────────────────────────
    requiresApproval: {
      type: Boolean,
      default: true,
    },

    approvalRole: {
      type: String,
      default: 'admin',
    },

    // ─── Capacity ────────────────────────────
    // Maximum number of students who can get this discount
    maxBeneficiaries: {
      type: Number,
      default: null,
      min: 1,
    },

    // Current number of beneficiaries
    currentBeneficiaries: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Statistics ──────────────────────────
    stats: {
      totalStudentsApplied: {
        type: Number,
        default: 0,
      },
      totalDiscountGiven: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
    },

    // ─── UI Display ──────────────────────────
    color: {
      type: String,
      default: '#22c55e',
      match: [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        'Invalid color hex code',
      ],
    },

    icon: {
      type: String,
      default: 'tag',
      trim: true,
    },

    // ─── System ──────────────────────────────
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
      maxlength: [
        500,
        'Notes cannot exceed 500 characters',
      ],
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
feeDiscountSchema.index({ code: 1 }, { unique: true });
feeDiscountSchema.index({ type: 1, isActive: 1 });
feeDiscountSchema.index({ academicYear: 1 });
feeDiscountSchema.index({ studentCategory: 1 });
feeDiscountSchema.index({ validFrom: 1, validUntil: 1 });

// ─── Virtuals ─────────────────────────────────
// Is currently valid
feeDiscountSchema.virtual('isValid').get(function () {
  const now = new Date();
  if (this.validFrom && now < this.validFrom)
    return false;
  if (this.validUntil && now > this.validUntil)
    return false;
  if (
    this.maxBeneficiaries &&
    this.currentBeneficiaries >= this.maxBeneficiaries
  )
    return false;
  return this.isActive;
});

// Is at capacity
feeDiscountSchema.virtual('isAtCapacity').get(
  function () {
    if (!this.maxBeneficiaries) return false;
    return (
      this.currentBeneficiaries >= this.maxBeneficiaries
    );
  }
);

// Display value
feeDiscountSchema.virtual('displayValue').get(
  function () {
    if (this.discountMethod === 'percentage') {
      return `${this.percentage}% off`;
    }
    return `ETB ${this.fixedAmount.toLocaleString()} off`;
  }
);

// ─── Static Methods ───────────────────────────

// Seed default discount types
feeDiscountSchema.statics.seedDefaultDiscounts =
  async function (academicYearId, academicYearName) {
    const discounts = [
      {
        name: 'Full Scholarship',
        code: 'SCH-FULL',
        description: 'Full fee waiver for scholarship students',
        type: 'scholarship',
        discountMethod: 'percentage',
        percentage: 100,
        appliesToAllFeeTypes: true,
        appliesToAllGrades: true,
        requiresApproval: true,
        requiredDocuments: [
          'Scholarship Award Letter',
          'Academic Transcript',
        ],
        minimumGPA: 3.5,
        color: '#22c55e',
        icon: 'award',
        isSystem: true,
        academicYear: academicYearId,
        academicYearName,
      },
      {
        name: 'Partial Scholarship (50%)',
        code: 'SCH-HALF',
        description: '50% fee reduction for partial scholarship',
        type: 'scholarship',
        discountMethod: 'percentage',
        percentage: 50,
        appliesToAllFeeTypes: true,
        appliesToAllGrades: true,
        requiresApproval: true,
        requiredDocuments: ['Scholarship Letter'],
        minimumGPA: 3.0,
        color: '#3b82f6',
        icon: 'award',
        isSystem: true,
        academicYear: academicYearId,
        academicYearName,
      },
      {
        name: 'Staff Child Discount',
        code: 'STAFF-CHD',
        description: '50% discount for children of school staff',
        type: 'staff_child',
        discountMethod: 'percentage',
        percentage: 50,
        appliesToAllFeeTypes: false,
        appliesToAllGrades: true,
        requiresApproval: true,
        requiredDocuments: [
          'Staff Employment Verification',
          'Birth Certificate',
        ],
        color: '#8b5cf6',
        icon: 'users',
        isSystem: true,
        academicYear: academicYearId,
        academicYearName,
      },
      {
        name: 'Sibling Discount',
        code: 'SIB-DISC',
        description: '10% discount for second and subsequent siblings',
        type: 'sibling',
        discountMethod: 'percentage',
        percentage: 10,
        appliesToAllFeeTypes: false,
        appliesToAllGrades: true,
        requiresApproval: false,
        color: '#f59e0b',
        icon: 'users',
        isSystem: true,
        academicYear: academicYearId,
        academicYearName,
      },
      {
        name: 'Merit Scholarship',
        code: 'MERIT',
        description: '25% discount for top performing students',
        type: 'merit',
        discountMethod: 'percentage',
        percentage: 25,
        appliesToAllFeeTypes: true,
        appliesToAllGrades: true,
        requiresApproval: true,
        minimumGPA: 3.8,
        minimumAttendance: 90,
        maxBeneficiaries: 20,
        color: '#f97316',
        icon: 'star',
        isSystem: true,
        academicYear: academicYearId,
        academicYearName,
      },
      {
        name: 'Need-Based Assistance',
        code: 'NEED',
        description: 'Financial assistance for students from low-income families',
        type: 'need_based',
        discountMethod: 'percentage',
        percentage: 75,
        appliesToAllFeeTypes: true,
        appliesToAllGrades: true,
        requiresApproval: true,
        requiredDocuments: [
          'Income Verification Letter',
          'Kebele Support Letter',
        ],
        maximumFamilyIncome: 2000,
        color: '#ec4899',
        icon: 'heart',
        isSystem: true,
        academicYear: academicYearId,
        academicYearName,
      },
    ];

    for (const discount of discounts) {
      await this.findOneAndUpdate(
        { code: discount.code },
        {
          $setOnInsert: {
            ...discount,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    console.info(
      `✅ ${discounts.length} fee discounts seeded`
    );
  };

// Find by code
feeDiscountSchema.statics.findByCode = function (
  code
) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active discounts
feeDiscountSchema.statics.getAllActive = function (
  academicYearId = null
) {
  const query = { isActive: true };
  if (academicYearId) {
    query.$or = [
      { academicYear: academicYearId },
      { academicYear: null },
    ];
  }
  return this.find(query).sort({ type: 1, name: 1 });
};

// Get discounts by type
feeDiscountSchema.statics.getByType = function (
  type
) {
  return this.find({
    type,
    isActive: true,
  }).sort({ percentage: -1 });
};

// Get valid discounts for a student
feeDiscountSchema.statics.getValidForStudent =
  async function (
    grade,
    categoryId,
    academicYearId
  ) {
    const now = new Date();
    const query = {
      isActive: true,
      $or: [
        { academicYear: academicYearId },
        { academicYear: null },
      ],
      $and: [
        {
          $or: [
            { validFrom: null },
            { validFrom: { $lte: now } },
          ],
        },
        {
          $or: [
            { validUntil: null },
            { validUntil: { $gte: now } },
          ],
        },
      ],
      $or: [
        { appliesToAllGrades: true },
        { applicableGrades: grade },
      ],
    };

    return this.find(query)
      .populate('applicableFeeTypes', 'name code')
      .populate('studentCategory', 'name code');
  };

// Increment beneficiary count
feeDiscountSchema.statics.incrementBeneficiary =
  async function (discountId) {
    return this.findByIdAndUpdate(
      discountId,
      {
        $inc: { currentBeneficiaries: 1 },
      },
      { new: true }
    );
  };

// Decrement beneficiary count
feeDiscountSchema.statics.decrementBeneficiary =
  async function (discountId) {
    return this.findByIdAndUpdate(
      discountId,
      {
        $inc: { currentBeneficiaries: -1 },
      },
      { new: true }
    );
  };

// Update stats
feeDiscountSchema.statics.updateStats =
  async function (discountId) {
    const FeeAssignment =
      mongoose.model('FeeAssignment');

    const stats = await FeeAssignment.aggregate([
      {
        $unwind: '$discounts',
      },
      {
        $match: {
          'discounts.discount':
            new mongoose.Types.ObjectId(discountId),
        },
      },
      {
        $group: {
          _id: null,
          students: { $addToSet: '$student' },
          totalDiscount: {
            $sum: '$discounts.discountAmount',
          },
        },
      },
    ]);

    if (stats.length === 0) return;

    return this.findByIdAndUpdate(
      discountId,
      {
        'stats.totalStudentsApplied':
          stats[0].students.length,
        'stats.totalDiscountGiven':
          stats[0].totalDiscount,
        'stats.lastUpdated': new Date(),
      },
      { new: true }
    );
  };

// Get dashboard stats
feeDiscountSchema.statics.getDashboardStats =
  async function (academicYearId) {
    const [total, byType] = await Promise.all([
      this.countDocuments({
        isActive: true,
        $or: [
          { academicYear: academicYearId },
          { academicYear: null },
        ],
      }),
      this.aggregate([
        {
          $match: {
            isActive: true,
            $or: [
              {
                academicYear:
                  new mongoose.Types.ObjectId(
                    academicYearId
                  ),
              },
              { academicYear: null },
            ],
          },
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalBeneficiaries: {
              $sum: '$currentBeneficiaries',
            },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return { total, byType };
  };

// ─── Instance Methods ─────────────────────────

// Calculate discount amount for a given fee amount
feeDiscountSchema.methods.calculateDiscount =
  function (feeAmount) {
    let discountAmount = 0;

    if (this.discountMethod === 'percentage') {
      discountAmount =
        (feeAmount * this.percentage) / 100;
    } else {
      discountAmount = Math.min(
        this.fixedAmount,
        feeAmount
      );
    }

    // Apply max cap if set
    if (
      this.maxDiscountAmount &&
      discountAmount > this.maxDiscountAmount
    ) {
      discountAmount = this.maxDiscountAmount;
    }

    return Math.round(discountAmount);
  };

// Check if discount is currently valid
feeDiscountSchema.methods.isCurrentlyValid =
  function () {
    const now = new Date();
    if (!this.isActive) return false;
    if (this.validFrom && now < this.validFrom)
      return false;
    if (this.validUntil && now > this.validUntil)
      return false;
    if (this.isAtCapacity) return false;
    return true;
  };

// Check if discount applies to a fee type
feeDiscountSchema.methods.appliesToFeeType =
  function (feeTypeId) {
    if (this.appliesToAllFeeTypes) return true;
    return this.applicableFeeTypes.some(
      (id) => id.toString() === feeTypeId.toString()
    );
  };

// Check if discount applies to a grade
feeDiscountSchema.methods.appliesToGrade = function (
  grade
) {
  if (this.appliesToAllGrades) return true;
  return this.applicableGrades.includes(grade);
};

// Check if student meets eligibility
feeDiscountSchema.methods.studentIsEligible =
  function (studentGPA, studentAttendance) {
    if (
      this.minimumGPA &&
      (!studentGPA || studentGPA < this.minimumGPA)
    ) {
      return { eligible: false, reason: `Minimum GPA of ${this.minimumGPA} required` };
    }
    if (
      this.minimumAttendance &&
      (!studentAttendance ||
        studentAttendance < this.minimumAttendance)
    ) {
      return {
        eligible: false,
        reason: `Minimum attendance of ${this.minimumAttendance}% required`,
      };
    }
    return { eligible: true };
  };

// ─── Create Model ─────────────────────────────
const FeeDiscount = mongoose.model(
  'FeeDiscount',
  feeDiscountSchema
);

module.exports = FeeDiscount;