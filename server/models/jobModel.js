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
    category: {
      type: String,
      required: [true, 'Job must have a catogory!'],
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'closed'],
        message: 'status must be open or close',
      },
      default: 'open',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: { type: Date, index: { expires: 2592000 } }, // TTL index for 30 days
    isRenewed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexing for improve performance.
jobSchema.index({ title: 'text', location: 'text', company: 'text' });

jobSchema.pre('save', function (next) {
  if (this.isNew) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

jobSchema.methods.renewExpiration = function () {
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  this.isRenewed = true;
  return this.save();
};

// Add a virtual id field same as _id
jobSchema.plugin(addIdVirtual);

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
