const mongoose = require('mongoose');
const addIdVirtual = require('../utils/idVirtualPlugin');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job must have a title!'],
    },
    description: {
      type: String,
      required: [true, 'Job must have a description!'],
    },
    company: {
      type: String,
      required: [true, 'Job must belong to a company!'],
    },
    location: {
      type: String,
      required: [true, 'Job must have a location!'],
    },
    salary: {
      type: Number,
      min: [0, 'Salary must be a positive number!'],
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job must depend on the employer!'],
    },
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for improve performance.
jobSchema.index({ title: 1, location: 1, company: 1 });

// Add a virtual id field same as _id
jobSchema.plugin(addIdVirtual);

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
