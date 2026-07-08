// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ACADEMIC YEAR MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  ETHIOPIAN_MONTHS,
} = require('../config/constants');

const academicYearSchema = new mongoose.Schema(
  {
    // ─── Year Identity ────────────────────────
    // Display name e.g. "2016 E.C." or "2023/24"
    name: {
      type: String,
      required: [true, 'Academic year name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
      index: true,
    },

    // Ethiopian calendar year
    // e.g. 2016 for the 2016 E.C. academic year
    ethiopianYear: {
      type: Number,
      required: [true, 'Ethiopian year is required'],
      unique: true,
      min: [2000, 'Year must be 2000 E.C. or later'],
      max: [2100, 'Year must be 2100 E.C. or earlier'],
      index: true,
    },

    // Gregorian calendar equivalent
    // e.g. "2023/2024"
    gregorianYear: {
      type: String,
      trim: true,
    },

    // ─── Duration ─────────────────────────────
    // Academic year start date (Gregorian)
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    // Academic year end date (Gregorian)
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

    // Ethiopian calendar start month
    startMonthEthiopian: {
      type: String,
      enum: {
        values: ETHIOPIAN_MONTHS.map((m) => m.name),
        message: '{VALUE} is not a valid Ethiopian month',
      },
      default: 'Meskerem',
    },

    // Ethiopian calendar end month
    endMonthEthiopian: {
      type: String,
      enum: {
        values: ETHIOPIAN_MONTHS.map((m) => m.name),
        message: '{VALUE} is not a valid Ethiopian month',
      },
      default: 'Sene',
    },

    // ─── Terms ────────────────────────────────
    // References to Term documents
    terms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Term',
      },
    ],

    // Number of terms in this year
    numberOfTerms: {
      type: Number,
      default: 3,
      min: 1,
      max: 4,
    },

    // ─── Status ───────────────────────────────
    // Only one academic year should be active at once
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

    // ─── Statistics (cached) ──────────────────
    stats: {
      totalStudents: {
        type: Number,
        default: 0,
      },
      totalTeachers: {
        type: Number,
        default: 0,
      },
      totalClasses: {
        type: Number,
        default: 0,
      },
      passRate: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      attendanceRate: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
    },

    // ─── Holidays ─────────────────────────────
    // School holidays in this academic year
    holidays: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: Date,
          required: true,
        },
        type: {
          type: String,
          enum: [
            'National Holiday',
            'Religious Holiday',
            'School Holiday',
            'Emergency',
            'Other',
          ],
          default: 'National Holiday',
        },
        description: {
          type: String,
          trim: true,
        },
        isEthiopian: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // ─── Working Days Configuration ───────────
    workingDays: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false },
    },

    // Total working days in the year
    totalWorkingDays: {
      type: Number,
      default: 0,
    },

    // ─── Grading Configuration ────────────────
    gradingConfig: {
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
      // Minimum attendance to sit exam (%)
      minimumAttendance: {
        type: Number,
        default: 75,
        min: 0,
        max: 100,
      },
      // Passing score
      passingScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
    },

    // ─── Fee Configuration ────────────────────
    feeConfig: {
      // Annual tuition fee in ETB
      annualTuitionFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Registration fee
      registrationFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Due date for first payment
      firstPaymentDueDate: {
        type: Date,
        default: null,
      },
    },

    // ─── Notes ────────────────────────────────
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
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
academicYearSchema.index(
  { name: 1 },
  { unique: true }
);
academicYearSchema.index(
  { ethiopianYear: 1 },
  { unique: true }
);
academicYearSchema.index({ isActive: 1 });
academicYearSchema.index({ isCurrent: 1 });
academicYearSchema.index({ startDate: -1 });

// ─── Virtuals ─────────────────────────────────
// Duration in days
academicYearSchema.virtual('durationDays').get(
  function () {
    if (!this.startDate || !this.endDate) return 0;
    return Math.ceil(
      (new Date(this.endDate) -
        new Date(this.startDate)) /
        (1000 * 60 * 60 * 24)
    );
  }
);

// Months elapsed since start
academicYearSchema.virtual('monthsElapsed').get(
  function () {
    if (!this.startDate) return 0;
    const now = new Date();
    const start = new Date(this.startDate);
    if (now < start) return 0;
    const end = this.endDate
      ? new Date(this.endDate)
      : now;
    const elapsed = Math.min(now, end) - start;
    return Math.floor(
      elapsed / (1000 * 60 * 60 * 24 * 30)
    );
  }
);

// Progress percentage
academicYearSchema.virtual('progressPercentage').get(
  function () {
    if (!this.startDate || !this.endDate) return 0;
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(
      ((now - start) / (end - start)) * 100
    );
  }
);

// Is year currently running
academicYearSchema.virtual('isRunning').get(
  function () {
    const now = new Date();
    return (
      this.startDate <= now &&
      this.endDate >= now &&
      this.isActive
    );
  }
);

// Days remaining
academicYearSchema.virtual('daysRemaining').get(
  function () {
    if (!this.endDate) return null;
    const now = new Date();
    const end = new Date(this.endDate);
    if (now >= end) return 0;
    return Math.ceil(
      (end - now) / (1000 * 60 * 60 * 24)
    );
  }
);

