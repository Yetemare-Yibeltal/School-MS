// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// CLASS MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADE_NAMES, STREAMS } = require('../config/constants');

const classSchema = new mongoose.Schema(
  {
    // ─── Class Identity ───────────────────────
    // e.g. "Grade 9", "Grade 10", "Grade 11"
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      maxlength: [100, 'Class name cannot exceed 100 characters'],
    },

    // Grade level
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      index: true,
    },

    // Stream — only for Grade 11 and 12
    stream: {
      type: String,
      enum: {
        values: [...STREAMS, ''],
        message: '{VALUE} is not a valid stream',
      },
      default: '',
    },

    // ─── Academic Year ────────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
      index: true,
    },

    // Cached academic year name
    academicYearName: {
      type: String,
      trim: true,
    },

    // ─── Sections ─────────────────────────────
    // References to Section documents
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
      },
    ],

    // Number of sections
    numberOfSections: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Subjects ─────────────────────────────
    // Subjects taught in this class
    subjects: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
          default: null,
        },
        weeklyHours: {
          type: Number,
          default: 4,
          min: 1,
          max: 10,
        },
        isElective: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ─── Capacity ─────────────────────────────
    // Maximum students per section
    maxStudentsPerSection: {
      type: Number,
      default: 45,
      min: [1, 'Must have at least 1 student'],
      max: [80, 'Cannot exceed 80 students per section'],
    },

    // Total enrolled students (cached)
    totalEnrolled: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Class Teacher ────────────────────────
    // Class coordinator or head teacher
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    // ─── Timetable ────────────────────────────
    timetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      default: null,
    },

    // ─── Statistics (cached) ──────────────────
    stats: {
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
      topStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        default: null,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
    },

    // ─── Status ───────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// ─── Indexes ──────────────────────────────────
classSchema.index({ grade: 1, academicYear: 1, stream: 1 }, { unique: true });
classSchema.index({ academicYear: 1, isActive: 1 });
classSchema.index({ grade: 1 });
classSchema.index({ isActive: 1 });
classSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Total capacity
classSchema.virtual('totalCapacity').get(function () {
  return this.numberOfSections * this.maxStudentsPerSection;
});

// Available spots
classSchema.virtual('availableSpots').get(function () {
  return Math.max(0, this.totalCapacity - this.totalEnrolled);
});

// Is class full
classSchema.virtual('isFull').get(function () {
  return this.totalEnrolled >= this.totalCapacity;
});

// Occupancy percentage
classSchema.virtual('occupancyRate').get(function () {
  if (!this.totalCapacity) return 0;
  return Math.round((this.totalEnrolled / this.totalCapacity) * 100);
});

// Display name with stream
classSchema.virtual('displayName').get(function () {
  if (this.stream) {
    return `${this.grade} — ${this.stream}`;
  }
  return this.grade;
});

