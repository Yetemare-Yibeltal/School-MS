// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// BOOK MODEL
// kat-school/server/src/models/Book.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    // ─── Book Identity ────────────────────────
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
      index: true,
    },

    // ISBN-10 or ISBN-13
    isbn: {
      type: String,
      trim: true,
      sparse: true,
      default: null,
      index: true,
    },

    // Accession number (library-assigned unique ID)
    accessionNumber: {
      type: String,
      required: [true, 'Accession number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ─── Authorship ───────────────────────────
    authors: {
      type: [String],
      required: [true, 'At least one author is required'],
      validate: {
        validator: function (authors) {
          return authors.length > 0;
        },
        message: 'At least one author is required',
      },
    },

    // Primary author for display
    primaryAuthor: {
      type: String,
      trim: true,
    },

    // Editor (for edited volumes)
    editors: {
      type: [String],
      default: [],
    },

    // Translator
    translators: {
      type: [String],
      default: [],
    },

    // ─── Publication ──────────────────────────
    publisher: {
      type: String,
      trim: true,
      maxlength: [200, 'Publisher cannot exceed 200 characters'],
    },

    publicationYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear() + 1,
    },

    edition: {
      type: String,
      trim: true,
      default: null,
    },

    // Place of publication
    publicationPlace: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Category & Classification ────────────
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookCategory',
      required: [true, 'Category is required'],
      index: true,
    },

    categoryName: {
      type: String,
      trim: true,
    },

    // Dewey Decimal number
    deweyDecimal: {
      type: String,
      trim: true,
      default: null,
    },

    // Subject tags
    subjects: {
      type: [String],
      default: [],
    },

    // Grade level suitability
    suitableForGrades: {
      type: [String],
      default: [],
    },

    // ─── Language ────────────────────────────
    language: {
      type: String,
      enum: {
        values: [
          'Amharic',
          'English',
          'Oromiffa',
          'Tigrinya',
          'Somali',
          'Arabic',
          'French',
          'Other',
        ],
        message: '{VALUE} is not a valid language',
      },
      default: 'English',
    },

    // ─── Description ─────────────────────────
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Table of contents
    tableOfContents: {
      type: String,
      trim: true,
      default: null,
    },

    // Number of pages
    numberOfPages: {
      type: Number,
      default: null,
      min: 1,
    },

    // ─── Physical Details ─────────────────────
    // Total copies in library
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Must have at least 1 copy'],
      default: 1,
    },

    // Available copies (not issued)
    availableCopies: {
      type: Number,
      default: 1,
      min: 0,
    },

    // Copies currently issued
    issuedCopies: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Copies lost or damaged
    lostDamagedCopies: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Physical copies detail
    copies: [
      {
        copyNumber: {
          type: String,
          trim: true,
        },
        barcode: {
          type: String,
          trim: true,
          default: null,
        },
        condition: {
          type: String,
          enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Lost', 'Damaged'],
          default: 'Good',
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
        acquiredDate: {
          type: Date,
          default: null,
        },
        notes: {
          type: String,
          trim: true,
          default: null,
        },
      },
    ],

    // ─── Shelf Location ───────────────────────
    shelfLocation: {
      // Library section (e.g. "A", "B", "Science")
      section: {
        type: String,
        trim: true,
        default: null,
      },
      // Row number
      row: {
        type: String,
        trim: true,
        default: null,
      },
      // Shelf number
      shelf: {
        type: String,
        trim: true,
        default: null,
      },
      // Position on shelf
      position: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ─── Cover Image ──────────────────────────
    coverImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    // ─── Pricing ─────────────────────────────
    // Purchase price
    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Fine per day for late return
    finePerDay: {
      type: Number,
      default: 2,
      min: 0,
    },

    // ─── Acquisition ─────────────────────────
    acquisitionDate: {
      type: Date,
      default: null,
    },

    acquisitionSource: {
      type: String,
      enum: ['Purchase', 'Donation', 'Government', 'Exchange', 'Other', ''],
      default: '',
    },

    donorName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Usage Stats (cached) ─────────────────
    stats: {
      totalIssues: {
        type: Number,
        default: 0,
      },
      currentIssues: {
        type: Number,
        default: 0,
      },
      totalReservations: {
        type: Number,
        default: 0,
      },
      popularityScore: {
        type: Number,
        default: 0,
      },
      lastIssuedDate: {
        type: Date,
        default: null,
      },
      lastReturnedDate: {
        type: Date,
        default: null,
      },
    },

    // ─── Status ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isReference: {
      type: Boolean,
      default: false,
    },

    // Reference books cannot be issued
    canBeIssued: {
      type: Boolean,
      default: true,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    // ─── Audit ───────────────────────────────
    addedBy: {
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
bookSchema.index({ accessionNumber: 1 }, { unique: true });
bookSchema.index({ category: 1, isActive: 1 });
bookSchema.index({ language: 1 });
bookSchema.index({ publicationYear: -1 });
bookSchema.index({ availableCopies: 1 });
bookSchema.index({ isActive: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({
  title: 'text',
  primaryAuthor: 'text',
  authors: 'text',
  isbn: 'text',
  subjects: 'text',
  description: 'text',
  categoryName: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Is available for issue
bookSchema.virtual('isAvailable').get(function () {
  return this.availableCopies > 0 && this.canBeIssued && this.isActive;
});

// Availability status
bookSchema.virtual('availabilityStatus').get(function () {
  if (!this.canBeIssued) return 'Reference Only';
  if (!this.isActive) return 'Inactive';
  if (this.availableCopies === 0) return 'All Copies Issued';
  if (this.availableCopies < 3) return 'Limited';
  return 'Available';
});

// Authors display string
bookSchema.virtual('authorsDisplay').get(function () {
  if (!this.authors || this.authors.length === 0) return 'Unknown';
  if (this.authors.length === 1) return this.authors[0];
  if (this.authors.length === 2) return this.authors.join(' & ');
  return `${this.authors[0]} et al.`;
});

// Shelf location display
bookSchema.virtual('shelfLocationDisplay').get(function () {
  const loc = this.shelfLocation;
  if (!loc) return 'Not assigned';
  const parts = [loc.section, loc.row, loc.shelf, loc.position].filter(Boolean);
  return parts.length > 0 ? parts.join('-') : 'Not assigned';
});

// ─── Pre-Save Hook ────────────────────────────
bookSchema.pre('save', function (next) {
  // Set primary author from authors array
  if (this.isModified('authors') && this.authors.length > 0) {
    this.primaryAuthor = this.authors[0];
  }

  // Sync availableCopies
  if (
    this.isModified('totalCopies') ||
    this.isModified('issuedCopies') ||
    this.isModified('lostDamagedCopies')
  ) {
    this.availableCopies = Math.max(
      0,
      this.totalCopies - (this.issuedCopies || 0) - (this.lostDamagedCopies || 0)
    );
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Find book by accession number
bookSchema.statics.findByAccession = function (accessionNumber) {
  return this.findOne({
    accessionNumber: accessionNumber.toUpperCase(),
    isActive: true,
  }).populate('category', 'name code color');
};

// Find book by ISBN
bookSchema.statics.findByISBN = function (isbn) {
  return this.findOne({
    isbn: isbn.trim(),
    isActive: true,
  }).populate('category', 'name code color');
};

// Search books
bookSchema.statics.search = function (searchTerm, filters = {}) {
  const query = {
    $or: [
      {
        title: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        authors: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        isbn: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        accessionNumber: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        subjects: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        publisher: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
    ],
    isActive: true,
    ...filters,
  };

  return this.find(query)
    .sort({ 'stats.popularityScore': -1, title: 1 })
    .populate('category', 'name code color icon')
    .select(
      'title accessionNumber isbn primaryAuthor authors publisher publicationYear language availableCopies totalCopies categoryName coverImage isAvailable canBeIssued stats.totalIssues'
    );
};

// Get available books for issue
bookSchema.statics.getAvailable = function (filters = {}) {
  return this.find({
    isActive: true,
    canBeIssued: true,
    availableCopies: { $gt: 0 },
    ...filters,
  })
    .sort({ title: 1 })
    .populate('category', 'name code color');
};

// Get books by category
bookSchema.statics.getByCategory = function (categoryId, filters = {}) {
  return this.find({
    category: categoryId,
    isActive: true,
    ...filters,
  })
    .sort({ title: 1 })
    .populate('category', 'name code color');
};

// Get popular books
bookSchema.statics.getPopular = function (limit = 10) {
  return this.find({
    isActive: true,
    canBeIssued: true,
  })
    .sort({ 'stats.totalIssues': -1 })
    .limit(limit)
    .populate('category', 'name code color');
};

// Get recently added books
bookSchema.statics.getRecentlyAdded = function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name code color');
};

// Get books suitable for a grade
bookSchema.statics.getSuitableForGrade = function (grade, filters = {}) {
  return this.find({
    isActive: true,
    suitableForGrades: grade,
    ...filters,
  })
    .sort({ 'stats.popularityScore': -1 })
    .populate('category', 'name code color');
};

// Update issue stats
bookSchema.statics.incrementIssueCount = async function (bookId) {
  return this.findByIdAndUpdate(
    bookId,
    {
      $inc: {
        issuedCopies: 1,
        'stats.totalIssues': 1,
        'stats.currentIssues': 1,
      },
      $set: {
        'stats.lastIssuedDate': new Date(),
      },
    },
    { new: true }
  );
};

// Update return stats
bookSchema.statics.decrementIssueCount = async function (bookId) {
  return this.findByIdAndUpdate(
    bookId,
    {
      $inc: {
        issuedCopies: -1,
        'stats.currentIssues': -1,
      },
      $set: {
        'stats.lastReturnedDate': new Date(),
      },
    },
    { new: true }
  );
};

// Get dashboard stats
bookSchema.statics.getDashboardStats = async function () {
  const [total, available, issued, byCategory, popular] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments({
      isActive: true,
      availableCopies: { $gt: 0 },
    }),
    this.countDocuments({
      isActive: true,
      issuedCopies: { $gt: 0 },
    }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$categoryName',
          bookCount: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: {
            $sum: '$availableCopies',
          },
        },
      },
      { $sort: { bookCount: -1 } },
      { $limit: 5 },
    ]),
    this.find({ isActive: true })
      .sort({ 'stats.totalIssues': -1 })
      .limit(5)
      .select('title primaryAuthor stats.totalIssues coverImage'),
  ]);

  const totalCopies = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalCopies' },
        available: { $sum: '$availableCopies' },
        issued: { $sum: '$issuedCopies' },
      },
    },
  ]);

  return {
    totalTitles: total,
    available,
    fullyIssued: issued,
    totalCopies: totalCopies[0]?.total || 0,
    availableCopies: totalCopies[0]?.available || 0,
    issuedCopies: totalCopies[0]?.issued || 0,
    byCategory,
    popularBooks: popular,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if specific copy is available
bookSchema.methods.isCopyAvailable = function (copyNumber) {
  const copy = this.copies.find((c) => c.copyNumber === copyNumber);
  return copy ? copy.isAvailable : false;
};

// Mark copy as issued
bookSchema.methods.issueCopy = async function (copyNumber) {
  const copy = this.copies.find((c) => c.copyNumber === copyNumber);
  if (copy) {
    copy.isAvailable = false;
    this.issuedCopies += 1;
    await this.save();
  }
  return this;
};

// Mark copy as returned
bookSchema.methods.returnCopy = async function (copyNumber, condition = 'Good') {
  const copy = this.copies.find((c) => c.copyNumber === copyNumber);
  if (copy) {
    copy.isAvailable = true;
    copy.condition = condition;
    this.issuedCopies = Math.max(0, this.issuedCopies - 1);
    await this.save();
  }
  return this;
};

// Mark copy as lost/damaged
bookSchema.methods.markLostDamaged = async function (copyNumber, status) {
  const copy = this.copies.find((c) => c.copyNumber === copyNumber);
  if (copy) {
    copy.isAvailable = false;
    copy.condition = status;
    this.lostDamagedCopies += 1;
    await this.save();
  }
  return this;
};

// Update popularity score
bookSchema.methods.updatePopularityScore = async function () {
  const score = this.stats.totalIssues * 2 + this.stats.totalReservations;
  this.stats.popularityScore = score;
  await this.save({ validateBeforeSave: false });
  return this;
};

// ─── Create Model ─────────────────────────────
const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
