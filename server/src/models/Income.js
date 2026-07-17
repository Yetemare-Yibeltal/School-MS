// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// INCOME MODEL
// kat-school/server/src/models/Income.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../config/constants');

const incomeSchema = new mongoose.Schema(
  {
    // ─── Income Identity ──────────────────────
    // Auto-generated income number
    incomeNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Income title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // ─── Category ────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Government Grant',
          'Donation',
          'Rental Income',
          'Canteen Income',
          'Event Income',
          'Bank Interest',
          'Sale of Assets',
          'Registration Fee',
          'Tuition Fee',
          'Exam Fee',
          'Library Fee',
          'Sports Fee',
          'Laboratory Fee',
          'Uniform Fee',
          'Transport Fee',
          'Medical Fee',
          'Activity Fee',
          'Other Fee',
          'Other',
        ],
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },

    // Sub-category for more detail
    subCategory: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Amount ──────────────────────────────
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },

    currency: {
      type: String,
      default: 'ETB',
      trim: true,
    },

    // Tax amount if applicable
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Net amount after tax
    netAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Source ──────────────────────────────
    source: {
      type: String,
      trim: true,
      maxlength: [200, 'Source cannot exceed 200 characters'],
    },

    // If from a student/guardian
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },

    guardian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guardian',
      default: null,
    },

    // Linked fee payment
    feePayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeePayment',
      default: null,
    },

    // ─── Academic Context ─────────────────────
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

    // ─── Date ────────────────────────────────
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true,
    },

    // Ethiopian calendar month
    ethiopianMonth: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Payment Details ──────────────────────
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: PAYMENT_METHODS,
        message: '{VALUE} is not a valid method',
      },
    },

    transactionReference: {
      type: String,
      trim: true,
      default: null,
    },

    bankName: {
      type: String,
      trim: true,
      default: null,
    },

    chequeNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Received By ─────────────────────────
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Received by is required'],
    },

    receivedByName: {
      type: String,
      trim: true,
    },

    // ─── Document ────────────────────────────
    // Supporting document (receipt/invoice)
    document: {
      name: { type: String, trim: true },
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },

    // Invoice number from source
    invoiceNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── GL Account ──────────────────────────
    glAccountCode: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Status ──────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'pending', 'cancelled', 'refunded'],
        message: '{VALUE} is not a valid status',
      },
      default: 'confirmed',
      index: true,
    },

    // Whether entry is approved
    isApproved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
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
incomeSchema.index({ date: -1, category: 1 });
incomeSchema.index({ academicYear: 1, category: 1 });
incomeSchema.index({ academicYear: 1, date: -1 });
incomeSchema.index({ status: 1 });
incomeSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Formatted amount
incomeSchema.virtual('formattedAmount').get(function () {
  return `ETB ${this.amount.toLocaleString()}`;
});

// Formatted date
incomeSchema.virtual('formattedDate').get(function () {
  if (!this.date) return '';
  return new Date(this.date).toLocaleDateString('en-ET', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// ─── Pre-Save Hook ────────────────────────────
incomeSchema.pre('save', async function (next) {
  // Auto-generate income number
  if (this.isNew && !this.incomeNumber) {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');

      const count = await mongoose.model('Income').countDocuments({
        createdAt: {
          $gte: new Date(year, today.getMonth(), 1),
        },
      });

      const sequence = String(count + 1).padStart(4, '0');
      this.incomeNumber = `INC-${year}${month}-${sequence}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Auto-calculate net amount
  if (this.isModified('amount') || this.isModified('taxAmount')) {
    this.netAmount = (this.amount || 0) - (this.taxAmount || 0);
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Get income by category for a period
incomeSchema.statics.getByCategoryForPeriod = async function (
  academicYearId,
  startDate = null,
  endDate = null
) {
  const match = {
    academicYear: new mongoose.Types.ObjectId(academicYearId),
    status: 'confirmed',
  };

  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        transactions: {
          $push: {
            title: '$title',
            amount: '$amount',
            date: '$date',
          },
        },
      },
    },
    { $sort: { total: -1 } },
  ]);
};

// Get monthly income totals
incomeSchema.statics.getMonthlyTotals = async function (academicYearId) {
  return this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        status: 'confirmed',
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          year: { $year: '$date' },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
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

// Get total income for academic year
incomeSchema.statics.getTotalForYear = async function (academicYearId) {
  const result = await this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        status: 'confirmed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { total: 0, count: 0 };
};

// Get income for date range
incomeSchema.statics.getForDateRange = function (startDate, endDate, academicYearId) {
  return this.find({
    academicYear: academicYearId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
    status: 'confirmed',
  })
    .sort({ date: -1 })
    .populate('receivedBy', 'firstName fatherName');
};

// Get today's income
incomeSchema.statics.getTodayIncome = async function (academicYearId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        date: { $gte: today, $lt: tomorrow },
        status: 'confirmed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { total: 0, count: 0 };
};

// Get income vs expense comparison
incomeSchema.statics.getIncomeVsExpense = async function (academicYearId) {
  const Expense = mongoose.model('Expense');

  const [income, expense] = await Promise.all([
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Expense.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          status: 'approved',
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  return { income, expense };
};

// Get dashboard stats
incomeSchema.statics.getDashboardStats = async function (academicYearId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayStats, monthStats, yearStats, byCategory] = await Promise.all([
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          date: { $gte: today, $lt: tomorrow },
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          date: { $gte: thisMonth },
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    today: todayStats[0] || { total: 0, count: 0 },
    month: monthStats[0] || { total: 0, count: 0 },
    year: yearStats[0] || { total: 0, count: 0 },
    topCategories: byCategory,
  };
};

// ─── Instance Methods ─────────────────────────

// Approve income entry
incomeSchema.methods.approve = async function (userId) {
  this.isApproved = true;
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.status = 'confirmed';
  await this.save();
  return this;
};

// Cancel income entry
incomeSchema.methods.cancel = async function (reason) {
  this.status = 'cancelled';
  this.notes = reason ? `${this.notes || ''} | Cancelled: ${reason}` : this.notes;
  await this.save();
  return this;
};

// Get formatted summary
incomeSchema.methods.getSummary = function () {
  return {
    incomeNumber: this.incomeNumber,
    title: this.title,
    category: this.category,
    amount: this.amount,
    formattedAmount: this.formattedAmount,
    date: this.formattedDate,
    method: this.paymentMethod,
    status: this.status,
  };
};

// ─── Create Model ─────────────────────────────
const Income = mongoose.model('Income', incomeSchema);

module.exports = Income;
