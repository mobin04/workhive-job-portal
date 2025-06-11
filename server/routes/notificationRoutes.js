const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');
const isValidObjectId = require('../middlewares/isValidObjectId');

const router = express.Router();

router.use(authMiddleware.protect);
router.get('/', notificationController.getAllNotification);
router.delete('/:id', isValidObjectId, notificationController.deleteNotification);

module.exports = router;