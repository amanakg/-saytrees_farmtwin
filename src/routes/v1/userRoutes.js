const express = require('express');
const router = express.Router();
const userController = require('../../controllers/v1/userController');
const validate = require('../../middlewares/validate');
const {uploadProfileImage} = require('../../middlewares/upload')
const {profileImageCleanup} = require('../../middlewares/profileImageCleanup');
const checkAuth = require("../../middlewares/auth");

const {
  createProfileSchema,
  getProfileSchema,
  updateProfileSchema
} = require('../../validations/uservalidation');


router.get('/profile',checkAuth, validate(getProfileSchema, 'query'), userController.getProfile);

router.post(
  '/createProfile',
  checkAuth,
  validate(createProfileSchema, 'body'),
  userController.createProfile
);

router.put(
  '/updateProfile/:profile_id',
  checkAuth,
  // ✅ wrapper function
  (req, res, next) => {
    uploadProfileImage.single('profile_pic')(req, res, function (err) {

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
  profileImageCleanup,
  validate(updateProfileSchema, 'body'),
  userController.updateProfile
);

module.exports = router;
