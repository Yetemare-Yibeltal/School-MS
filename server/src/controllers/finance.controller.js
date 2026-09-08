// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FINANCE CONTROLLER
// kat-school/server/src/controllers/finance.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const FeeType = require('../models/FeeType');
const FeeGroup = require('../models/FeeGroup');
const FeeDiscount = require('../models/FeeDiscount');
const FeeAssignment = require('../models/FeeAssignment');
const FeePayment = require('../models/FeePayment');
const PaymentReceipt = require('../models/PaymentReceipt');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Settings = require('../models/Settings');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const { generateReceiptNumber } = require('../utils/generateId.util');
const { buildSearchQuery, buildDateRangeFilter } = require('../utils/pagination.util');
const { sendReceiptEmail } = require('../utils/email.util');
const { notifyFeePaid, notifyFeeOverdue } = require('../utils/notification.util');

// ═══════════════════════════════════════════
// FEE TYPE
// ═══════════════════════════════════════════

exports.createFeeType = catchAsync(async (req, res) => {
  const {
    name,
    code,
    category,
    amount,
    frequency,
    applicableGrades,
    isMandatory,
    isRefundable,
    refundPolicy,
    lateFineEnabled,
    lateFineAmount,
    lateFinePerDay,
    gracePeriodDays,
    dueDate,
    description,
    color,
  } = req.body;

  const existing = await FeeType.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Fee type with code ${code} already exists.`,
    });
  }

  const feeType = await FeeType.create({
    name,
    code: code.toUpperCase(),
    category,
    amount,
    frequency: frequency || 'per_year',
    applicableGrades: applicableGrades || [],
    isMandatory: isMandatory !== false,
    isRefundable: isRefundable || false,
    refundPolicy,
    lateFineEnabled: lateFineEnabled || false,
    lateFineAmount: lateFineAmount || 0,
    lateFinePerDay: lateFinePerDay || 0,
    gracePeriodDays: gracePeriodDays || 0,
    dueDate: dueDate || null,
    description,
    color: color || '#4f46e5',
    isActive: true,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'fee_type',
    resourceId: feeType._id,
    description: `Fee type created: ${name} (${code})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Fee type created successfully.',
    data: { feeType },
  });
});

exports.getAllFeeTypes = catchAsync(async (req, res) => {
  const { category, grade, isActive = true, search } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (grade) filter.applicableGrades = grade;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['name', 'code', 'category']));
  }

  const feeTypes = await FeeType.find(filter).sort({ category: 1, name: 1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee types fetched.',
    data: { feeTypes },
  });
});

exports.getFeeTypeById = catchAsync(async (req, res) => {
  const feeType = await FeeType.findById(req.params.id).lean();
  if (!feeType) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee type not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee type fetched.',
    data: { feeType },
  });
});

exports.updateFeeType = catchAsync(async (req, res) => {
  const feeType = await FeeType.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!feeType) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee type not found.',
    });
  }

  await auditLog({
    req,
    action: 'UPDATE',
    resource: 'fee_type',
    resourceId: feeType._id,
    description: `Fee type updated: ${feeType.name}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee type updated.',
    data: { feeType },
  });
});

exports.deleteFeeType = catchAsync(async (req, res) => {
  const feeType = await FeeType.findByIdAndUpdate(
    req.params.id,
    { isActive: false, updatedBy: req.user._id },
    { new: true }
  );
  if (!feeType) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee type not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee type deactivated.',
  });
});

// ═══════════════════════════════════════════
// FEE GROUP
// ═══════════════════════════════════════════

exports.createFeeGroup = catchAsync(async (req, res) => {
  const { name, code, feeTypes, applicableGrades, academicYear, description } = req.body;

  const existing = await FeeGroup.findOne({ code: code.toUpperCase(), academicYear });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Fee group with code ${code} already exists for this academic year.`,
    });
  }

  const academicYearDoc = await AcademicYear.findById(academicYear);
  if (!academicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  const feeTypeDocs = await FeeType.find({ _id: { $in: feeTypes } }).lean();
  const totalAmount = feeTypeDocs.reduce((sum, ft) => sum + (ft.amount || 0), 0);

  const feeGroup = await FeeGroup.create({
    name,
    code: code.toUpperCase(),
    feeTypes,
    applicableGrades: applicableGrades || [],
    academicYear,
    academicYearName: academicYearDoc.name,
    totalAmount,
    description,
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Fee group created.',
    data: { feeGroup },
  });
});

