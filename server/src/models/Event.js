// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EVENT MODEL
// kat-school/server/src/models/Event.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADE_NAMES } = require('../config/constants');

const eventSchema = new mongoose.Schema(
  {
    // ─── Event Identity ───────────────────────
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    // Short summary
    summary: {
      type: String,
      trim: true,
      maxlength: [300, 'Summary cannot exceed 300 characters'],
    },

    // ─── Event Type ───────────────────────────
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: [
          'Academic',
          'Cultural',
          'Sports',
          'Ceremony',
          'Meeting',
          'Workshop',
          'Holiday',
          'Examination',
          'Trip',
          'Exhibition',
          'Competition',
          'Other',
        ],
        message: '{VALUE} is not a valid event type',
      },
      index: true,
    },

    // ─── Date & Time ──────────────────────────
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (endDate) {
          return endDate >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },

    startTime: {
      type: String,
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
      default: null,
    },

    endTime: {
      type: String,
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
      default: null,
    },

    // Is this an all-day event
    isAllDay: {
      type: Boolean,
      default: true,
    },

    // Is this a multi-day event
    isMultiDay: {
      type: Boolean,
      default: false,
    },

    // ─── Venue ───────────────────────────────
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
      default: 'School Premises',
    },

    venueDetails: {
      type: String,
      trim: true,
      maxlength: [500, 'Venue details cannot exceed 500 characters'],
      default: null,
    },

    // Room reference if in school
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },

    // ─── Organizer ────────────────────────────
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },

    organizerName: {
      type: String,
      trim: true,
    },

    // Co-organizers
    coOrganizers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: { type: String, trim: true },
        role: { type: String, trim: true },
      },
    ],

    // ─── Target Audience ──────────────────────
    targetAudience: {
      type: [String],
      enum: {
        values: [
          'all',
          'students',
          'parents',
          'teachers',
          'employees',
          'staff',
          'management',
          'public',
        ],
        message: '{VALUE} is not a valid audience',
      },
      default: ['all'],
    },

    targetGrades: {
      type: [String],
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      default: [],
    },

    // ─── Capacity & Registration ──────────────
    hasCapacityLimit: {
      type: Boolean,
      default: false,
    },

    maxAttendees: {
      type: Number,
      default: null,
      min: 1,
    },

    currentAttendees: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Whether registration is required
    requiresRegistration: {
      type: Boolean,
      default: false,
    },

    registrationDeadline: {
      type: Date,
      default: null,
    },

    registrationLink: {
      type: String,
      trim: true,
      default: null,
    },

    // Registered attendees
    registrations: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: { type: String, trim: true },
        role: { type: String, trim: true },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        attended: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ─── Attachments ─────────────────────────
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
        fileType: { type: String, trim: true },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ─── Cover Image ──────────────────────────
    coverImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    // ─── Color ───────────────────────────────
    color: {
      type: String,
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    // ─── Recurrence ───────────────────────────
    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurrencePattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'annually', ''],
      default: '',
    },

    parentEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },

    // ─── Notification ─────────────────────────
    sendReminder: {
      type: Boolean,
      default: true,
    },

    reminderDaysBefore: {
      type: Number,
      default: 1,
      min: 0,
      max: 30,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },

    reminderSentAt: {
      type: Date,
      default: null,
    },

    notificationSent: {
      type: Boolean,
      default: false,
    },

    notificationSentAt: {
      type: Date,
      default: null,
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
      index: true,
    },

    academicYearName: {
      type: String,
      trim: true,
      default: null,
    },

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      default: null,
    },

    termName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Status ──────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'cancelled', 'postponed', 'completed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    // Cancellation details
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Tags ────────────────────────────────
    tags: {
      type: [String],
      default: [],
    },

    // ─── Notes ───────────────────────────────
    internalNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Internal notes cannot exceed 500 characters'],
      default: null,
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
eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({
  targetAudience: 1,
  status: 1,
});
eventSchema.index({ academicYear: 1 });
eventSchema.index({ isPublished: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Is upcoming
eventSchema.virtual('isUpcoming').get(function () {
  return new Date(this.startDate) > new Date() && this.status === 'published';
});

// Is today
eventSchema.virtual('isToday').get(function () {
  const today = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return today >= start && today <= end;
});

// Is ongoing
eventSchema.virtual('isOngoing').get(function () {
  const now = new Date();
  return (
    new Date(this.startDate) <= now && new Date(this.endDate) >= now && this.status === 'published'
  );
});

// Is past
eventSchema.virtual('isPast').get(function () {
  return new Date(this.endDate) < new Date();
});

// Duration in days
eventSchema.virtual('durationDays').get(function () {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
});

// Days until event
eventSchema.virtual('daysUntil').get(function () {
  const now = new Date();
  const start = new Date(this.startDate);
  if (start <= now) return 0;
  return Math.ceil((start - now) / (1000 * 60 * 60 * 24));
});

// Available spots
eventSchema.virtual('availableSpots').get(function () {
  if (!this.hasCapacityLimit) return null;
  return Math.max(0, (this.maxAttendees || 0) - this.currentAttendees);
});

// Is at capacity
eventSchema.virtual('isAtCapacity').get(function () {
  if (!this.hasCapacityLimit) return false;
  return this.currentAttendees >= this.maxAttendees;
});

// ─── Pre-Save Hook ────────────────────────────
eventSchema.pre('save', function (next) {
  // Auto-detect multi-day event
  if (this.isModified('startDate') || this.isModified('endDate')) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    this.isMultiDay = end.getTime() > start.getTime();
  }

  // Auto-set isAllDay
  if (this.startTime && this.endTime) {
    this.isAllDay = false;
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Get upcoming events
eventSchema.statics.getUpcoming = function (filters = {}, limit = 10) {
  const now = new Date();
  return this.find({
    startDate: { $gte: now },
    status: 'published',
    isPublished: true,
    ...filters,
  })
    .sort({ startDate: 1 })
    .limit(limit)
    .populate('organizer', 'firstName fatherName');
};

// Get events for calendar view (date range)
eventSchema.statics.getForCalendar = function (startDate, endDate, filters = {}) {
  return this.find({
    status: 'published',
    isPublished: true,
    $or: [
      {
        startDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
      {
        endDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
      {
        startDate: {
          $lte: new Date(startDate),
        },
        endDate: { $gte: new Date(endDate) },
      },
    ],
    ...filters,
  })
    .sort({ startDate: 1 })
    .populate('organizer', 'firstName fatherName');
};

// Get today's events
eventSchema.statics.getToday = function (filters = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    status: 'published',
    isPublished: true,
    startDate: { $lte: tomorrow },
    endDate: { $gte: today },
    ...filters,
  })
    .sort({ startTime: 1 })
    .populate('organizer', 'firstName fatherName');
};

// Get events for a specific audience
eventSchema.statics.getForAudience = function (audience, grade = null) {
  const now = new Date();
  const query = {
    status: 'published',
    isPublished: true,
    endDate: { $gte: now },
    $or: [{ targetAudience: 'all' }, { targetAudience: audience }, { targetAudience: 'public' }],
  };

  if (grade) {
    query.$and = [
      {
        $or: [{ targetGrades: { $size: 0 } }, { targetGrades: grade }],
      },
    ];
  }

  return this.find(query).sort({ startDate: 1 }).populate('organizer', 'firstName fatherName');
};

// Get all events for admin
eventSchema.statics.getAllForAdmin = function (filters = {}, page = 1, limit = 20) {
  return this.find(filters)
    .sort({ startDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('organizer', 'firstName fatherName')
    .populate('createdBy', 'firstName fatherName');
};

// Publish event
eventSchema.statics.publish = async function (eventId) {
  return this.findByIdAndUpdate(
    eventId,
    {
      status: 'published',
      isPublished: true,
      publishedAt: new Date(),
    },
    { new: true }
  );
};

// Cancel event
eventSchema.statics.cancel = async function (eventId, reason, cancelledBy) {
  return this.findByIdAndUpdate(
    eventId,
    {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy,
    },
    { new: true }
  );
};

// Get events requiring reminders
eventSchema.statics.getDueForReminder = async function () {
  const now = new Date();
  const reminders = await this.find({
    status: 'published',
    isPublished: true,
    sendReminder: true,
    reminderSent: false,
  });

  return reminders.filter((event) => {
    const reminderDate = new Date(event.startDate);
    reminderDate.setDate(reminderDate.getDate() - (event.reminderDaysBefore || 1));
    return reminderDate <= now;
  });
};

// Mark reminder sent
eventSchema.statics.markReminderSent = async function (eventId) {
  return this.findByIdAndUpdate(
    eventId,
    {
      reminderSent: true,
      reminderSentAt: new Date(),
    },
    { new: true }
  );
};

// Mark as completed
eventSchema.statics.markCompleted = async function (eventId) {
  return this.findByIdAndUpdate(eventId, { status: 'completed' }, { new: true });
};

// Get dashboard stats
eventSchema.statics.getDashboardStats = async function (academicYearId) {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [total, upcoming, today_count, cancelled, byType, nextEvent] = await Promise.all([
    this.countDocuments({
      academicYear: academicYearId,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'published',
      startDate: { $gt: now },
    }),
    this.countDocuments({
      status: 'published',
      startDate: { $lte: tomorrow },
      endDate: { $gte: today },
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'cancelled',
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    this.findOne({
      status: 'published',
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .select('title startDate endDate type color'),
  ]);

  return {
    total,
    upcoming,
    today: today_count,
    cancelled,
    byType,
    nextEvent,
  };
};

// ─── Instance Methods ─────────────────────────

// Register a user for the event
eventSchema.methods.registerAttendee = async function (userId, name, role) {
  // Check capacity
  if (this.hasCapacityLimit && this.currentAttendees >= this.maxAttendees) {
    return {
      success: false,
      message: 'Event is at full capacity',
    };
  }

  // Check if already registered
  const existing = this.registrations.find((r) => r.user.toString() === userId.toString());

  if (existing) {
    return {
      success: false,
      message: 'Already registered for this event',
    };
  }

  // Check registration deadline
  if (this.registrationDeadline && new Date(this.registrationDeadline) < new Date()) {
    return {
      success: false,
      message: 'Registration deadline has passed',
    };
  }

  this.registrations.push({
    user: userId,
    name,
    role,
    registeredAt: new Date(),
    attended: false,
  });

  this.currentAttendees += 1;
  await this.save();

  return { success: true, message: 'Registered successfully' };
};

// Mark attendance for a registered user
eventSchema.methods.markAttendance = async function (userId) {
  const registration = this.registrations.find((r) => r.user.toString() === userId.toString());

  if (!registration) {
    return {
      success: false,
      message: 'Not registered for this event',
    };
  }

  registration.attended = true;
  await this.save();
  return { success: true };
};

// Check if user is registered
eventSchema.methods.isRegistered = function (userId) {
  return this.registrations.some((r) => r.user.toString() === userId.toString());
};

// Get date/time display
eventSchema.methods.getDateTimeDisplay = function () {
  const start = new Date(this.startDate).toLocaleDateString('en-ET', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (this.isAllDay) {
    if (!this.isMultiDay) return start;
    const end = new Date(this.endDate).toLocaleDateString('en-ET', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `${start} – ${end}`;
  }

  return `${start} ${this.startTime || ''} – ${this.endTime || ''}`;
};

// ─── Create Model ─────────────────────────────
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
