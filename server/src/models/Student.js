// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// STUDENT MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  GRADE_NAMES,
  SECTIONS,
  STREAMS,
  STUDENT_STATUS,
  ETHIOPIAN_REGIONS,
  ETHIOPIAN_RELIGIONS,
  ETHIOPIAN_LANGUAGES,
  BLOOD_GROUPS,
  GENDERS,
  DOCUMENT_TYPES,
} = require('../config/constants');

const studentSchema = new mongoose.Schema(
  {
    // ─── Student ID ───────────────────────────
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      match: [/^KAT-\d{4,6}$/, 'Student ID must be in format KAT-XXXX'],
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
      maxlength: [50, "Grand father's name cannot exceed 50 characters"],
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
          return age >= 10 && age <= 30;
        },
        message: 'Student age must be between 10 and 30 years',
      },
    },

    // Ethiopian birth date fields
    dateOfBirthEthiopian: {
      day: { type: Number, min: 1, max: 30 },
      month: { type: Number, min: 1, max: 13 },
      year: { type: Number },
    },

    nationality: {
      type: String,
      default: 'Ethiopian',
      trim: true,
    },

    religion: {
      type: String,
      enum: {
        values: ETHIOPIAN_RELIGIONS,
        message: '{VALUE} is not a valid religion',
      },
    },

    motherTongue: {
      type: String,
      enum: {
        values: ETHIOPIAN_LANGUAGES,
        message: '{VALUE} is not a valid language',
      },
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
      trim: true,
      match: [/^(\+251|0)[0-9]{9}$/, 'Please provide a valid Ethiopian phone number'],
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

    // ─── Academic Information ─────────────────
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      index: true,
    },

    section: {
      type: String,
      required: [true, 'Section is required'],
      enum: {
        values: SECTIONS,
        message: '{VALUE} is not a valid section',
      },
      index: true,
    },

    stream: {
      type: String,
      enum: {
        values: [...STREAMS, ''],
        message: '{VALUE} is not a valid stream',
      },
      default: '',
    },

    // Reference to Class document
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
      index: true,
    },

    // Reference to Section document
    classSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },

    // Current academic year
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
      index: true,
    },

    // ─── Enrollment History ───────────────────
    enrollmentDate: {
      type: Date,
      required: [true, 'Enrollment date is required'],
      default: Date.now,
    },

    // Track which grades the student passed through
    academicHistory: [
      {
        academicYear: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AcademicYear',
        },
        grade: {
          type: String,
          enum: GRADE_NAMES,
        },
        section: {
          type: String,
          enum: SECTIONS,
        },
        stream: String,
        classTeacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
        },
        result: {
          type: String,
          enum: ['passed', 'failed', 'promoted', 'repeated', ''],
          default: '',
        },
        finalAverage: { type: Number, default: null },
        rank: { type: Number, default: null },
        remarks: { type: String, trim: true },
      },
    ],

    // ─── Previous School ──────────────────────
    previousSchool: {
      name: { type: String, trim: true },
      region: { type: String, trim: true },
      lastGrade: { type: String, trim: true },
      leavingDate: { type: Date },
      leavingCertificateNumber: {
        type: String,
        trim: true,
      },
    },

    // ─── Guardian Information ─────────────────
    guardian: {
      // Primary guardian
      primary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guardian',
        default: null,
      },

      // Secondary guardian (optional)
      secondary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guardian',
        default: null,
      },

      // Quick access fields (cached from Guardian)
      name: {
        type: String,
        required: [true, 'Guardian name is required'],
        trim: true,
      },

      relationship: {
        type: String,
        enum: [
          'Father',
          'Mother',
          'Uncle',
          'Aunt',
          'Grandfather',
          'Grandmother',
          'Brother',
          'Sister',
          'Legal Guardian',
          'Other',
        ],
        default: 'Father',
      },

      phone: {
        type: String,
        required: [true, 'Guardian phone is required'],
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
      },

      occupation: {
        type: String,
        trim: true,
      },

      workplace: {
        type: String,
        trim: true,
      },
    },

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

    // ─── Health Information ───────────────────
    health: {
      hasDisability: {
        type: Boolean,
        default: false,
      },
      disabilityType: {
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
      allergies: {
        type: [String],
        default: [],
      },
      medications: {
        type: String,
        trim: true,
        default: null,
      },
      medicalNotes: {
        type: String,
        trim: true,
        default: null,
      },
      doctorName: {
        type: String,
        trim: true,
        default: null,
      },
      doctorPhone: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ─── Category ─────────────────────────────
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentCategory',
      },
    ],

    // ─── Documents ───────────────────────────
    documents: [
      {
        type: {
          type: String,
          enum: DOCUMENT_TYPES,
        },
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        notes: { type: String, trim: true },
      },
    ],

    // ─── Fee Summary ──────────────────────────
    // Cached fee stats — updated when fees change
    feeSummary: {
      totalDue: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      lastPaymentDate: { type: Date, default: null },
      hasDiscount: { type: Boolean, default: false },
      discountAmount: { type: Number, default: 0 },
    },

    // ─── Attendance Summary ───────────────────
    // Cached attendance stats — updated daily
    attendanceSummary: {
      totalDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      lateDays: { type: Number, default: 0 },
      excusedDays: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: null },
    },

    // ─── Library Summary ──────────────────────
    librarySummary: {
      totalBooksIssued: { type: Number, default: 0 },
      currentlyIssued: { type: Number, default: 0 },
      overdueBooks: { type: Number, default: 0 },
      totalFine: { type: Number, default: 0 },
    },

    // ─── AI Performance Data ──────────────────
    // Cached AI prediction results
    aiInsights: {
      performanceRisk: {
        type: String,
        enum: ['low', 'medium', 'high', null],
        default: null,
      },
      performanceRiskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      attendanceRisk: {
        type: String,
        enum: ['low', 'medium', 'high', null],
        default: null,
      },
      feeDefaultRisk: {
        type: String,
        enum: ['low', 'medium', 'high', null],
        default: null,
      },
      lastAnalyzedAt: { type: Date, default: null },
      recommendations: {
        type: [String],
        default: [],
      },
    },

    // ─── Status ───────────────────────────────
    status: {
      type: String,
      enum: {
        values: Object.values(STUDENT_STATUS),
        message: '{VALUE} is not a valid status',
      },
      default: STUDENT_STATUS.ACTIVE,
      index: true,
    },

    // Reason if status is not active
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

    // ─── Suspension ───────────────────────────
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },

    suspensions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Suspension',
      },
    ],

    // ─── User Account Link ────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      unique: true,
      sparse: true,
    },

    // ─── Library Member ───────────────────────
    libraryMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMember',
      default: null,
    },

    // ─── Transport ────────────────────────────
    usesTransport: {
      type: Boolean,
      default: false,
    },

    transportRoute: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Extra Curricular ─────────────────────
    extraCurricular: {
      type: [String],
      default: [],
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
studentSchema.index({ studentId: 1 }, { unique: true });
studentSchema.index({ grade: 1, section: 1 });
studentSchema.index({ grade: 1, section: 1, status: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ isSuspended: 1 });
studentSchema.index({ academicYear: 1 });
studentSchema.index({ class: 1 });
studentSchema.index({ user: 1 }, { sparse: true });
studentSchema.index({ 'guardian.phone': 1 });
studentSchema.index({ createdAt: -1 });
studentSchema.index({
  firstName: 'text',
  fatherName: 'text',
  grandFatherName: 'text',
  studentId: 'text',
  'guardian.name': 'text',
});

// ─── Virtuals ─────────────────────────────────
// Full name
studentSchema.virtual('fullName').get(function () {
  const parts = [this.firstName, this.fatherName];
  if (this.grandFatherName) parts.push(this.grandFatherName);
  return parts.join(' ');
});

// Age in years
studentSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

// Display grade and section
studentSchema.virtual('gradeSection').get(function () {
  return `${this.grade} - ${this.section}`;
});

// Attendance percentage
studentSchema.virtual('attendanceSummary.rate').get(function () {
  if (!this.attendanceSummary.totalDays) return 0;
  return Math.round((this.attendanceSummary.presentDays / this.attendanceSummary.totalDays) * 100);
});

// Fee payment status
studentSchema.virtual('feeStatus').get(function () {
  if (!this.feeSummary.totalDue) return 'no_fees';
  if (this.feeSummary.balance <= 0) return 'paid';
  if (this.feeSummary.totalPaid > 0) return 'partial';
  return 'unpaid';
});

// ─── Pre-Save Hook ────────────────────────────
// Auto-generate studentId if not provided
studentSchema.pre('save', async function (next) {
  if (!this.isNew || this.studentId) return next();

  try {
    const Student = mongoose.model('Student');
    const lastStudent = await Student.findOne({}, {}, { sort: { createdAt: -1 } }).select(
      'studentId'
    );

    let nextNumber = 1001;

    if (lastStudent && lastStudent.studentId) {
      const lastNumber = parseInt(lastStudent.studentId.replace('KAT-', ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    this.studentId = `KAT-${nextNumber.toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Update attendance percentage before saving
studentSchema.pre('save', function (next) {
  if (this.isModified('attendanceSummary')) {
    const { totalDays, presentDays } = this.attendanceSummary;
    if (totalDays > 0) {
      this.attendanceSummary.attendancePercentage = Math.round((presentDays / totalDays) * 100);
    }
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Find student by student ID
studentSchema.statics.findByStudentId = function (studentId) {
  return this.findOne({
    studentId: studentId.toUpperCase(),
  });
};

// Find students by grade and section
studentSchema.statics.findByGradeSection = function (grade, section, academicYearId = null) {
  const query = { grade, section, status: 'active' };
  if (academicYearId) query.academicYear = academicYearId;
  return this.find(query).sort({
    firstName: 1,
    fatherName: 1,
  });
};

// Search students by name or ID
studentSchema.statics.search = function (searchTerm, filters = {}) {
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
        grandFatherName: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        studentId: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        'guardian.name': {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        'guardian.phone': {
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
      'studentId firstName fatherName grade section status photo guardian.name guardian.phone'
    );
};

// Get student stats for dashboard
studentSchema.statics.getDashboardStats = async function () {
  const [total, active, suspended, byGrade, byGender, newThisMonth] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'active' }),
    this.countDocuments({ isSuspended: true }),
    this.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    this.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]),
    this.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setDate(1)),
      },
    }),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    suspended,
    byGrade,
    byGender,
    newThisMonth,
  };
};

// Get students with low attendance (below threshold)
studentSchema.statics.getLowAttendanceStudents = function (threshold = 75) {
  return this.find({
    status: 'active',
    'attendanceSummary.attendancePercentage': {
      $lt: threshold,
      $gt: 0,
    },
  })
    .sort({
      'attendanceSummary.attendancePercentage': 1,
    })
    .select(
      'studentId firstName fatherName grade section attendanceSummary guardian.name guardian.phone guardian.email'
    );
};

// Get students with pending fees
studentSchema.statics.getStudentsWithPendingFees = function () {
  return this.find({
    status: 'active',
    'feeSummary.balance': { $gt: 0 },
  })
    .sort({ 'feeSummary.balance': -1 })
    .select('studentId firstName fatherName grade section feeSummary guardian.name guardian.phone');
};

// Update attendance summary for a student
studentSchema.statics.updateAttendanceSummary = async function (studentId) {
  const Attendance = mongoose.model('Attendance');

  const stats = await Attendance.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
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
        excused: {
          $sum: {
            $cond: [{ $eq: ['$status', 'excused'] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (stats.length === 0) return;

  const { total, present, absent, late, excused } = stats[0];
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  await this.findByIdAndUpdate(studentId, {
    attendanceSummary: {
      totalDays: total,
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      excusedDays: excused,
      attendancePercentage: percentage,
      lastUpdated: new Date(),
    },
  });
};

// ─── Instance Methods ─────────────────────────

// Get student's full display name
studentSchema.methods.getDisplayName = function () {
  return `${this.firstName} ${this.fatherName}`;
};

// Check if student is eligible to sit exams
// (must have >= 75% attendance)
studentSchema.methods.isEligibleForExam = function (threshold = 75) {
  return this.attendanceSummary.attendancePercentage >= threshold;
};

// Check if student has outstanding fees
studentSchema.methods.hasPendingFees = function () {
  return this.feeSummary.balance > 0;
};

// Add to academic history
studentSchema.methods.addAcademicHistory = async function (historyData) {
  this.academicHistory.push(historyData);
  await this.save();
};

// Get initials for avatar
studentSchema.methods.getInitials = function () {
  return `${this.firstName.charAt(0)}${this.fatherName.charAt(0)}`.toUpperCase();
};

// ─── Create Model ─────────────────────────────
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
