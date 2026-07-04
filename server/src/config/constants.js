// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SYSTEM-WIDE CONSTANTS
// ============================================

'use strict';

// ─── User Roles ──────────────────────────────
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
  LIBRARIAN: 'librarian',
  ACCOUNTANT: 'accountant',
  HR_MANAGER: 'hr_manager',
  RECEPTIONIST: 'receptionist',
};

const ALL_ROLES = Object.values(ROLES);

// ─── Permissions ─────────────────────────────
const PERMISSIONS = {
  // Student permissions
  CREATE_STUDENT: 'create_student',
  READ_STUDENT: 'read_student',
  UPDATE_STUDENT: 'update_student',
  DELETE_STUDENT: 'delete_student',

  // Teacher permissions
  CREATE_TEACHER: 'create_teacher',
  READ_TEACHER: 'read_teacher',
  UPDATE_TEACHER: 'update_teacher',
  DELETE_TEACHER: 'delete_teacher',

  // Academic permissions
  CREATE_CLASS: 'create_class',
  READ_CLASS: 'read_class',
  UPDATE_CLASS: 'update_class',
  DELETE_CLASS: 'delete_class',
  MANAGE_TIMETABLE: 'manage_timetable',
  MANAGE_EXAMS: 'manage_exams',
  ENTER_MARKS: 'enter_marks',
  VIEW_RESULTS: 'view_results',
  GENERATE_REPORT_CARD: 'generate_report_card',

  // Attendance permissions
  MARK_ATTENDANCE: 'mark_attendance',
  VIEW_ATTENDANCE: 'view_attendance',
  EDIT_ATTENDANCE: 'edit_attendance',

  // Finance permissions
  COLLECT_FEES: 'collect_fees',
  VIEW_FEES: 'view_fees',
  MANAGE_FEE_TYPES: 'manage_fee_types',
  MANAGE_INCOME: 'manage_income',
  MANAGE_EXPENSE: 'manage_expense',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',

  // HRM permissions
  MANAGE_EMPLOYEES: 'manage_employees',
  MANAGE_PAYROLL: 'manage_payroll',
  APPROVE_LEAVE: 'approve_leave',
  VIEW_HRM: 'view_hrm',

  // Library permissions
  MANAGE_BOOKS: 'manage_books',
  ISSUE_BOOKS: 'issue_books',
  VIEW_LIBRARY: 'view_library',

  // Communication permissions
  CREATE_NOTICE: 'create_notice',
  VIEW_NOTICE: 'view_notice',
  SEND_MESSAGE: 'send_message',
  MANAGE_EVENTS: 'manage_events',

  // System permissions
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_REPORTS: 'view_reports',
  MANAGE_ROLES: 'manage_roles',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  USE_AI: 'use_ai',
};

