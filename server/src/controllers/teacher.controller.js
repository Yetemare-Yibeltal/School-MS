// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TEACHER CONTROLLER
// kat-school/server/src/controllers/teacher.controller.js
// ============================================

'use strict';

const Teacher = require('../models/Teacher');
const User = require('../models/User');
const AcademicYear = require('../models/AcademicYear');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const TeacherAttendance = require('../models/TeacherAttendance');
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const Payroll = require('../models/Payroll');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const { generateTeacherId, generateSecureToken } = require('../utils/generateId.util');
const { uploadProfilePhoto } = require('../utils/fileUpload.util');
const { sendWelcomeEmail } = require('../utils/email.util');
const { buildSearchQuery } = require('../utils/pagination.util');

// ─── Create Teacher ───────────────────────────
exports.createTeacher = catchAsync(async (req, res) => {
  const {
    firstName,
    fatherName,
    grandFatherName,
    firstNameAmharic,
    fatherNameAmharic,
    gender,
    dateOfBirth,
    nationality,
    religion,
    bloodGroup,
    phone,
    alternatePhone,
    email,
    address,
    primarySubject,
    secondarySubjects,
    gradesCanTeach,
    qualification,
    fieldOfStudy,
    university,
    yearOfGraduation,
    teachingLicenseNumber,
    teachingLicenseExpiry,
    yearsOfExperience,
    previousSchool,
    joinDate,
    employmentType,
    contractEndDate,
    isHomeRoomTeacher,
    homeRoomSection,
    salary,
    tinNumber,
    pensionNumber,
    nationalIdNumber,
    notes,
  } = req.body;

  // Check duplicate phone
  const existingTeacher = await Teacher.findOne({
    phone,
    status: { $nin: ['terminated', 'resigned'] },
  });

  if (existingTeacher) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'A teacher with this phone number already exists.',
    });
  }

  // Generate teacher ID
  const teacherId = await generateTeacherId();

  // Create user account for teacher
  const tempPassword = generateSecureToken(8);
  const userEmail = email || `${teacherId.replace(/\//g, '').toLowerCase()}@katschool.edu.et`;

  const existingUser = email ? await User.findOne({ email: email.toLowerCase() }) : null;

  let teacherUser;
  if (existingUser) {
    teacherUser = existingUser;
  } else {
    teacherUser = await User.create({
      firstName,
      fatherName,
      grandFatherName,
      phone,
      email: userEmail.toLowerCase(),
      role: 'teacher',
      gender,
      password: tempPassword,
      isTemporaryPassword: true,
      isActive: true,
      createdBy: req.user._id,
    });
  }

  // Create teacher record
  const teacher = await Teacher.create({
    firstName,
    fatherName,
    grandFatherName,
    firstNameAmharic,
    fatherNameAmharic,
    gender,
    dateOfBirth,
    nationality: nationality || 'Ethiopian',
    religion,
    bloodGroup,
    teacherId,
    phone,
    alternatePhone,
    email: userEmail.toLowerCase(),
    address,
    primarySubject,
    secondarySubjects: secondarySubjects || [],
    gradesCanTeach: gradesCanTeach || [],
    qualification,
    fieldOfStudy,
    university,
    yearOfGraduation,
    teachingLicenseNumber,
    teachingLicenseExpiry,
    yearsOfExperience: yearsOfExperience || 0,
    previousSchool,
    joinDate: joinDate || new Date(),
    employmentType: employmentType || 'Full-Time',
    contractEndDate,
    isHomeRoomTeacher: isHomeRoomTeacher || false,
    homeRoomSection: homeRoomSection || null,
    salary: {
      basicSalary: salary?.basicSalary || 0,
      bankName: salary?.bankName,
      bankAccountNumber: salary?.bankAccountNumber,
      bankBranch: salary?.bankBranch,
    },
    tinNumber,
    pensionNumber,
    nationalIdNumber,
    status: 'active',
    user: teacherUser._id,
    notes,
    createdBy: req.user._id,
  });

  // Assign homeroom section
  if (isHomeRoomTeacher && homeRoomSection) {
    await Section.findByIdAndUpdate(homeRoomSection, {
      classTeacher: teacher._id,
      classTeacherName: `${firstName} ${fatherName}`,
    });
  }

  // Initialize leave balances for new academic year
  const currentYear = await AcademicYear.getCurrent();
  if (currentYear) {
    try {
      await LeaveBalance.initializeForYear(currentYear._id, currentYear.name, null, req.user._id);
    } catch (err) {
      console.error('Leave balance init failed:', err.message);
    }
  }

  // Send welcome email
  if (email) {
    try {
      await sendWelcomeEmail(teacherUser, tempPassword);
    } catch (err) {
      console.error('Welcome email failed:', err.message);
    }
  }

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'teacher',
    resourceId: teacher._id,
    description: `Teacher created: ${firstName} ${fatherName} (${teacherId})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Teacher created successfully.',
    data: { teacher },
  });
});

// ─── Get All Teachers ─────────────────────────
exports.getAllTeachers = catchAsync(async (req, res) => {
  const {
    primarySubject,
    employmentType,
    qualification,
    status = 'active',
    gender,
    search,
    page = 1,
    limit = 20,
    sort = 'firstName',
    order = 'asc',
  } = req.query;

  const filter = {};
  if (primarySubject) filter.primarySubject = primarySubject;
  if (employmentType) filter.employmentType = employmentType;
  if (qualification) filter.qualification = qualification;
  if (status) filter.status = status;
  if (gender) filter.gender = gender;

  if (search) {
    const searchQ = buildSearchQuery(search, [
      'firstName',
      'fatherName',
      'grandFatherName',
      'teacherId',
      'phone',
      'email',
      'primarySubject',
    ]);
    Object.assign(filter, searchQ);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [teachers, total] = await Promise.all([
    Teacher.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select(
        'firstName fatherName grandFatherName teacherId gender primarySubject qualification employmentType status phone email photo joinDate gradesCanTeach isHomeRoomTeacher'
      )
      .lean(),
    Teacher.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Teachers fetched successfully.',
    data: { teachers },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPreviousPage: parseInt(page) > 1,
    },
  });
});

// ─── Get Teacher by ID ────────────────────────
exports.getTeacherById = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate('homeRoomSection', 'name grade')
    .populate('salaryStructure', 'name code')
    .populate('user', 'email isActive lastLogin')
    .lean();

  if (!teacher) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Teacher not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Teacher fetched.',
    data: { teacher },
  });
});

// ─── Update Teacher ───────────────────────────
exports.updateTeacher = catchAsync(async (req, res) => {
  const forbiddenFields = ['teacherId', 'user', 'createdBy'];
  forbiddenFields.forEach((f) => delete req.body[f]);

  const previousTeacher = await Teacher.findById(req.params.id);
  if (!previousTeacher) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Teacher not found.',
    });
  }

  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  // Update homeroom assignment if changed
  if (
    req.body.isHomeRoomTeacher &&
    req.body.homeRoomSection &&
    req.body.homeRoomSection !== previousTeacher.homeRoomSection?.toString()
  ) {
    // Remove from old section
    if (previousTeacher.homeRoomSection) {
      await Section.findByIdAndUpdate(previousTeacher.homeRoomSection, {
        classTeacher: null,
        classTeacherName: null,
      });
    }
    // Assign to new section
    await Section.findByIdAndUpdate(req.body.homeRoomSection, {
      classTeacher: teacher._id,
      classTeacherName: `${teacher.firstName} ${teacher.fatherName}`,
    });
  }

  await auditLog({
    req,
    action: 'UPDATE',
    resource: 'teacher',
    resourceId: teacher._id,
    description: `Teacher updated: ${teacher.firstName} ${teacher.fatherName} (${teacher.teacherId})`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Teacher updated successfully.',
    data: { teacher },
  });
});

// ─── Delete Teacher ───────────────────────────
exports.deleteTeacher = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Teacher not found.',
    });
  }

  // Soft delete
  teacher.status = 'terminated';
  teacher.updatedBy = req.user._id;
  await teacher.save();

  // Deactivate user account
  if (teacher.user) {
    await User.findByIdAndUpdate(teacher.user, {
      isActive: false,
    });
  }

  await auditLog({
    req,
    action: 'DELETE',
    resource: 'teacher',
    resourceId: teacher._id,
    description: `Teacher terminated: ${teacher.firstName} ${teacher.fatherName} (${teacher.teacherId})`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Teacher record deactivated.',
  });
});

// ─── Upload Teacher Photo ─────────────────────
exports.uploadPhoto = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Please upload a photo.',
    });
  }

  const result = await uploadProfilePhoto(req.file.path, 'teacher');
  if (!result.success) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Photo upload failed.',
    });
  }

  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    {
      'photo.url': result.url,
      'photo.publicId': result.publicId,
      updatedBy: req.user._id,
    },
    { new: true }
  );

  if (!teacher) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Teacher not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Photo uploaded.',
    data: { photo: teacher.photo },
  });
});

// ─── Get Teacher Timetable ────────────────────
exports.getTeacherTimetable = catchAsync(async (req, res) => {
  const TimetableSlot = require('../models/TimetableSlot');
  const currentYear = await AcademicYear.getCurrent();

  const slots = await TimetableSlot.find({
    teacher: req.params.id,
    isActive: true,
  })
    .populate('subject', 'name code')
    .populate('room', 'name code')
    .populate({
      path: 'timetable',
      match: { academicYear: currentYear?._id },
      select: 'grade section academicYear',
      populate: { path: 'section', select: 'name' },
    })
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Teacher timetable fetched.',
    data: { slots },
  });
});

// ─── Get Teacher Attendance Summary ───────────
exports.getAttendanceSummary = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const queryMonth = parseInt(month) || currentDate.getMonth() + 1;
  const queryYear = parseInt(year) || currentDate.getFullYear();

  const startDate = new Date(queryYear, queryMonth - 1, 1);
  const endDate = new Date(queryYear, queryMonth, 0);

  const attendance = await TeacherAttendance.find({
    teacher: req.params.id,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  const stats = {
    month: queryMonth,
    year: queryYear,
    totalDays: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    onLeave: attendance.filter((a) => a.status === 'on_leave').length,
    halfDay: attendance.filter((a) => a.status === 'half_day').length,
  };

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance summary fetched.',
    data: { stats, attendance },
  });
});

// ─── Get Teacher Leave Balances ───────────────
exports.getLeaveBalances = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();
  if (!currentYear) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { balances: [] },
    });
  }

  const balances = await LeaveBalance.getForStaff(req.params.id, 'teacher', currentYear._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave balances fetched.',
    data: { balances },
  });
});

// ─── Get Teacher Leave Applications ───────────
exports.getLeaveApplications = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { teacher: req.params.id };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [applications, total] = await Promise.all([
    LeaveApplication.find(filter)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('leaveType', 'name code color')
      .lean(),
    LeaveApplication.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave applications fetched.',
    data: { applications },
    pagination: {
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── Get Teacher Payroll History ──────────────
exports.getPayrollHistory = catchAsync(async (req, res) => {
  const { year, limit = 12 } = req.query;
  const filter = { teacher: req.params.id };
  if (year) filter.year = parseInt(year);

  const payrolls = await Payroll.find(filter)
    .sort({ year: -1, month: -1 })
    .limit(parseInt(limit))
    .select(
      'month year periodLabel basicSalary grossEarnings netSalary incomeTax employeePension status isPaid paidAt'
    )
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payroll history fetched.',
    data: { payrolls },
  });
});

// ─── Get Dashboard Stats ──────────────────────
exports.getDashboardStats = catchAsync(async (req, res) => {
  const [total, active, bySubject, byQualification, byEmploymentType, recentlyJoined] =
    await Promise.all([
      Teacher.countDocuments(),
      Teacher.countDocuments({ status: 'active' }),
      Teacher.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$primarySubject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Teacher.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$qualification', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Teacher.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$employmentType', count: { $sum: 1 } } },
      ]),
      Teacher.find({ status: 'active' })
        .sort({ joinDate: -1 })
        .limit(5)
        .select('firstName fatherName teacherId primarySubject photo joinDate')
        .lean(),
    ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Teacher dashboard stats fetched.',
    data: {
      total,
      active,
      inactive: total - active,
      bySubject,
      byQualification,
      byEmploymentType,
      recentlyJoined,
    },
  });
});
