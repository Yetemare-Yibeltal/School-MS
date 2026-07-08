// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SECTION MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { SECTIONS } = require('../config/constants');

const sectionSchema = new mongoose.Schema(
  {
    // ─── Section Identity ─────────────────────
    // Section letter e.g. "A", "B", "C", "D"
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      enum: {
        values: SECTIONS,
        message: '{VALUE} is not a valid section',
      },
      index: true,
    },

    // Full section display name
    // e.g. "Grade 9A", "Grade 10B"
    fullName: {
      type: String,
      trim: true,
      index: true,
    },

    // ─── Class Reference ──────────────────────
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
      index: true,
    },

    // Cached grade for quick access
    grade: {
      type: String,
      trim: true,
      index: true,
    },

    // Cached stream for quick access
    stream: {
      type: String,
      trim: true,
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

    // ─── Class Teacher ────────────────────────
    // The teacher responsible for this section
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
      index: true,
    },

    // Cached class teacher name
    classTeacherName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Room Assignment ──────────────────────
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },

    // Cached room name
    roomName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Students ─────────────────────────────
    // List of enrolled students
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],

    // Total enrolled count (cached)
    totalEnrolled: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maximum capacity
    capacity: {
      type: Number,
      default: 45,
      min: [1, 'Capacity must be at least 1'],
      max: [80, 'Capacity cannot exceed 80'],
    },

    // ─── Timetable ────────────────────────────
    timetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      default: null,
    },

    // ─── Attendance Summary ───────────────────
    // Cached for quick access on dashboard
    attendanceSummary: {
      totalDays: { type: Number, default: 0 },
      averagePresent: { type: Number, default: 0 },
      averageAbsent: { type: Number, default: 0 },
      averageAttendanceRate: {
        type: Number,
        default: 0,
      },
      lastUpdated: { type: Date, default: null },
    },

    // ─── Academic Performance ─────────────────
    // Cached performance stats
    performanceSummary: {
      averageScore: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      lowestScore: { type: Number, default: 0 },
      passRate: { type: Number, default: 0 },
      topStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        default: null,
      },
      lastUpdated: { type: Date, default: null },
    },

    // ─── Exam Roll Numbers ────────────────────
    // Auto-assigned exam roll numbers for this section
    // e.g. "9A-001", "9A-002"
    examRollPrefix: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Status ───────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Sort Order ───────────────────────────
    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Notes ────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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
sectionSchema.index({ class: 1, name: 1, academicYear: 1 }, { unique: true });
sectionSchema.index({
  grade: 1,
  name: 1,
  academicYear: 1,
});
sectionSchema.index({ classTeacher: 1 });
sectionSchema.index({ academicYear: 1, isActive: 1 });
sectionSchema.index({ grade: 1, isActive: 1 });

// ─── Virtuals ─────────────────────────────────
// Available spots
sectionSchema.virtual('availableSpots').get(function () {
  return Math.max(0, this.capacity - this.totalEnrolled);
});

// Is section full
sectionSchema.virtual('isFull').get(function () {
  return this.totalEnrolled >= this.capacity;
});

// Occupancy rate percentage
sectionSchema.virtual('occupancyRate').get(function () {
  if (!this.capacity) return 0;
  return Math.round((this.totalEnrolled / this.capacity) * 100);
});

// Short label e.g. "9A", "10B"
sectionSchema.virtual('shortLabel').get(function () {
  if (!this.grade) return this.name;
  const gradeNum = this.grade.replace('Grade ', '');
  return `${gradeNum}${this.name}`;
});