// ─── Role-Based Default Permissions ──────────
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_STUDENT,
    PERMISSIONS.READ_STUDENT,
    PERMISSIONS.UPDATE_STUDENT,
    PERMISSIONS.DELETE_STUDENT,
    PERMISSIONS.CREATE_TEACHER,
    PERMISSIONS.READ_TEACHER,
    PERMISSIONS.UPDATE_TEACHER,
    PERMISSIONS.DELETE_TEACHER,
    PERMISSIONS.CREATE_CLASS,
    PERMISSIONS.READ_CLASS,
    PERMISSIONS.UPDATE_CLASS,
    PERMISSIONS.DELETE_CLASS,
    PERMISSIONS.MANAGE_TIMETABLE,
    PERMISSIONS.MANAGE_EXAMS,
    PERMISSIONS.VIEW_RESULTS,
    PERMISSIONS.GENERATE_REPORT_CARD,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.EDIT_ATTENDANCE,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.MANAGE_FEE_TYPES,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_HRM,
    PERMISSIONS.VIEW_LIBRARY,
    PERMISSIONS.CREATE_NOTICE,
    PERMISSIONS.VIEW_NOTICE,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.MANAGE_EVENTS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.USE_AI,
  ],
  [ROLES.TEACHER]: [
    PERMISSIONS.READ_STUDENT,
    PERMISSIONS.READ_CLASS,
    PERMISSIONS.MANAGE_TIMETABLE,
    PERMISSIONS.ENTER_MARKS,
    PERMISSIONS.VIEW_RESULTS,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_NOTICE,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.USE_AI,
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.VIEW_RESULTS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.VIEW_NOTICE,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.VIEW_LIBRARY,
    PERMISSIONS.USE_AI,
  ],
  [ROLES.PARENT]: [
    PERMISSIONS.READ_STUDENT,
    PERMISSIONS.VIEW_RESULTS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.VIEW_NOTICE,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.USE_AI,
  ],
  [ROLES.LIBRARIAN]: [
    PERMISSIONS.READ_STUDENT,
    PERMISSIONS.MANAGE_BOOKS,
    PERMISSIONS.ISSUE_BOOKS,
    PERMISSIONS.VIEW_LIBRARY,
    PERMISSIONS.VIEW_NOTICE,
    PERMISSIONS.SEND_MESSAGE,
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.READ_STUDENT,
    PERMISSIONS.COLLECT_FEES,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.MANAGE_FEE_TYPES,
    PERMISSIONS.MANAGE_INCOME,
    PERMISSIONS.MANAGE_EXPENSE,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_NOTICE,
    PERMISSIONS.SEND_MESSAGE,
  ],
  [ROLES.HR_MANAGER]: [
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.VIEW_HRM,
    PERMISSIONS.VIEW_NOTICE,
    PERMISSIONS.SEND_MESSAGE,
  ],
  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.READ_STUDENT,
    PERMISSIONS.CREATE_STUDENT,
    PERMISSIONS.UPDATE_STUDENT,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.VIEW_NOTICE,
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.VIEW_LIBRARY,
  ],
};

// ─── Ethiopian Calendar Months ───────────────
const ETHIOPIAN_MONTHS = [
  { number: 1, name: 'Meskerem', englishApprox: 'September' },
  { number: 2, name: 'Tikimt', englishApprox: 'October' },
  { number: 3, name: 'Hidar', englishApprox: 'November' },
  { number: 4, name: 'Tahsas', englishApprox: 'December' },
  { number: 5, name: 'Tir', englishApprox: 'January' },
  { number: 6, name: 'Yekatit', englishApprox: 'February' },
  { number: 7, name: 'Megabit', englishApprox: 'March' },
  { number: 8, name: 'Miazia', englishApprox: 'April' },
  { number: 9, name: 'Ginbot', englishApprox: 'May' },
  { number: 10, name: 'Sene', englishApprox: 'June' },
  { number: 11, name: 'Hamle', englishApprox: 'July' },
  { number: 12, name: 'Nehase', englishApprox: 'August' },
  { number: 13, name: 'Pagume', englishApprox: 'September (short)' },
];

// ─── Ethiopian Regions ────────────────────────
const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Dire Dawa',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'South Ethiopia',
  'SNNPR',
  'Tigray',
  'Central Ethiopia',
  'Southwest Ethiopia',
];

// ─── Ethiopian Religions ──────────────────────
const ETHIOPIAN_RELIGIONS = [
  'Orthodox Christian',
  'Muslim',
  'Protestant',
  'Catholic',
  'Traditional',
  'Other',
];

// ─── Ethiopian Languages ──────────────────────
const ETHIOPIAN_LANGUAGES = [
  'Amharic',
  'Oromiffa',
  'Tigrigna',
  'Somali',
  'Afar',
  'Sidama',
  'Wolaita',
  'Gurage',
  'Harari',
  'Other',
];

// ─── School Grade Levels ──────────────────────
const GRADE_LEVELS = [
  { grade: 'Grade 9', level: 9, stream: false },
  { grade: 'Grade 10', level: 10, stream: false },
  { grade: 'Grade 11', level: 11, stream: true },
  { grade: 'Grade 12', level: 12, stream: true },
];

const GRADE_NAMES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const SECTIONS = ['A', 'B', 'C', 'D'];

// ─── Academic Streams ─────────────────────────
const STREAMS = ['Natural Science', 'Social Science'];

