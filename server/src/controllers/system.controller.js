'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');
const { uploadToCloudinary } = require('../config/cloudinary');

// Safe model loader and query wrapper: a wrong field name never crashes the dashboard
const model = (name) => {
  try { return require(`../models/${name}`); } catch { return null; }
};
const safe = async (fn, fallback) => {
  try { return await fn(); } catch (e) { return fallback; }
};
const sumOf = async (Model, match, field = 'amount') => {
  if (!Model) return 0;
  const r = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return r[0]?.total || 0;
};

// GET /api/system/settings
exports.getSettings = catchAsync(async (req, res) => {
  const settings = await Settings.getSettings();
  res.status(HTTP_STATUS.OK).json({ success: true, data: { settings } });
});

// PATCH /api/system/settings
exports.updateSettings = catchAsync(async (req, res) => {
  const name = `${req.user.firstName} ${req.user.fatherName}`;
  const settings = await Settings.updateSettings(req.body, req.user._id, name);
  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Settings updated.', data: { settings } });
});

// POST /api/system/logo
exports.uploadLogo = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'No logo file uploaded.' });
  }
  const data = req.file.buffer || (req.file.path ? fs.readFileSync(req.file.path) : null);
  if (!data) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Could not read uploaded file.' });
  }
  const result = await uploadToCloudinary(data, 'GENERAL', 'school_logo');
  const name = `${req.user.firstName} ${req.user.fatherName}`;
  await Settings.updateSettings({ logoUrl: result.url, logoPublicId: result.publicId }, req.user._id, name);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logo uploaded.',
    data: { logo: { url: result.url, publicId: result.publicId } },
  });
});

// GET /api/system/dashboard
exports.getDashboard = catchAsync(async (req, res) => {
  const Student = model('Student');
  const Teacher = model('Teacher');
  const Employee = model('Employee');
  const FeePayment = model('FeePayment');
  const Income = model('Income');
  const Expense = model('Expense');
  const Attendance = model('Attendance');
  const LeaveApplication = model('LeaveApplication');
  const BookIssue = model('BookIssue');
  const Suspension = model('Suspension');
  const Event = model('Event');
  const Notice = model('Notice');
  const AcademicYear = model('AcademicYear');

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeStudents, totalTeachers, totalEmployees,
    todayPayments, present, late, absent, attTotal,
    pendingLeaves, overdueBooks, activeSuspensions,
    feeIncome, otherIncome, monthlyExpenses,
    upcomingEvents, recentNotices, recentAuditLogs, currentAcademicYear,
  ] = await Promise.all([
    safe(() => Student.countDocuments({ status: 'active' }), 0),
    safe(() => Teacher.countDocuments({ status: 'active' }), 0),
    safe(() => Employee.countDocuments({ status: 'active' }), 0),
    safe(() => sumOf(FeePayment, { paymentDate: { $gte: startOfDay, $lt: endOfDay } }), 0),
    safe(() => Attendance.countDocuments({ date: { $gte: startOfDay, $lt: endOfDay }, status: 'present' }), 0),
    safe(() => Attendance.countDocuments({ date: { $gte: startOfDay, $lt: endOfDay }, status: 'late' }), 0),
    safe(() => Attendance.countDocuments({ date: { $gte: startOfDay, $lt: endOfDay }, status: 'absent' }), 0),
    safe(() => Attendance.countDocuments({ date: { $gte: startOfDay, $lt: endOfDay } }), 0),
    safe(() => LeaveApplication.countDocuments({ status: 'pending' }), 0),
    safe(() => BookIssue.countDocuments({ status: { $ne: 'returned' }, dueDate: { $lt: now } }), 0),
    safe(() => Suspension.countDocuments({ status: 'active' }), 0),
    safe(() => sumOf(FeePayment, { paymentDate: { $gte: startOfMonth } }), 0),
    safe(() => sumOf(Income, { date: { $gte: startOfMonth } }), 0),
    safe(() => sumOf(Expense, { date: { $gte: startOfMonth }, status: { $in: ['approved', 'paid'] } }), 0),
    safe(() => Event.find({ startDate: { $gte: startOfDay } }).sort({ startDate: 1 }).limit(5).lean(), []),
    safe(() => Notice.find({ status: 'published' }).sort({ isPinned: -1, publishDate: -1 }).limit(5).lean(), []),
    safe(async () => {
      try {
        return await AuditLog.find().sort({ createdAt: -1 }).limit(8).populate('user', 'firstName fatherName role').lean();
      } catch {
        return await AuditLog.find().sort({ createdAt: -1 }).limit(8).lean();
      }
    }, []),
    safe(() => AcademicYear.findOne({ isCurrent: true }).lean(), null),
  ]);

  const monthlyIncome = feeIncome + otherIncome;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      overview: { activeStudents, totalTeachers, totalEmployees },
      today: {
        payments: { total: todayPayments },
        attendance: { present, late, absent, total: attTotal },
      },
      alerts: { pendingLeaves, overdueBooks, activeSuspensions },
      finance: { monthlyIncome, monthlyExpenses, netBalance: monthlyIncome - monthlyExpenses },
      upcomingEvents,
      recentNotices,
      recentAuditLogs,
      currentAcademicYear,
    },
  });
});

// GET /api/system/audit-logs
exports.getAuditLogs = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 25, 100);
  const { action, resource, userId, startDate, endDate } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (resource) filter.resource = resource;
  if (userId && mongoose.isValidObjectId(userId)) filter.user = userId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  const total = await AuditLog.countDocuments(filter);
  let query = AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  let logs;
  try {
    logs = await query.populate('user', 'firstName fatherName role').lean();
  } catch {
    logs = await AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  }

  const totalPages = Math.max(Math.ceil(total / limit), 1);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { logs },
    pagination: {
      page, limit, total, totalPages,
      from: total === 0 ? 0 : (page - 1) * limit + 1,
      to: Math.min(page * limit, total),
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
});

// GET /api/system/health
exports.getHealth = catchAsync(async (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      status: 'OK',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      uptimeSeconds: Math.round(process.uptime()),
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      timestamp: new Date().toISOString(),
    },
  });
});
