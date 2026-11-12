// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EMAIL CONFIGURATION & TEMPLATES
// ============================================

'use strict';

const nodemailer = require('nodemailer');
const { SCHOOL_INFO } = require('./constants');

// ─── Create Transporter ───────────────────────
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  });

  return transporter;
};

// ─── Verify Email Connection ──────────────────
const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.info('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.warn('⚠️  Email server connection failed:', error.message);
    return false;
  }
};

// ─── Base Email Template ──────────────────────
const baseTemplate = (content, title = 'Kat Secondary School') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-flag {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }
    .flag-stripe {
      height: 5px;
      width: 120px;
    }
    .school-logo {
      width: 64px;
      height: 64px;
      background: rgba(255,255,255,0.2);
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 12px;
      border: 2px solid rgba(255,255,255,0.3);
    }
    .school-name {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    .school-location {
      font-size: 13px;
      color: rgba(255,255,255,0.8);
      margin-top: 4px;
    }
    .ethiopian-bar {
      display: flex;
      height: 4px;
    }
    .bar-green { background: #078930; flex: 1; }
    .bar-yellow { background: #FCDD09; flex: 1; }
    .bar-red { background: #DA121A; flex: 1; }
    .body {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
    }
    .message {
      font-size: 14px;
      color: #475569;
      margin-bottom: 20px;
      line-height: 1.7;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      margin: 16px 0;
    }
    .btn-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    .btn-success {
      background: linear-gradient(135deg, #22c55e, #16a34a);
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 13.5px;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-weight: 600; }
    .info-value { color: #1e293b; font-weight: 700; }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
      font-size: 13.5px;
      color: #92400e;
    }
    .alert-box.danger {
      background: #fee2e2;
      border-color: #ef4444;
      color: #991b1b;
    }
    .alert-box.success {
      background: #dcfce7;
      border-color: #22c55e;
      color: #166534;
    }
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }
    .footer {
      background: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.7;
    }
    .footer-school {
      font-size: 13px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 4px;
    }
    .otp-box {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 20px 0;
    }
    .otp-code {
      font-size: 40px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 12px;
      font-family: 'Courier New', monospace;
    }
    .otp-label {
      font-size: 13px;
      color: rgba(255,255,255,0.8);
      margin-top: 8px;
    }
    .receipt-total {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      padding: 16px 20px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }
    .receipt-total-label { font-size: 16px; font-weight: 700; }
    .receipt-total-amount { font-size: 22px; font-weight: 900; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="school-logo">KS</div>
      <div class="school-name">${SCHOOL_INFO.NAME}</div>
      <div class="school-location">Addis Ababa, Ethiopia</div>
    </div>
    <div class="ethiopian-bar">
      <div class="bar-green"></div>
      <div class="bar-yellow"></div>
      <div class="bar-red"></div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <div class="footer-school">${SCHOOL_INFO.NAME}</div>
      <div class="footer-text">
        ${SCHOOL_INFO.ADDRESS}<br/>
        📞 ${SCHOOL_INFO.PHONE} | ✉️ ${SCHOOL_INFO.EMAIL}<br/>
        🌐 ${SCHOOL_INFO.WEBSITE}<br/><br/>
        This is an automated email. Please do not reply to this email.<br/>
        © ${new Date().getFullYear()} ${SCHOOL_INFO.NAME}. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

// ─── Send Email Function ──────────────────────
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || SCHOOL_INFO.NAME}" <${
        process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
      }>`,
      to,
      subject,
      html,
      text: text || 'Please view this email in an HTML-compatible email client.',
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    console.info(`✅ Email sent to ${to} | Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email sending failed to ${to}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// ─── 1. Password Reset Email ──────────────────
const sendPasswordResetEmail = async ({ to, name, resetToken, resetURL }) => {
  const content = `
    <div class="greeting">Hello, ${name} 👋</div>
    <p class="message">
      We received a request to reset your password for your Kat School account.
      Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.
    </p>
    <div style="text-align: center;">
      <a href="${resetURL}" class="btn">🔐 Reset My Password</a>
    </div>
    <div class="alert-box">
      ⚠️ If you did not request a password reset, please ignore this email.
      Your password will remain unchanged.
    </div>
    <p class="message" style="font-size:12px; color:#94a3b8;">
      If the button doesn't work, copy and paste this URL into your browser:<br/>
      <span style="color:#4f46e5; word-break:break-all;">${resetURL}</span>
    </p>
  `;

  return sendEmail({
    to,
    subject: `🔐 Password Reset — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Password Reset'),
  });
};

// ─── 2. Welcome / Account Created Email ───────
const sendWelcomeEmail = async ({ to, name, role, email, tempPassword }) => {
  const content = `
    <div class="greeting">Welcome to ${SCHOOL_INFO.NAME}! 🎉</div>
    <p class="message">
      Your account has been created successfully. You can now access the school
      management system using the credentials below.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Full Name</span>
        <span class="info-value">${name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email Address</span>
        <span class="info-value">${email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Role</span>
        <span class="info-value">${role}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Temporary Password</span>
        <span class="info-value" style="color:#ef4444; font-family:monospace;">${tempPassword}</span>
      </div>
    </div>
    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/login" class="btn">🚀 Login Now</a>
    </div>
    <div class="alert-box">
      ⚠️ Please change your password immediately after your first login for security.
    </div>
  `;

  return sendEmail({
    to,
    subject: `🎉 Welcome to ${SCHOOL_INFO.NAME} — Account Created`,
    html: baseTemplate(content, 'Welcome'),
  });
};

// ─── 3. Fee Payment Receipt Email ─────────────
const sendFeeReceiptEmail = async ({
  to,
  studentName,
  studentId,
  receiptNumber,
  feeType,
  amount,
  paymentMethod,
  paymentDate,
  academicYear,
  term,
  paidBy,
}) => {
  const content = `
    <div class="greeting">Payment Receipt 🧾</div>
    <p class="message">
      This is to confirm that the following fee payment has been received
      successfully for <strong>${studentName}</strong>.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Receipt Number</span>
        <span class="info-value" style="color:#4f46e5;">${receiptNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Student Name</span>
        <span class="info-value">${studentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Student ID</span>
        <span class="info-value">${studentId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fee Type</span>
        <span class="info-value">${feeType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Academic Year</span>
        <span class="info-value">${academicYear}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Term</span>
        <span class="info-value">${term}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Method</span>
        <span class="info-value">${paymentMethod}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Date</span>
        <span class="info-value">${paymentDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Paid By</span>
        <span class="info-value">${paidBy}</span>
      </div>
    </div>
    <div class="receipt-total">
      <span class="receipt-total-label">Total Amount Paid</span>
      <span class="receipt-total-amount">ETB ${amount.toLocaleString()}</span>
    </div>
    <div class="alert-box success" style="margin-top:16px;">
      ✅ Payment confirmed and recorded. Thank you!
    </div>
  `;

  return sendEmail({
    to,
    subject: `🧾 Fee Receipt #${receiptNumber} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Payment Receipt'),
  });
};

// ─── 4. Attendance Alert Email ────────────────
const sendAttendanceAlertEmail = async ({
  to,
  parentName,
  studentName,
  studentId,
  grade,
  date,
  status,
  attendancePercentage,
}) => {
  const isAbsent = status === 'absent';
  const isLow = attendancePercentage < 75;

  const content = `
    <div class="greeting">Attendance Alert 📋</div>
    <p class="message">
      Dear <strong>${parentName}</strong>,<br/>
      This is an automated notification regarding the attendance of your child.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Student Name</span>
        <span class="info-value">${studentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Student ID</span>
        <span class="info-value">${studentId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Grade</span>
        <span class="info-value">${grade}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value" style="color:${isAbsent ? '#ef4444' : '#f59e0b'}; text-transform:capitalize;">
          ${status}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Overall Attendance</span>
        <span class="info-value" style="color:${isLow ? '#ef4444' : '#22c55e'};">
          ${attendancePercentage}%
        </span>
      </div>
    </div>
    ${
      isLow
        ? `<div class="alert-box danger">
        ⚠️ WARNING: ${studentName}'s attendance has dropped below 75%.
        Students with less than 75% attendance may not be allowed to sit for final exams.
        Please ensure regular school attendance.
      </div>`
        : `<div class="alert-box">
        Please ensure your child attends school regularly.
        Contact the school office if there are any issues.
      </div>`
    }
    <div style="text-align: center; margin-top: 20px;">
      <a href="${process.env.CLIENT_URL}/login" class="btn ${isLow ? 'btn-danger' : ''}">
        View Full Attendance Report
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `📋 Attendance Alert — ${studentName} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Attendance Alert'),
  });
};

// ─── 5. Exam Schedule Notification Email ──────
const sendExamScheduleEmail = async ({ to, name, grade, exams, term, academicYear }) => {
  const examRows = exams
    .map(
      (exam) => `
    <div class="info-row">
      <span class="info-label">${exam.subject}</span>
      <span class="info-value">${exam.date} | ${exam.time} | ${exam.room}</span>
    </div>
  `
    )
    .join('');

  const content = `
    <div class="greeting">Exam Schedule — ${term} 📝</div>
    <p class="message">
      Dear <strong>${name}</strong>,<br/>
      The examination schedule for <strong>${grade}</strong> has been published.
      Please note the dates, times, and rooms carefully.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Academic Year</span>
        <span class="info-value">${academicYear}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Term</span>
        <span class="info-value">${term}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Grade</span>
        <span class="info-value">${grade}</span>
      </div>
    </div>
    <div class="info-box">
      <div style="font-weight:800; font-size:14px; margin-bottom:12px; color:#1e293b;">
        📅 Exam Timetable
      </div>
      ${examRows}
    </div>
    <div class="alert-box">
      📌 Please arrive at the exam room at least 15 minutes early.
      Bring your student ID, pens, and any required materials.
      Mobile phones are strictly prohibited in exam rooms.
    </div>
  `;

  return sendEmail({
    to,
    subject: `📝 Exam Schedule — ${term} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Exam Schedule'),
  });
};

// ─── 6. Leave Application Email ───────────────
const sendLeaveApplicationEmail = async ({
  to,
  employeeName,
  leaveType,
  startDate,
  endDate,
  totalDays,
  reason,
  status,
  approverName,
  rejectionReason,
}) => {
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  const content = `
    <div class="greeting">Leave Application ${isApproved ? 'Approved ✅' : isRejected ? 'Rejected ❌' : 'Submitted 📋'}</div>
    <p class="message">
      Dear <strong>${employeeName}</strong>,<br/>
      ${
        isApproved
          ? 'Your leave application has been approved.'
          : isRejected
            ? 'Unfortunately, your leave application has been rejected.'
            : 'Your leave application has been submitted successfully and is pending approval.'
      }
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Leave Type</span>
        <span class="info-value">${leaveType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Start Date</span>
        <span class="info-value">${startDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">End Date</span>
        <span class="info-value">${endDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Days</span>
        <span class="info-value">${totalDays} days</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reason</span>
        <span class="info-value">${reason}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value" style="color:${
          isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#f59e0b'
        }; text-transform:capitalize; font-weight:800;">
          ${status}
        </span>
      </div>
      ${
        approverName
          ? `<div class="info-row">
        <span class="info-label">Processed By</span>
        <span class="info-value">${approverName}</span>
      </div>`
          : ''
      }
    </div>
    ${
      isRejected && rejectionReason
        ? `<div class="alert-box danger">
        ❌ Rejection Reason: ${rejectionReason}
      </div>`
        : ''
    }
    ${
      isApproved
        ? `<div class="alert-box success">
        ✅ Your leave has been approved. Please ensure your duties are handed over before your leave.
      </div>`
        : ''
    }
  `;

  return sendEmail({
    to,
    subject: `📋 Leave Application ${status.toUpperCase()} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Leave Application'),
  });
};

// ─── 7. Notice Notification Email ─────────────
const sendNoticeEmail = async ({
  to,
  recipientName,
  noticeTitle,
  noticeContent,
  publishedBy,
  publishDate,
  category,
}) => {
  const content = `
    <div class="greeting">New Notice: ${noticeTitle} 📢</div>
    <p class="message">
      Dear <strong>${recipientName}</strong>,<br/>
      A new notice has been published on the school notice board.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Title</span>
        <span class="info-value">${noticeTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Category</span>
        <span class="info-value">${category}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Published By</span>
        <span class="info-value">${publishedBy}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${publishDate}</span>
      </div>
    </div>
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px; margin:16px 0;">
      <div style="font-weight:700; font-size:13px; color:#64748b; margin-bottom:10px;">Notice Content:</div>
      <div style="font-size:14px; color:#1e293b; line-height:1.7;">${noticeContent}</div>
    </div>
    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/notice-board" class="btn">
        📢 View Full Notice
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `📢 Notice: ${noticeTitle} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Notice'),
  });
};

// ─── 8. Result Published Email ────────────────
const sendResultPublishedEmail = async ({
  to,
  studentName,
  studentId,
  grade,
  term,
  academicYear,
  overallScore,
  overallGrade,
  rank,
  totalStudents,
}) => {
  const isPassed = overallGrade !== 'F';

  const content = `
    <div class="greeting">Exam Results Published 📊</div>
    <p class="message">
      Dear <strong>${studentName}</strong>,<br/>
      Your examination results for <strong>${term}</strong> have been published.
      Login to your account to view your detailed results and report card.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Student</span>
        <span class="info-value">${studentName} (${studentId})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Grade</span>
        <span class="info-value">${grade}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Academic Year</span>
        <span class="info-value">${academicYear}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Term</span>
        <span class="info-value">${term}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Overall Score</span>
        <span class="info-value" style="font-size:18px; color:#4f46e5; font-weight:900;">
          ${overallScore}%
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Overall Grade</span>
        <span class="info-value" style="font-size:18px; color:${isPassed ? '#22c55e' : '#ef4444'}; font-weight:900;">
          ${overallGrade}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Class Rank</span>
        <span class="info-value">#${rank} out of ${totalStudents}</span>
      </div>
    </div>
    <div class="alert-box ${isPassed ? 'success' : 'danger'}">
      ${isPassed ? `🎉 Congratulations! You have passed this term's examination.` : `⚠️ You have not met the passing criteria. Please see your class teacher for guidance.`}
    </div>
    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/login" class="btn">
        📊 View Full Results & Report Card
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `📊 Results Published — ${term} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Results Published'),
  });
};

// ─── 9. Salary Slip Email ─────────────────────
const sendSalarySlipEmail = async ({
  to,
  employeeName,
  employeeId,
  designation,
  department,
  month,
  year,
  basicSalary,
  totalAllowances,
  totalDeductions,
  netSalary,
  paymentDate,
  paymentMethod,
}) => {
  const content = `
    <div class="greeting">Salary Slip — ${month} ${year} 💰</div>
    <p class="message">
      Dear <strong>${employeeName}</strong>,<br/>
      Your salary slip for <strong>${month} ${year}</strong> is ready.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Employee ID</span>
        <span class="info-value">${employeeId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">${employeeName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Designation</span>
        <span class="info-value">${designation}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Department</span>
        <span class="info-value">${department}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Pay Period</span>
        <span class="info-value">${month} ${year}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Date</span>
        <span class="info-value">${paymentDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Method</span>
        <span class="info-value">${paymentMethod}</span>
      </div>
      <hr style="border:none; border-top:1px dashed #e2e8f0; margin:8px 0;"/>
      <div class="info-row">
        <span class="info-label">Basic Salary</span>
        <span class="info-value">ETB ${basicSalary.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Allowances</span>
        <span class="info-value" style="color:#22c55e;">
          + ETB ${totalAllowances.toLocaleString()}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Deductions</span>
        <span class="info-value" style="color:#ef4444;">
          - ETB ${totalDeductions.toLocaleString()}
        </span>
      </div>
    </div>
    <div class="receipt-total">
      <span class="receipt-total-label">Net Salary</span>
      <span class="receipt-total-amount">ETB ${netSalary.toLocaleString()}</span>
    </div>
    <div style="text-align: center; margin-top:20px;">
      <a href="${process.env.CLIENT_URL}/login" class="btn">
        💰 View Full Salary Slip
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `💰 Salary Slip — ${month} ${year} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Salary Slip'),
  });
};

// ─── 10. Book Overdue Alert Email ─────────────
const sendBookOverdueEmail = async ({
  to,
  memberName,
  bookTitle,
  bookAuthor,
  issueDate,
  dueDate,
  daysOverdue,
  fineAmount,
}) => {
  const content = `
    <div class="greeting">Library Book Overdue Alert 📚</div>
    <p class="message">
      Dear <strong>${memberName}</strong>,<br/>
      This is a reminder that the following book is overdue and must be returned immediately.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Book Title</span>
        <span class="info-value">${bookTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Author</span>
        <span class="info-value">${bookAuthor}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Issue Date</span>
        <span class="info-value">${issueDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Due Date</span>
        <span class="info-value" style="color:#ef4444;">${dueDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Days Overdue</span>
        <span class="info-value" style="color:#ef4444; font-weight:900;">${daysOverdue} days</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fine Amount</span>
        <span class="info-value" style="color:#ef4444; font-weight:900;">
          ETB ${fineAmount.toLocaleString()}
        </span>
      </div>
    </div>
    <div class="alert-box danger">
      ⚠️ Please return the book immediately to avoid additional fines.
      Fine is calculated at ETB 2 per day. Failure to return books may result
      in suspension of library privileges.
    </div>
  `;

  return sendEmail({
    to,
    subject: `📚 Library Book Overdue — ${bookTitle} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Book Overdue'),
  });
};

// ─── 11. Fee Reminder Email ───────────────────
const sendFeeReminderEmail = async ({
  to,
  parentName,
  studentName,
  studentId,
  feeType,
  amount,
  dueDate,
  academicYear,
  term,
}) => {
  const content = `
    <div class="greeting">Fee Payment Reminder 💳</div>
    <p class="message">
      Dear <strong>${parentName}</strong>,<br/>
      This is a friendly reminder that the following fee payment is due soon.
      Please make the payment before the due date to avoid any penalties.
    </p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Student Name</span>
        <span class="info-value">${studentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Student ID</span>
        <span class="info-value">${studentId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fee Type</span>
        <span class="info-value">${feeType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Academic Year</span>
        <span class="info-value">${academicYear}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Term</span>
        <span class="info-value">${term}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Due Date</span>
        <span class="info-value" style="color:#ef4444; font-weight:800;">${dueDate}</span>
      </div>
    </div>
    <div class="receipt-total">
      <span class="receipt-total-label">Amount Due</span>
      <span class="receipt-total-amount">ETB ${amount.toLocaleString()}</span>
    </div>
    <div class="alert-box" style="margin-top:16px;">
      💳 Payment Methods: Cash, Telebirr, CBE Birr, Bank Transfer
      <br/>Please visit the school finance office or pay online.
    </div>
    <div style="text-align: center; margin-top:16px;">
      <a href="${process.env.CLIENT_URL}/fees" class="btn">
        💳 Pay Now
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `💳 Fee Payment Reminder — ${feeType} — ${SCHOOL_INFO.NAME}`,
    html: baseTemplate(content, 'Fee Reminder'),
  });
};

// ─── Exports ──────────────────────────────────
module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendFeeReceiptEmail,
  sendAttendanceAlertEmail,
  sendExamScheduleEmail,
  sendLeaveApplicationEmail,
  sendNoticeEmail,
  sendResultPublishedEmail,
  sendSalarySlipEmail,
  sendBookOverdueEmail,
  sendFeeReminderEmail,
  verifyEmailConnection,
  createTransporter,
};
