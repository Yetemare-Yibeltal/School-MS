'use strict';

const User = require('../models/User');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { HTTP_STATUS } = require('../config/constants');

const STAFF_ROLES = [
  'super_admin',
  'admin',
  'teacher',
  'accountant',
  'librarian',
  'hr_manager',
  'receptionist',
];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/directory/users?search=abc&limit=8
exports.searchUsers = catchAsync(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

  if (search.length < 2) {
    return res.status(HTTP_STATUS.OK).json({ success: true, data: { users: [] } });
  }

  const rx = new RegExp(escapeRegex(search), 'i');
  const filter = {
    _id: { $ne: req.user._id },
    isActive: true,
    $or: [{ firstName: rx }, { fatherName: rx }],
  };

  // Students and parents may only contact staff
  if (['student', 'parent'].includes(req.user.role)) {
    filter.role = { $in: STAFF_ROLES };
  }

  const users = await User.find(filter)
    .select('firstName fatherName role photo')
    .sort({ firstName: 1 })
    .limit(limit)
    .lean();

  return res.status(HTTP_STATUS.OK).json({ success: true, data: { users } });
});
