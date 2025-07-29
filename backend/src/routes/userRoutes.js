const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.route('/register').post(registerUser);
router.route('/login').post(authUser);

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.get('/', (req, res) => {
  res.json({ 
    message: 'User Management API', 
    endpoints: [
      'POST /register',
      'POST /login',
      'GET /profile (protected)',
      'PUT /profile (protected)'
    ]
  });
});

module.exports = router;
