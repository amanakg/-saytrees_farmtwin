const express = require('express');
const router = express.Router();
const simulationController = require('../../controllers/v1/simulationController');
const validate = require('../../middlewares/validate');
const { saveSimulationSchema,getModelListSchema,getModelDetailsSchema } = require('../../validations/simulationvalidation')
const checkAuth = require("../../middlewares/auth");

router.post(
  '/save-simulation',
  checkAuth,
  validate(saveSimulationSchema, 'body'),
  simulationController.startSimulation
);
router.get(
  '/model-list',
  checkAuth,
  validate(getModelListSchema, 'query'),
  simulationController.getModelList
);
router.get(
  '/model-details',
  checkAuth,
  validate(getModelDetailsSchema, 'query'),
  simulationController.getModelDetails
);
module.exports = router;
