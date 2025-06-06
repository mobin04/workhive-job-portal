const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Job = require('../models/jobModel');
const Application = require('../models/applicationModel');
const handleFileUpload = require('../utils/fileUploads');
const APIFeatures = require('../utils/apiFeatures');
const Email = require('../utils/email');

// Create new application
exports.applyJob = catchAsync(async (req, res, next) => {
  const { job } = req.body;

  let resumeUrl = '';

  const isJobExist = await Job.findById(job);
  if (!isJobExist) {
    return next(new AppError('No job found with that id', 404));
  }

  const isApplicationExist = await Application.findOne({
    applicant: req.user.id,
    job,
  });

  if (isApplicationExist) {
    return next(new AppError('Application already exists!', 400));
  }

  if (!req.file) {
    return next(new AppError('Resume is required!, Please upload your resume :)', 400));
  }

  const application = await Application.create({
    job,
    applicant: req.user.id,
    resumeUrl: 'Uploading...',
  });

  try {
    resumeUrl = await handleFileUpload.uploadImage(req.file, 'resume', application.id);
    application.resumeUrl = resumeUrl;
    await application.save();
  } catch (err) {
    return next(new AppError(err.message || 'Resume upload failed!, Please try again :(', 500));
  }

  await Job.findByIdAndUpdate(job, {
    $addToSet: { applications: application._id },
  });

  res.status(201).json({
    status: 'success',
    message: 'Application successfully created',
    data: {
      application,
    },
  });
});

// Get application by applicant id.
exports.getApplicationByApplicantId = catchAsync(async (req, res, next) => {
  const { id } = req.params; // <= APPLICANT ID

  if (req.user.id !== id && !['employer', 'admin'].includes(req.user.role)) {
    return next(new AppError('You are not allowed to view this application', 403));
  }

  const application = await Application.find({ applicant: id })
    .populate('applicant', 'name email coverImage')
    .populate({
      path: 'job',
      select: '-applications',
      populate: {
        path: 'employer',
        select: 'name email coverImage id',
      },
    })
    .select('-__v')
    .lean();

  const applicationCount = await Application.countDocuments({ applicant: id });
  if (applicationCount === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No applications found!',
      length: 0,
      data: { application: [] },
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Applications fetched successfully!',
    length: application.length,
    data: {
      application,
    },
  });
});

// Get applications by job id.
exports.getApplicationByJobId = catchAsync(async (req, res, next) => {
  const { id } = req.params; // <= JOB ID

  const job = await Job.findOne({ _id: id });

  if (job.employer.toString() !== req.user.id && !['admin'].includes(req.user.role)) {
    return next(
      new AppError('You are not allowed to view the applications belong to that job ID', 403),
    );
  }

  const apiFeatures = new APIFeatures(req.query).paginate().sort();

  // Pagination and sorting
  const application = await Application.find({ job: id })
    .populate({
      path: 'job',
      select: 'title company location',
      populate: {
        path: 'employer',
        select: 'name email coverImage id',
      },
    })
    .populate('applicant', 'name email id coverImage')
    .sort(apiFeatures.sorting)
    .skip(apiFeatures.pagination.skip)
    .limit(apiFeatures.pagination.limit)
    .lean();
  const applicationCount = await Application.countDocuments({ job: id });

  if (applicationCount === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No application found!',
      data: { application: [] },
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Application fetched successfully!',
    totalApplication: application.length,
    currentPage: parseInt(req.query.page) || 1,
    totalPages: Math.ceil(applicationCount / (apiFeatures.pagination.limit || 10)),
    data: {
      application,
    },
  });
});

// Updates application status
exports.updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return next(new AppError('Status must be accepted or rejected', 400));
  }

  const application = await Application.findByIdAndUpdate(
    id,
    { status },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate('applicant')
    .populate('job', 'title company');

  if (!application) {
    return next(new AppError('No application found with that id :(', 404));
  }

  const applicant = application.applicant;

  await new Email(applicant, '', { application }).sendApplicationStatusUpdate();

  res.status(201).json({
    status: 'success',
    message: `Application ${status}`,
    data: {
      application,
    },
  });
});

// Withdraw application
exports.withdrawApplication = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const application = await Application.findOne({
    _id: id,
    applicant: req.user.id,
  });

  if (!application) {
    return next(new AppError('No application found with that ID!', 404));
  }

  if (application.status !== 'pending') {
    return next(new AppError('You can only withdraw the pending applications', 400));
  }

  if (application.activeStatus === 'withdrawn') {
    return next(new AppError('Already withdrawn this application', 400));
  }

  application.activeStatus = 'withdrawn';
  application.status = 'withdrawn';
  application.expiresAt = new Date(); // Current Date for expire application in 30 days
  await application.save();

  await Job.findByIdAndUpdate(application.job, {
    $pull: { applications: application._id },
  });

  res.status(200).json({
    status: 'success',
    message: 'Application withdrawn successfully! It will be auto-deleted after 30 days.',
    data: {
      application,
    },
  });
});

// Get withdrawn application. (for admin only)
// eslint-disable-next-line no-unused-vars
exports.getWithdrawnApplication = async (req, res, next) => {
  const apiFeatures = new APIFeatures(req.query).paginate().sort();

  const application = await Application.find({
    activeStatus: 'withdrawn',
    expiresAt: { $exists: true },
  })
    .populate({
      path: 'job',
      select: 'company title location',
      populate: {
        path: 'employer',
        select: 'name email coverImage',
      },
    })
    .populate('applicant', 'name email coverImage')
    .sort(apiFeatures.sorting)
    .skip(apiFeatures.pagination.skip)
    .limit(apiFeatures.pagination.limit)
    .lean();

  const applicationCount = await Application.countDocuments({
    activeStatus: 'withdrawn',
  });

  if (applicationCount === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No application found!',
      data: { application: [] },
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Application fetched successfully!',
    totalApplication: application.length,
    currentPage: parseInt(req.query.page) || 1,
    totalPages: Math.ceil(applicationCount / (apiFeatures.pagination.limit || 10)),
    data: {
      application,
    },
  });
};