// ─── Pre-Save Hook ────────────────────────────
// Set name from grade and stream
classSchema.pre('save', function (next) {
  if (this.isModified('grade') || this.isModified('stream')) {
    this.name = this.stream ? `${this.grade} — ${this.stream}` : this.grade;
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Find class by grade and academic year
classSchema.statics.findByGrade = function (grade, academicYearId) {
  return this.find({
    grade,
    academicYear: academicYearId,
    isActive: true,
  })
    .populate('sections')
    .populate('coordinator', 'firstName fatherName');
};

// Find all classes for an academic year
classSchema.statics.findForYear = function (academicYearId) {
  return this.find({
    academicYear: academicYearId,
    isActive: true,
  })
    .sort({ grade: 1, stream: 1 })
    .populate('sections')
    .populate('coordinator', 'firstName fatherName photo');
};

// Get all active classes
classSchema.statics.getAllActive = function () {
  return this.find({ isActive: true })
    .sort({ grade: 1, stream: 1 })
    .populate('academicYear', 'name ethiopianYear')
    .populate('sections')
    .populate('coordinator', 'firstName fatherName photo');
};

// Find class by grade stream and year
classSchema.statics.findByGradeStreamYear = function (grade, stream, academicYearId) {
  return this.findOne({
    grade,
    stream: stream || '',
    academicYear: academicYearId,
    isActive: true,
  })
    .populate('sections')
    .populate('subjects.subject', 'name code color')
    .populate('subjects.teacher', 'firstName fatherName');
};

// Add section to class
classSchema.statics.addSection = async function (classId, sectionId) {
  return this.findByIdAndUpdate(
    classId,
    {
      $addToSet: { sections: sectionId },
      $inc: { numberOfSections: 1 },
    },
    { new: true }
  );
};

// Remove section from class
classSchema.statics.removeSection = async function (classId, sectionId) {
  return this.findByIdAndUpdate(
    classId,
    {
      $pull: { sections: sectionId },
      $inc: { numberOfSections: -1 },
    },
    { new: true }
  );
};

// Assign subject to class
classSchema.statics.assignSubject = async function (classId, subjectData) {
  return this.findByIdAndUpdate(
    classId,
    {
      $addToSet: { subjects: subjectData },
    },
    { new: true, runValidators: true }
  );
};

// Remove subject from class
classSchema.statics.removeSubject = async function (classId, subjectId) {
  return this.findByIdAndUpdate(
    classId,
    {
      $pull: { subjects: { subject: subjectId } },
    },
    { new: true }
  );
};

// Assign teacher to a subject in class
classSchema.statics.assignTeacherToSubject = async function (classId, subjectId, teacherId) {
  return this.findOneAndUpdate(
    {
      _id: classId,
      'subjects.subject': subjectId,
    },
    {
      $set: {
        'subjects.$.teacher': teacherId,
      },
    },
    { new: true }
  );
};

// Update total enrolled count
classSchema.statics.updateEnrolledCount = async function (classId) {
  const Student = mongoose.model('Student');
  const count = await Student.countDocuments({
    class: classId,
    status: 'active',
  });

  return this.findByIdAndUpdate(classId, { totalEnrolled: count }, { new: true });
};

// Get class statistics
classSchema.statics.getDashboardStats = async function (academicYearId) {
  const [total, byGrade, totalStudents] = await Promise.all([
    this.countDocuments({
      academicYear: academicYearId,
      isActive: true,
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          enrolled: { $sum: '$totalEnrolled' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalEnrolled' },
        },
      },
    ]),
  ]);

  return {
    total,
    byGrade,
    totalStudents: totalStudents[0]?.total || 0,
  };
};

// Update cached stats for a class
classSchema.statics.updateStats = async function (classId) {
  const ExamResult = mongoose.model('ExamResult');

  const results = await ExamResult.aggregate([
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentData',
      },
    },
    { $unwind: '$studentData' },
    {
      $match: {
        'studentData.class': new mongoose.Types.ObjectId(classId),
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
    classId,
    {
      'stats.averageScore': Math.round(avgScore || 0),
      'stats.passRate': totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0,
      'stats.lastUpdated': new Date(),
    },
    { new: true }
  );
};

// Seed default classes for an academic year
classSchema.statics.seedDefaultClasses = async function (academicYearId, academicYearName) {
  const classesToSeed = [
    {
      grade: 'Grade 9',
      stream: '',
      academicYear: academicYearId,
      academicYearName,
      maxStudentsPerSection: 45,
    },
    {
      grade: 'Grade 10',
      stream: '',
      academicYear: academicYearId,
      academicYearName,
      maxStudentsPerSection: 45,
    },
    {
      grade: 'Grade 11',
      stream: 'Natural Science',
      academicYear: academicYearId,
      academicYearName,
      maxStudentsPerSection: 45,
    },
    {
      grade: 'Grade 11',
      stream: 'Social Science',
      academicYear: academicYearId,
      academicYearName,
      maxStudentsPerSection: 45,
    },
    {
      grade: 'Grade 12',
      stream: 'Natural Science',
      academicYear: academicYearId,
      academicYearName,
      maxStudentsPerSection: 45,
    },
    {
      grade: 'Grade 12',
      stream: 'Social Science',
      academicYear: academicYearId,
      academicYearName,
      maxStudentsPerSection: 45,
    },
  ];

  const created = [];
  for (const cls of classesToSeed) {
    const doc = await this.findOneAndUpdate(
      {
        grade: cls.grade,
        stream: cls.stream,
        academicYear: cls.academicYear,
      },
      {
        $setOnInsert: {
          ...cls,
          name: cls.stream ? `${cls.grade} — ${cls.stream}` : cls.grade,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    created.push(doc);
  }

  console.info(`✅ ${created.length} classes seeded for ${academicYearName}`);
  return created;
};

// ─── Instance Methods ─────────────────────────

// Check if class has a specific subject
classSchema.methods.hasSubject = function (subjectId) {
  return this.subjects.some((s) => s.subject.toString() === subjectId.toString());
};

// Get teacher for a subject
classSchema.methods.getTeacherForSubject = function (subjectId) {
  const subjectEntry = this.subjects.find((s) => s.subject.toString() === subjectId.toString());
  return subjectEntry ? subjectEntry.teacher : null;
};

// Check if class is at capacity
classSchema.methods.isAtCapacity = function () {
  return this.totalEnrolled >= this.totalCapacity;
};

// Get weekly hours for all subjects
classSchema.methods.getTotalWeeklyHours = function () {
  return this.subjects.reduce((total, s) => total + (s.weeklyHours || 0), 0);
};

// ─── Create Model ─────────────────────────────
const Class = mongoose.model('Class', classSchema);

module.exports = Class;
