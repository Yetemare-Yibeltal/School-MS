// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// BOOK RESERVATION MODEL
// kat-school/server/src/models/BookReservation.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const bookReservationSchema = new mongoose.Schema(
  {
    // ─── Reservation Identity ─────────────────
    reservationNumber: {
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

    bookTitle: {
      type: String,
      trim: true,
    },

    bookAccessionNumber: {
      type: String,
      trim: true,
    },

    bookAuthor: {
      type: String,
      trim: true,
    },

    bookCategory: {
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

    // ─── Reservation Dates ────────────────────
    // When reservation was placed
    reservationDate: {
      type: Date,
      required: [true, 'Reservation date is required'],
      default: Date.now,
      index: true,
    },

    // When reservation expires if book is not collected
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },

    // When book became available for this reservation
    availableDate: {
      type: Date,
      default: null,
    },

    // When member was notified
    notifiedDate: {
      type: Date,
      default: null,
    },

    // When reservation was fulfilled (book issued)
    fulfilledDate: {
      type: Date,
      default: null,
    },

    // Linked book issue when fulfilled
    bookIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookIssue',
      default: null,
    },

    // ─── Queue Position ───────────────────────
    // Position in reservation queue for this book
    queuePosition: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ─── Status ──────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending', 'available', 'fulfilled', 'expired', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },

    // ─── Notification ─────────────────────────
    notificationSent: {
      type: Boolean,
      default: false,
    },

    notificationMethod: {
      type: String,
      enum: ['SMS', 'Email', 'Both', 'None', ''],
      default: '',
    },

    // ─── Cancellation ─────────────────────────
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
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

// ─── Compound Indexes ─────────────────────────
// Prevent duplicate reservations
bookReservationSchema.index(
  {
    book: 1,
    libraryMember: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'available'] },
    },
  }
);

bookReservationSchema.index({
  book: 1,
  status: 1,
  queuePosition: 1,
});

bookReservationSchema.index({
  libraryMember: 1,
  status: 1,
});

bookReservationSchema.index({
  expiryDate: 1,
  status: 1,
});

bookReservationSchema.index({
  academicYear: 1,
  status: 1,
});

bookReservationSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Is expired
bookReservationSchema.virtual('isExpired').get(function () {
  if (this.status === 'fulfilled' || this.status === 'cancelled') return false;
  return new Date(this.expiryDate) < new Date();
});

// Days until expiry
bookReservationSchema.virtual('daysUntilExpiry').get(function () {
  if (this.status !== 'available') return null;
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  if (expiry <= now) return 0;
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
});

// Days in queue
bookReservationSchema.virtual('daysInQueue').get(function () {
  const end = this.availableDate || this.fulfilledDate || new Date();
  return Math.floor((new Date(end) - new Date(this.reservationDate)) / (1000 * 60 * 60 * 24));
});

