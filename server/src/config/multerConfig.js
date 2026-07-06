// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// MULTER FILE UPLOAD CONFIGURATION
// ============================================

'use strict';

const multer = require('multer');
const path = require('path');
const { FILE_UPLOAD } = require('./constants');

// ─── Memory Storage ───────────────────────────
// Files are stored in RAM as Buffer objects
// They are then uploaded to Cloudinary from the buffer
// This avoids writing temp files to disk
const memoryStorage = multer.memoryStorage();

// ─── Disk Storage (for local fallback) ────────
// Used only if Cloudinary is not configured
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');

    // Choose subfolder based on field name
    let subFolder = 'general';
    if (file.fieldname === 'photo' || file.fieldname === 'profilePhoto') {
      subFolder = 'photos';
    } else if (file.fieldname === 'document' || file.fieldname === 'attachment') {
      subFolder = 'documents';
    }

    cb(null, path.join(uploadPath, subFolder));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: fieldname-timestamp-random.ext
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = file.fieldname.replace(/\s+/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// ─── Image File Filter ────────────────────────
// Accepts only image files: JPEG, PNG, WebP
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES;
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Invalid image type. Allowed types: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

// ─── Document File Filter ─────────────────────
// Accepts only documents: PDF, DOC, DOCX
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = FILE_UPLOAD.ALLOWED_DOC_TYPES;
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Invalid document type. Allowed types: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

// ─── Excel/CSV File Filter ────────────────────
// Accepts only Excel and CSV files for bulk import
const excelFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [...FILE_UPLOAD.ALLOWED_EXCEL_TYPES, 'text/csv', 'application/csv'];
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

// ─── Mixed File Filter ────────────────────────
// Accepts images and documents
const mixedFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [...FILE_UPLOAD.ALLOWED_IMAGE_TYPES, ...FILE_UPLOAD.ALLOWED_DOC_TYPES];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

// ─── Base Multer Config ───────────────────────
const baseConfig = {
  storage: memoryStorage,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES,
    files: 10,
    fields: 50,
    fieldSize: 2 * 1024 * 1024,
  },
};

// ─── Upload Instances ─────────────────────────

// Single profile photo upload
// Used for: student photo, teacher photo, employee photo
const uploadProfilePhoto = multer({
  ...baseConfig,
  fileFilter: imageFileFilter,
  limits: {
    ...baseConfig.limits,
    files: 1,
    fileSize: 2 * 1024 * 1024, // 2MB max for photos
  },
}).single('photo');

// Single book cover upload
const uploadBookCover = multer({
  ...baseConfig,
  fileFilter: imageFileFilter,
  limits: {
    ...baseConfig.limits,
    files: 1,
    fileSize: 2 * 1024 * 1024,
  },
}).single('cover');

// Single document upload
// Used for: student documents, employee documents
const uploadDocument = multer({
  ...baseConfig,
  fileFilter: documentFileFilter,
  limits: {
    ...baseConfig.limits,
    files: 1,
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES,
  },
}).single('document');

// Multiple documents upload (up to 5)
const uploadMultipleDocuments = multer({
  ...baseConfig,
  fileFilter: documentFileFilter,
  limits: {
    ...baseConfig.limits,
    files: 5,
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES,
  },
}).array('documents', 5);

// Excel/CSV for bulk import
// Used for: bulk student import, bulk teacher import
const uploadExcel = multer({
  ...baseConfig,
  fileFilter: excelFileFilter,
  limits: {
    ...baseConfig.limits,
    files: 1,
    fileSize: 10 * 1024 * 1024, // 10MB for Excel files
  },
}).single('file');

// Mixed upload — photo + documents
// Used for: student registration with documents
const uploadMixed = multer({
  ...baseConfig,
  fileFilter: mixedFileFilter,
  limits: {
    ...baseConfig.limits,
    files: 6,
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES,
  },
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

// School logo upload
const uploadLogo = multer({
  ...baseConfig,
  fileFilter: imageFileFilter,
  limits: {
    ...baseConfig.limits,
    files: 1,
    fileSize: 1 * 1024 * 1024, // 1MB max for logo
  },
}).single('logo');

// General single image upload
const uploadImage = multer({
  ...baseConfig,
  fileFilter: imageFileFilter,
  limits: {
    ...baseConfig.limits,
    files: 1,
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES,
  },
}).single('image');

// ─── Multer Error Handler ─────────────────────
// Wraps multer middleware to handle errors properly
const handleMulterError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          // Multer-specific errors
          let message = 'File upload error';

          switch (error.code) {
            case 'LIMIT_FILE_SIZE':
              message = `File too large. Maximum size is ${FILE_UPLOAD.MAX_SIZE_MB}MB`;
              break;
            case 'LIMIT_FILE_COUNT':
              message = 'Too many files uploaded at once';
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = error.message || 'Unexpected file field';
              break;
            case 'LIMIT_FIELD_COUNT':
              message = 'Too many form fields';
              break;
            case 'LIMIT_FIELD_KEY':
              message = 'Field name is too long';
              break;
            case 'LIMIT_FIELD_VALUE':
              message = 'Field value is too long';
              break;
            case 'LIMIT_PART_COUNT':
              message = 'Too many parts in form data';
              break;
            default:
              message = `Upload error: ${error.message}`;
          }

          return res.status(400).json({
            success: false,
            message,
            code: error.code,
          });
        }

        // Non-Multer errors
        return res.status(400).json({
          success: false,
          message: error.message || 'File upload failed',
        });
      }

      // No error — continue
      next();
    });
  };
};

// ─── File Info Extractor ──────────────────────
// Extracts useful info from uploaded file object
const getFileInfo = (file) => {
  if (!file) return null;

  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    buffer: file.buffer,
    encoding: file.encoding,
    fieldname: file.fieldname,
  };
};

// ─── Format File Size ─────────────────────────
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ─── Validate File Before Upload ──────────────
const validateFile = (file, type = 'image') => {
  if (!file) {
    return { valid: false, message: 'No file provided' };
  }

  const allowedTypes =
    type === 'image'
      ? FILE_UPLOAD.ALLOWED_IMAGE_TYPES
      : type === 'document'
        ? FILE_UPLOAD.ALLOWED_DOC_TYPES
        : type === 'excel'
          ? FILE_UPLOAD.ALLOWED_EXCEL_TYPES
          : [...FILE_UPLOAD.ALLOWED_IMAGE_TYPES, ...FILE_UPLOAD.ALLOWED_DOC_TYPES];

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      message: `Invalid file type: ${file.mimetype}`,
    };
  }

  if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
    return {
      valid: false,
      message: `File too large. Maximum ${FILE_UPLOAD.MAX_SIZE_MB}MB allowed`,
    };
  }

  return { valid: true };
};

// ─── Exports ──────────────────────────────────
module.exports = {
  // Upload middleware instances
  uploadProfilePhoto: handleMulterError(uploadProfilePhoto),
  uploadBookCover: handleMulterError(uploadBookCover),
  uploadDocument: handleMulterError(uploadDocument),
  uploadMultipleDocuments: handleMulterError(uploadMultipleDocuments),
  uploadExcel: handleMulterError(uploadExcel),
  uploadMixed: handleMulterError(uploadMixed),
  uploadLogo: handleMulterError(uploadLogo),
  uploadImage: handleMulterError(uploadImage),

  // Utility functions
  getFileInfo,
  formatFileSize,
  validateFile,
  handleMulterError,

  // Storage instances (for custom use)
  memoryStorage,
  diskStorage,
};
