// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TIMETABLE SLOT MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  DAYS_OF_WEEK,
  TIMETABLE_PERIODS,
} = require('../config/constants');

const timetableSlotSchema = new mongoose.Schema(
  {
    // ─── Parent Timetable ─────────────────────
    timetable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      required: [true, 'Timetable reference is required'],
      index: true,
    },

    // ─── Section ──────────────────────────────
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section is required'],
      index: true,
    },

    // Cached section name
    sectionName: {
      type: String,
      trim: true,
    },

    // ─── Class & Grade ────────────────────────
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      index: true,
    },

    // Cached grade
    grade: {
      type: String,
      trim: true,
      index: true,
    },

    // Cached stream
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

    // ─── Schedule Position ────────────────────
    // Day of the week
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: {
        values: DAYS_OF_WEEK,
        message: '{VALUE} is not a valid day',
      },
      index: true,
    },

    // Period number (1-7)
    period: {
      type: Number,
      required: [true, 'Period number is required'],
      min: [1, 'Period must be at least 1'],
      max: [12, 'Period cannot exceed 12'],
      index: true,
    },

    // Start time e.g. "08:00"
    startTime: {
      type: String,
      trim: true,
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid time format. Use HH:MM',
      ],
    },

    // End time e.g. "09:00"
    endTime: {
      type: String,
      trim: true,
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid time format. Use HH:MM',
      ],
    },

    // Duration in minutes
    duration: {
      type: Number,
      default: 60,
      min: 30,
      max: 120,
    },

    // ─── Subject ──────────────────────────────
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true,
    },

    // Cached subject name
    subjectName: {
      type: String,
      trim: true,
    },

    // Cached subject code
    subjectCode: {
      type: String,
      trim: true,
    },

    // Cached subject color for UI
    subjectColor: {
      type: String,
      default: '#6366f1',
    },

    // ─── Teacher ──────────────────────────────
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher is required'],
      index: true,
    },

    // Cached teacher name
    teacherName: {
      type: String,
      trim: true,
    },

    // ─── Room ─────────────────────────────────
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
      index: true,
    },

    // Cached room name
    roomName: {
      type: String,
      trim: true,
      default: null,
    },

    // Cached room number
    roomNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Slot Type ────────────────────────────
    type: {
      type: String,
      enum: [
        'regular',
        'lab',
        'exam',
        'free',
        'break',
        'assembly',
        'sports',
        'library',
      ],
      default: 'regular',
    },

    // ─── Conflict Flags ───────────────────────
    hasConflict: {
      type: Boolean,
      default: false,
      index: true,
    },

    conflictType: {
      type: String,
      enum: [
        'teacher_double_booking',
        'room_double_booking',
        'subject_overload',
        null,
      ],
      default: null,
    },

    conflictDescription: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Substitution ─────────────────────────
    // When a teacher is absent, a substitute is assigned
    isSubstituted: {
      type: Boolean,
      default: false,
    },

    substituteTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    substituteTeacherName: {
      type: String,
      trim: true,
      default: null,
    },

    substitutionDate: {
      type: Date,
      default: null,
    },

    substitutionReason: {
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

    // Whether this slot is cancelled for a specific date
    isCancelled: {
      type: Boolean,
      default: false,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Notes ────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'Notes cannot exceed 500 characters',
      ],
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
// Prevent duplicate slots for same section/day/period
timetableSlotSchema.index(
  {
    timetable: 1,
    day: 1,
    period: 1,
  },
  { unique: true }
);

timetableSlotSchema.index({
  section: 1,
  academicYear: 1,
  day: 1,
  period: 1,
});

timetableSlotSchema.index({
  teacher: 1,
  academicYear: 1,
  day: 1,
  period: 1,
});

timetableSlotSchema.index({
  room: 1,
  academicYear: 1,
  day: 1,
  period: 1,
});

timetableSlotSchema.index({
  subject: 1,
  academicYear: 1,
});

timetableSlotSchema.index({
  academicYear: 1,
  day: 1,
  isActive: 1,
});

// ─── Virtuals ─────────────────────────────────
// Time range display
timetableSlotSchema.virtual('timeRange').get(
  function () {
    if (!this.startTime || !this.endTime) return '';
    return `${this.startTime} - ${this.endTime}`;
  }
);

// Full slot label
timetableSlotSchema.virtual('label').get(function () {
  return `${this.day} Period ${this.period}: ${
    this.subjectName || 'Unknown'
  }`;
});

// Is currently happening
timetableSlotSchema.virtual('isNow').get(function () {
  if (!this.startTime || !this.endTime) return false;

  const now = new Date();
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const todayName = dayNames[now.getDay()];

  if (todayName !== this.day) return false;

  const [startH, startM] = this.startTime
    .split(':')
    .map(Number);
  const [endH, endM] = this.endTime
    .split(':')
    .map(Number);

  const nowMinutes =
    now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return (
    nowMinutes >= startMinutes &&
    nowMinutes <= endMinutes
  );
});

// ─── Pre-Save Hook ────────────────────────────
// Auto-set start and end times from period number
timetableSlotSchema.pre('save', function (next) {
  if (
    this.isModified('period') &&
    !this.startTime
  ) {
    const periodConfig = TIMETABLE_PERIODS.find(
      (p) => p.period === this.period
    );
    if (periodConfig) {
      this.startTime = periodConfig.startTime;
      this.endTime = periodConfig.endTime;
    }
  }
  next();
});

// ─── Static Methods ───────────────────────────

// Get all slots for a timetable
timetableSlotSchema.statics.getForTimetable =
  function (timetableId) {
    return this.find({
      timetable: timetableId,
      isActive: true,
    })
      .sort({ day: 1, period: 1 })
      .populate('subject', 'name code color icon')
      .populate(
        'teacher',
        'firstName fatherName photo'
      )
      .populate('room', 'name roomNumber floor');
  };

// Get slots for a section on a specific day
timetableSlotSchema.statics.getDaySchedule =
  function (sectionId, day, academicYearId) {
    return this.find({
      section: sectionId,
      day,
      academicYear: academicYearId,
      isActive: true,
    })
      .sort({ period: 1 })
      .populate('subject', 'name code color icon')
      .populate(
        'teacher',
        'firstName fatherName photo'
      )
      .populate('room', 'name roomNumber');
  };

// Get teacher's full schedule
timetableSlotSchema.statics.getTeacherSchedule =
  function (teacherId, academicYearId) {
    return this.find({
      teacher: teacherId,
      academicYear: academicYearId,
      isActive: true,
    })
      .sort({ day: 1, period: 1 })
      .populate('subject', 'name code color')
      .populate('section', 'fullName grade')
      .populate('room', 'name roomNumber')
      .populate('class', 'grade stream');
  };

// Get teacher schedule for a specific day
timetableSlotSchema.statics.getTeacherDaySchedule =
  function (teacherId, day, academicYearId) {
    return this.find({
      teacher: teacherId,
      day,
      academicYear: academicYearId,
      isActive: true,
    })
      .sort({ period: 1 })
      .populate('subject', 'name code color')
      .populate('section', 'fullName grade')
      .populate('room', 'name roomNumber');
  };

// Check teacher availability at specific slot
timetableSlotSchema.statics.isTeacherAvailable =
  async function (
    teacherId,
    day,
    period,
    academicYearId,
    excludeSlotId = null
  ) {
    const query = {
      teacher: teacherId,
      day,
      period,
      academicYear: academicYearId,
      isActive: true,
    };

    if (excludeSlotId) {
      query._id = { $ne: excludeSlotId };
    }

    const existing = await this.findOne(query);
    return !existing;
  };

// Check room availability at specific slot
timetableSlotSchema.statics.isRoomAvailable =
  async function (
    roomId,
    day,
    period,
    academicYearId,
    excludeSlotId = null
  ) {
    if (!roomId) return true;

    const query = {
      room: roomId,
      day,
      period,
      academicYear: academicYearId,
      isActive: true,
    };

    if (excludeSlotId) {
      query._id = { $ne: excludeSlotId };
    }

    const existing = await this.findOne(query);
    return !existing;
  };

// Check for all conflicts in a timetable
timetableSlotSchema.statics.detectConflicts =
  async function (timetableId) {
    const slots = await this.find({
      timetable: timetableId,
      isActive: true,
    });

    const conflicts = [];
    const teacherSlots = {};
    const roomSlots = {};

    slots.forEach((slot) => {
      // Check teacher double-booking
      const teacherKey = `${slot.teacher}-${slot.day}-${slot.period}`;
      if (teacherSlots[teacherKey]) {
        conflicts.push({
          type: 'teacher_double_booking',
          day: slot.day,
          period: slot.period,
          description: `Teacher double-booked on ${slot.day} Period ${slot.period}`,
          slotId: slot._id,
          conflictingSlotId:
            teacherSlots[teacherKey],
        });
        slot.hasConflict = true;
        slot.conflictType = 'teacher_double_booking';
      } else {
        teacherSlots[teacherKey] = slot._id;
      }

      // Check room double-booking
      if (slot.room) {
        const roomKey = `${slot.room}-${slot.day}-${slot.period}`;
        if (roomSlots[roomKey]) {
          conflicts.push({
            type: 'room_double_booking',
            day: slot.day,
            period: slot.period,
            description: `Room double-booked on ${slot.day} Period ${slot.period}`,
            slotId: slot._id,
            conflictingSlotId: roomSlots[roomKey],
          });
          slot.hasConflict = true;
          slot.conflictType = 'room_double_booking';
        } else {
          roomSlots[roomKey] = slot._id;
        }
      }
    });

    // Save conflict flags on affected slots
    await Promise.all(
      slots
        .filter((s) => s.hasConflict)
        .map((s) =>
          s.save({ validateBeforeSave: false })
        )
    );

    return conflicts;
  };

// Assign substitute teacher for a slot
timetableSlotSchema.statics.assignSubstitute =
  async function (
    slotId,
    substituteTeacherId,
    substituteTeacherName,
    reason
  ) {
    return this.findByIdAndUpdate(
      slotId,
      {
        isSubstituted: true,
        substituteTeacher: substituteTeacherId,
        substituteTeacherName,
        substitutionDate: new Date(),
        substitutionReason: reason,
      },
      { new: true }
    );
  };

// Get slots for a specific subject across all sections
timetableSlotSchema.statics.getSubjectSlots =
  function (subjectId, academicYearId) {
    return this.find({
      subject: subjectId,
      academicYear: academicYearId,
      isActive: true,
    })
      .sort({ day: 1, period: 1 })
      .populate('section', 'fullName grade')
      .populate(
        'teacher',
        'firstName fatherName'
      )
      .populate('room', 'name roomNumber');
  };

// Count weekly periods for teacher
timetableSlotSchema.statics.countTeacherWeeklyPeriods =
  async function (teacherId, academicYearId) {
    return this.countDocuments({
      teacher: teacherId,
      academicYear: academicYearId,
      isActive: true,
    });
  };

// Count weekly periods for subject in a section
timetableSlotSchema.statics.countSubjectPeriodsForSection =
  async function (
    subjectId,
    sectionId,
    academicYearId
  ) {
    return this.countDocuments({
      subject: subjectId,
      section: sectionId,
      academicYear: academicYearId,
      isActive: true,
    });
  };

// Get today's schedule for a section
timetableSlotSchema.statics.getTodaySchedule =
  function (sectionId, academicYearId) {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const today = dayNames[new Date().getDay()];

    return this.getDaySchedule(
      sectionId,
      today,
      academicYearId
    );
  };

// Get current period for a section
timetableSlotSchema.statics.getCurrentPeriod =
  async function (sectionId, academicYearId) {
    const now = new Date();
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const today = dayNames[now.getDay()];
    const currentTime = `${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const slots = await this.find({
      section: sectionId,
      day: today,
      academicYear: academicYearId,
      isActive: true,
    })
      .populate('subject', 'name code color')
      .populate(
        'teacher',
        'firstName fatherName'
      )
      .populate('room', 'name roomNumber');

    return slots.find((slot) => {
      return (
        slot.startTime <= currentTime &&
        slot.endTime >= currentTime
      );
    }) || null;
  };

// Bulk create slots for a timetable
timetableSlotSchema.statics.bulkCreate =
  async function (slotsData) {
    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const slotData of slotsData) {
      try {
        await this.findOneAndUpdate(
          {
            timetable: slotData.timetable,
            day: slotData.day,
            period: slotData.period,
          },
          slotData,
          { upsert: true, new: true }
        );
        results.created++;
      } catch (error) {
        results.errors.push({
          slot: slotData,
          error: error.message,
        });
      }
    }

    return results;
  };

// Clear all slots for a timetable
timetableSlotSchema.statics.clearTimetable =
  async function (timetableId) {
    return this.deleteMany({
      timetable: timetableId,
    });
  };

// Get subject distribution for a section's timetable
timetableSlotSchema.statics.getSubjectDistribution =
  async function (timetableId) {
    return this.aggregate([
      {
        $match: {
          timetable: new mongoose.Types.ObjectId(
            timetableId
          ),
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$subject',
          subjectName: { $first: '$subjectName' },
          subjectCode: { $first: '$subjectCode' },
          subjectColor: {
            $first: '$subjectColor',
          },
          teacherName: { $first: '$teacherName' },
          periodsCount: { $sum: 1 },
          days: { $addToSet: '$day' },
        },
      },
      {
        $sort: { periodsCount: -1 },
      },
    ]);
  };

// Get weekly summary for a teacher
timetableSlotSchema.statics.getTeacherWeeklySummary =
  async function (teacherId, academicYearId) {
    return this.aggregate([
      {
        $match: {
          teacher: new mongoose.Types.ObjectId(
            teacherId
          ),
          academicYear: new mongoose.Types.ObjectId(
            academicYearId
          ),
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$day',
          periods: { $sum: 1 },
          subjects: { $addToSet: '$subjectName' },
          sections: { $addToSet: '$sectionName' },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  };

// ─── Instance Methods ─────────────────────────

// Check if this slot conflicts with another
timetableSlotSchema.methods.conflictsWith =
  function (otherSlot) {
    if (
      this.day !== otherSlot.day ||
      this.period !== otherSlot.period
    ) {
      return false;
    }

    // Same teacher at same time
    if (
      this.teacher.toString() ===
      otherSlot.teacher.toString()
    ) {
      return true;
    }

    // Same room at same time
    if (
      this.room &&
      otherSlot.room &&
      this.room.toString() ===
        otherSlot.room.toString()
    ) {
      return true;
    }

    return false;
  };

// Get time range string
timetableSlotSchema.methods.getTimeRange =
  function () {
    if (!this.startTime || !this.endTime) return '';
    return `${this.startTime}–${this.endTime}`;
  };

// Get display string
timetableSlotSchema.methods.getDisplay = function () {
  return `${this.subjectName || 'Unknown'} — ${
    this.teacherName || 'Unknown'
  } (${this.getTimeRange()})`;
};

// ─── Create Model ─────────────────────────────
const TimetableSlot = mongoose.model(
  'TimetableSlot',
  timetableSlotSchema
);

module.exports = TimetableSlot;