// ─── Ethiopian MoE Grading Scale ─────────────
const GRADING_SCALE = [
  {
    grade: 'A',
    minScore: 85,
    maxScore: 100,
    gpa: 4.0,
    remark: 'Excellent',
    color: '#22c55e',
  },
  {
    grade: 'B',
    minScore: 75,
    maxScore: 84,
    gpa: 3.0,
    remark: 'Very Good',
    color: '#3b82f6',
  },
  {
    grade: 'C',
    minScore: 65,
    maxScore: 74,
    gpa: 2.0,
    remark: 'Good',
    color: '#f59e0b',
  },
  {
    grade: 'D',
    minScore: 50,
    maxScore: 64,
    gpa: 1.0,
    remark: 'Satisfactory',
    color: '#f97316',
  },
  {
    grade: 'F',
    minScore: 0,
    maxScore: 49,
    gpa: 0.0,
    remark: 'Fail',
    color: '#ef4444',
  },
];

// ─── Assessment Weights ───────────────────────
const ASSESSMENT_WEIGHTS = {
  CONTINUOUS_ASSESSMENT: 50,
  FINAL_EXAM: 50,
};

// ─── Exam Types ───────────────────────────────
const EXAM_TYPES = [
  'Mid-Term Exam',
  'Final Exam',
  'Unit Test',
  'Mock Exam',
  'National Exam',
  'Entrance Exam',
];

// ─── School Subjects ──────────────────────────
const SUBJECTS = [
  {
    name: 'Mathematics',
    code: 'MATH',
    color: '#5B5EA6',
    icon: 'calculator',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    weeklyHours: 6,
    requiresLab: false,
  },
  {
    name: 'English Language',
    code: 'ENG',
    color: '#3B82F6',
    icon: 'book-open',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    weeklyHours: 5,
    requiresLab: false,
  },
  {
    name: 'Amharic',
    code: 'AMH',
    color: '#F59E0B',
    icon: 'language',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    weeklyHours: 5,
    requiresLab: false,
  },
  {
    name: 'Physics',
    code: 'PHY',
    color: '#8B5CF6',
    icon: 'atom',
    grades: ['Grade 11', 'Grade 12'],
    weeklyHours: 5,
    requiresLab: true,
    stream: 'Natural Science',
  },
  {
    name: 'Chemistry',
    code: 'CHEM',
    color: '#14B8A6',
    icon: 'flask',
    grades: ['Grade 11', 'Grade 12'],
    weeklyHours: 5,
    requiresLab: true,
    stream: 'Natural Science',
  },
  {
    name: 'Biology',
    code: 'BIO',
    color: '#22C55E',
    icon: 'dna',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    weeklyHours: 5,
    requiresLab: true,
  },
  {
    name: 'History',
    code: 'HIST',
    color: '#F97316',
    icon: 'landmark',
    grades: ['Grade 9', 'Grade 10'],
    weeklyHours: 4,
    requiresLab: false,
  },
  {
    name: 'Geography',
    code: 'GEO',
    color: '#EC4899',
    icon: 'globe',
    grades: ['Grade 9', 'Grade 10'],
    weeklyHours: 4,
    requiresLab: false,
  },
  {
    name: 'Civics & Ethics',
    code: 'CIV',
    color: '#EF4444',
    icon: 'balance-scale',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    weeklyHours: 3,
    requiresLab: false,
  },
  {
    name: 'ICT',
    code: 'ICT',
    color: '#06B6D4',
    icon: 'laptop',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    weeklyHours: 4,
    requiresLab: true,
  },
  {
    name: 'Physical Education',
    code: 'PE',
    color: '#84CC16',
    icon: 'running',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    weeklyHours: 2,
    requiresLab: false,
  },
  {
    name: 'Economics',
    code: 'ECON',
    color: '#D946EF',
    icon: 'chart-line',
    grades: ['Grade 11', 'Grade 12'],
    weeklyHours: 4,
    requiresLab: false,
    stream: 'Social Science',
  },
  {
    name: 'General Business',
    code: 'BUS',
    color: '#0EA5E9',
    icon: 'briefcase',
    grades: ['Grade 11', 'Grade 12'],
    weeklyHours: 4,
    requiresLab: false,
    stream: 'Social Science',
  },
  {
    name: 'Technical Drawing',
    code: 'TD',
    color: '#A855F7',
    icon: 'pencil-ruler',
    grades: ['Grade 9', 'Grade 10'],
    weeklyHours: 3,
    requiresLab: false,
  },
];

