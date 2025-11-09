import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserServices } from './user.service';

// Step 1: Request OTP
const register = catchAsync(async (req, res) => {
 
  const result = await UserServices.registerUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: result.message,
    data: null
  });
});
// Step 1: Request OTP
const requestPasswordReset = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await UserServices.requestPasswordReset(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP sent successfully to your email address.',
    data: result,
  });
});

// Step 2: Verify OTP
const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp, token } = req.body;
  const result = await UserServices.verifyOtp(email, otp, token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully.',
    data: result,
  });
});

// Step 3: Reset Password
const resetPassword = catchAsync(async (req, res) => {
  const { email, token, newPassword } = req.body;
  const result = await UserServices.resetPassword(email, token, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password reset successfully.',
    data: result,
  });
});


// update user
const updateUser = catchAsync(async (req, res) => {
   const { userId } = req.user;
  const result = await UserServices.updateUser(userId,req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User update successfully.',
    data: result,
  });
});


// parent Approval 
const parentApproval = catchAsync(async (req, res) => {
   const { userId } = req.user;
  const result = await UserServices.parentApproval(userId,req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});


// parent OTP 
const verifyParentOtp = catchAsync(async (req, res) => {
   const { userId } = req.user;
  const result = await UserServices.verifyParentOtp(userId,req.body.otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

//  get profile data 
const getProfile = catchAsync(async (req, res) => {
   const { userId } = req.user;
  const result = await UserServices.getProfile(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "get my profile successfully",
    data: result,
  });
});


//  get profile data 
const getAllUsers = catchAsync(async (req, res) => {
  
  const result = await UserServices.getAllUsers();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "get my all profile successfully",
    data: result,
  });
});


//  get silgle data 
const getSingleUser = catchAsync(async (req, res) => {

  const result = await UserServices.getSingleUser(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "get my single profile successfully",
    data: result,
  });
});


//  get User Notification
const getUserNotification = catchAsync(async (req, res) => {
   const { userId } = req.user;
  const result = await UserServices.getUserNotification(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "get my Notifaction successfully",
    data: result,
  });
});


const resendParentOtp = catchAsync(async (req, res) => {
const { userId } = req.user;

  const result = await UserServices.resendParentOtp(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Parent OTP resent successfully",
    data: result,
  });
});
const updateTwoFactorAuthentication = catchAsync(async (req, res) => {
const { userId } = req.user;

  const result = await UserServices.updateTwoFactorAuthentication(userId,req.body.data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Update TwoFactor Authentication  successfully",
    data: result,
  });
});

export const UserControllers = {
  requestPasswordReset,
  verifyOtp,
  resetPassword,
  updateUser,
  parentApproval,
  verifyParentOtp,
  getProfile,
  register,
  getAllUsers,
  getSingleUser,
  getUserNotification,
  resendParentOtp,
  updateTwoFactorAuthentication
};
