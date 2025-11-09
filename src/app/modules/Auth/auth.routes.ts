import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthControllers } from './auth.controller';
import { authValidation } from './auth.validation';
import auth from '../../middlewares/auth';
const router = express.Router();

router.post(
  '/login',
  validateRequest(authValidation.loginUser),
  AuthControllers.loginUser,
);
router.post('/google-login', AuthControllers.googleLogin);
router.post('/two-factor-verify-otp', AuthControllers.verifyOtp);
router.post('/two-factor-verify-otp/resend', AuthControllers.resendTwoFactorOTP);
router.put(
  '/change-password',
  auth(),
  AuthControllers.changePassword,
);

export const AuthRouters = router;
