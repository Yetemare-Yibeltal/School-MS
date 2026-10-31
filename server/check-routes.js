const files = [
  'auth',
  'student',
  'teacher',
  'employee',
  'academic',
  'attendance',
  'exam',
  'reportCard',
  'finance',
  'hrm',
  'library',
  'communication'
];

let failed = false;

files.forEach((f) => {
  try {
    const route = require('./src/routes/' + f + '.routes');

    if (typeof route === 'function') {
      console.log('OK:', f + '.routes');
    } else {
      failed = true;
      console.log('BAD:', f + '.routes exports', typeof route);
    }
  } catch (e) {
    failed = true;
    console.log('ERROR:', f + '.routes ->', e.message.split('\n')[0]);
  }
});

console.log('\n' + (failed ? 'VALIDATION FAILED' : 'ALL ROUTES PASSED'));

process.exit(failed ? 1 : 0);
