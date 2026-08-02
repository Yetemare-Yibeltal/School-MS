// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// NOTIFICATION MODEL
// kat-school/server/src/models/Notification.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    // ─── Recipient ────────────────────────────
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },

    recipientRole: {
      type: String,
      trim: true,
    },

    // ─── Notification Content ─────────────────
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: '{VALUE} is not a valid type',
      },
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    // ─── Action ──────────────────────────────
    // Link to navigate to when notification is clicked
    actionUrl: {
      type: String,
      trim: true,
      default: null,
    },

    actionLabel: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Related Resource ─────────────────────
    // What triggered this notification
    resourceType: {
      type: String,
      enum: [
        'student',
        'teacher',
        'employee',
        'attendance',
        'fee',
        'fee_payment',
        'exam',
        'result',
        'report_card',
        'leave',
        'message',
        'notice',
        'event',
        'payroll',
        'book',
        'book_issue',
        'timetable',
        'suspension',
        'system',
        'ai',
        'other',
        '',
      ],
      default: '',
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // ─── Sender ──────────────────────────────
    // Who triggered this notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    senderName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Priority & Display ───────────────────
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    icon: {
      type: String,
      trim: true,
      default: 'bell',
    },

    color: {
      type: String,
      default: '#4f46e5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },

    // ─── Read Status ──────────────────────────
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // ─── Delivery Channels ────────────────────
    // Whether sent via SMS
    smsSent: {
      type: Boolean,
      default: false,
    },

    smsSentAt: {
      type: Date,
      default: null,
    },

    // Whether sent via email
    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
      default: null,
    },

    // Whether sent via push notification
    pushSent: {
      type: Boolean,
      default: false,
    },

    pushSentAt: {
      type: Date,
      default: null,
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
    },

    // ─── Expiry ──────────────────────────────
    // TTL — auto-delete after 90 days
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },

    // ─── Status ──────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── TTL Index ────────────────────────────────
notificationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'notification_expiry_ttl',
  }
);

// ─── Compound Indexes ─────────────────────────
notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  type: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  isDeleted: 1,
  createdAt: -1,
});

notificationSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Time ago display
notificationSchema.virtual('timeAgo').get(function () {
  const diff = Date.now() - new Date(this.createdAt);
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hrs > 0) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  if (mins > 0) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  return 'just now';
});

// ─── Static Methods ───────────────────────────

// Create a notification
notificationSchema.statics.create_ = async function ({
  recipientId,
  recipientRole = null,
  type,
  title,
  message,
  actionUrl = null,
  actionLabel = null,
  resourceType = '',
  resourceId = null,
  senderId = null,
  senderName = null,
  priority = 'medium',
  icon = 'bell',
  color = '#4f46e5',
  academicYearId = null,
  sendSMS = false,
  sendEmail = false,
}) {
  try {
    const notification = await this.create({
      recipient: recipientId,
      recipientRole,
      type,
      title,
      message,
      actionUrl,
      actionLabel,
      resourceType,
      resourceId,
      sender: senderId,
      senderName,
      priority,
      icon,
      color,
      academicYear: academicYearId,
      smsSent: sendSMS,
      smsSentAt: sendSMS ? new Date() : null,
      emailSent: sendEmail,
      emailSentAt: sendEmail ? new Date() : null,
    });

    // Update user unread count
    await mongoose
      .model('User')
      .findByIdAndUpdate(recipientId, { $inc: { unreadNotifications: 1 } });

    return notification;
  } catch (error) {
    console.error('❌ Notification creation failed:', error.message);
    return null;
  }
};

// Bulk create notifications (for sending to multiple users)
notificationSchema.statics.bulkCreate = async function (notifications) {
  try {
    const created = await this.insertMany(notifications, { ordered: false });

    // Update unread counts for all recipients
    const recipientIds = [...new Set(notifications.map((n) => n.recipient.toString()))];

    await Promise.all(
      recipientIds.map((id) =>
        mongoose.model('User').findByIdAndUpdate(id, {
          $inc: { unreadNotifications: 1 },
        })
      )
    );

    return created;
  } catch (error) {
    console.error('❌ Bulk notification failed:', error.message);
    return [];
  }
};

// Get notifications for a user
notificationSchema.statics.getForUser = function (
  userId,
  page = 1,
  limit = 20,
  unreadOnly = false
) {
  const query = {
    recipient: userId,
    isDeleted: false,
  };

  if (unreadOnly) query.isRead = false;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-__v');
};

// Get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isDeleted: false,
  });
};

// Mark single notification as read
notificationSchema.statics.markRead = async function (notificationId, userId) {
  const notification = await this.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    },
    { new: true }
  );

  if (notification) {
    await mongoose.model('User').findByIdAndUpdate(userId, {
      $inc: { unreadNotifications: -1 },
    });
  }

  return notification;
};

// Mark all notifications as read for a user
notificationSchema.statics.markAllRead = async function (userId) {
  const result = await this.updateMany(
    {
      recipient: userId,
      isRead: false,
      isDeleted: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  // Reset unread count
  await mongoose.model('User').findByIdAndUpdate(userId, {
    unreadNotifications: 0,
  });

  return result;
};

// Delete a notification (soft delete)
notificationSchema.statics.softDelete = async function (notificationId, userId) {
  const notification = await this.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    { new: true }
  );

  // Decrement unread if it was unread
  if (notification && !notification.isRead) {
    await mongoose.model('User').findByIdAndUpdate(userId, {
      $inc: { unreadNotifications: -1 },
    });
  }

  return notification;
};

// Clear all notifications for a user
notificationSchema.statics.clearAll = async function (userId) {
  await this.updateMany(
    { recipient: userId },
    {
      isDeleted: true,
      deletedAt: new Date(),
    }
  );

  await mongoose.model('User').findByIdAndUpdate(userId, {
    unreadNotifications: 0,
  });
};

// Get recent notifications for dashboard bell
notificationSchema.statics.getRecent = function (userId, limit = 10) {
  return this.find({
    recipient: userId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('type title message isRead readAt actionUrl icon color priority createdAt');
};

// Notify all users of a specific role
notificationSchema.statics.notifyByRole = async function (role, notificationData) {
  const User = mongoose.model('User');
  const users = await User.find({
    role,
    isActive: true,
  }).select('_id');

  const notifications = users.map((user) => ({
    ...notificationData,
    recipient: user._id,
  }));

  return this.bulkCreate(notifications);
};

// Get dashboard stats
notificationSchema.statics.getDashboardStats = async function (userId) {
  const [total, unread, byType] = await Promise.all([
    this.countDocuments({
      recipient: userId,
      isDeleted: false,
    }),
    this.countDocuments({
      recipient: userId,
      isRead: false,
      isDeleted: false,
    }),
    this.aggregate([
      {
        $match: {
          recipient: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return { total, unread, byType };
};

// ─── Instance Methods ─────────────────────────

// Mark this notification as read
notificationSchema.methods.markAsRead = async function () {
  if (this.isRead) return this;

  this.isRead = true;
  this.readAt = new Date();
  await this.save({ validateBeforeSave: false });

  await mongoose.model('User').findByIdAndUpdate(this.recipient, {
    $inc: { unreadNotifications: -1 },
  });

  return this;
};

// ─── Create Model ─────────────────────────────
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
