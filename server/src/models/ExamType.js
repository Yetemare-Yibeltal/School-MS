// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXAM TYPE MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { EXAM_TYPES } = require('../config/constants');

const examTypeSchema = new mongoose.Schema(
  {
    // ─── Exam Type Identity ───────────────────
    name: {
      type: String,
      required: [true, 'Exam type name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },

    // Short code e.g. "MID", "FINAL", "UNIT"
    code: {
      type: String,
      required: [true, 'Code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [10, 'Code cannot exceed 10 characters'],
      match: [/^[A-Z0-9_]+$/, 'Code must be uppercase letters and numbers only'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ─── Assessment Component ─────────────────
    // Which component this exam type belongs to
    component: {
      type: String,
      required: [true, 'Component is required'],
      enum: {
        values: ['continuous_assessment', 'final_exam', 'both', 'independent'],
        message: '{VALUE} is not a valid component',
      },
      default: 'final_exam',
    },

    // ─── Scoring ──────────────────────────────
    // Default maximum marks for this exam type
    defaultMaxMarks: {
      type: Number,
      required: [true, 'Default maximum marks is required'],
      min: [1, 'Must be at least 1'],
      max: [100, 'Cannot exceed 100'],
      default: 50,
    },

    // Default passing marks
    defaultPassingMarks: {
      type: Number,
      default: 25,
      min: 0,
    },

    // Default duration in minutes
    defaultDuration: {
      type: Number,
      default: 180,
      min: 30,
      max: 300,
    },

    // Weight in final score (%)
    // How much this exam type contributes to final grade
    weightInFinalScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    // ─── Frequency ───────────────────────────
    // How many times per term this exam is held
    frequencyPerTerm: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    // ─── CA Sub-Types ────────────────────────
    // If this is a CA exam, which CA components does it cover
    caComponents: {
      type: [String],
      default: [],
      // e.g. ["Test 1", "Test 2", "Assignment"]
    },

    // ─── Rules ───────────────────────────────
    // Whether students must sit this exam
    isMandatory: {
      type: Boolean,
      default: true,
    },

    // Whether absent students get 0 automatically
    autoZeroForAbsent: {
      type: Boolean,
      default: true,
    },

    // Whether this exam can be retaken
    canRetake: {
      type: Boolean,
      default: false,
    },

    // Maximum retakes allowed
    maxRetakes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── UI Display ──────────────────────────
    color: {
      type: String,
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    bgColor: {
      type: String,
      default: '#eef2ff',
    },

    icon: {
      type: String,
      default: 'file-text',
      trim: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Grade Levels ─────────────────────────
    // Which grades this exam type applies to
    // Empty = all grades
    applicableGrades: {
      type: [String],
      default: [],
    },

    // ─── Type Category ────────────────────────
    // System types cannot be deleted
    isSystem: {
      type: Boolean,
      default: false,
    },

    // ─── Status ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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
examTypeSchema.index({ name: 1 }, { unique: true });
examTypeSchema.index({ code: 1 }, { unique: true });
examTypeSchema.index({ isActive: 1 });
examTypeSchema.index({ component: 1 });
examTypeSchema.index({ sortOrder: 1 });

// ─── Virtuals ─────────────────────────────────
// Display label
examTypeSchema.virtual('displayLabel').get(function () {
  return `${this.name} (${this.code})`;
});

// Is CA type
examTypeSchema.virtual('isCAType').get(function () {
  return this.component === 'continuous_assessment';
});

// Is Final Exam type
examTypeSchema.virtual('isFinalExamType').get(function () {
  return this.component === 'final_exam';
});

// ─── Static Methods ───────────────────────────

// Seed default exam types
examTypeSchema.statics.seedDefaultExamTypes = async function () {
  const examTypes = [
    {
      name: 'Unit Test',
      code: 'UNIT',
      description: 'Short tests conducted after completing a unit',
      component: 'continuous_assessment',
      defaultMaxMarks: 20,
      defaultPassingMarks: 10,
      defaultDuration: 60,
      weightInFinalScore: 15,
      frequencyPerTerm: 3,
      isMandatory: true,
      autoZeroForAbsent: true,
      canRetake: false,
      color: '#22c55e',
      bgColor: '#dcfce7',
      icon: 'file-check',
      sortOrder: 1,
      isSystem: true,
    },
    {
      name: 'Assignment',
      code: 'ASSIGN',
      description: 'Written assignments and homework given to students',
      component: 'continuous_assessment',
      defaultMaxMarks: 15,
      defaultPassingMarks: 8,
      defaultDuration: 0,
      weightInFinalScore: 10,
      frequencyPerTerm: 3,
      isMandatory: true,
      autoZeroForAbsent: false,
      canRetake: true,
      maxRetakes: 1,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: 'clipboard',
      sortOrder: 2,
      isSystem: true,
    },
    {
      name: 'Quiz',
      code: 'QUIZ',
      description: 'Short quizzes to assess understanding',
      component: 'continuous_assessment',
      defaultMaxMarks: 10,
      defaultPassingMarks: 5,
      defaultDuration: 30,
      weightInFinalScore: 10,
      frequencyPerTerm: 4,
      isMandatory: false,
      autoZeroForAbsent: true,
      canRetake: false,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      icon: 'help-circle',
      sortOrder: 3,
      isSystem: true,
    },
    {
      name: 'Mid-Term Exam',
      code: 'MID',
      description: 'Examination held in the middle of each term',
      component: 'continuous_assessment',
      defaultMaxMarks: 50,
      defaultPassingMarks: 25,
      defaultDuration: 180,
      weightInFinalScore: 25,
      frequencyPerTerm: 1,
      isMandatory: true,
      autoZeroForAbsent: true,
      canRetake: false,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      icon: 'file-text',
      sortOrder: 4,
      isSystem: true,
    },
    {
      name: 'Final Exam',
      code: 'FINAL',
      description: 'Main examination held at the end of each term',
      component: 'final_exam',
      defaultMaxMarks: 50,
      defaultPassingMarks: 25,
      defaultDuration: 180,
      weightInFinalScore: 50,
      frequencyPerTerm: 1,
      isMandatory: true,
      autoZeroForAbsent: true,
      canRetake: false,
      color: '#ef4444',
      bgColor: '#fee2e2',
      icon: 'book-open',
      sortOrder: 5,
      isSystem: true,
    },
    {
      name: 'Mock Exam',
      code: 'MOCK',
      description: 'Practice exam to prepare students for national exams',
      component: 'independent',
      defaultMaxMarks: 100,
      defaultPassingMarks: 50,
      defaultDuration: 180,
      weightInFinalScore: 0,
      frequencyPerTerm: 1,
      isMandatory: false,
      autoZeroForAbsent: true,
      canRetake: false,
      color: '#f97316',
      bgColor: '#ffedd5',
      icon: 'target',
      sortOrder: 6,
      isSystem: true,
      applicableGrades: ['Grade 12'],
    },
    {
      name: 'National Exam',
      code: 'NAT',
      description: 'Ethiopian University Entrance Examination (EUEE)',
      component: 'independent',
      defaultMaxMarks: 100,
      defaultPassingMarks: 50,
      defaultDuration: 180,
      weightInFinalScore: 0,
      frequencyPerTerm: 1,
      isMandatory: true,
      autoZeroForAbsent: true,
      canRetake: false,
      color: '#dc2626',
      bgColor: '#fee2e2',
      icon: 'award',
      sortOrder: 7,
      isSystem: true,
      applicableGrades: ['Grade 12'],
    },
  ];

  for (const examType of examTypes) {
    await this.findOneAndUpdate(
      { code: examType.code },
      { $setOnInsert: examType },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${examTypes.length} exam types seeded`);
};

// Find by code
examTypeSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active exam types
examTypeSchema.statics.getAllActive = function () {
  return this.find({ isActive: true }).sort({
    sortOrder: 1,
    name: 1,
  });
};

// Get CA exam types
examTypeSchema.statics.getCATypes = function () {
  return this.find({
    component: 'continuous_assessment',
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Get Final exam types
examTypeSchema.statics.getFinalExamTypes = function () {
  return this.find({
    component: 'final_exam',
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// Get exam types for a specific grade
examTypeSchema.statics.getForGrade = function (grade) {
  return this.find({
    isActive: true,
    $or: [{ applicableGrades: { $size: 0 } }, { applicableGrades: grade }],
  }).sort({ sortOrder: 1 });
};

// Validate total weights sum to 100
examTypeSchema.statics.validateWeights = async function () {
  const types = await this.find({
    isActive: true,
    component: {
      $in: ['continuous_assessment', 'final_exam'],
    },
  });

  const totalWeight = types.reduce((sum, t) => sum + t.weightInFinalScore, 0);

  return {
    totalWeight,
    isValid: totalWeight === 100,
    types: types.map((t) => ({
      name: t.name,
      code: t.code,
      weight: t.weightInFinalScore,
    })),
  };
};

// ─── Instance Methods ─────────────────────────

// Check if exam type applies to a grade
examTypeSchema.methods.appliesToGrade = function (grade) {
  if (!this.applicableGrades || this.applicableGrades.length === 0) {
    return true;
  }
  return this.applicableGrades.includes(grade);
};

// Get default exam settings
examTypeSchema.methods.getDefaults = function () {
  return {
    maxMarks: this.defaultMaxMarks,
    passingMarks: this.defaultPassingMarks,
    duration: this.defaultDuration,
    weightInFinalScore: this.weightInFinalScore,
  };
};

// ─── Create Model ─────────────────────────────
const ExamType = mongoose.model('ExamType', examTypeSchema);

module.exports = ExamType;
