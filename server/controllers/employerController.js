const Job = require('../models/jobModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getJobByEmployer = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Employer ID

  if (req.user.id.toString() !== id && !['admin'].includes(req.user.role)) {
    return next(
      new AppError('You are not allowed to view jobs for this employer', 403)
    );
  }

  const jobs = await Job.find({ employer: id })
    .populate('employer', 'name email coverImage')
    .populate({
      path: 'applications',
      select: 'status applicant createdAt',
      populate: {
        path: 'applicant',
        select: 'name email coverImage',
      },
    })
    .lean();

  if (!jobs.length) {
    return res.status(200).json({
      status: 'success',
      message: 'No job found with this employer',
      data: { jobs: [] },
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Jobs fetched successfully',
    totalJobs: jobs.length,
    data: {
      jobs,
    },
  });
});
