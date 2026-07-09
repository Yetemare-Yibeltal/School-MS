// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXAM RESULT MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADING_SCALE, GRADE_NAMES } = require('../config/constants');

const examResultSchema = new mongoose.Schema(
  {
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

    // ─── Exam Reference ───────────────────────
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam is required'],
      index: true,
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

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
      index: true,
    },

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      required: [true, 'Term is required'],
      index: true,
    },

    // ─── Class & Section ──────────────────────
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

    // ─── Scores ───────────────────────────────
    // Continuous Assessment score
    caScore: {
      type: Number,
      default: 0,
      min: [0, 'CA score cannot be negative'],
    },

    // Maximum possible CA score
    maxCAScore: {
      type: Number,
      default: 50,
    },

    // Final exam score
    examScore: {
      type: Number,
      default: 0,
      min: [0, 'Exam score cannot be negative'],
    },

    // Maximum possible exam score
    maxExamScore: {
      type: Number,
      default: 50,
    },

    // Total score (CA + Exam)
    totalScore: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    // Maximum total score
    maxTotalScore: {
      type: Number,
      default: 100,
    },

    // Score as percentage
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ─── CA Breakdown ─────────────────────────
    // Detailed CA component scores
    caBreakdown: [
      {
        componentName: {
          type: String,
          trim: true,
          // e.g. "Test 1", "Assignment", "Quiz"
        },
        score: {
          type: Number,
          default: 0,
          min: 0,
        },
        maxScore: {
          type: Number,
          default: 20,
        },
        weight: {
          type: Number,
          default: 0,
        },
        date: {
          type: Date,
          default: null,
        },
      },
    ],

    // ─── Grade ────────────────────────────────
    // Letter grade based on Ethiopian MoE scale
    letterGrade: {
      type: String,
      enum: {
        values: ['A', 'B', 'C', 'D', 'F', ''],
        message: '{VALUE} is not a valid grade',
      },
      default: '',
      index: true,
    },

    // GPA points (4.0, 3.0, 2.0, 1.0, 0.0)
    gpaPoints: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },

    // Grade remark
    gradeRemark: {
      type: String,
      trim: true,
      default: '',
      // e.g. "Excellent", "Very Good", "Fail"
    },

    // ─── Rank ─────────────────────────────────
    // Rank in section
    rankInSection: {
      type: Number,
      default: null,
      min: 1,
    },

    // Rank in class (all sections)
    rankInClass: {
      type: Number,
      default: null,
      min: 1,
    },

    // ─── Attendance ───────────────────────────
    // Whether student was absent for the exam
    isAbsent: {
      type: Boolean,
      default: false,
      index: true,
    },

    absenceReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Status ───────────────────────────────
    isPassed: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Whether result is finalized (locked)
    isFinalized: {
      type: Boolean,
      default: false,
      index: true,
    },

    finalizedAt: {
      type: Date,
      default: null,
    },

    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Marks Entry ──────────────────────────
    // Teacher who entered the marks
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    enteredAt: {
      type: Date,
      default: null,
    },

    // Last edited by
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    lastEditedAt: {
      type: Date,
      default: null,
    },

    // Edit history for audit trail
    editHistory: [
      {
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        editedAt: { type: Date },
        previousCAScore: { type: Number },
        previousExamScore: { type: Number },
        previousTotalScore: { type: Number },
        reason: { type: String, trim: true },
      },
    ],

    // ─── Teacher Remarks ──────────────────────
    teacherRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
      default: null,
    },

    // AI-generated teacher comment for report card
    aiComment: {
      type: String,
      trim: true,
      maxlength: [1000, 'AI comment cannot exceed 1000 characters'],
      default: null,
    },

    // ─── Supplementary Exam ───────────────────
    // Whether student needs supplementary exam
    needsSupplementary: {
      type: Boolean,
      default: false,
    },

    supplementaryScore: {
      type: Number,
      default: null,
      min: 0,
    },

    supplementaryDate: {
      type: Date,
      default: null,
    },

    supplementaryPassed: {
      type: Boolean,
      default: null,
    },

    // ─── Notes ────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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

// ─── Compound Indexes ─────────────────────────
// Prevent duplicate results for same student/exam/subject
examResultSchema.index(
  {
    student: 1,
    exam: 1,
    subject: 1,
  },
  { unique: true }
);

