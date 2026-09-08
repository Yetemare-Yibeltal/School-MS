// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// HRM CONTROLLER
// kat-school/server/src/controllers/hrm.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const SalaryStructure = require('../models/SalaryStructure');
const SalaryComponent = require('../models/SalaryComponent');
const Payroll = require('../models/Payroll');
const LeaveType = require('../models/LeaveType');
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const Teacher = require('../models/Teacher');
const Employee = require('../models/Employee');
const AcademicYear = require('../models/AcademicYear');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const { calculateNetSalary } = require('../utils/taxCalculator.util');
const { buildSearchQuery } = require('../utils/pagination.util');
const { generateBatchId } = require('../utils/generateId.util');
const { notifyLeaveStatus, notifySalarySlipReady } = require('../utils/notification.util');
const { sendLeaveStatusEmail } = require('../utils/email.util');

// ═══════════════════════════════════════════
// DEPARTMENT
// ═══════════════════════════════════════════

exports.createDepartment = catchAsync(async (req, res) => {
  const { name, code, description, head, email, phone, location, annualBudget, color, icon } =
    req.body;

  const existing = await Department.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Department with code ${code} already exists.`,
    });
  }

  const department = await Department.create({
    name,
    code: code.toUpperCase(),
    description,
    head: head || null,
    email: email || null,
    phone: phone || null,
    location: location || null,
    annualBudget: annualBudget || 0,
    color: color || '#4f46e5',
    icon: icon || 'building',
    isActive: true,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'department',
    resourceId: department._id,
    description: `Department created: ${name} (${code})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Department created.',
    data: { department },
  });
});

exports.getAllDepartments = catchAsync(async (req, res) => {
  const departments = await Department.getAllActive();
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Departments fetched.',
    data: { departments },
  });
});

exports.getDepartmentById = catchAsync(async (req, res) => {
  const { department, employees } = await Department.getWithEmployees(req.params.id);
  if (!department) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Department not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Department fetched.',
    data: { department, employees },
  });
});

exports.updateDepartment = catchAsync(async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!department) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Department not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Department updated.',
    data: { department },
  });
});

exports.deleteDepartment = catchAsync(async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Department not found.',
    });
  }
  if (dept.activeEmployees > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot delete department with ${dept.activeEmployees} active employee(s).`,
    });
  }
  await Department.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Department deactivated.',
  });
});

// ═══════════════════════════════════════════
// DESIGNATION
// ═══════════════════════════════════════════

exports.createDesignation = catchAsync(async (req, res) => {
  const {
    name,
    code,
    description,
    department,
    level,
    reportsTo,
    salaryGrade,
    minSalary,
    maxSalary,
    defaultBasicSalary,
    minimumQualification,
    minimumExperience,
    requiredSkills,
    responsibilities,
    defaultAllowances,
    isTeachingPosition,
    isManagement,
    color,
    icon,
    sortOrder,
  } = req.body;

  const existing = await Designation.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Designation with code ${code} already exists.`,
    });
  }

  const deptDoc = await Department.findById(department);
  if (!deptDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Department not found.',
    });
  }

  const designation = await Designation.create({
    name,
    code: code.toUpperCase(),
    description,
    department,
    departmentName: deptDoc.name,
    level: level || 1,
    reportsTo: reportsTo || null,
    salaryGrade,
    minSalary: minSalary || 0,
    maxSalary: maxSalary || 0,
    defaultBasicSalary: defaultBasicSalary || 0,
    minimumQualification: minimumQualification || 'Degree',
    minimumExperience: minimumExperience || 0,
    requiredSkills: requiredSkills || [],
    responsibilities: responsibilities || [],
    defaultAllowances: defaultAllowances || {},
    isTeachingPosition: isTeachingPosition || false,
    isManagement: isManagement || false,
    color: color || '#4f46e5',
    icon: icon || 'user',
    sortOrder: sortOrder || 0,
    isActive: true,
    createdBy: req.user._id,
  });

  await Department.addDesignation(department, designation._id);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Designation created.',
    data: { designation },
  });
});

exports.getAllDesignations = catchAsync(async (req, res) => {
  const { department, isTeaching, isManagement } = req.query;
  const filter = { isActive: true };
  if (department) filter.department = department;
  if (isTeaching !== undefined) filter.isTeachingPosition = isTeaching === 'true';
  if (isManagement !== undefined) filter.isManagement = isManagement === 'true';

  const designations = await Designation.find(filter)
    .sort({ level: -1, name: 1 })
    .populate('department', 'name code color')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Designations fetched.',
    data: { designations },
  });
});

