'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const USERS = [
  { firstName: 'Super', fatherName: 'Admin', email: 'superadmin@katschool.edu.et', password: 'SuperAdmin@2024', role: 'super_admin' },
  { firstName: 'School', fatherName: 'Admin', email: 'admin@katschool.edu.et', password: 'Admin@2024KAT', role: 'admin' },
  { firstName: 'Finance', fatherName: 'Accountant', email: 'accountant@katschool.edu.et', password: 'Account@2024KAT', role: 'accountant' },
  { firstName: 'Library', fatherName: 'Librarian', email: 'librarian@katschool.edu.et', password: 'Library@2024KAT', role: 'librarian' },
  { firstName: 'Human', fatherName: 'Resources', email: 'hr@katschool.edu.et', password: 'HRManager@2024KAT', role: 'hr_manager' },
  { firstName: 'Front', fatherName: 'Reception', email: 'reception@katschool.edu.et', password: 'Reception@2024KAT', role: 'receptionist' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const u of USERS) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log('SKIP (exists):', u.email);
        continue;
      }
      try {
        await User.create({
          ...u,
          phone: '+251911000000',
          isActive: true,
          isEmailVerified: true,
          isTemporaryPassword: false,
        });
        console.log('CREATED:', u.email);
      } catch (err) {
        console.log('FAILED:', u.email, '->', err.message);
      }
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
