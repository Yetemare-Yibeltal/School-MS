// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// COMMUNICATION CONTROLLER
// kat-school/server/src/controllers/communication.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const Event = require('../models/Event');
const Message = require('../models/Message');
const MessageThread = require('../models/MessageThread');
const Notification = require('../models/Notification');
const Document = require('../models/Document');
const Suspension = require('../models/Suspension');
const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const User = require('../models/User');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS, NOTICE_CATEGORIES } = require('../config/constants');
const { buildSearchQuery, buildDateRangeFilter } = require('../utils/pagination.util');
const { notifySuspension, bulkNotify } = require('../utils/notification.util');
const { uploadToCloudinary, FOLDERS, deleteFromCloudinary } = require('../utils/fileUpload.util');

// ═══════════════════════════════════════════
// NOTICE
// ═══════════════════════════════════════════

exports.createNotice = catchAsync(async (req, res) => {
  const {
    title,
    summary,
    content,
    category,
    priority,
    targetAudience,
    targetGrades,
    targetSections,
    publishDate,
    expiryDate,
    sendNotification,
    notificationMethod,
    isPinned,
    pinnedUntil,
    tags,
    internalNotes,
    academicYear,
    term,
    isAIGenerated,
    aiPrompt,
  } = req.body;

  let academicYearId = academicYear;
  let academicYearName = null;

  if (!academicYearId) {
    const currentYear = await AcademicYear.getCurrent();
    academicYearId = currentYear?._id;
    academicYearName = currentYear?.name;
  } else {
    const yearDoc = await AcademicYear.findById(academicYearId);
    academicYearName = yearDoc?.name;
  }

  const publishAt = publishDate ? new Date(publishDate) : new Date();
  const isScheduled = publishAt > new Date();
  const isPublished = !isScheduled && !req.body.saveDraft;

  const notice = await Notice.create({
    title,
    summary,
    content,
    category,
    priority: priority || 'medium',
    targetAudience: targetAudience || ['all'],
    targetGrades: targetGrades || [],
    targetSections: targetSections || [],
    publishDate: publishAt,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    sendNotification: sendNotification || false,
    notificationMethod: notificationMethod || ['in_app'],
    isPinned: isPinned || false,
    pinnedUntil: pinnedUntil ? new Date(pinnedUntil) : null,
    tags: tags || [],
    internalNotes: internalNotes || null,
    academicYear: academicYearId,
    academicYearName,
    term: term || null,
    isAIGenerated: isAIGenerated || false,
    aiPrompt: aiPrompt || null,
    author: req.user._id,
    authorName: `${req.user.firstName} ${req.user.fatherName}`,
    authorRole: req.user.role,
    status: req.body.saveDraft ? 'draft' : isScheduled ? 'scheduled' : 'published',
    isPublished: isPublished && !isScheduled,
    publishedAt: isPublished && !isScheduled ? new Date() : null,
    publishedBy: isPublished && !isScheduled ? req.user._id : null,
    views: 0,
    createdBy: req.user._id,
  });

  // Bulk notify if sendNotification is true and it's published now
  if (sendNotification && !isScheduled && !req.body.saveDraft) {
    setImmediate(async () => {
      try {
        const roleMap = {
          all: [
            'admin',
            'teacher',
            'student',
            'parent',
            'accountant',
            'librarian',
            'hr_manager',
            'receptionist',
          ],
          students: ['student'],
          parents: ['parent'],
          teachers: ['teacher'],
          staff: ['teacher', 'accountant', 'librarian', 'hr_manager', 'receptionist'],
          management: ['admin', 'super_admin'],
        };

        const roles = [];
        (targetAudience || ['all']).forEach((aud) => {
          if (roleMap[aud]) roles.push(...roleMap[aud]);
        });

        const uniqueRoles = [...new Set(roles)];
        const users = await User.find({
          role: { $in: uniqueRoles },
          isActive: true,
        })
          .select('_id')
          .lean();

        if (users.length > 0) {
          await bulkNotify(
            users.map((u) => u._id),
            {
              type: 'NOTICE_PUBLISHED',
              title: `New Notice: ${title}`,
              message: summary || content.substring(0, 100),
              actionUrl: `/notices/${notice._id}`,
              actionLabel: 'Read Notice',
              resourceId: notice._id,
            }
          );
        }
      } catch (err) {
        console.error('Notice notification failed:', err.message);
      }
    });
  }

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'notice',
    resourceId: notice._id,
    description: `Notice created: ${title} (${category}) — Status: ${notice.status}`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `Notice ${notice.status === 'draft' ? 'saved as draft' : notice.status === 'scheduled' ? 'scheduled' : 'published'}.`,
    data: { notice },
  });
});

