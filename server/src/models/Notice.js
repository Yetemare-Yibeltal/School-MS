// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// NOTICE MODEL
// kat-school/server/src/models/Notice.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { NOTICE_CATEGORIES, GRADE_NAMES } = require('../config/constants');

const noticeSchema = new mongoose.Schema(
  {
    // ─── Notice Identity ──────────────────────
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
      index: true,
    },

    // Short summary/subtitle
    summary: {
      type: String,
      trim: true,
      maxlength: [500, 'Summary cannot exceed 500 characters'],
    },

    // Full notice content (HTML or plain text)
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },

    // ─── Category ────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: Object.values(NOTICE_CATEGORIES),
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },

    // ─── Priority ────────────────────────────
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
      index: true,
    },

    // ─── Target Audience ──────────────────────
    targetAudience: {
      type: [String],
      required: [true, 'Target audience is required'],
      enum: {
        values: ['all', 'students', 'parents', 'teachers', 'employees', 'staff', 'management'],
        message: '{VALUE} is not a valid target audience',
      },
      default: ['all'],
    },

    // Specific grades targeted (empty = all grades)
    targetGrades: {
      type: [String],
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      default: [],
    },

    // Specific sections targeted
    targetSections: {
      type: [String],
      default: [],
    },

    // ─── Dates ───────────────────────────────
    publishDate: {
      type: Date,
      required: [true, 'Publish date is required'],
      default: Date.now,
      index: true,
    },

    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },

    // ─── Attachments ─────────────────────────
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String },
        publicId: { type: String },
        fileType: { type: String, trim: true },
        fileSize: { type: Number, default: 0 },
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

    // ─── AI Generation ───────────────────────
    isAIGenerated: {
      type: Boolean,
      default: false,
    },

    aiPrompt: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Publishing ───────────────────────────
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'scheduled', 'archived', 'recalled'],
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

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Notification ─────────────────────────
    // Whether to send SMS/email notification
    sendNotification: {
      type: Boolean,
      default: false,
    },

    notificationSent: {
      type: Boolean,
      default: false,
    },

    notificationSentAt: {
      type: Date,
      default: null,
    },

    notificationMethod: {
      type: [String],
      enum: ['sms', 'email', 'push', 'in_app'],
      default: ['in_app'],
    },

    // ─── Engagement Stats ─────────────────────
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    viewedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: { type: Date },
      },
    ],

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

    // ─── Author ──────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },

    authorName: {
      type: String,
      trim: true,
    },

    authorRole: {
      type: String,
      trim: true,
    },

    // ─── Pinned ──────────────────────────────
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    pinnedUntil: {
      type: Date,
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
noticeSchema.index({ status: 1, publishDate: -1 });
noticeSchema.index({
  targetAudience: 1,
  status: 1,
});
noticeSchema.index({ isPinned: 1, publishDate: -1 });
noticeSchema.index({ academicYear: 1 });
noticeSchema.index({ priority: 1, status: 1 });
noticeSchema.index({ expiryDate: 1, status: 1 });
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({
  title: 'text',
  content: 'text',
  summary: 'text',
  tags: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Is active (published and not expired)
noticeSchema.virtual('isActive').get(function () {
  if (!this.isPublished) return false;
  if (!this.expiryDate) return true;
  return new Date(this.expiryDate) > new Date();
});

// Is expired
noticeSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date(this.expiryDate) < new Date();
});

// Is scheduled for future
noticeSchema.virtual('isScheduled').get(function () {
  return this.status === 'scheduled' && new Date(this.publishDate) > new Date();
});

// Target audience display
noticeSchema.virtual('audienceDisplay').get(function () {
  if (this.targetAudience.includes('all')) return 'Everyone';
  return this.targetAudience.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ');
});

// Days until expiry
noticeSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  if (expiry <= now) return 0;
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
});

