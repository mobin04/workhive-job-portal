const express = require('express');
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../config/multerConfig');
const isValidObjectId = require('../middlewares/isValidObjectId');

const router = express.Router();

router.post(
  '/',
  authMiddleware.protect,
  upload.single('resume'),
  applicationController.applyJob
);

router.get(
  '/withdrawn',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  applicationController.getWithdrawnApplication
);

router
  .route('/:id')
  .get(
    authMiddleware.protect,
    isValidObjectId,
    applicationController.getApplicationByApplicantId
  )
  .patch(
    authMiddleware.protect,
    isValidObjectId,
    authMiddleware.restrictTo('employer', 'admin'),
    applicationController.updateApplicationStatus
  )
  .delete(
    authMiddleware.protect,
    isValidObjectId,
    authMiddleware.restrictTo('job_seeker', 'admin'),
    applicationController.withdrawApplication
  );

module.exports = router;
