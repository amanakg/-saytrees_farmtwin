const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/v1/locationController');
const checkAuth = require("../../middlewares/auth")

router.get('/states', checkAuth, locationController.getStates);
router.get('/districts', checkAuth, locationController.getDistricts);
router.get('/blocks', checkAuth, locationController.getBlocks);
router.get('/villages', checkAuth, locationController.getVillages);


module.exports = router;