exports.getDesignationById = catchAsync(async (req, res) => {
  const designation = await Designation.findById(req.params.id)
    .populate('department', 'name code')
    .populate('reportsTo', 'name code')
    .lean();
  if (!designation) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Designation not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Designation fetched.',
    data: { designation },
  });
});

exports.updateDesignation = catchAsync(async (req, res) => {
  const designation = await Designation.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!designation) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Designation not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Designation updated.',
    data: { designation },
  });
});

exports.deleteDesignation = catchAsync(async (req, res) => {
  const designation = await Designation.findById(req.params.id);
  if (!designation) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Designation not found.',
    });
  }
  if (designation.activeEmployees > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot delete designation with ${designation.activeEmployees} active employee(s).`,
    });
  }
  await Designation.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Designation deactivated.',
  });
});

// ═══════════════════════════════════════════
// SALARY STRUCTURE
// ═══════════════════════════════════════════

exports.createSalaryStructure = catchAsync(async (req, res) => {
  const existing = await SalaryStructure.findOne({ code: req.body.code?.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Salary structure with code ${req.body.code} already exists.`,
    });
  }

  if (req.body.isDefault) {
    await SalaryStructure.updateMany({}, { isDefault: false });
  }

  const structure = await SalaryStructure.create({
    ...req.body,
    code: req.body.code?.toUpperCase(),
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Salary structure created.',
    data: { structure },
  });
});

exports.getAllSalaryStructures = catchAsync(async (req, res) => {
  const structures = await SalaryStructure.getAllActive();
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Salary structures fetched.',
    data: { structures },
  });
});

exports.getSalaryStructureById = catchAsync(async (req, res) => {
  const structure = await SalaryStructure.findById(req.params.id)
    .populate('department', 'name code')
    .populate('designation', 'name code')
    .lean();
  if (!structure) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Salary structure not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Salary structure fetched.',
    data: { structure },
  });
});

exports.updateSalaryStructure = catchAsync(async (req, res) => {
  if (req.body.isDefault) {
    await SalaryStructure.updateMany({}, { isDefault: false });
  }
  const structure = await SalaryStructure.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!structure) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Salary structure not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Salary structure updated.',
    data: { structure },
  });
});

exports.calculateSalaryPreview = catchAsync(async (req, res) => {
  const { basicSalary, allowances, absentDays } = req.body;
  const structure = await SalaryStructure.findById(req.params.id);
  if (!structure) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Salary structure not found.',
    });
  }

  const result = calculateNetSalary({
    basicSalary: basicSalary || 0,
    housingAllowance: allowances?.housing || 0,
    transportAllowance: allowances?.transport || 0,
    medicalAllowance: allowances?.medical || 0,
    teachingAllowance: allowances?.teaching || 0,
    managementAllowance: allowances?.management || 0,
    otherAllowances: allowances?.other || 0,
    absentDays: absentDays || 0,
    workingDaysPerMonth: structure.workingDaysPerMonth || 26,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Salary preview calculated.',
    data: { calculation: result },
  });
});

// ═══════════════════════════════════════════
// SALARY COMPONENT
// ═══════════════════════════════════════════

exports.getAllSalaryComponents = catchAsync(async (req, res) => {
  const { type } = req.query;
  let components;
  if (type === 'earning') {
    components = await SalaryComponent.getEarnings();
  } else if (type === 'deduction') {
    components = await SalaryComponent.getDeductions();
  } else {
    components = await SalaryComponent.getAllActive();
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Salary components fetched.',
    data: { components },
  });
});

