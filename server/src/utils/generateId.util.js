// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ID GENERATOR UTILITY
// kat-school/server/src/utils/generateId.util.js
// ============================================

'use strict';

const mongoose = require('mongoose');

// ─── Generate Student ID ──────────────────────
// Format: KAT/STU/GRADE/YEAR/SEQUENCE
// Example: KAT/STU/9/2024/0001
const generateStudentId = async (grade, academicYear) => {
  const Student = mongoose.model('Student');
  const gradeNumber = grade.replace('Grade ', '');
  const year = new Date().getFullYear();

  const count = await Student.countDocuments({
    grade,
    academicYear,
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `KAT/STU/${gradeNumber}/${year}/${sequence}`;
};

// ─── Generate Teacher ID ──────────────────────
// Format: KAT/TCH/YEAR/SEQUENCE
// Example: KAT/TCH/2024/0001
const generateTeacherId = async () => {
  const Teacher = mongoose.model('Teacher');
  const year = new Date().getFullYear();

  const count = await Teacher.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31),
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `KAT/TCH/${year}/${sequence}`;
};

// ─── Generate Employee ID ─────────────────────
// Format: KAT/EMP/DEPT_CODE/YEAR/SEQUENCE
// Example: KAT/EMP/FIN/2024/0001
const generateEmployeeId = async (departmentCode = 'GEN') => {
  const Employee = mongoose.model('Employee');
  const year = new Date().getFullYear();

  const count = await Employee.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31),
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `KAT/EMP/${departmentCode.toUpperCase()}/${year}/${sequence}`;
};

// ─── Generate Receipt Number ──────────────────
// Format: RCP-YYYYMMDD-SEQUENCE
// Example: RCP-20241201-0001
const generateReceiptNumber = async () => {
  const FeePayment = mongoose.model('FeePayment');
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const count = await FeePayment.countDocuments({
    createdAt: { $gte: todayStart },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `RCP-${year}${month}${day}-${sequence}`;
};

// ─── Generate Admission Number ────────────────
// Format: KAT/ADM/YEAR/SEQUENCE
// Example: KAT/ADM/2024/0001
const generateAdmissionNumber = async () => {
  const Student = mongoose.model('Student');
  const year = new Date().getFullYear();

  const count = await Student.countDocuments({
    admissionDate: {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31),
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `KAT/ADM/${year}/${sequence}`;
};

// ─── Generate Payroll Number ──────────────────
// Format: PAY-YYYYMM-STAFFID
// Example: PAY-202412-KAT/TCH/2024/0001
const generatePayrollNumber = (month, year, staffId) => {
  const monthStr = String(month).padStart(2, '0');
  const cleanStaffId = staffId.replace(/\//g, '-');
  return `PAY-${year}${monthStr}-${cleanStaffId}`;
};

// ─── Generate Suspension Number ──────────────
// Format: SUS-YYYYMM-SEQUENCE
const generateSuspensionNumber = async () => {
  const Suspension = mongoose.model('Suspension');
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const count = await Suspension.countDocuments({
    createdAt: {
      $gte: new Date(year, today.getMonth(), 1),
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `SUS-${year}${month}-${sequence}`;
};

// ─── Generate Membership ID ───────────────────
// Format: LMS-00001 (student), LMT-00001 (teacher), LME-00001 (employee)
const generateMembershipId = async (memberType) => {
  const LibraryMember = mongoose.model('LibraryMember');

  const prefixMap = {
    student: 'LMS',
    teacher: 'LMT',
    employee: 'LME',
  };

  const prefix = prefixMap[memberType] || 'LMX';
  const count = await LibraryMember.countDocuments({ memberType });
  const sequence = String(count + 1).padStart(5, '0');
  return `${prefix}-${sequence}`;
};

// ─── Generate OTP ─────────────────────────────
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

// ─── Generate Secure Token ────────────────────
const generateSecureToken = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

// ─── Generate Batch ID ────────────────────────
// Used for grouping payroll runs
const generateBatchId = (prefix = 'BATCH') => {
  const crypto = require('crypto');
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// ─── Generate Short Code ──────────────────────
const generateShortCode = (text, maxLength = 6) => {
  if (!text) return 'CODE';
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, maxLength);
};

// ─── Generate Accession Number ────────────────
// Format: KAT/LIB/YEAR/SEQUENCE
const generateAccessionNumber = async () => {
  const Book = mongoose.model('Book');
  const year = new Date().getFullYear();

  const count = await Book.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31),
    },
  });

  const sequence = String(count + 1).padStart(5, '0');
  return `KAT/LIB/${year}/${sequence}`;
};

module.exports = {
  generateStudentId,
  generateTeacherId,
  generateEmployeeId,
  generateReceiptNumber,
  generateAdmissionNumber,
  generatePayrollNumber,
  generateSuspensionNumber,
  generateMembershipId,
  generateOTP,
  generateSecureToken,
  generateBatchId,
  generateShortCode,
  generateAccessionNumber,
};