// ─── Attendance Statuses ──────────────────────
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
  HOLIDAY: 'holiday',
};

const ATTENDANCE_STATUS_COLORS = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#3b82f6',
  holiday: '#8b5cf6',
};

// ─── Fee Payment Methods ──────────────────────
const PAYMENT_METHODS = [
  'Cash',
  'Telebirr',
  'CBE Birr',
  'Bank Transfer',
  'M-Pesa',
  'Cheque',
  'Online',
];

// ─── Fee Payment Status ───────────────────────
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  WAIVED: 'waived',
  REFUNDED: 'refunded',
};

// ─── Fee Types ────────────────────────────────
const DEFAULT_FEE_TYPES = [
  { name: 'Tuition Fee', code: 'TF', description: 'Annual tuition fee' },
  { name: 'Registration Fee', code: 'RF', description: 'One-time registration' },
  { name: 'Exam Fee', code: 'EF', description: 'Examination fee per term' },
  { name: 'Library Fee', code: 'LF', description: 'Library access fee' },
  { name: 'Sports Fee', code: 'SF', description: 'Sports and PE activities' },
  { name: 'Laboratory Fee', code: 'LAB', description: 'Lab materials and usage' },
  { name: 'Uniform Fee', code: 'UF', description: 'School uniform' },
  { name: 'Transport Fee', code: 'TRF', description: 'School transportation' },
  { name: 'Medical Fee', code: 'MF', description: 'School health services' },
  { name: 'Activity Fee', code: 'AF', description: 'Extracurricular activities' },
];

// ─── Leave Types ──────────────────────────────
const DEFAULT_LEAVE_TYPES = [
  {
    name: 'Annual Leave',
    code: 'AL',
    daysAllowed: 21,
    isPaid: true,
    description: 'Regular annual leave',
  },
  {
    name: 'Sick Leave',
    code: 'SL',
    daysAllowed: 14,
    isPaid: true,
    description: 'Medical/health leave',
  },
  {
    name: 'Maternity Leave',
    code: 'ML',
    daysAllowed: 90,
    isPaid: true,
    description: 'Maternity leave for female staff',
  },
  {
    name: 'Paternity Leave',
    code: 'PL',
    daysAllowed: 5,
    isPaid: true,
    description: 'Paternity leave for male staff',
  },
  {
    name: 'Compassionate Leave',
    code: 'CL',
    daysAllowed: 5,
    isPaid: true,
    description: 'Bereavement or family emergency',
  },
  {
    name: 'Study Leave',
    code: 'STL',
    daysAllowed: 10,
    isPaid: false,
    description: 'For exams or training',
  },
  {
    name: 'Emergency Leave',
    code: 'EML',
    daysAllowed: 3,
    isPaid: true,
    description: 'Urgent personal emergency',
  },
  {
    name: 'Unpaid Leave',
    code: 'UPL',
    daysAllowed: 30,
    isPaid: false,
    description: 'Leave without pay',
  },
];

// ─── Leave Status ─────────────────────────────
const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// ─── Employment Types ─────────────────────────
const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Part-Time', 'Volunteer', 'Intern', 'Probation'];

// ─── Departments ──────────────────────────────
const DEFAULT_DEPARTMENTS = [
  { name: 'Academic', code: 'ACD', description: 'Teaching staff' },
  { name: 'Administration', code: 'ADM', description: 'Administrative staff' },
  { name: 'Finance', code: 'FIN', description: 'Finance and accounts' },
  { name: 'Library', code: 'LIB', description: 'Library services' },
  { name: 'Security', code: 'SEC', description: 'Security personnel' },
  { name: 'Cleaning', code: 'CLN', description: 'Cleaning and maintenance' },
  { name: 'ICT', code: 'ICT', description: 'IT and computer lab' },
  { name: 'Sports', code: 'SPT', description: 'Physical education' },
  { name: 'Counseling', code: 'CNS', description: 'Student counseling' },
];

