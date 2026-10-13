const express = require('express');
const router = express.Router();
const landController = require('../../controllers/v1/landController');
const validate = require('../../middlewares/validate');
const { createLandSchema, getLandListSchema, renameLandSchema, landRemoveSchema } = require('../../validations/landvalidation')
const checkAuth = require("../../middlewares/auth");
const {uploadFarmImage} = require('../../middlewares/upload')
const { farmImageCleanup } = require('../../middlewares/profileImageCleanup')

router.post(
  '/create-land',
  checkAuth,
  validate(createLandSchema, 'body'),
  landController.createLand
);

router.get('/land-list',checkAuth,validate(getLandListSchema,'query'),landController.getLandList)
router.patch('/rename/:profile_id/:land_id', checkAuth, validate(renameLandSchema, 'body'), landController.renameLand)
router.delete('/:land_id', checkAuth, validate(landRemoveSchema), landController.deleteLand)

router.post(
  '/save-model',
  checkAuth,
   // ✅ wrapper function
    (req, res, next) => {
      uploadFarmImage.single('farmImage')(req, res, function (err) {
  
        // ✅ Handle multer errors
        if (err) {
  
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              status: 0,
              message: 'File size should not exceed 10MB'
            });
          }
  
          return res.status(400).json({
            status: 0,
            message: err.message || 'File upload error'
          });
        }
  
        next(); // ✅ continue if no error
      });
    },
  farmImageCleanup,
  landController.saveModel
);

module.exports = router;