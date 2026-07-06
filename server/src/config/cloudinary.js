// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// CLOUDINARY CONFIGURATION
// ============================================

'use strict';

const cloudinary = require('cloudinary').v2;
const { FILE_UPLOAD } = require('./constants');

// ─── Configure Cloudinary ─────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ─── Verify Cloudinary Connection ────────────
const verifyCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      console.info('✅ Cloudinary connected successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠️  Cloudinary connection failed:', error.message);
    return false;
  }
};

// ─── Upload Options Per Type ──────────────────
const UPLOAD_OPTIONS = {
  // Student / Teacher / Employee profile photos
  PROFILE_PHOTO: {
    folder: `${FILE_UPLOAD.PHOTO_FOLDER}/profiles`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_bytes: FILE_UPLOAD.MAX_SIZE_BYTES,
    transformation: [
      {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ],
    resource_type: 'image',
    overwrite: true,
    invalidate: true,
  },

  // Student documents (PDFs, Word docs)
  DOCUMENT: {
    folder: `${FILE_UPLOAD.PHOTO_FOLDER}/documents`,
    allowed_formats: ['pdf', 'doc', 'docx'],
    max_bytes: FILE_UPLOAD.MAX_SIZE_BYTES,
    resource_type: 'raw',
    overwrite: true,
    invalidate: true,
  },

  // Book cover images
  BOOK_COVER: {
    folder: `${FILE_UPLOAD.PHOTO_FOLDER}/books`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_bytes: FILE_UPLOAD.MAX_SIZE_BYTES,
    transformation: [
      {
        width: 300,
        height: 400,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ],
    resource_type: 'image',
    overwrite: true,
    invalidate: true,
  },

  // School logo and general images
  GENERAL: {
    folder: `${FILE_UPLOAD.PHOTO_FOLDER}/general`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    max_bytes: FILE_UPLOAD.MAX_SIZE_BYTES,
    transformation: [
      {
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ],
    resource_type: 'image',
    overwrite: true,
    invalidate: true,
  },

  // Notice and event attachments
  ATTACHMENT: {
    folder: `${FILE_UPLOAD.PHOTO_FOLDER}/attachments`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    max_bytes: FILE_UPLOAD.MAX_SIZE_BYTES,
    resource_type: 'auto',
    overwrite: true,
    invalidate: true,
  },
};

// ─── Upload File to Cloudinary ────────────────
// Uploads a file buffer or file path to Cloudinary
const uploadToCloudinary = async (fileData, uploadType = 'PROFILE_PHOTO', publicIdPrefix = '') => {
  try {
    const options = UPLOAD_OPTIONS[uploadType] || UPLOAD_OPTIONS.GENERAL;

    // Generate unique public ID
    const timestamp = Date.now();
    const publicId = publicIdPrefix ? `${publicIdPrefix}_${timestamp}` : `upload_${timestamp}`;

    const uploadOptions = {
      ...options,
      public_id: publicId,
      use_filename: false,
      unique_filename: true,
    };

    let result;

    // If fileData is a buffer (from Multer memory storage)
    if (Buffer.isBuffer(fileData)) {
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve(result);
          }
        });
        uploadStream.end(fileData);
      });
    } else if (typeof fileData === 'string') {
      // If fileData is a file path or base64 string
      result = await cloudinary.uploader.upload(fileData, uploadOptions);
    } else {
      throw new Error('Invalid file data — must be Buffer or file path string');
    }

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width || null,
      height: result.height || null,
      resourceType: result.resource_type,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// ─── Delete File from Cloudinary ─────────────
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required to delete file');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    if (result.result === 'ok') {
      console.info(`✅ File deleted from Cloudinary: ${publicId}`);
      return { success: true, publicId };
    } else if (result.result === 'not found') {
      console.warn(`⚠️  File not found in Cloudinary: ${publicId}`);
      return { success: true, publicId, notFound: true };
    } else {
      throw new Error(`Cloudinary delete failed: ${result.result}`);
    }
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

