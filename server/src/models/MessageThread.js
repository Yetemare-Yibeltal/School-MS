// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// MESSAGE THREAD MODEL
// kat-school/server/src/models/MessageThread.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const messageThreadSchema = new mongoose.Schema(
  {
    // ─── Thread Type ──────────────────────────
    type: {
      type: String,
      enum: {
        values: ['direct', 'group', 'broadcast'],
        message: '{VALUE} is not a valid thread type',
      },
      default: 'direct',
      index: true,
    },

    // ─── Subject ─────────────────────────────
    subject: {
      type: String,
      trim: true,
      maxlength: [
        200,
        'Subject cannot exceed 200 characters',
      ],
      default: null,
    },

    // ─── Participants ─────────────────────────
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],

    // Participant details cached for display
    participantDetails: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: { type: String, trim: true },
        role: { type: String, trim: true },
        photo: { url: { type: String } },
        // When they left the thread (for groups)
        leftAt: { type: Date, default: null },
        // Unread count for this participant
        unreadCount: { type: Number, default: 0 },
        // Last read message timestamp
        lastReadAt: { type: Date, default: null },
        // Whether notifications are muted
        isMuted: { type: Boolean, default: false },
      },
    ],

    // ─── Group Settings ───────────────────────
    // For group threads
    groupName: {
      type: String,
      trim: true,
      maxlength: [
        100,
        'Group name cannot exceed 100 characters',
      ],
      default: null,
    },

    groupDescription: {
      type: String,
      trim: true,
      default: null,
    },

    groupAvatar: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    // Who created this thread/group
    createdByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Group admin
    groupAdmin: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ─── Last Message Preview ─────────────────
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    lastMessageContent: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },

    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    lastMessageSenderName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Message Count ────────────────────────
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Context ─────────────────────────────
    // Linked to a student (parent-teacher thread)
    relatedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },

    relatedStudentName: {
      type: String,
      trim: true,
      default: null,
    },

    // Thread context/purpose
    context: {
      type: String,
      enum: [
        'general',
        'academic',
        'attendance',
        'fees',
        'behavior',
        'health',
        'parent_teacher',
        'staff',
        'other',
        '',
      ],
      default: 'general',
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
    },

    // ─── Status ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
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
messageThreadSchema.index({
  participants: 1,
  isActive: 1,
});
messageThreadSchema.index({
  participants: 1,
  lastMessageAt: -1,
});
messageThreadSchema.index({ type: 1, isActive: 1 });
messageThreadSchema.index({
  relatedStudent: 1,
});
messageThreadSchema.index({ lastMessageAt: -1 });
messageThreadSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Is direct message thread
messageThreadSchema.virtual('isDirect').get(
  function () {
    return this.type === 'direct';
  }
);

// Is group thread
messageThreadSchema.virtual('isGroup').get(
  function () {
    return this.type === 'group';
  }
);

// Participant count
messageThreadSchema.virtual('participantCount').get(
  function () {
    return this.participants
      ? this.participants.length
      : 0;
  }
);

// ─── Static Methods ───────────────────────────

// Find or create a direct thread between two users
messageThreadSchema.statics.findOrCreateDirect =
  async function ({
    userId1,
    user1Name,
    user1Role,
    user1Photo,
    userId2,
    user2Name,
    user2Role,
    user2Photo,
    subject = null,
    context = 'general',
    relatedStudentId = null,
    relatedStudentName = null,
    academicYearId = null,
    createdBy,
  }) {
    // Look for existing thread between these two users
    const existing = await this.findOne({
      type: 'direct',
      isActive: true,
      participants: {
        $all: [userId1, userId2],
        $size: 2,
      },
      ...(relatedStudentId
        ? { relatedStudent: relatedStudentId }
        : {}),
    });

    if (existing) {
      return { thread: existing, isNew: false };
    }

    // Create new thread
    const thread = await this.create({
      type: 'direct',
      subject,
      context,
      participants: [userId1, userId2],
      participantDetails: [
        {
          user: userId1,
          name: user1Name,
          role: user1Role,
          photo: { url: user1Photo || null },
          unreadCount: 0,
          lastReadAt: new Date(),
        },
        {
          user: userId2,
          name: user2Name,
          role: user2Role,
          photo: { url: user2Photo || null },
          unreadCount: 0,
          lastReadAt: new Date(),
        },
      ],
      relatedStudent: relatedStudentId,
      relatedStudentName,
      academicYear: academicYearId,
      createdByUser: createdBy,
      createdBy,
    });

    return { thread, isNew: true };
  };

// Create a group thread
messageThreadSchema.statics.createGroup =
  async function ({
    groupName,
    groupDescription,
    participants,
    participantDetails,
    context = 'general',
    academicYearId = null,
    createdBy,
  }) {
    const thread = await this.create({
      type: 'group',
      groupName,
      groupDescription,
      participants,
      participantDetails,
      groupAdmin: [createdBy],
      context,
      academicYear: academicYearId,
      createdByUser: createdBy,
      createdBy,
    });

    return thread;
  };

// Get all threads for a user (inbox)
messageThreadSchema.statics.getInbox =
  function (userId, page = 1, limit = 20) {
    return this.find({
      participants: userId,
      isActive: true,
      isArchived: false,
    })
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(
        'lastMessage',
        'content messageType createdAt'
      )
      .populate(
        'relatedStudent',
        'firstName fatherName studentId'
      );
  };