exports.getAllFeeGroups = catchAsync(async (req, res) => {
  const { academicYear, grade } = req.query;
  const filter = { isActive: true };
  if (academicYear) filter.academicYear = academicYear;
  if (grade) filter.applicableGrades = grade;

  const feeGroups = await FeeGroup.find(filter)
    .sort({ name: 1 })
    .populate('feeTypes', 'name code amount category')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee groups fetched.',
    data: { feeGroups },
  });
});

exports.updateFeeGroup = catchAsync(async (req, res) => {
  const feeGroup = await FeeGroup.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!feeGroup) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee group not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee group updated.',
    data: { feeGroup },
  });
});

exports.deleteFeeGroup = catchAsync(async (req, res) => {
  await FeeGroup.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee group deactivated.',
  });
});

// ═══════════════════════════════════════════
// FEE DISCOUNT
// ═══════════════════════════════════════════

exports.createFeeDiscount = catchAsync(async (req, res) => {
  const {
    name,
    code,
    type,
    value,
    applicableTo,
    feeType,
    maxDiscountAmount,
    category,
    applicableGrades,
    validFrom,
    validTo,
    requiresApproval,
    description,
  } = req.body;

  const existing = await FeeDiscount.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Discount with code ${code} already exists.`,
    });
  }

  const feeDiscount = await FeeDiscount.create({
    name,
    code: code.toUpperCase(),
    type,
    value,
    applicableTo,
    feeType: feeType || null,
    maxDiscountAmount: maxDiscountAmount || null,
    category,
    applicableGrades: applicableGrades || [],
    validFrom: validFrom || null,
    validTo: validTo || null,
    requiresApproval: requiresApproval || false,
    description,
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Fee discount created.',
    data: { feeDiscount },
  });
});

exports.getAllFeeDiscounts = catchAsync(async (req, res) => {
  const { category, type, isActive = true } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const feeDiscounts = await FeeDiscount.find(filter).sort({ name: 1 }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee discounts fetched.',
    data: { feeDiscounts },
  });
});

exports.updateFeeDiscount = catchAsync(async (req, res) => {
  const feeDiscount = await FeeDiscount.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!feeDiscount) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee discount not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee discount updated.',
    data: { feeDiscount },
  });
});

exports.deleteFeeDiscount = catchAsync(async (req, res) => {
  await FeeDiscount.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee discount deactivated.',
  });
});

// ═══════════════════════════════════════════
// FEE ASSIGNMENT
// ═══════════════════════════════════════════

exports.assignFee = catchAsync(async (req, res) => {
  const {
    student,
    feeType,
    academicYear,
    term,
    amount,
    dueDate,
    discounts,
    allowInstallments,
    installmentCount,
    notes,
  } = req.body;

  const [studentDoc, feeTypeDoc, academicYearDoc] = await Promise.all([
    Student.findById(student).select(
      'firstName fatherName studentId grade section sectionName academicYear'
    ),
    FeeType.findById(feeType),
    AcademicYear.findById(academicYear),
  ]);

  if (!studentDoc) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Student not found.' });
  }
  if (!feeTypeDoc) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Fee type not found.' });
  }

  // Check duplicate assignment
  const existing = await FeeAssignment.findOne({
    student,
    feeType,
    academicYear,
    ...(term ? { term } : {}),
    status: { $nin: ['cancelled', 'waived'] },
  });

  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Fee already assigned to this student for this period.',
      data: { assignment: existing },
    });
  }

  // Calculate discount amounts
  let totalDiscountAmount = 0;
  const processedDiscounts = [];

  if (discounts && discounts.length > 0) {
    for (const d of discounts) {
      const discountDoc = await FeeDiscount.findById(d.discount);
      if (!discountDoc) continue;

      let discountAmount = 0;
      if (discountDoc.type === 'percentage') {
        discountAmount = (amount * discountDoc.value) / 100;
        if (discountDoc.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, discountDoc.maxDiscountAmount);
        }
      } else {
        discountAmount = discountDoc.value;
      }

      totalDiscountAmount += discountAmount;
      processedDiscounts.push({
        discount: discountDoc._id,
        discountName: discountDoc.name,
        discountCode: discountDoc.code,
        discountType: discountDoc.type,
        discountValue: discountDoc.value,
        discountAmount: Math.round(discountAmount),
      });
    }
  }

  const netAmount = Math.max(0, amount - totalDiscountAmount);
  const termDoc = term ? await Term.findById(term) : null;

  const assignment = await FeeAssignment.create({
    student,
    studentName: `${studentDoc.firstName} ${studentDoc.fatherName}`,
    studentId: studentDoc.studentId,
    grade: studentDoc.grade,
    section: studentDoc.section,
    sectionName: studentDoc.sectionName,
    feeType,
    feeTypeName: feeTypeDoc.name,
    feeTypeCode: feeTypeDoc.code,
    academicYear,
    academicYearName: academicYearDoc?.name || '',
    term: term || null,
    termName: termDoc?.name || null,
    amount,
    discountAmount: totalDiscountAmount,
    netAmount,
    discounts: processedDiscounts,
    paidAmount: 0,
    remainingAmount: netAmount,
    dueDate,
    allowInstallments: allowInstallments || false,
    installmentCount: allowInstallments ? installmentCount || 2 : null,
    notes,
    status: 'unpaid',
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'fee_assignment',
    resourceId: assignment._id,
    description: `Fee assigned: ${feeTypeDoc.name} to ${studentDoc.firstName} ${studentDoc.fatherName} (${studentDoc.studentId})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Fee assigned successfully.',
    data: { assignment },
  });
});