exports.createSalaryComponent = catchAsync(async (req, res) => {
  const existing = await SalaryComponent.findOne({ code: req.body.code?.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Salary component with code ${req.body.code} already exists.`,
    });
  }
  const component = await SalaryComponent.create({
    ...req.body,
    code: req.body.code?.toUpperCase(),
    isActive: true,
    createdBy: req.user._id,
  });
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Salary component created.',
    data: { component },
  });
});

exports.updateSalaryComponent = catchAsync(async (req, res) => {
  const component = await SalaryComponent.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!component) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Salary component not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Salary component updated.',
    data: { component },
  });
});

// ═══════════════════════════════════════════
// PAYROLL
// ═══════════════════════════════════════════

exports.processMonthlyPayroll = catchAsync(async (req, res) => {
  const { month, year, academicYear } = req.body;

  if (!month || !year) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Month and year are required.',
    });
  }

  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;
  const batchId = generateBatchId('PAY');

  const results = await Payroll.processMonthlyPayroll({
    month,
    year,
    academicYearId: currentYear,
    processedBy: req.user._id,
    processedByName: `${req.user.firstName} ${req.user.fatherName}`,
    batchId,
  });

  await auditLog({
    req,
    action: 'PROCESS_PAYROLL',
    resource: 'payroll',
    description: `Monthly payroll processed for ${month}/${year}. Batch: ${batchId}. Processed: ${results.processed}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Payroll processed for ${month}/${year}. ${results.processed} payroll records created.`,
    data: { batchId, results },
  });
});

exports.getMonthlyPayroll = catchAsync(async (req, res) => {
  const { month, year, staffType, status, page = 1, limit = 50 } = req.query;

  if (!month || !year) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Month and year are required.',
    });
  }

  const filter = { month: parseInt(month), year: parseInt(year) };
  if (staffType) filter.staffType = staffType;
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [payrolls, total, summary] = await Promise.all([
    Payroll.find(filter)
      .sort({ 'staffSnapshot.firstName': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Payroll.countDocuments(filter),
    Payroll.getMonthlySummary(parseInt(month), parseInt(year)),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Payroll for ${month}/${year} fetched.`,
    data: { payrolls, summary },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getPayrollById = catchAsync(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate('teacher', 'firstName fatherName teacherId photo')
    .populate('employee', 'firstName fatherName employeeId photo')
    .populate('approvedBy', 'firstName fatherName')
    .lean();

  if (!payroll) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Payroll record not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payroll record fetched.',
    data: { payroll },
  });
});

exports.approvePayroll = catchAsync(async (req, res) => {
  const { remarks } = req.body;
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Payroll record not found.',
    });
  }
  await payroll.approve(req.user._id, `${req.user.firstName} ${req.user.fatherName}`, remarks);

  await auditLog({
    req,
    action: 'APPROVE',
    resource: 'payroll',
    resourceId: payroll._id,
    description: `Payroll approved for ${payroll.staffSnapshot?.staffId} — ${payroll.periodLabel}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payroll approved.',
    data: { payroll },
  });
});

exports.approvePayrollBatch = catchAsync(async (req, res) => {
  const { batchId, remarks } = req.body;
  if (!batchId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Batch ID is required.',
    });
  }

  const result = await Payroll.approveBatch(
    batchId,
    req.user._id,
    `${req.user.firstName} ${req.user.fatherName}`,
    remarks
  );

  await auditLog({
    req,
    action: 'APPROVE_BATCH',
    resource: 'payroll',
    description: `Payroll batch approved: ${batchId}. ${result.modifiedCount} records approved.`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${result.modifiedCount} payroll records approved.`,
    data: { approved: result.modifiedCount, batchId },
  });
});

exports.markPayrollPaid = catchAsync(async (req, res) => {
  const { paymentDate, paymentMethod, paymentReference } = req.body;
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Payroll record not found.',
    });
  }
  if (payroll.status !== 'approved') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Payroll must be approved before marking as paid.',
    });
  }
  await payroll.markPaid(req.user._id, paymentDate, paymentMethod, paymentReference);

  // Notify staff
  try {
    const staffUser =
      payroll.staffType === 'teacher'
        ? (await Teacher.findById(payroll.teacher).select('user').lean())?.user
        : (await Employee.findById(payroll.employee).select('user').lean())?.user;

    if (staffUser) {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      await notifySalarySlipReady(
        staffUser,
        months[payroll.month - 1],
        payroll.year,
        payroll.netSalary,
        payroll._id
      );
    }
  } catch (err) {
    console.error('Salary slip notification failed:', err.message);
  }

  await auditLog({
    req,
    action: 'MARK_PAID',
    resource: 'payroll',
    resourceId: payroll._id,
    description: `Payroll paid for ${payroll.staffSnapshot?.staffId} — ${payroll.periodLabel}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payroll marked as paid.',
    data: { payroll },
  });
});

exports.markBatchPaid = catchAsync(async (req, res) => {
  const { batchId, paymentDate, paymentMethod, paymentReference } = req.body;
  if (!batchId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Batch ID is required.',
    });
  }

  const result = await Payroll.markBatchPaid(
    batchId,
    req.user._id,
    paymentDate || new Date(),
    paymentMethod || 'Bank Transfer',
    paymentReference
  );

  await auditLog({
    req,
    action: 'BATCH_PAID',
    resource: 'payroll',
    description: `Payroll batch paid: ${batchId}. ${result.modifiedCount} records marked paid.`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${result.modifiedCount} payroll records marked as paid.`,
    data: { paid: result.modifiedCount, batchId },
  });
});

