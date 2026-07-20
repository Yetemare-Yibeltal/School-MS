// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SALARY STRUCTURE MODEL
// kat-school/server/src/models/SalaryStructure.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { INCOME_TAX_BRACKETS, PENSION_RATES } = require('../config/constants');

const salaryStructureSchema = new mongoose.Schema(
  {
    // ─── Structure Identity ───────────────────
    name: {
      type: String,
      required: [true, 'Structure name is required'],
      unique: true,
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
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
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ─── Applicability ────────────────────────
    // Which department this structure is for
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

    // Which designation this structure is for
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null,
    },

    designationName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Earnings ────────────────────────────
    // List of earning components
    earnings: [
      {
        component: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SalaryComponent',
          default: null,
        },
        componentName: {
          type: String,
          required: true,
          trim: true,
        },
        componentCode: {
          type: String,
          trim: true,
        },
        // Calculation type
        calculationType: {
          type: String,
          enum: ['fixed', 'percentage_of_basic', 'percentage_of_gross', 'formula'],
          default: 'fixed',
        },
        // Fixed amount in ETB
        amount: {
          type: Number,
          default: 0,
          min: 0,
        },
        // Percentage if calculationType is percentage
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        // Whether this component is taxable
        isTaxable: {
          type: Boolean,
          default: true,
        },
        // Whether this is the basic salary component
        isBasic: {
          type: Boolean,
          default: false,
        },
        // Whether this component is mandatory
        isMandatory: {
          type: Boolean,
          default: true,
        },
        sortOrder: {
          type: Number,
          default: 0,
        },
      },
    ],

    // ─── Deductions ───────────────────────────
    deductions: [
      {
        component: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SalaryComponent',
          default: null,
        },
        componentName: {
          type: String,
          required: true,
          trim: true,
        },
        componentCode: {
          type: String,
          trim: true,
        },
        calculationType: {
          type: String,
          enum: [
            'fixed',
            'percentage_of_basic',
            'percentage_of_gross',
            'percentage_of_taxable',
            'tax_bracket',
            'formula',
          ],
          default: 'fixed',
        },
        amount: {
          type: Number,
          default: 0,
          min: 0,
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        // Whether deduction is auto-calculated
        isAutoCalculated: {
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
        isMandatory: {
          type: Boolean,
          default: true,
        },
        sortOrder: {
          type: Number,
          default: 0,
        },
      },
    ],

    // ─── Tax Configuration ────────────────────
    // Whether to use Ethiopian income tax brackets
    useEthiopianTaxBrackets: {
      type: Boolean,
      default: true,
    },

    // Whether to deduct employee pension (7%)
    deductEmployeePension: {
      type: Boolean,
      default: true,
    },

    // Whether employer contributes pension (11%)
    includeEmployerPension: {
      type: Boolean,
      default: true,
    },

    // ─── Working Days ─────────────────────────
    workingDaysPerMonth: {
      type: Number,
      default: 26,
      min: 1,
      max: 31,
    },

    // ─── Overtime ────────────────────────────
    overtimeEnabled: {
      type: Boolean,
      default: false,
    },

    overtimeRateMultiplier: {
      type: Number,
      default: 1.5,
      min: 1,
      max: 3,
    },

    // ─── Stats (cached) ───────────────────────
    totalEmployees: {
      type: Number,
      default: 0,
    },

    // ─── Type ────────────────────────────────
    isSystem: {
      type: Boolean,
      default: false,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    // ─── Status ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Effective Date ───────────────────────
    effectiveFrom: {
      type: Date,
      default: null,
    },

    effectiveTo: {
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
salaryStructureSchema.index({ name: 1 }, { unique: true });
salaryStructureSchema.index({ code: 1 }, { unique: true });
salaryStructureSchema.index({ isActive: 1 });
salaryStructureSchema.index({ department: 1 });
salaryStructureSchema.index({ designation: 1 });

// ─── Virtuals ─────────────────────────────────
// Total earning components count
salaryStructureSchema.virtual('earningCount').get(function () {
  return this.earnings ? this.earnings.length : 0;
});

// Total deduction components count
salaryStructureSchema.virtual('deductionCount').get(function () {
  return this.deductions ? this.deductions.length : 0;
});

// ─── Static Methods ───────────────────────────

// Seed default salary structures
salaryStructureSchema.statics.seedDefaultStructures = async function () {
  const structures = [
    // ── Teaching Staff Structure ────────────
    {
      name: 'Teaching Staff Salary Structure',
      code: 'TCH_SS',
      description: 'Standard salary structure for all teaching staff',
      isSystem: true,
      isDefault: false,
      useEthiopianTaxBrackets: true,
      deductEmployeePension: true,
      includeEmployerPension: true,
      workingDaysPerMonth: 26,
      earnings: [
        {
          componentName: 'Basic Salary',
          componentCode: 'BASIC',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: true,
          isBasic: true,
          isMandatory: true,
          sortOrder: 1,
        },
        {
          componentName: 'Housing Allowance',
          componentCode: 'HOUSE',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 2,
        },
        {
          componentName: 'Transport Allowance',
          componentCode: 'TRANS',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 3,
        },
        {
          componentName: 'Medical Allowance',
          componentCode: 'MED',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 4,
        },
        {
          componentName: 'Teaching Allowance',
          componentCode: 'TEACH',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: true,
          isBasic: false,
          isMandatory: false,
          sortOrder: 5,
        },
      ],
      deductions: [
        {
          componentName: 'Income Tax',
          componentCode: 'ITAX',
          calculationType: 'tax_bracket',
          amount: 0,
          isAutoCalculated: true,
          isIncomeTax: true,
          isMandatory: true,
          sortOrder: 1,
        },
        {
          componentName: 'Employee Pension (7%)',
          componentCode: 'EMP_PEN',
          calculationType: 'percentage_of_basic',
          percentage: 7,
          amount: 0,
          isAutoCalculated: true,
          isEmployeePension: true,
          isMandatory: true,
          sortOrder: 2,
        },
        {
          componentName: 'Employer Pension (11%)',
          componentCode: 'EMPR_PEN',
          calculationType: 'percentage_of_basic',
          percentage: 11,
          amount: 0,
          isAutoCalculated: true,
          isEmployerPension: true,
          isMandatory: true,
          sortOrder: 3,
        },
        {
          componentName: 'Absence Deduction',
          componentCode: 'ABS',
          calculationType: 'formula',
          amount: 0,
          isAutoCalculated: true,
          isMandatory: false,
          sortOrder: 4,
        },
      ],
    },
    // ── Non-Teaching Staff Structure ────────
    {
      name: 'Non-Teaching Staff Salary Structure',
      code: 'NTCH_SS',
      description: 'Standard structure for admin and support staff',
      isSystem: true,
      isDefault: true,
      useEthiopianTaxBrackets: true,
      deductEmployeePension: true,
      includeEmployerPension: true,
      workingDaysPerMonth: 26,
      earnings: [
        {
          componentName: 'Basic Salary',
          componentCode: 'BASIC',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: true,
          isBasic: true,
          isMandatory: true,
          sortOrder: 1,
        },
        {
          componentName: 'Housing Allowance',
          componentCode: 'HOUSE',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 2,
        },
        {
          componentName: 'Transport Allowance',
          componentCode: 'TRANS',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 3,
        },
        {
          componentName: 'Medical Allowance',
          componentCode: 'MED',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 4,
        },
      ],
      deductions: [
        {
          componentName: 'Income Tax',
          componentCode: 'ITAX',
          calculationType: 'tax_bracket',
          amount: 0,
          isAutoCalculated: true,
          isIncomeTax: true,
          isMandatory: true,
          sortOrder: 1,
        },
        {
          componentName: 'Employee Pension (7%)',
          componentCode: 'EMP_PEN',
          calculationType: 'percentage_of_basic',
          percentage: 7,
          amount: 0,
          isAutoCalculated: true,
          isEmployeePension: true,
          isMandatory: true,
          sortOrder: 2,
        },
        {
          componentName: 'Employer Pension (11%)',
          componentCode: 'EMPR_PEN',
          calculationType: 'percentage_of_basic',
          percentage: 11,
          amount: 0,
          isAutoCalculated: true,
          isEmployerPension: true,
          isMandatory: true,
          sortOrder: 3,
        },
        {
          componentName: 'Absence Deduction',
          componentCode: 'ABS',
          calculationType: 'formula',
          amount: 0,
          isAutoCalculated: true,
          isMandatory: false,
          sortOrder: 4,
        },
        {
          componentName: 'Loan Deduction',
          componentCode: 'LOAN',
          calculationType: 'fixed',
          amount: 0,
          isAutoCalculated: false,
          isMandatory: false,
          sortOrder: 5,
        },
      ],
    },
    // ── Management Structure ────────────────
    {
      name: 'Management Salary Structure',
      code: 'MGT_SS',
      description: 'Salary structure for principal and management',
      isSystem: true,
      isDefault: false,
      useEthiopianTaxBrackets: true,
      deductEmployeePension: true,
      includeEmployerPension: true,
      workingDaysPerMonth: 26,
      earnings: [
        {
          componentName: 'Basic Salary',
          componentCode: 'BASIC',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: true,
          isBasic: true,
          isMandatory: true,
          sortOrder: 1,
        },
        {
          componentName: 'Housing Allowance',
          componentCode: 'HOUSE',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 2,
        },
        {
          componentName: 'Transport Allowance',
          componentCode: 'TRANS',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 3,
        },
        {
          componentName: 'Medical Allowance',
          componentCode: 'MED',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 4,
        },
        {
          componentName: 'Management Allowance',
          componentCode: 'MGT',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: true,
          isBasic: false,
          isMandatory: false,
          sortOrder: 5,
        },
        {
          componentName: 'Other Allowances',
          componentCode: 'OTHER',
          calculationType: 'fixed',
          amount: 0,
          isTaxable: false,
          isBasic: false,
          isMandatory: false,
          sortOrder: 6,
        },
      ],
      deductions: [
        {
          componentName: 'Income Tax',
          componentCode: 'ITAX',
          calculationType: 'tax_bracket',
          amount: 0,
          isAutoCalculated: true,
          isIncomeTax: true,
          isMandatory: true,
          sortOrder: 1,
        },
        {
          componentName: 'Employee Pension (7%)',
          componentCode: 'EMP_PEN',
          calculationType: 'percentage_of_basic',
          percentage: 7,
          amount: 0,
          isAutoCalculated: true,
          isEmployeePension: true,
          isMandatory: true,
          sortOrder: 2,
        },
        {
          componentName: 'Employer Pension (11%)',
          componentCode: 'EMPR_PEN',
          calculationType: 'percentage_of_basic',
          percentage: 11,
          amount: 0,
          isAutoCalculated: true,
          isEmployerPension: true,
          isMandatory: true,
          sortOrder: 3,
        },
        {
          componentName: 'Absence Deduction',
          componentCode: 'ABS',
          calculationType: 'formula',
          amount: 0,
          isAutoCalculated: true,
          isMandatory: false,
          sortOrder: 4,
        },
      ],
    },
  ];

  for (const structure of structures) {
    await this.findOneAndUpdate(
      { code: structure.code },
      { $setOnInsert: { ...structure, isActive: true } },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${structures.length} salary structures seeded`);
};

// Find by code
salaryStructureSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active structures
salaryStructureSchema.statics.getAllActive = function () {
  return this.find({ isActive: true })
    .sort({ name: 1 })
    .populate('department', 'name code')
    .populate('designation', 'name code');
};

// Get default structure
salaryStructureSchema.statics.getDefault = function () {
  return this.findOne({
    isDefault: true,
    isActive: true,
  });
};

// Calculate salary for a given basic salary
salaryStructureSchema.statics.calculateSalary = function (
  basicSalary,
  salaryStructure,
  absentDays = 0
) {
  const result = {
    earnings: [],
    deductions: [],
    grossEarnings: 0,
    taxableIncome: 0,
    totalDeductions: 0,
    employeePension: 0,
    employerPension: 0,
    incomeTax: 0,
    netSalary: 0,
  };

  // Calculate earnings
  let grossEarnings = 0;
  let taxableIncome = 0;

  for (const earning of salaryStructure.earnings) {
    let amount = 0;

    if (earning.isBasic) {
      amount = basicSalary;
    } else if (earning.calculationType === 'fixed') {
      amount = earning.amount || 0;
    } else if (earning.calculationType === 'percentage_of_basic') {
      amount = (basicSalary * (earning.percentage || 0)) / 100;
    }

    result.earnings.push({
      name: earning.componentName,
      code: earning.componentCode,
      amount: Math.round(amount),
      isTaxable: earning.isTaxable,
    });

    grossEarnings += amount;
    if (earning.isTaxable) {
      taxableIncome += amount;
    }
  }

  result.grossEarnings = Math.round(grossEarnings);
  result.taxableIncome = Math.round(taxableIncome);

  // Calculate deductions
  let totalDeductions = 0;

  for (const deduction of salaryStructure.deductions) {
    let amount = 0;

    if (deduction.isIncomeTax) {
      // Ethiopian income tax calculation
      amount = calculateEthiopianTax(taxableIncome);
      result.incomeTax = Math.round(amount);
    } else if (deduction.isEmployeePension) {
      // Employee pension 7% of basic
      amount = basicSalary * PENSION_RATES.EMPLOYEE;
      result.employeePension = Math.round(amount);
    } else if (deduction.isEmployerPension) {
      // Employer pension 11% of basic
      amount = basicSalary * PENSION_RATES.EMPLOYER;
      result.employerPension = Math.round(amount);
    } else if (deduction.calculationType === 'fixed') {
      amount = deduction.amount || 0;
    } else if (deduction.calculationType === 'percentage_of_basic') {
      amount = (basicSalary * (deduction.percentage || 0)) / 100;
    } else if (deduction.componentCode === 'ABS' && absentDays > 0) {
      // Absence deduction = daily rate * absent days
      const dailyRate = basicSalary / (salaryStructure.workingDaysPerMonth || 26);
      amount = dailyRate * absentDays;
    }

    // Employer pension is not deducted from employee
    if (!deduction.isEmployerPension) {
      totalDeductions += amount;
    }

    result.deductions.push({
      name: deduction.componentName,
      code: deduction.componentCode,
      amount: Math.round(amount),
      isAutoCalculated: deduction.isAutoCalculated,
    });
  }

  result.totalDeductions = Math.round(totalDeductions);
  result.netSalary = Math.round(grossEarnings - totalDeductions);

  return result;
};

// Get structure for an employee
salaryStructureSchema.statics.getForEmployee = async function (employeeId) {
  const Employee = mongoose.model('Employee');
  const employee = await Employee.findById(employeeId).select(
    'salaryStructure designation department'
  );

  if (employee?.salaryStructure) {
    return this.findById(employee.salaryStructure);
  }

  // Fall back to designation structure
  if (employee?.designation) {
    const Designation = mongoose.model('Designation');
    const designation = await Designation.findById(employee.designation).select('salaryStructure');

    if (designation?.salaryStructure) {
      return this.findById(designation.salaryStructure);
    }
  }

  // Fall back to default structure
  return this.getDefault();
};

// ─── Helper: Calculate Ethiopian Income Tax ───
const calculateEthiopianTax = (taxableIncome) => {
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
      return taxableIncome * bracket.rate - bracket.deduction;
    }
  }
  // Highest bracket
  const highest = INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1];
  return taxableIncome * highest.rate - highest.deduction;
};

// ─── Instance Methods ─────────────────────────

// Calculate for a specific basic salary
salaryStructureSchema.methods.calculateForBasic = function (basicSalary, absentDays = 0) {
  return salaryStructureSchema.statics.calculateSalary(basicSalary, this, absentDays);
};

// Get basic salary component
salaryStructureSchema.methods.getBasicComponent = function () {
  return this.earnings.find((e) => e.isBasic);
};

// Get income tax component
salaryStructureSchema.methods.getTaxComponent = function () {
  return this.deductions.find((d) => d.isIncomeTax);
};

// Get pension components
salaryStructureSchema.methods.getPensionComponents = function () {
  return {
    employee: this.deductions.find((d) => d.isEmployeePension),
    employer: this.deductions.find((d) => d.isEmployerPension),
  };
};

// ─── Create Model ─────────────────────────────
const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

module.exports = SalaryStructure;
