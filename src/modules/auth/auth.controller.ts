import { Router } from 'express'
import { validation } from '../../middleware/validation.middleware'
import authService from './auth.service'
import * as validators from './auth.validation'


const router = Router()

router.post('/signup' , validation(validators.signup), authService.signup)
router.post('/login',validation(validators.login), authService.login)
router.patch(
  '/confirmEmail',
  validation(validators.confirmEmail),
  authService.confirmEmail
)
router.patch(
  '/newConfirmEmail',
  validation(validators.newConfirmEmail),
  authService.newConfirmEmail
)

router.post("/login/gmail",validation(validators.loginByGmail),authService.loginByGmail)
router.post("/signup/gmail",validation(validators.signupByGmail),authService.signupByGmail)

router.patch("/forgotPassword",validation(validators.updatePassword),authService.forgotPassword )
router.patch("/verifyForgotPassword",validation(validators.verifyForgotPassword),authService.verifyForgotPassword )
router.patch("/newConfirmPasswordOtp",validation(validators.confirmPasswordOtp),authService.newConfirmPassword )

export default router
