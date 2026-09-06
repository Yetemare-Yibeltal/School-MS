// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SETTINGS MODEL
// kat-school/server/src/models/Settings.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // ─── Singleton Key ────────────────────────
    key: {
      type: String,
      default: 'system_settings',
      unique: true,
    },

    // ─── School Information ───────────────────
    schoolName: {
      type: String,
      default: 'Kat Secondary School',
      trim: true,
    },

    schoolNameAmharic: {
      type: String,
      default: 'ካት ሁለተኛ ደረጃ ትምህርት ቤት',
      trim: true,
    },

    schoolCode: {
      type: String,
      trim: true,
      default: 'KAT-SEC-001',
    },

    schoolMotto: {
      type: String,
      trim: true,
      default: 'Excellence in Education',
    },

    schoolType: {
      type: String,
      enum: ['Government', 'Private', 'Non-Governmental', 'Religious'],
      default: 'Private',
    },

    schoolLevel: {
      type: String,
      enum: ['Primary', 'Secondary', 'Primary & Secondary'],
      default: 'Secondary',
    },

    // ─── Contact Information ──────────────────
    schoolAddress: {
      type: String,
      trim: true,
      default: 'Addis Ababa, Ethiopia',
    },

    schoolRegion: {
      type: String,
      trim: true,
      default: 'Addis Ababa',
    },

    schoolWoreda: {
      type: String,
      trim: true,
      default: null,
    },

    schoolKebele: {
      type: String,
      trim: true,
      default: null,
    },

    schoolPhone: {
      type: String,
      trim: true,
      default: null,
    },

    schoolAlternatePhone: {
      type: String,
      trim: true,
      default: null,
    },

    schoolEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    schoolWebsite: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Branding ────────────────────────────
    logoUrl: {
      type: String,
      default: null,
    },

    logoPublicId: {
      type: String,
      default: null,
    },

    faviconUrl: {
      type: String,
      default: null,
    },

    primaryColor: {
      type: String,
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color'],
    },

    secondaryColor: {
      type: String,
      default: '#7c3aed',
    },

    // ─── Academic Settings ────────────────────
    currentAcademicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
    },

    currentAcademicYearName: {
      type: String,
      trim: true,
      default: null,
    },

    currentTerm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      default: null,
    },

    currentTermName: {
      type: String,
      trim: true,
      default: null,
    },

    gradesOffered: {
      type: [String],
      default: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    },

    numberOfTermsPerYear: {
      type: Number,
      default: 3,
      min: 1,
      max: 4,
    },

    // ─── Grading Settings ─────────────────────
    gradingSystem: {
      caWeight: { type: Number, default: 50 },
      examWeight: { type: Number, default: 50 },
      passingScore: { type: Number, default: 50 },
      minimumAttendance: {
        type: Number,
        default: 75,
      },
    },

    // ─── Attendance Settings ──────────────────
    schoolStartTime: {
      type: String,
      default: '07:45',
    },

    schoolEndTime: {
      type: String,
      default: '17:00',
    },

    workingDays: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false },
    },

    // ─── Fee Settings ─────────────────────────
    currency: {
      type: String,
      default: 'ETB',
    },

    currencySymbol: {
      type: String,
      default: 'ብር',
    },

    lateFinePerDay: {
      type: Number,
      default: 2,
    },

    feeReceiptPrefix: {
      type: String,
      default: 'RCP',
    },

    // ─── Library Settings ─────────────────────
    maxBooksPerStudent: {
      type: Number,
      default: 2,
    },

    maxBooksPerTeacher: {
      type: Number,
      default: 5,
    },

    defaultLoanDaysStudent: {
      type: Number,
      default: 14,
    },

    defaultLoanDaysTeacher: {
      type: Number,
      default: 30,
    },

    libraryFinePerDay: {
      type: Number,
      default: 2,
    },

    // ─── Notification Settings ────────────────
    enableSMSNotifications: {
      type: Boolean,
      default: false,
    },

    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },

    enablePushNotifications: {
      type: Boolean,
      default: false,
    },

    smsProvider: {
      type: String,
      enum: ['twilio', 'africastalking', 'none'],
      default: 'none',
    },

    notifyParentsOnAbsence: {
      type: Boolean,
      default: true,
    },

    notifyParentsOnLateArrival: {
      type: Boolean,
      default: false,
    },

    notifyParentsOnFeeOverdue: {
      type: Boolean,
      default: true,
    },

    notifyParentsOnResults: {
      type: Boolean,
      default: true,
    },

    // ─── AI Settings ──────────────────────────
    enableAI: {
      type: Boolean,
      default: true,
    },

    aiProvider: {
      type: String,
      enum: ['anthropic', 'openai', 'both'],
      default: 'both',
    },

    enableAINoticeWriter: {
      type: Boolean,
      default: true,
    },

    enableAIReportComments: {
      type: Boolean,
      default: true,
    },

    enableAIChatbot: {
      type: Boolean,
      default: true,
    },

    enableAIPerformancePredictor: {
      type: Boolean,
      default: true,
    },

    enableAITimetableGenerator: {
      type: Boolean,
      default: true,
    },

    enableAIBookRecommender: {
      type: Boolean,
      default: true,
    },

    enableAIFeePredictor: {
      type: Boolean,
      default: true,
    },

    enableAIAttendanceAnalyzer: {
      type: Boolean,
      default: true,
    },

    enableAIExamGenerator: {
      type: Boolean,
      default: true,
    },

    // ─── Security Settings ────────────────────
    sessionTimeoutMinutes: {
      type: Number,
      default: 60,
    },

    maxLoginAttempts: {
      type: Number,
      default: 5,
    },

    accountLockDurationMinutes: {
      type: Number,
      default: 30,
    },

    requirePasswordChange: {
      type: Boolean,
      default: true,
    },

    passwordChangeDays: {
      type: Number,
      default: 90,
    },

    twoFactorAuthEnabled: {
      type: Boolean,
      default: false,
    },

    // ─── System Settings ──────────────────────
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    maintenanceMessage: {
      type: String,
      trim: true,
      default: 'System is under maintenance. Please try again later.',
    },

    allowStudentRegistration: {
      type: Boolean,
      default: false,
    },

    allowParentPortal: {
      type: Boolean,
      default: true,
    },

    allowStudentPortal: {
      type: Boolean,
      default: true,
    },

    // ─── Report Card Settings ─────────────────
    reportCardHeader: {
      type: String,
      trim: true,
      default: 'Federal Democratic Republic of Ethiopia',
    },

    reportCardFooter: {
      type: String,
      trim: true,
      default: null,
    },

    showRankOnReportCard: {
      type: Boolean,
      default: true,
    },

    showAttendanceOnReportCard: {
      type: Boolean,
      default: true,
    },

    showExtraCurricularOnReportCard: {
      type: Boolean,
      default: true,
    },

    // ─── Payroll Settings ─────────────────────
    payrollDay: {
      type: Number,
      default: 28,
      min: 1,
      max: 31,
    },

    incomeTaxEnabled: {
      type: Boolean,
      default: true,
    },

    pensionEnabled: {
      type: Boolean,
      default: true,
    },

    employeePensionRate: {
      type: Number,
      default: 7,
    },

    employerPensionRate: {
      type: Number,
      default: 11,
    },

    // ─── Social Media ─────────────────────────
    facebookUrl: {
      type: String,
      trim: true,
      default: null,
    },

    telegramUrl: {
      type: String,
      trim: true,
      default: null,
    },

    youtubeUrl: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Last Updated ─────────────────────────
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    lastUpdatedByName: {
      type: String,
      trim: true,
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
settingsSchema.virtual('workingDaysArray').get(function () {
  const days = [];
  const map = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };
  Object.entries(this.workingDays).forEach(([key, val]) => {
    if (val) days.push(map[key]);
  });
  return days;
});

