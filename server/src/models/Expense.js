// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXPENSE MODEL
// kat-school/server/src/models/Expense.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../config/constants');

const expenseSchema = new mongoose.Schema(
  {
    // ─── Expense Identity ─────────────────────
    expenseNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Expense title is required'],
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: [true, 'Category is required'],
      index: true,
    },

    categoryName: {
      type: String,
      trim: true,
    },

    // Sub-category
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

    // Tax amount
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total including tax
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Vendor / Supplier ────────────────────
    vendor: {
      name: {
        type: String,
        trim: true,
        default: null,
      },
      phone: {
        type: String,
        trim: true,
        default: null,
      },
      address: {
        type: String,
        trim: true,
        default: null,
      },
      tinNumber: {
        type: String,
        trim: true,
        default: null,
      },
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

    // ─── Payment Details ──────────────────────
    paymentMethod: {
      type: String,
      enum: {
        values: [...PAYMENT_METHODS, ''],
        message: '{VALUE} is not a valid method',
      },
      default: '',
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

    // ─── Budget ──────────────────────────────
    // Budget line this expense belongs to
    budgetLine: {
      type: String,
      trim: true,
      default: null,
    },

    // Whether this expense was budgeted
    isBudgeted: {
      type: Boolean,
      default: false,
    },

    // Budgeted amount for comparison
    budgetedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Department ───────────────────────────
    // Which department incurred this expense
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },

    departmentName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Requested By ─────────────────────────
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requested by is required'],
    },

    requestedByName: {
      type: String,
      trim: true,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    // ─── Approval ────────────────────────────
    // Approval workflow stages
    approvalStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled'],
        message: '{VALUE} is not valid',
      },
      default: 'pending',
      index: true,
    },

    // First-level approval (accountant)
    firstApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      approvedByName: { type: String, trim: true },
      approvedAt: { type: Date, default: null },
      remarks: { type: String, trim: true },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', ''],
        default: 'pending',
      },
    },

    // Second-level approval (director/principal)
    secondApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      approvedByName: { type: String, trim: true },
      approvedAt: { type: Date, default: null },
      remarks: { type: String, trim: true },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', ''],
        default: '',
      },
      required: { type: Boolean, default: false },
    },

    // Rejection reason
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // Amount threshold requiring second approval
    secondApprovalThreshold: {
      type: Number,
      default: 10000,
    },

    // ─── Payment Status ───────────────────────
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending_approval', 'approved', 'paid', 'rejected', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    paidByName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Documents ───────────────────────────
    // Supporting documents (receipts, invoices)
    documents: [
      {
        name: { type: String, trim: true },
        type: {
          type: String,
          enum: ['Invoice', 'Receipt', 'Quote', 'Contract', 'Other'],
          default: 'Receipt',
        },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // Invoice number from vendor
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

    // ─── Recurring ───────────────────────────
    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurringFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', ''],
      default: '',
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
expenseSchema.index({ date: -1, category: 1 });
expenseSchema.index({ academicYear: 1, status: 1 });
expenseSchema.index({ approvalStatus: 1 });
expenseSchema.index({ department: 1 });
expenseSchema.index({ requestedBy: 1 });
expenseSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Formatted amount
expenseSchema.virtual('formattedAmount').get(function () {
  return `ETB ${this.amount.toLocaleString()}`;
});

// Is over budget
expenseSchema.virtual('isOverBudget').get(function () {
  if (!this.isBudgeted || !this.budgetedAmount) return false;
  return this.amount > this.budgetedAmount;
});

// Budget variance
expenseSchema.virtual('budgetVariance').get(function () {
  if (!this.isBudgeted || !this.budgetedAmount) return 0;
  return this.amount - this.budgetedAmount;
});

// Requires second approval
expenseSchema.virtual('requiresSecondApproval').get(function () {
  return this.amount >= this.secondApprovalThreshold;
});

// Formatted date
expenseSchema.virtual('formattedDate').get(function () {
  if (!this.date) return '';
  return new Date(this.date).toLocaleDateString('en-ET', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// ─── Pre-Save Hook ────────────────────────────
expenseSchema.pre('save', async function (next) {
  // Auto-generate expense number
  if (this.isNew && !this.expenseNumber) {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');

      const count = await mongoose.model('Expense').countDocuments({
        createdAt: {
          $gte: new Date(year, today.getMonth(), 1),
        },
      });

      const sequence = String(count + 1).padStart(4, '0');
      this.expenseNumber = `EXP-${year}${month}-${sequence}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Auto-calculate total amount
  if (this.isModified('amount') || this.isModified('taxAmount')) {
    this.totalAmount = (this.amount || 0) + (this.taxAmount || 0);
  }

  // Check if second approval required
  if (this.isModified('amount')) {
    this.secondApproval.required = this.amount >= this.secondApprovalThreshold;
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Get expenses by category for period
expenseSchema.statics.getByCategoryForPeriod = async function (
  academicYearId,
  startDate = null,
  endDate = null
) {
  const match = {
    academicYear: new mongoose.Types.ObjectId(academicYearId),
    status: { $in: ['approved', 'paid'] },
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
        categoryName: { $first: '$categoryName' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);
};

// Get monthly expense totals
expenseSchema.statics.getMonthlyTotals = async function (academicYearId) {
  return this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        status: { $in: ['approved', 'paid'] },
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

// Get total expenses for academic year
expenseSchema.statics.getTotalForYear = async function (academicYearId) {
  const result = await this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        status: { $in: ['approved', 'paid'] },
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

// Get pending approval expenses
expenseSchema.statics.getPendingApproval = function (approvalLevel = 'first') {
  const query = {
    status: 'pending_approval',
    approvalStatus: 'pending',
  };

  if (approvalLevel === 'second') {
    query['firstApproval.status'] = 'approved';
    query['secondApproval.required'] = true;
    query['secondApproval.status'] = 'pending';
  } else {
    query['firstApproval.status'] = 'pending';
  }

  return this.find(query)
    .sort({ requestedAt: -1 })
    .populate('category', 'name color')
    .populate('requestedBy', 'firstName fatherName')
    .populate('department', 'name');
};

// Get expenses for date range
expenseSchema.statics.getForDateRange = function (
  startDate,
  endDate,
  academicYearId,
  filters = {}
) {
  return this.find({
    academicYear: academicYearId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
    status: { $in: ['approved', 'paid'] },
    ...filters,
  })
    .sort({ date: -1 })
    .populate('category', 'name color')
    .populate('department', 'name')
    .populate('requestedBy', 'firstName fatherName');
};

// Get department-wise expense breakdown
expenseSchema.statics.getDepartmentBreakdown = async function (academicYearId) {
  return this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        status: { $in: ['approved', 'paid'] },
      },
    },
    {
      $group: {
        _id: '$department',
        departmentName: {
          $first: '$departmentName',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);
};

// Get dashboard stats
expenseSchema.statics.getDashboardStats = async function (academicYearId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayStats, monthStats, yearStats, pendingStats, topCategories] = await Promise.all([
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          date: { $gte: today, $lt: tomorrow },
          status: { $in: ['approved', 'paid'] },
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
          status: { $in: ['approved', 'paid'] },
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
          status: { $in: ['approved', 'paid'] },
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
    this.countDocuments({
      academicYear: academicYearId,
      status: 'pending_approval',
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          status: { $in: ['approved', 'paid'] },
        },
      },
      {
        $group: {
          _id: '$categoryName',
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
    pendingApproval: pendingStats,
    topCategories,
  };
};

// ─── Instance Methods ─────────────────────────

// Submit for approval
expenseSchema.methods.submitForApproval = async function () {
  this.status = 'pending_approval';
  this.approvalStatus = 'pending';
  await this.save();
  return this;
};

// First level approval
expenseSchema.methods.approveFirst = async function (userId, userName, remarks = '') {
  this.firstApproval = {
    approvedBy: userId,
    approvedByName: userName,
    approvedAt: new Date(),
    remarks,
    status: 'approved',
  };

  // Check if second approval needed
  if (this.requiresSecondApproval) {
    this.secondApproval.status = 'pending';
  } else {
    this.approvalStatus = 'approved';
    this.status = 'approved';
  }

  await this.save();
  return this;
};

// Second level approval
expenseSchema.methods.approveSecond = async function (userId, userName, remarks = '') {
  this.secondApproval = {
    ...this.secondApproval,
    approvedBy: userId,
    approvedByName: userName,
    approvedAt: new Date(),
    remarks,
    status: 'approved',
  };

  this.approvalStatus = 'approved';
  this.status = 'approved';
  await this.save();
  return this;
};

// Reject expense
expenseSchema.methods.reject = async function (userId, userName, reason) {
  this.approvalStatus = 'rejected';
  this.status = 'rejected';
  this.rejectionReason = reason;

  // Update whichever approval level rejected it
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

  await this.save();
  return this;
};

// Mark as paid
expenseSchema.methods.markPaid = async function (userId, userName, paymentDetails) {
  this.status = 'paid';
  this.paidAt = new Date();
  this.paidBy = userId;
  this.paidByName = userName;

  if (paymentDetails) {
    this.paymentMethod = paymentDetails.method || this.paymentMethod;
    this.transactionReference = paymentDetails.transactionReference || this.transactionReference;
  }

  await this.save();
  return this;
};

// Cancel expense
expenseSchema.methods.cancel = async function (reason) {
  this.status = 'cancelled';
  this.approvalStatus = 'cancelled';
  this.notes = reason ? `${this.notes || ''} | Cancelled: ${reason}` : this.notes;
  await this.save();
  return this;
};

// Add document
expenseSchema.methods.addDocument = async function (docData, uploadedBy) {
  this.documents.push({
    ...docData,
    uploadedBy,
    uploadedAt: new Date(),
  });
  await this.save();
  return this;
};

// Get summary
expenseSchema.methods.getSummary = function () {
  return {
    expenseNumber: this.expenseNumber,
    title: this.title,
    category: this.categoryName,
    amount: this.amount,
    formattedAmount: this.formattedAmount,
    date: this.formattedDate,
    status: this.status,
    approvalStatus: this.approvalStatus,
    requestedBy: this.requestedByName,
  };
};

// ─── Create Model ─────────────────────────────
const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