// ─── Pre-Save Middleware ──────────────────────
// Ensure only one academic year is active/current
academicYearSchema.pre('save', async function (next) {
  if (
    this.isModified('isActive') &&
    this.isActive
  ) {
    // Deactivate all other academic years
    await mongoose
      .model('AcademicYear')
      .updateMany(
        { _id: { $ne: this._id } },
        { isActive: false, isCurrent: false }
      );
    this.isCurrent = true;
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Get the current active academic year
academicYearSchema.statics.getCurrent = function () {
  return this.findOne({
    isActive: true,
    isCurrent: true,
  }).populate('terms');
};

// Get all years sorted by most recent
academicYearSchema.statics.getAllSorted = function () {
  return this.find()
    .sort({ ethiopianYear: -1 })
    .populate('terms');
};

// Activate a specific academic year
academicYearSchema.statics.activate =
  async function (yearId) {
    // Deactivate all others first
    await this.updateMany(
      {},
      { isActive: false, isCurrent: false }
    );

    // Activate the specified year
    return this.findByIdAndUpdate(
      yearId,
      { isActive: true, isCurrent: true },
      { new: true }
    );
  };

// Get year by Ethiopian year number
academicYearSchema.statics.findByEthiopianYear =
  function (year) {
    return this.findOne({
      ethiopianYear: parseInt(year),
    }).populate('terms');
  };

// Mark year as completed
academicYearSchema.statics.markCompleted =
  async function (yearId) {
    return this.findByIdAndUpdate(
      yearId,
      {
        isCompleted: true,
        isActive: false,
        isCurrent: false,
        completedAt: new Date(),
      },
      { new: true }
    );
  };

// Update cached stats for an academic year
academicYearSchema.statics.updateStats =
  async function (yearId) {
    const Student = mongoose.model('Student');
    const Teacher = mongoose.model('Teacher');

    const [
      totalStudents,
      totalTeachers,
    ] = await Promise.all([
      Student.countDocuments({
        academicYear: yearId,
        status: 'active',
      }),
      Teacher.countDocuments({ status: 'active' }),
    ]);

    return this.findByIdAndUpdate(
      yearId,
      {
        'stats.totalStudents': totalStudents,
        'stats.totalTeachers': totalTeachers,
        'stats.lastUpdated': new Date(),
      },
      { new: true }
    );
  };

// Add holiday to academic year
academicYearSchema.statics.addHoliday =
  async function (yearId, holiday) {
    return this.findByIdAndUpdate(
      yearId,
      { $push: { holidays: holiday } },
      { new: true, runValidators: true }
    );
  };

// Remove holiday from academic year
academicYearSchema.statics.removeHoliday =
  async function (yearId, holidayId) {
    return this.findByIdAndUpdate(
      yearId,
      { $pull: { holidays: { _id: holidayId } } },
      { new: true }
    );
  };

// Check if a date is a holiday
academicYearSchema.statics.isHoliday =
  async function (yearId, date) {
    const year = await this.findById(yearId).select(
      'holidays'
    );
    if (!year) return false;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return year.holidays.some((holiday) => {
      const hDate = new Date(holiday.date);
      hDate.setHours(0, 0, 0, 0);
      return hDate.getTime() === checkDate.getTime();
    });
  };

// Get working days count between two dates
academicYearSchema.statics.getWorkingDaysCount =
  async function (yearId, startDate, endDate) {
    const year = await this.findById(yearId).select(
      'workingDays holidays'
    );
    if (!year) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    while (current <= end) {
      const dayName =
        dayNames[current.getDay()];
      const isWorkingDay =
        year.workingDays[dayName];

      const isHoliday = year.holidays.some(
        (h) => {
          const hDate = new Date(h.date);
          return (
            hDate.toDateString() ===
            current.toDateString()
          );
        }
      );

      if (isWorkingDay && !isHoliday) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  };

// Seed default Ethiopian academic year
academicYearSchema.statics.seedCurrentYear =
  async function () {
    const currentEthYear = 2016;
    const existing = await this.findOne({
      ethiopianYear: currentEthYear,
    });

    if (existing) {
      console.info(
        '✅ Academic year already exists'
      );
      return existing;
    }

    const year = await this.create({
      name: `${currentEthYear} E.C.`,
      ethiopianYear: currentEthYear,
      gregorianYear: '2023/2024',
      startDate: new Date('2023-09-11'),
      endDate: new Date('2024-06-07'),
      startMonthEthiopian: 'Meskerem',
      endMonthEthiopian: 'Sene',
      numberOfTerms: 3,
      isActive: true,
      isCurrent: true,
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      gradingConfig: {
        caWeight: 50,
        examWeight: 50,
        minimumAttendance: 75,
        passingScore: 50,
      },
      description: 'Kat Secondary School Academic Year 2016 E.C.',
    });

    console.info(
      `✅ Academic year ${currentEthYear} E.C. created`
    );
    return year;
  };

// ─── Instance Methods ─────────────────────────

// Add a term to this academic year
academicYearSchema.methods.addTerm =
  async function (termId) {
    if (!this.terms.includes(termId)) {
      this.terms.push(termId);
      await this.save();
    }
    return this;
  };

// Check if a date falls within this academic year
academicYearSchema.methods.containsDate = function (
  date
) {
  const checkDate = new Date(date);
  return (
    checkDate >= new Date(this.startDate) &&
    checkDate <= new Date(this.endDate)
  );
};

// Get term for a specific date
academicYearSchema.methods.getTermForDate =
  async function (date) {
    if (this.terms.length === 0) return null;

    const Term = mongoose.model('Term');
    const checkDate = new Date(date);

    return Term.findOne({
      academicYear: this._id,
      startDate: { $lte: checkDate },
      endDate: { $gte: checkDate },
    });
  };

// ─── Create Model ─────────────────────────────
const AcademicYear = mongoose.model(
  'AcademicYear',
  academicYearSchema
);

module.exports = AcademicYear;