exports.getAllNotices = catchAsync(async (req, res) => {
  const {
    status,
    category,
    priority,
    targetAudience,
    grade,
    academicYear,
    search,
    page = 1,
    limit = 20,
    sort = 'publishDate',
    order = 'desc',
    isPinned,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (isPinned !== undefined) filter.isPinned = isPinned === 'true';

  if (targetAudience) {
    filter.$or = [{ targetAudience: 'all' }, { targetAudience: targetAudience }];
  }

  if (grade) {
    filter.$and = [
      {
        $or: [{ targetGrades: { $size: 0 } }, { targetGrades: grade }],
      },
    ];
  }

  if (academicYear) {
    filter.academicYear = academicYear;
  }

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['title', 'summary', 'content', 'tags']));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'firstName fatherName role photo')
      .select('-viewedBy -internalNotes -content')
      .lean(),
    Notice.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notices fetched.',
    data: { notices },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPreviousPage: parseInt(page) > 1,
    },
  });
});

exports.getPublishedNotices = catchAsync(async (req, res) => {
  const { audience, grade, limit = 20 } = req.query;
  const now = new Date();

  const filter = {
    status: 'published',
    isPublished: true,
    publishDate: { $lte: now },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
  };

  if (audience) {
    filter.$or = [{ targetAudience: 'all' }, { targetAudience: audience }];
  }

  if (grade) {
    filter.$and = [
      {
        $or: [{ targetGrades: { $size: 0 } }, { targetGrades: grade }],
      },
    ];
  }

  const notices = await Notice.find(filter)
    .sort({ isPinned: -1, publishDate: -1 })
    .limit(parseInt(limit))
    .populate('author', 'firstName fatherName role')
    .select(
      'title summary category priority publishDate expiryDate isPinned targetAudience targetGrades views tags author attachments coverImage'
    )
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Published notices fetched.',
    data: { notices },
  });
});

exports.getNoticeById = catchAsync(async (req, res) => {
  const notice = await Notice.findById(req.params.id)
    .populate('author', 'firstName fatherName role photo')
    .lean();

  if (!notice) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Notice not found.',
    });
  }

  // Increment view count
  await Notice.incrementViews(notice._id, req.user?._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notice fetched.',
    data: { notice },
  });
});

exports.updateNotice = catchAsync(async (req, res) => {
  const forbiddenFields = ['author', 'views', 'viewedBy', 'createdBy'];
  forbiddenFields.forEach((f) => delete req.body[f]);

  const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!notice) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Notice not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notice updated.',
    data: { notice },
  });
});

