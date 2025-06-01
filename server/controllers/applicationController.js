const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Job = require('../models/jobModel');
const Application = require('../models/applicationModel');
const handleFileUpload = require('../utils/fileUploads');

// Create new application
exports.applyJob = catchAsync(async (req, res, next) => {
  const { job } = req.body;

  let resumeUrl = '';

  const isJobExist = await Job.findById(job);
  if (!isJobExist) {
    return next(new AppError('No job found with that id', 404));
  }

  if (!req.file) {
    return next(new AppError('Resume is required!, Please upload your resume :)', 400));
  }

  const application = await Application.create({
    job,
    applicant: req.user.id,
    resumeUrl: 'Uploading...'
  });

  resumeUrl = await handleFileUpload.uploadImage(
    req.file,
    'resume',
    application.id
  );

  application.resumeUrl = resumeUrl;
  await application.save();

  res.status(201).json({
    status: 'success',
    message: 'Application successfully created',
    data: {
      application,
    },
  });
});

// Get application
exports.getEmployerApplication = catchAsync(async (req, res, next) => {});
