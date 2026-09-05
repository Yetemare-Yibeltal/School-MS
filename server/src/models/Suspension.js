// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SUSPENSION MODEL
// kat-school/server/src/models/Suspension.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const suspensionSchema = new mongoose.Schema(
  {
    // ─── Suspension Identity ──────────────────
    suspensionNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ─── Student ──────────────────────────────
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
      index: true,
    },

    // Cached student info
    studentName: {
      type: String,
      trim: true,
    },

    studentId: {
      type: String,
      trim: true,
      index: true,
    },

    grade: {
      type: String,
      trim: true,
      index: true,
    },

    section: {
      type: String,
      trim: true,
    },

    // Guardian contact (cached at time of suspension)
    guardianName: {
      type: String,
      trim: true,
      default: null,
    },

    guardianPhone: {
      type: String,
      trim: true,
      default: null,
    },

    guardianEmail: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Suspension Type ──────────────────────
    type: {
      type: String,
      required: [true, 'Suspension type is required'],
      enum: {
        values: ['Internal Suspension', 'External Suspension', 'Indefinite Suspension'],
        message: '{VALUE} is not a valid type',
      },
    },

    // ─── Reason ──────────────────────────────
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [2000, 'Reason cannot exceed 2000 characters'],
    },

    // Category of offense
    offenseCategory: {
      type: String,
      required: [true, 'Offense category is required'],
      enum: {
        values: [
          'Violence & Fighting',
          'Bullying & Harassment',
          'Theft & Vandalism',
          'Cheating & Academic Dishonesty',
          'Substance Abuse',
          'Disrespect to Staff',
          'Truancy & Absenteeism',
          'Inappropriate Behavior',
          'Property Damage',
          'Violation of School Rules',
          'Other',
        ],
        message: '{VALUE} is not a valid offense category',
      },
      index: true,
    },

    // Detailed description of the incident
    incidentDescription: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },

    // Date of the incident
    incidentDate: {
      type: Date,
      required: [true, 'Incident date is required'],
    },

    // Incident location
    incidentLocation: {
      type: String,
      trim: true,
      default: null,
    },

    // Witnesses
    witnesses: {
      type: [String],
      default: [],
    },

    // ─── Suspension Period ────────────────────
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (endDate) {
          return endDate >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },

    numberOfDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Must be at least 1 day'],
    },

    // ─── Conditions for Reinstatement ─────────
    reinstatementConditions: {
      type: [String],
      default: [],
    },

    // Whether parent/guardian meeting is required
    requiresParentMeeting: {
      type: Boolean,
      default: true,
    },

    parentMeetingScheduled: {
      type: Boolean,
      default: false,
    },

    parentMeetingDate: {
      type: Date,
      default: null,
    },

    parentMeetingNotes: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Approval ────────────────────────────
    // Issued by (class teacher or admin)
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issued by is required'],
    },

    issuedByName: {
      type: String,
      trim: true,
    },

    issuedByRole: {
      type: String,
      trim: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    // Whether suspension requires director approval
    requiresDirectorApproval: {
      type: Boolean,
      default: false,
    },

    // Director approval
    directorApproval: {
      approved: {
        type: Boolean,
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
      remarks: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ─── Notification ─────────────────────────
    parentNotified: {
      type: Boolean,
      default: false,
    },

    parentNotifiedAt: {
      type: Date,
      default: null,
    },

    parentNotificationMethod: {
      type: [String],
      enum: ['sms', 'email', 'phone_call', 'letter'],
      default: [],
    },

    // ─── Reinstatement ────────────────────────
    isReinstated: {
      type: Boolean,
      default: false,
      index: true,
    },

    reinstatementDate: {
      type: Date,
      default: null,
    },

    reinstatementApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reinstatementApprovedByName: {
      type: String,
      trim: true,
      default: null,
    },

    reinstatementNotes: {
      type: String,
      trim: true,
      default: null,
    },

    // Conditions met for reinstatement
    conditionsMet: {
      type: [String],
      default: [],
    },

    // ─── Supporting Documents ─────────────────
    documents: [
      {
        name: { type: String, trim: true },
        type: {
          type: String,
          enum: ['Incident Report', 'Parent Letter', 'Evidence', 'Other'],
        },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ─── Academic Impact ──────────────────────
    // Whether student misses exams
    missesExams: {
      type: Boolean,
      default: false,
    },

    examsAffected: {
      type: [String],
      default: [],
    },

    // Whether make-up work is assigned
    makeUpWorkAssigned: {
      type: Boolean,
      default: false,
    },

    makeUpWorkDetails: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Follow-Up ────────────────────────────
    followUpActions: {
      type: [String],
      default: [],
    },

    counselingRequired: {
      type: Boolean,
      default: false,
    },

    counselingNotes: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Academic Context ─────────────────────
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

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      default: null,
    },

    termName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Status ──────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending_approval', 'active', 'completed', 'reinstated', 'cancelled', 'appealed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending_approval',
      index: true,
    },

    // Appeal details
    isAppealed: {
      type: Boolean,
      default: false,
    },

    appealReason: {
      type: String,
      trim: true,
      default: null,
    },

    appealDate: {
      type: Date,
      default: null,
    },

    appealOutcome: {
      type: String,
      enum: ['upheld', 'overturned', 'modified', 'pending', ''],
      default: '',
    },

    // ─── Notes ───────────────────────────────
    internalNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Internal notes cannot exceed 1000 characters'],
      default: null,
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
suspensionSchema.index({
  student: 1,
  academicYear: 1,
});
suspensionSchema.index({
  status: 1,
  startDate: -1,
});
suspensionSchema.index({
  offenseCategory: 1,
  academicYear: 1,
});
suspensionSchema.index({
  startDate: 1,
  endDate: 1,
});
suspensionSchema.index({ isReinstated: 1 });
suspensionSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Is currently active
suspensionSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return (
    this.status === 'active' && new Date(this.startDate) <= now && new Date(this.endDate) >= now
  );
});

// Is upcoming
suspensionSchema.virtual('isUpcoming').get(function () {
  return this.status === 'active' && new Date(this.startDate) > new Date();
});

// Is past
suspensionSchema.virtual('isPast').get(function () {
  return new Date(this.endDate) < new Date();
});

// Days remaining
suspensionSchema.virtual('daysRemaining').get(function () {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  if (end <= now) return 0;
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
});

// Requires director approval
suspensionSchema.virtual('needsDirectorApproval').get(function () {
  return this.requiresDirectorApproval && this.directorApproval.approved === null;
});

// ─── Pre-Save Hook ────────────────────────────
suspensionSchema.pre('save', async function (next) {
  // Auto-generate suspension number
  if (this.isNew && !this.suspensionNumber) {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');

      const count = await mongoose.model('Suspension').countDocuments({
        createdAt: {
          $gte: new Date(year, today.getMonth(), 1),
        },
      });

      const sequence = String(count + 1).padStart(4, '0');
      this.suspensionNumber = `SUS-${year}${month}-${sequence}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Auto-calculate number of days
  if (this.isModified('startDate') || this.isModified('endDate')) {
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      this.numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  // Require director approval for > 3 days
  if (this.isModified('numberOfDays') && this.numberOfDays > 3) {
    this.requiresDirectorApproval = true;
  }

  // Auto-update status
  if (this.isModified('isReinstated') && this.isReinstated) {
    this.status = 'reinstated';
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Get suspensions for a student
suspensionSchema.statics.getForStudent = function (studentId, filters = {}) {
  return this.find({
    student: studentId,
    ...filters,
  })
    .sort({ startDate: -1 })
    .populate('issuedBy', 'firstName fatherName role')
    .populate('directorApproval.approvedBy', 'firstName fatherName');
};

// Get currently active suspensions
suspensionSchema.statics.getActive = function () {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .sort({ endDate: 1 })
    .populate('student', 'firstName fatherName studentId grade section photo')
    .populate('issuedBy', 'firstName fatherName');
};

// Get suspensions pending director approval
suspensionSchema.statics.getPendingApproval = function () {
  return this.find({
    requiresDirectorApproval: true,
    'directorApproval.approved': null,
    status: 'pending_approval',
  })
    .sort({ createdAt: -1 })
    .populate('student', 'firstName fatherName studentId grade section')
    .populate('issuedBy', 'firstName fatherName role');
};

// Get suspensions pending reinstatement
suspensionSchema.statics.getPendingReinstatement = function () {
  const now = new Date();
  return this.find({
    status: 'active',
    endDate: { $lt: now },
    isReinstated: false,
  })
    .sort({ endDate: 1 })
    .populate('student', 'firstName fatherName studentId grade section');
};

// Approve suspension (director)
suspensionSchema.statics.approveDirector = async function (
  suspensionId,
  userId,
  userName,
  remarks = null
) {
  return this.findByIdAndUpdate(
    suspensionId,
    {
      'directorApproval.approved': true,
      'directorApproval.approvedBy': userId,
      'directorApproval.approvedByName': userName,
      'directorApproval.approvedAt': new Date(),
      'directorApproval.remarks': remarks,
      status: 'active',
    },
    { new: true }
  );
};

// Reinstate student
suspensionSchema.statics.reinstate = async function (
  suspensionId,
  userId,
  userName,
  notes = null,
  conditionsMet = []
) {
  const suspension = await this.findById(suspensionId);
  if (!suspension) {
    throw new Error('Suspension not found');
  }

  suspension.isReinstated = true;
  suspension.reinstatementDate = new Date();
  suspension.reinstatementApprovedBy = userId;
  suspension.reinstatementApprovedByName = userName;
  suspension.reinstatementNotes = notes;
  suspension.conditionsMet = conditionsMet;
  suspension.status = 'reinstated';

  await suspension.save();

  // Update student suspension flag
  await mongoose.model('Student').findByIdAndUpdate(suspension.student, {
    isSuspended: false,
  });

  return suspension;
};

// Auto-mark attendance for suspended students
suspensionSchema.statics.markAttendanceForSuspended = async function (date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(checkDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const activeSuspensions = await this.find({
    status: 'active',
    startDate: { $lte: checkDate },
    endDate: { $gte: checkDate },
  }).populate('student', 'classSection grade academicYear');

  const Attendance = mongoose.model('Attendance');
  let marked = 0;

  for (const suspension of activeSuspensions) {
    if (!suspension.student) continue;

    try {
      await Attendance.findOneAndUpdate(
        {
          student: suspension.student._id,
          date: checkDate,
        },
        {
          $setOnInsert: {
            student: suspension.student._id,
            date: checkDate,
            status: 'absent',
            reason: `Suspended — ${suspension.reason.substring(0, 100)}`,
            absenceType: 'Other',
            isExcused: false,
            section: suspension.student.classSection,
            grade: suspension.grade,
            academicYear: suspension.student.academicYear,
            markedBy: suspension.issuedBy,
            markedAt: new Date(),
          },
        },
        { upsert: true }
      );
      marked++;
    } catch (error) {
      console.error(`❌ Attendance marking failed for suspended student:`, error.message);
    }
  }

  return marked;
};

// Get suspension statistics
suspensionSchema.statics.getDashboardStats = async function (academicYearId) {
  const now = new Date();

  const [total, active, pending, reinstated, byCategory, byGrade] = await Promise.all([
    this.countDocuments({
      academicYear: academicYearId,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    }),
    this.countDocuments({
      status: 'pending_approval',
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'reinstated',
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
        },
      },
      {
        $group: {
          _id: '$offenseCategory',
          count: { $sum: 1 },
          totalDays: { $sum: '$numberOfDays' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
        },
      },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    total,
    active,
    pending,
    reinstated,
    byCategory,
    byGrade,
  };
};

// ─── Instance Methods ─────────────────────────

// Notify parent
suspensionSchema.methods.notifyParent = async function (methods = ['sms']) {
  this.parentNotified = true;
  this.parentNotifiedAt = new Date();
  this.parentNotificationMethod = methods;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Add document
suspensionSchema.methods.addDocument = async function ({ name, type, url, publicId }) {
  this.documents.push({
    name,
    type,
    url,
    publicId,
    uploadedAt: new Date(),
  });
  await this.save();
  return this;
};

// Schedule parent meeting
suspensionSchema.methods.scheduleParentMeeting = async function (date) {
  this.parentMeetingScheduled = true;
  this.parentMeetingDate = date;
  await this.save();
  return this;
};

// Get date range display
suspensionSchema.methods.getDateRangeDisplay = function () {
  const start = new Date(this.startDate).toLocaleDateString('en-ET', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const end = new Date(this.endDate).toLocaleDateString('en-ET', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${start} – ${end} (${this.numberOfDays} day${this.numberOfDays !== 1 ? 's' : ''})`;
};

// ─── Create Model ─────────────────────────────
const Suspension = mongoose.model('Suspension', suspensionSchema);

module.exports = Suspension;