exports.getPayrollDashboard = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const queryMonth = parseInt(month) || now.getMonth() + 1;
  const queryYear = parseInt(year) || now.getFullYear();

  const stats = await Payroll.getDashboardStats(queryMonth, queryYear);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payroll dashboard fetched.',
    data: { month: queryMonth, year: queryYear, ...stats },
  });
});

// ═══════════════════════════════════════════
// LEAVE TYPE
// ═══════════════════════════════════════════

exports.createLeaveType = catchAsync(async (req, res) => {
  const existing = await LeaveType.findOne({ code: req.body.code?.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Leave type with code ${req.body.code} already exists.`,
    });
  }
  const leaveType = await LeaveType.create({
    ...req.body,
    code: req.body.code?.toUpperCase(),
    isActive: true,
    createdBy: req.user._id,
  });
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Leave type created.',
    data: { leaveType },
  });
});

exports.getAllLeaveTypes = catchAsync(async (req, res) => {
  const { staffType, gender } = req.query;
  let leaveTypes;

  if (staffType && gender) {
    leaveTypes = await LeaveType.find({
      isActive: true,
      applicableTo: { $in: [staffType, 'both'] },
      genderRestriction: { $in: [gender, 'All'] },
    }).sort({ sortOrder: 1 });
  } else if (staffType) {
    leaveTypes = await LeaveType.getForStaffType(staffType);
  } else {
    leaveTypes = await LeaveType.getAllActive();
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave types fetched.',
    data: { leaveTypes },
  });
});

exports.updateLeaveType = catchAsync(async (req, res) => {
  const leaveType = await LeaveType.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!leaveType) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Leave type not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave type updated.',
    data: { leaveType },
  });
});

exports.deleteLeaveType = catchAsync(async (req, res) => {
  await LeaveType.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave type deactivated.',
  });
});

// ═══════════════════════════════════════════
// LEAVE APPLICATION
// ═══════════════════════════════════════════

exports.applyLeave = catchAsync(async (req, res) => {
  const {
    staffType,
    teacher,
    employee,
    leaveType,
    startDate,
    endDate,
    numberOfDays,
    isHalfDay,
    halfDayType,
    reason,
    contactDuringLeave,
    contactAddress,
    handoverTo,
    handoverToName,
    handoverNotes,
    academicYear,
    term,
    notes,
  } = req.body;

  const staffId = teacher || employee;

  // Get staff info
  const staffDoc =
    staffType === 'teacher'
      ? await Teacher.findById(staffId).select(
          'firstName fatherName teacherId gender joinDate user departmentName designationName'
        )
      : await Employee.findById(staffId).select(
          'firstName fatherName employeeId gender joinDate user departmentName designationName'
        );

  if (!staffDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: `${staffType === 'teacher' ? 'Teacher' : 'Employee'} not found.`,
    });
  }

  const leaveTypeDoc = await LeaveType.findById(leaveType);
  if (!leaveTypeDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Leave type not found.',
    });
  }

  // Check eligibility
  const eligibility = leaveTypeDoc.isEligible(staffDoc);
  if (!eligibility.eligible) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: eligibility.issues[0],
      issues: eligibility.issues,
    });
  }

  // Check for overlapping leaves
  const hasOverlap = await LeaveApplication.hasOverlap(staffId, staffType, startDate, endDate);

  if (hasOverlap) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'You have an overlapping leave application for this period.',
    });
  }

  // Check advance notice
  if (!leaveTypeDoc.hasAdequateNotice(startDate)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `This leave requires at least ${leaveTypeDoc.advanceNoticeDays} day(s) advance notice.`,
    });
  }

  // Check leave balance
  const currentYearDoc = academicYear
    ? await AcademicYear.findById(academicYear)
    : await AcademicYear.getCurrent();

  let balance = null;
  if (currentYearDoc) {
    balance = await LeaveBalance.getBalance(staffId, staffType, leaveType, currentYearDoc._id);

    if (balance && !balance.hasEnoughBalance(numberOfDays)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Insufficient leave balance. Available: ${balance.availableDays} day(s), Requested: ${numberOfDays} day(s).`,
      });
    }
  }

  const application = await LeaveApplication.create({
    applicationNumber: '',
    staffType,
    teacher: teacher || null,
    employee: employee || null,
    staffName: `${staffDoc.firstName} ${staffDoc.fatherName}`,
    staffId: staffDoc.teacherId || staffDoc.employeeId,
    department: staffDoc.departmentName,
    designation: staffDoc.designationName,
    leaveType,
    leaveTypeName: leaveTypeDoc.name,
    leaveTypeCode: leaveTypeDoc.code,
    isPaidLeave: leaveTypeDoc.isPaid,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    numberOfDays,
    isHalfDay: isHalfDay || false,
    halfDayType: halfDayType || '',
    reason,
    contactDuringLeave: contactDuringLeave || null,
    contactAddress: contactAddress || null,
    handoverTo: handoverTo || null,
    handoverToName: handoverToName || null,
    handoverNotes: handoverNotes || null,
    academicYear: currentYearDoc?._id || null,
    academicYearName: currentYearDoc?.name || null,
    term: term || null,
    status: 'pending',
    notes,
    appliedAt: new Date(),
    createdBy: req.user._id,
  });

  // Add pending days to balance
  if (balance) {
    await balance.addPending(numberOfDays);
  }

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Leave application submitted.',
    data: { application },
  });
});