exports.bulkAssignFees = catchAsync(async (req, res) => {
  const { grade, section, feeType, academicYear, term, amount, dueDate, notes } = req.body;

  const [feeTypeDoc, academicYearDoc] = await Promise.all([
    FeeType.findById(feeType),
    AcademicYear.findById(academicYear),
  ]);

  if (!feeTypeDoc || !academicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee type or academic year not found.',
    });
  }

  const filter = { grade, status: 'active' };
  if (section) filter.section = section;

  const students = await Student.find(filter)
    .select('firstName fatherName studentId grade section sectionName')
    .lean();

  if (students.length === 0) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'No students found for this criteria.',
      data: { assigned: 0, skipped: 0 },
    });
  }

  const termDoc = term ? await Term.findById(term) : null;
  const results = { assigned: 0, skipped: 0, errors: [] };

  for (const student of students) {
    try {
      const existing = await FeeAssignment.findOne({
        student: student._id,
        feeType,
        academicYear,
        status: { $nin: ['cancelled', 'waived'] },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await FeeAssignment.create({
        student: student._id,
        studentName: `${student.firstName} ${student.fatherName}`,
        studentId: student.studentId,
        grade: student.grade,
        section: student.section,
        sectionName: student.sectionName,
        feeType,
        feeTypeName: feeTypeDoc.name,
        feeTypeCode: feeTypeDoc.code,
        academicYear,
        academicYearName: academicYearDoc.name,
        term: term || null,
        termName: termDoc?.name || null,
        amount,
        discountAmount: 0,
        netAmount: amount,
        paidAmount: 0,
        remainingAmount: amount,
        dueDate,
        notes,
        status: 'unpaid',
        createdBy: req.user._id,
      });

      results.assigned++;
    } catch (error) {
      results.errors.push({ studentId: student._id, error: error.message });
    }
  }

  await auditLog({
    req,
    action: 'BULK_ASSIGN',
    resource: 'fee_assignment',
    description: `Bulk fee assignment: ${feeTypeDoc.name} for ${grade}. Assigned: ${results.assigned}, Skipped: ${results.skipped}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Assigned to ${results.assigned} students. ${results.skipped} already assigned.`,
    data: results,
  });
});

exports.getFeeAssignments = catchAsync(async (req, res) => {
  const {
    student,
    grade,
    section,
    feeType,
    academicYear,
    term,
    status,
    search,
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = 'desc',
  } = req.query;

  const filter = {};
  if (student) filter.student = student;
  if (grade) filter.grade = grade;
  if (section) filter.section = section;
  if (feeType) filter.feeType = feeType;
  if (term) filter.term = term;
  if (status) filter.status = status;

  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['studentName', 'studentId', 'feeTypeName']));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [assignments, total] = await Promise.all([
    FeeAssignment.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('student', 'firstName fatherName studentId photo')
      .populate('feeType', 'name code category color')
      .lean(),
    FeeAssignment.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee assignments fetched.',
    data: { assignments },
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

exports.getFeeAssignmentById = catchAsync(async (req, res) => {
  const assignment = await FeeAssignment.findById(req.params.id)
    .populate('student', 'firstName fatherName studentId grade photo')
    .populate('feeType', 'name code category amount description')
    .populate('academicYear', 'name')
    .populate('term', 'name termNumber')
    .lean();

  if (!assignment) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee assignment not found.',
    });
  }

  // Get payments for this assignment
  const payments = await FeePayment.find({
    feeAssignment: req.params.id,
    status: { $ne: 'cancelled' },
  })
    .sort({ paymentDate: -1 })
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee assignment fetched.',
    data: { assignment, payments },
  });
});

