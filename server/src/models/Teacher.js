// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TEACHER MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  GRADE_NAMES,
  SECTIONS,
  ETHIOPIAN_REGIONS,
  ETHIOPIAN_RELIGIONS,
  ETHIOPIAN_LANGUAGES,
  BLOOD_GROUPS,
  GENDERS,
  EMPLOYMENT_TYPES,
  TEACHER_STATUS,
  SUBJECTS,
} = require('../config/constants');

const teacherSchema = new mongoose.Schema(
  {
    // ─── Teacher ID ───────────────────────────
    teacherId: {
      type: String,
      required: [true, 'Teacher ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      match: [/^TCH-\d{3,6}$/, 'Teacher ID must be in format TCH-XXX'],
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
          return age >= 18 && age <= 70;
        },
        message: 'Teacher age must be between 18 and 70 years',
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
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
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

    // ─── Professional Information ─────────────
    // Primary subject taught
    primarySubject: {
      type: String,
      required: [true, 'Primary subject is required'],
      trim: true,
    },

    // Additional subjects the teacher can teach
    additionalSubjects: {
      type: [String],
      default: [],
    },

    // Grade levels the teacher teaches
    gradeLevel: {
      type: [String],
      enum: GRADE_NAMES,
      default: [],
    },

    // Current classes assigned to this teacher
    assignedClasses: [
      {
        class: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Class',
        },
        section: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Section',
        },
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        isClassTeacher: {
          type: Boolean,
          default: false,
        },
        weeklyHours: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Is this teacher a class teacher?
    isClassTeacher: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Which class section they are class teacher of
    classTeacherOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },

    // ─── Qualifications ───────────────────────
    qualifications: [
      {
        degree: {
          type: String,
          required: true,
          trim: true,
          // e.g. BSc, MSc, BA, MA, PhD, Diploma
        },
        field: {
          type: String,
          required: true,
          trim: true,
          // e.g. Mathematics Education
        },
        institution: {
          type: String,
          required: true,
          trim: true,
          // e.g. Addis Ababa University
        },
        graduationYear: {
          type: Number,
          // Ethiopian calendar year
        },
        grade: {
          type: String,
          trim: true,
          // e.g. Distinction, Merit
        },
        documentUrl: {
          type: String,
          default: null,
        },
      },
    ],

    // Highest qualification summary
    highestQualification: {
      type: String,
      trim: true,
    },

    // Teaching license number
    teachingLicenseNumber: {
      type: String,
      trim: true,
      default: null,
    },

    teachingLicenseExpiry: {
      type: Date,
      default: null,
    },

    // ─── Employment Information ───────────────
    employmentType: {
      type: String,
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

    // Years of teaching experience
    // (total including previous schools)
    totalExperience: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },

    // Years at Kat School specifically
    experienceAtKat: {
      type: Number,
      default: 0,
      min: 0,
    },

    // TIN — Ethiopian Tax Identification Number
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

    // Previous employment history
    employmentHistory: [
      {
        schoolName: { type: String, trim: true },
        position: { type: String, trim: true },
        subject: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        reasonForLeaving: { type: String, trim: true },
        region: { type: String, trim: true },
      },
    ],

    // ─── Salary Information ───────────────────
    salary: {
      basicSalary: {
        type: Number,
        required: [true, 'Basic salary is required'],
        min: [0, 'Salary cannot be negative'],
      },

      // Allowances
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
      teachingAllowance: {
        type: Number,
        default: 0,
      },
      otherAllowances: {
        type: Number,
        default: 0,
      },

      // Bank details for salary payment
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

      // Payment method
      paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Cash', 'Telebirr', 'CBE Birr'],
        default: 'Bank Transfer',
      },

      // Salary grade/scale
      salaryGrade: {
        type: String,
        trim: true,
        default: null,
      },

      lastSalaryRevisionDate: {
        type: Date,
        default: null,
      },
    },

    // ─── Linked Salary Structure ──────────────
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null,
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
        academicYear: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AcademicYear',
        },
        rating: { type: Number, min: 0, max: 5 },
        evaluatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        evaluationDate: { type: Date },
        remarks: { type: String, trim: true },
        studentPassRate: { type: Number },
        classAverage: { type: Number },
      },
    ],

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

    // ─── Weekly Teaching Hours ────────────────
    weeklyTeachingHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 45,
    },

    // Maximum weekly hours allowed
    maxWeeklyHours: {
      type: Number,
      default: 30,
    },

    // ─── Documents ───────────────────────────
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
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: {
        type: String,
        trim: true,
        match: [/^(\+251|0)[0-9]{9}$/, 'Please provide a valid Ethiopian phone number'],
      },
    },

    // ─── AI Performance Insights ──────────────
    aiInsights: {
      teachingEffectiveness: {
        type: String,
        enum: ['excellent', 'good', 'average', 'poor', null],
        default: null,
      },
      recommendedTraining: {
        type: [String],
        default: [],
      },
      lastAnalyzedAt: {
        type: Date,
        default: null,
      },
    },

    // ─── Status ───────────────────────────────
    status: {
      type: String,
      enum: {
        values: Object.values(TEACHER_STATUS),
        message: '{VALUE} is not a valid status',
      },
      default: TEACHER_STATUS.ACTIVE,
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

    // ─── User Account ─────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      unique: true,
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
teacherSchema.index({ teacherId: 1 }, { unique: true });
teacherSchema.index({ email: 1 }, { unique: true });
teacherSchema.index({ status: 1 });
teacherSchema.index({ primarySubject: 1 });
teacherSchema.index({ isClassTeacher: 1 });
teacherSchema.index({ user: 1 }, { sparse: true });
teacherSchema.index({ createdAt: -1 });
teacherSchema.index({
  firstName: 'text',
  fatherName: 'text',
  grandFatherName: 'text',
  teacherId: 'text',
  primarySubject: 'text',
  email: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Full name
teacherSchema.virtual('fullName').get(function () {
  const parts = [this.firstName, this.fatherName];
  if (this.grandFatherName) parts.push(this.grandFatherName);
  return parts.join(' ');
});

// Title prefix based on gender
teacherSchema.virtual('titleName').get(function () {
  const prefix = this.gender === 'Male' ? 'Ato' : 'W/ro';
  return `${prefix} ${this.firstName} ${this.fatherName}`;
});

// Age
teacherSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

// Total gross salary
teacherSchema.virtual('grossSalary').get(function () {
  if (!this.salary) return 0;
  return (
    (this.salary.basicSalary || 0) +
    (this.salary.housingAllowance || 0) +
    (this.salary.transportAllowance || 0) +
    (this.salary.medicalAllowance || 0) +
    (this.salary.teachingAllowance || 0) +
    (this.salary.otherAllowances || 0)
  );
});

// Years at school
teacherSchema.virtual('yearsAtSchool').get(function () {
  if (!this.joinDate) return 0;
  const years = (new Date() - new Date(this.joinDate)) / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(years);
});

// Attendance percentage
teacherSchema.virtual('attendanceRate').get(function () {
  if (!this.attendanceSummary.totalDays) return 0;
  return Math.round((this.attendanceSummary.presentDays / this.attendanceSummary.totalDays) * 100);
});

// ─── Pre-Save Hook ────────────────────────────
// Auto-generate teacherId
teacherSchema.pre('save', async function (next) {
  if (!this.isNew || this.teacherId) return next();

  try {
    const Teacher = mongoose.model('Teacher');
    const lastTeacher = await Teacher.findOne({}, {}, { sort: { createdAt: -1 } }).select(
      'teacherId'
    );

    let nextNumber = 1;

    if (lastTeacher && lastTeacher.teacherId) {
      const lastNumber = parseInt(lastTeacher.teacherId.replace('TCH-', ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    this.teacherId = `TCH-${nextNumber.toString().padStart(3, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Update experience at Kat on each save
teacherSchema.pre('save', function (next) {
  if (this.joinDate) {
    this.experienceAtKat = Math.floor(
      (new Date() - new Date(this.joinDate)) / (1000 * 60 * 60 * 24 * 365)
    );
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Find by teacher ID
teacherSchema.statics.findByTeacherId = function (teacherId) {
  return this.findOne({
    teacherId: teacherId.toUpperCase(),
  });
};

// Find active teachers
teacherSchema.statics.findActive = function () {
  return this.find({ status: 'active' }).sort({
    firstName: 1,
    fatherName: 1,
  });
};

// Find teachers by subject
teacherSchema.statics.findBySubject = function (subject) {
  return this.find({
    $or: [
      {
        primarySubject: {
          $regex: subject,
          $options: 'i',
        },
      },
      {
        additionalSubjects: {
          $regex: subject,
          $options: 'i',
        },
      },
    ],
    status: 'active',
  });
};

// Search teachers
teacherSchema.statics.search = function (searchTerm, filters = {}) {
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
        teacherId: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        primarySubject: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        email: { $regex: searchTerm, $options: 'i' },
      },
    ],
    ...filters,
  };

  return this.find(query)
    .sort({ firstName: 1 })
    .select(
      'teacherId firstName fatherName primarySubject gradeLevel status photo email phone performanceRating'
    );
};

// Get dashboard stats
teacherSchema.statics.getDashboardStats = async function () {
  const [total, active, onLeave, bySubject, byGender, byEmploymentType] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'active' }),
    this.countDocuments({ status: 'on_leave' }),
    this.aggregate([
      {
        $group: {
          _id: '$primarySubject',
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
  ]);

  return {
    total,
    active,
    onLeave,
    inactive: total - active - onLeave,
    bySubject,
    byGender,
    byEmploymentType,
  };
};

// Update attendance summary
teacherSchema.statics.updateAttendanceSummary = async function (teacherId) {
  const TeacherAttendance = mongoose.model('TeacherAttendance');

  const stats = await TeacherAttendance.aggregate([
    {
      $match: {
        teacher: new mongoose.Types.ObjectId(teacherId),
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

  await this.findByIdAndUpdate(teacherId, {
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
teacherSchema.methods.getInitials = function () {
  return `${this.firstName.charAt(0)}${this.fatherName.charAt(0)}`.toUpperCase();
};

// Check if teacher is available for a time slot
teacherSchema.methods.isAvailable = function (day, period) {
  // Logic checked against timetable
  return true;
};

// Get total weekly hours
teacherSchema.methods.getTotalWeeklyHours = function () {
  return this.assignedClasses.reduce((total, cls) => total + (cls.weeklyHours || 0), 0);
};

// Check if teacher is overloaded
teacherSchema.methods.isOverloaded = function () {
  return this.getTotalWeeklyHours() > this.maxWeeklyHours;
};

// Get remaining leave balance
teacherSchema.methods.getLeaveBalance = function (leaveType) {
  const typeMap = {
    Annual: 'annual',
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

// ─── Create Model ─────────────────────────────
const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