// ─── Delete Multiple Files ────────────────────
const deleteMultipleFromCloudinary = async (publicIds, resourceType = 'image') => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return { success: true, deleted: [] };
    }

    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
      invalidate: true,
    });

    console.info(`✅ Deleted ${publicIds.length} files from Cloudinary`);
    return {
      success: true,
      deleted: Object.keys(result.deleted),
      failed: result.partial ? Object.keys(result.failed) : [],
    };
  } catch (error) {
    console.error('❌ Cloudinary bulk delete error:', error.message);
    throw new Error(`Bulk file deletion failed: ${error.message}`);
  }
};

// ─── Get File Details ─────────────────────────
const getFileDetails = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width || null,
      height: result.height || null,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error('❌ Cloudinary get file error:', error.message);
    throw new Error(`Failed to get file details: ${error.message}`);
  }
};

// ─── Generate Optimized URL ───────────────────
// Generate a Cloudinary URL with on-the-fly transformations
const getOptimizedUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...transformations,
  };

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [defaultTransformations],
  });
};

// ─── Get Thumbnail URL ────────────────────────
const getThumbnailUrl = (publicId, width = 150, height = 150) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ],
  });
};

// ─── Extract Public ID from URL ───────────────
// Extracts the Cloudinary public ID from a full URL
const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;

  try {
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/filename.ext
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');

    if (uploadIndex === -1) return null;

    // Get everything after 'upload' and the version number
    const afterUpload = urlParts.slice(uploadIndex + 1);

    // Remove version number (starts with 'v' followed by numbers)
    const withoutVersion = afterUpload.filter((part) => !/^v\d+$/.test(part));

    // Join and remove file extension
    const publicIdWithExt = withoutVersion.join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

    return publicId;
  } catch (error) {
    console.error('❌ Error extracting public ID:', error.message);
    return null;
  }
};

// ─── Check if URL is Cloudinary URL ──────────
const isCloudinaryUrl = (url) => {
  if (!url) return false;
  return url.includes('res.cloudinary.com');
};

// ─── Upload Profile Photo ─────────────────────
// Specific helper for profile photos
const uploadProfilePhoto = async (fileBuffer, entityType, entityId) => {
  const prefix = `${entityType}_${entityId}`;
  return uploadToCloudinary(fileBuffer, 'PROFILE_PHOTO', prefix);
};

// ─── Upload Document ──────────────────────────
// Specific helper for documents
const uploadDocument = async (fileBuffer, entityType, entityId, docType) => {
  const prefix = `${entityType}_${entityId}_${docType}`;
  return uploadToCloudinary(fileBuffer, 'DOCUMENT', prefix);
};

// ─── Replace Old Photo ────────────────────────
// Delete old photo and upload new one
const replacePhoto = async (oldUrl, newFileBuffer, entityType, entityId) => {
  try {
    // Delete old photo if it exists and is a Cloudinary URL
    if (oldUrl && isCloudinaryUrl(oldUrl)) {
      const oldPublicId = extractPublicId(oldUrl);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId, 'image').catch((err) => {
          console.warn('⚠️  Could not delete old photo:', err.message);
        });
      }
    }

    // Upload new photo
    return await uploadProfilePhoto(newFileBuffer, entityType, entityId);
  } catch (error) {
    console.error('❌ Replace photo error:', error.message);
    throw new Error(`Failed to replace photo: ${error.message}`);
  }
};

// ─── Exports ──────────────────────────────────
module.exports = {
  cloudinary,
  verifyCloudinaryConnection,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getFileDetails,
  getOptimizedUrl,
  getThumbnailUrl,
  extractPublicId,
  isCloudinaryUrl,
  uploadProfilePhoto,
  uploadDocument,
  replacePhoto,
  UPLOAD_OPTIONS,
};