exports.updateFeeAssignment = catchAsync(async (req, res) => {
  const forbiddenFields = ['student', 'feeType', 'academicYear', 'paidAmount', 'status'];
  forbiddenFields.forEach((f) => delete req.body[f]);

  const assignment = await FeeAssignment.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!assignment) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee assignment not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee assignment updated.',
    data: { assignment },
  });
});

exports.cancelFeeAssignment = catchAsync(async (req, res) => {
  const assignment = await FeeAssignment.findById(req.params.id);
  if (!assignment) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee assignment not found.',
    });
  }

  if (assignment.paidAmount > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot cancel an assignment that has payments. Refund the payments first.',
    });
  }

  assignment.status = 'cancelled';
  assignment.updatedBy = req.user._id;
  await assignment.save();

  await auditLog({
    req,
    action: 'CANCEL',
    resource: 'fee_assignment',
    resourceId: assignment._id,
    description: `Fee assignment cancelled: ${assignment.feeTypeName} for ${assignment.studentName}`,
    severity: 'medium',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee assignment cancelled.',
  });
});

// ═══════════════════════════════════════════
// FEE PAYMENT
// ═══════════════════════════════════════════

exports.collectPayment = catchAsync(async (req, res) => {
  const {
    feeAssignment,
    student,
    amount,
    method,
    paymentDate,
    transactionReference,
    bankName,
    chequeNumber,
    mobileTransactionId,
    paidBy,
    guardian,
    isInstallment,
    installmentNumber,
    notes,
    generateReceipt,
    sendEmailReceipt,
  } = req.body;

  const assignment = await FeeAssignment.findById(feeAssignment)
    .populate('feeType', 'name code')
    .lean();

  if (!assignment) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee assignment not found.',
    });
  }

  if (assignment.status === 'paid') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'This fee has already been fully paid.',
    });
  }

  if (assignment.status === 'cancelled' || assignment.status === 'waived') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot collect payment for a ${assignment.status} fee.`,
    });
  }

  if (amount > assignment.remainingAmount) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Payment amount (ETB ${amount}) exceeds remaining balance (ETB ${assignment.remainingAmount}).`,
    });
  }

  const settings = await Settings.getSettings();
  const receiptNumber = await generateReceiptNumber();

  const studentDoc = await Student.findById(student)
    .select('firstName fatherName studentId grade sectionName user')
    .lean();

  const academicYearDoc = await AcademicYear.findById(assignment.academicYear).lean();

  const payment = await FeePayment.create({
    receiptNumber,
    student,
    studentName: assignment.studentName,
    studentId: assignment.studentId,
    grade: assignment.grade,
    section: assignment.section,
    sectionName: assignment.sectionName,
    feeAssignment,
    feeType: assignment.feeType,
    feeTypeName: assignment.feeTypeName,
    feeTypeCode: assignment.feeTypeCode,
    academicYear: assignment.academicYear,
    academicYearName: assignment.academicYearName,
    term: assignment.term,
    termName: assignment.termName,
    totalFeeAmount: assignment.amount,
    discountAmount: assignment.discountAmount,
    netAmount: assignment.netAmount,
    amount,
    previousAmountPaid: assignment.paidAmount,
    totalAmountPaid: assignment.paidAmount + amount,
    remainingBalance: Math.max(0, assignment.netAmount - (assignment.paidAmount + amount)),
    penaltyAmount: 0,
    method,
    transactionReference: transactionReference || null,
    bankName: bankName || null,
    chequeNumber: chequeNumber || null,
    mobileTransactionId: mobileTransactionId || null,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    status: 'completed',
    isInstallment: isInstallment || false,
    installmentNumber: installmentNumber || null,
    paidBy: {
      name: paidBy?.name || assignment.studentName,
      relationship: paidBy?.relationship || 'Student',
      phone: paidBy?.phone || null,
    },
    guardian: guardian || null,
    collectedBy: req.user._id,
    collectedByName: `${req.user.firstName} ${req.user.fatherName}`,
    notes,
    createdBy: req.user._id,
  });

  // Update fee assignment
  const newPaidAmount = assignment.paidAmount + amount;
  const newRemainingAmount = Math.max(0, assignment.netAmount - newPaidAmount);
  const newStatus = newRemainingAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';

  await FeeAssignment.findByIdAndUpdate(feeAssignment, {
    paidAmount: newPaidAmount,
    remainingAmount: newRemainingAmount,
    status: newStatus,
    lastPaymentDate: new Date(),
    lastPaymentAmount: amount,
    updatedBy: req.user._id,
  });

  // Record income
  await Income.create({
    title: `${assignment.feeTypeName} — ${assignment.studentName}`,
    category: assignment.feeType?.category || 'Tuition Fee',
    amount,
    paymentMethod: method,
    date: paymentDate ? new Date(paymentDate) : new Date(),
    academicYear: assignment.academicYear,
    academicYearName: assignment.academicYearName,
    term: assignment.term,
    termName: assignment.termName,
    source: `Student: ${assignment.studentId}`,
    student,
    feePayment: payment._id,
    receivedBy: req.user._id,
    receivedByName: `${req.user.firstName} ${req.user.fatherName}`,
    status: 'confirmed',
    isApproved: true,
    approvedAt: new Date(),
    createdBy: req.user._id,
  });

  // Generate receipt
  let receipt = null;
  if (generateReceipt !== false) {
    receipt = await PaymentReceipt.createFromPayment(payment, req.user._id);
  }

  // In-app notification
  if (studentDoc?.user) {
    try {
      await notifyFeePaid(
        assignment.studentName,
        assignment.feeTypeName,
        amount,
        receiptNumber,
        studentDoc.user,
        payment._id
      );
    } catch (err) {
      console.error('Notification failed:', err.message);
    }
  }

  // Email receipt
  if (sendEmailReceipt && paidBy?.email) {
    try {
      await sendReceiptEmail(paidBy.email, paidBy.name, {
        receiptNumber,
        studentName: assignment.studentName,
        studentId: assignment.studentId,
        feeTypeName: assignment.feeTypeName,
        amount,
        paymentDate: new Date(paymentDate || Date.now()).toLocaleDateString('en-ET'),
        paymentMethod: method,
        academicYearName: assignment.academicYearName,
        collectedByName: `${req.user.firstName} ${req.user.fatherName}`,
        remainingBalance: newRemainingAmount,
      });
    } catch (err) {
      console.error('Receipt email failed:', err.message);
    }
  }

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'fee_payment',
    resourceId: payment._id,
    description: `Payment collected: ETB ${amount} for ${assignment.feeTypeName} — ${assignment.studentName}. Receipt: ${receiptNumber}`,
    severity: 'medium',
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `Payment of ETB ${amount.toLocaleString()} collected. Receipt: ${receiptNumber}`,
    data: { payment, receipt },
  });
});

