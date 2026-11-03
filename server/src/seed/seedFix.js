'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const GradeScale = require('../models/GradeScale');
const FeeType = require('../models/FeeType');
const LeaveType = require('../models/LeaveType');
const Department = require('../models/Department');
const Designation = require('../models/Designation');

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const ensure = async (Model, filter, data, label) => {
  try {
    if (await Model.findOne(filter)) { console.log('  = exists:', label); return; }
    await Model.create({ ...filter, ...data });
    console.log('  + created:', label);
  } catch (e) {
    console.log('  x', label, '->', e.message);
  }
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('[Grade scale]');
  const scale = [
    ['A', 85, 100, 4.0, 'Excellent', '#16a34a', 'success'],
    ['B', 75, 84.99, 3.0, 'Very Good', '#2563eb', 'info'],
    ['C', 65, 74.99, 2.0, 'Good', '#d97706', 'warning'],
    ['D', 50, 64.99, 1.0, 'Satisfactory', '#ea580c', 'warning'],
    ['F', 0, 49.99, 0.0, 'Fail', '#dc2626', 'danger'],
  ];
  for (const [grade, minScore, maxScore, gpaPoints, remark, color, badgeStyle] of scale) {
    await ensure(GradeScale, { grade }, {
      minScore, maxScore, gpaPoints, remark, color, badgeStyle, isPassing: grade !== 'F',
    }, `Grade ${grade}`);
  }

  console.log('[Fee types]');
  await ensure(FeeType, { code: 'LIB' }, {
    name: 'Library Fee', category: 'Library', amount: 150, frequency: 'annual',
    isMandatory: true, color: '#7c3aed', applicableGrades: GRADES, isActive: true,
  }, 'Library Fee');
  await ensure(FeeType, { code: 'SPT' }, {
    name: 'Sports Fee', category: 'Sport', amount: 200, frequency: 'annual',
    isMandatory: false, color: '#f59e0b', applicableGrades: GRADES, isActive: true,
  }, 'Sports Fee');

  console.log('[Leave types]');
  const leaves = [
    ['Annual Leave', 'AL', 16], ['Sick Leave', 'SL', 30], ['Maternity Leave', 'ML', 120],
    ['Paternity Leave', 'PL', 5], ['Bereavement Leave', 'BL', 5], ['Marriage Leave', 'MAR', 3],
    ['Unpaid Leave', 'UL', 30],
  ];
  for (const [name, code, daysAllowedPerYear] of leaves) {
    await ensure(LeaveType, { code }, { name, daysAllowedPerYear, isPaid: code !== 'UL', isActive: true }, name);
  }

  console.log('[Designation: Cleaner]');
  const dept = await Department.findOne({ name: 'Support Services' });
  if (dept) {
    await ensure(Designation, { name: 'Cleaner', department: dept._id }, {
      code: 'CLNR', level: 2, isActive: true,
    }, 'Cleaner');
  } else {
    console.log('  x Support Services department not found');
  }

  await mongoose.disconnect();
  process.exit(0);
})();