// ─── Salary Components ────────────────────────
const SALARY_COMPONENTS = [
  { name: 'Basic Salary', type: 'earning', taxable: true },
  { name: 'Housing Allowance', type: 'earning', taxable: false },
  { name: 'Transport Allowance', type: 'earning', taxable: false },
  { name: 'Medical Allowance', type: 'earning', taxable: false },
  { name: 'Teaching Allowance', type: 'earning', taxable: true },
  { name: 'Income Tax', type: 'deduction', taxable: false },
  { name: 'Pension (Employee 7%)', type: 'deduction', taxable: false },
  { name: 'Pension (Employer 11%)', type: 'deduction', taxable: false },
  { name: 'Absence Deduction', type: 'deduction', taxable: false },
  { name: 'Loan Deduction', type: 'deduction', taxable: false },
];

// ─── Ethiopian Income Tax Brackets ───────────
// As per Ethiopian Tax Proclamation
const INCOME_TAX_BRACKETS = [
  { min: 0, max: 600, rate: 0, deduction: 0 },
  { min: 601, max: 1650, rate: 0.1, deduction: 60 },
  { min: 1651, max: 3200, rate: 0.15, deduction: 142.5 },
  { min: 3201, max: 5250, rate: 0.2, deduction: 302.5 },
  { min: 5251, max: 7800, rate: 0.25, deduction: 565 },
  { min: 7801, max: 10900, rate: 0.3, deduction: 955 },
  { min: 10901, max: Infinity, rate: 0.35, deduction: 1500 },
];

// ─── Pension Rates ────────────────────────────
const PENSION_RATES = {
  EMPLOYEE: 0.07,
  EMPLOYER: 0.11,
};

// ─── Library Settings ─────────────────────────
const LIBRARY_SETTINGS = {
  MAX_BOOKS_PER_STUDENT: 3,
  MAX_BOOKS_PER_TEACHER: 5,
  LOAN_PERIOD_DAYS: 14,
  FINE_PER_DAY_ETB: 2,
  RENEWAL_LIMIT: 2,
};

// ─── Book Categories ──────────────────────────
const DEFAULT_BOOK_CATEGORIES = [
  { name: 'Mathematics', description: 'Math textbooks and references' },
  { name: 'Science', description: 'Physics, Chemistry, Biology' },
  { name: 'Literature', description: 'Fiction and non-fiction' },
  { name: 'History', description: 'Ethiopian and world history' },
  { name: 'Geography', description: 'Maps, atlas, geography texts' },
  { name: 'Language', description: 'Amharic, English, other languages' },
  { name: 'ICT', description: 'Computer science and technology' },
  { name: 'Religion', description: 'Religious texts and studies' },
  { name: 'Arts', description: 'Fine arts and music' },
  { name: 'Reference', description: 'Encyclopedias and dictionaries' },
  { name: 'Magazine', description: 'Periodicals and magazines' },
  { name: 'Newspaper', description: 'Daily and weekly newspapers' },
];

// ─── Notice Categories ────────────────────────
const NOTICE_CATEGORIES = [
  'General',
  'Academic',
  'Examination',
  'Fee',
  'Event',
  'Holiday',
  'Sports',
  'Emergency',
  'Meeting',
  'Circular',
];

// ─── Notice Target Audiences ──────────────────
const NOTICE_AUDIENCES = [
  'All',
  'Students',
  'Teachers',
  'Parents',
  'Staff',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Management',
];

// ─── Event Types ──────────────────────────────
const EVENT_TYPES = [
  'Academic',
  'Sports',
  'Cultural',
  'Holiday',
  'Meeting',
  'Examination',
  'Workshop',
  'Ceremony',
  'Trip',
  'Other',
];

// ─── Suspension Types ─────────────────────────
const SUSPENSION_TYPES = [
  'Misconduct',
  'Violence',
  'Exam Cheating',
  'Property Damage',
  'Excessive Absences',
  'Bullying',
  'Substance Abuse',
  'Insubordination',
  'Other',
];

// ─── Student Status ───────────────────────────
const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  GRADUATED: 'graduated',
  TRANSFERRED: 'transferred',
  DROPPED: 'dropped',
};

// ─── Teacher Status ───────────────────────────
const TEACHER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated',
  RESIGNED: 'resigned',
};