exports.getAllPayments = catchAsync(async (req, res) => {
  const {
    student,
    grade,
    feeType,
    academicYear,
    term,
    method,
    status,
    search,
    page = 1,
    limit = 20,
    startDate,
    endDate,
    sort = 'paymentDate',
    order = 'desc',
  } = req.query;

  const filter = {};
  if (student) filter.student = student;
  if (grade) filter.grade = grade;
  if (feeType) filter.feeType = feeType;
  if (term) filter.term = term;
  if (method) filter.method = method;
  if (status) filter.status = status;

  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (startDate || endDate) {
    Object.assign(filter, buildDateRangeFilter(startDate, endDate, 'paymentDate'));
  }

  if (search) {
    Object.assign(
      filter,
      buildSearchQuery(search, ['studentName', 'studentId', 'receiptNumber', 'feeTypeName'])
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [payments, total] = await Promise.all([
    FeePayment.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('student', 'firstName fatherName studentId photo')
      .populate('collectedBy', 'firstName fatherName')
      .lean(),
    FeePayment.countDocuments(filter),
  ]);

  // Summary
  const summary = await FeePayment.aggregate([
    { $match: { ...filter, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payments fetched.',
    data: { payments, summary: summary[0] || { totalAmount: 0, count: 0 } },
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

exports.getPaymentById = catchAsync(async (req, res) => {
  const payment = await FeePayment.findById(req.params.id)
    .populate('student', 'firstName fatherName studentId grade photo')
    .populate('feeType', 'name code category')
    .populate('collectedBy', 'firstName fatherName role')
    .lean();

  if (!payment) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Payment not found.',
    });
  }

  const receipt = await PaymentReceipt.findOne({
    receiptNumber: payment.receiptNumber,
  }).lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payment fetched.',
    data: { payment, receipt },
  });
});

exports.refundPayment = catchAsync(async (req, res) => {
  const { refundAmount, refundReason } = req.body;
  const payment = await FeePayment.findById(req.params.id);

  if (!payment) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Payment not found.',
    });
  }

  if (payment.isRefunded) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Payment has already been refunded.',
    });
  }

  const actualRefund = refundAmount || payment.amount;

  await payment.processRefund(actualRefund, refundReason, req.user._id);

  // Update fee assignment
  await FeeAssignment.findByIdAndUpdate(payment.feeAssignment, {
    $inc: { paidAmount: -actualRefund, remainingAmount: actualRefund },
    status: 'partial',
    updatedBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'REFUND',
    resource: 'fee_payment',
    resourceId: payment._id,
    description: `Payment refunded: ETB ${actualRefund} for ${payment.studentName}. Reason: ${refundReason}`,
    severity: 'high',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `ETB ${actualRefund} refunded successfully.`,
    data: { payment },
  });
});