// Get unread count for a user
messageThreadSchema.statics.getUnreadCount =
  async function (userId) {
    const threads = await this.find({
      participants: userId,
      isActive: true,
    }).select('participantDetails');

    let total = 0;
    threads.forEach((thread) => {
      const participant =
        thread.participantDetails.find(
          (p) =>
            p.user &&
            p.user.toString() === userId.toString()
        );
      if (participant) {
        total += participant.unreadCount || 0;
      }
    });

    return total;
  };

// Mark thread as read for a user
messageThreadSchema.statics.markAsRead =
  async function (threadId, userId) {
    return this.findOneAndUpdate(
      {
        _id: threadId,
        'participantDetails.user': userId,
      },
      {
        $set: {
          'participantDetails.$.unreadCount': 0,
          'participantDetails.$.lastReadAt':
            new Date(),
        },
      },
      { new: true }
    );
  };

// Increment unread count for all participants
// except the sender
messageThreadSchema.statics.incrementUnread =
  async function (threadId, senderId) {
    return this.findOneAndUpdate(
      {
        _id: threadId,
        'participantDetails.user': {
          $ne: senderId,
        },
      },
      {
        $inc: {
          'participantDetails.$[elem].unreadCount': 1,
        },
      },
      {
        arrayFilters: [
          { 'elem.user': { $ne: senderId } },
        ],
        new: true,
      }
    );
  };

// Add participant to group thread
messageThreadSchema.statics.addParticipant =
  async function (
    threadId,
    userId,
    userName,
    userRole,
    userPhoto
  ) {
    return this.findByIdAndUpdate(
      threadId,
      {
        $addToSet: { participants: userId },
        $push: {
          participantDetails: {
            user: userId,
            name: userName,
            role: userRole,
            photo: { url: userPhoto || null },
            unreadCount: 0,
            lastReadAt: new Date(),
          },
        },
      },
      { new: true }
    );
  };

// Remove participant from group thread
messageThreadSchema.statics.removeParticipant =
  async function (threadId, userId) {
    return this.findOneAndUpdate(
      { _id: threadId },
      {
        $pull: { participants: userId },
        $set: {
          'participantDetails.$[elem].leftAt':
            new Date(),
        },
      },
      {
        arrayFilters: [{ 'elem.user': userId }],
        new: true,
      }
    );
  };

// Search threads for a user
messageThreadSchema.statics.search =
  function (userId, searchTerm) {
    return this.find({
      participants: userId,
      isActive: true,
      $or: [
        {
          subject: {
            $regex: searchTerm,
            $options: 'i',
          },
        },
        {
          groupName: {
            $regex: searchTerm,
            $options: 'i',
          },
        },
        {
          lastMessageContent: {
            $regex: searchTerm,
            $options: 'i',
          },
        },
        {
          'participantDetails.name': {
            $regex: searchTerm,
            $options: 'i',
          },
        },
        {
          relatedStudentName: {
            $regex: searchTerm,
            $options: 'i',
          },
        },
      ],
    })
      .sort({ lastMessageAt: -1 })
      .limit(20);
  };

// Archive a thread for a user
messageThreadSchema.statics.archiveThread =
  async function (threadId) {
    return this.findByIdAndUpdate(
      threadId,
      {
        isArchived: true,
        archivedAt: new Date(),
      },
      { new: true }
    );
  };

// Get dashboard stats
messageThreadSchema.statics.getDashboardStats =
  async function (userId) {
    const [total, unread, direct, group] =
      await Promise.all([
        this.countDocuments({
          participants: userId,
          isActive: true,
        }),
        this.getUnreadCount(userId),
        this.countDocuments({
          participants: userId,
          type: 'direct',
          isActive: true,
        }),
        this.countDocuments({
          participants: userId,
          type: 'group',
          isActive: true,
        }),
      ]);

    return { total, unread, direct, group };
  };

// ─── Instance Methods ─────────────────────────

// Get thread display name for a specific user
// (shows the other participant's name for direct threads)
messageThreadSchema.methods.getDisplayName =
  function (currentUserId) {
    if (this.type === 'group') {
      return this.groupName || 'Group';
    }

    const other = this.participantDetails.find(
      (p) =>
        p.user &&
        p.user.toString() !== currentUserId.toString()
    );

    return other ? other.name : 'Unknown';
  };

// Get unread count for a specific user
messageThreadSchema.methods.getUnreadForUser =
  function (userId) {
    const participant = this.participantDetails.find(
      (p) =>
        p.user &&
        p.user.toString() === userId.toString()
    );
    return participant
      ? participant.unreadCount || 0
      : 0;
  };

// Check if user is admin of group thread
messageThreadSchema.methods.isGroupAdmin =
  function (userId) {
    return this.groupAdmin.some(
      (id) => id.toString() === userId.toString()
    );
  };

// Check if user is a participant
messageThreadSchema.methods.hasParticipant =
  function (userId) {
    return this.participants.some(
      (id) => id.toString() === userId.toString()
    );
  };

// ─── Create Model ─────────────────────────────
const MessageThread = mongoose.model(
  'MessageThread',
  messageThreadSchema
);

module.exports = MessageThread;