exports.publishNotice = catchAsync(async (req, res) => {
  const notice = await Notice.publish(req.params.id, req.user._id);
  if (!notice) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Notice not found.' });
  }

  await auditLog({
    req,
    action: 'PUBLISH',
    resource: 'notice',
    resourceId: notice._id,
    description: `Notice published: ${notice.title}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notice published.',
    data: { notice },
  });
});

exports.recallNotice = catchAsync(async (req, res) => {
  const notice = await Notice.recall(req.params.id);
  if (!notice) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Notice not found.' });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notice recalled.',
    data: { notice },
  });
});

exports.deleteNotice = catchAsync(async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notice deleted.',
  });
});

exports.pinNotice = catchAsync(async (req, res) => {
  const { pinnedUntil } = req.body;
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Notice not found.' });
  }
  await notice.pin(pinnedUntil ? new Date(pinnedUntil) : null);
  return res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: 'Notice pinned.', data: { notice } });
});

exports.unpinNotice = catchAsync(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Notice not found.' });
  }
  await notice.unpin();
  return res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: 'Notice unpinned.', data: { notice } });
});

exports.getNoticeDashboard = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();
  const stats = await Notice.getDashboardStats(currentYear?._id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notice dashboard fetched.',
    data: stats,
  });
});

// ═══════════════════════════════════════════
// EVENT
// ═══════════════════════════════════════════

exports.createEvent = catchAsync(async (req, res) => {
  const {
    title,
    description,
    summary,
    type,
    startDate,
    endDate,
    startTime,
    endTime,
    isAllDay,
    venue,
    venueDetails,
    room,
    organizer,
    coOrganizers,
    targetAudience,
    targetGrades,
    hasCapacityLimit,
    maxAttendees,
    requiresRegistration,
    registrationDeadline,
    color,
    isRecurring,
    recurrencePattern,
    sendReminder,
    reminderDaysBefore,
    tags,
    internalNotes,
    academicYear,
    term,
  } = req.body;

  let academicYearId = academicYear;
  let academicYearName = null;

  if (!academicYearId) {
    const currentYear = await AcademicYear.getCurrent();
    academicYearId = currentYear?._id;
    academicYearName = currentYear?.name;
  } else {
    const yearDoc = await AcademicYear.findById(academicYearId);
    academicYearName = yearDoc?.name;
  }

  let termName = null;
  if (term) {
    const termDoc = await Term.findById(term);
    termName = termDoc?.name;
  }

  const organizerId = organizer || req.user._id;
  const organizerDoc = await User.findById(organizerId).select('firstName fatherName').lean();

  const event = await Event.create({
    title,
    description,
    summary,
    type,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    startTime: startTime || null,
    endTime: endTime || null,
    isAllDay: isAllDay !== false,
    venue: venue || 'School Premises',
    venueDetails: venueDetails || null,
    room: room || null,
    organizer: organizerId,
    organizerName: organizerDoc ? `${organizerDoc.firstName} ${organizerDoc.fatherName}` : null,
    coOrganizers: coOrganizers || [],
    targetAudience: targetAudience || ['all'],
    targetGrades: targetGrades || [],
    hasCapacityLimit: hasCapacityLimit || false,
    maxAttendees: maxAttendees || null,
    requiresRegistration: requiresRegistration || false,
    registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
    color: color || '#4f46e5',
    isRecurring: isRecurring || false,
    recurrencePattern: recurrencePattern || '',
    sendReminder: sendReminder !== false,
    reminderDaysBefore: reminderDaysBefore || 1,
    tags: tags || [],
    internalNotes: internalNotes || null,
    academicYear: academicYearId,
    academicYearName,
    term: term || null,
    termName,
    status: 'draft',
    isPublished: false,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'event',
    resourceId: event._id,
    description: `Event created: ${title} (${type}) on ${startDate}`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Event created.',
    data: { event },
  });
});

exports.getAllEvents = catchAsync(async (req, res) => {
  const {
    status,
    type,
    audience,
    grade,
    academicYear,
    search,
    page = 1,
    limit = 20,
    startDate,
    endDate,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  if (audience) {
    filter.$or = [{ targetAudience: 'all' }, { targetAudience: audience }];
  }

  if (grade) {
    filter.$and = [{ $or: [{ targetGrades: { $size: 0 } }, { targetGrades: grade }] }];
  }

  if (academicYear) filter.academicYear = academicYear;

  if (startDate || endDate) {
    const sf = buildDateRangeFilter(startDate, endDate, 'startDate');
    Object.assign(filter, sf);
  }

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['title', 'description', 'venue', 'tags']));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('organizer', 'firstName fatherName photo')
      .lean(),
    Event.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Events fetched.',
    data: { events },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getEventById = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'firstName fatherName photo role')
    .populate('room', 'name code capacity')
    .lean();

  if (!event) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Event not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Event fetched.',
    data: { event },
  });
});

exports.updateEvent = catchAsync(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!event) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Event not found.' });
  }
  return res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: 'Event updated.', data: { event } });
});

exports.deleteEvent = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Event not found.' });
  }
  await Event.cancel(event._id, 'Deleted', req.user._id);
  return res.status(HTTP_STATUS.OK).json({ success: true, message: 'Event cancelled.' });
});

exports.publishEvent = catchAsync(async (req, res) => {
  const event = await Event.publish(req.params.id);
  if (!event) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Event not found.' });
  }
  return res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: 'Event published.', data: { event } });
});

exports.registerForEvent = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Event not found.' });
  }

  const result = await event.registerAttendee(
    req.user._id,
    `${req.user.firstName} ${req.user.fatherName}`,
    req.user.role
  );

  if (!result.success) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: result.message });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Registered for event.',
    data: { event },
  });
});

exports.getCalendar = catchAsync(async (req, res) => {
  const { startDate, endDate, audience, grade } = req.query;

  if (!startDate || !endDate) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'startDate and endDate are required.',
    });
  }

  const filter = {
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
    ],
  };

  if (audience) {
    filter.$or = [{ targetAudience: 'all' }, { targetAudience: audience }];
  }

  if (grade) {
    filter.$and = [{ $or: [{ targetGrades: { $size: 0 } }, { targetGrades: grade }] }];
  }

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .select('title type startDate endDate startTime endTime isAllDay color venue status')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Calendar events fetched.',
    data: { events },
  });
});

exports.getEventDashboard = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();
  const stats = await Event.getDashboardStats(currentYear?._id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Event dashboard fetched.',
    data: stats,
  });
});

// ═══════════════════════════════════════════
// MESSAGING
// ═══════════════════════════════════════════

exports.sendMessage = catchAsync(async (req, res) => {
  const {
    recipientId,
    subject,
    content,
    messageType,
    attachments,
    replyToId,
    context,
    relatedStudentId,
    relatedStudentName,
  } = req.body;

  const recipient = await User.findById(recipientId)
    .select('firstName fatherName role photo')
    .lean();
  if (!recipient) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Recipient not found.' });
  }

  const currentYear = await AcademicYear.getCurrent();

  // Find or create thread
  const { thread, isNew } = await MessageThread.findOrCreateDirect({
    userId1: req.user._id,
    user1Name: `${req.user.firstName} ${req.user.fatherName}`,
    user1Role: req.user.role,
    user1Photo: req.user.photo?.url,
    userId2: recipientId,
    user2Name: `${recipient.firstName} ${recipient.fatherName}`,
    user2Role: recipient.role,
    user2Photo: recipient.photo?.url,
    subject: subject || null,
    context: context || 'general',
    relatedStudentId: relatedStudentId || null,
    relatedStudentName: relatedStudentName || null,
    academicYearId: currentYear?._id,
    createdBy: req.user._id,
  });

  // Send message
  const message = await Message.send({
    threadId: thread._id,
    senderId: req.user._id,
    senderName: `${req.user.firstName} ${req.user.fatherName}`,
    senderRole: req.user.role,
    senderPhoto: req.user.photo?.url,
    content,
    messageType: messageType || 'text',
    attachments: attachments || [],
    replyToId: replyToId || null,
    academicYearId: currentYear?._id,
  });

  // Update unread count for recipient
  await MessageThread.incrementUnread(thread._id, req.user._id);

  // In-app notification
  try {
    const Notification_ = require('../models/Notification');
    await Notification_.create_({
      recipientId,
      type: 'NEW_MESSAGE',
      title: `New message from ${req.user.firstName} ${req.user.fatherName}`,
      message: content.substring(0, 100),
      actionUrl: `/messages/thread/${thread._id}`,
      actionLabel: 'Reply',
      resourceId: thread._id,
      senderName: `${req.user.firstName} ${req.user.fatherName}`,
    });
  } catch (err) {
    console.error('Message notification failed:', err.message);
  }

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Message sent.',
    data: { message, thread, isNewThread: isNew },
  });
});

exports.getInbox = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const threads = await MessageThread.getInbox(req.user._id, parseInt(page), parseInt(limit));
  const unreadCount = await MessageThread.getUnreadCount(req.user._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Inbox fetched.',
    data: { threads, unreadCount },
  });
});

exports.getThreadMessages = catchAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const thread = await MessageThread.findById(req.params.threadId);

  if (!thread) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Thread not found.' });
  }

  if (!thread.hasParticipant(req.user._id)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Access denied.' });
  }

  const messages = await Message.getForThread(thread._id, parseInt(page), parseInt(limit));

  // Mark as read
  await Message.markThreadAsRead(thread._id, req.user._id);
  await MessageThread.markAsRead(thread._id, req.user._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Messages fetched.',
    data: {
      thread,
      messages,
      displayName: thread.getDisplayName(req.user._id),
    },
  });
});

exports.replyToThread = catchAsync(async (req, res) => {
  const { content, messageType, attachments, replyToId } = req.body;
  const thread = await MessageThread.findById(req.params.threadId);

  if (!thread) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Thread not found.' });
  }

  if (!thread.hasParticipant(req.user._id)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Access denied.' });
  }

  const currentYear = await AcademicYear.getCurrent();

  const message = await Message.send({
    threadId: thread._id,
    senderId: req.user._id,
    senderName: `${req.user.firstName} ${req.user.fatherName}`,
    senderRole: req.user.role,
    senderPhoto: req.user.photo?.url,
    content,
    messageType: messageType || 'text',
    attachments: attachments || [],
    replyToId: replyToId || null,
    academicYearId: currentYear?._id,
  });

  await MessageThread.incrementUnread(thread._id, req.user._id);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Reply sent.',
    data: { message },
  });
});

exports.searchThreads = catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ success: false, message: 'Search query is required.' });
  }
  const threads = await MessageThread.search(req.user._id, q);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Threads searched.',
    data: { threads },
  });
});

exports.deleteMessage = catchAsync(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Message not found.' });
  }
  if (message.sender.toString() !== req.user._id.toString()) {
    return res
      .status(HTTP_STATUS.FORBIDDEN)
      .json({ success: false, message: 'You can only delete your own messages.' });
  }
  await Message.softDelete(req.params.messageId, req.user._id);
  return res.status(HTTP_STATUS.OK).json({ success: true, message: 'Message deleted.' });
});

// ═══════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════

exports.getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const notifications = await Notification.getForUser(
    req.user._id,
    parseInt(page),
    parseInt(limit),
    unreadOnly === 'true'
  );

  const unreadCount = await Notification.getUnreadCount(req.user._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notifications fetched.',
    data: { notifications, unreadCount },
  });
});

exports.markNotificationRead = catchAsync(async (req, res) => {
  const notification = await Notification.markRead(req.params.id, req.user._id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notification marked as read.',
    data: { notification },
  });
});

exports.markAllNotificationsRead = catchAsync(async (req, res) => {
  await Notification.markAllRead(req.user._id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'All notifications marked as read.',
  });
});

exports.deleteNotification = catchAsync(async (req, res) => {
  await Notification.softDelete(req.params.id, req.user._id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notification deleted.',
  });
});

exports.clearAllNotifications = catchAsync(async (req, res) => {
  await Notification.clearAll(req.user._id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'All notifications cleared.',
  });
});

// ═══════════════════════════════════════════
// DOCUMENT
// ═══════════════════════════════════════════

exports.uploadDocument = catchAsync(async (req, res) => {
  const {
    name,
    documentType,
    ownerType,
    student,
    teacher,
    employee,
    guardian,
    ownerName,
    ownerId,
    issueDate,
    expiryDate,
    documentNumber,
    issuedBy,
    isVisibleToOwner,
    isConfidential,
    academicYear,
    notes,
  } = req.body;

  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Please upload a document file.',
    });
  }

  const folderMap = {
    student: FOLDERS.STUDENT_DOCUMENTS,
    teacher: FOLDERS.TEACHER_DOCUMENTS,
    employee: FOLDERS.EMPLOYEE_DOCUMENTS,
    guardian: FOLDERS.STUDENT_DOCUMENTS,
    school: FOLDERS.SCHOOL,
  };

  const uploadResult = await uploadToCloudinary(
    req.file.path,
    folderMap[ownerType] || FOLDERS.SCHOOL,
    { resource_type: 'auto' }
  );

  if (!uploadResult.success) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Document upload failed.',
    });
  }

  const academicYearDoc = academicYear ? await AcademicYear.findById(academicYear) : null;

  const document = await Document.create({
    name,
    documentType,
    ownerType,
    student: student || null,
    teacher: teacher || null,
    employee: employee || null,
    guardian: guardian || null,
    ownerName: ownerName || null,
    ownerId: ownerId || null,
    url: uploadResult.url,
    publicId: uploadResult.publicId,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    fileExtension: req.file.originalname.split('.').pop().toLowerCase(),
    issueDate: issueDate ? new Date(issueDate) : null,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    documentNumber: documentNumber || null,
    issuedBy: issuedBy || null,
    isVisibleToOwner: isVisibleToOwner !== false,
    isConfidential: isConfidential || false,
    academicYear: academicYearDoc?._id || null,
    academicYearName: academicYearDoc?.name || null,
    notes,
    status: 'pending_verification',
    uploadedBy: req.user._id,
    uploadedByName: `${req.user.firstName} ${req.user.fatherName}`,
    uploadedAt: new Date(),
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Document uploaded.',
    data: { document },
  });
});

exports.getDocuments = catchAsync(async (req, res) => {
  const { ownerType, documentType, status, isVerified, search, page = 1, limit = 20 } = req.query;

  const filter = { isActive: true };
  if (ownerType) filter.ownerType = ownerType;
  if (documentType) filter.documentType = documentType;
  if (status) filter.status = status;
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

  // Owner-specific filters
  if (req.query.student) filter.student = req.query.student;
  if (req.query.teacher) filter.teacher = req.query.teacher;
  if (req.query.employee) filter.employee = req.query.employee;

  if (search) {
    Object.assign(
      filter,
      buildSearchQuery(search, ['name', 'documentType', 'ownerName', 'ownerId', 'documentNumber'])
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [documents, total] = await Promise.all([
    Document.find(filter)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'firstName fatherName')
      .populate('verifiedBy', 'firstName fatherName')
      .lean(),
    Document.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Documents fetched.',
    data: { documents },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.verifyDocument = catchAsync(async (req, res) => {
  const { notes } = req.body;
  const document = await Document.verify(
    req.params.id,
    req.user._id,
    `${req.user.firstName} ${req.user.fatherName}`,
    notes
  );
  if (!document) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Document not found.' });
  }
  return res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: 'Document verified.', data: { document } });
});

exports.rejectDocument = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ success: false, message: 'Rejection reason is required.' });
  }
  const document = await Document.reject(req.params.id, req.user._id, reason);
  if (!document) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Document not found.' });
  }
  return res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: 'Document rejected.', data: { document } });
});

exports.deleteDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Document not found.' });
  }

  if (document.publicId) {
    await deleteFromCloudinary(document.publicId, 'auto');
  }

  await Document.archive(req.params.id);

  return res.status(HTTP_STATUS.OK).json({ success: true, message: 'Document archived.' });
});

// ═══════════════════════════════════════════
// SUSPENSION
// ═══════════════════════════════════════════

exports.createSuspension = catchAsync(async (req, res) => {
  const {
    student,
    type,
    reason,
    offenseCategory,
    incidentDescription,
    incidentDate,
    incidentLocation,
    witnesses,
    startDate,
    endDate,
    reinstatementConditions,
    requiresParentMeeting,
    academicYear,
    term,
    notes,
  } = req.body;

  const studentDoc = await Student.findById(student)
    .select('firstName fatherName studentId grade section sectionName guardians status user')
    .lean();

  if (!studentDoc) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Student not found.' });
  }

  const academicYearDoc = academicYear
    ? await AcademicYear.findById(academicYear)
    : await AcademicYear.getCurrent();

  if (!academicYearDoc) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Academic year not found.' });
  }

  const termDoc = term ? await Term.findById(term) : await Term.getCurrent();

  const start = new Date(startDate);
  const end = new Date(endDate);
  const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Get guardian info
  const primaryGuardian = studentDoc.guardians?.[0];

  const suspension = await Suspension.create({
    student,
    studentName: `${studentDoc.firstName} ${studentDoc.fatherName}`,
    studentId: studentDoc.studentId,
    grade: studentDoc.grade,
    section: studentDoc.sectionName || null,
    guardianName: primaryGuardian?.guardianName || null,
    guardianPhone: primaryGuardian?.phone || null,
    type,
    reason,
    offenseCategory,
    incidentDescription: incidentDescription || null,
    incidentDate: new Date(incidentDate),
    incidentLocation: incidentLocation || null,
    witnesses: witnesses || [],
    startDate: start,
    endDate: end,
    numberOfDays,
    reinstatementConditions: reinstatementConditions || [],
    requiresParentMeeting: requiresParentMeeting !== false,
    academicYear: academicYearDoc._id,
    academicYearName: academicYearDoc.name,
    term: termDoc?._id || null,
    termName: termDoc?.name || null,
    requiresDirectorApproval: numberOfDays > 3,
    issuedBy: req.user._id,
    issuedByName: `${req.user.firstName} ${req.user.fatherName}`,
    issuedByRole: req.user.role,
    issuedAt: new Date(),
    status: numberOfDays > 3 ? 'pending_approval' : 'active',
    notes,
    createdBy: req.user._id,
  });

  // Update student suspension status
  await Student.findByIdAndUpdate(student, { isSuspended: true });

  // Notify parent
  if (primaryGuardian?.guardian) {
    try {
      const guardianDoc = await require('../models/Guardian')
        .findById(primaryGuardian.guardian)
        .populate('user', '_id')
        .lean();

      if (guardianDoc?.user?._id) {
        await notifySuspension(
          guardianDoc.user._id,
          `${studentDoc.firstName} ${studentDoc.fatherName}`,
          studentDoc.grade,
          start.toLocaleDateString('en-ET'),
          end.toLocaleDateString('en-ET'),
          reason,
          suspension._id
        );
      }
    } catch (err) {
      console.error('Suspension notification failed:', err.message);
    }
  }

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'suspension',
    resourceId: suspension._id,
    description: `Student suspended: ${studentDoc.firstName} ${studentDoc.fatherName} (${studentDoc.studentId}) — ${numberOfDays} day(s) for ${offenseCategory}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `Suspension recorded. ${numberOfDays > 3 ? 'Pending director approval.' : 'Active from ' + start.toLocaleDateString('en-ET')}`,
    data: { suspension },
  });
});

