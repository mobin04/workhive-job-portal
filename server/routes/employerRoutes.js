const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const isValidObjectId = require('../middlewares/isValidObjectId');
const employerController = require('../controllers/employerController');

const router = express.Router();

router.get(
  '/:id/jobs',
  authMiddleware.protect,
  authMiddleware.restrictTo('employer', 'admin'),
  isValidObjectId,
  employerController.getJobByEmployer
);

module.exports = router;
