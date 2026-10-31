'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

const load = (name) => {
  try { return require(`../models/${name}`); } catch (e) {
    console.log(`  ! model ${name} not loadable: ${e.message}`);
    return null;
  }
};

const stats = { created: 0, existed: 0, failed: 0 };

// Create a document only if one matching `filter` does not already exist
const ensure = async (Model, filter, data, label) => {
  if (!Model) { stats.failed++; return null; }
  try {
    const existing = await Model.findOne(filter);
    if (existing) { stats.existed++; return existing; }
    const doc = await Model.create({ ...filter, ...data });
    stats.created++;
    console.log(`  + ${label}`);
    return doc;
  } catch (err) {
    stats.failed++;
    console.log(`  x ${label} -> ${err.message}`);
    return null;
  }
};

const step = (t) => console.log(`\n[${t}]`);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Settings = load('Settings');
  const AcademicYear = load('AcademicYear');
  const Term = load('Term');
  const GradeScale = load('GradeScale');
  const ExamType = load('ExamType');
  const Subject = load('Subject');
  const Room = load('Room');
  const ClassModel = load('Class');
  const Section = load('Section');
  const FeeType = load('FeeType');
  const Department = load('Department');
  const Designation = load('Designation');
  const LeaveType = load('LeaveType');
  const ExpenseCategory = load('ExpenseCategory');
  const BookCategory = load('BookCategory');
  const AttendanceSettings = load('AttendanceSettings');

  const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  // ─── Settings ───────────────────────────────
  step('Settings');
  try {
    await Settings.seedDefaults();
    console.log('  + default settings ensured');
  } catch (e) { stats.failed++; console.log('  x settings ->', e.message); }

  // ─── Academic Year (2019 E.C. = Sep 2026 - Jul 2027) ───
  step('Academic year and terms');
  const year = await ensure(
    AcademicYear,
    { name: '2019 E.C. (2026/2027)' },
    {
      startDate: new Date('2026-09-14'),
      endDate: new Date('2027-07-10'),
      ethiopianYear: 2019,
      isCurrent: true,
      status: 'active',
      isActive: true,
      description: 'Ethiopian academic year 2019 E.C.',
    },
    'Academic year 2019 E.C.'
  );

  let term1 = null;
  if (year) {
    term1 = await ensure(Term, { name: 'Semester 1', academicYear: year._id }, {
      termNumber: 1, startDate: new Date('2026-09-14'), endDate: new Date('2027-01-29'), isCurrent: true, isActive: true,
    }, 'Semester 1');
    await ensure(Term, { name: 'Semester 2', academicYear: year._id }, {
      termNumber: 2, startDate: new Date('2027-02-08'), endDate: new Date('2027-07-10'), isCurrent: false, isActive: true,
    }, 'Semester 2');
  }

  try {
    if (year && Settings && Settings.updateCurrentYear) {
      await Settings.updateCurrentYear(year._id, year.name, term1 ? term1._id : null, term1 ? term1.name : null);
    }
  } catch (e) { console.log('  ! could not link current year in settings:', e.message); }

  // ─── Grade scale (Ethiopian MoE) ────────────
  step('Grade scale');
  const scale = [
    { grade: 'A', minScore: 85, maxScore: 100, gradePoint: 4.0, description: 'Excellent' },
    { grade: 'B', minScore: 75, maxScore: 84.99, gradePoint: 3.0, description: 'Very Good' },
    { grade: 'C', minScore: 65, maxScore: 74.99, gradePoint: 2.0, description: 'Good' },
    { grade: 'D', minScore: 50, maxScore: 64.99, gradePoint: 1.0, description: 'Satisfactory' },
    { grade: 'F', minScore: 0, maxScore: 49.99, gradePoint: 0.0, description: 'Fail' },
  ];
  for (const s of scale) {
    await ensure(GradeScale, { grade: s.grade }, s, `Grade ${s.grade}`);
  }

  // ─── Exam types ─────────────────────────────
  step('Exam types');
  const examTypes = [
    { code: 'CA1', name: 'Continuous Assessment 1', weight: 10, isContinuous: true },
    { code: 'CA2', name: 'Continuous Assessment 2', weight: 10, isContinuous: true },
    { code: 'CA3', name: 'Continuous Assessment 3', weight: 10, isContinuous: true },
    { code: 'QUIZ', name: 'Quiz', weight: 5, isContinuous: true },
    { code: 'MTE', name: 'Mid-Term Exam', weight: 20, isContinuous: false },
    { code: 'FE', name: 'Final Exam', weight: 50, isContinuous: false },
    { code: 'SE', name: 'Supplementary Exam', weight: 50, isContinuous: false },
    { code: 'MOCK', name: 'Mock Exam', weight: 0, isContinuous: false },
  ];
  for (const t of examTypes) {
    await ensure(ExamType, { code: t.code }, { ...t, isActive: true }, `Exam type ${t.code}`);
  }

  // ─── Subjects (Ethiopian secondary curriculum) ───
  step('Subjects');
  const subjects = [
    ['Mathematics', 'MATH', GRADES, 'Core', 5],
    ['English', 'ENG', GRADES, 'Languages', 5],
    ['Amharic', 'AMH', GRADES, 'Languages', 4],
    ['Physics', 'PHY', GRADES, 'Sciences', 4],
    ['Chemistry', 'CHEM', GRADES, 'Sciences', 4],
    ['Biology', 'BIO', GRADES, 'Sciences', 4],
    ['History', 'HIST', GRADES, 'Social Studies', 3],
    ['Geography', 'GEO', GRADES, 'Social Studies', 3],
    ['Civics and Ethical Education', 'CEE', GRADES, 'Social Studies', 2],
    ['Economics', 'ECON', GRADES, 'Social Studies', 3],
    ['Information Technology', 'ICT', GRADES, 'Core', 2],
    ['Physical Education', 'PE', GRADES, 'Sports', 2],
    ['Technical Drawing', 'TD', GRADES, 'Vocational', 2],
    ['General Business', 'GB', GRADES, 'Elective', 2],
  ];
  for (const [name, code, grades, category, periods] of subjects) {
    await ensure(Subject, { code }, {
      name, grades, category,
      weeklyHours: periods, periodsPerWeek: periods,
      isCompulsory: category !== 'Elective',
      fullMarks: 100, caMarks: 50, examMarks: 50, passingScore: 50,
      isActive: true,
    }, `Subject ${code}`);
  }

  // ─── Rooms ──────────────────────────────────
  step('Rooms');
  const rooms = [];
  GRADES.forEach((g, gi) => {
    ['A', 'B', 'C'].forEach((sec, si) => {
      const num = (gi + 1) * 100 + (si + 1);
      rooms.push({ name: `Room ${num}`, code: `R${num}`, roomNumber: String(num), type: 'Classroom', capacity: 50 });
    });
  });
  rooms.push(
    { name: 'Physics Lab', code: 'LAB-PHY', roomNumber: 'L1', type: 'Laboratory', capacity: 40 },
    { name: 'Chemistry Lab', code: 'LAB-CHEM', roomNumber: 'L2', type: 'Laboratory', capacity: 40 },
    { name: 'Biology Lab', code: 'LAB-BIO', roomNumber: 'L3', type: 'Laboratory', capacity: 40 },
    { name: 'Computer Lab', code: 'LAB-ICT', roomNumber: 'L4', type: 'Computer Lab', capacity: 40 },
    { name: 'Library', code: 'LIB', roomNumber: 'LB1', type: 'Library', capacity: 80 }
  );
  for (const r of rooms) {
    await ensure(Room, { code: r.code }, { ...r, isActive: true }, `Room ${r.code}`);
  }

  // ─── Classes and sections ───────────────────
  step('Classes and sections');
  if (year) {
    for (const grade of GRADES) {
      const cls = await ensure(ClassModel, { name: grade, grade, academicYear: year._id }, {
        capacity: 150, isActive: true,
      }, `Class ${grade}`);
      if (!cls) continue;
      for (const sec of ['A', 'B', 'C']) {
        await ensure(Section, { name: sec, class: cls._id, grade, academicYear: year._id }, {
          capacity: 50, currentEnrollment: 0, isActive: true,
        }, `${grade} Section ${sec}`);
      }
    }
  }

  // ─── Fee types ──────────────────────────────
  step('Fee types');
  const feeTypes = [
    ['Registration Fee', 'REG', 'Registration', 500, 'one_time', true, '#4f46e5'],
    ['Tuition Fee', 'TUI', 'Tuition', 6000, 'per_term', true, '#059669'],
    ['Exam Fee', 'EXM', 'Exam', 300, 'per_term', true, '#dc2626'],
    ['Library Fee', 'LIB', 'Library', 150, 'per_year', true, '#7c3aed'],
    ['Sports Fee', 'SPT', 'Sport', 200, 'per_year', false, '#f59e0b'],
    ['Transport Fee', 'TRN', 'Transport', 1200, 'monthly', false, '#0891b2'],
    ['Uniform Fee', 'UNI', 'Uniform', 1500, 'one_time', false, '#db2777'],
    ['Activity Fee', 'ACT', 'Activity', 250, 'per_term', false, '#65a30d'],
  ];
  for (const [name, code, category, amount, frequency, isMandatory, color] of feeTypes) {
    await ensure(FeeType, { code }, {
      name, category, amount, frequency, isMandatory, color,
      applicableGrades: GRADES, isActive: true,
      lateFineEnabled: false, lateFinePerDay: 0, gracePeriodDays: 0,
    }, `Fee type ${code}`);
  }

  // ─── Departments and designations ───────────
  step('Departments and designations');
  const departments = {
    Administration: ['ADM', ['School Director', 'Vice Director', 'Administrative Officer', 'Secretary']],
    Finance: ['FIN', ['Head Accountant', 'Cashier', 'Bookkeeper']],
    'Human Resources': ['HR', ['HR Manager', 'HR Officer']],
    Library: ['LIB', ['Head Librarian', 'Library Assistant']],
    'Student Affairs': ['STA', ['Registrar', 'Receptionist', 'Counselor']],
    'Support Services': ['SUP', ['Security Guard', 'Cleaner', 'Maintenance Staff', 'Driver']],
  };
  for (const [name, [code, list]] of Object.entries(departments)) {
    const dept = await ensure(Department, { name }, { code, isActive: true }, `Department ${name}`);
    if (!dept) continue;
    let level = 1;
    for (const d of list) {
      const dcode = d.split(' ').map((w) => w[0]).join('').toUpperCase() + level;
      await ensure(Designation, { name: d, department: dept._id }, { code: dcode, level, isActive: true }, `Designation ${d}`);
      level++;
    }
  }

  // ─── Leave types ────────────────────────────
  step('Leave types');
  const leaveTypes = [
    ['Annual Leave', 'AL', 16, true],
    ['Sick Leave', 'SL', 30, true],
    ['Maternity Leave', 'ML', 120, true],
    ['Paternity Leave', 'PL', 5, true],
    ['Bereavement Leave', 'BL', 5, true],
    ['Marriage Leave', 'MAR', 3, true],
    ['Unpaid Leave', 'UL', 30, false],
  ];
  for (const [name, code, maxDaysPerYear, isPaid] of leaveTypes) {
    await ensure(LeaveType, { code }, { name, maxDaysPerYear, isPaid, isActive: true }, `Leave type ${code}`);
  }

  // ─── Expense categories ─────────────────────
  step('Expense categories');
  const expenseCats = [
    ['Salaries', 'SAL'], ['Utilities', 'UTL'], ['Maintenance', 'MNT'], ['Stationery and Supplies', 'STN'],
    ['Teaching Materials', 'TCH'], ['Transport', 'TRP'], ['Events', 'EVT'], ['Security', 'SEC'], ['Other', 'OTH'],
  ];
  for (const [name, code] of expenseCats) {
    await ensure(ExpenseCategory, { name }, { code, isActive: true }, `Expense category ${name}`);
  }

  // ─── Book categories ────────────────────────
  step('Book categories');
  const bookCats = [
    ['Textbooks', 'TXT'], ['Reference', 'REF'], ['Fiction', 'FIC'], ['Science', 'SCI'], ['History', 'HIS'],
    ['Languages', 'LNG'], ['Mathematics', 'MAT'], ['Biography', 'BIO'], ['Periodicals', 'PER'],
  ];
  for (const [name, code] of bookCats) {
    await ensure(BookCategory, { name }, { code, isActive: true }, `Book category ${name}`);
  }

  // ─── Attendance settings ────────────────────
  step('Attendance settings');
  if (AttendanceSettings) {
    try {
      const has = await AttendanceSettings.findOne();
      if (!has) { await AttendanceSettings.create({}); stats.created++; console.log('  + attendance settings (model defaults)'); }
      else stats.existed++;
    } catch (e) { stats.failed++; console.log('  x attendance settings ->', e.message); }
  }

  console.log('\n====================================');
  console.log(` created: ${stats.created}  already existed: ${stats.existed}  failed: ${stats.failed}`);
  console.log('====================================');
  if (stats.failed) console.log('Send me the "x" lines above and I will fix the field names.');

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error('Seed crashed:', e); process.exit(1); });
