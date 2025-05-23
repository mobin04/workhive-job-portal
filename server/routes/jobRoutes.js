const express = require('express');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const isValidObjectId = require('../middlewares/isValidObjectId');


const router = express.Router();

router
  .route('/')
  .get(authMiddleware.protect, jobController.getAllJobs)
  .post(authMiddleware.protect, authMiddleware.restrictTo('employer'), jobController.createNewJob);
router
  .route('/:id')
  .get(authMiddleware.protect, isValidObjectId, jobController.getSingleJob)
  .patch(authMiddleware.protect, isValidObjectId, jobController.updateJob)
  .delete(authMiddleware.protect, isValidObjectId, jobController.deleteJob);

module.exports = router;
