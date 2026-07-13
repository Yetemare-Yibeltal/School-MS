// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ATTENDANCE SETTINGS MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');

const attendanceSettingsSchema = new mongoose.Schema(
  {
    // ─── Singleton Key ────────────────────────
    // Only one settings document should exist
    key: {
      type: String,
      default: 'attendance_settings',
      unique: true,
    },

    // ─── School Timing ────────────────────────
    // Official school start time
    schoolStartTime: {
      type: String,
      default: '07:45',
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
    },

    // Official school end time
    schoolEndTime: {
      type: String,
      default: '17:00',
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
    },

    // Time after which student is marked late
    lateThresholdMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 60,
    },

    // Grace period before marking absent
    gracePeriodMinutes: {
      type: Number,
      default: 30,
      min: 0,
      max: 120,
    },

    // ─── Working Days ─────────────────────────
    workingDays: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false },
    },

    // ─── Minimum Attendance ───────────────────
    // Minimum percentage to sit final exam
    minimumAttendanceForExam: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },

    // Minimum percentage to be promoted
    minimumAttendanceForPromotion: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },

    // Warning threshold percentage
    // Below this students get warning
    warningThreshold: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },

    // Critical threshold percentage
    // Below this admin is alerted
    criticalThreshold: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },

    // ─── Parent Notification ──────────────────
    // Whether to auto-notify parents on absence
    autoNotifyParents: {
      type: Boolean,
      default: true,
    },

    // When to send notification
    notificationTiming: {
      type: String,
      enum: ['immediately', 'end_of_day', 'next_morning'],
      default: 'immediately',
    },

    // Notification methods
    notificationMethods: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
    },

    // Notify after how many consecutive absences
    consecutiveAbsenceAlert: {
      type: Number,
      default: 3,
      min: 1,
      max: 30,
    },

    // ─── Attendance Marking Rules ─────────────
    // Whether teachers can edit past attendance
    allowPastAttendanceEdit: {
      type: Boolean,
      default: true,
    },

    // How many days back can attendance be edited
    pastEditLimitDays: {
      type: Number,
      default: 7,
      min: 0,
      max: 30,
    },

    // Whether admin approval needed for edits
    requireAdminApprovalForEdit: {
      type: Boolean,
      default: false,
    },

    // Deadline for marking daily attendance (HH:MM)
    markingDeadlineTime: {
      type: String,
      default: '10:00',
      trim: true,
    },

    // Whether to lock attendance after deadline
    lockAfterDeadline: {
      type: Boolean,
      default: false,
    },

    // ─── Holiday Settings ─────────────────────
    // Whether to auto-mark holidays
    autoMarkHolidays: {
      type: Boolean,
      default: true,
    },

    // Whether holidays count as present days
    holidaysCountAsPresent: {
      type: Boolean,
      default: false,
    },

    // ─── Period-wise Attendance ───────────────
    // Whether to track period-wise attendance
    trackPeriodAttendance: {
      type: Boolean,
      default: false,
    },

    // Minimum periods required to be marked present
    minimumPeriodsForPresent: {
      type: Number,
      default: 4,
      min: 1,
      max: 12,
    },

    // ─── Report Generation ────────────────────
    // Whether to auto-generate monthly reports
    autoGenerateMonthlyReports: {
      type: Boolean,
      default: true,
    },

    // Day of month to generate reports
    reportGenerationDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 28,
    },

    // ─── Teacher Attendance Settings ──────────
    // Expected working hours per day for teachers
    expectedTeacherHours: {
      type: Number,
      default: 8,
      min: 1,
      max: 12,
    },

    // Expected working hours for other staff
    expectedStaffHours: {
      type: Number,
      default: 8,
      min: 1,
      max: 12,
    },

    // Whether to track working hours
    trackWorkingHours: {
      type: Boolean,
      default: true,
    },

    // ─── Salary Deduction Rules ───────────────
    // Whether absent days affect salary
    absentAffectsSalary: {
      type: Boolean,
      default: true,
    },

    // Whether late arrivals affect salary
    lateAffectsSalary: {
      type: Boolean,
      default: false,
    },

    // How many late arrivals = 1 absent day
    lateCountsAsAbsent: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },

    // ─── Status ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ─── Last Updated By ──────────────────────
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

// ─── Virtuals ─────────────────────────────────
// School day duration in hours
attendanceSettingsSchema.virtual('schoolDayHours').get(function () {
  if (!this.schoolStartTime || !this.schoolEndTime) return 8;

  const [sh, sm] = this.schoolStartTime.split(':').map(Number);
  const [eh, em] = this.schoolEndTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return (endMinutes - startMinutes) / 60;
});