// ─── Employee Status ──────────────────────────
const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated',
  RESIGNED: 'resigned',
  RETIRED: 'retired',
};

// ─── Document Types ───────────────────────────
const DOCUMENT_TYPES = [
  'Birth Certificate',
  'Grade Report',
  'Transfer Certificate',
  'Medical Certificate',
  'National ID',
  'Passport',
  'Kebele ID',
  'Academic Transcript',
  'Reference Letter',
  'Employment Contract',
  'Other',
];

// ─── Blood Groups ─────────────────────────────
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Genders ──────────────────────────────────
const GENDERS = ['Male', 'Female'];

// ─── File Upload ──────────────────────────────
const FILE_UPLOAD = {
  MAX_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB) || 5,
  MAX_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_DOC_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXCEL_TYPES: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  PHOTO_FOLDER: 'kat_school/photos',
  DOCUMENT_FOLDER: 'kat_school/documents',
};

// ─── Pagination ───────────────────────────────
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: parseInt(process.env.DEFAULT_PAGE_SIZE) || 10,
  MAX_LIMIT: parseInt(process.env.MAX_PAGE_SIZE) || 100,
};

// ─── Cache Duration ───────────────────────────
const CACHE_DURATION = {
  SHORT: 5 * 60,
  MEDIUM: 30 * 60,
  LONG: 60 * 60,
  VERY_LONG: 24 * 60 * 60,
};

// ─── Token Expiry ─────────────────────────────
const TOKEN_EXPIRY = {
  ACCESS: process.env.JWT_ACCESS_EXPIRE || '15m',
  REFRESH: process.env.JWT_REFRESH_EXPIRE || '7d',
  RESET_PASSWORD: '1h',
  EMAIL_VERIFY: '24h',
};

// ─── API Response Messages ────────────────────
const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Account created successfully',
  PASSWORD_RESET_EMAIL: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  PASSWORD_CHANGE_SUCCESS: 'Password changed successfully',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DISABLED: 'Your account has been disabled',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  TOKEN_INVALID: 'Invalid token. Please login again',

  // CRUD
  CREATED: 'Record created successfully',
  UPDATED: 'Record updated successfully',
  DELETED: 'Record deleted successfully',
  FETCHED: 'Records fetched successfully',
  NOT_FOUND: 'Record not found',
  ALREADY_EXISTS: 'Record already exists',

  // Validation
  VALIDATION_ERROR: 'Validation failed',
  INVALID_ID: 'Invalid ID format',

  // File
  FILE_UPLOAD_SUCCESS: 'File uploaded successfully',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size',
  INVALID_FILE_TYPE: 'Invalid file type',

  // AI
  AI_PROCESSING: 'AI is processing your request',
  AI_ERROR: 'AI service is temporarily unavailable',

  // Server
  SERVER_ERROR: 'An internal server error occurred',
  DATABASE_ERROR: 'Database operation failed',
};

// ─── HTTP Status Codes ────────────────────────
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ─── Day Names ────────────────────────────────
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Timetable Periods ────────────────────────
const TIMETABLE_PERIODS = [
  { period: 1, startTime: '08:00', endTime: '09:00', label: 'Period 1' },
  { period: 2, startTime: '09:00', endTime: '10:00', label: 'Period 2' },
  { period: 0, startTime: '10:00', endTime: '10:30', label: 'Break', isBreak: true },
  { period: 3, startTime: '10:30', endTime: '11:30', label: 'Period 3' },
  { period: 4, startTime: '11:30', endTime: '12:30', label: 'Period 4' },
  { period: 0, startTime: '12:30', endTime: '13:30', label: 'Lunch', isBreak: true },
  { period: 5, startTime: '13:30', endTime: '14:30', label: 'Period 5' },
  { period: 6, startTime: '14:30', endTime: '15:30', label: 'Period 6' },
  { period: 7, startTime: '15:30', endTime: '16:30', label: 'Period 7' },
];

// ─── AI Models ────────────────────────────────
const AI_MODELS = {
  CLAUDE: process.env.ANTHROPIC_MODEL || 'claude-opus-4-5',
  GPT4: process.env.OPENAI_MODEL || 'gpt-4-turbo',
};

