// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXPRESS APPLICATION SETUP
// ============================================

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const studentRoutes = require('./routes/student.routes');
const guardianRoutes = require('./routes/guardian.routes');
const studentCategoryRoutes = require('./routes/studentCategory.routes');
const teacherRoutes = require('./routes/teacher.routes');
const timetableRoutes = require('./routes/timetable.routes');
const suspensionRoutes = require('./routes/suspension.routes');
const academicYearRoutes = require('./routes/academicYear.routes');
const termRoutes = require('./routes/term.routes');
const classRoutes = require('./routes/class.routes');
const sectionRoutes = require('./routes/section.routes');
const subjectRoutes = require('./routes/subject.routes');
const roomRoutes = require('./routes/room.routes');
const holidayRoutes = require('./routes/holiday.routes');
const examTypeRoutes = require('./routes/examType.routes');
const examRoutes = require('./routes/exam.routes');
const resultRoutes = require('./routes/result.routes');
const reportCardRoutes = require('./routes/reportCard.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const teacherAttendanceRoutes = require('./routes/teacherAttendance.routes');
const attendanceReportRoutes = require('./routes/attendanceReport.routes');
const feeTypeRoutes = require('./routes/feeType.routes');
const feeGroupRoutes = require('./routes/feeGroup.routes');
const feeDiscountRoutes = require('./routes/feeDiscount.routes');
const feeAssignmentRoutes = require('./routes/feeAssignment.routes');
const feePaymentRoutes = require('./routes/feePayment.routes');
const incomeRoutes = require('./routes/income.routes');
const expenseRoutes = require('./routes/expense.routes');
const expenseCategoryRoutes = require('./routes/expenseCategory.routes');
const departmentRoutes = require('./routes/department.routes');
const designationRoutes = require('./routes/designation.routes');
const employeeRoutes = require('./routes/employee.routes');
const leaveTypeRoutes = require('./routes/leaveType.routes');
const leaveRoutes = require('./routes/leave.routes');
const salaryStructureRoutes = require('./routes/salaryStructure.routes');
const payrollRoutes = require('./routes/payroll.routes');
const bookCategoryRoutes = require('./routes/bookCategory.routes');
const bookRoutes = require('./routes/book.routes');
const libraryMemberRoutes = require('./routes/libraryMember.routes');
const bookIssueRoutes = require('./routes/bookIssue.routes');
const noticeRoutes = require('./routes/notice.routes');
const eventRoutes = require('./routes/event.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const settingsRoutes = require('./routes/settings.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const aiRoutes = require('./routes/ai.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler.middleware');
const corsOptions = require('./config/corsOptions');

// ─── Create Express App ──────────────────────
const app = express();

// ─── Trust Proxy ─────────────────────────────
// Required for rate limiting behind reverse proxy
// (Nginx, Heroku, etc.)
app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────
// Helmet sets various HTTP security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'https://api.anthropic.com', 'https://api.openai.com'],
      },
    },
  })
);

// ─── CORS ────────────────────────────────────
// Allow requests from the React frontend
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Global Rate Limiter ─────────────────────
// Limit all API requests to prevent abuse
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
});

app.use('/api', globalLimiter);

// ─── Request Logging ─────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      skip: (req, res) => res.statusCode < 400,
    })
  );
}

// ─── Body Parsers ─────────────────────────────
// Parse JSON request bodies
app.use(
  express.json({
    limit: '10mb',
    strict: true,
  })
);

// Parse URL-encoded form data
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// ─── Cookie Parser ────────────────────────────
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Compression ─────────────────────────────
// Compress all responses
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
  })
);

// ─── MongoDB Sanitization ────────────────────
// Prevent NoSQL injection attacks
// Removes $ and . from request body, query, params
app.use(
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`⚠️  Sanitized suspicious input in ${key} from ${req.ip}`);
    },
  })
);

// ─── Static Files ─────────────────────────────
// Serve uploaded files
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    etag: true,
  })
);

// ─── Health Check ─────────────────────────────
// Simple endpoint to check if server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kat School API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    school: 'Kat Secondary School — Addis Ababa, Ethiopia',
    ai: {
      claude: 'Active',
      gpt4: 'Active',
    },
  });
});

// ─── API Routes ───────────────────────────────
const API = '/api';

// Auth & Users
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/roles`, roleRoutes);

// People
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/guardians`, guardianRoutes);
app.use(`${API}/student-categories`, studentCategoryRoutes);
app.use(`${API}/teachers`, teacherRoutes);
app.use(`${API}/suspensions`, suspensionRoutes);

// Academic
app.use(`${API}/academic-years`, academicYearRoutes);
app.use(`${API}/terms`, termRoutes);
app.use(`${API}/classes`, classRoutes);
app.use(`${API}/sections`, sectionRoutes);
app.use(`${API}/subjects`, subjectRoutes);
app.use(`${API}/rooms`, roomRoutes);
app.use(`${API}/holidays`, holidayRoutes);
app.use(`${API}/timetables`, timetableRoutes);

// Exams & Results
app.use(`${API}/exam-types`, examTypeRoutes);
app.use(`${API}/exams`, examRoutes);
app.use(`${API}/results`, resultRoutes);
app.use(`${API}/report-cards`, reportCardRoutes);

// Attendance
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/teacher-attendance`, teacherAttendanceRoutes);
app.use(`${API}/attendance-reports`, attendanceReportRoutes);

// Finance
app.use(`${API}/fee-types`, feeTypeRoutes);
app.use(`${API}/fee-groups`, feeGroupRoutes);
app.use(`${API}/fee-discounts`, feeDiscountRoutes);
app.use(`${API}/fee-assignments`, feeAssignmentRoutes);
app.use(`${API}/fee-payments`, feePaymentRoutes);
app.use(`${API}/income`, incomeRoutes);
app.use(`${API}/expenses`, expenseRoutes);
app.use(`${API}/expense-categories`, expenseCategoryRoutes);

// HRM
app.use(`${API}/departments`, departmentRoutes);
app.use(`${API}/designations`, designationRoutes);
app.use(`${API}/employees`, employeeRoutes);
app.use(`${API}/leave-types`, leaveTypeRoutes);
app.use(`${API}/leaves`, leaveRoutes);
app.use(`${API}/salary-structures`, salaryStructureRoutes);
app.use(`${API}/payroll`, payrollRoutes);

// Library
app.use(`${API}/book-categories`, bookCategoryRoutes);
app.use(`${API}/books`, bookRoutes);
app.use(`${API}/library-members`, libraryMemberRoutes);
app.use(`${API}/book-issues`, bookIssueRoutes);

// Communication
app.use(`${API}/notices`, noticeRoutes);
app.use(`${API}/events`, eventRoutes);
app.use(`${API}/messages`, messageRoutes);
app.use(`${API}/notifications`, notificationRoutes);

// System
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/settings`, settingsRoutes);
app.use(`${API}/audit-logs`, auditLogRoutes);

// AI
app.use(`${API}/ai`, aiRoutes);

// ─── Handle Unknown Routes ────────────────────
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server`,
  });
});

// ─── Global Error Handler ─────────────────────
// Must be last middleware — handles all errors
app.use(errorHandler);

module.exports = app;
