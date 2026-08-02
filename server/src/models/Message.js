// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// MESSAGE MODEL
// kat-school/server/src/models/Message.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // ─── Thread Reference ─────────────────────
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageThread',
      required: [true, 'Thread reference is required'],
      index: true,
    },

    // ─── Sender ──────────────────────────────
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },

    senderName: {
      type: String,
      trim: true,
    },

    senderRole: {
      type: String,
      trim: true,
    },

    senderPhoto: {
      url: { type: String, default: null },
    },

    // ─── Content ─────────────────────────────
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },

    // Message type
    messageType: {
      type: String,
      enum: {
        values: ['text', 'image', 'document', 'audio', 'system', 'notice', 'announcement'],
        message: '{VALUE} is not a valid message type',
      },
      default: 'text',
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

    // ─── Read Status ──────────────────────────
    // Track which recipients have read this message
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: { type: Date, default: Date.now },
      },
    ],

    // Is this message read by all recipients
    isReadByAll: {
      type: Boolean,
      default: false,
    },

    // ─── Reply ───────────────────────────────
    // If this is a reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // Cached content of replied message
    replyToContent: {
      type: String,
      trim: true,
      default: null,
    },

    replyToSenderName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── AI Generation ───────────────────────
    isAIDrafted: {
      type: Boolean,
      default: false,
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

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    // ─── System Message ───────────────────────
    // For system-generated messages
    isSystemMessage: {
      type: Boolean,
      default: false,
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
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
messageSchema.index({ thread: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Is read by a specific user
messageSchema.virtual('isRead').get(function () {
  return this.readBy && this.readBy.length > 0;
});

// Has attachments
messageSchema.virtual('hasAttachments').get(function () {
  return this.attachments && this.attachments.length > 0;
});

// ─── Static Methods ───────────────────────────

// Get messages for a thread
messageSchema.statics.getForThread = function (threadId, page = 1, limit = 50) {
  return this.find({
    thread: threadId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'firstName fatherName photo role')
    .populate('replyTo', 'content senderName');
};

// Mark messages as read by a user
messageSchema.statics.markThreadAsRead = async function (threadId, userId) {
  return this.updateMany(
    {
      thread: threadId,
      isDeleted: false,
      'readBy.user': { $ne: userId },
      sender: { $ne: userId },
    },
    {
      $addToSet: {
        readBy: {
          user: userId,
          readAt: new Date(),
        },
      },
    }
  );
};

// Get unread message count for a user
messageSchema.statics.getUnreadCount = async function (userId) {
  const threads = await mongoose
    .model('MessageThread')
    .find({ participants: userId })
    .select('_id');

  const threadIds = threads.map((t) => t._id);

  return this.countDocuments({
    thread: { $in: threadIds },
    sender: { $ne: userId },
    isDeleted: false,
    'readBy.user': { $ne: userId },
  });
};

// Send a new message
messageSchema.statics.send = async function ({
  threadId,
  senderId,
  senderName,
  senderRole,
  senderPhoto,
  content,
  messageType = 'text',
  attachments = [],
  replyToId = null,
  isAIDrafted = false,
  academicYearId = null,
}) {
  let replyToContent = null;
  let replyToSenderName = null;

  if (replyToId) {
    const replyMsg = await this.findById(replyToId).select('content senderName');
    if (replyMsg) {
      replyToContent = replyMsg.content.substring(0, 100);
      replyToSenderName = replyMsg.senderName;
    }
  }

  const message = await this.create({
    thread: threadId,
    sender: senderId,
    senderName,
    senderRole,
    senderPhoto: { url: senderPhoto || null },
    content,
    messageType,
    attachments,
    replyTo: replyToId,
    replyToContent,
    replyToSenderName,
    isAIDrafted,
    academicYear: academicYearId,
    readBy: [{ user: senderId, readAt: new Date() }],
  });

  // Update thread last message
  await mongoose.model('MessageThread').findByIdAndUpdate(threadId, {
    lastMessage: message._id,
    lastMessageContent: content.substring(0, 100),
    lastMessageAt: new Date(),
    lastMessageSender: senderId,
    lastMessageSenderName: senderName,
    $inc: { messageCount: 1 },
  });

  return message;
};

// Delete a message (soft delete)
messageSchema.statics.softDelete = async function (messageId, deletedBy) {
  return this.findByIdAndUpdate(
    messageId,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
      content: 'This message was deleted',
    },
    { new: true }
  );
};

// Edit a message
messageSchema.statics.edit = async function (messageId, newContent) {
  return this.findByIdAndUpdate(
    messageId,
    {
      content: newContent,
      isEdited: true,
      editedAt: new Date(),
    },
    { new: true }
  );
};

// ─── Instance Methods ─────────────────────────

// Check if read by a specific user
messageSchema.methods.isReadBy = function (userId) {
  return this.readBy.some((r) => r.user.toString() === userId.toString());
};

// Mark as read by user
messageSchema.methods.markReadBy = async function (userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({
      user: userId,
      readAt: new Date(),
    });
    await this.save({ validateBeforeSave: false });
  }
  return this;
};

// ─── Create Model ─────────────────────────────
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
