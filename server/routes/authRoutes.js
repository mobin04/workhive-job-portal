const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../config/multerConfig');

const router = express.Router();

// Signup
router.post('/request-signup-otp', authController.requestSignUpOtp);
router.post('/verify-signup-otp', authController.verifyOptAndRegister);

// Login
router.post('/login', authController.loginUser);

//Logout
router.post('/logout', authController.logout);
router
  .route('/profile')
  .get(authMiddleware.protect, authController.getUser)
  .patch(
    authMiddleware.protect,
    upload.single('coverImage'),
    authController.updateProfile
  );

module.exports = router;
