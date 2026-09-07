// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EMAIL UTILITY
// kat-school/server/src/utils/email.util.js
// ============================================

'use strict';

const nodemailer = require('nodemailer');
const path = require('path');

// ─── Create Transporter ───────────────────────
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // SMTP configuration
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// ─── School Email Header ──────────────────────
const getEmailHeader = () => `
  <div style="background-color:#4f46e5;padding:20px;text-align:center;">
    <img src="${process.env.SCHOOL_LOGO_URL || ''}"
      alt="Kat Secondary School"
      style="height:60px;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;"
      onerror="this.style.display='none'" />
    <h1 style="color:#ffffff;margin:0;font-size:22px;font-family:Arial,sans-serif;">
      Kat Secondary School
    </h1>
    <p style="color:#c7d2fe;margin:4px 0 0;font-size:13px;font-family:Arial,sans-serif;">
      Excellence in Education | Addis Ababa, Ethiopia
    </p>
  </div>
`;

// ─── School Email Footer ──────────────────────
const getEmailFooter = () => `
  <div style="background-color:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#64748b;font-size:12px;margin:0;font-family:Arial,sans-serif;">
      This is an automated message from Kat Secondary School Management System.
      Please do not reply to this email.
    </p>
    <p style="color:#94a3b8;font-size:11px;margin:8px 0 0;font-family:Arial,sans-serif;">
      Kat Secondary School | Addis Ababa, Ethiopia |
      ${process.env.SCHOOL_PHONE || ''} | ${process.env.SCHOOL_EMAIL || ''}
    </p>
  </div>
`;

// ─── Build Email HTML ─────────────────────────
const buildEmailHTML = (title, bodyHTML) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;border-radius:8px;overflow:hidden;
          box-shadow:0 1px 3px rgba(0,0,0,0.1);max-width:600px;width:100%;">
          <tr><td>${getEmailHeader()}</td></tr>
          <tr>
            <td style="padding:32px 40px;">
              ${bodyHTML}
            </td>
          </tr>
          <tr><td>${getEmailFooter()}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── Send Email ───────────────────────────────
const sendEmail = async ({
  to,
  subject,
  html,
  text = null,
  attachments = [],
  replyTo = null,
  cc = null,
  bcc = null,
}) => {
  if (!process.env.EMAIL_FROM) {
    console.warn('⚠️ EMAIL_FROM not configured. Email not sent.');
    return { success: false, reason: 'Email not configured' };
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Kat Secondary School" <${process.env.EMAIL_FROM}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html: html || '',
      text: text || html?.replace(/<[^>]*>/g, '') || '',
      attachments,
    };

    if (replyTo) mailOptions.replyTo = replyTo;
    if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;

    const info = await transporter.sendMail(mailOptions);

    console.info(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email sending failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ─── Welcome Email ────────────────────────────
const sendWelcomeEmail = async (user, temporaryPassword = null) => {
  const bodyHTML = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Welcome to Kat Secondary School!</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Dear <strong>${user.firstName} ${user.fatherName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Your account has been created successfully on the Kat Secondary School
      Management System. You can now login and access your dashboard.
    </p>
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="color:#1e293b;font-size:14px;margin:0 0 8px;"><strong>Your Login Details:</strong></p>
      <p style="color:#475569;font-size:14px;margin:4px 0;"><strong>Email:</strong> ${user.email}</p>
      ${
        temporaryPassword
          ? `<p style="color:#475569;font-size:14px;margin:4px 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
           <p style="color:#ef4444;font-size:13px;margin:8px 0 0;">⚠️ Please change your password immediately after first login.</p>`
          : ''
      }
      <p style="color:#475569;font-size:14px;margin:4px 0;"><strong>Role:</strong> ${user.role}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login"
        style="background-color:#4f46e5;color:#ffffff;padding:12px 28px;border-radius:6px;
        text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
        Login to Dashboard
      </a>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;">
      If you did not expect this email, please contact the school administration.
    </p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Kat Secondary School Management System',
    html: buildEmailHTML('Welcome', bodyHTML),
  });
};

// ─── Password Reset Email ─────────────────────
const sendPasswordResetEmail = async (user, resetToken, resetUrl) => {
  const bodyHTML = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Password Reset Request</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Dear <strong>${user.firstName} ${user.fatherName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      We received a request to reset your password. Click the button below to
      reset it. This link will expire in <strong>15 minutes</strong>.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetUrl}"
        style="background-color:#ef4444;color:#ffffff;padding:12px 28px;border-radius:6px;
        text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color:#64748b;font-size:13px;margin:8px 0;">
      If the button doesn't work, copy and paste this link:<br/>
      <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;">${resetUrl}</a>
    </p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;margin:16px 0;">
      <p style="color:#dc2626;font-size:13px;margin:0;">
        ⚠️ If you did not request this, please ignore this email and your password will remain unchanged.
        Contact the school administration if you believe your account has been compromised.
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset - Kat Secondary School',
    html: buildEmailHTML('Password Reset', bodyHTML),
  });
};

