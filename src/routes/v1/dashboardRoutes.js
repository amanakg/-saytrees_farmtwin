const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/v1/dashboardController');
const checkAuth = require('../../middlewares/auth');

router.get('/individual-tree', checkAuth, dashboardController.individualTreeValue);
router.get('/combined-tree', checkAuth, dashboardController.combinedTreeValue);

module.exports = router