// ─── Static Methods ───────────────────────────
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({
    key: 'system_settings',
  });
  if (!settings) {
    settings = await this.create({
      key: 'system_settings',
    });
    console.info('✅ Default system settings created');
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function (updates, userId, userName) {
  let settings = await this.findOne({
    key: 'system_settings',
  });
  if (!settings) {
    settings = new this({ key: 'system_settings' });
  }
  Object.assign(settings, updates);
  settings.lastUpdatedBy = userId;
  settings.lastUpdatedByName = userName;
  await settings.save();
  return settings;
};

settingsSchema.statics.seedDefaults = async function () {
  const existing = await this.findOne({
    key: 'system_settings',
  });
  if (existing) {
    console.info('✅ Settings already exist');
    return existing;
  }
  const settings = await this.create({
    key: 'system_settings',
  });
  console.info('✅ Default settings seeded');
  return settings;
};

settingsSchema.statics.isMaintenanceMode = async function () {
  const settings = await this.findOne({
    key: 'system_settings',
  }).select('maintenanceMode maintenanceMessage');
  return settings
    ? {
        active: settings.maintenanceMode,
        message: settings.maintenanceMessage,
      }
    : { active: false, message: '' };
};

settingsSchema.statics.updateCurrentYear = async function (yearId, yearName, termId, termName) {
  return this.findOneAndUpdate(
    { key: 'system_settings' },
    {
      currentAcademicYear: yearId,
      currentAcademicYearName: yearName,
      currentTerm: termId,
      currentTermName: termName,
    },
    { new: true }
  );
};

// ─── Instance Methods ─────────────────────────
settingsSchema.methods.isFeatureEnabled = function (feature) {
  const featureMap = {
    ai: this.enableAI,
    sms: this.enableSMSNotifications,
    email: this.enableEmailNotifications,
    push: this.enablePushNotifications,
    parentPortal: this.allowParentPortal,
    studentPortal: this.allowStudentPortal,
    aiChatbot: this.enableAIChatbot,
    aiNotice: this.enableAINoticeWriter,
    aiReport: this.enableAIReportComments,
    aiTimetable: this.enableAITimetableGenerator,
    aiPredictor: this.enableAIPerformancePredictor,
    aiBook: this.enableAIBookRecommender,
    aiFee: this.enableAIFeePredictor,
    aiAttendance: this.enableAIAttendanceAnalyzer,
    aiExam: this.enableAIExamGenerator,
  };
  return featureMap[feature] !== undefined ? featureMap[feature] : false;
};

// ─── Create Model ─────────────────────────────
const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
