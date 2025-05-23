const mongoose = require('mongoose');
const addIdVirtual = require('../utils/idVirtualPlugin');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Application must belong to a job!'],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application must belong to a user'],
    },
    resumeUrl: {
      type: String,
      required: [true, 'Application must have a resume url!'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected'],
      },
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ job: 1, applicant: 1 });

// Add a virtual id field same as _id
applicationSchema.plugin(addIdVirtual);

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