exports.getAllSuspensions = catchAsync(async (req, res) => {
  const { grade, status, offenseCategory, academicYear, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (grade) filter.grade = grade;
  if (status) filter.status = status;
  if (offenseCategory) filter.offenseCategory = offenseCategory;

  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (search) {
    Object.assign(
      filter,
      buildSearchQuery(search, ['studentName', 'studentId', 'reason', 'suspensionNumber'])
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [suspensions, total] = await Promise.all([
    Suspension.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('student', 'firstName fatherName studentId grade photo')
      .populate('issuedBy', 'firstName fatherName role')
      .lean(),
    Suspension.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Suspensions fetched.',
    data: { suspensions },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getSuspensionById = catchAsync(async (req, res) => {
  const suspension = await Suspension.findById(req.params.id)
    .populate('student', 'firstName fatherName studentId grade photo guardians')
    .populate('issuedBy', 'firstName fatherName role')
    .populate('directorApproval.approvedBy', 'firstName fatherName')
    .populate('reinstatementApprovedBy', 'firstName fatherName')
    .lean();

  if (!suspension) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Suspension not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Suspension fetched.',
    data: { suspension },
  });
});

exports.approveSuspension = catchAsync(async (req, res) => {
  const { remarks } = req.body;
  const suspension = await Suspension.approveDirector(
    req.params.id,
    req.user._id,
    `${req.user.firstName} ${req.user.fatherName}`,
    remarks
  );

  if (!suspension) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Suspension not found.' });
  }

  await auditLog({
    req,
    action: 'APPROVE',
    resource: 'suspension',
    resourceId: suspension._id,
    description: `Suspension approved by director: ${suspension.studentName}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Suspension approved.',
    data: { suspension },
  });
});

exports.reinstateSuspension = catchAsync(async (req, res) => {
  const { notes, conditionsMet } = req.body;
  const suspension = await Suspension.reinstate(
    req.params.id,
    req.user._id,
    `${req.user.firstName} ${req.user.fatherName}`,
    notes,
    conditionsMet || []
  );

  await auditLog({
    req,
    action: 'REINSTATE',
    resource: 'suspension',
    resourceId: suspension._id,
    description: `Student reinstated: ${suspension.studentName}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student reinstated successfully.',
    data: { suspension },
  });
});

exports.getSuspensionDashboard = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();
  const stats = await Suspension.getDashboardStats(currentYear?._id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Suspension dashboard fetched.',
    data: stats,
  });
});
