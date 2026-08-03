// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// DOCUMENT MODEL
// kat-school/server/src/models/Document.js
// ============================================

'use strict';

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    // ─── Document Identity ────────────────────
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },

    // ─── Document Type ────────────────────────
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: {
        values: [
          // Student documents
          'Birth Certificate',
          'Grade Transcript',
          'Leaving Certificate',
          'Medical Certificate',
          'Disability Certificate',
          'Scholarship Letter',
          'Photo ID',
          'Kebele ID',
          'Parent ID',
          // Teacher/Employee documents
          'Employment Contract',
          'Degree Certificate',
          'Diploma Certificate',
          'Teaching License',
          'TIN Certificate',
          'Pension Card',
          'Bank Statement',
          'Experience Letter',
          'Recommendation Letter',
          'Police Clearance',
          // General
          'Invoice',
          'Receipt',
          'Agreement',
          'Policy Document',
          'Circular',
          'Form',
          'Report',
          'Other',
        ],
        message: '{VALUE} is not a valid document type',
      },
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ─── Owner ────────────────────────────────
    // Document owner type
    ownerType: {
      type: String,
      required: [true, 'Owner type is required'],
      enum: {
        values: ['student', 'teacher', 'employee', 'guardian', 'school'],
        message: '{VALUE} is not a valid owner type',
      },
      index: true,
    },

    // Student owner
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true,
    },

    // Teacher owner
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
      index: true,
    },

    // Employee owner
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },

    // Guardian owner
    guardian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guardian',
      default: null,
    },

    // Cached owner name
    ownerName: {
      type: String,
      trim: true,
    },

    ownerId: {
      type: String,
      trim: true,
      index: true,
    },

    // ─── File Details ─────────────────────────
    // Cloudinary URL
    url: {
      type: String,
      required: [true, 'Document URL is required'],
    },

    publicId: {
      type: String,
      trim: true,
      default: null,
    },

    // Original file name
    originalName: {
      type: String,
      trim: true,
    },

    // MIME type
    mimeType: {
      type: String,
      trim: true,
    },

    // File size in bytes
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    // File extension
    fileExtension: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // ─── Validity ────────────────────────────
    // Issue date of document
    issueDate: {
      type: Date,
      default: null,
    },

    // Expiry date (if applicable)
    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },

    // Document number (e.g. certificate number)
    documentNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // Issuing authority
    issuedBy: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Verification ─────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    verifiedByName: {
      type: String,
      trim: true,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verificationNotes: {
      type: String,
      trim: true,
      default: null,
    },

    // Whether document is rejected
    isRejected: {
      type: Boolean,
      default: false,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    // ─── Access Control ───────────────────────
    // Whether document is visible to the owner
    isVisibleToOwner: {
      type: Boolean,
      default: true,
    },

    // Whether document is confidential
    isConfidential: {
      type: Boolean,
      default: false,
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null,
    },

    academicYearName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Status ──────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending_verification', 'verified', 'rejected', 'expired', 'archived'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending_verification',
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Notes ───────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // ─── Audit ───────────────────────────────
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    uploadedByName: {
      type: String,
      trim: true,
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
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
documentSchema.index({
  ownerType: 1,
  documentType: 1,
});
documentSchema.index({ student: 1, isActive: 1 });
documentSchema.index({ teacher: 1, isActive: 1 });
documentSchema.index({ employee: 1, isActive: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ isVerified: 1 });
documentSchema.index({ expiryDate: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({
  name: 'text',
  documentType: 'text',
  ownerName: 'text',
  ownerId: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Is expired
documentSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date(this.expiryDate) < new Date();
});

// Days until expiry
documentSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  if (expiry <= now) return 0;
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
});

// Is expiring soon (within 30 days)
documentSchema.virtual('isExpiringSoon').get(function () {
  const days = this.daysUntilExpiry;
  if (days === null) return false;
  return days > 0 && days <= 30;
});

// Formatted file size
documentSchema.virtual('fileSizeDisplay').get(function () {
  if (!this.fileSize) return '0 KB';
  const kb = this.fileSize / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
});

// Verification status display
documentSchema.virtual('verificationStatus').get(function () {
  if (this.isRejected) return 'Rejected';
  if (this.isVerified) return 'Verified';
  if (this.isExpired) return 'Expired';
  return 'Pending Verification';
});

// ─── Pre-Save Hook ────────────────────────────
documentSchema.pre('save', function (next) {
  // Auto-update status
  if (this.isModified('isVerified') && this.isVerified) {
    this.status = 'verified';
  }

  if (this.isModified('isRejected') && this.isRejected) {
    this.status = 'rejected';
  }

  if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
    this.status = 'expired';
  }

  // Extract file extension from original name
  if (this.isModified('originalName') && this.originalName) {
    const parts = this.originalName.split('.');
    if (parts.length > 1) {
      this.fileExtension = parts[parts.length - 1].toLowerCase();
    }
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Get documents for a student
documentSchema.statics.getForStudent = function (studentId, filters = {}) {
  return this.find({
    student: studentId,
    isActive: true,
    ...filters,
  })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', 'firstName fatherName role')
    .populate('verifiedBy', 'firstName fatherName');
};

// Get documents for a teacher
documentSchema.statics.getForTeacher = function (teacherId, filters = {}) {
  return this.find({
    teacher: teacherId,
    isActive: true,
    ...filters,
  })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', 'firstName fatherName role');
};

// Get documents for an employee
documentSchema.statics.getForEmployee = function (employeeId, filters = {}) {
  return this.find({
    employee: employeeId,
    isActive: true,
    ...filters,
  })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', 'firstName fatherName role');
};

// Get pending verification documents
documentSchema.statics.getPendingVerification = function (filters = {}) {
  return this.find({
    status: 'pending_verification',
    isActive: true,
    isRejected: false,
    ...filters,
  })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', 'firstName fatherName role');
};

// Get expiring documents
documentSchema.statics.getExpiringSoon = function (daysAhead = 30) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return this.find({
    isActive: true,
    expiryDate: {
      $gte: now,
      $lte: futureDate,
    },
  })
    .sort({ expiryDate: 1 })
    .populate('student', 'firstName fatherName studentId')
    .populate('teacher', 'firstName fatherName teacherId')
    .populate('employee', 'firstName fatherName employeeId');
};

// Search documents
documentSchema.statics.search = function (searchTerm, filters = {}) {
  return this.find({
    $or: [
      {
        name: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        documentType: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        ownerName: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        ownerId: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
      {
        documentNumber: {
          $regex: searchTerm,
          $options: 'i',
        },
      },
    ],
    isActive: true,
    ...filters,
  })
    .sort({ uploadedAt: -1 })
    .populate('uploadedBy', 'firstName fatherName');
};

// Verify a document
documentSchema.statics.verify = async function (
  documentId,
  verifiedBy,
  verifiedByName,
  notes = null
) {
  return this.findByIdAndUpdate(
    documentId,
    {
      isVerified: true,
      isRejected: false,
      status: 'verified',
      verifiedBy,
      verifiedByName,
      verifiedAt: new Date(),
      verificationNotes: notes,
    },
    { new: true }
  );
};

// Reject a document
documentSchema.statics.reject = async function (documentId, rejectedBy, reason) {
  return this.findByIdAndUpdate(
    documentId,
    {
      isRejected: true,
      isVerified: false,
      status: 'rejected',
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
    { new: true }
  );
};

// Archive a document
documentSchema.statics.archive = async function (documentId) {
  return this.findByIdAndUpdate(
    documentId,
    {
      status: 'archived',
      isActive: false,
    },
    { new: true }
  );
};

// Get dashboard stats
documentSchema.statics.getDashboardStats = async function () {
  const [total, verified, pending, rejected, expired, expiringSoon, byType] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments({
      isActive: true,
      status: 'verified',
    }),
    this.countDocuments({
      isActive: true,
      status: 'pending_verification',
    }),
    this.countDocuments({
      isActive: true,
      status: 'rejected',
    }),
    this.countDocuments({
      isActive: true,
      status: 'expired',
    }),
    this.countDocuments({
      isActive: true,
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 },
          verified: {
            $sum: {
              $cond: [{ $eq: ['$isVerified', true] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    total,
    verified,
    pending,
    rejected,
    expired,
    expiringSoon,
    byType,
  };
};

// Get owner type stats
documentSchema.statics.getOwnerTypeStats = async function () {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$ownerType',
        count: { $sum: 1 },
        verified: {
          $sum: {
            $cond: [{ $eq: ['$isVerified', true] }, 1, 0],
          },
        },
        pending: {
          $sum: {
            $cond: [
              {
                $eq: ['$status', 'pending_verification'],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// ─── Instance Methods ─────────────────────────

// Verify this document
documentSchema.methods.verify = async function (userId, userName, notes = null) {
  this.isVerified = true;
  this.isRejected = false;
  this.status = 'verified';
  this.verifiedBy = userId;
  this.verifiedByName = userName;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  await this.save();
  return this;
};

// Reject this document
documentSchema.methods.reject = async function (userId, reason) {
  this.isRejected = true;
  this.isVerified = false;
  this.status = 'rejected';
  this.rejectedBy = userId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
  return this;
};

// Check if document needs renewal
documentSchema.methods.needsRenewal = function () {
  return this.isExpiringSoon || this.isExpired;
};

// Get document summary
documentSchema.methods.getSummary = function () {
  return {
    name: this.name,
    type: this.documentType,
    owner: this.ownerName,
    ownerId: this.ownerId,
    status: this.verificationStatus,
    uploadedAt: this.uploadedAt,
    expiryDate: this.expiryDate,
    isExpired: this.isExpired,
    daysUntilExpiry: this.daysUntilExpiry,
    fileSize: this.fileSizeDisplay,
    url: this.url,
  };
};

// ─── Create Model ─────────────────────────────
const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
