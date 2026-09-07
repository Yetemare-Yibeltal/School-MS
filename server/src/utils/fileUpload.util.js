// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FILE UPLOAD UTILITY
// kat-school/server/src/utils/fileUpload.util.js
// ============================================

'use strict';

const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Cloudinary Folder Mapping ────────────────
const FOLDERS = {
  STUDENT_PHOTOS: 'kat-school/students/photos',
  TEACHER_PHOTOS: 'kat-school/teachers/photos',
  EMPLOYEE_PHOTOS: 'kat-school/employees/photos',
  STUDENT_DOCUMENTS: 'kat-school/students/documents',
  TEACHER_DOCUMENTS: 'kat-school/teachers/documents',
  EMPLOYEE_DOCUMENTS: 'kat-school/employees/documents',
  BOOK_COVERS: 'kat-school/library/covers',
  RECEIPTS: 'kat-school/finance/receipts',
  NOTICES: 'kat-school/notices',
  EVENTS: 'kat-school/events',
  SALARY_SLIPS: 'kat-school/payroll/slips',
  REPORT_CARDS: 'kat-school/academics/report-cards',
  SCHOOL: 'kat-school/school',
  MESSAGES: 'kat-school/messages',
  SUSPENSIONS: 'kat-school/suspensions',
  EXPENSES: 'kat-school/finance/expenses',
};

// ─── Allowed File Types ───────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// ─── Upload to Cloudinary ─────────────────────
const uploadToCloudinary = async (filePath, folder, options = {}) => {
  try {
    const uploadOptions = {
      folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      resource_type: 'auto',
      ...options,
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Delete local temp file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      resourceType: result.resource_type,
    };
  } catch (error) {
    // Clean up temp file on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('❌ Cloudinary upload error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ─── Upload Buffer to Cloudinary ──────────────
const uploadBufferToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      use_filename: false,
      unique_filename: true,
      resource_type: 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      });
    });

    const { Readable } = require('stream');
    const readableStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      },
    });
    readableStream.pipe(uploadStream);
  });
};

// ─── Delete from Cloudinary ───────────────────
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) return { success: true };

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── Upload Profile Photo ─────────────────────
const uploadProfilePhoto = async (filePath, userType = 'student') => {
  const folderMap = {
    student: FOLDERS.STUDENT_PHOTOS,
    teacher: FOLDERS.TEACHER_PHOTOS,
    employee: FOLDERS.EMPLOYEE_PHOTOS,
  };

  const folder = folderMap[userType] || FOLDERS.STUDENT_PHOTOS;

  return uploadToCloudinary(filePath, folder, {
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { format: 'webp' },
    ],
  });
};

// ─── Upload Document ──────────────────────────
const uploadDocument = async (filePath, ownerType = 'student') => {
  const folderMap = {
    student: FOLDERS.STUDENT_DOCUMENTS,
    teacher: FOLDERS.TEACHER_DOCUMENTS,
    employee: FOLDERS.EMPLOYEE_DOCUMENTS,
  };

  const folder = folderMap[ownerType] || FOLDERS.STUDENT_DOCUMENTS;
  return uploadToCloudinary(filePath, folder, {
    resource_type: 'auto',
  });
};

// ─── Upload PDF ───────────────────────────────
const uploadPDF = async (buffer, folder, publicIdPrefix = 'doc') => {
  const timestamp = Date.now();
  return uploadBufferToCloudinary(buffer, folder, {
    resource_type: 'raw',
    public_id: `${publicIdPrefix}_${timestamp}`,
    format: 'pdf',
  });
};

// ─── Upload Book Cover ────────────────────────
const uploadBookCover = async (filePath) => {
  return uploadToCloudinary(filePath, FOLDERS.BOOK_COVERS, {
    transformation: [
      { width: 300, height: 400, crop: 'fill' },
      { quality: 'auto' },
      { format: 'webp' },
    ],
  });
};

// ─── Multer Memory Storage ────────────────────
// For handling file uploads in memory (buffer)
const memoryStorage = multer.memoryStorage();

// ─── Multer Disk Storage ──────────────────────
// For saving files temporarily to disk before Cloudinary upload
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'temp_uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// ─── Multer File Filters ──────────────────────
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

const documentFileFilter = (req, file, cb) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, Word, Excel, images.'), false);
  }
};

const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'), false);
  }
};

// ─── Multer Upload Instances ──────────────────
// Single image upload (max 5MB)
const uploadImage = multer({
  storage: diskStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Single document upload (max 10MB)
const uploadDocument_ = multer({
  storage: diskStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Multiple documents upload (max 10MB each, up to 5 files)
const uploadMultipleDocuments = multer({
  storage: diskStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// PDF upload (max 20MB)
const uploadPDF_ = multer({
  storage: memoryStorage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ─── Get File Extension ───────────────────────
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().replace('.', '');
};

// ─── Get File Size Display ────────────────────
const getFileSizeDisplay = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

// ─── Clean Temp Files ─────────────────────────
const cleanTempFiles = () => {
  const uploadDir = path.join(process.cwd(), 'temp_uploads');
  if (!fs.existsSync(uploadDir)) return;

  const files = fs.readdirSync(uploadDir);
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  files.forEach((file) => {
    const filePath = path.join(uploadDir, file);
    const stat = fs.statSync(filePath);
    if (now - stat.mtimeMs > ONE_HOUR) {
      fs.unlinkSync(filePath);
    }
  });
};

module.exports = {
  FOLDERS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  uploadProfilePhoto,
  uploadDocument,
  uploadPDF,
  uploadBookCover,
  uploadImage,
  uploadDocument_,
  uploadMultipleDocuments,
  uploadPDF_,
  getFileExtension,
  getFileSizeDisplay,
  cleanTempFiles,
};
