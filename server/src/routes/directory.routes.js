'use strict';

const express = require('express');

const router = express.Router();

const directoryController = require('../controllers/directory.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/users', directoryController.searchUsers);

module.exports = router;
