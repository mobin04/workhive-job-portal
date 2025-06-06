// const fetch = require('node-fetch');
const UAParser = require('ua-parser-js'); // Get Device Info.
const speakeasy = require('speakeasy'); // For OTP verficaion.
const jwt = require('jsonwebtoken');
const { createSendToken } = require('../middlewares/authMiddleware');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const filteredObject = require('../utils/filteredObject');
const handleFileUpload = require('../utils/fileUploads');
const Email = require('../utils/email');

// Get location based on IP
async function getGeoLocation(ip) {
  const response = await fetch(
    `https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_API_KEY}`
  );
  const data = await response.json();
  return data.city
    ? `${data.city}, ${data.region}, ${data.country}`
    : 'Unknown';
}

// Get IP Address
async function getPublicIP() {
  const response = await fetch('https://api64.ipify.org?format=json');
  const data = await response.json();
  return data.ip;
}

// Generate OTP and Secret Key
function generateOTP() {
  const otpSecret = speakeasy.generateSecret({ length: 20 }).base32;
  const otpToken = speakeasy.totp({
    secret: otpSecret,
    encoding: 'base32',
    step: 60,
  });

  return { otpSecret, otpToken };
}

// OTP Verification.
function otpVerification(otp, otpSecret) {
  const verify = speakeasy.totp.verify({
    secret: otpSecret,
    encoding: 'base32',
    token: otp,
    step: 60,
    window: 2,
  });

  return verify;
}

// Get Logged In User Info
async function getLoggedInUserInfo(req) {
  const parser = new UAParser();
  const ip = await getPublicIP();
  const location = await getGeoLocation(ip);
  const deviceInfo = parser.setUA(req.headers['user-agent']).getResult();

  const loginDetails = {
    location,
    device: {
      browser: deviceInfo.browser.name,
      // os: deviceInfo.os.name,
      type: deviceInfo.device.type || 'Desktop',
    },
  };
  return loginDetails;
}

// Request OTP for verification
exports.requestSignUpOtp = catchAsync(async (req, res, next) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    return next(
      new AppError('User already exists, Please login to continue', 400)
    );
  }

  const user = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
  };

  const { otpSecret, otpToken } = generateOTP();

  user.otpSecret = otpSecret;
  user.authType = 'signup';

  await new Email(user, '', { otpSecret: otpToken }).sendOtpEmail();

  createSendToken(user, 201, req, res, 'signup');
});

// /login
exports.requestLoginOtp = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide your credentials!', 400));
  }

  const existingUser = await User.findOne({ email }).select('+password');

  if (!existingUser) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  if (
    !(await existingUser.isPasswordCorrect(password, existingUser.password))
  ) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  const { otpSecret, otpToken } = generateOTP();

  await new Email(existingUser, '', {
    otpSecret: otpToken,
  }).sendLoginOtpEmail();

  existingUser.otpSecret = otpSecret;
  createSendToken(existingUser, 200, req, res, 'login');
});

// Verifify OTP and create Account.
exports.verifyOtpAndGetToken = catchAsync(async (req, res, next) => {
  const { otp, mode } = req.body;

  if (!['login', 'signup'].includes(mode)) {
    return next(
      new AppError(
        'Please select your correct mode either signup or login',
        400
      )
    );
  }

  let otpSecret;
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Unauthorized request! :(', 401));
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(new AppError('Token expired! Request a new OTP.', 403));
  }

  otpSecret = decoded.otpSecret;

  const verify = otpVerification(otp, otpSecret);

  if (!verify) {
    return next(new AppError('Invalid or Expired OTP', 403));
  }

  if (mode === 'signup') {
    if (decoded.authType !== 'signup') {
      return next(
        new AppError(
          'You are trying to login! Please select mode to <login>',
          400
        )
      );
    }
    const { name, email, password, role } = decoded;
    const user = await User.create({ name, email, password, role });
    await new Email(user, '', '').sendWelcome();
    return createSendToken(user, 201, req, res, 'getRealToken');
  }

  if (mode === 'login') {
    if (decoded.authType !== 'login') {
      return next(
        new AppError(
          'You are trying to signup! Please select mode to <signup>',
          400
        )
      );
    }
    const logginUserId = decoded.userId;
    const loggingUser = await User.findById(logginUserId);

    const loggedUserInfo = await getLoggedInUserInfo(req);
    await new Email(loggingUser, '', { loggedUserInfo }).sendLoginEmail();

    return createSendToken(loggingUser, 201, req, res, 'getRealToken');
  }
});

// /logout
exports.logout = (req, res) => {
  res.clearCookie('jwt', { httpOnly: true });
  res.status(200).json({
    message: 'Logout successfully :)',
  });
};

// /profile
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('No user found!', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// /profile (patch)
exports.updateProfile = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(new AppError('This route is not for password update', 400));
  }

  const filteredProperty = filteredObject(req.body, 'name', 'email');

  if (req.file) {
    // Delete old Coverimage
    await handleFileUpload.deleteImage('coverImage', req.user.id);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Upload new Coverimage
    filteredProperty.coverImage = await handleFileUpload.uploadImage(
      req.file,
      'coverImage',
      req.user.id
    );
  }

  const user = await User.findByIdAndUpdate(req.user.id, filteredProperty, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});
