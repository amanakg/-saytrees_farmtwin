const express = require('express');
const router = express.Router();
const loginController = require('../../controllers/v1/loginController');
const otpRateLimiter = require('../../middlewares/otpLimiter')
const checkAuth = require('../../middlewares/auth')

router.post('/send-otp', otpRateLimiter, loginController.sendOTP)
router.post('/verify-otp', loginController.verifyOTP)
router.post('/logout',loginController.logout)
router.post('/refresh-token', loginController.accessRefreshToken)

module.exports = router;