exports.getPaymentStats = catchAsync(async (req, res) => {
  const { academicYear } = req.query;
  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;
  if (!currentYear) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: FeePayment.getDashboardStats(null),
    });
  }
  const stats = await FeePayment.getDashboardStats(currentYear);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payment stats fetched.',
    data: stats,
  });
});

// ═══════════════════════════════════════════
// INCOME
// ═══════════════════════════════════════════

exports.createIncome = catchAsync(async (req, res) => {
  const {
    title,
    category,
    subCategory,
    amount,
    paymentMethod,
    date,
    academicYear,
    term,
    source,
    transactionReference,
    invoiceNumber,
    description,
    notes,
  } = req.body;

  const academicYearDoc = await AcademicYear.findById(academicYear);
  if (!academicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Academic year not found.',
    });
  }

  const termDoc = term ? await Term.findById(term) : null;

  const income = await Income.create({
    title,
    category,
    subCategory,
    amount,
    netAmount: amount,
    paymentMethod,
    date: date ? new Date(date) : new Date(),
    academicYear,
    academicYearName: academicYearDoc.name,
    term: term || null,
    termName: termDoc?.name || null,
    source,
    transactionReference,
    invoiceNumber,
    description,
    notes,
    receivedBy: req.user._id,
    receivedByName: `${req.user.firstName} ${req.user.fatherName}`,
    status: 'confirmed',
    isApproved: true,
    approvedAt: new Date(),
    approvedBy: req.user._id,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'income',
    resourceId: income._id,
    description: `Income recorded: ${title} — ETB ${amount} (${category})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Income recorded.',
    data: { income },
  });
});

exports.getAllIncome = catchAsync(async (req, res) => {
  const {
    category,
    academicYear,
    term,
    status,
    search,
    page = 1,
    limit = 20,
    sort = 'date',
    order = 'desc',
    startDate,
    endDate,
  } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (term) filter.term = term;
  if (status) filter.status = status;

  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (startDate || endDate) {
    Object.assign(filter, buildDateRangeFilter(startDate, endDate, 'date'));
  }

  if (search) {
    Object.assign(
      filter,
      buildSearchQuery(search, ['title', 'category', 'source', 'incomeNumber'])
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [income, total] = await Promise.all([
    Income.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('receivedBy', 'firstName fatherName')
      .lean(),
    Income.countDocuments(filter),
  ]);

  const summary = await Income.aggregate([
    { $match: { ...filter, status: 'confirmed' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Income records fetched.',
    data: { income, summary: summary[0] || { total: 0, count: 0 } },
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

exports.updateIncome = catchAsync(async (req, res) => {
  const income = await Income.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!income) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Income record not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Income updated.',
    data: { income },
  });
});

exports.deleteIncome = catchAsync(async (req, res) => {
  await Income.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Income cancelled.',
  });
});

// ═══════════════════════════════════════════
// EXPENSE
// ═══════════════════════════════════════════

exports.createExpenseCategory = catchAsync(async (req, res) => {
  const existing = await ExpenseCategory.findOne({ code: req.body.code?.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Expense category with code ${req.body.code} already exists.`,
    });
  }

  const category = await ExpenseCategory.create({
    ...req.body,
    code: req.body.code?.toUpperCase(),
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Expense category created.',
    data: { category },
  });
});

exports.getAllExpenseCategories = catchAsync(async (req, res) => {
  const { academicYear } = req.query;
  const categories = await ExpenseCategory.getAllActive();
  let result = categories;

  if (academicYear) {
    result = await ExpenseCategory.getWithBudgetStatus(academicYear);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Expense categories fetched.',
    data: { categories: result },
  });
});

