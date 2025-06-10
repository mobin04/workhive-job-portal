const Notification = require('../models/notificationModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllNotification = async (req, res) => {
  const userId = req.user.id;

  const notification = await Notification.find({ userId });

  res.status(200).json({
    status: 'success',
    message:
      notification.length > 0 ? 'Notification fetched successfully' : 'No notification found!',
    data: {
      notification,
    },
  });
};

exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId: req.user.id,
  });

  if (!notification) {
    return next(new AppError('No notifications found!', 404));
  }

  res.status(204).json({
    status: 'success',
    message: 'Notification successfully deleted!',
  });
});
