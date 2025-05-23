const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Login & register
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logout);
router
  .route('/profile')
  .get(authMiddleware.protect, authController.getUser)
  .patch(authMiddleware.protect, authController.updateProfile);

module.exports = router;
