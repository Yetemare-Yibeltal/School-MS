// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FEE TYPE MODEL
// kat-school/server/src/models/FeeType.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADE_NAMES, DEFAULT_FEE_TYPES } = require('../config/constants');

const feeTypeSchema = new mongoose.Schema(
  {
    // ─── Fee Type Identity ────────────────────
    name: {
      type: String,
      required: [true, 'Fee type name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },

    // Short code e.g. "TF", "RF", "EF"
    code: {
      type: String,
      required: [true, 'Fee type code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [10, 'Code cannot exceed 10 characters'],
      match: [/^[A-Z0-9_]+$/, 'Code must be uppercase letters and numbers only'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ─── Amount ──────────────────────────────
    // Default amount in ETB
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
      default: 0,
    },

    // Minimum amount (for partial payments)
    minimumAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Currency
    currency: {
      type: String,
      default: 'ETB',
      trim: true,
    },

    // ─── Frequency ───────────────────────────
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: {
        values: ['annual', 'per_term', 'monthly', 'one_time', 'as_needed'],
        message: '{VALUE} is not a valid frequency',
      },
      default: 'annual',
      index: true,
    },

    // ─── Academic Scope ───────────────────────
    // Which grades this fee applies to
    // Empty = all grades
    applicableGrades: {
      type: [String],
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      default: [],
    },

    // Whether fee applies to all grades
    appliesToAllGrades: {
      type: Boolean,
      default: true,
    },

    // ─── Rules ───────────────────────────────
    // Whether this fee is mandatory
    isMandatory: {
      type: Boolean,
      default: true,
    },

    // Whether discounts can be applied
    isDiscountable: {
      type: Boolean,
      default: true,
    },

    // Whether this fee is refundable
    isRefundable: {
      type: Boolean,
      default: false,
    },

    // Refund policy description
    refundPolicy: {
      type: String,
      trim: true,
      default: null,
    },

    // Whether late payment penalty applies
    hasLatePenalty: {
      type: Boolean,
      default: false,
    },

    // Late payment penalty percentage
    latePenaltyPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Grace days before penalty applies
    graceDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Payment Plan ─────────────────────────
    // Whether installment payment is allowed
    allowInstallments: {
      type: Boolean,
      default: false,
    },

    // Maximum number of installments
    maxInstallments: {
      type: Number,
      default: 1,
      min: 1,
      max: 12,
    },

    // ─── GL Account ──────────────────────────
    // General Ledger account code for accounting
    glAccountCode: {
      type: String,
      trim: true,
      default: null,
    },

    // Income category for reports
    incomeCategory: {
      type: String,
      trim: true,
      default: 'School Fees',
    },

    // ─── UI Display ──────────────────────────
    color: {
      type: String,
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    icon: {
      type: String,
      default: 'credit-card',
      trim: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Type Category ────────────────────────
    isSystem: {
      type: Boolean,
      default: false,
    },

    // ─── Statistics (cached) ──────────────────
    stats: {
      totalAssigned: {
        type: Number,
        default: 0,
      },
      totalCollected: {
        type: Number,
        default: 0,
      },
      totalPending: {
        type: Number,
        default: 0,
      },
      collectionRate: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
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
feeTypeSchema.index({ name: 1 }, { unique: true });
feeTypeSchema.index({ code: 1 }, { unique: true });
feeTypeSchema.index({ isActive: 1, isMandatory: 1 });
feeTypeSchema.index({ frequency: 1 });
feeTypeSchema.index({ sortOrder: 1 });

// ─── Virtuals ─────────────────────────────────
// Formatted amount
feeTypeSchema.virtual('formattedAmount').get(function () {
  return `ETB ${this.amount.toLocaleString()}`;
});

// Display label
feeTypeSchema.virtual('displayLabel').get(function () {
  return `${this.name} (${this.code}) — ETB ${this.amount.toLocaleString()}`;
});

// Frequency display
feeTypeSchema.virtual('frequencyDisplay').get(function () {
  const displays = {
    annual: 'Per Year',
    per_term: 'Per Term',
    monthly: 'Per Month',
    one_time: 'One Time',
    as_needed: 'As Needed',
  };
  return displays[this.frequency] || this.frequency;
});

// ─── Static Methods ───────────────────────────

// Seed default fee types
feeTypeSchema.statics.seedDefaultFeeTypes = async function () {
  const feeTypes = [
    {
      name: 'Tuition Fee',
      code: 'TF',
      description: 'Annual tuition fee for academic instruction',
      amount: 15000,
      frequency: 'annual',
      isMandatory: true,
      isDiscountable: true,
      allowInstallments: true,
      maxInstallments: 3,
      hasLatePenalty: true,
      latePenaltyPercentage: 5,
      graceDays: 30,
      color: '#4f46e5',
      icon: 'graduation-cap',
      sortOrder: 1,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Tuition',
    },
    {
      name: 'Registration Fee',
      code: 'RF',
      description: 'One-time registration fee for new students',
      amount: 500,
      frequency: 'one_time',
      isMandatory: true,
      isDiscountable: false,
      allowInstallments: false,
      color: '#22c55e',
      icon: 'user-plus',
      sortOrder: 2,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Registration',
    },
    {
      name: 'Exam Fee',
      code: 'EF',
      description: 'Fee for examination materials and administration',
      amount: 300,
      frequency: 'per_term',
      isMandatory: true,
      isDiscountable: true,
      allowInstallments: false,
      color: '#f59e0b',
      icon: 'clipboard-list',
      sortOrder: 3,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Examination',
    },
    {
      name: 'Library Fee',
      code: 'LF',
      description: 'Annual library access and maintenance fee',
      amount: 200,
      frequency: 'annual',
      isMandatory: true,
      isDiscountable: true,
      allowInstallments: false,
      color: '#8b5cf6',
      icon: 'book-open',
      sortOrder: 4,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Library',
    },
    {
      name: 'Sports Fee',
      code: 'SF',
      description: 'Sports activities, equipment and PE materials',
      amount: 150,
      frequency: 'annual',
      isMandatory: true,
      isDiscountable: true,
      allowInstallments: false,
      color: '#22c55e',
      icon: 'running',
      sortOrder: 5,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Sports',
    },
    {
      name: 'Laboratory Fee',
      code: 'LAB',
      description: 'Laboratory materials and equipment usage fee',
      amount: 400,
      frequency: 'annual',
      isMandatory: false,
      isDiscountable: true,
      allowInstallments: false,
      color: '#14b8a6',
      icon: 'flask',
      sortOrder: 6,
      isSystem: true,
      appliesToAllGrades: false,
      applicableGrades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
      incomeCategory: 'Laboratory',
    },
    {
      name: 'Uniform Fee',
      code: 'UF',
      description: 'School uniform provision fee',
      amount: 600,
      frequency: 'one_time',
      isMandatory: false,
      isDiscountable: true,
      allowInstallments: false,
      color: '#3b82f6',
      icon: 'shirt',
      sortOrder: 7,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Uniform',
    },
    {
      name: 'Transport Fee',
      code: 'TRF',
      description: 'School bus transportation fee',
      amount: 2400,
      frequency: 'annual',
      isMandatory: false,
      isDiscountable: false,
      allowInstallments: true,
      maxInstallments: 12,
      color: '#f97316',
      icon: 'bus',
      sortOrder: 8,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Transport',
    },
    {
      name: 'Medical Fee',
      code: 'MF',
      description: 'School health services and first aid fee',
      amount: 100,
      frequency: 'annual',
      isMandatory: true,
      isDiscountable: true,
      allowInstallments: false,
      color: '#ef4444',
      icon: 'heart',
      sortOrder: 9,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Medical',
    },
    {
      name: 'Activity Fee',
      code: 'AF',
      description: 'Extracurricular activities and school events fee',
      amount: 250,
      frequency: 'annual',
      isMandatory: false,
      isDiscountable: true,
      allowInstallments: false,
      color: '#ec4899',
      icon: 'star',
      sortOrder: 10,
      isSystem: true,
      appliesToAllGrades: true,
      incomeCategory: 'Activities',
    },
  ];

  for (const feeType of feeTypes) {
    await this.findOneAndUpdate(
      { code: feeType.code },
      { $setOnInsert: feeType },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${feeTypes.length} fee types seeded`);
};

// Find by code
feeTypeSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active fee types
feeTypeSchema.statics.getAllActive = function () {
  return this.find({ isActive: true }).sort({
    sortOrder: 1,
    name: 1,
  });
};

// Get mandatory fee types
feeTypeSchema.statics.getMandatory = function () {
  return this.find({
    isActive: true,
    isMandatory: true,
  }).sort({ sortOrder: 1 });
};

// Get fee types for a specific grade
feeTypeSchema.statics.getForGrade = function (grade) {
  return this.find({
    isActive: true,
    $or: [{ appliesToAllGrades: true }, { applicableGrades: grade }],
  }).sort({ sortOrder: 1 });
};

// Get fee types by frequency
feeTypeSchema.statics.getByFrequency = function (frequency) {
  return this.find({
    isActive: true,
    frequency,
  }).sort({ sortOrder: 1 });
};

// Update collection stats
feeTypeSchema.statics.updateStats = async function (feeTypeId) {
  const FeeAssignment = mongoose.model('FeeAssignment');
  const FeePayment = mongoose.model('FeePayment');

  const [assigned, payments] = await Promise.all([
    FeeAssignment.aggregate([
      {
        $match: {
          feeType: new mongoose.Types.ObjectId(feeTypeId),
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    FeePayment.aggregate([
      {
        $match: {
          feeType: new mongoose.Types.ObjectId(feeTypeId),
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const totalAssigned = assigned[0]?.totalAmount || 0;
  const totalCollected = payments[0]?.totalCollected || 0;
  const totalPending = totalAssigned - totalCollected;
  const collectionRate = totalAssigned > 0 ? Math.round((totalCollected / totalAssigned) * 100) : 0;

  return this.findByIdAndUpdate(
    feeTypeId,
    {
      'stats.totalAssigned': totalAssigned,
      'stats.totalCollected': totalCollected,
      'stats.totalPending': totalPending,
      'stats.collectionRate': collectionRate,
      'stats.lastUpdated': new Date(),
    },
    { new: true }
  );
};

// Get dashboard stats
feeTypeSchema.statics.getDashboardStats = async function () {
  const [total, mandatory, byFrequency] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments({
      isActive: true,
      isMandatory: true,
    }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$frequency',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    total,
    mandatory,
    optional: total - mandatory,
    byFrequency,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if fee type applies to a grade
feeTypeSchema.methods.appliesToGrade = function (grade) {
  if (this.appliesToAllGrades) return true;
  return this.applicableGrades.includes(grade);
};

// Calculate late penalty for overdue amount
feeTypeSchema.methods.calculateLatePenalty = function (amount, daysOverdue) {
  if (!this.hasLatePenalty) return 0;
  if (daysOverdue <= this.graceDays) return 0;
  return (amount * this.latePenaltyPercentage) / 100;
};

// Get installment amount
feeTypeSchema.methods.getInstallmentAmount = function (installmentNumber, totalInstallments) {
  if (!this.allowInstallments) return this.amount;
  return Math.ceil(this.amount / totalInstallments);
};

// ─── Create Model ─────────────────────────────
const FeeType = mongoose.model('FeeType', feeTypeSchema);

module.exports = FeeType;
