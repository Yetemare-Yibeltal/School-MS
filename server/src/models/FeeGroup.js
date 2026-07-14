// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FEE GROUP MODEL
// kat-school/server/src/models/FeeGroup.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADE_NAMES } = require('../config/constants');

const feeGroupSchema = new mongoose.Schema(
  {
    // ─── Fee Group Identity ───────────────────
    name: {
      type: String,
      required: [true, 'Fee group name is required'],
      unique: true,
      trim: true,
      maxlength: [
        200,
        'Name cannot exceed 200 characters',
      ],
      index: true,
    },

    code: {
      type: String,
      required: [true, 'Code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'Description cannot exceed 500 characters',
      ],
    },

    // ─── Academic Year ────────────────────────
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

    // ─── Applicability ────────────────────────
    // Which grade this group is for
    grade: {
      type: String,
      enum: {
        values: [...GRADE_NAMES, 'All'],
        message: '{VALUE} is not a valid grade',
      },
      required: [true, 'Grade is required'],
      index: true,
    },

    // Student category this group applies to
    // null = all students in the grade
    studentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentCategory',
      default: null,
      index: true,
    },

    studentCategoryName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Fee Types in this Group ──────────────
    feeTypes: [
      {
        feeType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'FeeType',
          required: true,
        },
        feeTypeName: {
          type: String,
          trim: true,
        },
        feeTypeCode: {
          type: String,
          trim: true,
        },
        // Override the default amount for this group
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        // Whether this fee is mandatory in this group
        isMandatory: {
          type: Boolean,
          default: true,
        },
        // Due date for this fee type
        dueDate: {
          type: Date,
          default: null,
        },
        // Which term this fee is due
        dueTerm: {
          type: Number,
          enum: [1, 2, 3, null],
          default: null,
        },
        // Notes for this fee in the group
        notes: {
          type: String,
          trim: true,
          default: null,
        },
      },
    ],

    // ─── Total Amount ─────────────────────────
    // Total of all fee types in this group
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total mandatory amount
    mandatoryAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total optional amount
    optionalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Discount Settings ────────────────────
    // Whether group-level discount is allowed
    allowGroupDiscount: {
      type: Boolean,
      default: false,
    },

    // Group-level discount percentage
    groupDiscountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ─── Auto-Assignment ──────────────────────
    // Whether to auto-assign to new students
    autoAssignToNewStudents: {
      type: Boolean,
      default: true,
    },

    // ─── Statistics (cached) ──────────────────
    stats: {
      totalStudentsAssigned: {
        type: Number,
        default: 0,
      },
      totalAmountAssigned: {
        type: Number,
        default: 0,
      },
      totalAmountCollected: {
        type: Number,
        default: 0,
      },
      collectionRate: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
    },

    // ─── Status ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    // ─── Sort Order ──────────────────────────
    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'Notes cannot exceed 500 characters',
      ],
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
feeGroupSchema.index(
  { grade: 1, academicYear: 1, studentCategory: 1 },
  { unique: true }
);
feeGroupSchema.index({ academicYear: 1, isActive: 1 });
feeGroupSchema.index({ grade: 1, isActive: 1 });
feeGroupSchema.index({ sortOrder: 1 });

// ─── Virtuals ─────────────────────────────────
// Fee count
feeGroupSchema.virtual('feeCount').get(function () {
  return this.feeTypes ? this.feeTypes.length : 0;
});

// Mandatory fee count
feeGroupSchema.virtual('mandatoryFeeCount').get(
  function () {
    return this.feeTypes
      ? this.feeTypes.filter((f) => f.isMandatory)
          .length
      : 0;
  }
);

// Formatted total
feeGroupSchema.virtual('formattedTotal').get(
  function () {
    return `ETB ${this.totalAmount.toLocaleString()}`;
  }
);

