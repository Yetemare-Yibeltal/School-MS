// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TIMETABLE MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { DAYS_OF_WEEK, TIMETABLE_PERIODS } = require('../config/constants');

const timetableSchema = new mongoose.Schema(
  {
    // ─── Timetable Identity ───────────────────
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },

    // ─── Owner ────────────────────────────────
    // The section this timetable belongs to
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section is required'],
      index: true,
    },

    // Cached section name for quick access
    sectionName: {
      type: String,
      trim: true,
    },

    // The class this section belongs to
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      index: true,
    },

    // Cached grade for quick access
    grade: {
      type: String,
      trim: true,
    },

    // Cached stream
    stream: {
      type: String,
      trim: true,
      default: '',
    },

    // ─── Academic Year & Term ─────────────────
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

    // ─── Status ───────────────────────────────
    // Draft = being built
    // Published = visible to students and teachers
    // Archived = old timetable kept for records
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // When the timetable was published
    publishedAt: {
      type: Date,
      default: null,
    },

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Schedule Overview ────────────────────
    // Working days for this timetable
    workingDays: {
      type: [String],
      enum: DAYS_OF_WEEK,
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },

    // Number of periods per day
    periodsPerDay: {
      type: Number,
      default: 7,
      min: 1,
      max: 12,
    },

    // Period duration in minutes
    periodDuration: {
      type: Number,
      default: 60,
      min: 30,
      max: 120,
    },

    // Break periods config
    breakPeriods: [
      {
        afterPeriod: {
          type: Number,
          required: true,
        },
        duration: {
          type: Number,
          default: 30,
        },
        label: {
          type: String,
          default: 'Break',
          trim: true,
        },
      },
    ],

    // ─── Subjects Summary ─────────────────────
    // Quick reference of subjects in this timetable
    // Populated when timetable slots are created
    subjectSummary: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        subjectName: { type: String, trim: true },
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
        },
        teacherName: { type: String, trim: true },
        totalPeriods: {
          type: Number,
          default: 0,
        },
        color: { type: String, default: '#6366f1' },
      },
    ],

    // ─── Conflict Tracking ────────────────────
    hasConflicts: {
      type: Boolean,
      default: false,
    },

    conflicts: [
      {
        type: {
          type: String,
          enum: [
            'teacher_double_booking',
            'room_double_booking',
            'subject_overload',
            'teacher_overload',
          ],
        },
        day: { type: String },
        period: { type: Number },
        description: { type: String, trim: true },
        resolvedAt: { type: Date, default: null },
      },
    ],

    // ─── AI Generation ───────────────────────
    // Whether this timetable was AI-generated
    isAIGenerated: {
      type: Boolean,
      default: false,
    },

    aiGeneratedAt: {
      type: Date,
      default: null,
    },

    aiModel: {
      type: String,
      trim: true,
      default: null,
    },

    // AI generation parameters used
    aiParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ─── Version Control ──────────────────────
    version: {
      type: Number,
      default: 1,
    },

    // Previous version reference
    previousVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      default: null,
    },

    // ─── Effective Period ─────────────────────
    effectiveFrom: {
      type: Date,
      default: null,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },

    // ─── Notes ────────────────────────────────
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

    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────
timetableSchema.index({ section: 1, academicYear: 1 }, { unique: true });
timetableSchema.index({ class: 1, academicYear: 1 });
timetableSchema.index({ status: 1, isActive: 1 });
timetableSchema.index({ academicYear: 1 });
timetableSchema.index({ grade: 1, academicYear: 1 });
timetableSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Total slots in the timetable
timetableSchema.virtual('totalSlots').get(function () {
  return this.workingDays.length * this.periodsPerDay;
});

// Is published
timetableSchema.virtual('isPublished').get(function () {
  return this.status === 'published';
});

// Is draft
timetableSchema.virtual('isDraft').get(function () {
  return this.status === 'draft';
});

// Display label
timetableSchema.virtual('displayLabel').get(function () {
  return `${this.sectionName} — ${this.academicYearName}`;
});

