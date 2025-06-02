const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const statisticsController = require('../controllers/statisticsController');

const router = express.Router();

router.get(
  '/users-by-role',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  statisticsController.getTotalUsersByRole
);

router.get(
  '/jobs',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  statisticsController.getJobStatistics
);

module.exports = router;