exports.getAllLeaveApplications = catchAsync(async (req, res) => {
  const {
    staffType,
    status,
    leaveType,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (staffType) filter.staffType = staffType;
  if (status) filter.status = status;
  if (leaveType) filter.leaveType = leaveType;

  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  if (search) {
    Object.assign(
      filter,
      buildSearchQuery(search, ['staffName', 'staffId', 'leaveTypeName', 'applicationNumber'])
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [applications, total] = await Promise.all([
    LeaveApplication.find(filter)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('leaveType', 'name code color isPaid')
      .populate('teacher', 'firstName fatherName teacherId photo primarySubject')
      .populate('employee', 'firstName fatherName employeeId photo departmentName')
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
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getLeaveApplicationById = catchAsync(async (req, res) => {
  const application = await LeaveApplication.findById(req.params.id)
    .populate('leaveType', 'name code color isPaid payPercentage')
    .populate('teacher', 'firstName fatherName teacherId photo')
    .populate('employee', 'firstName fatherName employeeId photo')
    .populate('handoverTo', 'firstName fatherName teacherId')
    .populate('firstApproval.approvedBy', 'firstName fatherName')
    .populate('secondApproval.approvedBy', 'firstName fatherName')
    .lean();

  if (!application) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Leave application not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave application fetched.',
    data: { application },
  });
});

exports.approveLeave = catchAsync(async (req, res) => {
  const { remarks, approvalLevel = 'first' } = req.body;
  const application = await LeaveApplication.findById(req.params.id);

  if (!application) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Leave application not found.',
    });
  }

  if (application.status !== 'pending') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Leave application is already ${application.status}.`,
    });
  }

  const userName = `${req.user.firstName} ${req.user.fatherName}`;

  if (approvalLevel === 'second') {
    await application.approveSecond(req.user._id, userName, remarks);
  } else {
    await application.approveFirst(req.user._id, userName, remarks);
  }

  // Notify staff
  try {
    const staffDoc =
      application.staffType === 'teacher'
        ? await Teacher.findById(application.teacher).select('user email').lean()
        : await Employee.findById(application.employee).select('user email').lean();

    if (application.status === 'approved' && staffDoc) {
      const dateRange = application.getDateRangeDisplay();
      await notifyLeaveStatus(
        staffDoc.user,
        'approved',
        application.leaveTypeName,
        dateRange,
        dateRange,
        application._id
      );

      if (staffDoc.email) {
        await sendLeaveStatusEmail(staffDoc.email, application.staffName, 'approved', {
          applicationNumber: application.applicationNumber,
          leaveTypeName: application.leaveTypeName,
          startDate: new Date(application.startDate).toLocaleDateString('en-ET'),
          endDate: new Date(application.endDate).toLocaleDateString('en-ET'),
          numberOfDays: application.numberOfDays,
          remarks,
        });
      }
    }
  } catch (err) {
    console.error('Leave approval notification failed:', err.message);
  }

  await auditLog({
    req,
    action: 'APPROVE',
    resource: 'leave_application',
    resourceId: application._id,
    description: `Leave ${approvalLevel === 'second' ? 'fully ' : ''}approved for ${application.staffName} — ${application.leaveTypeName}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Leave application ${approvalLevel === 'second' ? 'fully' : 'first-level'} approved.`,
    data: { application },
  });
});

exports.rejectLeave = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Rejection reason is required.',
    });
  }

  const application = await LeaveApplication.findById(req.params.id);
  if (!application) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Leave application not found.',
    });
  }

  await application.reject(req.user._id, `${req.user.firstName} ${req.user.fatherName}`, reason);

  // Remove pending days
  const balance = await LeaveBalance.getBalance(
    application.teacher || application.employee,
    application.staffType,
    application.leaveType,
    application.academicYear
  );
  if (balance) {
    await balance.removePending(application.numberOfDays);
  }

  // Notify staff
  try {
    const staffDoc =
      application.staffType === 'teacher'
        ? await Teacher.findById(application.teacher).select('user email').lean()
        : await Employee.findById(application.employee).select('user email').lean();

    if (staffDoc) {
      await notifyLeaveStatus(
        staffDoc.user,
        'rejected',
        application.leaveTypeName,
        new Date(application.startDate).toLocaleDateString('en-ET'),
        new Date(application.endDate).toLocaleDateString('en-ET'),
        application._id
      );
    }
  } catch (err) {
    console.error('Leave rejection notification failed:', err.message);
  }

  await auditLog({
    req,
    action: 'REJECT',
    resource: 'leave_application',
    resourceId: application._id,
    description: `Leave rejected for ${application.staffName} — ${application.leaveTypeName}. Reason: ${reason}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave application rejected.',
    data: { application },
  });
});