examResultSchema.index({
  student: 1,
  academicYear: 1,
  term: 1,
});

examResultSchema.index({
  exam: 1,
  section: 1,
  subject: 1,
});

examResultSchema.index({
  class: 1,
  term: 1,
  subject: 1,
});

examResultSchema.index({
  grade: 1,
  academicYear: 1,
  term: 1,
});

examResultSchema.index({
  academicYear: 1,
  term: 1,
  isPassed: 1,
});

examResultSchema.index({ totalScore: -1 });
examResultSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Percentage calculated
examResultSchema.virtual('calculatedPercentage').get(function () {
  if (!this.maxTotalScore) return 0;
  return Math.round((this.totalScore / this.maxTotalScore) * 100);
});

// Display grade with GPA
examResultSchema.virtual('gradeDisplay').get(function () {
  return this.letterGrade ? `${this.letterGrade} (${this.gpaPoints.toFixed(1)})` : 'N/A';
});

// CA percentage
examResultSchema.virtual('caPercentage').get(function () {
  if (!this.maxCAScore) return 0;
  return Math.round((this.caScore / this.maxCAScore) * 100);
});

// Exam percentage
examResultSchema.virtual('examPercentage').get(function () {
  if (!this.maxExamScore) return 0;
  return Math.round((this.examScore / this.maxExamScore) * 100);
});

// ─── Pre-Save Hook ────────────────────────────
// Auto-calculate totals and grades before saving
examResultSchema.pre('save', function (next) {
  if (
    this.isModified('caScore') ||
    this.isModified('examScore') ||
    this.isModified('maxCAScore') ||
    this.isModified('maxExamScore')
  ) {
    // Calculate total score
    this.totalScore = (this.caScore || 0) + (this.examScore || 0);
    this.maxTotalScore = (this.maxCAScore || 50) + (this.maxExamScore || 50);

    // Calculate percentage
    if (this.maxTotalScore > 0) {
      this.percentage = Math.round((this.totalScore / this.maxTotalScore) * 100);
    }

    // Calculate letter grade based on Ethiopian MoE scale
    if (!this.isAbsent) {
      const gradeInfo = calculateGrade(this.percentage);
      this.letterGrade = gradeInfo.grade;
      this.gpaPoints = gradeInfo.gpa;
      this.gradeRemark = gradeInfo.remark;
      this.isPassed = gradeInfo.grade !== 'F';
    } else {
      this.letterGrade = 'F';
      this.gpaPoints = 0.0;
      this.gradeRemark = 'Absent';
      this.isPassed = false;
    }
  }

  // Update entered/edited timestamps
  if (this.isNew && (this.caScore > 0 || this.examScore > 0)) {
    this.enteredAt = new Date();
  } else if (!this.isNew && (this.isModified('caScore') || this.isModified('examScore'))) {
    this.lastEditedAt = new Date();
  }

  next();
});

// ─── Helper Function ──────────────────────────
// Calculate letter grade from percentage
const calculateGrade = (percentage) => {
  for (const scale of GRADING_SCALE) {
    if (percentage >= scale.minScore && percentage <= scale.maxScore) {
      return {
        grade: scale.grade,
        gpa: scale.gpa,
        remark: scale.remark,
      };
    }
  }
  return { grade: 'F', gpa: 0.0, remark: 'Fail' };
};

// ─── Static Methods ───────────────────────────

// Get results for a student in a term
examResultSchema.statics.getStudentTermResults = function (studentId, termId) {
  return this.find({
    student: studentId,
    term: termId,
  })
    .sort({ subjectName: 1 })
    .populate('subject', 'name code color')
    .populate('exam', 'title examTypeName date')
    .populate('enteredBy', 'firstName fatherName');
};

// Get results for a student in academic year
examResultSchema.statics.getStudentYearResults = function (studentId, academicYearId) {
  return this.find({
    student: studentId,
    academicYear: academicYearId,
  })
    .sort({ termName: 1, subjectName: 1 })
    .populate('subject', 'name code color')
    .populate('term', 'name termNumber')
    .populate('exam', 'title examTypeName');
};

// Get all results for an exam
examResultSchema.statics.getExamResults = function (examId) {
  return this.find({ exam: examId })
    .sort({ totalScore: -1 })
    .populate('student', 'firstName fatherName studentId photo')
    .populate('subject', 'name code');
};