exports.createExpense = catchAsync(async (req, res) => {
  const {
    title,
    category,
    amount,
    taxAmount,
    date,
    academicYear,
    term,
    vendor,
    department,
    invoiceNumber,
    isBudgeted,
    budgetedAmount,
    isRecurring,
    recurringFrequency,
    description,
    notes,
  } = req.body;

  const [categoryDoc, academicYearDoc] = await Promise.all([
    ExpenseCategory.findById(category),
    AcademicYear.findById(academicYear),
  ]);

  if (!categoryDoc || !academicYearDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Expense category or academic year not found.',
    });
  }

  const termDoc = term ? await Term.findById(term) : null;

  const expense = await Expense.create({
    title,
    category,
    categoryName: categoryDoc.name,
    amount,
    taxAmount: taxAmount || 0,
    totalAmount: amount + (taxAmount || 0),
    date: date ? new Date(date) : new Date(),
    academicYear,
    academicYearName: academicYearDoc.name,
    term: term || null,
    termName: termDoc?.name || null,
    vendor: vendor || {},
    department: department || null,
    invoiceNumber,
    isBudgeted: isBudgeted || false,
    budgetedAmount: budgetedAmount || 0,
    isRecurring: isRecurring || false,
    recurringFrequency: recurringFrequency || '',
    description,
    notes,
    requestedBy: req.user._id,
    requestedByName: `${req.user.firstName} ${req.user.fatherName}`,
    requestedAt: new Date(),
    status: 'pending_approval',
    approvalStatus: 'pending',
    secondApprovalThreshold: 10000,
    createdBy: req.user._id,
  });

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'expense',
    resourceId: expense._id,
    description: `Expense created: ${title} — ETB ${amount} (${categoryDoc.name})`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Expense submitted for approval.',
    data: { expense },
  });
});

exports.getAllExpenses = catchAsync(async (req, res) => {
  const {
    category,
    academicYear,
    term,
    status,
    approvalStatus,
    department,
    search,
    page = 1,
    limit = 20,
    sort = 'date',
    order = 'desc',
    startDate,
    endDate,
  } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (term) filter.term = term;
  if (status) filter.status = status;
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (department) filter.department = department;

  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (startDate || endDate) {
    Object.assign(filter, buildDateRangeFilter(startDate, endDate, 'date'));
  }

  if (search) {
    Object.assign(
      filter,
      buildSearchQuery(search, ['title', 'categoryName', 'expenseNumber', 'vendor.name'])
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name code color')
      .populate('requestedBy', 'firstName fatherName')
      .lean(),
    Expense.countDocuments(filter),
  ]);

  const summary = await Expense.aggregate([
    { $match: { ...filter, status: { $in: ['approved', 'paid'] } } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Expenses fetched.',
    data: { expenses, summary: summary[0] || { total: 0, count: 0 } },
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

exports.getExpenseById = catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id)
    .populate('category', 'name code color icon')
    .populate('requestedBy', 'firstName fatherName role')
    .populate('department', 'name code')
    .populate('firstApproval.approvedBy', 'firstName fatherName')
    .populate('secondApproval.approvedBy', 'firstName fatherName')
    .lean();

  if (!expense) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Expense not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Expense fetched.',
    data: { expense },
  });
});

exports.updateExpense = catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Expense not found.',
    });
  }

  if (!['draft', 'pending_approval'].includes(expense.status)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot edit expense with status: ${expense.status}`,
    });
  }

  Object.assign(expense, req.body);
  expense.updatedBy = req.user._id;
  await expense.save();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Expense updated.',
    data: { expense },
  });
});

exports.approveExpense = catchAsync(async (req, res) => {
  const { remarks, approvalLevel = 'first' } = req.body;
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Expense not found.',
    });
  }

  const userName = `${req.user.firstName} ${req.user.fatherName}`;

  if (approvalLevel === 'second') {
    await expense.approveSecond(req.user._id, userName, remarks);
  } else {
    await expense.approveFirst(req.user._id, userName, remarks);
  }

  await auditLog({
    req,
    action: 'APPROVE',
    resource: 'expense',
    resourceId: expense._id,
    description: `Expense approved (${approvalLevel} level): ${expense.title} — ETB ${expense.amount}`,
    severity: 'medium',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Expense ${approvalLevel === 'second' ? 'fully' : 'first-level'} approved.`,
    data: { expense },
  });
});

