const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User must have a name!'],
    },
    email: {
      type: String,
      required: [true, 'User must have an email!'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'User must have a password!'],
      minlength: [6, 'Password must have atleast 6-digit characters'],
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ['job_seeker', 'employer'],
        message: 'Please use job_seeker or employer in user role',
      },
      required: [true, 'User must have a role!'],
    },
    coverImage: {
      type: String,
      default:
        'https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg',
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

const User = mongoose.model('User', userSchema);
module.exports = User;
