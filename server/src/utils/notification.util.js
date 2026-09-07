// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// NOTIFICATION UTILITY
// kat-school/server/src/utils/notification.util.js
// ============================================

'use strict';

const mongoose = require('mongoose');

// ─── Notification Types Map ───────────────────
const NOTIFICATION_CONFIG = {
  // Attendance
  ATTENDANCE_ABSENT: {
    icon: 'calendar-x',
    color: '#ef4444',
    priority: 'high',
    resourceType: 'attendance',
  },
  ATTENDANCE_LATE: {
    icon: 'clock',
    color: '#f59e0b',
    priority: 'medium',
    resourceType: 'attendance',
  },
  // Fees
  FEE_DUE: {
    icon: 'credit-card',
    color: '#f97316',
    priority: 'high',
    resourceType: 'fee',
  },
  FEE_OVERDUE: {
    icon: 'alert-circle',
    color: '#ef4444',
    priority: 'urgent',
    resourceType: 'fee',
  },
  FEE_PAID: {
    icon: 'check-circle',
    color: '#22c55e',
    priority: 'low',
    resourceType: 'fee_payment',
  },
  // Exams
  EXAM_SCHEDULED: {
    icon: 'file-text',
    color: '#3b82f6',
    priority: 'medium',
    resourceType: 'exam',
  },
  EXAM_RESULT_PUBLISHED: {
    icon: 'award',
    color: '#22c55e',
    priority: 'medium',
    resourceType: 'result',
  },
  REPORT_CARD_READY: {
    icon: 'clipboard',
    color: '#8b5cf6',
    priority: 'medium',
    resourceType: 'report_card',
  },
  // Leave
  LEAVE_APPLIED: {
    icon: 'calendar',
    color: '#4f46e5',
    priority: 'medium',
    resourceType: 'leave',
  },
  LEAVE_APPROVED: {
    icon: 'check-circle',
    color: '#22c55e',
    priority: 'medium',
    resourceType: 'leave',
  },
  LEAVE_REJECTED: {
    icon: 'x-circle',
    color: '#ef4444',
    priority: 'high',
    resourceType: 'leave',
  },
  // Messages
  NEW_MESSAGE: {
    icon: 'message-circle',
    color: '#4f46e5',
    priority: 'medium',
    resourceType: 'message',
  },
  // Notices
  NOTICE_PUBLISHED: {
    icon: 'bell',
    color: '#f59e0b',
    priority: 'medium',
    resourceType: 'notice',
  },
  // Events
  EVENT_REMINDER: {
    icon: 'calendar',
    color: '#ec4899',
    priority: 'low',
    resourceType: 'event',
  },
  // Payroll
  PAYROLL_PROCESSED: {
    icon: 'dollar-sign',
    color: '#22c55e',
    priority: 'medium',
    resourceType: 'payroll',
  },
  SALARY_SLIP_READY: {
    icon: 'file-text',
    color: '#4f46e5',
    priority: 'low',
    resourceType: 'payroll',
  },
  // Library
  BOOK_DUE: {
    icon: 'book',
    color: '#f59e0b',
    priority: 'medium',
    resourceType: 'book_issue',
  },
  BOOK_OVERDUE: {
    icon: 'alert-circle',
    color: '#ef4444',
    priority: 'high',
    resourceType: 'book_issue',
  },
  BOOK_AVAILABLE: {
    icon: 'book-open',
    color: '#22c55e',
    priority: 'medium',
    resourceType: 'book',
  },
  // Suspension
  STUDENT_SUSPENDED: {
    icon: 'alert-triangle',
    color: '#ef4444',
    priority: 'urgent',
    resourceType: 'suspension',
  },
  STUDENT_REINSTATED: {
    icon: 'check-circle',
    color: '#22c55e',
    priority: 'high',
    resourceType: 'suspension',
  },
  // System
  SYSTEM_ALERT: {
    icon: 'info',
    color: '#3b82f6',
    priority: 'medium',
    resourceType: 'system',
  },
  PASSWORD_CHANGED: {
    icon: 'lock',
    color: '#f59e0b',
    priority: 'high',
    resourceType: 'system',
  },
};

