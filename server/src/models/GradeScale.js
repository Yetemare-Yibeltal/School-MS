// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// GRADE SCALE MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADING_SCALE } = require('../config/constants');

const gradeScaleSchema = new mongoose.Schema(
  {
    // ─── Grade Identity ───────────────────────
    // Letter grade e.g. "A", "B", "C", "D", "F"
    grade: {
      type: String,
      required: [true, 'Grade letter is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [3, 'Grade cannot exceed 3 characters'],
      index: true,
    },

    // ─── Score Range ──────────────────────────
    minScore: {
      type: Number,
      required: [true, 'Minimum score is required'],
      min: [0, 'Minimum score cannot be negative'],
      max: [100, 'Minimum score cannot exceed 100'],
    },

    maxScore: {
      type: Number,
      required: [true, 'Maximum score is required'],
      min: [0, 'Maximum score cannot be negative'],
      max: [100, 'Maximum score cannot exceed 100'],
      validate: {
        validator: function (maxScore) {
          return maxScore >= this.minScore;
        },
        message: 'Maximum score must be >= minimum score',
      },
    },

    // ─── GPA Points ───────────────────────────
    // GPA value on 4.0 scale
    gpaPoints: {
      type: Number,
      required: [true, 'GPA points is required'],
      min: [0, 'GPA points cannot be negative'],
      max: [4, 'GPA points cannot exceed 4.0'],
    },

    // ─── Description ──────────────────────────
    // Remark displayed on report card
    remark: {
      type: String,
      required: [true, 'Remark is required'],
      trim: true,
      maxlength: [100, 'Remark cannot exceed 100 characters'],
      // e.g. "Excellent", "Very Good", "Good"
    },

    // Amharic remark
    remarkAmharic: {
      type: String,
      trim: true,
      default: null,
    },

    // Detailed description of this grade level
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ─── Pass/Fail ────────────────────────────
    // Whether this grade means the student passed
    isPassing: {
      type: Boolean,
      required: [true, 'isPassing is required'],
      default: true,
    },

    // ─── UI Display ───────────────────────────
    // Color for displaying this grade in UI
    color: {
      type: String,
      required: [true, 'Color is required'],
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    // Background color
    bgColor: {
      type: String,
      default: null,
    },

    // Text color (for contrast)
    textColor: {
      type: String,
      default: '#ffffff',
    },

    // Badge style for UI
    badgeStyle: {
      type: String,
      enum: ['success', 'info', 'warning', 'danger', 'primary', 'secondary'],
      default: 'primary',
    },

    // ─── Sort Order ───────────────────────────
    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── System vs Custom ─────────────────────
    isSystem: {
      type: Boolean,
      default: true,
    },

    // ─── Academic Year Specific ───────────────
    // Null = applies to all years
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

// ─── Indexes ──────────────────────────────────
gradeScaleSchema.index({ grade: 1 }, { unique: true });
gradeScaleSchema.index({ isActive: 1 });
gradeScaleSchema.index({ minScore: 1, maxScore: 1 });
gradeScaleSchema.index({ sortOrder: 1 });

// ─── Virtuals ─────────────────────────────────
// Score range display
gradeScaleSchema.virtual('scoreRange').get(function () {
  return `${this.minScore} - ${this.maxScore}`;
});

// Full label
gradeScaleSchema.virtual('fullLabel').get(function () {
  return `${this.grade} (${this.scoreRange}) — ${this.remark}`;
});

// ─── Pre-Save Validation ──────────────────────
gradeScaleSchema.pre('save', function (next) {
  // Ensure grade is uppercase
  if (this.isModified('grade')) {
    this.grade = this.grade.toUpperCase();
  }

  // Set bgColor if not provided
  if (!this.bgColor && this.color) {
    this.bgColor = `${this.color}20`;
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Seed default Ethiopian MoE grading scale
gradeScaleSchema.statics.seedDefaultScale = async function () {
  const scales = [
    {
      grade: 'A',
      minScore: 85,
      maxScore: 100,
      gpaPoints: 4.0,
      remark: 'Excellent',
      remarkAmharic: 'በጣም ጥሩ',
      description: 'Outstanding performance demonstrating comprehensive understanding',
      isPassing: true,
      color: '#22c55e',
      bgColor: '#dcfce7',
      textColor: '#14532d',
      badgeStyle: 'success',
      sortOrder: 1,
      isSystem: true,
    },
    {
      grade: 'B',
      minScore: 75,
      maxScore: 84,
      gpaPoints: 3.0,
      remark: 'Very Good',
      remarkAmharic: 'ጥሩ',
      description: 'Above average performance with good understanding of the subject',
      isPassing: true,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      textColor: '#1e3a8a',
      badgeStyle: 'info',
      sortOrder: 2,
      isSystem: true,
    },
    {
      grade: 'C',
      minScore: 65,
      maxScore: 74,
      gpaPoints: 2.0,
      remark: 'Good',
      remarkAmharic: 'መካከለኛ',
      description: 'Average performance meeting the basic requirements',
      isPassing: true,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      textColor: '#78350f',
      badgeStyle: 'warning',
      sortOrder: 3,
      isSystem: true,
    },
    {
      grade: 'D',
      minScore: 50,
      maxScore: 64,
      gpaPoints: 1.0,
      remark: 'Satisfactory',
      remarkAmharic: 'አስደሳች',
      description: 'Below average but meeting minimum passing requirements',
      isPassing: true,
      color: '#f97316',
      bgColor: '#ffedd5',
      textColor: '#7c2d12',
      badgeStyle: 'warning',
      sortOrder: 4,
      isSystem: true,
    },
    {
      grade: 'F',
      minScore: 0,
      maxScore: 49,
      gpaPoints: 0.0,
      remark: 'Fail',
      remarkAmharic: 'ወድቋል',
      description: 'Did not meet the minimum passing requirements',
      isPassing: false,
      color: '#ef4444',
      bgColor: '#fee2e2',
      textColor: '#7f1d1d',
      badgeStyle: 'danger',
      sortOrder: 5,
      isSystem: true,
    },
  ];

  for (const scale of scales) {
    await this.findOneAndUpdate(
      { grade: scale.grade },
      { $setOnInsert: scale },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${scales.length} grade scales seeded`);
};

// Calculate grade for a given percentage
gradeScaleSchema.statics.calculateGrade = async function (percentage) {
  const scale = await this.findOne({
    isActive: true,
    minScore: { $lte: percentage },
    maxScore: { $gte: percentage },
  });

  if (!scale) {
    return {
      grade: 'F',
      gpaPoints: 0.0,
      remark: 'Fail',
      isPassing: false,
      color: '#ef4444',
      badgeStyle: 'danger',
    };
  }

  return {
    grade: scale.grade,
    gpaPoints: scale.gpaPoints,
    remark: scale.remark,
    remarkAmharic: scale.remarkAmharic,
    isPassing: scale.isPassing,
    color: scale.color,
    bgColor: scale.bgColor,
    badgeStyle: scale.badgeStyle,
  };
};

// Get all active scales sorted
gradeScaleSchema.statics.getAllActive = function () {
  return this.find({ isActive: true }).sort({
    sortOrder: 1,
  });
};

// Get passing grades
gradeScaleSchema.statics.getPassingGrades = function () {
  return this.find({
    isActive: true,
    isPassing: true,
  }).sort({ sortOrder: 1 });
};

// Get minimum passing score
gradeScaleSchema.statics.getMinPassingScore = async function () {
  const lowestPassing = await this.findOne({
    isActive: true,
    isPassing: true,
  }).sort({ minScore: 1 });

  return lowestPassing ? lowestPassing.minScore : 50;
};

// Validate that scales cover 0-100 without gaps
gradeScaleSchema.statics.validateCoverage = async function () {
  const scales = await this.find({
    isActive: true,
  }).sort({ minScore: 1 });

  const issues = [];
  let expectedMin = 0;

  for (const scale of scales) {
    if (scale.minScore !== expectedMin) {
      issues.push(`Gap between ${expectedMin} and ${scale.minScore}`);
    }
    expectedMin = scale.maxScore + 1;
  }

  if (expectedMin !== 101) {
    issues.push(`Scale does not cover up to 100 (ends at ${expectedMin - 1})`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    scales,
  };
};

// Get grade for a specific score
gradeScaleSchema.statics.getGradeForScore = async function (score, maxScore = 100) {
  const percentage = Math.round((score / maxScore) * 100);
  return this.calculateGrade(percentage);
};

// Update grade scale (admin only)
gradeScaleSchema.statics.updateScale = async function (grade, updates, userId) {
  const scale = await this.findOne({ grade });
  if (!scale) {
    throw new Error(`Grade scale ${grade} not found`);
  }

  // Prevent changing grade letter for system grades
  if (scale.isSystem && updates.grade) {
    delete updates.grade;
  }

  Object.assign(scale, updates);
  scale.updatedBy = userId;
  await scale.save();
  return scale;
};

// ─── Instance Methods ─────────────────────────

// Check if a score falls in this grade
gradeScaleSchema.methods.containsScore = function (percentage) {
  return percentage >= this.minScore && percentage <= this.maxScore;
};

// Get display badge object
gradeScaleSchema.methods.getBadge = function () {
  return {
    grade: this.grade,
    remark: this.remark,
    color: this.color,
    bgColor: this.bgColor,
    textColor: this.textColor,
    badgeStyle: this.badgeStyle,
    isPassing: this.isPassing,
  };
};

// Get score range as percentage
gradeScaleSchema.methods.getRangeDisplay = function () {
  return `${this.minScore}% – ${this.maxScore}%`;
};

// ─── Create Model ─────────────────────────────
const GradeScale = mongoose.model('GradeScale', gradeScaleSchema);

module.exports = GradeScale;