// ─── Pre-Save Hook ────────────────────────────
noticeSchema.pre('save', function (next) {
  // Auto-set status based on publish date
  if (this.isModified('isPublished') && this.isPublished) {
    const now = new Date();
    if (new Date(this.publishDate) > now) {
      this.status = 'scheduled';
    } else {
      this.status = 'published';
      this.publishedAt = now;
    }
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Get published notices for a specific audience
noticeSchema.statics.getForAudience = function (audience, filters = {}) {
  const now = new Date();
  return this.find({
    status: 'published',
    isPublished: true,
    publishDate: { $lte: now },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    $or: [{ targetAudience: 'all' }, { targetAudience: audience }],
    ...filters,
  })
    .sort({ isPinned: -1, publishDate: -1 })
    .populate('author', 'firstName fatherName role');
};

// Get notices for a student
noticeSchema.statics.getForStudent = function (grade, section, academicYearId) {
  const now = new Date();
  const query = {
    status: 'published',
    isPublished: true,
    publishDate: { $lte: now },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    targetAudience: {
      $in: ['all', 'students', 'parents'],
    },
  };

  if (grade) {
    query.$and = [
      {
        $or: [{ targetGrades: { $size: 0 } }, { targetGrades: grade }],
      },
    ];
  }

  return this.find(query)
    .sort({ isPinned: -1, publishDate: -1 })
    .populate('author', 'firstName fatherName');
};

// Get all notices for admin
noticeSchema.statics.getAllForAdmin = function (filters = {}, page = 1, limit = 20) {
  return this.find(filters)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'firstName fatherName role')
    .populate('publishedBy', 'firstName fatherName');
};

// Get upcoming and recent notices
noticeSchema.statics.getRecent = function (limit = 10, audience = null) {
  const now = new Date();
  const query = {
    status: 'published',
    isPublished: true,
    publishDate: { $lte: now },
  };

  if (audience) {
    query.$or = [{ targetAudience: 'all' }, { targetAudience: audience }];
  }

  return this.find(query)
    .sort({ isPinned: -1, publishDate: -1 })
    .limit(limit)
    .populate('author', 'firstName fatherName role');
};

// Publish a notice
noticeSchema.statics.publish = async function (noticeId, publishedBy) {
  return this.findByIdAndUpdate(
    noticeId,
    {
      status: 'published',
      isPublished: true,
      publishedAt: new Date(),
      publishedBy,
    },
    { new: true }
  );
};

// Recall a published notice
noticeSchema.statics.recall = async function (noticeId) {
  return this.findByIdAndUpdate(
    noticeId,
    {
      status: 'recalled',
      isPublished: false,
    },
    { new: true }
  );
};

// Archive old notices
noticeSchema.statics.archiveExpired = async function () {
  return this.updateMany(
    {
      status: 'published',
      expiryDate: { $lt: new Date() },
    },
    { status: 'archived' }
  );
};

// Increment view count
noticeSchema.statics.incrementViews = async function (noticeId, userId = null) {
  const update = {
    $inc: { views: 1 },
  };

  if (userId) {
    update.$addToSet = {
      viewedBy: {
        user: userId,
        viewedAt: new Date(),
      },
    };
  }

  return this.findByIdAndUpdate(noticeId, update, { new: true });
};

// Search notices
noticeSchema.statics.search = function (searchTerm, filters = {}) {
  return this.find({
    $or: [
      {
        title: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        content: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        summary: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        tags: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
    ],
    ...filters,
  })
    .sort({ publishDate: -1 })
    .populate('author', 'firstName fatherName role');
};

// Get pinned notices
noticeSchema.statics.getPinned = function () {
  const now = new Date();
  return this.find({
    isPinned: true,
    status: 'published',
    $or: [{ pinnedUntil: null }, { pinnedUntil: { $gte: now } }],
  })
    .sort({ publishDate: -1 })
    .populate('author', 'firstName fatherName role');
};

// Get dashboard stats
noticeSchema.statics.getDashboardStats = async function (academicYearId) {
  const now = new Date();

  const [total, published, draft, scheduled, pinned, byCategory, recentViews] = await Promise.all([
    this.countDocuments({
      academicYear: academicYearId,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'published',
      isPublished: true,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'draft',
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'scheduled',
    }),
    this.countDocuments({
      isPinned: true,
      status: 'published',
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      {
        $match: {
          publishDate: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
          status: 'published',
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          noticeCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    total,
    published,
    draft,
    scheduled,
    pinned,
    byCategory,
    thisMonth: recentViews[0] || {
      totalViews: 0,
      noticeCount: 0,
    },
  };
};

// ─── Instance Methods ─────────────────────────

// Check if notice is visible to a user
noticeSchema.methods.isVisibleTo = function (role, grade = null) {
  if (!this.isActive) return false;

  // Check audience
  if (!this.targetAudience.includes('all') && !this.targetAudience.includes(role)) {
    return false;
  }

  // Check grade targeting
  if (this.targetGrades.length > 0 && grade && !this.targetGrades.includes(grade)) {
    return false;
  }

  return true;
};

// Pin the notice
noticeSchema.methods.pin = async function (pinnedUntil = null) {
  this.isPinned = true;
  this.pinnedUntil = pinnedUntil;
  await this.save();
  return this;
};

// Unpin the notice
noticeSchema.methods.unpin = async function () {
  this.isPinned = false;
  this.pinnedUntil = null;
  await this.save();
  return this;
};

// Mark as notified
noticeSchema.methods.markNotified = async function () {
  this.notificationSent = true;
  this.notificationSentAt = new Date();
  await this.save({ validateBeforeSave: false });
  return this;
};

// ─── Create Model ─────────────────────────────
const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
