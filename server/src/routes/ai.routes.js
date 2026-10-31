'use strict';

const express = require('express');
const router = express.Router();

const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { aiLimiter } = require('../middleware/rateLimiter.middleware');

router.use(protect);

const writers = ['super_admin', 'admin', 'teacher'];

router.get('/status', aiController.getStatus);
router.post('/chatbot', aiLimiter, aiController.chatbot);
router.post('/notice-writer', aiLimiter, authorizeRoles(...writers), aiController.noticeWriter);
router.post('/report-comment', aiLimiter, authorizeRoles(...writers), aiController.reportComment);
router.post('/exam-questions', aiLimiter, authorizeRoles(...writers), aiController.examQuestions);

module.exports = router;