// ─── Pre-Save Hook ────────────────────────────
bookReservationSchema.pre('save', async function (next) {
  // Auto-generate reservation number
  if (this.isNew && !this.reservationNumber) {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      const count = await mongoose.model('BookReservation').countDocuments({
        createdAt: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      });

      const sequence = String(count + 1).padStart(4, '0');
      this.reservationNumber = `RSV-${year}${month}${day}-${sequence}`;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Default expiry date — 7 days from now
  if (this.isNew && !this.expiryDate) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    this.expiryDate = expiry;
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Place a new reservation
bookReservationSchema.statics.placeReservation = async function ({
  bookId,
  bookTitle,
  bookAccessionNumber,
  bookAuthor,
  bookCategory,
  libraryMemberId,
  memberName,
  membershipId,
  memberType,
  memberId,
  memberGrade,
  academicYearId,
  academicYearName,
  createdBy,
  notes,
}) {
  // Check for existing active reservation
  const existing = await this.findOne({
    book: bookId,
    libraryMember: libraryMemberId,
    status: { $in: ['pending', 'available'] },
  });

  if (existing) {
    return {
      success: false,
      message: 'You already have an active reservation for this book',
      reservation: existing,
    };
  }

  // Get queue position
  const queueCount = await this.countDocuments({
    book: bookId,
    status: { $in: ['pending', 'available'] },
  });

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  const reservation = await this.create({
    book: bookId,
    bookTitle,
    bookAccessionNumber,
    bookAuthor,
    bookCategory,
    libraryMember: libraryMemberId,
    memberName,
    membershipId,
    memberType,
    memberId,
    memberGrade,
    queuePosition: queueCount + 1,
    reservationDate: new Date(),
    expiryDate,
    academicYear: academicYearId,
    academicYearName,
    status: 'pending',
    createdBy,
    notes,
  });

  // Update book reservation stats
  const Book = mongoose.model('Book');
  await Book.findByIdAndUpdate(bookId, {
    $inc: { 'stats.totalReservations': 1 },
  });

  return {
    success: true,
    message: `Reservation placed. Queue position: ${queueCount + 1}`,
    reservation,
  };
};

// Notify next member in queue when book is returned
bookReservationSchema.statics.notifyNextInQueue = async function (bookId) {
  const nextReservation = await this.findOne({
    book: bookId,
    status: 'pending',
  })
    .sort({ queuePosition: 1 })
    .populate('libraryMember', 'memberName membershipId');

  if (!nextReservation) return null;

  // Set 3 days collection window
  const collectByDate = new Date();
  collectByDate.setDate(collectByDate.getDate() + 3);

  nextReservation.status = 'available';
  nextReservation.availableDate = new Date();
  nextReservation.expiryDate = collectByDate;
  nextReservation.notificationSent = true;
  nextReservation.notifiedDate = new Date();

  await nextReservation.save();
  return nextReservation;
};

// Fulfill a reservation (when book is issued)
bookReservationSchema.statics.fulfillReservation = async function (reservationId, bookIssueId) {
  const reservation = await this.findById(reservationId);

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  reservation.status = 'fulfilled';
  reservation.fulfilledDate = new Date();
  reservation.bookIssue = bookIssueId;

  await reservation.save();

  // Reorder queue for remaining reservations
  await this.updateMany(
    {
      book: reservation.book,
      status: 'pending',
      queuePosition: {
        $gt: reservation.queuePosition,
      },
    },
    { $inc: { queuePosition: -1 } }
  );

  return reservation;
};

// Cancel a reservation
bookReservationSchema.statics.cancelReservation = async function (
  reservationId,
  cancelledBy,
  reason
) {
  const reservation = await this.findById(reservationId);

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  if (reservation.status === 'fulfilled') {
    throw new Error('Cannot cancel a fulfilled reservation');
  }

  const previousPosition = reservation.queuePosition;
  reservation.status = 'cancelled';
  reservation.cancelledBy = cancelledBy;
  reservation.cancelledAt = new Date();
  reservation.cancellationReason = reason || null;

  await reservation.save();

  // Reorder queue
  await this.updateMany(
    {
      book: reservation.book,
      status: 'pending',
      queuePosition: { $gt: previousPosition },
    },
    { $inc: { queuePosition: -1 } }
  );

  return reservation;
};

// Expire old reservations
bookReservationSchema.statics.expireOldReservations = async function () {
  const now = new Date();

  // Get reservations that expired
  const expired = await this.find({
    status: { $in: ['pending', 'available'] },
    expiryDate: { $lt: now },
  });

  for (const reservation of expired) {
    reservation.status = 'expired';
    await reservation.save();

    // If it was 'available', notify next in queue
    if (reservation.status === 'available' || reservation.availableDate) {
      await this.notifyNextInQueue(reservation.book);
    }
  }

  return expired.length;
};

// Get reservations for a book
bookReservationSchema.statics.getForBook = function (bookId) {
  return this.find({
    book: bookId,
    status: { $in: ['pending', 'available'] },
  })
    .sort({ queuePosition: 1 })
    .populate('libraryMember', 'memberName membershipId memberType memberPhoto');
};

// Get reservations for a member
bookReservationSchema.statics.getForMember = function (libraryMemberId, filters = {}) {
  return this.find({
    libraryMember: libraryMemberId,
    ...filters,
  })
    .sort({ reservationDate: -1 })
    .populate('book', 'title accessionNumber coverImage authors');
};

// Get active reservations
bookReservationSchema.statics.getActive = function () {
  return this.find({
    status: { $in: ['pending', 'available'] },
  })
    .sort({ queuePosition: 1 })
    .populate('book', 'title accessionNumber coverImage')
    .populate('libraryMember', 'memberName membershipId memberType');
};

// Get reservations ready for collection
bookReservationSchema.statics.getReadyForCollection = function () {
  return this.find({
    status: 'available',
    expiryDate: { $gte: new Date() },
  })
    .sort({ expiryDate: 1 })
    .populate('book', 'title accessionNumber coverImage')
    .populate('libraryMember', 'memberName membershipId memberType memberId');
};

// Get dashboard stats
bookReservationSchema.statics.getDashboardStats = async function (academicYearId) {
  const [total, pending, available, fulfilled, expired] = await Promise.all([
    this.countDocuments({
      academicYear: academicYearId,
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'pending',
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'available',
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'fulfilled',
    }),
    this.countDocuments({
      academicYear: academicYearId,
      status: 'expired',
    }),
  ]);

  return {
    total,
    pending,
    available,
    fulfilled,
    expired,
    cancelled: total - pending - available - fulfilled - expired,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if reservation can be cancelled
bookReservationSchema.methods.canCancel = function () {
  return this.status === 'pending' || this.status === 'available';
};

// Check if collection window is expiring soon
bookReservationSchema.methods.isExpiringSoon = function (daysThreshold = 1) {
  if (this.status !== 'available') return false;
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return daysLeft <= daysThreshold && daysLeft > 0;
};

// Mark notification sent
bookReservationSchema.methods.markNotified = async function (method = 'SMS') {
  this.notificationSent = true;
  this.notifiedDate = new Date();
  this.notificationMethod = method;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Get status display
bookReservationSchema.methods.getStatusDisplay = function () {
  const displays = {
    pending: '⏳ In Queue',
    available: '✅ Ready for Collection',
    fulfilled: '📚 Collected',
    expired: '⏰ Expired',
    cancelled: '❌ Cancelled',
  };
  return displays[this.status] || this.status;
};

// ─── Create Model ─────────────────────────────
const BookReservation = mongoose.model('BookReservation', bookReservationSchema);

module.exports = BookReservation;
