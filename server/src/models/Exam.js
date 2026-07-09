// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXAM MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADE_NAMES, EXAM_TYPES } = require('../config/constants');

const examSchema = new mongoose.Schema(
  {
    // ─── Exam Identity ────────────────────────
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // ─── Exam Type ────────────────────────────
    examType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamType',
      required: [true, 'Exam type is required'],
      index: true,
    },

    // Cached exam type name
    examTypeName: {
      type: String,
      trim: true,
      enum: {
        values: EXAM_TYPES,
        message: '{VALUE} is not a valid exam type',
      },
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
      required: [true, 'Term is required'],
      index: true,
    },

    termName: {
      type: String,
      trim: true,
    },

    // ─── Subject ──────────────────────────────
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true,
    },

    subjectName: {
      type: String,
      trim: true,
    },

    subjectCode: {
      type: String,
      trim: true,
    },

    // ─── Class & Section ──────────────────────
    // Exam can be for a whole class or specific section
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      index: true,
    },

    grade: {
      type: String,
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      index: true,
    },

    // Specific section (null = all sections of the class)
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
      index: true,
    },

    sectionName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Schedule ─────────────────────────────
    date: {
      type: Date,
      required: [true, 'Exam date is required'],
      index: true,
    },

    // Start time e.g. "08:00"
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
    },

    // Duration in minutes
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [30, 'Duration must be at least 30 minutes'],
      max: [300, 'Duration cannot exceed 300 minutes'],
      default: 180,
    },

    // End time (auto-calculated)
    endTime: {
      type: String,
      trim: true,
    },

    // ─── Venue ────────────────────────────────
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },

    roomName: {
      type: String,
      trim: true,
      default: null,
    },

    // Multiple rooms if large exam
    additionalRooms: [
      {
        room: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Room',
        },
        roomName: { type: String, trim: true },
      },
    ],

    // ─── Invigilators ─────────────────────────
    // Primary invigilator
    invigilator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    invigilatorName: {
      type: String,
      trim: true,
      default: null,
    },

    // Additional invigilators
    additionalInvigilators: [
      {
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
        },
        teacherName: { type: String, trim: true },
      },
    ],

    // ─── Marks Configuration ──────────────────
    // Maximum marks for this exam
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Maximum marks must be at least 1'],
      max: [100, 'Maximum marks cannot exceed 100'],
      default: 50,
    },

    // Passing marks
    passingMarks: {
      type: Number,
      default: 25,
      min: 0,
    },

    // Weight in final score (%)
    weightInFinalScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    // ─── Instructions ─────────────────────────
    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Instructions cannot exceed 2000 characters'],
    },

    // Topics/syllabus covered
    syllabusCovered: {
      type: [String],
      default: [],
    },

    // Materials allowed
    materialsAllowed: {
      type: [String],
      default: [],
      // e.g. ["Calculator", "Ruler", "Dictionary"]
    },

    // ─── Status ───────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed', 'rescheduled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'scheduled',
      index: true,
    },

    // Cancellation reason
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },

    // Rescheduled from
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      default: null,
    },

    // New exam if postponed
    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      default: null,
    },

    // ─── Results Status ───────────────────────
    // Whether marks entry has been started
    marksEntryStarted: {
      type: Boolean,
      default: false,
    },

    marksEntryStartedAt: {
      type: Date,
      default: null,
    },

    // Whether all marks have been entered
    marksEntryCompleted: {
      type: Boolean,
      default: false,
    },

    marksEntryCompletedAt: {
      type: Date,
      default: null,
    },

    marksEntryCompletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Whether results are published
    resultsPublished: {
      type: Boolean,
      default: false,
    },

    resultsPublishedAt: {
      type: Date,
      default: null,
    },

    // ─── Statistics (cached) ──────────────────
    stats: {
      totalStudents: {
        type: Number,
        default: 0,
      },
      appeared: {
        type: Number,
        default: 0,
      },
      absent: {
        type: Number,
        default: 0,
      },
      passed: {
        type: Number,
        default: 0,
      },
      failed: {
        type: Number,
        default: 0,
      },
      highestScore: {
        type: Number,
        default: 0,
      },
      lowestScore: {
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
      lastUpdated: {
        type: Date,
        default: null,
      },
    },

    // ─── Notification ─────────────────────────
    // Whether notifications have been sent
    notificationSent: {
      type: Boolean,
      default: false,
    },

    notificationSentAt: {
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────
examSchema.index({ academicYear: 1, term: 1 });
examSchema.index({ class: 1, term: 1 });
examSchema.index({ subject: 1, term: 1 });
examSchema.index({ date: 1, status: 1 });
examSchema.index({ status: 1 });
examSchema.index({ grade: 1, academicYear: 1 });
examSchema.index({
  room: 1,
  date: 1,
  startTime: 1,
});
examSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// End time calculation
examSchema.virtual('calculatedEndTime').get(function () {
  if (!this.startTime || !this.duration) return '';
  const [h, m] = this.startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + this.duration;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
});

// Is upcoming
examSchema.virtual('isUpcoming').get(function () {
  return new Date(this.date) > new Date() && this.status === 'scheduled';
});

// Is today
examSchema.virtual('isToday').get(function () {
  const today = new Date();
  const examDate = new Date(this.date);
  return examDate.toDateString() === today.toDateString();
});

// Is past
examSchema.virtual('isPast').get(function () {
  return new Date(this.date) < new Date();
});

// Days until exam
examSchema.virtual('daysUntil').get(function () {
  const now = new Date();
  const exam = new Date(this.date);
  if (exam <= now) return 0;
  return Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
});

// Pass rate display
examSchema.virtual('passRateDisplay').get(function () {
  return `${this.stats.passRate}%`;
});

// ─── Pre-Save Hook ────────────────────────────
// Auto-calculate end time
examSchema.pre('save', function (next) {
  if (this.isModified('startTime') || this.isModified('duration')) {
    if (this.startTime && this.duration) {
      const [h, m] = this.startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + this.duration;
      const endH = Math.floor(totalMinutes / 60);
      const endM = totalMinutes % 60;
      this.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    }
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Find exams for a class and term
examSchema.statics.findForClassTerm = function (classId, termId) {
  return this.find({
    class: classId,
    term: termId,
    status: { $ne: 'cancelled' },
  })
    .sort({ date: 1, startTime: 1 })
    .populate('subject', 'name code color')
    .populate('invigilator', 'firstName fatherName')
    .populate('room', 'name roomNumber')
    .populate('examType', 'name');
};

// Find exams for a section
examSchema.statics.findForSection = function (sectionId, termId) {
  return this.find({
    $or: [
      { section: sectionId },
      {
        section: null,
        class: { $exists: true },
      },
    ],
    term: termId,
    status: { $ne: 'cancelled' },
  })
    .sort({ date: 1, startTime: 1 })
    .populate('subject', 'name code color')
    .populate('room', 'name roomNumber')
    .populate('examType', 'name');
};

// Find upcoming exams
examSchema.statics.findUpcoming = function (filters = {}, limit = 10) {
  return this.find({
    date: { $gte: new Date() },
    status: 'scheduled',
    ...filters,
  })
    .sort({ date: 1, startTime: 1 })
    .limit(limit)
    .populate('subject', 'name code color')
    .populate('class', 'grade stream')
    .populate('section', 'name fullName')
    .populate('room', 'name roomNumber')
    .populate('examType', 'name');
};

// Find exams for today
examSchema.statics.findToday = function (filters = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ['scheduled', 'ongoing'] },
    ...filters,
  })
    .sort({ startTime: 1 })
    .populate('subject', 'name code color')
    .populate('class', 'grade stream')
    .populate('section', 'name fullName')
    .populate('room', 'name roomNumber');
};

// Find exams by subject and term
examSchema.statics.findBySubjectTerm = function (subjectId, termId) {
  return this.find({
    subject: subjectId,
    term: termId,
    status: { $ne: 'cancelled' },
  })
    .sort({ date: 1 })
    .populate('class', 'grade stream')
    .populate('section', 'name fullName');
};

// Check room conflicts for exam scheduling
examSchema.statics.checkRoomConflict = async function (
  roomId,
  date,
  startTime,
  duration,
  excludeExamId = null
) {
  if (!roomId) return false;

  const examDate = new Date(date);
  examDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(examDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const query = {
    room: roomId,
    date: { $gte: examDate, $lt: nextDay },
    status: { $nin: ['cancelled', 'postponed'] },
  };

  if (excludeExamId) {
    query._id = { $ne: excludeExamId };
  }

  const existingExams = await this.find(query).select('startTime endTime title');

  // Parse new exam times
  const [newH, newM] = startTime.split(':').map(Number);
  const newStart = newH * 60 + newM;
  const newEnd = newStart + duration;

  // Check for overlap
  return existingExams.some((exam) => {
    if (!exam.startTime || !exam.endTime) return false;
    const [eH, eM] = exam.startTime.split(':').map(Number);
    const [eEH, eEM] = exam.endTime.split(':').map(Number);
    const existStart = eH * 60 + eM;
    const existEnd = eEH * 60 + eEM;

    return newStart < existEnd && newEnd > existStart;
  });
};

// Update exam status to completed
examSchema.statics.markCompleted = async function (examId) {
  return this.findByIdAndUpdate(examId, { status: 'completed' }, { new: true });
};

// Mark marks entry as started
examSchema.statics.startMarksEntry = async function (examId) {
  return this.findByIdAndUpdate(
    examId,
    {
      marksEntryStarted: true,
      marksEntryStartedAt: new Date(),
      status: 'completed',
    },
    { new: true }
  );
};

// Mark marks entry as completed
examSchema.statics.completeMarksEntry = async function (examId, userId) {
  return this.findByIdAndUpdate(
    examId,
    {
      marksEntryCompleted: true,
      marksEntryCompletedAt: new Date(),
      marksEntryCompletedBy: userId,
    },
    { new: true }
  );
};

// Publish results
examSchema.statics.publishResults = async function (examId) {
  return this.findByIdAndUpdate(
    examId,
    {
      resultsPublished: true,
      resultsPublishedAt: new Date(),
    },
    { new: true }
  );
};

// Update cached stats for exam
examSchema.statics.updateStats = async function (examId) {
  const ExamResult = mongoose.model('ExamResult');

  const stats = await ExamResult.aggregate([
    {
      $match: {
        exam: new mongoose.Types.ObjectId(examId),
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        appeared: {
          $sum: {
            $cond: [{ $eq: ['$isAbsent', false] }, 1, 0],
          },
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$isAbsent', true] }, 1, 0],
          },
        },
        passed: {
          $sum: {
            $cond: [{ $eq: ['$isPassed', true] }, 1, 0],
          },
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$isPassed', false] }, 1, 0],
          },
        },
        highest: { $max: '$examScore' },
        lowest: { $min: '$examScore' },
        average: { $avg: '$examScore' },
      },
    },
  ]);

  if (stats.length === 0) return;

  const s = stats[0];
  const passRate = s.appeared > 0 ? Math.round((s.passed / s.appeared) * 100) : 0;

  return this.findByIdAndUpdate(
    examId,
    {
      'stats.totalStudents': s.total,
      'stats.appeared': s.appeared,
      'stats.absent': s.absent,
      'stats.passed': s.passed,
      'stats.failed': s.failed,
      'stats.highestScore': Math.round(s.highest || 0),
      'stats.lowestScore': Math.round(s.lowest || 0),
      'stats.averageScore': Math.round(s.average || 0),
      'stats.passRate': passRate,
      'stats.lastUpdated': new Date(),
    },
    { new: true }
  );
};

// Get exam schedule for calendar view
examSchema.statics.getCalendarData = async function (academicYearId, termId, filters = {}) {
  const query = {
    academicYear: academicYearId,
    status: { $ne: 'cancelled' },
    ...filters,
  };

  if (termId) query.term = termId;

  const exams = await this.find(query)
    .sort({ date: 1, startTime: 1 })
    .populate('subject', 'name code color')
    .populate('class', 'grade stream')
    .populate('section', 'name fullName')
    .populate('room', 'name roomNumber')
    .populate('examType', 'name');

  // Format for calendar
  return exams.map((exam) => ({
    id: exam._id,
    title: `${exam.subjectName} — ${exam.grade}`,
    start: exam.date,
    startTime: exam.startTime,
    endTime: exam.endTime,
    subject: exam.subject,
    class: exam.class,
    section: exam.section,
    room: exam.room,
    status: exam.status,
    maxMarks: exam.maxMarks,
    color: exam.subject?.color || '#6366f1',
  }));
};

// Get dashboard stats for exams
examSchema.statics.getDashboardStats = async function (academicYearId, termId) {
  const query = {
    academicYear: academicYearId,
  };
  if (termId) query.term = termId;

  const [total, scheduled, completed, cancelled, upcoming, today] = await Promise.all([
    this.countDocuments(query),
    this.countDocuments({
      ...query,
      status: 'scheduled',
    }),
    this.countDocuments({
      ...query,
      status: 'completed',
    }),
    this.countDocuments({
      ...query,
      status: 'cancelled',
    }),
    this.countDocuments({
      ...query,
      date: { $gt: new Date() },
      status: 'scheduled',
    }),
    this.countDocuments({
      ...query,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
  ]);

  return {
    total,
    scheduled,
    completed,
    cancelled,
    upcoming,
    today,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if exam can be edited
examSchema.methods.canEdit = function () {
  return !['completed', 'cancelled'].includes(this.status);
};

// Check if marks entry is allowed
examSchema.methods.canEnterMarks = function () {
  return this.status === 'completed' && !this.marksEntryCompleted;
};

// Check if results can be published
examSchema.methods.canPublishResults = function () {
  return this.marksEntryCompleted && !this.resultsPublished;
};

// Get formatted date string
examSchema.methods.getFormattedDate = function () {
  return new Date(this.date).toLocaleDateString('en-ET', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Get time range string
examSchema.methods.getTimeRange = function () {
  if (!this.startTime) return '';
  return `${this.startTime} – ${this.endTime || this.calculatedEndTime}`;
};

// Get duration display
examSchema.methods.getDurationDisplay = function () {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  if (hours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} mins`;
};

// ─── Create Model ─────────────────────────────
const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