exports.rejectExpense = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Rejection reason is required.',
    });
  }

  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Expense not found.',
    });
  }

  await expense.reject(req.user._id, `${req.user.firstName} ${req.user.fatherName}`, reason);

  await auditLog({
    req,
    action: 'REJECT',
    resource: 'expense',
    resourceId: expense._id,
    description: `Expense rejected: ${expense.title}. Reason: ${reason}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Expense rejected.',
    data: { expense },
  });
});

exports.markExpensePaid = catchAsync(async (req, res) => {
  const { paymentMethod, paymentReference } = req.body;
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Expense not found.',
    });
  }

  if (expense.status !== 'approved') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Expense must be approved before marking as paid.',
    });
  }

  const userName = `${req.user.firstName} ${req.user.fatherName}`;
  await expense.markPaid(req.user._id, userName, {
    method: paymentMethod,
    transactionReference: paymentReference,
  });

  await auditLog({
    req,
    action: 'MARK_PAID',
    resource: 'expense',
    resourceId: expense._id,
    description: `Expense paid: ${expense.title} — ETB ${expense.amount}`,
    severity: 'medium',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Expense marked as paid.',
    data: { expense },
  });
});

exports.deleteExpense = catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Expense not found.',
    });
  }

  if (expense.status === 'paid') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot delete a paid expense.',
    });
  }

  await expense.cancel('Deleted by admin');

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Expense cancelled.',
  });
});

// ═══════════════════════════════════════════
// FINANCIAL DASHBOARD
// ═══════════════════════════════════════════

exports.getFinancialDashboard = catchAsync(async (req, res) => {
  const { academicYear } = req.query;
  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  if (!currentYear) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {},
    });
  }

  const [
    incomeStats,
    expenseStats,
    paymentStats,
    feeCollectionRate,
    overdueAssignments,
    recentPayments,
    incomeByCategory,
    expenseByCategory,
  ] = await Promise.all([
    Income.getDashboardStats(currentYear),
    Expense.getDashboardStats(currentYear),
    FeePayment.getDashboardStats(currentYear),
    FeeAssignment.aggregate([
      { $match: { academicYear: new mongoose.Types.ObjectId(currentYear) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalNetAmount: { $sum: '$netAmount' },
          totalPaid: { $sum: '$paidAmount' },
        },
      },
    ]),
    FeeAssignment.find({
      academicYear: currentYear,
      status: { $in: ['unpaid', 'partial'] },
      dueDate: { $lt: new Date() },
    })
      .sort({ dueDate: 1 })
      .limit(10)
      .populate('student', 'firstName fatherName studentId grade photo')
      .select(
        'studentName studentId grade feeTypeName netAmount paidAmount remainingAmount dueDate'
      )
      .lean(),
    FeePayment.find({
      academicYear: currentYear,
      status: 'completed',
    })
      .sort({ paymentDate: -1 })
      .limit(10)
      .populate('student', 'firstName fatherName studentId photo')
      .select('receiptNumber studentName amount method paymentDate feeTypeName')
      .lean(),
    Income.getByCategoryForPeriod(currentYear),
    Expense.getByCategoryForPeriod(currentYear),
  ]);

  // Calculate income vs expense comparison
  const incomeVsExpense = await Income.getIncomeVsExpense(currentYear);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Financial dashboard fetched.',
    data: {
      incomeStats,
      expenseStats,
      paymentStats,
      feeCollectionRate,
      overdueAssignments,
      recentPayments,
      incomeByCategory,
      expenseByCategory,
      incomeVsExpense,
    },
  });
});

exports.getFinancialReport = catchAsync(async (req, res) => {
  const { academicYear, term, startDate, endDate, type } = req.query;
  const currentYear = academicYear || (await AcademicYear.getCurrent())?._id;

  const dateFilter = buildDateRangeFilter(startDate, endDate, 'date');

  const yearFilter = { academicYear: currentYear, ...(term ? { term } : {}) };

  const [totalIncome, totalExpenses, feeCollection, paymentsByMethod, monthlyComparison] =
    await Promise.all([
      Income.aggregate([
        { $match: { ...yearFilter, ...dateFilter, status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { ...yearFilter, ...dateFilter, status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      FeeAssignment.aggregate([
        { $match: { ...yearFilter } },
        {
          $group: {
            _id: null,
            totalAssigned: { $sum: '$netAmount' },
            totalCollected: { $sum: '$paidAmount' },
            totalOutstanding: { $sum: '$remainingAmount' },
          },
        },
      ]),
      FeePayment.getSummaryByMethod(currentYear, startDate, endDate),
      Income.getMonthlyTotals(currentYear),
    ]);

  const income = totalIncome[0]?.total || 0;
  const expenses = totalExpenses[0]?.total || 0;
  const netBalance = income - expenses;

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Financial report generated.',
    data: {
      academicYear: currentYear,
      period: { startDate, endDate },
      summary: {
        totalIncome: income,
        totalExpenses: expenses,
        netBalance,
        profitLoss: netBalance >= 0 ? 'Surplus' : 'Deficit',
      },
      feeCollection: feeCollection[0] || {
        totalAssigned: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      },
      paymentsByMethod,
      monthlyComparison,
    },
  });
});