// ─── Create Notification ──────────────────────
const createNotification = async ({
  recipientId,
  recipientRole = null,
  type,
  title,
  message,
  actionUrl = null,
  actionLabel = null,
  resourceId = null,
  senderId = null,
  senderName = null,
  academicYearId = null,
}) => {
  try {
    const Notification = mongoose.model('Notification');
    const config = NOTIFICATION_CONFIG[type] || {
      icon: 'bell',
      color: '#4f46e5',
      priority: 'medium',
      resourceType: 'other',
    };

    return await Notification.create_({
      recipientId,
      recipientRole,
      type,
      title,
      message,
      actionUrl,
      actionLabel,
      resourceType: config.resourceType,
      resourceId,
      senderId,
      senderName,
      priority: config.priority,
      icon: config.icon,
      color: config.color,
      academicYearId,
    });
  } catch (error) {
    console.error('❌ createNotification error:', error.message);
    return null;
  }
};

// ─── Bulk Notify Users ────────────────────────
const bulkNotify = async (recipientIds, notificationData) => {
  try {
    const Notification = mongoose.model('Notification');
    const config = NOTIFICATION_CONFIG[notificationData.type] || {
      icon: 'bell',
      color: '#4f46e5',
      priority: 'medium',
      resourceType: 'other',
    };

    const notifications = recipientIds.map((id) => ({
      recipient: id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: notificationData.actionUrl || null,
      actionLabel: notificationData.actionLabel || null,
      resourceType: config.resourceType,
      resourceId: notificationData.resourceId || null,
      sender: notificationData.senderId || null,
      senderName: notificationData.senderName || null,
      priority: config.priority,
      icon: config.icon,
      color: config.color,
      academicYear: notificationData.academicYearId || null,
    }));

    return await Notification.bulkCreate(notifications);
  } catch (error) {
    console.error('❌ bulkNotify error:', error.message);
    return [];
  }
};

// ─── Notify Absence ───────────────────────────
const notifyAbsence = async (studentName, grade, date, parentUserId, studentId) => {
  return createNotification({
    recipientId: parentUserId,
    type: 'ATTENDANCE_ABSENT',
    title: 'Attendance Alert',
    message: `${studentName} (${grade}) was absent from school on ${date}. Please provide an excuse note if necessary.`,
    actionUrl: `/parent/attendance/${studentId}`,
    actionLabel: 'View Attendance',
    resourceId: studentId,
  });
};

// ─── Notify Fee Due ───────────────────────────
const notifyFeeDue = async (
  studentName,
  feeTypeName,
  amount,
  dueDate,
  parentUserId,
  assignmentId
) => {
  return createNotification({
    recipientId: parentUserId,
    type: 'FEE_DUE',
    title: 'Fee Payment Reminder',
    message: `${feeTypeName} of ETB ${Number(amount).toLocaleString()} for ${studentName} is due on ${dueDate}. Please make payment before the due date to avoid late fees.`,
    actionUrl: `/parent/fees/${assignmentId}`,
    actionLabel: 'Pay Now',
    resourceId: assignmentId,
  });
};

// ─── Notify Fee Overdue ───────────────────────
const notifyFeeOverdue = async (
  studentName,
  feeTypeName,
  amount,
  daysPastDue,
  parentUserId,
  assignmentId
) => {
  return createNotification({
    recipientId: parentUserId,
    type: 'FEE_OVERDUE',
    title: 'Overdue Fee Payment',
    message: `${feeTypeName} of ETB ${Number(amount).toLocaleString()} for ${studentName} is ${daysPastDue} day(s) overdue. Late fees are being accrued daily.`,
    actionUrl: `/parent/fees/${assignmentId}`,
    actionLabel: 'Pay Now',
    resourceId: assignmentId,
  });
};

// ─── Notify Fee Paid ──────────────────────────
const notifyFeePaid = async (
  studentName,
  feeTypeName,
  amount,
  receiptNumber,
  parentUserId,
  paymentId
) => {
  return createNotification({
    recipientId: parentUserId,
    type: 'FEE_PAID',
    title: 'Payment Confirmed',
    message: `Payment of ETB ${Number(amount).toLocaleString()} for ${feeTypeName} (${studentName}) has been confirmed. Receipt: ${receiptNumber}.`,
    actionUrl: `/parent/receipts/${paymentId}`,
    actionLabel: 'View Receipt',
    resourceId: paymentId,
  });
};

// ─── Notify Leave Status ──────────────────────
const notifyLeaveStatus = async (
  staffUserId,
  status,
  leaveTypeName,
  startDate,
  endDate,
  applicationId
) => {
  const isApproved = status === 'approved';
  return createNotification({
    recipientId: staffUserId,
    type: isApproved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
    title: `Leave ${isApproved ? 'Approved' : 'Rejected'}`,
    message: `Your ${leaveTypeName} application (${startDate} – ${endDate}) has been ${status}.`,
    actionUrl: `/staff/leaves/${applicationId}`,
    actionLabel: 'View Application',
    resourceId: applicationId,
  });
};

