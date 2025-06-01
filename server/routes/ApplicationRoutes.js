const express = require('express');
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../config/multerConfig');

const router = express.Router();

router.post('/', authMiddleware.protect,upload.single('resume'), applicationController.applyJob);

module.exports = router;
