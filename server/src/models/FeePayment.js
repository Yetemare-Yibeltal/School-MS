// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FEE PAYMENT MODEL
// kat-school/server/src/models/FeePayment.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  GRADE_NAMES,
} = require('../config/constants');

const feePaymentSchema = new mongoose.Schema(
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

    // ─── Student ──────────────────────────────
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
      index: true,
    },

    studentName: {
      type: String,
      trim: true,
    },

    studentId: {
      type: String,
      trim: true,
      index: true,
    },

    grade: {
      type: String,
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      index: true,
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },

    sectionName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Fee Assignment Reference ─────────────
    feeAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeAssignment',
      required: [true, 'Fee assignment is required'],
      index: true,
    },

    // ─── Fee Type Reference ───────────────────
    feeType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeType',
      required: [true, 'Fee type is required'],
      index: true,
    },

    feeTypeName: {
      type: String,
      trim: true,
    },

    feeTypeCode: {
      type: String,
      trim: true,
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
      index: true,
    },

    academicYearName: {
      type: String,
      trim: true,
    },

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      default: null,
    },

    termName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Payment Amount ───────────────────────
    // Total fee amount (original)
    totalFeeAmount: {
      type: Number,
      required: [true, 'Total fee amount is required'],
      min: 0,
    },

    // Discount amount applied
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Net amount due after discount
    netAmount: {
      type: Number,
      required: [true, 'Net amount is required'],
      min: 0,
    },

    // Amount being paid in this transaction
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be at least 1'],
    },

    // Previous amount paid before this payment
    previousAmountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total amount paid after this payment
    totalAmountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Remaining balance after this payment
    remainingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Late penalty amount
    penaltyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Payment Method ───────────────────────
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: PAYMENT_METHODS,
        message: '{VALUE} is not a valid payment method',
      },
      index: true,
    },

    // ─── Transaction Details ──────────────────
    // Transaction reference number
    transactionReference: {
      type: String,
      trim: true,
      default: null,
    },

    // Bank name for bank transfer
    bankName: {
      type: String,
      trim: true,
      default: null,
    },

    // Cheque number
    chequeNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // Telebirr/CBE transaction ID
    mobileTransactionId: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Payment Date ─────────────────────────
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
      index: true,
    },

    // ─── Payment Status ───────────────────────
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: [
          'completed',
          'pending',
          'failed',
          'cancelled',
          'refunded',
        ],
        message: '{VALUE} is not a valid status',
      },
      default: 'completed',
      index: true,
    },

    // ─── Installment ─────────────────────────
    isInstallment: {
      type: Boolean,
      default: false,
    },

    installmentNumber: {
      type: Number,
      default: null,
    },

    // ─── Paid By ─────────────────────────────
    // Who made the payment
    paidBy: {
      name: {
        type: String,
        required: [true, 'Payer name is required'],
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
        default: 'Parent/Guardian',
      },
      phone: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // Guardian reference if parent paid
    guardian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guardian',
      default: null,
    },

    // ─── Collected By ─────────────────────────
    // School staff who collected payment
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Collector is required'],
    },

    collectedByName: {
      type: String,
      trim: true,
    },

    // ─── Receipt ─────────────────────────────
    // Whether receipt was printed
    receiptPrinted: {
      type: Boolean,
      default: false,
    },

    receiptPrintedAt: {
      type: Date,
      default: null,
    },

    // Receipt PDF URL if generated
    receiptPdfUrl: {
      type: String,
      default: null,
    },

    receiptPdfPublicId: {
      type: String,
      default: null,
    },

    // Whether email receipt was sent
    emailReceiptSent: {
      type: Boolean,
      default: false,
    },

    emailReceiptSentAt: {
      type: Date,
      default: null,
    },

    // ─── Refund ──────────────────────────────
    isRefunded: {
      type: Boolean,
      default: false,
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundDate: {
      type: Date,
      default: null,
    },

    refundReason: {
      type: String,
      trim: true,
      default: null,
    },

    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Reference to refund payment record
    refundPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeePayment',
      default: null,
    },

    // ─── Verification ─────────────────────────
    isVerified: {
      type: Boolean,
      default: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'Notes cannot exceed 500 characters',
      ],
    },

    // ─── Audit ───────────────────────────────
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
feePaymentSchema.index(
  { receiptNumber: 1 },
  { unique: true }
);
feePaymentSchema.index({
  student: 1,
  academicYear: 1,
});
feePaymentSchema.index({
  feeAssignment: 1,
  status: 1,
});
feePaymentSchema.index({
  paymentDate: -1,
  status: 1,
});
feePaymentSchema.index({
  academicYear: 1,
  paymentDate: -1,
});
feePaymentSchema.index({ method: 1 });
feePaymentSchema.index({ collectedBy: 1 });
feePaymentSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Is full payment
feePaymentSchema.virtual('isFullPayment').get(
  function () {
    return this.remainingBalance <= 0;
  }
);