// ─── Notify New Message ───────────────────────
const notifyNewMessage = async (recipientId, senderName, messagePreview, threadId) => {
  return createNotification({
    recipientId,
    type: 'NEW_MESSAGE',
    title: `New message from ${senderName}`,
    message: messagePreview.substring(0, 100),
    actionUrl: `/messages/thread/${threadId}`,
    actionLabel: 'Reply',
    resourceId: threadId,
    senderName,
  });
};

// ─── Notify Book Due Soon ─────────────────────
const notifyBookDue = async (memberUserId, bookTitle, dueDate, issueId) => {
  return createNotification({
    recipientId: memberUserId,
    type: 'BOOK_DUE',
    title: 'Library Book Due Soon',
    message: `"${bookTitle}" is due for return on ${dueDate}. Please return it on time to avoid fine charges.`,
    actionUrl: `/library/issues/${issueId}`,
    actionLabel: 'View Issue',
    resourceId: issueId,
  });
};

// ─── Notify Book Overdue ──────────────────────
const notifyBookOverdue = async (memberUserId, bookTitle, daysOverdue, fineAmount, issueId) => {
  return createNotification({
    recipientId: memberUserId,
    type: 'BOOK_OVERDUE',
    title: 'Library Book Overdue',
    message: `"${bookTitle}" is ${daysOverdue} day(s) overdue. Current fine: ETB ${fineAmount}. Please return it immediately.`,
    actionUrl: `/library/issues/${issueId}`,
    actionLabel: 'View Issue',
    resourceId: issueId,
  });
};

// ─── Notify Reservation Available ─────────────
const notifyBookAvailable = async (memberUserId, bookTitle, collectByDate, reservationId) => {
  return createNotification({
    recipientId: memberUserId,
    type: 'BOOK_AVAILABLE',
    title: 'Reserved Book Available',
    message: `"${bookTitle}" is now available for collection. Please collect it by ${collectByDate} to avoid losing your reservation.`,
    actionUrl: `/library/reservations/${reservationId}`,
    actionLabel: 'View Reservation',
    resourceId: reservationId,
  });
};

// ─── Notify Suspension ────────────────────────
const notifySuspension = async (
  parentUserId,
  studentName,
  grade,
  startDate,
  endDate,
  reason,
  suspensionId
) => {
  return createNotification({
    recipientId: parentUserId,
    type: 'STUDENT_SUSPENDED',
    title: 'Student Suspension Notice',
    message: `${studentName} (${grade}) has been suspended from ${startDate} to ${endDate}. Reason: ${reason.substring(0, 100)}. Please contact the school for a parent meeting.`,
    actionUrl: `/parent/suspensions/${suspensionId}`,
    actionLabel: 'View Details',
    resourceId: suspensionId,
  });
};

// ─── Notify Salary Slip Ready ─────────────────
const notifySalarySlipReady = async (staffUserId, month, year, netSalary, payrollId) => {
  return createNotification({
    recipientId: staffUserId,
    type: 'SALARY_SLIP_READY',
    title: 'Salary Slip Ready',
    message: `Your salary slip for ${month} ${year} is ready. Net salary: ETB ${Number(netSalary).toLocaleString()}.`,
    actionUrl: `/staff/payroll/${payrollId}`,
    actionLabel: 'View Salary Slip',
    resourceId: payrollId,
  });
};

// ─── Notify Result Published ──────────────────
const notifyResultPublished = async (studentUserId, parentUserId, subjectName, grade, resultId) => {
  const notificationData = {
    type: 'EXAM_RESULT_PUBLISHED',
    title: 'Exam Result Available',
    message: `${subjectName} exam results have been published. Check your results now.`,
    actionUrl: `/results/${resultId}`,
    actionLabel: 'View Results',
    resourceId: resultId,
  };

  const promises = [];
  if (studentUserId) {
    promises.push(createNotification({ recipientId: studentUserId, ...notificationData }));
  }
  if (parentUserId) {
    promises.push(createNotification({ recipientId: parentUserId, ...notificationData }));
  }

  return Promise.all(promises);
};

module.exports = {
  NOTIFICATION_CONFIG,
  createNotification,
  bulkNotify,
  notifyAbsence,
  notifyFeeDue,
  notifyFeeOverdue,
  notifyFeePaid,
  notifyLeaveStatus,
  notifyNewMessage,
  notifyBookDue,
  notifyBookOverdue,
  notifyBookAvailable,
  notifySuspension,
  notifySalarySlipReady,
  notifyResultPublished,
};
