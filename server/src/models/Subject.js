// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SUBJECT MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  GRADE_NAMES,
  STREAMS,
  SUBJECTS,
} = require('../config/constants');

const subjectSchema = new mongoose.Schema(
  {
    // ─── Subject Identity ─────────────────────
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      unique: true,
      trim: true,
      maxlength: [
        100,
        'Subject name cannot exceed 100 characters',
      ],
      index: true,
    },

    // Short code e.g. MATH, ENG, PHY
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [
        10,
        'Code cannot exceed 10 characters',
      ],
      match: [
        /^[A-Z0-9_]+$/,
        'Code must be uppercase letters and numbers only',
      ],
      index: true,
    },

    // Full subject description
    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'Description cannot exceed 500 characters',
      ],
    },

    // ─── Academic Scope ───────────────────────
    // Which grade levels this subject is taught in
    grades: {
      type: [String],
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      required: [
        true,
        'At least one grade level is required',
      ],
      validate: {
        validator: function (grades) {
          return grades.length > 0;
        },
        message:
          'Subject must be assigned to at least one grade',
      },
    },

    // Stream restriction (null = all streams)
    stream: {
      type: String,
      enum: {
        values: [...STREAMS, ''],
        message: '{VALUE} is not a valid stream',
      },
      default: '',
    },

    // ─── Academic Settings ────────────────────
    // Weekly teaching hours
    weeklyHours: {
      type: Number,
      required: [true, 'Weekly hours is required'],
      min: [1, 'Weekly hours must be at least 1'],
      max: [10, 'Weekly hours cannot exceed 10'],
      default: 4,
    },

    // Periods per week (may differ from hours)
    periodsPerWeek: {
      type: Number,
      default: 4,
      min: 1,
      max: 14,
    },

    // Whether this subject requires a lab
    requiresLab: {
      type: Boolean,
      default: false,
    },

    // Whether this subject is included in GPA
    includeInGPA: {
      type: Boolean,
      default: true,
    },

    // Whether this is a core/mandatory subject
    isMandatory: {
      type: Boolean,
      default: true,
    },

    // Whether this is an elective subject
    isElective: {
      type: Boolean,
      default: false,
    },

    // Credit hours (for GPA calculation)
    creditHours: {
      type: Number,
      default: 1,
      min: 0,
      max: 5,
    },

    // ─── Assessment Config ────────────────────
    assessmentConfig: {
      // Continuous Assessment weight (%)
      caWeight: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },

      // Final Exam weight (%)
      examWeight: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },

      // Number of CA components
      caComponents: [
        {
          name: {
            type: String,
            trim: true,
            // e.g. "Test 1", "Assignment", "Quiz"
          },
          maxScore: {
            type: Number,
            default: 20,
          },
          weight: {
            type: Number,
            default: 25,
          },
        },
      ],

      // Maximum CA score
      maxCAScore: {
        type: Number,
        default: 50,
      },

      // Maximum exam score
      maxExamScore: {
        type: Number,
        default: 50,
      },

      // Passing score
      passingScore: {
        type: Number,
        default: 50,
      },
    },

    // ─── Teacher Assignments ──────────────────
    // Default teacher for this subject
    // (actual assignment is done per class/section)
    defaultTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    // All teachers qualified to teach this subject
    qualifiedTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
      },
    ],

    // ─── UI Display ───────────────────────────
    // Color for UI display
    color: {
      type: String,
      default: '#6366f1',
      match: [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        'Invalid color hex code',
      ],
    },

    // Background color
    bgColor: {
      type: String,
      default: '#eef2ff',
    },

    // Icon name
    icon: {
      type: String,
      default: 'book',
      trim: true,
    },

    // Sort order for display
    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Room Preference ──────────────────────
    // Preferred room type for this subject
    preferredRoomType: {
      type: String,
      enum: [
        'Classroom',
        'Laboratory',
        'Computer Lab',
        'Library',
        'Sports Field',
        'Any',
        '',
      ],
      default: 'Classroom',
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
      totalStudentsTaught: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
    },

    // ─── Academic Year ────────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
    },

    // ─── Status ───────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // System subjects cannot be deleted
    isSystem: {
      type: Boolean,
      default: false,
    },

    // ─── Notes ────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        'Notes cannot exceed 1000 characters',
      ],
    },

    // ─── Curriculum Reference ─────────────────
    // Ethiopian MoE curriculum reference
    curriculumReference: {
      type: String,
      trim: true,
      default: null,
    },

    // Textbook reference
    textbook: {
      title: { type: String, trim: true },
      author: { type: String, trim: true },
      edition: { type: String, trim: true },
      publisher: { type: String, trim: true },
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
subjectSchema.index({ name: 1 }, { unique: true });
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ isActive: 1 });
subjectSchema.index({ grades: 1 });
subjectSchema.index({ stream: 1 });
subjectSchema.index({ requiresLab: 1 });
subjectSchema.index({ sortOrder: 1 });
subjectSchema.index({
  name: 'text',
  code: 'text',
  description: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Is stream-specific
subjectSchema.virtual('isStreamSpecific').get(
  function () {
    return !!this.stream;
  }
);

// Total score possible
subjectSchema.virtual('totalPossibleScore').get(
  function () {
    return (
      this.assessmentConfig.maxCAScore +
      this.assessmentConfig.maxExamScore
    );
  }
);

// Display label with code
subjectSchema.virtual('displayLabel').get(
  function () {
    return `${this.name} (${this.code})`;
  }
);

// Grade range display
subjectSchema.virtual('gradeRange').get(function () {
  if (!this.grades || this.grades.length === 0)
    return 'N/A';
  if (this.grades.length === 1) return this.grades[0];
  const nums = this.grades.map((g) =>
    parseInt(g.replace('Grade ', ''))
  );
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max
    ? `Grade ${min}`
    : `Grade ${min} - ${max}`;
});

// ─── Pre-Save Hook ────────────────────────────
subjectSchema.pre('save', function (next) {
  // Ensure code is uppercase
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }

  // Validate CA + Exam weights sum to 100
  if (
    this.isModified('assessmentConfig.caWeight') ||
    this.isModified('assessmentConfig.examWeight')
  ) {
    const total =
      this.assessmentConfig.caWeight +
      this.assessmentConfig.examWeight;
    if (total !== 100) {
      return next(
        new Error(
          'CA weight and Exam weight must sum to 100%'
        )
      );
    }
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Seed default subjects from constants
subjectSchema.statics.seedDefaultSubjects =
  async function () {
    const subjectsToSeed = SUBJECTS.map(
      (subject, index) => ({
        name: subject.name,
        code: subject.code,
        grades: subject.grades,
        stream: subject.stream || '',
        weeklyHours: subject.weeklyHours,
        periodsPerWeek: subject.weeklyHours,
        requiresLab: subject.requiresLab || false,
        color: subject.color,
        bgColor: `${subject.color}20`,
        icon: subject.icon,
        sortOrder: index + 1,
        isActive: true,
        isSystem: true,
        includeInGPA: subject.name !== 'Physical Education',
        isMandatory: true,
        preferredRoomType: subject.requiresLab
          ? 'Laboratory'
          : subject.code === 'ICT'
          ? 'Computer Lab'
          : subject.code === 'PE'
          ? 'Sports Field'
          : 'Classroom',
        assessmentConfig: {
          caWeight: 50,
          examWeight: 50,
          maxCAScore: 50,
          maxExamScore: 50,
          passingScore: 50,
          caComponents: [
            {
              name: 'Test 1',
              maxScore: 20,
              weight: 40,
            },
            {
              name: 'Assignment',
              maxScore: 15,
              weight: 30,
            },
            {
              name: 'Quiz',
              maxScore: 15,
              weight: 30,
            },
          ],
        },
      })
    );

    for (const subject of subjectsToSeed) {
      await this.findOneAndUpdate(
        { code: subject.code },
        { $setOnInsert: subject },
        { upsert: true, new: true }
      );
    }

    console.info(
      `✅ ${subjectsToSeed.length} subjects seeded`
    );
  };

// Find subject by code
subjectSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Find subjects for a grade level
subjectSchema.statics.findForGrade = function (
  grade,
  stream = ''
) {
  const query = {
    grades: grade,
    isActive: true,
  };

  // Add stream filter
  if (stream) {
    query.$or = [
      { stream: stream },
      { stream: '' },
    ];
  }

  return this.find(query)
    .sort({ sortOrder: 1, name: 1 })
    .populate(
      'defaultTeacher',
      'firstName fatherName'
    );
};

// Find subjects requiring lab
subjectSchema.statics.findLabSubjects = function () {
  return this.find({
    requiresLab: true,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Get all active subjects
subjectSchema.statics.getAllActive = function () {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .populate(
      'defaultTeacher',
      'firstName fatherName'
    );
};

// Search subjects
subjectSchema.statics.search = function (searchTerm) {
  return this.find({
    $or: [
      {
        name: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        code: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
    ],
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Assign default teacher to subject
subjectSchema.statics.assignTeacher =
  async function (subjectId, teacherId) {
    return this.findByIdAndUpdate(
      subjectId,
      {
        defaultTeacher: teacherId,
        $addToSet: {
          qualifiedTeachers: teacherId,
        },
      },
      { new: true }
    );
  };

// Add qualified teacher
subjectSchema.statics.addQualifiedTeacher =
  async function (subjectId, teacherId) {
    return this.findByIdAndUpdate(
      subjectId,
      {
        $addToSet: {
          qualifiedTeachers: teacherId,
        },
      },
      { new: true }
    );
  };

// Remove qualified teacher
subjectSchema.statics.removeQualifiedTeacher =
  async function (subjectId, teacherId) {
    return this.findByIdAndUpdate(
      subjectId,
      {
        $pull: { qualifiedTeachers: teacherId },
      },
      { new: true }
    );
  };

// Update stats for a subject
subjectSchema.statics.updateStats =
  async function (subjectId) {
    const ExamResult = mongoose.model('ExamResult');

    const stats = await ExamResult.aggregate([
      {
        $match: {
          subject:
            new mongoose.Types.ObjectId(subjectId),
        },
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$totalScore' },
          passCount: {
            $sum: {
              $cond: [
                { $gte: ['$totalScore', 50] },
                1,
                0,
              ],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) return;

    const { avgScore, passCount, totalCount } =
      stats[0];

    return this.findByIdAndUpdate(
      subjectId,
      {
        'stats.averageScore': Math.round(
          avgScore || 0
        ),
        'stats.passRate':
          totalCount > 0
            ? Math.round(
                (passCount / totalCount) * 100
              )
            : 0,
        'stats.totalStudentsTaught': totalCount,
        'stats.lastUpdated': new Date(),
      },
      { new: true }
    );
  };

// Get subject performance comparison
subjectSchema.statics.getPerformanceComparison =
  async function (academicYearId, termId) {
    const ExamResult = mongoose.model('ExamResult');

    return ExamResult.aggregate([
      {
        $match: {
          ...(academicYearId && {
            academicYear:
              new mongoose.Types.ObjectId(
                academicYearId
              ),
          }),
          ...(termId && {
            term: new mongoose.Types.ObjectId(termId),
          }),
        },
      },
      {
        $group: {
          _id: '$subject',
          avgScore: { $avg: '$totalScore' },
          passCount: {
            $sum: {
              $cond: [
                { $gte: ['$totalScore', 50] },
                1,
                0,
              ],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectData',
        },
      },
      { $unwind: '$subjectData' },
      {
        $project: {
          subjectName: '$subjectData.name',
          subjectCode: '$subjectData.code',
          color: '$subjectData.color',
          avgScore: { $round: ['$avgScore', 1] },
          passRate: {
            $multiply: [
              { $divide: ['$passCount', '$totalCount'] },
              100,
            ],
          },
          totalStudents: '$totalCount',
        },
      },
      { $sort: { avgScore: -1 } },
    ]);
  };

// Get subjects with teacher assignments
subjectSchema.statics.getWithTeachers =
  async function () {
    return this.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .populate(
        'defaultTeacher',
        'firstName fatherName teacherId primarySubject'
      )
      .populate(
        'qualifiedTeachers',
        'firstName fatherName teacherId'
      );
  };

// ─── Instance Methods ─────────────────────────

// Check if subject is taught in a grade
subjectSchema.methods.isTaughtInGrade = function (
  grade
) {
  return this.grades.includes(grade);
};

// Check if subject is stream specific
subjectSchema.methods.isForStream = function (stream) {
  if (!this.stream) return true;
  return this.stream === stream;
};

// Get maximum possible score
subjectSchema.methods.getMaxScore = function () {
  return (
    this.assessmentConfig.maxCAScore +
    this.assessmentConfig.maxExamScore
  );
};

// Calculate letter grade from score
subjectSchema.methods.calculateGrade = function (
  score
) {
  const percentage =
    (score / this.getMaxScore()) * 100;
  if (percentage >= 85)
    return { grade: 'A', gpa: 4.0, remark: 'Excellent' };
  if (percentage >= 75)
    return { grade: 'B', gpa: 3.0, remark: 'Very Good' };
  if (percentage >= 65)
    return { grade: 'C', gpa: 2.0, remark: 'Good' };
  if (percentage >= 50)
    return {
      grade: 'D',
      gpa: 1.0,
      remark: 'Satisfactory',
    };
  return { grade: 'F', gpa: 0.0, remark: 'Fail' };
};

// Check if a score is passing
subjectSchema.methods.isPassing = function (score) {
  return score >= this.assessmentConfig.passingScore;
};

// ─── Create Model ─────────────────────────────
const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;