// Get section grade sheet
// All students results for all subjects in a term
examResultSchema.statics.getSectionGradeSheet = async function (sectionId, termId) {
  const results = await this.find({
    section: sectionId,
    term: termId,
  })
    .sort({
      studentName: 1,
      subjectName: 1,
    })
    .populate('student', 'firstName fatherName studentId')
    .populate('subject', 'name code color');

  // Group by student
  const grouped = {};
  results.forEach((result) => {
    const studentKey = result.student._id.toString();
    if (!grouped[studentKey]) {
      grouped[studentKey] = {
        student: result.student,
        subjects: {},
        totalScore: 0,
        subjectCount: 0,
        averageScore: 0,
        gpa: 0,
      };
    }

    grouped[studentKey].subjects[result.subjectCode] = {
      caScore: result.caScore,
      examScore: result.examScore,
      totalScore: result.totalScore,
      percentage: result.percentage,
      letterGrade: result.letterGrade,
      gpaPoints: result.gpaPoints,
      isPassed: result.isPassed,
      isAbsent: result.isAbsent,
      subject: result.subject,
    };

    if (!result.isAbsent) {
      grouped[studentKey].totalScore += result.totalScore;
      grouped[studentKey].subjectCount++;
    }
  });

  // Calculate averages and GPA
  Object.values(grouped).forEach((student) => {
    if (student.subjectCount > 0) {
      student.averageScore = Math.round(student.totalScore / student.subjectCount);
      const subjectResults = Object.values(student.subjects);
      const totalGPA = subjectResults.reduce((sum, s) => sum + (s.gpaPoints || 0), 0);
      student.gpa = (totalGPA / subjectResults.length).toFixed(2);
    }
  });

  return Object.values(grouped);
};

// Calculate ranks for a section
examResultSchema.statics.calculateSectionRanks = async function (sectionId, termId) {
  // Get all students average scores
  const studentAverages = await this.aggregate([
    {
      $match: {
        section: new mongoose.Types.ObjectId(sectionId),
        term: new mongoose.Types.ObjectId(termId),
        isAbsent: false,
      },
    },
    {
      $group: {
        _id: '$student',
        averageScore: { $avg: '$totalScore' },
        totalScore: { $sum: '$totalScore' },
        subjectCount: { $sum: 1 },
      },
    },
    {
      $sort: { averageScore: -1 },
    },
  ]);

  // Assign ranks
  let rank = 1;
  for (const student of studentAverages) {
    await this.updateMany(
      {
        student: student._id,
        section: sectionId,
        term: termId,
      },
      { rankInSection: rank }
    );
    rank++;
  }

  return studentAverages;
};

// Calculate class-wide ranks
examResultSchema.statics.calculateClassRanks = async function (classId, termId) {
  const studentAverages = await this.aggregate([
    {
      $match: {
        class: new mongoose.Types.ObjectId(classId),
        term: new mongoose.Types.ObjectId(termId),
        isAbsent: false,
      },
    },
    {
      $group: {
        _id: '$student',
        averageScore: { $avg: '$totalScore' },
      },
    },
    { $sort: { averageScore: -1 } },
  ]);

  let rank = 1;
  for (const student of studentAverages) {
    await this.updateMany(
      {
        student: student._id,
        class: classId,
        term: termId,
      },
      { rankInClass: rank }
    );
    rank++;
  }

  return studentAverages;
};

// Get top students for a term
examResultSchema.statics.getTopStudents = async function (termId, academicYearId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        term: new mongoose.Types.ObjectId(termId),
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        isAbsent: false,
      },
    },
    {
      $group: {
        _id: '$student',
        studentName: { $first: '$studentName' },
        studentId: { $first: '$studentId' },
        grade: { $first: '$grade' },
        sectionName: { $first: '$sectionName' },
        averageScore: { $avg: '$totalScore' },
        totalSubjects: { $sum: 1 },
        passedSubjects: {
          $sum: {
            $cond: [{ $eq: ['$isPassed', true] }, 1, 0],
          },
        },
      },
    },
    { $sort: { averageScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'studentData',
      },
    },
    {
      $addFields: {
        photo: {
          $arrayElemAt: ['$studentData.photo', 0],
        },
      },
    },
  ]);
};