exports.cancelLeave = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const application = await LeaveApplication.findById(req.params.id);

  if (!application) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Leave application not found.',
    });
  }

  await application.cancel(req.user._id, reason || 'Cancelled by staff');

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave application cancelled.',
    data: { application },
  });
});

exports.getLeaveBalances = catchAsync(async (req, res) => {
  const { staffType, staffId } = req.params;
  const { academicYear } = req.query;

  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const balances = await LeaveBalance.getForStaff(staffId, staffType, currentYear);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave balances fetched.',
    data: { balances },
  });
});

exports.initializeLeaveBalances = catchAsync(async (req, res) => {
  const { academicYear, previousAcademicYear } = req.body;
  const academicYearDoc = await AcademicYear.findById(academicYear);

  if (!academicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  const results = await LeaveBalance.initializeForYear(
    academicYearDoc._id,
    academicYearDoc.name,
    previousAcademicYear || null,
    req.user._id
  );

  await auditLog({
    req,
    action: 'INITIALIZE',
    resource: 'leave_balance',
    description: `Leave balances initialized for ${academicYearDoc.name}. Created: ${results.created}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Leave balances initialized. Created: ${results.created}`,
    data: results,
  });
});

exports.getCurrentlyOnLeave = catchAsync(async (req, res) => {
  const onLeave = await LeaveApplication.getCurrentlyOnLeave();
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Currently on leave staff fetched.',
    data: { onLeave },
  });
});

exports.getHRMDashboard = catchAsync(async (req, res) => {
  const [
    departmentStats,
    pendingLeaves,
    currentlyOnLeave,
    payrollStats,
    totalTeachers,
    totalEmployees,
  ] = await Promise.all([
    Department.getDashboardStats(),
    LeaveApplication.getDashboardStats((await AcademicYear.getCurrent())?._id),
    LeaveApplication.countDocuments({
      status: 'approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }),
    Payroll.getPayrollDashboard
      ? Payroll.getDashboardStats(new Date().getMonth() + 1, new Date().getFullYear())
      : Promise.resolve({}),
    Teacher.countDocuments({ status: 'active' }),
    Employee.countDocuments({ status: 'active' }),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'HRM dashboard fetched.',
    data: {
      totalStaff: totalTeachers + totalEmployees,
      totalTeachers,
      totalEmployees,
      departmentStats,
      pendingLeaves,
      currentlyOnLeave,
      payrollStats,
    },
  });
});
