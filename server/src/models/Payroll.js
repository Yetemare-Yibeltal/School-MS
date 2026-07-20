// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// PAYROLL MODEL
// kat-school/server/src/models/Payroll.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    // ─── Payroll Identity ─────────────────────
    payrollNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ─── Period ───────────────────────────────
    // Month (1-12)
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
      index: true,
    },

    // Year (Gregorian)
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2020,
      max: 2100,
      index: true,
    },

    // Ethiopian month name
    ethiopianMonth: {
      type: String,
      trim: true,
      default: null,
    },

    // Display label e.g. "January 2024"
    periodLabel: {
      type: String,
      trim: true,
    },

    // ─── Academic Year ────────────────────────
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

    // ─── Department Filter ────────────────────
    // null = all departments
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

    // ─── Staff Type ───────────────────────────
    staffType: {
      type: String,
      enum: ['all', 'teaching', 'non_teaching'],
      default: 'all',
    },

    // ─── Employee Payroll Details ─────────────
    // One entry per employee
    employees: [
      {
        // Employee reference
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'employees.staffType',
        },

        staffType: {
          type: String,
          enum: ['Teacher', 'Employee'],
          default: 'Employee',
        },

        // Cached employee info
        employeeId: { type: String, trim: true },
        employeeName: { type: String, trim: true },
        designation: { type: String, trim: true },
        department: { type: String, trim: true },
        bankName: { type: String, trim: true },
        bankAccount: {
          type: String,
          trim: true,
          select: false,
        },
        paymentMethod: {
          type: String,
          trim: true,
          default: 'Bank Transfer',
        },

        // ── Salary Components ─────────────────
        basicSalary: {
          type: Number,
          default: 0,
          min: 0,
        },

        // Earnings breakdown
        earnings: [
          {
            componentName: { type: String, trim: true },
            componentCode: { type: String, trim: true },
            amount: { type: Number, default: 0 },
            isTaxable: { type: Boolean, default: true },
          },
        ],

        grossEarnings: {
          type: Number,
          default: 0,
          min: 0,
        },

        taxableIncome: {
          type: Number,
          default: 0,
          min: 0,
        },

        // Deductions breakdown
        deductions: [
          {
            componentName: { type: String, trim: true },
            componentCode: { type: String, trim: true },
            amount: { type: Number, default: 0 },
            isAutoCalculated: {
              type: Boolean,
              default: false,
            },
          },
        ],

        incomeTax: {
          type: Number,
          default: 0,
          min: 0,
        },

        employeePension: {
          type: Number,
          default: 0,
          min: 0,
        },

        employerPension: {
          type: Number,
          default: 0,
          min: 0,
        },

        totalDeductions: {
          type: Number,
          default: 0,
          min: 0,
        },

        netSalary: {
          type: Number,
          default: 0,
          min: 0,
        },

        // Total employer cost
        totalEmployerCost: {
          type: Number,
          default: 0,
          min: 0,
        },

        // ── Attendance Impact ─────────────────
        workingDays: {
          type: Number,
          default: 26,
        },

        presentDays: {
          type: Number,
          default: 26,
        },

        absentDays: {
          type: Number,
          default: 0,
        },

        leaveDays: {
          type: Number,
          default: 0,
        },

        overtimeHours: {
          type: Number,
          default: 0,
        },

        absenceDeduction: {
          type: Number,
          default: 0,
        },

        // ── Status Per Employee ────────────────
        status: {
          type: String,
          enum: ['calculated', 'verified', 'paid', 'held', 'cancelled'],
          default: 'calculated',
        },

        paidAt: { type: Date, default: null },

        // ── Remarks ────────────────────────────
        remarks: {
          type: String,
          trim: true,
          default: null,
        },
      },
    ],

    // ─── Payroll Totals ───────────────────────
    summary: {
      totalEmployees: {
        type: Number,
        default: 0,
      },
      totalGrossEarnings: {
        type: Number,
        default: 0,
      },
      totalTaxableIncome: {
        type: Number,
        default: 0,
      },
      totalIncomeTax: {
        type: Number,
        default: 0,
      },
      totalEmployeePension: {
        type: Number,
        default: 0,
      },
      totalEmployerPension: {
        type: Number,
        default: 0,
      },
      totalDeductions: {
        type: Number,
        default: 0,
      },
      totalNetSalary: {
        type: Number,
        default: 0,
      },
      totalEmployerCost: {
        type: Number,
        default: 0,
      },
    },

    // ─── Status ──────────────────────────────
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['draft', 'pending_approval', 'approved', 'processing', 'paid', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },

    // ─── Approval ────────────────────────────
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    preparedByName: {
      type: String,
      trim: true,
      default: null,
    },

    preparedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    approvedByName: {
      type: String,
      trim: true,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Payment ─────────────────────────────
    paymentDate: {
      type: Date,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Cash', 'Telebirr', 'CBE Birr', 'Mixed', ''],
      default: '',
    },

    // Bank reference for bulk transfer
    bankReferenceNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Salary Slip Generation ───────────────
    salarySlipsGenerated: {
      type: Boolean,
      default: false,
    },

    salarySlipsGeneratedAt: {
      type: Date,
      default: null,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

// ─── Compound Indexes ─────────────────────────
payrollSchema.index({ month: 1, year: 1, department: 1 }, { unique: true });
payrollSchema.index({ academicYear: 1, month: 1 });
payrollSchema.index({ status: 1 });
payrollSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Period display
payrollSchema.virtual('periodDisplay').get(function () {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${months[this.month - 1]} ${this.year}`;
});

// Is paid
payrollSchema.virtual('isPaid').get(function () {
  return this.status === 'paid';
});

// Is approved
payrollSchema.virtual('isApproved').get(function () {
  return this.status === 'approved' || this.status === 'paid';
});

// ─── Pre-Save Hook ────────────────────────────
payrollSchema.pre('save', async function (next) {
  // Auto-generate payroll number
  if (this.isNew && !this.payrollNumber) {
    try {
      const year = this.year;
      const month = String(this.month).padStart(2, '0');

      const count = await mongoose.model('Payroll').countDocuments({ year: this.year });

      const sequence = String(count + 1).padStart(3, '0');
      this.payrollNumber = `PAY-${year}${month}-${sequence}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Auto-set period label
  if (this.isModified('month') || this.isModified('year')) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.periodLabel = `${months[this.month - 1]} ${this.year}`;
  }

  // Auto-calculate summary from employees
  if (this.isModified('employees')) {
    const summary = {
      totalEmployees: this.employees.length,
      totalGrossEarnings: 0,
      totalTaxableIncome: 0,
      totalIncomeTax: 0,
      totalEmployeePension: 0,
      totalEmployerPension: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
      totalEmployerCost: 0,
    };

    this.employees.forEach((emp) => {
      summary.totalGrossEarnings += emp.grossEarnings || 0;
      summary.totalTaxableIncome += emp.taxableIncome || 0;
      summary.totalIncomeTax += emp.incomeTax || 0;
      summary.totalEmployeePension += emp.employeePension || 0;
      summary.totalEmployerPension += emp.employerPension || 0;
      summary.totalDeductions += emp.totalDeductions || 0;
      summary.totalNetSalary += emp.netSalary || 0;
      summary.totalEmployerCost += emp.totalEmployerCost || 0;
    });

    this.summary = summary;
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Find payroll by month and year
payrollSchema.statics.findByPeriod = function (month, year, departmentId = null) {
  const query = {
    month: parseInt(month),
    year: parseInt(year),
  };
  if (departmentId) query.department = departmentId;
  return this.findOne(query)
    .populate('department', 'name code')
    .populate('academicYear', 'name ethiopianYear');
};

// Get all payrolls for a year
payrollSchema.statics.getForYear = function (year, academicYearId = null) {
  const query = { year: parseInt(year) };
  if (academicYearId) {
    query.academicYear = academicYearId;
  }
  return this.find(query)
    .sort({ month: -1 })
    .populate('department', 'name')
    .populate('approvedBy', 'firstName fatherName');
};

// Generate payroll for a month
payrollSchema.statics.generate = async function ({
  month,
  year,
  academicYearId,
  academicYearName,
  departmentId,
  departmentName,
  staffType,
  preparedBy,
  preparedByName,
}) {
  const Teacher = mongoose.model('Teacher');
  const Employee = mongoose.model('Employee');
  const TeacherAttendance = mongoose.model('TeacherAttendance');
  const SalaryStructure = mongoose.model('SalaryStructure');

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const workingDaysPerMonth = 26;

  const employeeList = [];

  // Get teachers if needed
  if (staffType === 'all' || staffType === 'teaching') {
    const teacherQuery = { status: 'active' };
    if (departmentId)
      teacherQuery['assignedClasses.0'] = {
        $exists: true,
      };

    const teachers = await Teacher.find(teacherQuery).select(
      'firstName fatherName teacherId primarySubject salary salaryStructure'
    );

    for (const teacher of teachers) {
      // Get attendance for the month
      const attendance = await TeacherAttendance.getForPayroll(teacher._id, 'teacher', year, month);

      // Get salary structure
      const structure = await SalaryStructure.getForEmployee(teacher._id);

      // Calculate salary
      const calculation = structure
        ? SalaryStructure.calculateSalary(
            teacher.salary?.basicSalary || 0,
            structure,
            attendance.unauthorizedAbsences
          )
        : {
            earnings: [],
            deductions: [],
            grossEarnings: teacher.salary?.basicSalary || 0,
            taxableIncome: teacher.salary?.basicSalary || 0,
            totalDeductions: 0,
            employeePension: 0,
            employerPension: 0,
            incomeTax: 0,
            netSalary: teacher.salary?.basicSalary || 0,
          };

      employeeList.push({
        employee: teacher._id,
        staffType: 'Teacher',
        employeeId: teacher.teacherId,
        employeeName: `${teacher.firstName} ${teacher.fatherName}`,
        designation: 'Teacher',
        department: 'Academic',
        bankName: teacher.salary?.bankName || null,
        paymentMethod: teacher.salary?.paymentMethod || 'Bank Transfer',
        basicSalary: teacher.salary?.basicSalary || 0,
        earnings: calculation.earnings,
        grossEarnings: calculation.grossEarnings,
        taxableIncome: calculation.taxableIncome,
        deductions: calculation.deductions,
        incomeTax: calculation.incomeTax,
        employeePension: calculation.employeePension,
        employerPension: calculation.employerPension,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,
        totalEmployerCost: calculation.grossEarnings + calculation.employerPension,
        workingDays: workingDaysPerMonth,
        presentDays: attendance.presentDays,
        absentDays: attendance.absentDays,
        leaveDays: attendance.leaveDays,
        absenceDeduction:
          calculation.deductions.find((d) => d.componentCode === 'ABS')?.amount || 0,
        status: 'calculated',
      });
    }
  }

  // Get non-teaching employees if needed
  if (staffType === 'all' || staffType === 'non_teaching') {
    const empQuery = { status: 'active' };
    if (departmentId) empQuery.department = departmentId;

    const employees = await Employee.find(empQuery).select(
      'firstName fatherName employeeId designationName departmentName salary salaryStructure'
    );

    for (const employee of employees) {
      const attendance = await TeacherAttendance.getForPayroll(
        employee._id,
        'employee',
        year,
        month
      );

      const structure = await SalaryStructure.getForEmployee(employee._id);

      const calculation = structure
        ? SalaryStructure.calculateSalary(
            employee.salary?.basicSalary || 0,
            structure,
            attendance.unauthorizedAbsences
          )
        : {
            earnings: [],
            deductions: [],
            grossEarnings: employee.salary?.basicSalary || 0,
            taxableIncome: employee.salary?.basicSalary || 0,
            totalDeductions: 0,
            employeePension: 0,
            employerPension: 0,
            incomeTax: 0,
            netSalary: employee.salary?.basicSalary || 0,
          };

      employeeList.push({
        employee: employee._id,
        staffType: 'Employee',
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.fatherName}`,
        designation: employee.designationName,
        department: employee.departmentName,
        bankName: employee.salary?.bankName || null,
        paymentMethod: employee.salary?.paymentMethod || 'Bank Transfer',
        basicSalary: employee.salary?.basicSalary || 0,
        earnings: calculation.earnings,
        grossEarnings: calculation.grossEarnings,
        taxableIncome: calculation.taxableIncome,
        deductions: calculation.deductions,
        incomeTax: calculation.incomeTax,
        employeePension: calculation.employeePension,
        employerPension: calculation.employerPension,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,
        totalEmployerCost: calculation.grossEarnings + calculation.employerPension,
        workingDays: workingDaysPerMonth,
        presentDays: attendance.presentDays,
        absentDays: attendance.absentDays,
        leaveDays: attendance.leaveDays,
        absenceDeduction:
          calculation.deductions.find((d) => d.componentCode === 'ABS')?.amount || 0,
        status: 'calculated',
      });
    }
  }

  // Create or update payroll document
  return this.findOneAndUpdate(
    {
      month,
      year,
      department: departmentId || null,
    },
    {
      month,
      year,
      academicYear: academicYearId,
      academicYearName,
      department: departmentId || null,
      departmentName: departmentName || null,
      staffType,
      employees: employeeList,
      status: 'draft',
      preparedBy,
      preparedByName,
      preparedAt: new Date(),
      createdBy: preparedBy,
    },
    { upsert: true, new: true }
  );
};

// Submit for approval
payrollSchema.statics.submitForApproval = async function (payrollId) {
  return this.findByIdAndUpdate(payrollId, { status: 'pending_approval' }, { new: true });
};

// Approve payroll
payrollSchema.statics.approve = async function (payrollId, approvedBy, approvedByName) {
  return this.findByIdAndUpdate(
    payrollId,
    {
      status: 'approved',
      approvedBy,
      approvedByName,
      approvedAt: new Date(),
    },
    { new: true }
  );
};

// Reject payroll
payrollSchema.statics.reject = async function (payrollId, rejectedBy, reason) {
  return this.findByIdAndUpdate(
    payrollId,
    {
      status: 'draft',
      rejectedBy,
      rejectionReason: reason,
    },
    { new: true }
  );
};

// Mark as paid
payrollSchema.statics.markPaid = async function (
  payrollId,
  paymentDate,
  paymentMethod,
  bankReference
) {
  const payroll = await this.findById(payrollId);
  if (!payroll) throw new Error('Payroll not found');

  // Mark all employees as paid
  payroll.employees.forEach((emp) => {
    emp.status = 'paid';
    emp.paidAt = new Date(paymentDate);
  });

  payroll.status = 'paid';
  payroll.paymentDate = new Date(paymentDate);
  payroll.paymentMethod = paymentMethod;
  payroll.bankReferenceNumber = bankReference || null;

  await payroll.save();
  return payroll;
};

// Get monthly payroll summary for reports
payrollSchema.statics.getMonthlySummary = async function (academicYearId) {
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
          month: '$month',
          year: '$year',
        },
        totalNet: {
          $sum: '$summary.totalNetSalary',
        },
        totalGross: {
          $sum: '$summary.totalGrossEarnings',
        },
        totalTax: {
          $sum: '$summary.totalIncomeTax',
        },
        totalPension: {
          $sum: '$summary.totalEmployeePension',
        },
        totalEmployees: {
          $sum: '$summary.totalEmployees',
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

// Get employee salary history
payrollSchema.statics.getEmployeeSalaryHistory = async function (employeeId, limit = 12) {
  const payrolls = await this.find({
    'employees.employee': employeeId,
    status: 'paid',
  })
    .sort({ year: -1, month: -1 })
    .limit(limit)
    .select('month year periodLabel employees.$');

  return payrolls.map((p) => ({
    month: p.month,
    year: p.year,
    period: p.periodLabel,
    salary: p.employees[0],
  }));
};

// Get dashboard stats
payrollSchema.statics.getDashboardStats = async function (academicYearId) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [currentMonthPayroll, pendingApproval, yearlyTotal] = await Promise.all([
    this.findOne({
      month: currentMonth,
      year: currentYear,
      academicYear: academicYearId,
      department: null,
    }).select('summary status'),
    this.countDocuments({
      status: 'pending_approval',
      academicYear: academicYearId,
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$summary.totalNetSalary',
          },
          months: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    currentMonth: currentMonthPayroll
      ? {
          netSalary: currentMonthPayroll.summary.totalNetSalary,
          employees: currentMonthPayroll.summary.totalEmployees,
          status: currentMonthPayroll.status,
        }
      : null,
    pendingApproval,
    yearlyTotal: yearlyTotal[0]?.total || 0,
    monthsPaid: yearlyTotal[0]?.months || 0,
  };
};

// ─── Instance Methods ─────────────────────────

// Get employee payroll entry
payrollSchema.methods.getEmployeeEntry = function (employeeId) {
  return this.employees.find((e) => e.employee.toString() === employeeId.toString());
};

// Submit for approval
payrollSchema.methods.submitForApproval = async function () {
  this.status = 'pending_approval';
  await this.save();
  return this;
};

// Add remarks to employee entry
payrollSchema.methods.addEmployeeRemark = async function (employeeId, remark) {
  const entry = this.getEmployeeEntry(employeeId);
  if (entry) {
    entry.remarks = remark;
    await this.save();
  }
  return this;
};

// Hold an employee's salary
payrollSchema.methods.holdEmployeeSalary = async function (employeeId, reason) {
  const entry = this.getEmployeeEntry(employeeId);
  if (entry) {
    entry.status = 'held';
    entry.remarks = `Held: ${reason}`;
    await this.save();
  }
  return this;
};

// Get summary display
payrollSchema.methods.getSummaryDisplay = function () {
  return {
    period: this.periodDisplay,
    employees: this.summary.totalEmployees,
    grossEarnings: this.summary.totalGrossEarnings,
    netSalary: this.summary.totalNetSalary,
    incomeTax: this.summary.totalIncomeTax,
    pension: this.summary.totalEmployeePension,
    employerCost: this.summary.totalEmployerCost,
    status: this.status,
  };
};

// ─── Create Model ─────────────────────────────
const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;
