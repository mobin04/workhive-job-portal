const Job = require('../models/jobModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get total registered users by role
exports.getTotalUsersByRole = catchAsync(async (req, res, next) => {
  const userStatistics = await User.aggregate([
    { $group: { _id: '$role', totalUsers: { $sum: 1 } } },
    { $project: { _id: 0, role: '$_id', totalUsers: 1 } },
  ]);

  if (!userStatistics) {
    return next(new AppError('No statistics found!', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'successfully fetched total registered users by role!',
    data: {
      statistics: userStatistics,
    },
  });
});

// Jobs Posted (Monthly Trends & Employer Insights)
exports.getJobStatistics = catchAsync(async (req, res, next) => {
  const jobStatistics = await Job.aggregate([
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
        },
        totalPosted: { $sum: 1 },
        totalApplications: { $sum: { $size: '$applications' } }, // Count total applications per job
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        year: '$_id.year',
        totalPosted: 1,
        totalApplications: 1, // Track total applications
      },
    },
  ]);

  const employerStatistics = await Job.aggregate([
    {
      $group: {
        _id: '$employer',
        totalJobs: { $sum: 1 },
      },
    },
    { $sort: { totalJobs: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'employerDetails',
      },
    },
    {
      $project: {
        _id: 0,
        employerId: '$_id',
        totalJobs: 1,
        employerName: { $arrayElemAt: ['$employerDetails.name', 0] },
      },
    },
  ]);

  const categoryStatistics = await Job.aggregate([
    {
      $group: {
        _id: '$category',
        totalJobs: { $sum: 1 },
        totalApplications: { $sum: { $size: '$applications' } }, // Count applications in each category
      },
    },
    { $sort: { totalJobs: -1 } }, // Sort by most active industries
    {
      $project: {
        _id: 0,
        category: '$_id',
        totalJobs: 1,
        totalApplications: 1, // Include application count
      },
    },
  ]);

  if (
    jobStatistics.length === 0 ||
    employerStatistics.length === 0 ||
    categoryStatistics.length === 0
  ) {
    return next(new AppError('No job statistics available', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Successfully fetched job statistics',
    data: {
      monthlyTrends: jobStatistics,
      topEmployers: employerStatistics,
      categoryTrends: categoryStatistics,
    },
  });
});
