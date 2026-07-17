// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// PAYMENT RECEIPT MODEL
// kat-school/server/src/models/PaymentReceipt.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema(
  {
    // ─── Receipt Number ───────────────────────
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ─── Payment Reference ────────────────────
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeePayment',
      required: [true, 'Payment reference is required'],
      index: true,
    },

    // ─── Student Snapshot ─────────────────────
    studentSnapshot: {
      studentId: { type: String, trim: true },
      firstName: { type: String, trim: true },
      fatherName: { type: String, trim: true },
      grandFatherName: { type: String, trim: true },
      grade: { type: String, trim: true },
      section: { type: String, trim: true },
      photo: { url: { type: String } },
    },

    // ─── School Snapshot ──────────────────────
    schoolSnapshot: {
      name: {
        type: String,
        trim: true,
        default: 'Kat Secondary School',
      },
      address: {
        type: String,
        trim: true,
        default: 'Addis Ababa, Ethiopia',
      },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      website: { type: String, trim: true },
      logoUrl: { type: String, trim: true },
      motto: { type: String, trim: true },
    },

    // ─── Payment Snapshot ─────────────────────
    paymentSnapshot: {
      feeTypeName: { type: String, trim: true },
      feeTypeCode: { type: String, trim: true },
      academicYearName: { type: String, trim: true },
      termName: { type: String, trim: true },
      totalFeeAmount: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      discountDetails: [
        {
          discountName: { type: String, trim: true },
          discountCode: { type: String, trim: true },
          amount: { type: Number, default: 0 },
        },
      ],
      netAmount: { type: Number, default: 0 },
      amountPaid: { type: Number, default: 0 },
      previousAmountPaid: {
        type: Number,
        default: 0,
      },
      totalAmountPaid: { type: Number, default: 0 },
      remainingBalance: { type: Number, default: 0 },
      paymentMethod: { type: String, trim: true },
      transactionReference: {
        type: String,
        trim: true,
        default: null,
      },
      paymentDate: { type: Date },
      paidByName: { type: String, trim: true },
      paidByRelationship: {
        type: String,
        trim: true,
      },
      collectedByName: { type: String, trim: true },
    },

    // ─── PDF ─────────────────────────────────
    pdfUrl: {
      type: String,
      default: null,
    },

    pdfPublicId: {
      type: String,
      default: null,
    },

    pdfGeneratedAt: {
      type: Date,
      default: null,
    },

    // ─── Print History ────────────────────────
    printCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastPrintedAt: {
      type: Date,
      default: null,
    },

    lastPrintedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Email History ────────────────────────
    emailSentCount: {
      type: Number,
      default: 0,
    },

    lastEmailSentAt: {
      type: Date,
      default: null,
    },

    emailSentTo: {
      type: [String],
      default: [],
    },

    // ─── Status ──────────────────────────────
    isVoid: {
      type: Boolean,
      default: false,
      index: true,
    },

    voidedAt: {
      type: Date,
      default: null,
    },

    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    voidReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // ─── Audit ───────────────────────────────
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────
paymentReceiptSchema.index(
  { receiptNumber: 1 },
  { unique: true }
);
paymentReceiptSchema.index({ payment: 1 });
paymentReceiptSchema.index({ isVoid: 1 });
paymentReceiptSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Student full name
paymentReceiptSchema.virtual('studentFullName').get(
  function () {
    if (!this.studentSnapshot) return '';
    return [
      this.studentSnapshot.firstName,
      this.studentSnapshot.fatherName,
      this.studentSnapshot.grandFatherName,
    ]
      .filter(Boolean)
      .join(' ');
  }
);

// Is PDF ready
paymentReceiptSchema.virtual('isPDFReady').get(
  function () {
    return !!this.pdfUrl;
  }
);

// ─── Static Methods ───────────────────────────

