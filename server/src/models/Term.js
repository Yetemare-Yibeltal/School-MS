// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TERM MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { ETHIOPIAN_MONTHS } = require('../config/constants');

const termSchema = new mongoose.Schema(
  {
    // ─── Term Identity ────────────────────────
    name: {
      type: String,
      required: [true, 'Term name is required'],
      trim: true,
      maxlength: [100, 'Term name cannot exceed 100 characters'],
      // e.g. "Term 1", "First Term", "Semester 1"
    },

    // Term number within the academic year (1, 2, 3)
    termNumber: {
      type: Number,
      required: [true, 'Term number is required'],
      min: [1, 'Term number must be at least 1'],
      max: [4, 'Term number cannot exceed 4'],
    },

    // ─── Academic Year ────────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
      index: true,
    },

    // Cached academic year name for quick access
    academicYearName: {
      type: String,
      trim: true,
    },

    // ─── Duration ─────────────────────────────
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (endDate) {
          return endDate > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },

    // Ethiopian calendar months
    startMonthEthiopian: {
      type: String,
      enum: {
        values: ETHIOPIAN_MONTHS.map((m) => m.name),
        message: '{VALUE} is not a valid Ethiopian month',
      },
    },

    endMonthEthiopian: {
      type: String,
      enum: {
        values: ETHIOPIAN_MONTHS.map((m) => m.name),
        message: '{VALUE} is not a valid Ethiopian month',
      },
    },

    // ─── Status ───────────────────────────────
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // ─── Exam Configuration ───────────────────
    examConfig: {
      // When exam results are published
      resultPublishDate: {
        type: Date,
        default: null,
      },

      // Are results published?
      resultsPublished: {
        type: Boolean,
        default: false,
      },

      resultsPublishedAt: {
        type: Date,
        default: null,
      },

      // Exam period start
      examStartDate: {
        type: Date,
        default: null,
      },

      // Exam period end
      examEndDate: {
        type: Date,
        default: null,
      },

      // Are marks entry open?
      marksEntryOpen: {
        type: Boolean,
        default: false,
      },

      marksEntryDeadline: {
        type: Date,
        default: null,
      },
    },

    // ─── Grading Config ───────────────────────
    gradingConfig: {
      caWeight: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      examWeight: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      passingScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      minimumAttendance: {
        type: Number,
        default: 75,
        min: 0,
        max: 100,
      },
    },

    // ─── Statistics (cached) ──────────────────
    stats: {
      totalExams: {
        type: Number,
        default: 0,
      },
      totalStudentsEnrolled: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      passRate: {
        type: Number,
        default: 0,
      },
      attendanceRate: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
    },

    // ─── Fee Deadlines ────────────────────────
    feeDeadline: {
      type: Date,
      default: null,
    },

    // ─── Report Card ──────────────────────────
    reportCardConfig: {
      // Are report cards generated?
      isGenerated: {
        type: Boolean,
        default: false,
      },

      generatedAt: {
        type: Date,
        default: null,
      },

      // Are report cards published to students/parents?
      isPublished: {
        type: Boolean,
        default: false,
      },

      publishedAt: {
        type: Date,
        default: null,
      },
    },

    // ─── Notes ────────────────────────────────
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

// ─── Compound Indexes ─────────────────────────
termSchema.index({ academicYear: 1, termNumber: 1 }, { unique: true });
termSchema.index({ academicYear: 1, isActive: 1 });
termSchema.index({ isCurrent: 1 });
termSchema.index({ startDate: 1, endDate: 1 });
termSchema.index({ isCompleted: 1 });

// ─── Virtuals ─────────────────────────────────
// Duration in days
termSchema.virtual('durationDays').get(function () {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((new Date(this.endDate) - new Date(this.startDate)) / (1000 * 60 * 60 * 24));
});

// Days remaining until end
termSchema.virtual('daysRemaining').get(function () {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  if (now >= end) return 0;
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
});

// Days until start
termSchema.virtual('daysUntilStart').get(function () {
  if (!this.startDate) return null;
  const now = new Date();
  const start = new Date(this.startDate);
  if (now >= start) return 0;
  return Math.ceil((start - now) / (1000 * 60 * 60 * 24));
});

// Progress percentage
termSchema.virtual('progressPercentage').get(function () {
  if (!this.startDate || !this.endDate) return 0;
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
});

// Is currently running
termSchema.virtual('isRunning').get(function () {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.isActive;
});

// Is exam period
termSchema.virtual('isExamPeriod').get(function () {
  if (!this.examConfig.examStartDate || !this.examConfig.examEndDate) return false;
  const now = new Date();
  return (
    now >= new Date(this.examConfig.examStartDate) && now <= new Date(this.examConfig.examEndDate)
  );
});

// Is marks entry open
termSchema.virtual('isMarksEntryOpen').get(function () {
  if (!this.examConfig.marksEntryOpen) return false;
  if (!this.examConfig.marksEntryDeadline) return true;
  return new Date(this.examConfig.marksEntryDeadline) > new Date();
});

// Display name with year
termSchema.virtual('displayName').get(function () {
  return this.academicYearName ? `${this.name} — ${this.academicYearName}` : this.name;
});

// ─── Pre-Save Middleware ──────────────────────
// Ensure only one term is active/current per academic year
termSchema.pre('save', async function (next) {
  if (this.isModified('isActive') && this.isActive) {
    await mongoose.model('Term').updateMany(
      {
        academicYear: this.academicYear,
        _id: { $ne: this._id },
      },
      { isActive: false, isCurrent: false }
    );
    this.isCurrent = true;
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Get current active term
termSchema.statics.getCurrent = function () {
  return this.findOne({
    isActive: true,
    isCurrent: true,
  }).populate('academicYear', 'name ethiopianYear');
};

// Get current term for specific academic year
termSchema.statics.getCurrentForYear = function (academicYearId) {
  return this.findOne({
    academicYear: academicYearId,
    isActive: true,
  }).populate('academicYear', 'name ethiopianYear');
};

// Get all terms for an academic year
termSchema.statics.getForYear = function (academicYearId) {
  return this.find({ academicYear: academicYearId })
    .sort({ termNumber: 1 })
    .populate('academicYear', 'name ethiopianYear');
};

// Find term by number and year
termSchema.statics.findByNumberAndYear = function (termNumber, academicYearId) {
  return this.findOne({
    termNumber: parseInt(termNumber),
    academicYear: academicYearId,
  }).populate('academicYear', 'name ethiopianYear');
};

// Find term that contains a specific date
termSchema.statics.findByDate = function (date) {
  const checkDate = new Date(date);
  return this.findOne({
    startDate: { $lte: checkDate },
    endDate: { $gte: checkDate },
  }).populate('academicYear', 'name ethiopianYear');
};

// Activate a term
termSchema.statics.activate = async function (termId) {
  const term = await this.findById(termId);
  if (!term) throw new Error('Term not found');

  // Deactivate all terms in same year
  await this.updateMany(
    {
      academicYear: term.academicYear,
    },
    { isActive: false, isCurrent: false }
  );

  // Activate the specified term
  return this.findByIdAndUpdate(termId, { isActive: true, isCurrent: true }, { new: true });
};

// Mark term as completed
termSchema.statics.markCompleted = async function (termId) {
  return this.findByIdAndUpdate(
    termId,
    {
      isCompleted: true,
      isActive: false,
      isCurrent: false,
      completedAt: new Date(),
    },
    { new: true }
  );
};

// Open marks entry for a term
termSchema.statics.openMarksEntry = async function (termId, deadline = null) {
  const update = {
    'examConfig.marksEntryOpen': true,
  };

  if (deadline) {
    update['examConfig.marksEntryDeadline'] = new Date(deadline);
  }

  return this.findByIdAndUpdate(termId, update, {
    new: true,
  });
};

// Close marks entry
termSchema.statics.closeMarksEntry = async function (termId) {
  return this.findByIdAndUpdate(termId, { 'examConfig.marksEntryOpen': false }, { new: true });
};

// Publish results for a term
termSchema.statics.publishResults = async function (termId) {
  return this.findByIdAndUpdate(
    termId,
    {
      'examConfig.resultsPublished': true,
      'examConfig.resultsPublishedAt': new Date(),
    },
    { new: true }
  );
};

// Unpublish results
termSchema.statics.unpublishResults = async function (termId) {
  return this.findByIdAndUpdate(
    termId,
    {
      'examConfig.resultsPublished': false,
      'examConfig.resultsPublishedAt': null,
    },
    { new: true }
  );
};

// Publish report cards
termSchema.statics.publishReportCards = async function (termId) {
  return this.findByIdAndUpdate(
    termId,
    {
      'reportCardConfig.isPublished': true,
      'reportCardConfig.publishedAt': new Date(),
    },
    { new: true }
  );
};

// Seed 3 default terms for an academic year
termSchema.statics.seedTermsForYear = async function (academicYearId, academicYearName) {
  const terms = [
    {
      name: 'Term 1',
      termNumber: 1,
      academicYear: academicYearId,
      academicYearName,
      startDate: new Date('2023-09-11'),
      endDate: new Date('2023-12-22'),
      startMonthEthiopian: 'Meskerem',
      endMonthEthiopian: 'Tahsas',
      isActive: true,
      isCurrent: true,
      gradingConfig: {
        caWeight: 50,
        examWeight: 50,
        passingScore: 50,
        minimumAttendance: 75,
      },
    },
    {
      name: 'Term 2',
      termNumber: 2,
      academicYear: academicYearId,
      academicYearName,
      startDate: new Date('2024-01-08'),
      endDate: new Date('2024-03-22'),
      startMonthEthiopian: 'Tir',
      endMonthEthiopian: 'Megabit',
      isActive: false,
      isCurrent: false,
      gradingConfig: {
        caWeight: 50,
        examWeight: 50,
        passingScore: 50,
        minimumAttendance: 75,
      },
    },
    {
      name: 'Term 3',
      termNumber: 3,
      academicYear: academicYearId,
      academicYearName,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-06-07'),
      startMonthEthiopian: 'Miazia',
      endMonthEthiopian: 'Sene',
      isActive: false,
      isCurrent: false,
      gradingConfig: {
        caWeight: 50,
        examWeight: 50,
        passingScore: 50,
        minimumAttendance: 75,
      },
    },
  ];

  const createdTerms = [];
  for (const termData of terms) {
    const term = await this.findOneAndUpdate(
      {
        academicYear: academicYearId,
        termNumber: termData.termNumber,
      },
      { $setOnInsert: termData },
      { upsert: true, new: true }
    );
    createdTerms.push(term);
  }

  console.info(`✅ 3 terms seeded for ${academicYearName}`);
  return createdTerms;
};

// Update stats for a term
termSchema.statics.updateStats = async function (termId) {
  const ExamResult = mongoose.model('ExamResult');

  const results = await ExamResult.aggregate([
    {
      $match: {
        term: new mongoose.Types.ObjectId(termId),
      },
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$totalScore' },
        passCount: {
          $sum: {
            $cond: [{ $gte: ['$totalScore', 50] }, 1, 0],
          },
        },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  if (results.length === 0) return;

  const { avgScore, passCount, totalCount } = results[0];

  return this.findByIdAndUpdate(
    termId,
    {
      'stats.averageScore': Math.round(avgScore || 0),
      'stats.passRate': totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0,
      'stats.lastUpdated': new Date(),
    },
    { new: true }
  );
};

// ─── Instance Methods ─────────────────────────

// Check if a date is within this term
termSchema.methods.containsDate = function (date) {
  const checkDate = new Date(date);
  return checkDate >= new Date(this.startDate) && checkDate <= new Date(this.endDate);
};

// Check if results are available to view
termSchema.methods.areResultsAvailable = function () {
  return this.examConfig.resultsPublished;
};

// Check if marks entry is allowed
termSchema.methods.canEnterMarks = function () {
  return this.isMarksEntryOpen;
};

// Get term label e.g. "Term 1, 2016 E.C."
termSchema.methods.getLabel = function () {
  return `${this.name}${this.academicYearName ? `, ${this.academicYearName}` : ''}`;
};

// ─── Create Model ─────────────────────────────
const Term = mongoose.model('Term', termSchema);

module.exports = Term;
