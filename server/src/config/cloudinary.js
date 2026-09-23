'use strict';

let cloudinary;
let cloudinaryAvailable = false;

try {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  cloudinaryAvailable = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (cloudinaryAvailable) {
    console.info('Cloudinary configured successfully');
  } else {
    console.warn('Cloudinary credentials missing - file uploads will use local storage');
  }
} catch (e) {
  console.warn('Cloudinary not available:', e.message);
}

const { FILE_UPLOAD } = require('./constants');
const path = require('path');
const fs = require('fs');

const verifyCloudinaryConnection = async () => {
  if (!cloudinaryAvailable) return false;
  try {
    const result = await cloudinary.api.ping();
    return result.status === 'ok';
  } catch (error) {
    console.warn('Cloudinary ping failed:', error.message);
    return false;
  }
};

const uploadToCloudinary = async (fileData, uploadType = 'PROFILE_PHOTO', publicIdPrefix = '') => {
  if (!cloudinaryAvailable) {
    // Fall back to local storage
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `${publicIdPrefix || 'upload'}_${Date.now()}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    if (Buffer.isBuffer(fileData)) fs.writeFileSync(filepath, fileData);
    const url = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${filename}`;
    return { success: true, url, publicId: filename, format: 'jpg', size: fileData.length || 0 };
  }

  const options = { folder: `kat-school/${uploadType.toLowerCase()}`, resource_type: 'auto', overwrite: true };
  const timestamp = Date.now();
  const publicId = publicIdPrefix ? `${publicIdPrefix}_${timestamp}` : `upload_${timestamp}`;

  let result;
  if (Buffer.isBuffer(fileData)) {
    result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ ...options, public_id: publicId }, (err, res) => {
        if (err) reject(new Error(err.message));
        else resolve(res);
      });
      stream.end(fileData);
    });
  } else {
    result = await cloudinary.uploader.upload(fileData, { ...options, public_id: publicId });
  }

  return {
    success: true,
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
    width: result.width || null,
    height: result.height || null,
  };
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!cloudinaryAvailable || !publicId) return { success: true };
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    return { success: true, publicId };
  } catch (e) {
    console.warn('Cloudinary delete failed:', e.message);
    return { success: false };
  }
};

const deleteMultipleFromCloudinary = async (publicIds, resourceType = 'image') => {
  if (!cloudinaryAvailable || !publicIds || publicIds.length === 0) return { success: true, deleted: [] };
  try {
    const result = await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType, invalidate: true });
    return { success: true, deleted: Object.keys(result.deleted), failed: [] };
  } catch (e) {
    return { success: false, deleted: [], failed: publicIds };
  }
};

const getOptimizedUrl = (publicId, transformations = {}) => {
  if (!cloudinaryAvailable || !publicId) return publicId;
  return cloudinary.url(publicId, { secure: true, transformation: [{ quality: 'auto:good', fetch_format: 'auto', ...transformations }] });
};

const getThumbnailUrl = (publicId, width = 150, height = 150) => {
  if (!cloudinaryAvailable || !publicId) return publicId;
  return cloudinary.url(publicId, { secure: true, transformation: [{ width, height, crop: 'fill', gravity: 'face', quality: 'auto:good', fetch_format: 'auto' }] });
};

const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex((p) => p === 'upload');
    if (uploadIndex === -1) return null;
    const after = parts.slice(uploadIndex + 1).filter((p) => !/^v\d+$/.test(p));
    return after.join('/').replace(/\.[^/.]+$/, '');
  } catch (e) { return null; }
};

const isCloudinaryUrl = (url) => url && url.includes('res.cloudinary.com');

const uploadProfilePhoto = async (fileBuffer, entityType, entityId) =>
  uploadToCloudinary(fileBuffer, 'PROFILE_PHOTO', `${entityType}_${entityId}`);

const uploadDocument = async (fileBuffer, entityType, entityId, docType) =>
  uploadToCloudinary(fileBuffer, 'DOCUMENT', `${entityType}_${entityId}_${docType}`);

const replacePhoto = async (oldUrl, newFileBuffer, entityType, entityId) => {
  if (oldUrl && isCloudinaryUrl(oldUrl)) {
    const oldId = extractPublicId(oldUrl);
    if (oldId) await deleteFromCloudinary(oldId, 'image').catch(() => {});
  }
  return uploadProfilePhoto(newFileBuffer, entityType, entityId);
};

const getFileDetails = async (publicId, resourceType = 'image') => {
  if (!cloudinaryAvailable) return { success: false };
  try {
    const r = await cloudinary.api.resource(publicId, { resource_type: resourceType });
    return { success: true, url: r.secure_url, publicId: r.public_id, format: r.format, size: r.bytes };
  } catch (e) { return { success: false }; }
};

const UPLOAD_OPTIONS = {};

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
