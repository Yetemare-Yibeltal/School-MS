// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// BOOK ISSUE MODEL
// kat-school/server/src/models/BookIssue.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema(
  {
    // ─── Issue Identity ───────────────────────
    issueNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ─── Book Reference ───────────────────────
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      index: true,
    },

    // Cached book info
    bookTitle: {
      type: String,
      trim: true,
    },

    bookAccessionNumber: {
      type: String,
      trim: true,
    },

    bookCopyNumber: {
      type: String,
      trim: true,
      default: null,
    },

    bookISBN: {
      type: String,
      trim: true,
      default: null,
    },

    bookCategory: {
      type: String,
      trim: true,
    },

    bookAuthor: {
      type: String,
      trim: true,
    },

    // ─── Member Reference ─────────────────────
    libraryMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMember',
      required: [true, 'Library member is required'],
      index: true,
    },

    // Cached member info
    memberName: {
      type: String,
      trim: true,
    },

    membershipId: {
      type: String,
      trim: true,
    },

    memberType: {
      type: String,
      enum: ['student', 'teacher', 'employee'],
      index: true,
    },

    memberId: {
      type: String,
      trim: true,
    },

    memberGrade: {
      type: String,
      trim: true,
      default: null,
    },

    memberSection: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Dates ───────────────────────────────
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
      index: true,
    },

    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },

    returnDate: {
      type: Date,
      default: null,
      index: true,
    },

    // ─── Status ──────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['issued', 'returned', 'overdue', 'lost', 'damaged', 'renewed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'issued',
      index: true,
    },

    // ─── Renewal ─────────────────────────────
    isRenewed: {
      type: Boolean,
      default: false,
    },

    renewalCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxRenewals: {
      type: Number,
      default: 1,
    },

    lastRenewedAt: {
      type: Date,
      default: null,
    },

    // Original due date before renewals
    originalDueDate: {
      type: Date,
      default: null,
    },

    // ─── Return Details ───────────────────────
    returnCondition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged', 'Lost', ''],
      default: '',
    },

    returnRemarks: {
      type: String,
      trim: true,
      default: null,
    },

    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    returnedToName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Fine Calculation ─────────────────────
    // Whether this issue is overdue
    isOverdue: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Days overdue at time of return
    daysOverdue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Fine per day rate (from book settings)
    finePerDay: {
      type: Number,
      default: 2,
      min: 0,
    },

    // Total fine amount
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Whether fine was waived
    fineWaived: {
      type: Boolean,
      default: false,
    },

    fineWaivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    fineWaivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    fineWaivedReason: {
      type: String,
      trim: true,
      default: null,
    },

    // Whether fine was paid
    finePaid: {
      type: Boolean,
      default: false,
    },

    finePaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    finePaidAt: {
      type: Date,
      default: null,
    },

    finePaidBy: {
      type: String,
      trim: true,
      default: null,
    },

    // Outstanding fine remaining
    outstandingFine: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Notifications ────────────────────────
    reminderSent: {
      type: Boolean,
      default: false,
    },

    reminderSentAt: {
      type: Date,
      default: null,
    },

    reminderCount: {
      type: Number,
      default: 0,
    },

    overdueNoticeSent: {
      type: Boolean,
      default: false,
    },

    overdueNoticeSentAt: {
      type: Date,
      default: null,
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
      index: true,
    },

    academicYearName: {
      type: String,
      trim: true,
      default: null,
    },

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      default: null,
    },

    // ─── Issued By ───────────────────────────
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issued by is required'],
    },

    issuedByName: {
      type: String,
      trim: true,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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
bookIssueSchema.index({
  book: 1,
  status: 1,
});
bookIssueSchema.index({
  libraryMember: 1,
  status: 1,
});
bookIssueSchema.index({
  dueDate: 1,
  status: 1,
});
bookIssueSchema.index({
  issueDate: -1,
  status: 1,
});
bookIssueSchema.index({
  academicYear: 1,
  status: 1,
});
bookIssueSchema.index({ isOverdue: 1, status: 1 });
bookIssueSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Days since issued
bookIssueSchema.virtual('daysSinceIssued').get(function () {
  const end = this.returnDate || new Date();
  return Math.floor((new Date(end) - new Date(this.issueDate)) / (1000 * 60 * 60 * 24));
});

// Current days overdue (for active issues)
bookIssueSchema.virtual('currentDaysOverdue').get(function () {
  if (this.status === 'returned') return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  if (now <= due) return 0;
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
});

// Current fine (for active overdue issues)
bookIssueSchema.virtual('currentFine').get(function () {
  return this.currentDaysOverdue * (this.finePerDay || 2);
});

// Is currently overdue
bookIssueSchema.virtual('isCurrentlyOverdue').get(function () {
  if (this.status === 'returned' || this.status === 'lost') return false;
  return new Date(this.dueDate) < new Date();
});

// Days remaining until due
bookIssueSchema.virtual('daysUntilDue').get(function () {
  if (this.status !== 'issued') return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  if (due <= now) return 0;
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
});

// ─── Pre-Save Hook ────────────────────────────
bookIssueSchema.pre('save', async function (next) {
  // Auto-generate issue number
  if (this.isNew && !this.issueNumber) {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      const count = await mongoose.model('BookIssue').countDocuments({
        createdAt: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      });

      const sequence = String(count + 1).padStart(4, '0');
      this.issueNumber = `BKI-${year}${month}${day}-${sequence}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Store original due date
  if (this.isNew && !this.originalDueDate) {
    this.originalDueDate = this.dueDate;
  }

  // Auto-update overdue status
  if (this.status === 'issued' && new Date(this.dueDate) < new Date()) {
    this.isOverdue = true;
    this.status = 'overdue';
  }

  // Calculate outstanding fine
  if (
    this.isModified('fineAmount') ||
    this.isModified('finePaidAmount') ||
    this.isModified('fineWaivedAmount')
  ) {
    this.outstandingFine = Math.max(
      0,
      this.fineAmount - (this.finePaidAmount || 0) - (this.fineWaivedAmount || 0)
    );
    this.finePaid = this.outstandingFine <= 0;
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Issue a book to a member
bookIssueSchema.statics.issueBook = async function ({
  bookId,
  bookTitle,
  bookAccessionNumber,
  bookCopyNumber,
  bookISBN,
  bookCategory,
  bookAuthor,
  libraryMemberId,
  memberName,
  membershipId,
  memberType,
  memberId,
  memberGrade,
  memberSection,
  loanDays,
  finePerDay,
  academicYearId,
  academicYearName,
  termId,
  issuedBy,
  issuedByName,
  notes,
}) {
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + (loanDays || 14));

  const issue = await this.create({
    book: bookId,
    bookTitle,
    bookAccessionNumber,
    bookCopyNumber,
    bookISBN,
    bookCategory,
    bookAuthor,
    libraryMember: libraryMemberId,
    memberName,
    membershipId,
    memberType,
    memberId,
    memberGrade,
    memberSection,
    issueDate,
    dueDate,
    originalDueDate: dueDate,
    finePerDay: finePerDay || 2,
    academicYear: academicYearId,
    academicYearName,
    term: termId || null,
    issuedBy,
    issuedByName,
    notes,
    status: 'issued',
    createdBy: issuedBy,
  });

  // Update book copy availability
  const Book = mongoose.model('Book');
  await Book.incrementIssueCount(bookId);

  // Update library member stats
  const LibraryMember = mongoose.model('LibraryMember');
  await LibraryMember.findByIdAndUpdate(libraryMemberId, {
    $inc: {
      currentlyIssuedCount: 1,
      totalBooksIssued: 1,
    },
  });

  return issue;
};

// Return a book
bookIssueSchema.statics.returnBook = async function (
  issueId,
  {
    returnCondition,
    returnRemarks,
    returnedTo,
    returnedToName,
    payFine,
    waiveFine,
    waivedAmount,
    waivedBy,
    waivedReason,
  }
) {
  const issue = await this.findById(issueId);
  if (!issue) throw new Error('Issue not found');
  if (issue.status === 'returned') {
    throw new Error('Book already returned');
  }

  const returnDate = new Date();

  // Calculate overdue and fine
  const daysOverdue = Math.max(
    0,
    Math.floor((returnDate - new Date(issue.dueDate)) / (1000 * 60 * 60 * 24))
  );

  const fineAmount = daysOverdue * (issue.finePerDay || 2);

  issue.returnDate = returnDate;
  issue.status = 'returned';
  issue.returnCondition = returnCondition || 'Good';
  issue.returnRemarks = returnRemarks || null;
  issue.returnedTo = returnedTo;
  issue.returnedToName = returnedToName;
  issue.daysOverdue = daysOverdue;
  issue.isOverdue = daysOverdue > 0;
  issue.fineAmount = fineAmount;

  // Handle fine waiver
  if (waiveFine && waivedAmount > 0) {
    issue.fineWaived = true;
    issue.fineWaivedAmount = Math.min(waivedAmount, fineAmount);
    issue.fineWaivedBy = waivedBy;
    issue.fineWaivedReason = waivedReason;
  }

  // Handle fine payment
  if (payFine && fineAmount > 0) {
    const netFine = fineAmount - (issue.fineWaivedAmount || 0);
    issue.finePaidAmount = netFine;
    issue.finePaid = true;
    issue.finePaidAt = new Date();
  }

  issue.outstandingFine = Math.max(
    0,
    fineAmount - (issue.finePaidAmount || 0) - (issue.fineWaivedAmount || 0)
  );

  await issue.save();

  // Update book availability
  const Book = mongoose.model('Book');
  await Book.decrementIssueCount(issue.book);
  if (returnCondition === 'Lost' || returnCondition === 'Damaged') {
    await Book.findByIdAndUpdate(issue.book, {
      $inc: { lostDamagedCopies: 1 },
    });
  }

  // Update library member stats
  const LibraryMember = mongoose.model('LibraryMember');
  const member = await LibraryMember.findById(issue.libraryMember);

  if (member) {
    await member.recordReturn(daysOverdue > 0);
    if (issue.outstandingFine > 0) {
      await member.addFine(issue.outstandingFine);
    }
  }

  return issue;
};

// Get all issued books (not returned)
bookIssueSchema.statics.getIssued = function (filters = {}) {
  return this.find({
    status: { $in: ['issued', 'overdue'] },
    ...filters,
  })
    .sort({ dueDate: 1 })
    .populate('book', 'title accessionNumber coverImage')
    .populate('libraryMember', 'memberName membershipId memberType');
};

// Get overdue books
bookIssueSchema.statics.getOverdue = function (filters = {}) {
  return this.find({
    status: { $in: ['issued', 'overdue'] },
    dueDate: { $lt: new Date() },
    ...filters,
  })
    .sort({ dueDate: 1 })
    .populate('book', 'title accessionNumber coverImage')
    .populate('libraryMember', 'memberName membershipId memberPhoto');
};

// Get issues for a specific member
bookIssueSchema.statics.getForMember = function (libraryMemberId, filters = {}) {
  return this.find({
    libraryMember: libraryMemberId,
    ...filters,
  })
    .sort({ issueDate: -1 })
    .populate('book', 'title accessionNumber coverImage authors');
};

// Get issues for a specific book
bookIssueSchema.statics.getForBook = function (bookId) {
  return this.find({ book: bookId })
    .sort({ issueDate: -1 })
    .populate('libraryMember', 'memberName membershipId memberType');
};

// Get today's issues
bookIssueSchema.statics.getTodayIssues = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    issueDate: {
      $gte: today,
      $lt: tomorrow,
    },
  })
    .sort({ issueDate: -1 })
    .populate('book', 'title accessionNumber')
    .populate('libraryMember', 'memberName membershipId');
};

// Get today's returns
bookIssueSchema.statics.getTodayReturns = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    returnDate: {
      $gte: today,
      $lt: tomorrow,
    },
    status: 'returned',
  })
    .sort({ returnDate: -1 })
    .populate('book', 'title accessionNumber')
    .populate('libraryMember', 'memberName membershipId');
};

// Get issues due today or tomorrow (for reminders)
bookIssueSchema.statics.getDueSoon = function (daysAhead = 2) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    status: 'issued',
    dueDate: {
      $gte: today,
      $lte: futureDate,
    },
  })
    .populate('book', 'title accessionNumber')
    .populate('libraryMember', 'memberName membershipId memberType memberId');
};

// Renew a book issue
bookIssueSchema.statics.renewBook = async function (issueId, additionalDays, renewedBy) {
  const issue = await this.findById(issueId);
  if (!issue) throw new Error('Issue not found');

  if (issue.renewalCount >= issue.maxRenewals) {
    throw new Error(`Maximum renewals (${issue.maxRenewals}) reached`);
  }

  if (issue.isOverdue) {
    throw new Error('Cannot renew overdue books');
  }

  const newDueDate = new Date(issue.dueDate);
  newDueDate.setDate(newDueDate.getDate() + (additionalDays || 7));

  issue.dueDate = newDueDate;
  issue.isRenewed = true;
  issue.renewalCount += 1;
  issue.lastRenewedAt = new Date();
  issue.status = 'renewed';
  issue.updatedBy = renewedBy;

  await issue.save();
  return issue;
};

// Mark issues as overdue (batch update)
bookIssueSchema.statics.markOverdueIssues = async function () {
  const now = new Date();

  const result = await this.updateMany(
    {
      status: 'issued',
      dueDate: { $lt: now },
    },
    {
      status: 'overdue',
      isOverdue: true,
    }
  );

  return result;
};

// Get issue stats for academic year
bookIssueSchema.statics.getStats = async function (academicYearId) {
  return this.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalFines: { $sum: '$fineAmount' },
        totalFinesPaid: {
          $sum: '$finePaidAmount',
        },
      },
    },
  ]);
};

// Get dashboard stats
bookIssueSchema.statics.getDashboardStats = async function (academicYearId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalIssued, overdue, todayIssues, todayReturns, fineStats] = await Promise.all([
    this.countDocuments({
      academicYear: academicYearId,
      status: { $in: ['issued', 'overdue'] },
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'overdue',
    }),
    this.countDocuments({
      issueDate: {
        $gte: today,
        $lt: tomorrow,
      },
    }),
    this.countDocuments({
      returnDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: 'returned',
    }),
    this.aggregate([
      {
        $match: {
          academicYear: new mongoose.Types.ObjectId(academicYearId),
          fineAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalFines: { $sum: '$fineAmount' },
          totalPaid: {
            $sum: '$finePaidAmount',
          },
          totalOutstanding: {
            $sum: '$outstandingFine',
          },
        },
      },
    ]),
  ]);

  return {
    totalIssued,
    overdue,
    todayIssues,
    todayReturns,
    fines: fineStats[0] || {
      totalFines: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    },
  };
};

// ─── Instance Methods ─────────────────────────

// Calculate current fine
bookIssueSchema.methods.calculateCurrentFine = function () {
  const daysOver = this.currentDaysOverdue;
  return daysOver * (this.finePerDay || 2);
};

// Mark reminder sent
bookIssueSchema.methods.markReminderSent = async function () {
  this.reminderSent = true;
  this.reminderSentAt = new Date();
  this.reminderCount += 1;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Mark overdue notice sent
bookIssueSchema.methods.markOverdueNoticeSent = async function () {
  this.overdueNoticeSent = true;
  this.overdueNoticeSentAt = new Date();
  await this.save({ validateBeforeSave: false });
  return this;
};

// Pay fine
bookIssueSchema.methods.payIssueFine = async function (amount, paidBy) {
  const actualPaid = Math.min(amount, this.outstandingFine);
  this.finePaidAmount += actualPaid;
  this.finePaidAt = new Date();
  this.finePaidBy = paidBy;
  this.outstandingFine = Math.max(0, this.outstandingFine - actualPaid);
  this.finePaid = this.outstandingFine <= 0;
  await this.save();
  return this;
};

// Waive fine
bookIssueSchema.methods.waiveIssueFine = async function (amount, waivedBy, reason) {
  this.fineWaived = true;
  this.fineWaivedAmount = Math.min(amount, this.outstandingFine);
  this.fineWaivedBy = waivedBy;
  this.fineWaivedReason = reason;
  this.outstandingFine = Math.max(0, this.outstandingFine - this.fineWaivedAmount);
  await this.save();
  return this;
};

// ─── Create Model ─────────────────────────────
const BookIssue = mongoose.model('BookIssue', bookIssueSchema);

module.exports = BookIssue;