// ─── Pre-Save Hook ────────────────────────────
timetableSchema.pre('save', function (next) {
  // Update lastModifiedAt
  this.lastModifiedAt = new Date();

  // Auto-generate name if not set
  if (!this.name && this.sectionName) {
    this.name = `${this.sectionName} Timetable — ${this.academicYearName || ''}`;
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Find timetable for a section
timetableSchema.statics.findForSection = function (sectionId, academicYearId) {
  return this.findOne({
    section: sectionId,
    academicYear: academicYearId,
    isActive: true,
  })
    .populate('section', 'name fullName grade')
    .populate('class', 'grade stream')
    .populate('academicYear', 'name ethiopianYear')
    .populate('publishedBy', 'firstName fatherName');
};

// Find timetable by teacher
// Returns all timetables containing a teacher
timetableSchema.statics.findForTeacher = async function (teacherId, academicYearId) {
  const TimetableSlot = mongoose.model('TimetableSlot');

  // Find all slots where this teacher teaches
  const slots = await TimetableSlot.find({
    teacher: teacherId,
    academicYear: academicYearId,
    isActive: true,
  })
    .populate('timetable')
    .populate('subject', 'name code color')
    .populate('section', 'fullName grade')
    .populate('room', 'name roomNumber')
    .sort({ day: 1, period: 1 });

  return slots;
};

// Get all published timetables for academic year
timetableSchema.statics.getPublishedForYear = function (academicYearId) {
  return this.find({
    academicYear: academicYearId,
    status: 'published',
    isActive: true,
  })
    .sort({ grade: 1, sectionName: 1 })
    .populate('section', 'name fullName')
    .populate('class', 'grade stream');
};

// Publish a timetable
timetableSchema.statics.publish = async function (timetableId, publishedBy) {
  return this.findByIdAndUpdate(
    timetableId,
    {
      status: 'published',
      publishedAt: new Date(),
      publishedBy,
    },
    { new: true }
  );
};

// Unpublish a timetable (revert to draft)
timetableSchema.statics.unpublish = async function (timetableId) {
  return this.findByIdAndUpdate(
    timetableId,
    {
      status: 'draft',
      publishedAt: null,
      publishedBy: null,
    },
    { new: true }
  );
};

// Archive old timetable
timetableSchema.statics.archive = async function (timetableId) {
  return this.findByIdAndUpdate(
    timetableId,
    {
      status: 'archived',
      isActive: false,
    },
    { new: true }
  );
};

// Create new version of existing timetable
timetableSchema.statics.createNewVersion = async function (timetableId, userId) {
  const original = await this.findById(timetableId);
  if (!original) throw new Error('Timetable not found');

  // Archive the current version
  await this.findByIdAndUpdate(timetableId, {
    status: 'archived',
    isActive: false,
  });

  // Create new version
  const newTimetable = await this.create({
    name: original.name,
    section: original.section,
    sectionName: original.sectionName,
    class: original.class,
    grade: original.grade,
    stream: original.stream,
    academicYear: original.academicYear,
    academicYearName: original.academicYearName,
    status: 'draft',
    workingDays: original.workingDays,
    periodsPerDay: original.periodsPerDay,
    periodDuration: original.periodDuration,
    breakPeriods: original.breakPeriods,
    version: original.version + 1,
    previousVersion: original._id,
    createdBy: userId,
  });

  return newTimetable;
};

// Mark timetable as having conflicts
timetableSchema.statics.markConflict = async function (timetableId, conflict) {
  return this.findByIdAndUpdate(
    timetableId,
    {
      hasConflicts: true,
      $push: { conflicts: conflict },
    },
    { new: true }
  );
};

// Clear all conflicts
timetableSchema.statics.clearConflicts = async function (timetableId) {
  return this.findByIdAndUpdate(
    timetableId,
    {
      hasConflicts: false,
      conflicts: [],
    },
    { new: true }
  );
};

// Update subject summary
timetableSchema.statics.updateSubjectSummary = async function (timetableId) {
  const TimetableSlot = mongoose.model('TimetableSlot');

  const slots = await TimetableSlot.find({
    timetable: timetableId,
    isActive: true,
  }).populate('subject', 'name color');

  // Count periods per subject-teacher combo
  const summaryMap = {};

  slots.forEach((slot) => {
    if (!slot.subject) return;
    const key = `${slot.subject._id}-${slot.teacher}`;

    if (!summaryMap[key]) {
      summaryMap[key] = {
        subject: slot.subject._id,
        subjectName: slot.subject.name,
        teacher: slot.teacher,
        teacherName: slot.teacherName || '',
        totalPeriods: 0,
        color: slot.subject.color || '#6366f1',
      };
    }

    summaryMap[key].totalPeriods++;
  });

  const subjectSummary = Object.values(summaryMap);

  return this.findByIdAndUpdate(timetableId, { subjectSummary }, { new: true });
};

// Get timetable with full slots populated
timetableSchema.statics.getFullTimetable = async function (sectionId, academicYearId) {
  const timetable = await this.findOne({
    section: sectionId,
    academicYear: academicYearId,
    isActive: true,
  })
    .populate('section', 'name fullName grade')
    .populate('class', 'grade stream')
    .populate('academicYear', 'name ethiopianYear');

  if (!timetable) return null;

  const TimetableSlot = mongoose.model('TimetableSlot');

  const slots = await TimetableSlot.find({
    timetable: timetable._id,
    isActive: true,
  })
    .populate('subject', 'name code color icon')
    .populate('teacher', 'firstName fatherName photo')
    .populate('room', 'name roomNumber')
    .sort({ day: 1, period: 1 });

  // Organize slots into a grid format
  const grid = {};
  DAYS_OF_WEEK.forEach((day) => {
    grid[day] = {};
    for (let p = 1; p <= 7; p++) {
      grid[day][p] = null;
    }
  });

  slots.forEach((slot) => {
    if (grid[slot.day]) {
      grid[slot.day][slot.period] = slot;
    }
  });

  return {
    timetable: timetable.toObject(),
    slots,
    grid,
  };
};

// Get stats for dashboard
timetableSchema.statics.getDashboardStats = async function (academicYearId) {
  const [total, published, draft, withConflicts] = await Promise.all([
    this.countDocuments({
      academicYear: academicYearId,
      isActive: true,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'published',
      isActive: true,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'draft',
      isActive: true,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      hasConflicts: true,
      isActive: true,
    }),
  ]);

  return {
    total,
    published,
    draft,
    withConflicts,
    completionRate: total > 0 ? Math.round((published / total) * 100) : 0,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if timetable is complete
// (all required periods filled)
timetableSchema.methods.isComplete = async function () {
  const TimetableSlot = mongoose.model('TimetableSlot');
  const filledSlots = await TimetableSlot.countDocuments({
    timetable: this._id,
    isActive: true,
  });

  const expectedSlots = this.workingDays.length * this.periodsPerDay;
  return filledSlots >= expectedSlots;
};

// Get completion percentage
timetableSchema.methods.getCompletionPercentage = async function () {
  const TimetableSlot = mongoose.model('TimetableSlot');
  const filledSlots = await TimetableSlot.countDocuments({
    timetable: this._id,
    isActive: true,
  });

  const expectedSlots = this.workingDays.length * this.periodsPerDay;

  if (expectedSlots === 0) return 0;
  return Math.round((filledSlots / expectedSlots) * 100);
};

// Check if timetable can be published
timetableSchema.methods.canPublish = async function () {
  if (this.hasConflicts) {
    return {
      can: false,
      reason: 'Timetable has unresolved conflicts',
    };
  }

  const isComplete = await this.isComplete();
  if (!isComplete) {
    return {
      can: false,
      reason: 'Timetable is not complete',
    };
  }

  return { can: true };
};

// ─── Create Model ─────────────────────────────
const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