// ─── Pre-Save Hook ────────────────────────────
// Auto-set fullName from grade and section name
sectionSchema.pre('save', function (next) {
  if (this.isModified('grade') || this.isModified('name')) {
    const gradeLabel = this.grade ? this.grade.replace('Grade ', '') : '';
    this.fullName = `Grade ${gradeLabel}${this.name}`;

    // Set exam roll prefix e.g. "9A"
    if (!this.examRollPrefix) {
      this.examRollPrefix = `${gradeLabel}${this.name}`;
    }
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Find section by class and name
sectionSchema.statics.findByClassAndName = function (classId, name) {
  return this.findOne({
    class: classId,
    name: name.toUpperCase(),
    isActive: true,
  })
    .populate('classTeacher', 'firstName fatherName photo')
    .populate('room', 'name roomNumber')
    .populate('students', 'firstName fatherName studentId photo');
};

// Find all sections for a class
sectionSchema.statics.findByClass = function (classId) {
  return this.find({
    class: classId,
    isActive: true,
  })
    .sort({ name: 1 })
    .populate('classTeacher', 'firstName fatherName photo')
    .populate('room', 'name roomNumber');
};

// Find all sections for an academic year
sectionSchema.statics.findForYear = function (academicYearId) {
  return this.find({
    academicYear: academicYearId,
    isActive: true,
  })
    .sort({ grade: 1, name: 1 })
    .populate('class', 'grade stream')
    .populate('classTeacher', 'firstName fatherName photo')
    .populate('room', 'name roomNumber');
};

// Find sections by grade and year
sectionSchema.statics.findByGradeAndYear = function (grade, academicYearId) {
  return this.find({
    grade,
    academicYear: academicYearId,
    isActive: true,
  })
    .sort({ name: 1 })
    .populate('classTeacher', 'firstName fatherName photo')
    .populate('room', 'name roomNumber');
};

// Find section where a specific teacher is class teacher
sectionSchema.statics.findByClassTeacher = function (teacherId) {
  return this.findOne({
    classTeacher: teacherId,
    isActive: true,
  })
    .populate('class', 'grade stream')
    .populate('academicYear', 'name ethiopianYear');
};

// Add student to section
sectionSchema.statics.addStudent = async function (sectionId, studentId) {
  return this.findByIdAndUpdate(
    sectionId,
    {
      $addToSet: { students: studentId },
      $inc: { totalEnrolled: 1 },
    },
    { new: true }
  );
};

// Remove student from section
sectionSchema.statics.removeStudent = async function (sectionId, studentId) {
  return this.findByIdAndUpdate(
    sectionId,
    {
      $pull: { students: studentId },
      $inc: { totalEnrolled: -1 },
    },
    { new: true }
  );
};

// Assign class teacher to section
sectionSchema.statics.assignClassTeacher = async function (sectionId, teacherId, teacherName) {
  return this.findByIdAndUpdate(
    sectionId,
    {
      classTeacher: teacherId,
      classTeacherName: teacherName,
    },
    { new: true }
  );
};

// Assign room to section
sectionSchema.statics.assignRoom = async function (sectionId, roomId, roomName) {
  return this.findByIdAndUpdate(sectionId, { room: roomId, roomName }, { new: true });
};

// Update enrolled count from database
sectionSchema.statics.syncEnrolledCount = async function (sectionId) {
  const Student = mongoose.model('Student');
  const count = await Student.countDocuments({
    classSection: sectionId,
    status: 'active',
  });

  return this.findByIdAndUpdate(sectionId, { totalEnrolled: count }, { new: true });
};

// Update attendance summary
sectionSchema.statics.updateAttendanceSummary = async function (sectionId) {
  const Attendance = mongoose.model('Attendance');

  const stats = await Attendance.aggregate([
    {
      $match: {
        section: new mongoose.Types.ObjectId(sectionId),
      },
    },
    {
      $group: {
        _id: '$date',
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
        total: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        avgPresent: { $avg: '$present' },
        avgAbsent: { $avg: '$absent' },
        avgTotal: { $avg: '$total' },
      },
    },
  ]);

  if (stats.length === 0) return;

  const { totalDays, avgPresent, avgAbsent, avgTotal } = stats[0];

  const avgRate = avgTotal > 0 ? Math.round((avgPresent / avgTotal) * 100) : 0;

  return this.findByIdAndUpdate(
    sectionId,
    {
      attendanceSummary: {
        totalDays,
        averagePresent: Math.round(avgPresent),
        averageAbsent: Math.round(avgAbsent),
        averageAttendanceRate: avgRate,
        lastUpdated: new Date(),
      },
    },
    { new: true }
  );
};

// Update performance summary
sectionSchema.statics.updatePerformanceSummary = async function (sectionId) {
  const ExamResult = mongoose.model('ExamResult');

  const stats = await ExamResult.aggregate([
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
        'studentData.classSection': new mongoose.Types.ObjectId(sectionId),
      },
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$totalScore' },
        maxScore: { $max: '$totalScore' },
        minScore: { $min: '$totalScore' },
        passCount: {
          $sum: {
            $cond: [{ $gte: ['$totalScore', 50] }, 1, 0],
          },
        },
        total: { $sum: 1 },
      },
    },
  ]);

  if (stats.length === 0) return;

  const { avgScore, maxScore, minScore, passCount, total } = stats[0];

  return this.findByIdAndUpdate(
    sectionId,
    {
      performanceSummary: {
        averageScore: Math.round(avgScore || 0),
        highestScore: Math.round(maxScore || 0),
        lowestScore: Math.round(minScore || 0),
        passRate: total > 0 ? Math.round((passCount / total) * 100) : 0,
        lastUpdated: new Date(),
      },
    },
    { new: true }
  );
};

