const Job = require('../models/jobModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const filteredObject = require('../utils/filteredObject');

// Get all jobs
exports.getAllJobs = catchAsync(async (req, res, next) => {
  const jobs = await Job.find().lean();

  if (!jobs || jobs.length === 0) {
    return next(new AppError('No jobs found :(', 404));
  }

  res.status(200).json({
    status: 'success',
    length: jobs.length,
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
    'salary'
  );

  const newJob = await Job.create({
    ...filteredProperty,
    employer: req.user.id,
  });

  if (!newJob) {
    return next(new AppError('Something went wrong', 500));
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

  // Get the required fields only 
  const filteredProperty = filteredObject(
    req.body,
    'title',
    'description',
    'company',
    'location',
    'salary'
  );

  // Check if user does't pass anything in the reqest body
  if (Object.keys(filteredProperty).length === 0) {
    return next(new AppError('No valid field provided for update', 400));
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

  if (job.employer.toString() !== req.user.id) {
    return next(new AppError('No job found with that given id', 404));
  }

  await job.deleteOne();

  res.status(204).json({
    data: 'success',
    message: 'job deleted',
  });
});