// Payment date formatted
feePaymentSchema.virtual('formattedDate').get(
  function () {
    if (!this.paymentDate) return '';
    return new Date(
      this.paymentDate
    ).toLocaleDateString('en-ET', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
);

// Formatted amount
feePaymentSchema.virtual('formattedAmount').get(
  function () {
    return `ETB ${this.amount.toLocaleString()}`;
  }
);

// ─── Pre-Save Hook ────────────────────────────
// Auto-generate receipt number
feePaymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.receiptNumber) {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(
        today.getMonth() + 1
      ).padStart(2, '0');
      const day = String(today.getDate()).padStart(
        2,
        '0'
      );

      // Count today's payments for sequential number
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const count = await mongoose
        .model('FeePayment')
        .countDocuments({
          createdAt: { $gte: todayStart },
        });

      const sequence = String(count + 1).padStart(
        4,
        '0'
      );
      this.receiptNumber = `RCP-${year}${month}${day}-${sequence}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Auto-calculate total paid and balance
  if (
    this.isModified('amount') ||
    this.isModified('previousAmountPaid')
  ) {
    this.totalAmountPaid =
      (this.previousAmountPaid || 0) +
      (this.amount || 0);
    this.remainingBalance = Math.max(
      0,
      this.netAmount - this.totalAmountPaid
    );
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Generate receipt number manually
feePaymentSchema.statics.generateReceiptNumber =
  async function () {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');
    const day = String(today.getDate()).padStart(
      2,
      '0'
    );

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.countDocuments({
      createdAt: { $gte: todayStart },
    });

    const sequence = String(count + 1).padStart(
      4,
      '0'
    );
    return `RCP-${year}${month}${day}-${sequence}`;
  };

// Get payments for a student
feePaymentSchema.statics.getForStudent =
  function (studentId, academicYearId) {
    return this.find({
      student: studentId,
      academicYear: academicYearId,
      status: 'completed',
    })
      .sort({ paymentDate: -1 })
      .populate('feeType', 'name code color')
      .populate(
        'collectedBy',
        'firstName fatherName'
      );
  };

// Get payments for a fee assignment
feePaymentSchema.statics.getForAssignment =
  function (assignmentId) {
    return this.find({
      feeAssignment: assignmentId,
      status: 'completed',
    })
      .sort({ paymentDate: -1 })
      .populate(
        'collectedBy',
        'firstName fatherName'
      );
  };

// Get today's payments
feePaymentSchema.statics.getTodayPayments =
  function (academicYearId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.find({
      academicYear: academicYearId,
      paymentDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: 'completed',
    })
      .sort({ paymentDate: -1 })
      .populate(
        'student',
        'firstName fatherName studentId'
      )
      .populate('feeType', 'name code')
      .populate(
        'collectedBy',
        'firstName fatherName'
      );
  };

// Get payments by date range
feePaymentSchema.statics.getByDateRange =
  function (
    startDate,
    endDate,
    academicYearId,
    filters = {}
  ) {
    return this.find({
      academicYear: academicYearId,
      paymentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'completed',
      ...filters,
    })
      .sort({ paymentDate: -1 })
      .populate(
        'student',
        'firstName fatherName studentId grade'
      )
      .populate('feeType', 'name code')
      .populate(
        'collectedBy',
        'firstName fatherName'
      );
  };

// Get payment summary by method
feePaymentSchema.statics.getSummaryByMethod =
  async function (
    academicYearId,
    startDate = null,
    endDate = null
  ) {
    const match = {
      academicYear: new mongoose.Types.ObjectId(
        academicYearId
      ),
      status: 'completed',
    };

    if (startDate || endDate) {
      match.paymentDate = {};
      if (startDate)
        match.paymentDate.$gte = new Date(startDate);
      if (endDate)
        match.paymentDate.$lte = new Date(endDate);
    }

    return this.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);
  };

// Get daily collection totals
feePaymentSchema.statics.getDailyCollections =
  async function (
    academicYearId,
    month,
    year
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(
            academicYearId
          ),
          paymentDate: {
            $gte: startDate,
            $lte: endDate,
          },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$paymentDate' },
            month: { $month: '$paymentDate' },
            year: { $year: '$paymentDate' },
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);
  };

// Get monthly collection summary
feePaymentSchema.statics.getMonthlyCollections =
  async function (academicYearId) {
    return this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(
            academicYearId
          ),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$paymentDate' },
            year: { $year: '$paymentDate' },
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          uniqueStudents: {
            $addToSet: '$student',
          },
        },
      },
      {
        $addFields: {
          uniqueStudentCount: {
            $size: '$uniqueStudents',
          },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);
  };

// Get payments by collector (cashier report)
feePaymentSchema.statics.getByCollector =
  async function (
    collectorId,
    startDate,
    endDate
  ) {
    return this.aggregate([
      {
        $match: {
          collectedBy: new mongoose.Types.ObjectId(
            collectorId
          ),
          paymentDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);
  };

// Get payment trend for AI analysis
feePaymentSchema.statics.getStudentPaymentTrend =
  async function (studentId, academicYearId) {
    return this.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(
            studentId
          ),
          academicYear: new mongoose.Types.ObjectId(
            academicYearId
          ),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$paymentDate' },
            year: { $year: '$paymentDate' },
          },
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
          methods: { $addToSet: '$method' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  };

// Get dashboard stats
feePaymentSchema.statics.getDashboardStats =
  async function (academicYearId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const [
      todayStats,
      monthStats,
      yearStats,
      byMethod,
    ] = await Promise.all([
      this.aggregate([
        {
          $match: {
            academicYear: new mongoose.Types.ObjectId(
              academicYearId
            ),
            paymentDate: {
              $gte: today,
              $lt: tomorrow,
            },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.aggregate([
        {
          $match: {
            academicYear: new mongoose.Types.ObjectId(
              academicYearId
            ),
            paymentDate: { $gte: thisMonth },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.aggregate([
        {
          $match: {
            academicYear: new mongoose.Types.ObjectId(
              academicYearId
            ),
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.aggregate([
        {
          $match: {
            academicYear: new mongoose.Types.ObjectId(
              academicYearId
            ),
            status: 'completed',
          },
        },
        {
          $group: {
            _id: '$method',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    return {
      today: todayStats[0] || { total: 0, count: 0 },
      month: monthStats[0] || { total: 0, count: 0 },
      year: yearStats[0] || { total: 0, count: 0 },
      byMethod,
    };
  };

// ─── Instance Methods ─────────────────────────

// Mark receipt as printed
feePaymentSchema.methods.markReceiptPrinted =
  async function () {
    this.receiptPrinted = true;
    this.receiptPrintedAt = new Date();
    await this.save({ validateBeforeSave: false });
    return this;
  };

// Mark email receipt as sent
feePaymentSchema.methods.markEmailSent =
  async function () {
    this.emailReceiptSent = true;
    this.emailReceiptSentAt = new Date();
    await this.save({ validateBeforeSave: false });
    return this;
  };

// Process refund
feePaymentSchema.methods.processRefund =
  async function (amount, reason, refundedBy) {
    this.isRefunded = true;
    this.refundAmount = amount || this.amount;
    this.refundDate = new Date();
    this.refundReason = reason;
    this.refundedBy = refundedBy;
    this.status = 'refunded';
    await this.save();
    return this;
  };

// Save receipt PDF
feePaymentSchema.methods.saveReceiptPDF =
  async function (pdfUrl, publicId) {
    this.receiptPdfUrl = pdfUrl;
    this.receiptPdfPublicId = publicId;
    await this.save({ validateBeforeSave: false });
    return this;
  };

// Get receipt data for printing
feePaymentSchema.methods.getReceiptData =
  function () {
    return {
      receiptNumber: this.receiptNumber,
      student: {
        name: this.studentName,
        id: this.studentId,
        grade: this.grade,
        section: this.sectionName,
      },
      payment: {
        amount: this.amount,
        method: this.method,
        date: this.formattedDate,
        transactionRef: this.transactionReference,
        feeType: this.feeTypeName,
        academicYear: this.academicYearName,
        term: this.termName,
      },
      paidBy: this.paidBy,
      collectedBy: this.collectedByName,
      totals: {
        totalFee: this.totalFeeAmount,
        discount: this.discountAmount,
        netAmount: this.netAmount,
        amountPaid: this.amount,
        totalPaid: this.totalAmountPaid,
        balance: this.remainingBalance,
      },
    };
  };

// ─── Create Model ─────────────────────────────
const FeePayment = mongoose.model(
  'FeePayment',
  feePaymentSchema
);

module.exports = FeePayment;