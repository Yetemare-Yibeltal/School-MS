// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SALARY COMPONENT MODEL
// kat-school/server/src/models/SalaryComponent.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { SALARY_COMPONENTS } = require('../config/constants');

const salaryComponentSchema = new mongoose.Schema(
  {
    // ─── Component Identity ───────────────────
    name: {
      type: String,
      required: [true, 'Component name is required'],
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

    // ─── Component Type ───────────────────────
    type: {
      type: String,
      required: [true, 'Component type is required'],
      enum: {
        values: ['earning', 'deduction'],
        message: '{VALUE} is not a valid type',
      },
      index: true,
    },

    // ─── Calculation ──────────────────────────
    calculationType: {
      type: String,
      required: [true, 'Calculation type is required'],
      enum: {
        values: [
          'fixed',
          'percentage_of_basic',
          'percentage_of_gross',
          'percentage_of_taxable',
          'tax_bracket',
          'formula',
          'manual',
        ],
        message: '{VALUE} is not a valid calculation type',
      },
      default: 'fixed',
    },

    // Default amount
    defaultAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Default percentage
    defaultPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Formula expression (if calculationType is formula)
    formula: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Tax & Compliance ─────────────────────
    // Whether this component is taxable
    isTaxable: {
      type: Boolean,
      default: true,
    },

    // Whether this affects taxable income
    affectsTaxableIncome: {
      type: Boolean,
      default: true,
    },

    // Whether this is statutory (government mandated)
    isStatutory: {
      type: Boolean,
      default: false,
    },

    // ─── Component Flags ──────────────────────
    // Whether this is the basic salary component
    isBasic: {
      type: Boolean,
      default: false,
    },

    // Whether this is income tax
    isIncomeTax: {
      type: Boolean,
      default: false,
    },

    // Whether this is employee pension
    isEmployeePension: {
      type: Boolean,
      default: false,
    },

    // Whether this is employer pension
    isEmployerPension: {
      type: Boolean,
      default: false,
    },

    // Whether this is deducted from employee pay
    isDeductedFromEmployee: {
      type: Boolean,
      default: true,
    },

    // Whether this is mandatory
    isMandatory: {
      type: Boolean,
      default: false,
    },

    // Whether this can be overridden per employee
    isOverridable: {
      type: Boolean,
      default: true,
    },

    // Whether this appears on salary slip
    showOnSalarySlip: {
      type: Boolean,
      default: true,
    },

    // ─── Limits ──────────────────────────────
    minAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    maxAmount: {
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
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    icon: {
      type: String,
      default: 'dollar-sign',
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
salaryComponentSchema.index({ name: 1 }, { unique: true });
salaryComponentSchema.index({ code: 1 }, { unique: true });
salaryComponentSchema.index({ type: 1, isActive: 1 });
salaryComponentSchema.index({ sortOrder: 1 });
salaryComponentSchema.index({ isSystem: 1 });

// ─── Virtuals ─────────────────────────────────
// Is earning
salaryComponentSchema.virtual('isEarning').get(function () {
  return this.type === 'earning';
});

// Is deduction
salaryComponentSchema.virtual('isDeduction').get(function () {
  return this.type === 'deduction';
});

// Display label
salaryComponentSchema.virtual('displayLabel').get(function () {
  return `${this.name} (${this.code})`;
});

// ─── Static Methods ───────────────────────────

// Seed default salary components
salaryComponentSchema.statics.seedDefaultComponents = async function () {
  const components = [
    // ── Earnings ───────────────────────────
    {
      name: 'Basic Salary',
      code: 'BASIC',
      description: 'Base monthly salary before allowances',
      type: 'earning',
      calculationType: 'fixed',
      defaultAmount: 0,
      isTaxable: true,
      affectsTaxableIncome: true,
      isStatutory: false,
      isBasic: true,
      isIncomeTax: false,
      isEmployeePension: false,
      isEmployerPension: false,
      isDeductedFromEmployee: false,
      isMandatory: true,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#4f46e5',
      icon: 'dollar-sign',
      sortOrder: 1,
      isSystem: true,
      glAccountCode: 'SAL-001',
    },
    {
      name: 'Housing Allowance',
      code: 'HOUSE',
      description: 'Monthly housing/accommodation allowance',
      type: 'earning',
      calculationType: 'fixed',
      defaultAmount: 0,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: false,
      isBasic: false,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#22c55e',
      icon: 'home',
      sortOrder: 2,
      isSystem: true,
      glAccountCode: 'SAL-002',
    },
    {
      name: 'Transport Allowance',
      code: 'TRANS',
      description: 'Monthly transport/commuting allowance',
      type: 'earning',
      calculationType: 'fixed',
      defaultAmount: 0,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: false,
      isBasic: false,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#f59e0b',
      icon: 'truck',
      sortOrder: 3,
      isSystem: true,
      glAccountCode: 'SAL-003',
    },
    {
      name: 'Medical Allowance',
      code: 'MED',
      description: 'Monthly medical/health allowance',
      type: 'earning',
      calculationType: 'fixed',
      defaultAmount: 0,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: false,
      isBasic: false,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#ef4444',
      icon: 'heart',
      sortOrder: 4,
      isSystem: true,
      glAccountCode: 'SAL-004',
    },
    {
      name: 'Teaching Allowance',
      code: 'TEACH',
      description: 'Additional allowance for teaching staff',
      type: 'earning',
      calculationType: 'fixed',
      defaultAmount: 0,
      isTaxable: true,
      affectsTaxableIncome: true,
      isStatutory: false,
      isBasic: false,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#3b82f6',
      icon: 'book-open',
      sortOrder: 5,
      isSystem: true,
      glAccountCode: 'SAL-005',
    },
    {
      name: 'Management Allowance',
      code: 'MGT',
      description: 'Allowance for management positions',
      type: 'earning',
      calculationType: 'fixed',
      defaultAmount: 0,
      isTaxable: true,
      affectsTaxableIncome: true,
      isStatutory: false,
      isBasic: false,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#8b5cf6',
      icon: 'briefcase',
      sortOrder: 6,
      isSystem: true,
      glAccountCode: 'SAL-006',
    },
    {
      name: 'Overtime Pay',
      code: 'OT',
      description: 'Payment for overtime hours worked',
      type: 'earning',
      calculationType: 'manual',
      defaultAmount: 0,
      isTaxable: true,
      affectsTaxableIncome: true,
      isStatutory: false,
      isBasic: false,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#f97316',
      icon: 'clock',
      sortOrder: 7,
      isSystem: true,
      glAccountCode: 'SAL-007',
    },
    {
      name: 'Bonus',
      code: 'BONUS',
      description: 'Performance bonus or special payment',
      type: 'earning',
      calculationType: 'manual',
      defaultAmount: 0,
      isTaxable: true,
      affectsTaxableIncome: true,
      isStatutory: false,
      isBasic: false,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#eab308',
      icon: 'star',
      sortOrder: 8,
      isSystem: true,
      glAccountCode: 'SAL-008',
    },
    {
      name: 'Other Allowances',
      code: 'OTHER',
      description: 'Any other additional allowances',
      type: 'earning',
      calculationType: 'fixed',
      defaultAmount: 0,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: false,
      isBasic: false,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#94a3b8',
      icon: 'plus-circle',
      sortOrder: 9,
      isSystem: true,
      glAccountCode: 'SAL-009',
    },

    // ── Deductions ─────────────────────────
    {
      name: 'Income Tax',
      code: 'ITAX',
      description: 'Ethiopian income tax per government tax brackets',
      type: 'deduction',
      calculationType: 'tax_bracket',
      defaultAmount: 0,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: true,
      isBasic: false,
      isIncomeTax: true,
      isEmployeePension: false,
      isEmployerPension: false,
      isDeductedFromEmployee: true,
      isMandatory: true,
      isOverridable: false,
      showOnSalarySlip: true,
      color: '#ef4444',
      icon: 'percent',
      sortOrder: 10,
      isSystem: true,
      glAccountCode: 'DED-001',
    },
    {
      name: 'Employee Pension (7%)',
      code: 'EMP_PEN',
      description: 'Employee pension contribution — 7% of basic salary',
      type: 'deduction',
      calculationType: 'percentage_of_basic',
      defaultAmount: 0,
      defaultPercentage: 7,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: true,
      isBasic: false,
      isIncomeTax: false,
      isEmployeePension: true,
      isEmployerPension: false,
      isDeductedFromEmployee: true,
      isMandatory: true,
      isOverridable: false,
      showOnSalarySlip: true,
      color: '#8b5cf6',
      icon: 'shield',
      sortOrder: 11,
      isSystem: true,
      glAccountCode: 'DED-002',
    },
    {
      name: 'Employer Pension (11%)',
      code: 'EMPR_PEN',
      description: 'Employer pension contribution — 11% of basic salary',
      type: 'deduction',
      calculationType: 'percentage_of_basic',
      defaultAmount: 0,
      defaultPercentage: 11,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: true,
      isBasic: false,
      isIncomeTax: false,
      isEmployeePension: false,
      isEmployerPension: true,
      isDeductedFromEmployee: false,
      isMandatory: true,
      isOverridable: false,
      showOnSalarySlip: true,
      color: '#7c3aed',
      icon: 'building',
      sortOrder: 12,
      isSystem: true,
      glAccountCode: 'DED-003',
    },
    {
      name: 'Absence Deduction',
      code: 'ABS',
      description: 'Salary deduction for unauthorized absences',
      type: 'deduction',
      calculationType: 'formula',
      defaultAmount: 0,
      formula: 'basicSalary / workingDays * absentDays',
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: false,
      isBasic: false,
      isDeductedFromEmployee: true,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#f59e0b',
      icon: 'calendar-x',
      sortOrder: 13,
      isSystem: true,
      glAccountCode: 'DED-004',
    },
    {
      name: 'Loan Deduction',
      code: 'LOAN',
      description: 'Monthly repayment for staff salary loans',
      type: 'deduction',
      calculationType: 'manual',
      defaultAmount: 0,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: false,
      isBasic: false,
      isDeductedFromEmployee: true,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#6b7280',
      icon: 'credit-card',
      sortOrder: 14,
      isSystem: true,
      glAccountCode: 'DED-005',
    },
    {
      name: 'Late Deduction',
      code: 'LATE',
      description: 'Deduction for repeated late arrivals',
      type: 'deduction',
      calculationType: 'manual',
      defaultAmount: 0,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: false,
      isBasic: false,
      isDeductedFromEmployee: true,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#f97316',
      icon: 'clock',
      sortOrder: 15,
      isSystem: true,
      glAccountCode: 'DED-006',
    },
    {
      name: 'Other Deductions',
      code: 'OTHER_DED',
      description: 'Any other deductions',
      type: 'deduction',
      calculationType: 'manual',
      defaultAmount: 0,
      isTaxable: false,
      affectsTaxableIncome: false,
      isStatutory: false,
      isBasic: false,
      isDeductedFromEmployee: true,
      isMandatory: false,
      isOverridable: true,
      showOnSalarySlip: true,
      color: '#94a3b8',
      icon: 'minus-circle',
      sortOrder: 16,
      isSystem: true,
      glAccountCode: 'DED-007',
    },
  ];

  for (const component of components) {
    await this.findOneAndUpdate(
      { code: component.code },
      { $setOnInsert: { ...component, isActive: true } },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${components.length} salary components seeded`);
};

// Find by code
salaryComponentSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active components
salaryComponentSchema.statics.getAllActive = function () {
  return this.find({ isActive: true }).sort({
    sortOrder: 1,
  });
};

// Get earning components
salaryComponentSchema.statics.getEarnings = function () {
  return this.find({
    type: 'earning',
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Get deduction components
salaryComponentSchema.statics.getDeductions = function () {
  return this.find({
    type: 'deduction',
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Get statutory components
salaryComponentSchema.statics.getStatutory = function () {
  return this.find({
    isStatutory: true,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Get grouped by type
salaryComponentSchema.statics.getGrouped = async function () {
  const components = await this.find({
    isActive: true,
  }).sort({ sortOrder: 1 });

  return {
    earnings: components.filter((c) => c.type === 'earning'),
    deductions: components.filter((c) => c.type === 'deduction'),
  };
};

// Get dashboard stats
salaryComponentSchema.statics.getDashboardStats = async function () {
  const [total, earnings, deductions, statutory] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments({
      type: 'earning',
      isActive: true,
    }),
    this.countDocuments({
      type: 'deduction',
      isActive: true,
    }),
    this.countDocuments({
      isStatutory: true,
      isActive: true,
    }),
  ]);

  return { total, earnings, deductions, statutory };
};

// ─── Instance Methods ─────────────────────────

// Calculate component value for given inputs
salaryComponentSchema.methods.calculate = function ({
  basicSalary = 0,
  grossSalary = 0,
  taxableIncome = 0,
  workingDays = 26,
  absentDays = 0,
  overrideAmount = null,
}) {
  if (overrideAmount !== null) {
    return overrideAmount;
  }

  switch (this.calculationType) {
    case 'fixed':
      return this.defaultAmount || 0;

    case 'percentage_of_basic':
      return (basicSalary * (this.defaultPercentage || 0)) / 100;

    case 'percentage_of_gross':
      return (grossSalary * (this.defaultPercentage || 0)) / 100;

    case 'percentage_of_taxable':
      return (taxableIncome * (this.defaultPercentage || 0)) / 100;

    case 'formula':
      // Absence deduction formula
      if (this.code === 'ABS' && absentDays > 0) {
        const dailyRate = basicSalary / (workingDays || 26);
        return dailyRate * absentDays;
      }
      return 0;

    case 'manual':
      return this.defaultAmount || 0;

    default:
      return 0;
  }
};

// Check if amount is within limits
salaryComponentSchema.methods.isWithinLimits = function (amount) {
  if (this.minAmount && amount < this.minAmount) return false;
  if (this.maxAmount && amount > this.maxAmount) return false;
  return true;
};

// ─── Create Model ─────────────────────────────
const SalaryComponent = mongoose.model('SalaryComponent', salaryComponentSchema);

module.exports = SalaryComponent;
