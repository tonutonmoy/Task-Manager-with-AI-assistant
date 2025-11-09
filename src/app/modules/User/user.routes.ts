import express from 'express';
import { UserControllers } from './user.controller';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidations } from './user.validation';

const router = express.Router();

// get all user 
router.get('/',auth(UserRoleEnum.ADMIN,UserRoleEnum.SUPERADMIN), UserControllers.getAllUsers);

// get single user
router.get('/:id',auth(UserRoleEnum.ADMIN,UserRoleEnum.SUPERADMIN,UserRoleEnum.USER), UserControllers.getSingleUser);

// register
router.post('/register', UserControllers.register);

// user update
router.put('/',auth(UserRoleEnum.USER,UserRoleEnum.ADMIN,UserRoleEnum.SUPERADMIN),UserControllers.updateUser);

//  my profile
router.get('/profile/me',auth(UserRoleEnum.USER,UserRoleEnum.ADMIN,UserRoleEnum.SUPERADMIN),UserControllers.getProfile);


// 1️⃣ Request OTP
router.post('/password/request-otp', UserControllers.requestPasswordReset);

// 2️⃣ Verify OTP
router.post('/password/verify-otp', UserControllers.verifyOtp);

// 3️⃣ Reset Password
router.post('/password/reset', UserControllers.resetPassword);

// parent approval send
router.put('/parent',  validateRequest(UserValidations.parentApproval),auth(UserRoleEnum.USER),  UserControllers.parentApproval);

router.put('/parent/verify-otp',auth(UserRoleEnum.USER),  UserControllers.verifyParentOtp);

router.post("/parent/resend-otp",auth(UserRoleEnum.USER), UserControllers.resendParentOtp);



router.get('/notification/me',auth(UserRoleEnum.ADMIN,UserRoleEnum.SUPERADMIN,UserRoleEnum.USER),  UserControllers.getUserNotification);
router.put('/twoFactor/authentication',auth(UserRoleEnum.ADMIN,UserRoleEnum.SUPERADMIN,UserRoleEnum.USER),  UserControllers.updateTwoFactorAuthentication);







export const UserRouters = router;
