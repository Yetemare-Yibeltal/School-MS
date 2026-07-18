// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// DESIGNATION MODEL
// kat-school/server/src/models/Designation.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema(
  {
    // ─── Designation Identity ─────────────────
    name: {
      type: String,
      required: [true, 'Designation name is required'],
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

    // ─── Department ───────────────────────────
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },

    departmentName: {
      type: String,
      trim: true,
    },

    // ─── Hierarchy ────────────────────────────
    // Level in organization hierarchy
    // 1 = entry level, 10 = top management
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    // Reports to designation
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null,
    },

    reportsToName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Salary ──────────────────────────────
    // Salary grade (e.g. "Grade 1", "Grade 2")
    salaryGrade: {
      type: String,
      trim: true,
      default: null,
    },

    // Minimum salary for this designation
    minSalary: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maximum salary for this designation
    maxSalary: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Default basic salary
    defaultBasicSalary: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Requirements ─────────────────────────
    // Minimum qualification required
    minimumQualification: {
      type: String,
      enum: {
        values: [
          'No formal education',
          'Primary (Grade 1-8)',
          'Secondary (Grade 9-12)',
          'Certificate',
          'Diploma',
          'Degree',
          'Masters',
          'PhD',
          '',
        ],
        message: '{VALUE} is not a valid qualification',
      },
      default: 'Degree',
    },

    // Minimum years of experience required
    minimumExperience: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Required skills or certifications
    requiredSkills: {
      type: [String],
      default: [],
    },

    // ─── Responsibilities ─────────────────────
    responsibilities: {
      type: [String],
      default: [],
    },

    // ─── Benefits ────────────────────────────
    // Default allowances for this designation
    defaultAllowances: {
      housing: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      teaching: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // ─── Stats (cached) ───────────────────────
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

    // ─── Linked Salary Structure ──────────────
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
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
      default: 'user',
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

    isTeachingPosition: {
      type: Boolean,
      default: false,
    },

    isManagement: {
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
designationSchema.index({ name: 1 }, { unique: true });
designationSchema.index({ code: 1 }, { unique: true });
designationSchema.index({
  department: 1,
  isActive: 1,
});
designationSchema.index({ level: -1 });
designationSchema.index({ sortOrder: 1 });

// ─── Virtuals ─────────────────────────────────
// Salary range display
designationSchema.virtual('salaryRange').get(function () {
  if (!this.minSalary && !this.maxSalary) return 'Not set';
  return `ETB ${this.minSalary.toLocaleString()} – ETB ${this.maxSalary.toLocaleString()}`;
});

// Total default monthly compensation
designationSchema.virtual('totalDefaultCompensation').get(function () {
  const allowances = this.defaultAllowances;
  return (
    (this.defaultBasicSalary || 0) +
    (allowances?.housing || 0) +
    (allowances?.transport || 0) +
    (allowances?.medical || 0) +
    (allowances?.teaching || 0) +
    (allowances?.other || 0)
  );
});

// ─── Static Methods ───────────────────────────

// Seed default designations
designationSchema.statics.seedDefaultDesignations = async function () {
  const Department = mongoose.model('Department');

  // Get department references
  const departments = await Department.find({ isActive: true }, { name: 1, code: 1, _id: 1 });

  const getDept = (code) => departments.find((d) => d.code === code);

  const acd = getDept('ACD');
  const adm = getDept('ADM');
  const fin = getDept('FIN');
  const lib = getDept('LIB');
  const sec = getDept('SEC');
  const cln = getDept('CLN');
  const ict = getDept('ICT');
  const spt = getDept('SPT');
  const cns = getDept('CNS');

  const designations = [
    // ── Administration ─────────────────────
    {
      name: 'Principal',
      code: 'PRIN',
      description: 'Head of the school',
      department: adm?._id,
      departmentName: 'Administration',
      level: 10,
      salaryGrade: 'Grade 10',
      minSalary: 20000,
      maxSalary: 35000,
      defaultBasicSalary: 25000,
      minimumQualification: 'Masters',
      minimumExperience: 10,
      isManagement: true,
      color: '#4f46e5',
      icon: 'crown',
      sortOrder: 1,
      isSystem: true,
      defaultAllowances: {
        housing: 3000,
        transport: 1500,
        medical: 1000,
        teaching: 0,
        other: 500,
      },
      responsibilities: [
        'Overall school management and administration',
        'Academic oversight and quality assurance',
        'Staff management and development',
        'Community and stakeholder relations',
        'Financial oversight and reporting',
      ],
    },
    {
      name: 'Vice Principal',
      code: 'VPRIN',
      description: 'Deputy head of school',
      department: adm?._id,
      departmentName: 'Administration',
      level: 9,
      salaryGrade: 'Grade 9',
      minSalary: 16000,
      maxSalary: 25000,
      defaultBasicSalary: 18000,
      minimumQualification: 'Masters',
      minimumExperience: 7,
      isManagement: true,
      color: '#6366f1',
      icon: 'user-tie',
      sortOrder: 2,
      isSystem: true,
      defaultAllowances: {
        housing: 2500,
        transport: 1200,
        medical: 800,
        teaching: 0,
        other: 300,
      },
      responsibilities: [
        'Assist principal in school management',
        'Academic coordination',
        'Student discipline management',
        'Staff supervision',
      ],
    },
    {
      name: 'Department Head',
      code: 'DHEAD',
      description: 'Head of an academic department',
      department: adm?._id,
      departmentName: 'Administration',
      level: 7,
      salaryGrade: 'Grade 7',
      minSalary: 12000,
      maxSalary: 18000,
      defaultBasicSalary: 14000,
      minimumQualification: 'Degree',
      minimumExperience: 5,
      isManagement: true,
      isTeachingPosition: true,
      color: '#7c3aed',
      icon: 'users',
      sortOrder: 3,
      isSystem: true,
      defaultAllowances: {
        housing: 2000,
        transport: 1000,
        medical: 600,
        teaching: 1000,
        other: 200,
      },
    },
    // ── Teaching Staff ─────────────────────
    {
      name: 'Senior Teacher',
      code: 'SR_TCH',
      description: 'Experienced senior teaching staff',
      department: acd?._id,
      departmentName: 'Academic',
      level: 6,
      salaryGrade: 'Grade 6',
      minSalary: 9000,
      maxSalary: 15000,
      defaultBasicSalary: 11000,
      minimumQualification: 'Degree',
      minimumExperience: 5,
      isTeachingPosition: true,
      color: '#22c55e',
      icon: 'chalkboard-teacher',
      sortOrder: 4,
      isSystem: true,
      defaultAllowances: {
        housing: 1500,
        transport: 800,
        medical: 500,
        teaching: 800,
        other: 0,
      },
      responsibilities: [
        'Teach assigned subjects',
        'Mentor junior teachers',
        'Develop teaching materials',
        'Conduct assessments',
        'Maintain student records',
      ],
    },
    {
      name: 'Teacher',
      code: 'TCH',
      description: 'Regular teaching staff',
      department: acd?._id,
      departmentName: 'Academic',
      level: 5,
      salaryGrade: 'Grade 5',
      minSalary: 7000,
      maxSalary: 12000,
      defaultBasicSalary: 8500,
      minimumQualification: 'Degree',
      minimumExperience: 0,
      isTeachingPosition: true,
      color: '#3b82f6',
      icon: 'chalkboard-teacher',
      sortOrder: 5,
      isSystem: true,
      defaultAllowances: {
        housing: 1200,
        transport: 700,
        medical: 400,
        teaching: 600,
        other: 0,
      },
      responsibilities: [
        'Teach assigned subjects',
        'Prepare lesson plans',
        'Conduct and grade assessments',
        'Maintain class attendance',
        'Parent-teacher communication',
      ],
    },
    {
      name: 'Junior Teacher',
      code: 'JR_TCH',
      description: 'Entry-level teaching position',
      department: acd?._id,
      departmentName: 'Academic',
      level: 4,
      salaryGrade: 'Grade 4',
      minSalary: 5500,
      maxSalary: 8000,
      defaultBasicSalary: 6500,
      minimumQualification: 'Degree',
      minimumExperience: 0,
      isTeachingPosition: true,
      color: '#60a5fa',
      icon: 'chalkboard',
      sortOrder: 6,
      isSystem: true,
      defaultAllowances: {
        housing: 1000,
        transport: 600,
        medical: 300,
        teaching: 400,
        other: 0,
      },
    },
    // ── Finance ────────────────────────────
    {
      name: 'Accountant',
      code: 'ACCT',
      description: 'Finance and accounting staff',
      department: fin?._id,
      departmentName: 'Finance',
      level: 5,
      salaryGrade: 'Grade 5',
      minSalary: 7000,
      maxSalary: 12000,
      defaultBasicSalary: 8500,
      minimumQualification: 'Degree',
      minimumExperience: 2,
      color: '#f59e0b',
      icon: 'calculator',
      sortOrder: 7,
      isSystem: true,
      defaultAllowances: {
        housing: 1200,
        transport: 700,
        medical: 400,
        teaching: 0,
        other: 0,
      },
      responsibilities: [
        'Manage school financial records',
        'Process fee collections',
        'Prepare financial reports',
        'Handle payroll processing',
        'Budget monitoring',
      ],
    },
    // ── Library ────────────────────────────
    {
      name: 'Librarian',
      code: 'LIB',
      description: 'Library management staff',
      department: lib?._id,
      departmentName: 'Library',
      level: 4,
      salaryGrade: 'Grade 4',
      minSalary: 5000,
      maxSalary: 8000,
      defaultBasicSalary: 6000,
      minimumQualification: 'Diploma',
      minimumExperience: 1,
      color: '#8b5cf6',
      icon: 'book-open',
      sortOrder: 8,
      isSystem: true,
      defaultAllowances: {
        housing: 1000,
        transport: 600,
        medical: 300,
        teaching: 0,
        other: 0,
      },
      responsibilities: [
        'Manage library catalog',
        'Issue and return books',
        'Maintain library order',
        'Assist students with research',
        'Track overdue books',
      ],
    },
    // ── ICT ────────────────────────────────
    {
      name: 'ICT Technician',
      code: 'ICT_TECH',
      description: 'Computer lab and IT support',
      department: ict?._id,
      departmentName: 'ICT',
      level: 4,
      salaryGrade: 'Grade 4',
      minSalary: 5500,
      maxSalary: 9000,
      defaultBasicSalary: 7000,
      minimumQualification: 'Diploma',
      minimumExperience: 1,
      color: '#0ea5e9',
      icon: 'monitor',
      sortOrder: 9,
      isSystem: true,
      defaultAllowances: {
        housing: 1000,
        transport: 600,
        medical: 300,
        teaching: 0,
        other: 0,
      },
      responsibilities: [
        'Maintain computer lab',
        'Provide technical support',
        'Manage network and internet',
        'Install and update software',
        'Train staff on ICT tools',
      ],
    },
    // ── Admin/Support ──────────────────────
    {
      name: 'Receptionist',
      code: 'RECEP',
      description: 'Front desk and reception staff',
      department: adm?._id,
      departmentName: 'Administration',
      level: 3,
      salaryGrade: 'Grade 3',
      minSalary: 4000,
      maxSalary: 6500,
      defaultBasicSalary: 5000,
      minimumQualification: 'Certificate',
      minimumExperience: 1,
      color: '#ec4899',
      icon: 'phone',
      sortOrder: 10,
      isSystem: true,
      defaultAllowances: {
        housing: 800,
        transport: 500,
        medical: 200,
        teaching: 0,
        other: 0,
      },
      responsibilities: [
        'Manage front desk operations',
        'Receive visitors and calls',
        'Student registration support',
        'File management',
      ],
    },
    // ── Security ───────────────────────────
    {
      name: 'Security Guard',
      code: 'GUARD',
      description: 'Campus security personnel',
      department: sec?._id,
      departmentName: 'Security',
      level: 2,
      salaryGrade: 'Grade 2',
      minSalary: 3000,
      maxSalary: 5000,
      defaultBasicSalary: 3800,
      minimumQualification: 'Secondary (Grade 9-12)',
      minimumExperience: 0,
      color: '#ef4444',
      icon: 'shield',
      sortOrder: 11,
      isSystem: true,
      defaultAllowances: {
        housing: 600,
        transport: 400,
        medical: 200,
        teaching: 0,
        other: 0,
      },
      responsibilities: [
        'Guard school premises',
        'Control entry and exit',
        'Maintain security records',
        'Report security incidents',
      ],
    },
    // ── Cleaning ───────────────────────────
    {
      name: 'Cleaner',
      code: 'CLN',
      description: 'Cleaning and sanitation staff',
      department: cln?._id,
      departmentName: 'Cleaning',
      level: 1,
      salaryGrade: 'Grade 1',
      minSalary: 2500,
      maxSalary: 4000,
      defaultBasicSalary: 3000,
      minimumQualification: 'No formal education',
      minimumExperience: 0,
      color: '#14b8a6',
      icon: 'wind',
      sortOrder: 12,
      isSystem: true,
      defaultAllowances: {
        housing: 500,
        transport: 300,
        medical: 150,
        teaching: 0,
        other: 0,
      },
      responsibilities: [
        'Clean classrooms and offices',
        'Maintain sanitation facilities',
        'Dispose of waste properly',
        'Report maintenance issues',
      ],
    },
    // ── Counseling ─────────────────────────
    {
      name: 'Counselor',
      code: 'CNSLR',
      description: 'Student guidance and counseling',
      department: cns?._id,
      departmentName: 'Counseling',
      level: 5,
      salaryGrade: 'Grade 5',
      minSalary: 7000,
      maxSalary: 11000,
      defaultBasicSalary: 8500,
      minimumQualification: 'Degree',
      minimumExperience: 2,
      color: '#ec4899',
      icon: 'heart',
      sortOrder: 13,
      isSystem: true,
      defaultAllowances: {
        housing: 1200,
        transport: 700,
        medical: 400,
        teaching: 0,
        other: 0,
      },
      responsibilities: [
        'Provide student counseling',
        'Career guidance sessions',
        'Handle behavioral issues',
        'Parent consultation',
        'Mental health support',
      ],
    },
    // ── Sports ─────────────────────────────
    {
      name: 'PE Teacher / Coach',
      code: 'PE_COACH',
      description: 'Physical education and sports coaching',
      department: spt?._id,
      departmentName: 'Sports',
      level: 4,
      salaryGrade: 'Grade 4',
      minSalary: 6000,
      maxSalary: 10000,
      defaultBasicSalary: 7500,
      minimumQualification: 'Degree',
      minimumExperience: 1,
      isTeachingPosition: true,
      color: '#f97316',
      icon: 'activity',
      sortOrder: 14,
      isSystem: true,
      defaultAllowances: {
        housing: 1000,
        transport: 600,
        medical: 300,
        teaching: 500,
        other: 0,
      },
      responsibilities: [
        'Teach physical education',
        'Coach school sports teams',
        'Organize sports events',
        'Maintain sports equipment',
      ],
    },
  ];

  for (const designation of designations) {
    if (!designation.department) continue;

    await this.findOneAndUpdate(
      { code: designation.code },
      {
        $setOnInsert: {
          ...designation,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${designations.length} designations seeded`);
};

// Find by code
designationSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  }).populate('department', 'name code');
};

// Get all active designations
designationSchema.statics.getAllActive = function () {
  return this.find({ isActive: true })
    .sort({ level: -1, name: 1 })
    .populate('department', 'name code color');
};

// Get designations by department
designationSchema.statics.getByDepartment = function (departmentId) {
  return this.find({
    department: departmentId,
    isActive: true,
  })
    .sort({ level: -1, name: 1 })
    .populate('reportsTo', 'name code');
};

// Get teaching designations
designationSchema.statics.getTeachingDesignations = function () {
  return this.find({
    isTeachingPosition: true,
    isActive: true,
  }).sort({ level: -1 });
};

// Get management designations
designationSchema.statics.getManagementDesignations = function () {
  return this.find({
    isManagement: true,
    isActive: true,
  }).sort({ level: -1 });
};

// Update employee counts
designationSchema.statics.updateEmployeeCount = async function (designationId) {
  const Employee = mongoose.model('Employee');

  const [total, active] = await Promise.all([
    Employee.countDocuments({
      designation: designationId,
    }),
    Employee.countDocuments({
      designation: designationId,
      status: 'active',
    }),
  ]);

  return this.findByIdAndUpdate(
    designationId,
    {
      totalEmployees: total,
      activeEmployees: active,
    },
    { new: true }
  );
};

// Get designation hierarchy
designationSchema.statics.getHierarchy = async function (departmentId = null) {
  const query = { isActive: true };
  if (departmentId) query.department = departmentId;

  return this.find(query)
    .sort({ level: -1 })
    .populate('department', 'name code')
    .populate('reportsTo', 'name code level');
};

// Get dashboard stats
designationSchema.statics.getDashboardStats = async function () {
  const [total, byDepartment, byLevel] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$departmentName',
          count: { $sum: 1 },
          totalEmployees: {
            $sum: '$activeEmployees',
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          designations: {
            $push: '$name',
          },
        },
      },
      { $sort: { _id: -1 } },
    ]),
  ]);

  return { total, byDepartment, byLevel };
};

// ─── Instance Methods ─────────────────────────

// Check if salary is within range
designationSchema.methods.isSalaryInRange = function (salary) {
  if (!this.minSalary && !this.maxSalary) return true;
  return salary >= this.minSalary && salary <= this.maxSalary;
};

// Get total default monthly package
designationSchema.methods.getDefaultPackage = function () {
  return {
    basicSalary: this.defaultBasicSalary,
    housingAllowance: this.defaultAllowances?.housing || 0,
    transportAllowance: this.defaultAllowances?.transport || 0,
    medicalAllowance: this.defaultAllowances?.medical || 0,
    teachingAllowance: this.defaultAllowances?.teaching || 0,
    otherAllowances: this.defaultAllowances?.other || 0,
    totalCompensation: this.totalDefaultCompensation,
  };
};

// ─── Create Model ─────────────────────────────
const Designation = mongoose.model(
  'Designation',
  designationSchema
);

module.exports = Designation;