// ─── Pre-Save Hook ────────────────────────────
// Auto-calculate total amounts
feeGroupSchema.pre('save', function (next) {
  if (this.isModified('feeTypes')) {
    let total = 0;
    let mandatory = 0;
    let optional = 0;

    this.feeTypes.forEach((fee) => {
      total += fee.amount || 0;
      if (fee.isMandatory) {
        mandatory += fee.amount || 0;
      } else {
        optional += fee.amount || 0;
      }
    });

    this.totalAmount = total;
    this.mandatoryAmount = mandatory;
    this.optionalAmount = optional;
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Seed default fee groups for each grade
feeGroupSchema.statics.seedDefaultGroups =
  async function (academicYearId, academicYearName) {
    const FeeType = mongoose.model('FeeType');

    // Get all active fee types
    const feeTypes = await FeeType.find({
      isActive: true,
    });

    const getFeeType = (code) =>
      feeTypes.find((f) => f.code === code);

    const grades = [
      'Grade 9',
      'Grade 10',
      'Grade 11',
      'Grade 12',
    ];

    const created = [];

    for (let i = 0; i < grades.length; i++) {
      const grade = grades[i];
      const gradeNum = grade.replace('Grade ', '');

      const tf = getFeeType('TF');
      const ef = getFeeType('EF');
      const lf = getFeeType('LF');
      const sf = getFeeType('SF');
      const lab = getFeeType('LAB');
      const mf = getFeeType('MF');
      const af = getFeeType('AF');

      const groupFeeTypes = [];

      if (tf) {
        groupFeeTypes.push({
          feeType: tf._id,
          feeTypeName: tf.name,
          feeTypeCode: tf.code,
          amount: tf.amount,
          isMandatory: true,
          dueTerm: 1,
        });
      }

      if (ef) {
        groupFeeTypes.push({
          feeType: ef._id,
          feeTypeName: ef.name,
          feeTypeCode: ef.code,
          amount: ef.amount,
          isMandatory: true,
          dueTerm: null,
          notes: 'Due each term',
        });
      }

      if (lf) {
        groupFeeTypes.push({
          feeType: lf._id,
          feeTypeName: lf.name,
          feeTypeCode: lf.code,
          amount: lf.amount,
          isMandatory: true,
          dueTerm: 1,
        });
      }

      if (sf) {
        groupFeeTypes.push({
          feeType: sf._id,
          feeTypeName: sf.name,
          feeTypeCode: sf.code,
          amount: sf.amount,
          isMandatory: true,
          dueTerm: 1,
        });
      }

      if (lab) {
        groupFeeTypes.push({
          feeType: lab._id,
          feeTypeName: lab.name,
          feeTypeCode: lab.code,
          amount: lab.amount,
          isMandatory: false,
          dueTerm: 1,
        });
      }

      if (mf) {
        groupFeeTypes.push({
          feeType: mf._id,
          feeTypeName: mf.name,
          feeTypeCode: mf.code,
          amount: mf.amount,
          isMandatory: true,
          dueTerm: 1,
        });
      }

      if (af) {
        groupFeeTypes.push({
          feeType: af._id,
          feeTypeName: af.name,
          feeTypeCode: af.code,
          amount: af.amount,
          isMandatory: false,
          dueTerm: 1,
        });
      }

      const doc = await this.findOneAndUpdate(
        {
          grade,
          academicYear: academicYearId,
          studentCategory: null,
        },
        {
          $setOnInsert: {
            name: `Grade ${gradeNum} Standard Fee Package`,
            code: `G${gradeNum}-STD`,
            description: `Standard fee package for all Grade ${gradeNum} students`,
            academicYear: academicYearId,
            academicYearName,
            grade,
            feeTypes: groupFeeTypes,
            autoAssignToNewStudents: true,
            isActive: true,
            isSystem: true,
            sortOrder: i + 1,
          },
        },
        { upsert: true, new: true }
      );

      created.push(doc);
    }

    console.info(
      `✅ ${created.length} fee groups seeded`
    );
    return created;
  };

// Find fee group for a student
feeGroupSchema.statics.findForStudent =
  async function (
    grade,
    academicYearId,
    studentCategoryId = null
  ) {
    // First try to find category-specific group
    if (studentCategoryId) {
      const categoryGroup = await this.findOne({
        grade,
        academicYear: academicYearId,
        studentCategory: studentCategoryId,
        isActive: true,
      }).populate(
        'feeTypes.feeType',
        'name code amount'
      );

      if (categoryGroup) return categoryGroup;
    }

    // Fall back to standard group
    return this.findOne({
      grade,
      academicYear: academicYearId,
      studentCategory: null,
      isActive: true,
    }).populate('feeTypes.feeType', 'name code amount');
  };

// Get all groups for academic year
feeGroupSchema.statics.getForYear = function (
  academicYearId
) {
  return this.find({
    academicYear: academicYearId,
    isActive: true,
  })
    .sort({ grade: 1, sortOrder: 1 })
    .populate(
      'feeTypes.feeType',
      'name code color icon'
    )
    .populate('studentCategory', 'name code color');
};

// Get groups by grade
feeGroupSchema.statics.getByGrade = function (
  grade,
  academicYearId
) {
  return this.find({
    grade,
    academicYear: academicYearId,
    isActive: true,
  })
    .sort({ sortOrder: 1 })
    .populate('feeTypes.feeType', 'name code')
    .populate('studentCategory', 'name code');
};

// Add fee type to group
feeGroupSchema.statics.addFeeType =
  async function (groupId, feeTypeData) {
    return this.findByIdAndUpdate(
      groupId,
      {
        $addToSet: { feeTypes: feeTypeData },
      },
      { new: true, runValidators: true }
    );
  };

// Remove fee type from group
feeGroupSchema.statics.removeFeeType =
  async function (groupId, feeTypeId) {
    return this.findByIdAndUpdate(
      groupId,
      {
        $pull: {
          feeTypes: { feeType: feeTypeId },
        },
      },
      { new: true }
    );
  };

// Update stats for a group
feeGroupSchema.statics.updateStats =
  async function (groupId) {
    const FeeAssignment =
      mongoose.model('FeeAssignment');

    const stats = await FeeAssignment.aggregate([
      {
        $match: {
          feeGroup: new mongoose.Types.ObjectId(
            groupId
          ),
        },
      },
      {
        $group: {
          _id: null,
          students: { $addToSet: '$student' },
          totalAssigned: {
            $sum: '$amount',
          },
          totalPaid: {
            $sum: '$amountPaid',
          },
        },
      },
    ]);

    if (stats.length === 0) return;

    const s = stats[0];
    const collectionRate =
      s.totalAssigned > 0
        ? Math.round(
            (s.totalPaid / s.totalAssigned) * 100
          )
        : 0;

    return this.findByIdAndUpdate(
      groupId,
      {
        'stats.totalStudentsAssigned':
          s.students.length,
        'stats.totalAmountAssigned': s.totalAssigned,
        'stats.totalAmountCollected': s.totalPaid,
        'stats.collectionRate': collectionRate,
        'stats.lastUpdated': new Date(),
      },
      { new: true }
    );
  };

// Get dashboard stats
feeGroupSchema.statics.getDashboardStats =
  async function (academicYearId) {
    const [total, byGrade] = await Promise.all([
      this.countDocuments({
        academicYear: academicYearId,
        isActive: true,
      }),
      this.aggregate([
        {
          $match: {
            academicYear:
              new mongoose.Types.ObjectId(
                academicYearId
              ),
            isActive: true,
          },
        },
        {
          $group: {
            _id: '$grade',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return { total, byGrade };
  };

// ─── Instance Methods ─────────────────────────

// Get fee type by code
feeGroupSchema.methods.getFeeByCode = function (
  code
) {
  return this.feeTypes.find(
    (f) => f.feeTypeCode === code
  );
};

// Check if group has a specific fee type
feeGroupSchema.methods.hasFeeType = function (
  feeTypeId
) {
  return this.feeTypes.some(
    (f) =>
      f.feeType.toString() === feeTypeId.toString()
  );
};

// Calculate discounted total
feeGroupSchema.methods.getDiscountedTotal =
  function (discountPercentage = 0) {
    const discount = this.totalAmount * (discountPercentage / 100);
    return this.totalAmount - discount;
  };

// Get fees due for a specific term
feeGroupSchema.methods.getFeesForTerm = function (
  termNumber
) {
  return this.feeTypes.filter(
    (f) => f.dueTerm === termNumber || f.dueTerm === null
  );
};

// ─── Create Model ─────────────────────────────
const FeeGroup = mongoose.model(
  'FeeGroup',
  feeGroupSchema
);

module.exports = FeeGroup;