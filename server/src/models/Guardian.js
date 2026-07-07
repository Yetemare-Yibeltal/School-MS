// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// GUARDIAN / PARENT MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  ETHIOPIAN_REGIONS,
  ETHIOPIAN_RELIGIONS,
  ETHIOPIAN_LANGUAGES,
  GENDERS,
} = require('../config/constants');

const guardianSchema = new mongoose.Schema(
  {
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

    gender: {
      type: String,
      enum: {
        values: GENDERS,
        message: '{VALUE} is not a valid gender',
      },
      required: [true, 'Gender is required'],
    },

    // ─── Relationship to Students ─────────────
    // Type of relationship with linked students
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      enum: {
        values: [
          'Father',
          'Mother',
          'Uncle',
          'Aunt',
          'Grandfather',
          'Grandmother',
          'Brother',
          'Sister',
          'Legal Guardian',
          'Step Father',
          'Step Mother',
          'Other',
        ],
        message: '{VALUE} is not a valid relationship',
      },
    },

    // ─── Linked Students ─────────────────────
    // One guardian can have multiple students
    students: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        isPrimary: {
          type: Boolean,
          default: true,
        },
        // Can this guardian access the student's data?
        canAccess: {
          type: Boolean,
          default: true,
        },
      },
    ],

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
      index: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
      match: [/^(\+251|0)[0-9]{9}$/, 'Please provide a valid Ethiopian phone number'],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
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
      specificLocation: {
        type: String,
        trim: true,
      },
    },

    // ─── Occupation ───────────────────────────
    occupation: {
      type: String,
      trim: true,
      maxlength: [100, 'Occupation cannot exceed 100 characters'],
    },

    employer: {
      type: String,
      trim: true,
      maxlength: [100, 'Employer name cannot exceed 100 characters'],
    },

    workAddress: {
      type: String,
      trim: true,
      maxlength: [200, 'Work address cannot exceed 200 characters'],
    },

    workPhone: {
      type: String,
      trim: true,
    },

    // Monthly income range (for scholarship evaluation)
    monthlyIncomeRange: {
      type: String,
      enum: [
        'Below ETB 2,000',
        'ETB 2,000 - 5,000',
        'ETB 5,000 - 10,000',
        'ETB 10,000 - 20,000',
        'Above ETB 20,000',
        'Prefer not to say',
        '',
      ],
      default: '',
    },

    // ─── Education ────────────────────────────
    educationLevel: {
      type: String,
      enum: [
        'No formal education',
        'Primary (Grade 1-8)',
        'Secondary (Grade 9-12)',
        'Certificate',
        'Diploma',
        'Degree',
        'Masters',
        'PhD',
        'Other',
        '',
      ],
      default: '',
    },

    // ─── Personal Details ─────────────────────
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

    // National ID or Kebele ID number
    nationalId: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Communication Preferences ────────────
    communicationPreferences: {
      // Receive SMS alerts
      sms: {
        type: Boolean,
        default: true,
      },

      // Receive email alerts
      email: {
        type: Boolean,
        default: false,
      },

      // Receive attendance alerts
      attendanceAlerts: {
        type: Boolean,
        default: true,
      },

      // Receive fee reminders
      feeReminders: {
        type: Boolean,
        default: true,
      },

      // Receive result notifications
      resultNotifications: {
        type: Boolean,
        default: true,
      },

      // Receive school notices
      schoolNotices: {
        type: Boolean,
        default: true,
      },

      // Preferred language for communication
      preferredLanguage: {
        type: String,
        enum: ['en', 'am'],
        default: 'am',
      },

      // Best time to contact
      bestContactTime: {
        type: String,
        enum: ['Morning', 'Afternoon', 'Evening', 'Anytime'],
        default: 'Anytime',
      },
    },

    // ─── Portal Access ────────────────────────
    // Whether this guardian has a login account
    hasPortalAccess: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Link to User account (for portal login)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      sparse: true,
    },

    // Portal last accessed
    lastPortalAccess: {
      type: Date,
      default: null,
    },

    // ─── School Visit History ─────────────────
    schoolVisits: [
      {
        date: { type: Date, required: true },
        purpose: { type: String, trim: true },
        metWith: { type: String, trim: true },
        notes: { type: String, trim: true },
        recordedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // ─── Status ───────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
guardianSchema.index({ phone: 1 });
guardianSchema.index({ email: 1 }, { sparse: true });
guardianSchema.index({ isActive: 1 });
guardianSchema.index({ 'students.student': 1 });
guardianSchema.index({ user: 1 }, { sparse: true });
guardianSchema.index({ createdAt: -1 });
guardianSchema.index({
  firstName: 'text',
  fatherName: 'text',
  phone: 'text',
  email: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Full name
guardianSchema.virtual('fullName').get(function () {
  const parts = [this.firstName, this.fatherName];
  if (this.grandFatherName) parts.push(this.grandFatherName);
  return parts.join(' ');
});

// Title prefix based on gender
guardianSchema.virtual('titleName').get(function () {
  const prefix = this.gender === 'Male' ? 'Ato' : 'W/ro';
  return `${prefix} ${this.firstName} ${this.fatherName}`;
});

// Number of students linked
guardianSchema.virtual('studentCount').get(function () {
  return this.students ? this.students.length : 0;
});

// Get initials
guardianSchema.virtual('initials').get(function () {
  return `${this.firstName.charAt(0)}${this.fatherName.charAt(0)}`.toUpperCase();
});

// ─── Static Methods ───────────────────────────

// Find guardian by phone number
guardianSchema.statics.findByPhone = function (phone) {
  return this.findOne({
    phone: phone.trim(),
    isActive: true,
  });
};

// Find guardians linked to a specific student
guardianSchema.statics.findByStudent = function (studentId) {
  return this.find({
    'students.student': studentId,
    isActive: true,
  }).populate('students.student', 'firstName fatherName studentId grade section');
};

// Find guardian with portal access by email
guardianSchema.statics.findPortalUser = function (email) {
  return this.findOne({
    email: email.toLowerCase(),
    hasPortalAccess: true,
    isActive: true,
  }).populate('user');
};

// Search guardians
guardianSchema.statics.search = function (searchTerm, filters = {}) {
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
        phone: { $regex: searchTerm, $options: 'i' },
      },
      {
        email: { $regex: searchTerm, $options: 'i' },
      },
    ],
    isActive: true,
    ...filters,
  };

  return this.find(query)
    .sort({ firstName: 1 })
    .select(
      'firstName fatherName phone email relationship occupation photo hasPortalAccess students'
    )
    .populate('students.student', 'firstName fatherName studentId grade section');
};

// Add student to guardian
guardianSchema.statics.addStudent = async function (guardianId, studentId, isPrimary = true) {
  return this.findByIdAndUpdate(
    guardianId,
    {
      $addToSet: {
        students: {
          student: studentId,
          isPrimary,
          canAccess: true,
        },
      },
    },
    { new: true }
  );
};

// Remove student from guardian
guardianSchema.statics.removeStudent = async function (guardianId, studentId) {
  return this.findByIdAndUpdate(
    guardianId,
    {
      $pull: {
        students: { student: studentId },
      },
    },
    { new: true }
  );
};

// Get all guardians with portal access
guardianSchema.statics.getPortalUsers = function () {
  return this.find({
    hasPortalAccess: true,
    isActive: true,
  })
    .select('firstName fatherName email phone lastPortalAccess')
    .sort({ lastPortalAccess: -1 });
};

// Get stats for dashboard
guardianSchema.statics.getDashboardStats = async function () {
  const [total, withPortal, byRelationship] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments({
      hasPortalAccess: true,
      isActive: true,
    }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$relationship',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    total,
    withPortal,
    withoutPortal: total - withPortal,
    byRelationship,
  };
};

// ─── Instance Methods ─────────────────────────

// Add school visit record
guardianSchema.methods.addVisit = async function ({ date, purpose, metWith, notes, recordedBy }) {
  this.schoolVisits.push({
    date,
    purpose,
    metWith,
    notes,
    recordedBy,
  });
  await this.save();
  return this;
};

// Enable portal access
guardianSchema.methods.enablePortalAccess = async function (userId) {
  this.hasPortalAccess = true;
  this.user = userId;
  await this.save();
  return this;
};

// Disable portal access
guardianSchema.methods.disablePortalAccess = async function () {
  this.hasPortalAccess = false;
  await this.save();
  return this;
};

// Update last portal access
guardianSchema.methods.updateLastAccess = async function () {
  this.lastPortalAccess = new Date();
  await this.save({ validateBeforeSave: false });
  return this;
};

// Check if guardian can access a specific student
guardianSchema.methods.canAccessStudent = function (studentId) {
  const studentEntry = this.students.find(
    (s) => s.student.toString() === studentId.toString() && s.canAccess
  );
  return !!studentEntry;
};

// ─── Create Model ─────────────────────────────
const Guardian = mongoose.model('Guardian', guardianSchema);

module.exports = Guardian;