// Get subject performance analysis
examResultSchema.statics.getSubjectAnalysis = async function (subjectId, termId, academicYearId) {
  return this.aggregate([
    {
      $match: {
        subject: new mongoose.Types.ObjectId(subjectId),
        term: new mongoose.Types.ObjectId(termId),
        academicYear: new mongoose.Types.ObjectId(academicYearId),
      },
    },
    {
      $group: {
        _id: '$letterGrade',
        count: { $sum: 1 },
        avgScore: { $avg: '$totalScore' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Get student's GPA for a term
examResultSchema.statics.calculateStudentGPA = async function (studentId, termId) {
  const results = await this.find({
    student: studentId,
    term: termId,
    isAbsent: false,
  }).select('gpaPoints subjectName');

  if (results.length === 0) return { gpa: 0, results: [] };

  const totalGPA = results.reduce((sum, r) => sum + (r.gpaPoints || 0), 0);
  const gpa = totalGPA / results.length;

  return {
    gpa: parseFloat(gpa.toFixed(2)),
    results,
  };
};

// Bulk create results for an exam
examResultSchema.statics.bulkCreateForExam = async function (examId, studentsData) {
  const results = {
    created: 0,
    updated: 0,
    errors: [],
  };

  for (const data of studentsData) {
    try {
      await this.findOneAndUpdate(
        {
          student: data.student,
          exam: examId,
          subject: data.subject,
        },
        data,
        { upsert: true, new: true }
      );
      results.created++;
    } catch (error) {
      results.errors.push({
        student: data.student,
        error: error.message,
      });
    }
  }

  return results;
};

// Get grade distribution for dashboard
examResultSchema.statics.getGradeDistribution = async function (
  academicYearId,
  termId,
  gradeLevel = null
) {
  const match = {
    academicYear: new mongoose.Types.ObjectId(academicYearId),
  };

  if (termId) {
    match.term = new mongoose.Types.ObjectId(termId);
  }
  if (gradeLevel) {
    match.grade = gradeLevel;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$letterGrade',
        count: { $sum: 1 },
        avgScore: { $avg: '$totalScore' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Get pass rate by subject
examResultSchema.statics.getPassRateBySubject = async function (academicYearId, termId) {
  return this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        term: new mongoose.Types.ObjectId(termId),
      },
    },
    {
      $group: {
        _id: '$subject',
        subjectName: { $first: '$subjectName' },
        subjectCode: { $first: '$subjectCode' },
        total: { $sum: 1 },
        passed: {
          $sum: {
            $cond: [{ $eq: ['$isPassed', true] }, 1, 0],
          },
        },
        avgScore: { $avg: '$totalScore' },
      },
    },
    {
      $addFields: {
        passRate: {
          $multiply: [
            {
              $divide: ['$passed', '$total'],
            },
            100,
          ],
        },
      },
    },
    { $sort: { passRate: -1 } },
  ]);
};

// ─── Instance Methods ─────────────────────────

// Get score summary
examResultSchema.methods.getSummary = function () {
  return {
    student: this.studentName,
    subject: this.subjectName,
    caScore: `${this.caScore}/${this.maxCAScore}`,
    examScore: `${this.examScore}/${this.maxExamScore}`,
    total: `${this.totalScore}/${this.maxTotalScore}`,
    percentage: `${this.percentage}%`,
    grade: this.letterGrade,
    gpa: this.gpaPoints,
    remark: this.gradeRemark,
    passed: this.isPassed,
    rank: this.rankInSection,
  };
};

// Add edit history entry
examResultSchema.methods.addEditHistory = async function (
  userId,
  previousCA,
  previousExam,
  reason
) {
  this.editHistory.push({
    editedBy: userId,
    editedAt: new Date(),
    previousCAScore: previousCA,
    previousExamScore: previousExam,
    previousTotalScore: previousCA + previousExam,
    reason,
  });
  this.lastEditedBy = userId;
  this.lastEditedAt = new Date();
  await this.save();
  return this;
};

// Check if marks can be edited
examResultSchema.methods.canEdit = function () {
  return !this.isFinalized;
};

// Finalize result (lock from editing)
examResultSchema.methods.finalize = async function (userId) {
  this.isFinalized = true;
  this.finalizedAt = new Date();
  this.finalizedBy = userId;
  await this.save();
  return this;
};

// ─── Create Model ─────────────────────────────
const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = ExamResult;
