const express = require('express');
const router = express.Router();
const simulationController = require('../../controllers/v1/simulationController');
const validate = require('../../middlewares/validate');
const {
  saveSimulationSchema,
  getModelListSchema,
  getModelDetailsSchema,
  editSimulationParamsSchema,
  editSimulationSchema
} = require('../../validations/simulationvalidation');
const checkAuth = require('../../middlewares/auth');

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

router.put(
  '/edit-simulation/:model_id',
  checkAuth,
  validate(editSimulationParamsSchema, 'params'),
  validate(editSimulationSchema),
  simulationController.updateSimulation
);

module.exports = router;
