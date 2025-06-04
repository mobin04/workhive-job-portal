const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../config/multerConfig');

const router = express.Router();

// Signup
router.post('/request-signup-otp', authController.requestSignUpOtp);

// Login
router.post('/request-login-otp', authController.requestLoginOtp);

// Verify OTP
router.post('/verify-otp', authController.verifyOtpAndGetToken);


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