// Seed sections for a class
sectionSchema.statics.seedSectionsForClass = async function (
  classId,
  grade,
  stream,
  academicYearId,
  academicYearName,
  sectionLetters = ['A', 'B', 'C', 'D']
) {
  const created = [];

  for (let i = 0; i < sectionLetters.length; i++) {
    const letter = sectionLetters[i];
    const gradeNum = grade.replace('Grade ', '');
    const fullName = `Grade ${gradeNum}${letter}`;

    const section = await this.findOneAndUpdate(
      {
        class: classId,
        name: letter,
        academicYear: academicYearId,
      },
      {
        $setOnInsert: {
          name: letter,
          fullName,
          class: classId,
          grade,
          stream: stream || '',
          academicYear: academicYearId,
          academicYearName,
          capacity: 45,
          isActive: true,
          sortOrder: i + 1,
          examRollPrefix: `${gradeNum}${letter}`,
        },
      },
      { upsert: true, new: true }
    );

    created.push(section);
  }

  console.info(`✅ ${created.length} sections seeded for ${grade}`);
  return created;
};

// Get all sections with student counts
sectionSchema.statics.getWithCounts = async function (academicYearId) {
  return this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'students',
        let: { sectionId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$classSection', '$$sectionId'],
                  },
                  { $eq: ['$status', 'active'] },
                ],
              },
            },
          },
          { $count: 'count' },
        ],
        as: 'studentCount',
      },
    },
    {
      $addFields: {
        actualCount: {
          $ifNull: [
            {
              $arrayElemAt: ['$studentCount.count', 0],
            },
            0,
          ],
        },
      },
    },
    {
      $sort: { grade: 1, name: 1 },
    },
  ]);
};

// Get stats for dashboard
sectionSchema.statics.getDashboardStats = async function (academicYearId) {
  const [total, byGrade, totalCapacity] = await Promise.all([
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
          totalCapacity: {
            $sum: '$capacity',
          },
          totalEnrolled: {
            $sum: '$totalEnrolled',
          },
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
          totalCap: { $sum: '$capacity' },
          totalEnr: {
            $sum: '$totalEnrolled',
          },
        },
      },
    ]),
  ]);

  return {
    total,
    byGrade,
    totalCapacity: totalCapacity[0]?.totalCap || 0,
    totalEnrolled: totalCapacity[0]?.totalEnr || 0,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if section has capacity for more students
sectionSchema.methods.hasCapacity = function () {
  return this.totalEnrolled < this.capacity;
};

// Check if a student is enrolled in this section
sectionSchema.methods.hasStudent = function (studentId) {
  return this.students.some((s) => s.toString() === studentId.toString());
};

// Get section display string
sectionSchema.methods.getDisplay = function () {
  return this.fullName || `${this.grade}${this.name}`;
};

// Get exam roll number for a student position
sectionSchema.methods.getExamRollNumber = function (position) {
  return `${this.examRollPrefix}-${position.toString().padStart(3, '0')}`;
};

// ─── Create Model ─────────────────────────────
const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;