// ─── AI Features ─────────────────────────────
const AI_FEATURES = {
  ACADEMIC_ASSISTANT: 'academic_assistant',
  SCHOOL_CHATBOT: 'school_chatbot',
  NOTICE_WRITER: 'notice_writer',
  REPORT_CARD_AI: 'report_card_ai',
  EXAM_GENERATOR: 'exam_generator',
  PERFORMANCE_PREDICTOR: 'performance_predictor',
  ATTENDANCE_ANALYZER: 'attendance_analyzer',
  FEE_PREDICTOR: 'fee_predictor',
  TIMETABLE_AI: 'timetable_ai',
  BOOK_RECOMMENDER: 'book_recommender',
};

// ─── Currency ─────────────────────────────────
const CURRENCY = {
  CODE: 'ETB',
  SYMBOL: 'ብር',
  NAME: 'Ethiopian Birr',
  DECIMAL_PLACES: 2,
};

// ─── School Info ──────────────────────────────
const SCHOOL_INFO = {
  NAME: process.env.SCHOOL_NAME || 'Kat Secondary School',
  ADDRESS: process.env.SCHOOL_ADDRESS || 'Addis Ababa, Ethiopia',
  PHONE: process.env.SCHOOL_PHONE || '+251-11-XXX-XXXX',
  EMAIL: process.env.SCHOOL_EMAIL || 'info@katschool.edu.et',
  WEBSITE: process.env.SCHOOL_WEBSITE || 'www.katschool.edu.et',
  MOTTO: process.env.SCHOOL_MOTTO || 'Excellence in Education',
  GRADES: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  CURRICULUM: 'Ethiopian Ministry of Education',
  ACADEMIC_YEAR_START_MONTH: 'Meskerem',
  ACADEMIC_YEAR_END_MONTH: 'Sene',
  TERMS_PER_YEAR: 3,
};

// ─── Audit Log Actions ────────────────────────
const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import',
  PRINT: 'print',
  APPROVE: 'approve',
  REJECT: 'reject',
  RESET_PASSWORD: 'reset_password',
  CHANGE_SETTINGS: 'change_settings',
};

// ─── Notification Types ───────────────────────
const NOTIFICATION_TYPES = {
  FEE_DUE: 'fee_due',
  FEE_PAID: 'fee_paid',
  ATTENDANCE_ALERT: 'attendance_alert',
  EXAM_SCHEDULE: 'exam_schedule',
  RESULT_PUBLISHED: 'result_published',
  NOTICE: 'notice',
  MESSAGE: 'message',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  BOOK_DUE: 'book_due',
  GENERAL: 'general',
};

// ─── Exports ──────────────────────────────────
module.exports = {
  ROLES,
  ALL_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_REGIONS,
  ETHIOPIAN_RELIGIONS,
  ETHIOPIAN_LANGUAGES,
  GRADE_LEVELS,
  GRADE_NAMES,
  SECTIONS,
  STREAMS,
  GRADING_SCALE,
  ASSESSMENT_WEIGHTS,
  EXAM_TYPES,
  SUBJECTS,
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_COLORS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  DEFAULT_FEE_TYPES,
  LEAVE_STATUS,
  DEFAULT_LEAVE_TYPES,
  EMPLOYMENT_TYPES,
  DEFAULT_DEPARTMENTS,
  SALARY_COMPONENTS,
  INCOME_TAX_BRACKETS,
  PENSION_RATES,
  LIBRARY_SETTINGS,
  DEFAULT_BOOK_CATEGORIES,
  NOTICE_CATEGORIES,
  NOTICE_AUDIENCES,
  EVENT_TYPES,
  SUSPENSION_TYPES,
  STUDENT_STATUS,
  TEACHER_STATUS,
  EMPLOYEE_STATUS,
  DOCUMENT_TYPES,
  BLOOD_GROUPS,
  GENDERS,
  FILE_UPLOAD,
  PAGINATION,
  CACHE_DURATION,
  TOKEN_EXPIRY,
  MESSAGES,
  HTTP_STATUS,
  DAYS_OF_WEEK,
  TIMETABLE_PERIODS,
  AI_MODELS,
  AI_FEATURES,
  CURRENCY,
  SCHOOL_INFO,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
};
 