// ─── Fee Payment Receipt Email ────────────────
const sendReceiptEmail = async (recipientEmail, recipientName, receiptData) => {
  const {
    receiptNumber,
    studentName,
    studentId,
    feeTypeName,
    amount,
    paymentDate,
    paymentMethod,
    academicYearName,
    collectedByName,
    remainingBalance,
  } = receiptData;

  const bodyHTML = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Payment Receipt</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Dear <strong>${recipientName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Payment has been received successfully. Please find your receipt details below.
    </p>
    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 12px;">
        Receipt #${receiptNumber}
      </p>
      <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;color:#475569;">
        <tr><td style="width:45%;font-weight:600;">Student Name:</td><td>${studentName}</td></tr>
        <tr><td style="font-weight:600;">Student ID:</td><td>${studentId}</td></tr>
        <tr><td style="font-weight:600;">Fee Type:</td><td>${feeTypeName}</td></tr>
        <tr><td style="font-weight:600;">Amount Paid:</td><td style="color:#166534;font-weight:700;">ETB ${Number(amount).toLocaleString()}</td></tr>
        <tr><td style="font-weight:600;">Payment Date:</td><td>${paymentDate}</td></tr>
        <tr><td style="font-weight:600;">Payment Method:</td><td>${paymentMethod}</td></tr>
        <tr><td style="font-weight:600;">Academic Year:</td><td>${academicYearName}</td></tr>
        <tr><td style="font-weight:600;">Collected By:</td><td>${collectedByName}</td></tr>
        <tr>
          <td style="font-weight:600;">Balance Remaining:</td>
          <td style="color:${remainingBalance > 0 ? '#dc2626' : '#166534'};font-weight:700;">
            ETB ${Number(remainingBalance).toLocaleString()}
            ${remainingBalance <= 0 ? ' (Fully Paid ✓)' : ''}
          </td>
        </tr>
      </table>
    </div>
    <p style="color:#64748b;font-size:13px;margin:8px 0;">
      Please keep this email as your receipt. Visit the school finance office for a printed receipt.
    </p>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Payment Receipt #${receiptNumber} - Kat Secondary School`,
    html: buildEmailHTML('Payment Receipt', bodyHTML),
  });
};

// ─── Attendance Alert Email ───────────────────
const sendAbsenceAlertEmail = async (
  parentEmail,
  parentName,
  studentName,
  grade,
  date,
  type = 'absent'
) => {
  const typeText = type === 'late' ? 'arrived late to school' : 'was absent from school';
  const bodyHTML = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Attendance Alert</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Dear <strong>${parentName}</strong>,
    </p>
    <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="color:#9a3412;font-size:15px;margin:0;">
        ⚠️ This is to inform you that <strong>${studentName}</strong> (${grade})
        ${typeText} on <strong>${date}</strong>.
      </p>
    </div>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      If this absence was planned, please provide an excuse note to the class teacher.
      For unauthorized absences, please ensure your child attends school regularly.
    </p>
    <p style="color:#475569;font-size:14px;">
      If you have questions, please contact the school at
      <strong>${process.env.SCHOOL_PHONE || 'school phone'}</strong>.
    </p>
  `;

  return sendEmail({
    to: parentEmail,
    subject: `Attendance Alert: ${studentName} - Kat Secondary School`,
    html: buildEmailHTML('Attendance Alert', bodyHTML),
  });
};

// ─── Leave Application Status Email ──────────
const sendLeaveStatusEmail = async (staffEmail, staffName, status, leaveData) => {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#166534' : '#dc2626';
  const statusBg = isApproved ? '#f0fdf4' : '#fef2f2';
  const statusBorder = isApproved ? '#bbf7d0' : '#fecaca';

  const bodyHTML = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">
      Leave Application ${isApproved ? 'Approved' : 'Rejected'}
    </h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Dear <strong>${staffName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Your leave application (${leaveData.applicationNumber}) has been
      <strong style="color:${statusColor};">${status.toUpperCase()}</strong>.
    </p>
    <div style="background-color:${statusBg};border:1px solid ${statusBorder};border-radius:6px;padding:16px;margin:16px 0;">
      <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;color:#475569;">
        <tr><td style="font-weight:600;">Leave Type:</td><td>${leaveData.leaveTypeName}</td></tr>
        <tr><td style="font-weight:600;">From:</td><td>${leaveData.startDate}</td></tr>
        <tr><td style="font-weight:600;">To:</td><td>${leaveData.endDate}</td></tr>
        <tr><td style="font-weight:600;">Days:</td><td>${leaveData.numberOfDays} day(s)</td></tr>
        <tr><td style="font-weight:600;">Status:</td>
          <td style="color:${statusColor};font-weight:700;">${status.toUpperCase()}</td></tr>
        ${
          leaveData.remarks
            ? `<tr><td style="font-weight:600;">Remarks:</td><td>${leaveData.remarks}</td></tr>`
            : ''
        }
      </table>
    </div>
    ${
      !isApproved
        ? `<p style="color:#475569;font-size:14px;">
          If you believe this decision is incorrect, please contact the HR department.
        </p>`
        : `<p style="color:#475569;font-size:14px;">
          Please ensure a proper handover is done before your leave begins.
        </p>`
    }
  `;

  return sendEmail({
    to: staffEmail,
    subject: `Leave Application ${status === 'approved' ? 'Approved' : 'Rejected'} - Kat Secondary School`,
    html: buildEmailHTML('Leave Status', bodyHTML),
  });
};

// ─── Verify Email ─────────────────────────────
const sendVerificationEmail = async (user, verificationUrl) => {
  const bodyHTML = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Verify Your Email Address</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Dear <strong>${user.firstName} ${user.fatherName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Please verify your email address by clicking the button below.
      This link expires in <strong>24 hours</strong>.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${verificationUrl}"
        style="background-color:#22c55e;color:#ffffff;padding:12px 28px;border-radius:6px;
        text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="color:#64748b;font-size:13px;">
      If the button doesn't work, copy and paste:<br/>
      <a href="${verificationUrl}" style="color:#4f46e5;word-break:break-all;">${verificationUrl}</a>
    </p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - Kat Secondary School',
    html: buildEmailHTML('Email Verification', bodyHTML),
  });
};

// ─── Test Email Connection ─────────────────────
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.info('✅ Email service connected');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  buildEmailHTML,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendReceiptEmail,
  sendAbsenceAlertEmail,
  sendLeaveStatusEmail,
  sendVerificationEmail,
  testEmailConnection,
};
