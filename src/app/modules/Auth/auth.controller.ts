import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';

// 🔹 Login controller
const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUserFromDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User logged in successfully',
    data: result,
  });
});

// ✅ Google login controller
const googleLogin = catchAsync(async (req, res) => {
  const { email, name, fcmToken,image } = req.body;

  const result = await AuthServices.googleLogin({ email, name, fcmToken,image });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Login successful',
    data: result,
  });
});

// 🔹 Verify OTP controller
const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const result = await AuthServices.verifyTwoFactorOTP(email, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully',
    data: result,
  });
});


const resendTwoFactorOTP = catchAsync(async (req, res) => {
  const { email } = req.body;

  const result = await AuthServices.resendTwoFactorOTP(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP resent successfully',
    data: result,
  });
});



const changePassword = catchAsync(async (req, res) => {

  console.log(req.user.userId)

  const result = await AuthServices.changePassword(req.user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password changed successfully',
    data: result,
  });
});


export const AuthControllers = { loginUser, verifyOtp,googleLogin,resendTwoFactorOTP ,changePassword};
