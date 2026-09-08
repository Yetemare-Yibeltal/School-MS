// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EMPLOYEE CONTROLLER
// kat-school/server/src/controllers/employee.controller.js
// ============================================

'use strict';

const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const AcademicYear = require('../models/AcademicYear');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveApplication = require('../models/LeaveApplication');
const Payroll = require('../models/Payroll');
const TeacherAttendance = require('../models/TeacherAttendance');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const { generateEmployeeId, generateSecureToken } = require('../utils/generateId.util');
const { uploadProfilePhoto } = require('../utils/fileUpload.util');
const { sendWelcomeEmail } = require('../utils/email.util');
const { buildSearchQuery } = require('../utils/pagination.util');

// ─── Create Employee ──────────────────────────
exports.createEmployee = catchAsync(async (req, res) => {
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
    maritalStatus,
    numberOfDependents,
    phone,
    alternatePhone,
    email,
    address,
    emergencyContact,
    department,
    designation,
    qualification,
    fieldOfStudy,
    university,
    yearsOfExperience,
    joinDate,
    employmentType,
    contractEndDate,
    salary,
    tinNumber,
    pensionNumber,
    nationalIdNumber,
    notes,
  } = req.body;

  // Check duplicate phone
  const existingEmployee = await Employee.findOne({
    phone,
    status: { $nin: ['terminated', 'resigned'] },
  });

  if (existingEmployee) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'An employee with this phone number already exists.',
    });
  }

  // Get department and designation
  const [deptDoc, desigDoc] = await Promise.all([
    Department.findById(department),
    Designation.findById(designation),
  ]);

  if (!deptDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Department not found.',
    });
  }

  if (!desigDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Designation not found.',
    });
  }

  // Generate employee ID
  const employeeId = await generateEmployeeId(deptDoc.code);

  // Create user account
  const tempPassword = generateSecureToken(8);
  const userEmail = email || `${employeeId.replace(/\//g, '').toLowerCase()}@katschool.edu.et`;

  const existingUser = email ? await User.findOne({ email: email.toLowerCase() }) : null;

  let employeeUser;
  if (existingUser) {
    employeeUser = existingUser;
  } else {
    // Map designation to role
    const roleMap = {
      ACCT: 'accountant',
      LIB: 'librarian',
      HR: 'hr_manager',
      RECEP: 'receptionist',
      PRIN: 'admin',
      VPRIN: 'admin',
    };
    const userRole = roleMap[desigDoc.code] || 'employee';

    employeeUser = await User.create({
      firstName,
      fatherName,
      grandFatherName,
      phone,
      email: userEmail.toLowerCase(),
      role: userRole,
      gender,
      password: tempPassword,
      isTemporaryPassword: true,
      isActive: true,
      createdBy: req.user._id,
    });
  }

  // Create employee record
  const employee = await Employee.create({
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
    maritalStatus,
    numberOfDependents: numberOfDependents || 0,
    employeeId,
    phone,
    alternatePhone,
    email: userEmail.toLowerCase(),
    address,
    emergencyContact,
    department: deptDoc._id,
    departmentName: deptDoc.name,
    designation: desigDoc._id,
    designationName: desigDoc.name,
    designationCode: desigDoc.code,
    qualification,
    fieldOfStudy,
    university,
    yearsOfExperience: yearsOfExperience || 0,
    joinDate: joinDate || new Date(),
    employmentType: employmentType || 'Full-Time',
    contractEndDate,
    salary: {
      basicSalary: salary?.basicSalary || 0,
      housingAllowance: salary?.housingAllowance || 0,
      transportAllowance: salary?.transportAllowance || 0,
      medicalAllowance: salary?.medicalAllowance || 0,
      otherAllowances: salary?.otherAllowances || 0,
      bankName: salary?.bankName,
      bankAccountNumber: salary?.bankAccountNumber,
      bankBranch: salary?.bankBranch,
    },
    tinNumber,
    pensionNumber,
    nationalIdNumber,
    status: 'active',
    user: employeeUser._id,
    notes,
    createdBy: req.user._id,
  });

  // Update department employee count
  await Department.updateEmployeeCount(deptDoc._id);

  // Update designation employee count
  await Designation.findByIdAndUpdate(desigDoc._id, {
    $inc: { activeEmployees: 1, totalEmployees: 1 },
  });

  // Initialize leave balances
  const currentYear = await AcademicYear.getCurrent();
  if (currentYear) {
    try {
      await LeaveBalance.initializeForYear(currentYear._id, currentYear.name, null, req.user._id);
    } catch (err) {
      console.error('Leave balance init error:', err.message);
    }
  }

  // Send welcome email
  if (email) {
    try {
      await sendWelcomeEmail(employeeUser, tempPassword);
    } catch (err) {
      console.error('Welcome email failed:', err.message);
    }
  }

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'employee',
    resourceId: employee._id,
    description: `Employee created: ${firstName} ${fatherName} (${employeeId})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Employee created successfully.',
    data: { employee },
  });
});

// ─── Get All Employees ────────────────────────
exports.getAllEmployees = catchAsync(async (req, res) => {
  const {
    department,
    designation,
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
  if (department) filter.department = department;
  if (designation) filter.designation = designation;
  if (employmentType) filter.employmentType = employmentType;
  if (qualification) filter.qualification = qualification;
  if (status) filter.status = status;
  if (gender) filter.gender = gender;

  if (search) {
    const searchQ = buildSearchQuery(search, [
      'firstName',
      'fatherName',
      'grandFatherName',
      'employeeId',
      'phone',
      'email',
      'departmentName',
      'designationName',
    ]);
    Object.assign(filter, searchQ);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('department', 'name code color')
      .populate('designation', 'name code level')
      .select(
        'firstName fatherName grandFatherName employeeId gender phone email photo status departmentName designationName joinDate employmentType'
      )
      .lean(),
    Employee.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Employees fetched successfully.',
    data: { employees },
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

// ─── Get Employee by ID ───────────────────────
exports.getEmployeeById = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name code color head')
    .populate('designation', 'name code level salaryGrade')
    .populate('salaryStructure', 'name code')
    .populate('user', 'email role isActive lastLogin')
    .lean();

  if (!employee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Employee not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Employee fetched.',
    data: { employee },
  });
});

// ─── Update Employee ──────────────────────────
exports.updateEmployee = catchAsync(async (req, res) => {
  const forbiddenFields = ['employeeId', 'user', 'createdBy'];
  forbiddenFields.forEach((f) => delete req.body[f]);

  const previousEmployee = await Employee.findById(req.params.id);
  if (!previousEmployee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Employee not found.',
    });
  }

  // If department changed, update counts
  if (req.body.department && req.body.department !== previousEmployee.department?.toString()) {
    const newDept = await Department.findById(req.body.department);
    if (newDept) {
      req.body.departmentName = newDept.name;
    }

    await Department.updateEmployeeCount(previousEmployee.department);
    await Department.updateEmployeeCount(req.body.department);
  }

  // If designation changed
  if (req.body.designation && req.body.designation !== previousEmployee.designation?.toString()) {
    const newDesig = await Designation.findById(req.body.designation);
    if (newDesig) {
      req.body.designationName = newDesig.name;
      req.body.designationCode = newDesig.code;
    }
  }

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  )
    .populate('department', 'name code')
    .populate('designation', 'name code');

  await auditLog({
    req,
    action: 'UPDATE',
    resource: 'employee',
    resourceId: employee._id,
    description: `Employee updated: ${employee.firstName} ${employee.fatherName} (${employee.employeeId})`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Employee updated successfully.',
    data: { employee },
  });
});

// ─── Delete Employee ──────────────────────────
exports.deleteEmployee = catchAsync(async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Employee not found.',
    });
  }

  employee.status = 'terminated';
  employee.updatedBy = req.user._id;
  await employee.save();

  if (employee.user) {
    await User.findByIdAndUpdate(employee.user, { isActive: false });
  }

  // Update department count
  await Department.updateEmployeeCount(employee.department);

  await auditLog({
    req,
    action: 'DELETE',
    resource: 'employee',
    resourceId: employee._id,
    description: `Employee terminated: ${employee.firstName} ${employee.fatherName} (${employee.employeeId})`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Employee record deactivated.',
  });
});

// ─── Upload Employee Photo ────────────────────
exports.uploadPhoto = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Please upload a photo.',
    });
  }

  const result = await uploadProfilePhoto(req.file.path, 'employee');
  if (!result.success) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Photo upload failed.',
    });
  }

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    {
      'photo.url': result.url,
      'photo.publicId': result.publicId,
      updatedBy: req.user._id,
    },
    { new: true }
  );

  if (!employee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Employee not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Photo uploaded.',
    data: { photo: employee.photo },
  });
});

// ─── Get Employee Attendance Summary ──────────
exports.getAttendanceSummary = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const queryMonth = parseInt(month) || currentDate.getMonth() + 1;
  const queryYear = parseInt(year) || currentDate.getFullYear();

  const startDate = new Date(queryYear, queryMonth - 1, 1);
  const endDate = new Date(queryYear, queryMonth, 0);

  const attendance = await TeacherAttendance.find({
    employee: req.params.id,
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

// ─── Get Employee Leave Balances ──────────────
exports.getLeaveBalances = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();
  if (!currentYear) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { balances: [] },
    });
  }

  const balances = await LeaveBalance.getForStaff(req.params.id, 'employee', currentYear._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave balances fetched.',
    data: { balances },
  });
});

// ─── Get Employee Leave Applications ──────────
exports.getLeaveApplications = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { employee: req.params.id };
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

// ─── Get Employee Payroll History ─────────────
exports.getPayrollHistory = catchAsync(async (req, res) => {
  const { year, limit = 12 } = req.query;
  const filter = { employee: req.params.id };
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
  const [total, active, byDepartment, byEmploymentType, byQualification, recentlyJoined] =
    await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Employee.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$departmentName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Employee.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$employmentType', count: { $sum: 1 } } },
      ]),
      Employee.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$qualification', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Employee.find({ status: 'active' })
        .sort({ joinDate: -1 })
        .limit(5)
        .select('firstName fatherName employeeId departmentName photo joinDate')
        .lean(),
    ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Employee dashboard stats fetched.',
    data: {
      total,
      active,
      inactive: total - active,
      byDepartment,
      byEmploymentType,
      byQualification,
      recentlyJoined,
    },
  });
});
