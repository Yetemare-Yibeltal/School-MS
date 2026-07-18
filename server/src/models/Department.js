// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// DEPARTMENT MODEL
// kat-school/server/src/models/Department.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { DEFAULT_DEPARTMENTS } = require('../config/constants');

const departmentSchema = new mongoose.Schema(
  {
    // ─── Department Identity ──────────────────
    name: {
      type: String,
      required: [true, 'Department name is required'],
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

    // ─── Department Head ──────────────────────
    // Reference to Employee who heads this department
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    headName: {
      type: String,
      trim: true,
      default: null,
    },

    headPhone: {
      type: String,
      trim: true,
      default: null,
    },

    headEmail: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Contact Information ──────────────────
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    // Location within school
    location: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Budget ──────────────────────────────
    annualBudget: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentYearSpending: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Employee Stats (cached) ──────────────
    totalEmployees: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeEmployees: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Payroll Stats (cached) ───────────────
    monthlyPayroll: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Designations ────────────────────────
    // Designations available in this department
    designations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Designation',
      },
    ],

    // ─── Parent Department ────────────────────
    // For sub-departments
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },

    // ─── UI Display ──────────────────────────
    color: {
      type: String,
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    icon: {
      type: String,
      default: 'building',
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
departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ sortOrder: 1 });
departmentSchema.index({ head: 1 });

// ─── Virtuals ─────────────────────────────────
// Budget utilization percentage
departmentSchema.virtual('budgetUtilization').get(function () {
  if (!this.annualBudget) return 0;
  return Math.round((this.currentYearSpending / this.annualBudget) * 100);
});

// Remaining budget
departmentSchema.virtual('remainingBudget').get(function () {
  return Math.max(0, this.annualBudget - this.currentYearSpending);
});

// Is over budget
departmentSchema.virtual('isOverBudget').get(function () {
  if (!this.annualBudget) return false;
  return this.currentYearSpending > this.annualBudget;
});

// ─── Static Methods ───────────────────────────

