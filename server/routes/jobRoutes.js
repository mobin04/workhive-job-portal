const express = require('express');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const isValidObjectId = require('../middlewares/isValidObjectId');
const applicationController = require('../controllers/applicationController');

const router = express.Router();

router
  .route('/')
  .get(authMiddleware.protect, jobController.getAllJobs)
  .post(
    authMiddleware.protect,
    authMiddleware.restrictTo('employer'),
    jobController.createNewJob
  );
router
  .route('/:id')
  .get(authMiddleware.protect, isValidObjectId, jobController.getSingleJob)
  .patch(
    authMiddleware.protect,
    authMiddleware.restrictTo('admin', 'employer'),
    isValidObjectId,
    jobController.updateJob
  )
  .delete(
    authMiddleware.protect,
    authMiddleware.restrictTo('admin', 'employer'),
    isValidObjectId,
    jobController.deleteJob
  );

router.patch(
  '/:id/renew-job',
  authMiddleware.protect,
  authMiddleware.restrictTo('employer', 'admin'),
  isValidObjectId,
  jobController.renewJob
);

router.patch(
  '/:id/close',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin', 'employer'),
  isValidObjectId,
  jobController.closeJob
);

router.get(
  '/:id/applications',
  authMiddleware.protect,
  authMiddleware.restrictTo('employer', 'admin'),
  isValidObjectId,
  applicationController.getApplicationByJobId
);

module.exports = router;
