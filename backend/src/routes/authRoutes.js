const express = require('express');
const { authUser, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/login', authUser);
router.get('/me', protect, getUserProfile);

module.exports = router;