// Create receipt from payment
paymentReceiptSchema.statics.createFromPayment =
  async function (payment, generatedBy) {
    const Student = mongoose.model('Student');
    const Settings = mongoose.model('Settings');

    // Get student
    const student = await Student.findById(
      payment.student
    ).select(
      'firstName fatherName grandFatherName studentId grade photo'
    );

    // Get school settings
    const settings = await Settings.findOne().select(
      'schoolName schoolAddress schoolPhone schoolEmail schoolWebsite schoolMotto logoUrl'
    );

    // Get discount details from assignment
    const FeeAssignment =
      mongoose.model('FeeAssignment');
    const assignment = await FeeAssignment.findById(
      payment.feeAssignment
    ).populate('discounts.discount', 'name code');

    const discountDetails = assignment
      ? assignment.discounts.map((d) => ({
          discountName:
            d.discountName || d.discount?.name,
          discountCode:
            d.discountCode || d.discount?.code,
          amount: d.discountAmount,
        }))
      : [];

    const receiptData = {
      receiptNumber: payment.receiptNumber,
      payment: payment._id,
      studentSnapshot: {
        studentId: student?.studentId || payment.studentId,
        firstName: student?.firstName,
        fatherName: student?.fatherName,
        grandFatherName: student?.grandFatherName,
        grade: payment.grade,
        section: payment.sectionName,
        photo: student?.photo,
      },
      schoolSnapshot: {
        name:
          settings?.schoolName ||
          'Kat Secondary School',
        address:
          settings?.schoolAddress ||
          'Addis Ababa, Ethiopia',
        phone: settings?.schoolPhone || '',
        email: settings?.schoolEmail || '',
        website: settings?.schoolWebsite || '',
        logoUrl: settings?.logoUrl || '',
        motto: settings?.schoolMotto || '',
      },
      paymentSnapshot: {
        feeTypeName: payment.feeTypeName,
        feeTypeCode: payment.feeTypeCode,
        academicYearName: payment.academicYearName,
        termName: payment.termName,
        totalFeeAmount: payment.totalFeeAmount,
        discountAmount: payment.discountAmount,
        discountDetails,
        netAmount: payment.netAmount,
        amountPaid: payment.amount,
        previousAmountPaid: payment.previousAmountPaid,
        totalAmountPaid: payment.totalAmountPaid,
        remainingBalance: payment.remainingBalance,
        paymentMethod: payment.method,
        transactionReference:
          payment.transactionReference,
        paymentDate: payment.paymentDate,
        paidByName: payment.paidBy?.name,
        paidByRelationship:
          payment.paidBy?.relationship,
        collectedByName: payment.collectedByName,
      },
      generatedBy,
      createdBy: generatedBy,
    };

    return this.findOneAndUpdate(
      { receiptNumber: payment.receiptNumber },
      { $setOnInsert: receiptData },
      { upsert: true, new: true }
    );
  };

// Find by receipt number
paymentReceiptSchema.statics.findByReceiptNumber =
  function (receiptNumber) {
    return this.findOne({
      receiptNumber: receiptNumber.toUpperCase(),
      isVoid: false,
    });
  };

// Get receipts for a student
paymentReceiptSchema.statics.getForStudent =
  function (studentId) {
    return this.find({
      'studentSnapshot.studentId': studentId,
      isVoid: false,
    })
      .sort({ createdAt: -1 })
      .populate('payment', 'paymentDate amount method');
  };

// Save PDF
paymentReceiptSchema.statics.savePDF =
  async function (receiptId, pdfUrl, publicId) {
    return this.findByIdAndUpdate(
      receiptId,
      {
        pdfUrl,
        pdfPublicId: publicId,
        pdfGeneratedAt: new Date(),
      },
      { new: true }
    );
  };

// Void a receipt
paymentReceiptSchema.statics.voidReceipt =
  async function (receiptId, voidedBy, reason) {
    return this.findByIdAndUpdate(
      receiptId,
      {
        isVoid: true,
        voidedAt: new Date(),
        voidedBy,
        voidReason: reason,
      },
      { new: true }
    );
  };

// ─── Instance Methods ─────────────────────────

// Record a print
paymentReceiptSchema.methods.recordPrint =
  async function (printedBy) {
    this.printCount += 1;
    this.lastPrintedAt = new Date();
    this.lastPrintedBy = printedBy;
    await this.save({ validateBeforeSave: false });
    return this;
  };

// Record email sent
paymentReceiptSchema.methods.recordEmailSent =
  async function (emailAddress) {
    this.emailSentCount += 1;
    this.lastEmailSentAt = new Date();
    if (!this.emailSentTo.includes(emailAddress)) {
      this.emailSentTo.push(emailAddress);
    }
    await this.save({ validateBeforeSave: false });
    return this;
  };

// Get print-ready data
paymentReceiptSchema.methods.getPrintData =
  function () {
    return {
      receiptNumber: this.receiptNumber,
      school: this.schoolSnapshot,
      student: {
        ...this.studentSnapshot,
        fullName: this.studentFullName,
      },
      payment: this.paymentSnapshot,
      generatedAt: this.createdAt,
      printCount: this.printCount,
    };
  };

// ─── Create Model ─────────────────────────────
const PaymentReceipt = mongoose.model(
  'PaymentReceipt',
  paymentReceiptSchema
);

module.exports = PaymentReceipt;