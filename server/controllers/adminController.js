const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get all users for admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const apiFeatures = new APIFeatures(req.query).paginate().sort().filter();

  const users = await User.find(apiFeatures.filters)
    .sort(apiFeatures.sorting)
    .skip(apiFeatures.pagination.skip)
    .limit(apiFeatures.pagination.limit)
    .lean();

  const countUsers = await User.countDocuments();

  if (countUsers === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No users Found!',
      data: { user: [] },
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Users fetched successfully!',
    totalUsers: countUsers,
    totalPages: Math.ceil(countUsers / (apiFeatures.pagination.limit || 10)),
    currentPage: parseInt(req.query.page) || 1,
    hasNextPage:
      (req.query.page || 1) <
      Math.ceil(countUsers / (apiFeatures.pagination.limit || 10)),
    hasPrevPage: (req.query.page || 1) > 1,
    data: {
      users,
    },
  });
});

// Delete users by id
exports.deleteUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params; // user ID

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  await User.findByIdAndDelete(id);

  await Application.deleteMany({ applicant: id });

  if (user.role === 'employer') {
    await Job.deleteMany({ employer: id });
  }

  res.status(200).json({
    status: 'success',
    message: 'User and all associated records successfully deleted!',
  });
});

