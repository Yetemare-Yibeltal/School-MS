// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXPENSE CATEGORY MODEL
// kat-school/server/src/models/ExpenseCategory.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema(
  {
    // ─── Category Identity ────────────────────
    name: {
      type: String,
      required: [true, 'Category name is required'],
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
      match: [/^[A-Z0-9_]+$/, 'Code must be uppercase letters and numbers only'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ─── Budget ──────────────────────────────
    // Annual budget allocated for this category
    annualBudget: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Term-wise budget
    termBudget: {
      term1: { type: Number, default: 0 },
      term2: { type: Number, default: 0 },
      term3: { type: Number, default: 0 },
    },

    // Current year spending (cached)
    currentYearSpending: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Approval Rules ───────────────────────
    // Whether this category requires special approval
    requiresSpecialApproval: {
      type: Boolean,
      default: false,
    },

    // Minimum amount requiring second approval
    secondApprovalThreshold: {
      type: Number,
      default: 10000,
      min: 0,
    },

    // Maximum amount allowed per transaction
    maxTransactionAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    // ─── GL Account ──────────────────────────
    glAccountCode: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── UI Display ──────────────────────────
    color: {
      type: String,
      default: '#6366f1',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    bgColor: {
      type: String,
      default: '#eef2ff',
    },

    icon: {
      type: String,
      default: 'tag',
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

    isRecurring: {
      type: Boolean,
      default: false,
    },

    // ─── Stats (cached) ───────────────────────
    stats: {
      totalExpenses: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      lastExpenseDate: { type: Date, default: null },
      lastUpdated: { type: Date, default: null },
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
expenseCategorySchema.index({ name: 1 }, { unique: true });
expenseCategorySchema.index({ code: 1 }, { unique: true });
expenseCategorySchema.index({ isActive: 1 });
expenseCategorySchema.index({ sortOrder: 1 });

// ─── Virtuals ─────────────────────────────────
// Budget utilization percentage
expenseCategorySchema.virtual('budgetUtilization').get(function () {
  if (!this.annualBudget) return 0;
  return Math.round((this.currentYearSpending / this.annualBudget) * 100);
});

// Remaining budget
expenseCategorySchema.virtual('remainingBudget').get(function () {
  return Math.max(0, this.annualBudget - this.currentYearSpending);
});

// Is over budget
expenseCategorySchema.virtual('isOverBudget').get(function () {
  if (!this.annualBudget) return false;
  return this.currentYearSpending > this.annualBudget;
});

// Formatted annual budget
expenseCategorySchema.virtual('formattedBudget').get(function () {
  return `ETB ${this.annualBudget.toLocaleString()}`;
});

// ─── Static Methods ───────────────────────────

// Seed default expense categories
expenseCategorySchema.statics.seedDefaultCategories = async function () {
  const categories = [
    {
      name: 'Staff Salaries',
      code: 'SAL',
      description: 'Teaching and non-teaching staff salaries',
      annualBudget: 3000000,
      color: '#4f46e5',
      bgColor: '#eef2ff',
      icon: 'users',
      sortOrder: 1,
      isSystem: true,
      isRecurring: true,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 50000,
      glAccountCode: 'EXP-001',
    },
    {
      name: 'Utilities',
      code: 'UTIL',
      description: 'Electricity, water, internet, telephone',
      annualBudget: 120000,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: 'zap',
      sortOrder: 2,
      isSystem: true,
      isRecurring: true,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 10000,
      glAccountCode: 'EXP-002',
    },
    {
      name: 'Maintenance & Repairs',
      code: 'MAINT',
      description: 'Building maintenance, equipment repairs',
      annualBudget: 150000,
      color: '#f97316',
      bgColor: '#ffedd5',
      icon: 'tool',
      sortOrder: 3,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 10000,
      glAccountCode: 'EXP-003',
    },
    {
      name: 'Office Supplies',
      code: 'SUPPLIES',
      description: 'Stationery, printing materials, cleaning supplies',
      annualBudget: 80000,
      color: '#22c55e',
      bgColor: '#dcfce7',
      icon: 'package',
      sortOrder: 4,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 5000,
      glAccountCode: 'EXP-004',
    },
    {
      name: 'Equipment & Furniture',
      code: 'EQUIP',
      description: 'Computers, lab equipment, desks, chairs',
      annualBudget: 200000,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      icon: 'monitor',
      sortOrder: 5,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: true,
      secondApprovalThreshold: 10000,
      maxTransactionAmount: 100000,
      glAccountCode: 'EXP-005',
    },
    {
      name: 'Events & Activities',
      code: 'EVENTS',
      description: 'School events, sports day, graduation ceremony',
      annualBudget: 100000,
      color: '#ec4899',
      bgColor: '#fce7f3',
      icon: 'calendar',
      sortOrder: 6,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 15000,
      glAccountCode: 'EXP-006',
    },
    {
      name: 'Cleaning & Sanitation',
      code: 'CLEAN',
      description: 'Cleaning supplies, pest control, waste management',
      annualBudget: 60000,
      color: '#14b8a6',
      bgColor: '#ccfbf1',
      icon: 'wind',
      sortOrder: 7,
      isSystem: true,
      isRecurring: true,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 5000,
      glAccountCode: 'EXP-007',
    },
    {
      name: 'Security',
      code: 'SEC',
      description: 'Security personnel, CCTV, alarm systems',
      annualBudget: 90000,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      icon: 'shield',
      sortOrder: 8,
      isSystem: true,
      isRecurring: true,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 10000,
      glAccountCode: 'EXP-008',
    },
    {
      name: 'Transport',
      code: 'TRANS',
      description: 'School bus fuel, maintenance, driver salaries',
      annualBudget: 180000,
      color: '#f97316',
      bgColor: '#ffedd5',
      icon: 'truck',
      sortOrder: 9,
      isSystem: true,
      isRecurring: true,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 10000,
      glAccountCode: 'EXP-009',
    },
    {
      name: 'Staff Training & Development',
      code: 'TRAIN',
      description: 'Workshops, seminars, professional development',
      annualBudget: 50000,
      color: '#0ea5e9',
      bgColor: '#e0f2fe',
      icon: 'book-open',
      sortOrder: 10,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 10000,
      glAccountCode: 'EXP-010',
    },
    {
      name: 'Medical & Health',
      code: 'MED',
      description: 'First aid supplies, school nurse, health programs',
      annualBudget: 40000,
      color: '#ef4444',
      bgColor: '#fee2e2',
      icon: 'heart',
      sortOrder: 11,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 5000,
      glAccountCode: 'EXP-011',
    },
    {
      name: 'Library Resources',
      code: 'LIB',
      description: 'Books, journals, digital resources for library',
      annualBudget: 60000,
      color: '#7c3aed',
      bgColor: '#ede9fe',
      icon: 'book',
      sortOrder: 12,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 10000,
      glAccountCode: 'EXP-012',
    },
    {
      name: 'Food & Catering',
      code: 'FOOD',
      description: 'Staff refreshments, event catering, canteen supplies',
      annualBudget: 30000,
      color: '#d97706',
      bgColor: '#fef3c7',
      icon: 'coffee',
      sortOrder: 13,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 5000,
      glAccountCode: 'EXP-013',
    },
    {
      name: 'Bank Charges & Fees',
      code: 'BANK',
      description: 'Bank transaction fees, service charges',
      annualBudget: 10000,
      color: '#6b7280',
      bgColor: '#f3f4f6',
      icon: 'credit-card',
      sortOrder: 14,
      isSystem: true,
      isRecurring: true,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 5000,
      glAccountCode: 'EXP-014',
    },
    {
      name: 'Miscellaneous',
      code: 'MISC',
      description: 'Other expenses not fitting other categories',
      annualBudget: 50000,
      color: '#94a3b8',
      bgColor: '#f1f5f9',
      icon: 'more-horizontal',
      sortOrder: 15,
      isSystem: true,
      isRecurring: false,
      requiresSpecialApproval: false,
      secondApprovalThreshold: 5000,
      glAccountCode: 'EXP-015',
    },
  ];

  for (const category of categories) {
    await this.findOneAndUpdate(
      { code: category.code },
      {
        $setOnInsert: {
          ...category,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${categories.length} expense categories seeded`);
};

// Find by code
expenseCategorySchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active categories
expenseCategorySchema.statics.getAllActive = function () {
  return this.find({ isActive: true }).sort({
    sortOrder: 1,
    name: 1,
  });
};

// Get categories with budget utilization
expenseCategorySchema.statics.getWithBudgetStatus = async function (academicYearId) {
  const Expense = mongoose.model('Expense');

  const categories = await this.find({
    isActive: true,
  }).sort({ sortOrder: 1 });

  const spendingByCategory = await Expense.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        status: { $in: ['approved', 'paid'] },
      },
    },
    {
      $group: {
        _id: '$category',
        totalSpending: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const spendingMap = {};
  spendingByCategory.forEach((s) => {
    spendingMap[s._id.toString()] = {
      totalSpending: s.totalSpending,
      count: s.count,
    };
  });

  return categories.map((cat) => {
    const spending = spendingMap[cat._id.toString()] || {
      totalSpending: 0,
      count: 0,
    };
    const catObj = cat.toObject();
    catObj.currentYearSpending = spending.totalSpending;
    catObj.expenseCount = spending.count;
    catObj.budgetUtilization = cat.annualBudget
      ? Math.round((spending.totalSpending / cat.annualBudget) * 100)
      : 0;
    catObj.remainingBudget = Math.max(0, cat.annualBudget - spending.totalSpending);
    catObj.isOverBudget = spending.totalSpending > cat.annualBudget;
    return catObj;
  });
};

// Update spending stats for a category
expenseCategorySchema.statics.updateStats = async function (categoryId, academicYearId) {
  const Expense = mongoose.model('Expense');

  const stats = await Expense.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId),
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        status: { $in: ['approved', 'paid'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        lastDate: { $max: '$date' },
      },
    },
  ]);

  const s = stats[0] || {
    total: 0,
    count: 0,
    lastDate: null,
  };

  return this.findByIdAndUpdate(
    categoryId,
    {
      currentYearSpending: s.total,
      'stats.totalExpenses': s.count,
      'stats.totalAmount': s.total,
      'stats.lastExpenseDate': s.lastDate,
      'stats.lastUpdated': new Date(),
    },
    { new: true }
  );
};

// Get budget summary for all categories
expenseCategorySchema.statics.getBudgetSummary = async function (academicYearId) {
  const categories = await this.getWithBudgetStatus(academicYearId);

  const totalBudget = categories.reduce((sum, c) => sum + (c.annualBudget || 0), 0);

  const totalSpending = categories.reduce((sum, c) => sum + (c.currentYearSpending || 0), 0);

  const overBudgetCategories = categories.filter((c) => c.isOverBudget);

  return {
    categories,
    totalBudget,
    totalSpending,
    remainingBudget: Math.max(0, totalBudget - totalSpending),
    utilizationRate: totalBudget > 0 ? Math.round((totalSpending / totalBudget) * 100) : 0,
    overBudgetCount: overBudgetCategories.length,
    overBudgetCategories,
  };
};

// Get dashboard stats
expenseCategorySchema.statics.getDashboardStats = async function () {
  const [total, withBudget, totalBudget] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments({
      isActive: true,
      annualBudget: { $gt: 0 },
    }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$annualBudget' },
        },
      },
    ]),
  ]);

  return {
    total,
    withBudget,
    withoutBudget: total - withBudget,
    totalBudgetAllocated: totalBudget[0]?.totalBudget || 0,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if a transaction amount requires special approval
expenseCategorySchema.methods.requiresApproval = function (amount) {
  if (this.requiresSpecialApproval) return true;
  return amount >= this.secondApprovalThreshold;
};

// Check if amount exceeds max transaction limit
expenseCategorySchema.methods.exceedsMaxAmount = function (amount) {
  if (!this.maxTransactionAmount) return false;
  return amount > this.maxTransactionAmount;
};

// Get budget status
expenseCategorySchema.methods.getBudgetStatus = function () {
  const utilization = this.budgetUtilization;
  if (!this.annualBudget) return { status: 'no_budget', utilization: 0 };
  if (utilization >= 100) return { status: 'over_budget', utilization };
  if (utilization >= 90) return { status: 'critical', utilization };
  if (utilization >= 75) return { status: 'warning', utilization };
  return { status: 'on_track', utilization };
};

// ─── Create Model ─────────────────────────────
const ExpenseCategory = mongoose.model('ExpenseCategory', expenseCategorySchema);

module.exports = ExpenseCategory;
