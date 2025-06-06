const Job = require('../models/jobModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const filteredObject = require('../utils/filteredObject');
const handleFileUpload = require('../utils/fileUploads');

const uploadCompanyLogo = async (file, jobId, next) => {
  try {
    const companyLogoUrl = await handleFileUpload.uploadImage(file, 'companyLogo', jobId);
    return companyLogoUrl;
  } catch (err) {
    return next(
      new AppError(
        `${
          err.message ||
          'Something went wrong while uploading company logo, Please try updating your company logo again!'
        }`,
        500,
      ),
    );
  }
};

// Get all jobs
exports.getAllJobs = catchAsync(async (req, res, next) => {
  const jobService = new APIFeatures(req.query).paginate().sort().filter();

  const jobs = await jobService.fetchJobs();

  if (jobs.length === 0) {
    return next(new AppError('No Jobs Found :)', 404));
  }

  const totalJobs = await Job.countDocuments(jobService.filters);
  const totalPages = Math.ceil(totalJobs / jobService.pagination.limit);

  res.status(200).json({
    status: 'success',
    length: jobs.length,
    totalJobs,
    totalPages,
    data: {
      jobs,
    },
  });
});

// Create new Job.
exports.createNewJob = catchAsync(async (req, res, next) => {
  const filteredProperty = filteredObject(
    req.body,
    'title',
    'description',
    'company',
    'location',
    'salaryMinPerMonth',
    'salaryMaxPerMonth',
    'jobType',
    'geoLocation',
    'jobLevel',
    'category',
  );

  const newJob = await Job.create({
    ...filteredProperty,
    employer: req.user.id,
  });

  if (req.file) {
    const companyLogoUrl = await uploadCompanyLogo(req.file, newJob.id, next);
    newJob.companyLogo = companyLogoUrl;
    await newJob.save();
  }

  res.status(201).json({
    status: 'success',
    message: 'Job created successfully!',
    data: {
      job: newJob,
    },
  });
});

// Get job by jobId
exports.getSingleJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const job = await Job.findById(id).populate('employer').lean();

  if (!job) {
    return next(new AppError('No job found belong to that id', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      job,
    },
  });
});

// Update job by id
exports.updateJob = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;

  // check if job exist with that given id
  const isJobExist = await Job.findById(jobId);

  if (!isJobExist) {
    return next(new AppError('No job found with that id', 404));
  }

  if (isJobExist.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not allowed to update this job :)', 403));
  }

  // Get the required fields only
  const filteredProperty = filteredObject(
    req.body,
    'title',
    'description',
    'company',
    'location',
    'jobType',
    'jobLevel',
    'geoLocation',
    'salaryMinPerMonth',
    'salaryMaxPerMonth',
    'category',
  );

  // Check if user does't pass anything in the reqest body
  if (Object.keys(filteredProperty).length === 0) {
    return next(new AppError('No valid field provided for update', 400));
  }

  if (req.file) {
    const companyLogoUrl = await uploadCompanyLogo(req.file, newJob.id, next);
    newJob.companyLogo = companyLogoUrl;
    await newJob.save();
  }

  const updatedJob = await Job.findByIdAndUpdate(jobId, filteredProperty, {
    new: true,
    runValidators: true,
  });

  if (!updatedJob) {
    return next(new AppError('Error while updating job'));
  }

  res.status(200).json({
    status: 'success',
    message: 'Job data successfully updated!',
    data: {
      job: updatedJob,
    },
  });
});

// Delete job by id
exports.deleteJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const job = await Job.findById(id);

  if (!job) {
    return next(new AppError('No job found with that given id', 404));
  }

  if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not allowed to delete this job :)', 403));
  }

  await job.deleteOne();

  res.status(204).json({
    data: 'success',
    message: 'job deleted',
  });
});

// Renew job to 30 days
exports.renewJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const job = await Job.findById(id);

  if (!job) {
    return next(new AppError('No job found with that ID!', 404));
  }

  if (job.employer._id.toString() !== req.user.id && !['admin'].includes(req.user.role)) {
    return next(new AppError('You dont have permission to renew this job!', 403));
  }

  if (job.isRenewed) {
    return next(new AppError('You already renewed this job', 400));
  }
  await job.renewExpiration();
  (job.status = 'open'), await job.save();

  res.status(201).json({
    status: 'success',
    message: 'Job expiration extended by 30 days! and the job status remains open',
    data: {
      renewedJob: job,
    },
  });
});

// Close job
exports.closeJob = catchAsync(async (req, res, next) => {
  const { id } = req.params; // JOB ID

  const job = await Job.findById(id);

  if (!job) {
    return next(new AppError('No job found with that ID!', 404));
  }

  if (job.employer._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not allowed to close this job', 403));
  }

  if (job.status === 'closed') {
    return next(new AppError('This job is already closed!', 400));
  }

  job.status = 'closed';
  await job.save();

  res.status(200).json({
    status: 'success',
    message: 'Job successfully closed',
  });
});
