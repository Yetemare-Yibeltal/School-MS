// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// BOOK CATEGORY MODEL
// kat-school/server/src/models/BookCategory.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const bookCategorySchema = new mongoose.Schema(
  {
    // ─── Category Identity ────────────────────
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [
        100,
        'Name cannot exceed 100 characters',
      ],
      index: true,
    },

    code: {
      type: String,
      required: [true, 'Code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [
        10,
        'Code cannot exceed 10 characters',
      ],
      match: [
        /^[A-Z0-9_]+$/,
        'Code must be uppercase letters and numbers only',
      ],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'Description cannot exceed 500 characters',
      ],
    },

    // ─── Dewey Decimal ────────────────────────
    // Dewey Decimal Classification number
    deweyDecimal: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Parent Category ──────────────────────
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookCategory',
      default: null,
    },

    parentCategoryName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Book Stats (cached) ──────────────────
    totalBooks: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableBooks: {
      type: Number,
      default: 0,
      min: 0,
    },

    issuedBooks: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Target Audience ─────────────────────
    // Which grades this category is suitable for
    suitableForGrades: {
      type: [String],
      default: [],
    },

    // ─── UI Display ──────────────────────────
    color: {
      type: String,
      default: '#4f46e5',
      match: [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        'Invalid color hex code',
      ],
    },

    bgColor: {
      type: String,
      default: '#eef2ff',
    },

    icon: {
      type: String,
      default: 'book',
      trim: true,
    },

    coverImage: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Type ────────────────────────────────
    isSystem: {
      type: Boolean,
      default: false,
    },

    // ─── Status ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
bookCategorySchema.index(
  { name: 1 },
  { unique: true }
);
bookCategorySchema.index(
  { code: 1 },
  { unique: true }
);
bookCategorySchema.index({ isActive: 1 });
bookCategorySchema.index({ sortOrder: 1 });
bookCategorySchema.index({ parentCategory: 1 });

// ─── Virtuals ─────────────────────────────────
// Availability percentage
bookCategorySchema.virtual(
  'availabilityPercentage'
).get(function () {
  if (!this.totalBooks) return 0;
  return Math.round(
    (this.availableBooks / this.totalBooks) * 100
  );
});

// Display label
bookCategorySchema.virtual('displayLabel').get(
  function () {
    return `${this.name} (${this.code})`;
  }
);

// ─── Static Methods ───────────────────────────

