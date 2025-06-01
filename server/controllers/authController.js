const { createSendToken } = require('../middlewares/authMiddleware');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const filteredObject = require('../utils/filteredObject');
const handleFileUpload = require('../utils/fileUploads');

// /register
exports.registerUser = catchAsync(async (req, res, next) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    return next(
      new AppError('User already exists, Please login to continue', 400)
    );
  }

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
  });

  const coverImageUrl = await handleFileUpload.uploadImage(
    req.file,
    'coverImage',
    newUser.id
  );

  newUser.coverImage = coverImageUrl;
  await newUser.save();

  createSendToken(newUser, 201, req, res);
});

// /login
exports.loginUser = catchAsync(async (req, res, next) => {
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

  createSendToken(existingUser, 200, req, res);
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
    // Delete old image
    await handleFileUpload.deleteImage('coverImage', req.user.id);
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