// Seed default departments
departmentSchema.statics.seedDefaultDepartments = async function () {
  const departments = [
    {
      name: 'Academic',
      code: 'ACD',
      description: 'Teaching and academic staff',
      color: '#4f46e5',
      icon: 'book-open',
      sortOrder: 1,
      isSystem: true,
      annualBudget: 3500000,
    },
    {
      name: 'Administration',
      code: 'ADM',
      description: 'Administrative and management staff',
      color: '#3b82f6',
      icon: 'briefcase',
      sortOrder: 2,
      isSystem: true,
      annualBudget: 500000,
    },
    {
      name: 'Finance',
      code: 'FIN',
      description: 'Finance and accounting staff',
      color: '#22c55e',
      icon: 'dollar-sign',
      sortOrder: 3,
      isSystem: true,
      annualBudget: 300000,
    },
    {
      name: 'Library',
      code: 'LIB',
      description: 'Library services and resources',
      color: '#8b5cf6',
      icon: 'book',
      sortOrder: 4,
      isSystem: true,
      annualBudget: 150000,
    },
    {
      name: 'Security',
      code: 'SEC',
      description: 'Security personnel and campus safety',
      color: '#ef4444',
      icon: 'shield',
      sortOrder: 5,
      isSystem: true,
      annualBudget: 200000,
    },
    {
      name: 'Cleaning',
      code: 'CLN',
      description: 'Cleaning and maintenance staff',
      color: '#14b8a6',
      icon: 'wind',
      sortOrder: 6,
      isSystem: true,
      annualBudget: 120000,
    },
    {
      name: 'ICT',
      code: 'ICT',
      description: 'Information and communication technology',
      color: '#0ea5e9',
      icon: 'monitor',
      sortOrder: 7,
      isSystem: true,
      annualBudget: 180000,
    },
    {
      name: 'Sports',
      code: 'SPT',
      description: 'Physical education and sports activities',
      color: '#f97316',
      icon: 'activity',
      sortOrder: 8,
      isSystem: true,
      annualBudget: 100000,
    },
    {
      name: 'Counseling',
      code: 'CNS',
      description: 'Student counseling and support services',
      color: '#ec4899',
      icon: 'heart',
      sortOrder: 9,
      isSystem: true,
      annualBudget: 80000,
    },
  ];

  for (const dept of departments) {
    await this.findOneAndUpdate(
      { code: dept.code },
      {
        $setOnInsert: {
          ...dept,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${departments.length} departments seeded`);
};

// Find by code
departmentSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active departments
departmentSchema.statics.getAllActive = function () {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .populate('head', 'firstName fatherName photo')
    .populate('designations', 'name code');
};

// Update employee counts
departmentSchema.statics.updateEmployeeCount = async function (departmentId) {
  const Employee = mongoose.model('Employee');

  const [total, active, payroll] = await Promise.all([
    Employee.countDocuments({
      department: departmentId,
    }),
    Employee.countDocuments({
      department: departmentId,
      status: 'active',
    }),
    Employee.aggregate([
      {
        $match: {
          department: new mongoose.Types.ObjectId(departmentId),
          status: 'active',
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$salary.basicSalary',
          },
        },
      },
    ]),
  ]);

  return this.findByIdAndUpdate(
    departmentId,
    {
      totalEmployees: total,
      activeEmployees: active,
      monthlyPayroll: payroll[0]?.total || 0,
    },
    { new: true }
  );
};

// Update all department employee counts
departmentSchema.statics.updateAllCounts = async function () {
  const departments = await this.find({
    isActive: true,
  });

  await Promise.all(departments.map((dept) => this.updateEmployeeCount(dept._id)));

  console.info('✅ All department employee counts updated');
};

// Add designation to department
departmentSchema.statics.addDesignation = async function (departmentId, designationId) {
  return this.findByIdAndUpdate(
    departmentId,
    {
      $addToSet: {
        designations: designationId,
      },
    },
    { new: true }
  );
};

// Remove designation from department
departmentSchema.statics.removeDesignation = async function (departmentId, designationId) {
  return this.findByIdAndUpdate(
    departmentId,
    {
      $pull: { designations: designationId },
    },
    { new: true }
  );
};

// Assign department head
departmentSchema.statics.assignHead = async function (
  departmentId,
  employeeId,
  employeeName,
  phone,
  email
) {
  return this.findByIdAndUpdate(
    departmentId,
    {
      head: employeeId,
      headName: employeeName,
      headPhone: phone || null,
      headEmail: email || null,
    },
    { new: true }
  );
};

// Get department with full employee list
departmentSchema.statics.getWithEmployees = async function (departmentId) {
  const Employee = mongoose.model('Employee');

  const [department, employees] = await Promise.all([
    this.findById(departmentId)
      .populate('head', 'firstName fatherName photo')
      .populate('designations', 'name code'),
    Employee.find({
      department: departmentId,
      status: 'active',
    })
      .select(
        'firstName fatherName employeeId designationName salary.basicSalary status photo joinDate'
      )
      .sort({ firstName: 1 }),
  ]);

  return { department, employees };
};

// Get dashboard stats
departmentSchema.statics.getDashboardStats = async function () {
  const [total, totalEmployees, totalPayroll, byDepartment] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: '$activeEmployees' },
        },
      },
    ]),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: '$monthlyPayroll' },
        },
      },
    ]),
    this.find({ isActive: true })
      .sort({ activeEmployees: -1 })
      .select('name code color activeEmployees monthlyPayroll'),
  ]);

  return {
    total,
    totalEmployees: totalEmployees[0]?.total || 0,
    totalMonthlyPayroll: totalPayroll[0]?.total || 0,
    byDepartment,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if has employees
departmentSchema.methods.hasEmployees = function () {
  return this.activeEmployees > 0;
};

// Get budget status
departmentSchema.methods.getBudgetStatus = function () {
  const utilization = this.budgetUtilization;
  if (!this.annualBudget) return { status: 'no_budget', utilization: 0 };
  if (utilization >= 100) return { status: 'over_budget', utilization };
  if (utilization >= 90) return { status: 'critical', utilization };
  if (utilization >= 75) return { status: 'warning', utilization };
  return { status: 'on_track', utilization };
};

// Get summary
departmentSchema.methods.getSummary = function () {
  return {
    name: this.name,
    code: this.code,
    head: this.headName,
    employees: this.activeEmployees,
    monthlyPayroll: this.monthlyPayroll,
    budget: this.annualBudget,
    budgetStatus: this.getBudgetStatus(),
  };
};

// ─── Create Model ─────────────────────────────
const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
