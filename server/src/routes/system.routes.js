'use strict';

const express = require('express');
const router = express.Router();

const systemController = require('../controllers/system.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { uploadImage } = require('../utils/fileUpload.util');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');

router.use(protect);

const adminRoles = ['super_admin', 'admin'];

router.get('/dashboard', systemController.getDashboard);
router.get('/health', authorizeRoles(...adminRoles), systemController.getHealth);
router.get('/settings', systemController.getSettings);
router.patch('/settings', authorizeRoles(...adminRoles), systemController.updateSettings);
router.post('/logo', authorizeRoles(...adminRoles), uploadLimiter, uploadImage.single('logo'), systemController.uploadLogo);
router.get('/audit-logs', authorizeRoles(...adminRoles), systemController.getAuditLogs);

module.exports = router;
