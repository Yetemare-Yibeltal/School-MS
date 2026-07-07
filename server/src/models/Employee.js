// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EMPLOYEE MODEL (Non-Teaching Staff)
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  ETHIOPIAN_REGIONS,
  ETHIOPIAN_RELIGIONS,
  ETHIOPIAN_LANGUAGES,
  BLOOD_GROUPS,
  GENDERS,
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUS,
  DOCUMENT_TYPES,
} = require('../config/constants');

const employeeSchema = new mongoose.Schema(
  {
    // ─── Employee ID ──────────────────────────
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      match: [/^EMP-\d{3,6}$/, 'Employee ID must be in format EMP-XXX'],
    },

    // ─── Personal Information ─────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },

    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
      minlength: [2, "Father's name must be at least 2 characters"],
      maxlength: [50, "Father's name cannot exceed 50 characters"],
    },

    grandFatherName: {
      type: String,
      trim: true,
      maxlength: [50, "Grandfather's name cannot exceed 50 characters"],
    },

    // ─── Personal Details ─────────────────────
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: GENDERS,
        message: '{VALUE} is not a valid gender',
      },
    },

    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: function (dob) {
          const age = (new Date() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365);
          return age >= 18 && age <= 65;
        },
        message: 'Employee age must be between 18 and 65 years',
      },
    },

    nationality: {
      type: String,
      default: 'Ethiopian',
      trim: true,
    },

    religion: {
      type: String,
      enum: {
        values: [...ETHIOPIAN_RELIGIONS, ''],
        message: '{VALUE} is not a valid religion',
      },
      default: '',
    },

    motherTongue: {
      type: String,
      enum: {
        values: [...ETHIOPIAN_LANGUAGES, ''],
        message: '{VALUE} is not a valid language',
      },
      default: '',
    },

    bloodGroup: {
      type: String,
      enum: {
        values: [...BLOOD_GROUPS, ''],
        message: '{VALUE} is not a valid blood group',
      },
      default: '',
    },

    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed', ''],
      default: '',
    },

    numberOfDependents: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Photo ────────────────────────────────
    photo: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    // ─── Contact Information ──────────────────
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(\+251|0)[0-9]{9}$/, 'Please provide a valid Ethiopian phone number'],
    },

    alternatePhone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },

    // ─── Address ──────────────────────────────
    address: {
      region: {
        type: String,
        enum: {
          values: [...ETHIOPIAN_REGIONS, ''],
          message: '{VALUE} is not a valid region',
        },
        default: 'Addis Ababa',
      },
      zone: { type: String, trim: true },
      woreda: { type: String, trim: true },
      kebele: { type: String, trim: true },
      houseNumber: { type: String, trim: true },
      specificLocation: { type: String, trim: true },
    },

    // ─── Department & Designation ─────────────
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },

    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation is required'],
    },

    // Cached department name for quick access
    departmentName: {
      type: String,
      trim: true,
    },

    // Cached designation name for quick access
    designationName: {
      type: String,
      trim: true,
    },

    // Reporting manager
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    // ─── Employment Details ───────────────────
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      enum: {
        values: EMPLOYMENT_TYPES,
        message: '{VALUE} is not a valid employment type',
      },
      default: 'Permanent',
    },

    joinDate: {
      type: Date,
      required: [true, 'Join date is required'],
    },

    // Contract end date for contract employees
    contractEndDate: {
      type: Date,
      default: null,
    },

    // Probation period end date
    probationEndDate: {
      type: Date,
      default: null,
    },

    // Confirmed as permanent after probation
    isConfirmed: {
      type: Boolean,
      default: false,
    },

    confirmationDate: {
      type: Date,
      default: null,
    },

    // TIN number
    tinNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // Pension number
    pensionNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // National ID
    nationalId: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Qualifications ───────────────────────
    qualifications: [
      {
        degree: {
          type: String,
          required: true,
          trim: true,
        },
        field: {
          type: String,
          required: true,
          trim: true,
        },
        institution: {
          type: String,
          required: true,
          trim: true,
        },
        graduationYear: {
          type: Number,
        },
        documentUrl: {
          type: String,
          default: null,
        },
      },
    ],

    highestQualification: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Employment History ───────────────────
    employmentHistory: [
      {
        organizationName: {
          type: String,
          trim: true,
        },
        position: {
          type: String,
          trim: true,
        },
        startDate: { type: Date },
        endDate: { type: Date },
        reasonForLeaving: {
          type: String,
          trim: true,
        },
        location: {
          type: String,
          trim: true,
        },
      },
    ],

    // ─── Salary ───────────────────────────────
    salary: {
      basicSalary: {
        type: Number,
        required: [true, 'Basic salary is required'],
        min: [0, 'Salary cannot be negative'],
      },

      housingAllowance: {
        type: Number,
        default: 0,
      },

      transportAllowance: {
        type: Number,
        default: 0,
      },

      medicalAllowance: {
        type: Number,
        default: 0,
      },

      otherAllowances: {
        type: Number,
        default: 0,
      },

      // Payment method
      paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Cash', 'Telebirr', 'CBE Birr'],
        default: 'Bank Transfer',
      },

      // Bank details
      bankName: {
        type: String,
        trim: true,
        default: null,
      },

      bankAccountNumber: {
        type: String,
        trim: true,
        select: false,
        default: null,
      },

      bankBranch: {
        type: String,
        trim: true,
        default: null,
      },

      salaryGrade: {
        type: String,
        trim: true,
        default: null,
      },

      lastRevisionDate: {
        type: Date,
        default: null,
      },

      lastRevisionAmount: {
        type: Number,
        default: 0,
      },
    },

    // ─── Linked Salary Structure ──────────────
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null,
    },

    // ─── Attendance Summary ───────────────────
    attendanceSummary: {
      totalDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      lateDays: { type: Number, default: 0 },
      leaveDays: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: null },
    },

    // ─── Leave Balance ────────────────────────
    leaveBalance: {
      annual: { type: Number, default: 21 },
      sick: { type: Number, default: 14 },
      maternity: { type: Number, default: 90 },
      paternity: { type: Number, default: 5 },
      compassionate: { type: Number, default: 5 },
      study: { type: Number, default: 10 },
      emergency: { type: Number, default: 3 },
      unpaid: { type: Number, default: 30 },
    },

    // ─── Performance ──────────────────────────
    performanceRating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },

    performanceHistory: [
      {
        year: { type: Number },
        rating: { type: Number, min: 0, max: 5 },
        evaluatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        evaluationDate: { type: Date },
        remarks: { type: String, trim: true },
      },
    ],

    // ─── Documents ────────────────────────────
    documents: [
      {
        type: {
          type: String,
          trim: true,
        },
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        notes: { type: String, trim: true },
      },
    ],

    // ─── Emergency Contact ────────────────────
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Emergency contact name is required'],
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Emergency contact phone is required'],
        trim: true,
        match: [/^(\+251|0)[0-9]{9}$/, 'Please provide a valid Ethiopian phone number'],
      },
      address: {
        type: String,
        trim: true,
      },
    },

    // ─── Health ───────────────────────────────
    health: {
      hasDisability: {
        type: Boolean,
        default: false,
      },
      disabilityDetails: {
        type: String,
        trim: true,
        default: null,
      },
      hasChronicIllness: {
        type: Boolean,
        default: false,
      },
      chronicIllnessDetails: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ─── Status ───────────────────────────────
    status: {
      type: String,
      enum: {
        values: Object.values(EMPLOYEE_STATUS),
        message: '{VALUE} is not a valid status',
      },
      default: EMPLOYEE_STATUS.ACTIVE,
      index: true,
    },

    statusReason: {
      type: String,
      trim: true,
      default: null,
    },

    statusChangedAt: {
      type: Date,
      default: null,
    },

    statusChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Termination details
    terminationDate: {
      type: Date,
      default: null,
    },

    terminationReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── User Account ─────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      sparse: true,
    },

    // ─── Notes ────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      default: null,
    },

    // ─── Audit ────────────────────────────────
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
employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ designation: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ user: 1 }, { sparse: true });
employeeSchema.index({ createdAt: -1 });
employeeSchema.index({
  firstName: 'text',
  fatherName: 'text',
  grandFatherName: 'text',
  employeeId: 'text',
  departmentName: 'text',
  designationName: 'text',
  email: 'text',
  phone: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Full name
employeeSchema.virtual('fullName').get(function () {
  const parts = [this.firstName, this.fatherName];
  if (this.grandFatherName) parts.push(this.grandFatherName);
  return parts.join(' ');
});

// Title prefix
employeeSchema.virtual('titleName').get(function () {
  const prefix = this.gender === 'Male' ? 'Ato' : 'W/ro';
  return `${prefix} ${this.firstName} ${this.fatherName}`;
});

// Age
employeeSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

// Years of service at school
employeeSchema.virtual('yearsOfService').get(function () {
  if (!this.joinDate) return 0;
  const years = (new Date() - new Date(this.joinDate)) / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(years);
});

// Gross salary
employeeSchema.virtual('grossSalary').get(function () {
  if (!this.salary) return 0;
  return (
    (this.salary.basicSalary || 0) +
    (this.salary.housingAllowance || 0) +
    (this.salary.transportAllowance || 0) +
    (this.salary.medicalAllowance || 0) +
    (this.salary.otherAllowances || 0)
  );
});

// Attendance rate
employeeSchema.virtual('attendanceRate').get(function () {
  if (!this.attendanceSummary.totalDays) return 0;
  return Math.round((this.attendanceSummary.presentDays / this.attendanceSummary.totalDays) * 100);
});

// Is contract expired
employeeSchema.virtual('isContractExpired').get(function () {
  if (!this.contractEndDate) return false;
  return new Date(this.contractEndDate) < new Date();
});

// Is on probation
employeeSchema.virtual('isOnProbation').get(function () {
  if (!this.probationEndDate) return false;
  return new Date(this.probationEndDate) > new Date();
});

// ─── Pre-Save Hook ────────────────────────────
// Auto-generate employeeId
employeeSchema.pre('save', async function (next) {
  if (!this.isNew || this.employeeId) return next();

  try {
    const Employee = mongoose.model('Employee');
    const lastEmployee = await Employee.findOne({}, {}, { sort: { createdAt: -1 } }).select(
      'employeeId'
    );

    let nextNumber = 1;

    if (lastEmployee && lastEmployee.employeeId) {
      const lastNumber = parseInt(lastEmployee.employeeId.replace('EMP-', ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    this.employeeId = `EMP-${nextNumber.toString().padStart(3, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Static Methods ───────────────────────────

// Find by employee ID
employeeSchema.statics.findByEmployeeId = function (employeeId) {
  return this.findOne({
    employeeId: employeeId.toUpperCase(),
  })
    .populate('department', 'name code')
    .populate('designation', 'name');
};

// Find active employees
employeeSchema.statics.findActive = function () {
  return this.find({ status: 'active' })
    .populate('department', 'name code')
    .populate('designation', 'name')
    .sort({ firstName: 1, fatherName: 1 });
};

// Find employees by department
employeeSchema.statics.findByDepartment = function (departmentId) {
  return this.find({
    department: departmentId,
    status: 'active',
  })
    .populate('designation', 'name')
    .sort({ firstName: 1 });
};

// Search employees
employeeSchema.statics.search = function (searchTerm, filters = {}) {
  const query = {
    $or: [
      {
        firstName: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        fatherName: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        employeeId: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        departmentName: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        designationName: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        phone: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
    ],
    ...filters,
  };

  return this.find(query)
    .sort({ firstName: 1 })
    .select(
      'employeeId firstName fatherName phone email departmentName designationName status photo salary.basicSalary joinDate employmentType'
    );
};

// Get dashboard stats
employeeSchema.statics.getDashboardStats = async function () {
  const [total, active, onLeave, byDepartment, byGender, byEmploymentType, monthlyPayroll] =
    await Promise.all([
      this.countDocuments(),
      this.countDocuments({ status: 'active' }),
      this.countDocuments({ status: 'on_leave' }),
      this.aggregate([
        {
          $group: {
            _id: '$departmentName',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      this.aggregate([
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 },
          },
        },
      ]),
      this.aggregate([
        {
          $group: {
            _id: '$employmentType',
            count: { $sum: 1 },
          },
        },
      ]),
      this.aggregate([
        {
          $match: { status: 'active' },
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

  return {
    total,
    active,
    onLeave,
    inactive: total - active - onLeave,
    byDepartment,
    byGender,
    byEmploymentType,
    monthlyPayrollTotal: monthlyPayroll[0]?.total || 0,
  };
};

// Get employees with expiring contracts
employeeSchema.statics.getExpiringContracts = function (daysAhead = 30) {
  const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return this.find({
    employmentType: 'Contract',
    status: 'active',
    contractEndDate: {
      $lte: futureDate,
      $gte: new Date(),
    },
  })
    .populate('department', 'name')
    .populate('designation', 'name')
    .sort({ contractEndDate: 1 });
};

// Update attendance summary
employeeSchema.statics.updateAttendanceSummary = async function (employeeId) {
  const Attendance = mongoose.model('Attendance');
  const stats = await Attendance.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
          },
        },
        late: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
          },
        },
        leave: {
          $sum: {
            $cond: [{ $eq: ['$status', 'leave'] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (stats.length === 0) return;

  const { total, present, absent, late, leave } = stats[0];
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  await this.findByIdAndUpdate(employeeId, {
    attendanceSummary: {
      totalDays: total,
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      leaveDays: leave,
      attendancePercentage: percentage,
      lastUpdated: new Date(),
    },
  });
};

// ─── Instance Methods ─────────────────────────

// Get initials
employeeSchema.methods.getInitials = function () {
  return `${this.firstName.charAt(0)}${this.fatherName.charAt(0)}`.toUpperCase();
};

// Get remaining leave balance
employeeSchema.methods.getLeaveBalance = function (leaveType) {
  const typeMap = {
    'Annual Leave': 'annual',
    'Sick Leave': 'sick',
    'Maternity Leave': 'maternity',
    'Paternity Leave': 'paternity',
    'Compassionate Leave': 'compassionate',
    'Study Leave': 'study',
    'Emergency Leave': 'emergency',
    'Unpaid Leave': 'unpaid',
  };
  const key = typeMap[leaveType] || leaveType;
  return this.leaveBalance[key] || 0;
};

// Check if employee is eligible for leave
employeeSchema.methods.isEligibleForLeave = function (leaveType, days) {
  const balance = this.getLeaveBalance(leaveType);
  return balance >= days;
};

// Deduct leave balance
employeeSchema.methods.deductLeave = async function (leaveType, days) {
  const typeMap = {
    'Annual Leave': 'annual',
    'Sick Leave': 'sick',
    'Maternity Leave': 'maternity',
    'Paternity Leave': 'paternity',
    'Compassionate Leave': 'compassionate',
    'Study Leave': 'study',
    'Emergency Leave': 'emergency',
    'Unpaid Leave': 'unpaid',
  };

  const key = typeMap[leaveType] || leaveType;

  if (this.leaveBalance[key] !== undefined && this.leaveBalance[key] >= days) {
    this.leaveBalance[key] -= days;
    await this.save({ validateBeforeSave: false });
    return true;
  }
  return false;
};

// Restore leave balance (when leave is rejected/cancelled)
employeeSchema.methods.restoreLeave = async function (leaveType, days) {
  const typeMap = {
    'Annual Leave': 'annual',
    'Sick Leave': 'sick',
    'Maternity Leave': 'maternity',
    'Paternity Leave': 'paternity',
    'Compassionate Leave': 'compassionate',
    'Study Leave': 'study',
    'Emergency Leave': 'emergency',
    'Unpaid Leave': 'unpaid',
  };

  const key = typeMap[leaveType] || leaveType;

  if (this.leaveBalance[key] !== undefined) {
    this.leaveBalance[key] += days;
    await this.save({ validateBeforeSave: false });
    return true;
  }
  return false;
};

// ─── Create Model ─────────────────────────────
const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