// Seed default book categories
bookCategorySchema.statics.seedDefaultCategories =
  async function () {
    const categories = [
      {
        name: 'Textbooks',
        code: 'TXT',
        description:
          'Academic textbooks for all subjects and grades',
        deweyDecimal: '370',
        color: '#4f46e5',
        bgColor: '#eef2ff',
        icon: 'book-open',
        sortOrder: 1,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Reference Books',
        code: 'REF',
        description:
          'Dictionaries, encyclopedias, atlases and reference materials',
        deweyDecimal: '030',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        icon: 'search',
        sortOrder: 2,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Science & Technology',
        code: 'SCI',
        description:
          'Physics, chemistry, biology, ICT and technology books',
        deweyDecimal: '500',
        color: '#22c55e',
        bgColor: '#dcfce7',
        icon: 'flask',
        sortOrder: 3,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Mathematics',
        code: 'MATH',
        description:
          'Mathematics, statistics, and problem solving books',
        deweyDecimal: '510',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: 'calculator',
        sortOrder: 4,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Language & Literature',
        code: 'LANG',
        description:
          'Amharic, English and other language and literature books',
        deweyDecimal: '800',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
        icon: 'message-square',
        sortOrder: 5,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'History & Geography',
        code: 'HIST',
        description:
          'Ethiopian and world history, geography and social studies',
        deweyDecimal: '900',
        color: '#f97316',
        bgColor: '#ffedd5',
        icon: 'globe',
        sortOrder: 6,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Fiction & Novels',
        code: 'FIC',
        description:
          'Novels, short stories and works of fiction',
        deweyDecimal: '800',
        color: '#ec4899',
        bgColor: '#fce7f3',
        icon: 'book',
        sortOrder: 7,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Biography & Autobiography',
        code: 'BIO',
        description:
          'Biographies and autobiographies of notable people',
        deweyDecimal: '920',
        color: '#14b8a6',
        bgColor: '#ccfbf1',
        icon: 'user',
        sortOrder: 8,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Religion & Philosophy',
        code: 'REL',
        description:
          'Religious texts, philosophy and ethics books',
        deweyDecimal: '200',
        color: '#d97706',
        bgColor: '#fef3c7',
        icon: 'star',
        sortOrder: 9,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Health & Physical Education',
        code: 'HLTH',
        description:
          'Health education, sports and physical education books',
        deweyDecimal: '613',
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: 'heart',
        sortOrder: 10,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Economics & Business',
        code: 'ECON',
        description:
          'Economics, business studies and entrepreneurship books',
        deweyDecimal: '330',
        color: '#0ea5e9',
        bgColor: '#e0f2fe',
        icon: 'trending-up',
        sortOrder: 11,
        isSystem: true,
        suitableForGrades: [
          'Grade 11',
          'Grade 12',
        ],
      },
      {
        name: 'Arts & Culture',
        code: 'ART',
        description:
          'Ethiopian and world arts, culture and music books',
        deweyDecimal: '700',
        color: '#7c3aed',
        bgColor: '#ede9fe',
        icon: 'music',
        sortOrder: 12,
        isSystem: true,
        suitableForGrades: [
          'Grade 9',
          'Grade 10',
          'Grade 11',
          'Grade 12',
        ],
      },
    ];

    for (const category of categories) {
      await this.findOneAndUpdate(
        { code: category.code },
        {
          $setOnInsert: {
            ...category,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    console.info(
      `✅ ${categories.length} book categories seeded`
    );
  };

// Find by code
bookCategorySchema.statics.findByCode = function (
  code
) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
};

// Get all active categories
bookCategorySchema.statics.getAllActive = function () {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .populate('parentCategory', 'name code');
};

// Get top-level categories (no parent)
bookCategorySchema.statics.getTopLevel = function () {
  return this.find({
    isActive: true,
    parentCategory: null,
  }).sort({ sortOrder: 1 });
};

// Get categories with book counts
bookCategorySchema.statics.getWithBookCounts =
  async function () {
    const Book = mongoose.model('Book');

    const categories = await this.find({
      isActive: true,
    }).sort({ sortOrder: 1 });

    const counts = await Book.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$totalCopies' },
          available: { $sum: '$availableCopies' },
          issued: {
            $sum: {
              $subtract: [
                '$totalCopies',
                '$availableCopies',
              ],
            },
          },
        },
      },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id?.toString()] = {
        total: c.total,
        available: c.available,
        issued: c.issued,
      };
    });

    return categories.map((cat) => {
      const catObj = cat.toObject();
      const stats =
        countMap[cat._id.toString()] || {
          total: 0,
          available: 0,
          issued: 0,
        };
      catObj.totalBooks = stats.total;
      catObj.availableBooks = stats.available;
      catObj.issuedBooks = stats.issued;
      return catObj;
    });
  };

// Update book stats for a category
bookCategorySchema.statics.updateStats =
  async function (categoryId) {
    const Book = mongoose.model('Book');

    const stats = await Book.aggregate([
      {
        $match: {
          category: new mongoose.Types.ObjectId(
            categoryId
          ),
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalCopies' },
          available: { $sum: '$availableCopies' },
        },
      },
    ]);

    const s = stats[0] || {
      total: 0,
      available: 0,
    };

    return this.findByIdAndUpdate(
      categoryId,
      {
        totalBooks: s.total,
        availableBooks: s.available,
        issuedBooks: s.total - s.available,
      },
      { new: true }
    );
  };

// Get dashboard stats
bookCategorySchema.statics.getDashboardStats =
  async function () {
    const [total, withBooks, topCategories] =
      await Promise.all([
        this.countDocuments({ isActive: true }),
        this.countDocuments({
          isActive: true,
          totalBooks: { $gt: 0 },
        }),
        this.find({ isActive: true })
          .sort({ totalBooks: -1 })
          .limit(5)
          .select('name code color totalBooks'),
      ]);

    return {
      total,
      withBooks,
      empty: total - withBooks,
      topCategories,
    };
  };

// ─── Instance Methods ─────────────────────────

// Check if category has available books
bookCategorySchema.methods.hasAvailableBooks =
  function () {
    return this.availableBooks > 0;
  };

// Get category path (for nested categories)
bookCategorySchema.methods.getCategoryPath =
  async function () {
    const path = [this.name];
    let current = this;

    while (current.parentCategory) {
      const parent = await mongoose
        .model('BookCategory')
        .findById(current.parentCategory)
        .select('name parentCategory');
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }

    return path.join(' > ');
  };

// ─── Create Model ─────────────────────────────
const BookCategory = mongoose.model(
  'BookCategory',
  bookCategorySchema
);

module.exports = BookCategory;