// Working days array
attendanceSettingsSchema.virtual('workingDaysArray').get(function () {
  const days = [];
  const dayMap = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  Object.entries(this.workingDays).forEach(([key, value]) => {
    if (value) days.push(dayMap[key]);
  });
  return days;
});

// ─── Static Methods ───────────────────────────

// Get settings (always returns the single document)
attendanceSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({
    key: 'attendance_settings',
  });

  if (!settings) {
    settings = await this.create({
      key: 'attendance_settings',
    });
    console.info('✅ Default attendance settings created');
  }

  return settings;
};

// Update settings
attendanceSettingsSchema.statics.updateSettings = async function (updates, userId) {
  let settings = await this.findOne({
    key: 'attendance_settings',
  });

  if (!settings) {
    settings = new this({
      key: 'attendance_settings',
    });
  }

  Object.assign(settings, updates);
  settings.updatedBy = userId;
  await settings.save();
  return settings;
};

// Seed default settings
attendanceSettingsSchema.statics.seedDefaults = async function () {
  const existing = await this.findOne({
    key: 'attendance_settings',
  });

  if (existing) {
    console.info('✅ Attendance settings already exist');
    return existing;
  }

  const settings = await this.create({
    key: 'attendance_settings',
    schoolStartTime: '07:45',
    schoolEndTime: '17:00',
    lateThresholdMinutes: 15,
    gracePeriodMinutes: 30,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    minimumAttendanceForExam: 75,
    minimumAttendanceForPromotion: 75,
    warningThreshold: 85,
    criticalThreshold: 75,
    autoNotifyParents: true,
    notificationTiming: 'immediately',
    notificationMethods: {
      sms: true,
      email: false,
    },
    consecutiveAbsenceAlert: 3,
    allowPastAttendanceEdit: true,
    pastEditLimitDays: 7,
    requireAdminApprovalForEdit: false,
    markingDeadlineTime: '10:00',
    lockAfterDeadline: false,
    autoMarkHolidays: true,
    holidaysCountAsPresent: false,
    trackPeriodAttendance: false,
    minimumPeriodsForPresent: 4,
    autoGenerateMonthlyReports: true,
    reportGenerationDay: 1,
    expectedTeacherHours: 8,
    expectedStaffHours: 8,
    trackWorkingHours: true,
    absentAffectsSalary: true,
    lateAffectsSalary: false,
    lateCountsAsAbsent: 3,
  });

  console.info('✅ Default attendance settings seeded');
  return settings;
};

// ─── Instance Methods ─────────────────────────

// Check if a time is late based on settings
attendanceSettingsSchema.methods.isLateArrival = function (arrivalTime) {
  if (!arrivalTime || !this.schoolStartTime) return false;

  const [sh, sm] = this.schoolStartTime.split(':').map(Number);
  const [ah, am] = arrivalTime.split(':').map(Number);

  const startMinutes = sh * 60 + sm;
  const arrivalMinutes = ah * 60 + am;
  const diffMinutes = arrivalMinutes - startMinutes;

  return diffMinutes > this.lateThresholdMinutes;
};

// Check if attendance can still be marked
attendanceSettingsSchema.methods.canMarkAttendance = function (date = new Date()) {
  if (!this.lockAfterDeadline) return true;

  const now = new Date();
  const [dh, dm] = this.markingDeadlineTime.split(':').map(Number);
  const deadlineMinutes = dh * 60 + dm;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Same day check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  if (attendanceDate.getTime() === today.getTime()) {
    return currentMinutes <= deadlineMinutes;
  }

  // Past dates — check edit limit
  const dayDiff = Math.floor((today - attendanceDate) / (1000 * 60 * 60 * 24));
  return this.allowPastAttendanceEdit && dayDiff <= this.pastEditLimitDays;
};

// Check if a day is a working day
attendanceSettingsSchema.methods.isWorkingDay = function (date) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[new Date(date).getDay()];
  return this.workingDays[dayName] || false;
};

// Get minimum attendance percentage
attendanceSettingsSchema.methods.getMinAttendance = function () {
  return this.minimumAttendanceForExam;
};

// Check if student attendance is low
attendanceSettingsSchema.methods.isLowAttendance = function (percentage) {
  return percentage < this.criticalThreshold;
};

// Check if student needs warning
attendanceSettingsSchema.methods.needsWarning = function (percentage) {
  return percentage < this.warningThreshold && percentage >= this.criticalThreshold;
};

// ─── Create Model ─────────────────────────────
const AttendanceSettings = mongoose.model('AttendanceSettings', attendanceSettingsSchema);

module.exports = AttendanceSettings;
