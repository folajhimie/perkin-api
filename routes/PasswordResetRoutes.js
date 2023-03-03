const express = require('express');
const router = express.Router();
// const path = require('path');
const passwordResetController = require('../controllers/Auth/PasswordResetController')
const loginLimiter = require('../middleware/loginLimiter')


// router.route('/verify/').get(loginLimiter, passwordResetController.VerifyUniqueId)
router.route('/verify/:userId/:uniqueString').get(loginLimiter, passwordResetController.VerifyUniqueId)

router.route('/verified').get(passwordResetController.Verified)

router.route('/forgot-password/').post(loginLimiter, passwordResetController.ForgotPassword)

router.route("/send-otp/:resetToken").put(loginLimiter, passwordResetController.SendCode);

router.route("/get-code").post(loginLimiter, passwordResetController.GetCode);

router.route("/reset-password/:resetToken").post(loginLimiter, passwordResetController.ResetPassword)

// router.route('/logout').post(authController.UserLogout)

module.exports = router
