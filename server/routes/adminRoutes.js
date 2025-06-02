const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const isValidObjectId = require('../middlewares/isValidObjectId');

const router = express.Router();

router.get(
  '/users',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  adminController.getAllUsers
);

router.delete('/users/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), isValidObjectId, adminController.deleteUserById)

module.exports = router;
