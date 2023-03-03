const express = require('express')
const router = express.Router()
const authController = require('../controllers/Auth/AuthControllers')
const loginLimiter = require('../middleware/loginLimiter')



router.route('/register').post(loginLimiter, authController.UserRegister)

router.route('/login').post(loginLimiter, authController.UserLogin)

router.route('/refresh').get(authController.refresh)

router.route('/logout').post(authController.UserLogout)

module.exports = router
