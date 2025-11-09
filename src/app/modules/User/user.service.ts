import prisma from '../../utils/prisma';
import bcrypt from 'bcrypt';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { generateOtp } from '../../utils/generateOtp';
import { generateToken } from '../../utils/generateToken';
import config from '../../../config';
import Email from '../../utils/sendMail';
import { Secret } from 'jsonwebtoken';



import crypto from "crypto";
import { User } from '@prisma/client';




interface UserPayload {
  name: string;
  email: string;
  password?: string;
  fcmToken?: string;
}

const registerUserIntoDB = async (payload: UserPayload) => {
  // 1️⃣ Random password generate
  const plainPassword =
    payload.password || crypto.randomBytes(6).toString('hex');

  // 2️⃣ Hash করে DB তে save করা
  const hashedPassword: string = await bcrypt.hash(plainPassword, 12);

  // 3️⃣ Duplicate check
  const existingUser = await prisma.user.findFirst({
    where: { email: payload?.email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User already exists!');
  }

  // 4️⃣ Generate OTP + expiry
  const otp = generateOtp(4); // 4 digit OTP
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 মিনিট

  // 5️⃣ User create (status = PENDING / inactive initially)
  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      fcmToken: payload.fcmToken || null,
      twoFactor: true, // ✅ নতুন ফিল্ড দরকার (Boolean)
      twoFactorOTP: otp,
      twoFactorOTPExpires: expiry,
    },
  });

  if(newUser){

    await prisma.microGoal.create({
      data:{
        userId:newUser.id
      }
    })
  }

  // 6️⃣ Send OTP via email
  const emailService = new Email(newUser);
  await emailService.sendPasswordReset(otp);

  return {
    message: 'Verification OTP sent to your email. Please verify to activate account.',
    
  };
};

const requestPasswordReset = async (email: string) => {
  if (!email) throw new AppError(httpStatus.BAD_REQUEST, 'Email is required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email');

  const otp = generateOtp(4); // 4-digit OTP
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const tempToken = generateToken(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    '5m'
  );

  await prisma.user.update({
    where: { email },
    data: { otp, otpExpiry, forgetPasswordToken: tempToken, forgetPasswordTokenExpires: otpExpiry },
  });

  const emailSender = new Email(user);
  await emailSender.sendCustomEmail(
    'Your Password Reset Code',
    `Your 4-digit OTP is <b>${otp}</b>. It will expire in 5 minutes.`
  );

  return { message: 'OTP sent to email', tempToken };
};

const verifyOtp = async (email: string, otp: string, token: string) => {
  if (!email || !otp || !token) 
    throw new AppError(httpStatus.BAD_REQUEST, 'All fields are required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email');

  if (user.otp !== otp) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  if (!user.forgetPasswordToken || user.forgetPasswordToken !== token)
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired token');
  if (user.forgetPasswordTokenExpires && user.forgetPasswordTokenExpires < new Date())
    throw new AppError(httpStatus.BAD_REQUEST, 'Token expired');

  // ✅ Generate new temporary token for password reset
  const newTempToken = generateToken(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwt.access_secret as Secret,
    '5m'
  );

  // ✅ Update user with new token and expiry
  const newExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await prisma.user.update({
    where: { email },
    data: {
      forgetPasswordToken: newTempToken,
      forgetPasswordTokenExpires: newExpiry,
    },
  });

  return {
    message: 'OTP verified successfully',
    tempToken: newTempToken, // ফ্রন্টএন্ডে password reset এর জন্য
  };
};


const resetPassword = async (email: string, token: string, newPassword: string) => {
  if (!email ||  !token || !newPassword)
    throw new AppError(httpStatus.BAD_REQUEST, 'All fields are required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email');

 
  if (!user.forgetPasswordToken || user.forgetPasswordToken !== token)
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired token');
  if (user.forgetPasswordTokenExpires && user.forgetPasswordTokenExpires < new Date())
    throw new AppError(httpStatus.BAD_REQUEST, 'Token expired');

  // ✅ Ensure password is not empty before hashing
  if (!newPassword.trim()) throw new AppError(httpStatus.BAD_REQUEST, 'Password cannot be empty');

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
      forgetPasswordToken: null,
      forgetPasswordTokenExpires: null,
    },
  });

  return { message: 'Password reset successfully' };
};



//  get profile

const getProfile = async (id: string) => {
  const result = await prisma.user.findFirst({where:{id},select:{id:true,name:true,number:true,skill:true,email:true,address:true,image:true}})

 return result
};
// update user


//  get All user

const getAllUsers = async () => {
  const result = await prisma.user.findMany({select:{id:true,name:true,number:true,skill:true,email:true,address:true,image:true}})

 return result
};


// update user

//  get single user

const getSingleUser = async (id: string) => {
  const result = await prisma.user.findFirst({where:{id},select:{id:true,name:true,number:true,skill:true,email:true,address:true,image:true}})

 return result
};
// update user

const updateUser = async (id: string, payload: any) => {
  const result = await prisma.user.update({
    where: { id },
    data: {
      ...payload, // spread করে সব field update হবে
    },
  });

  return  {id: result.id};
};




// send parent Approval OTP
 const parentApproval = async (id: string, payload: any) => {

    const parentEmail = payload?.parentEmail;
     

      const user= await prisma.user.findFirst({where:{id}})


      if(!user){
 throw new AppError(httpStatus.NOT_FOUND, 'User not found');
      }
      if(user.email===payload.parentEmail){
 throw new AppError(httpStatus.NOT_ACCEPTABLE, 'User email and parent email are same!');
      }


    // 1️⃣ User update
    const result = await prisma.user.update({
      where: { id },
      data: {
        ...payload,
      },
    });

    // 2️⃣ Parent email-এ OTP পাঠানো
    let otp: string | null = null;
    if (parentEmail) {
      otp = generateOtp(4); // 4-digit OTP
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 মিনিটের জন্য expiry

      // OTP এবং expiry database-এ save
      await prisma.user.update({
        where: { id },
        data: {
          parentOTP: otp,
          parentOTPExpiry: otpExpiry,
        },
      });

      const parentUser = { email: parentEmail, name: result.name }; 
      const emailService = new Email(parentUser as any);

      await emailService.sendCustomEmail(
        "Parent Approval OTP Verification",
        `Hello, your child (${result.name}) wants to use the app. Please verify by entering this OTP: <b>${otp}</b>. OTP is valid for 5 minutes.`
      );
    }

    // 3️⃣ Response
    return {
      success: true,
      message: parentEmail
        ? `User updated. OTP sent to parent (${parentEmail}) for verification.`
        : "User updated successfully, no parent email provided",
      data: { id: result.id },
    };

};



const verifyParentOtp = async (userId: string, otp: string) => {

  

    // 1️⃣ User fetch
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    console.log(otp,user?.parentOTP)

    // 2️⃣ OTP check
    if (!user.parentOTP) {
      return { success: false, message: "No OTP generated for this user" };
    }

    if (user.parentOTP !== otp) {
      return { success: false, message: "Invalid OTP" };
    }

    // 3️⃣ Expiry check
    if (!user.parentOTPExpiry || user.parentOTPExpiry < new Date()) {
      return { success: false, message: "OTP expired" };
    }

    // 4️⃣ OTP valid, parent approved
    await prisma.user.update({
      where: { id: userId },
      data: {
        isParentEmailVerified: true, // schema-এ parentApproved boolean ধরে নেই
        parentOTP: null,
        parentOTPExpiry: null,
      },
    });

    return { success: true, message: "Parent verified successfully" };

};


const getUserNotification = async (id: string) => {
  const result = await prisma.notification.findMany({
    where: { userId:id },
    
  });

  return  result;
};


const updateTwoFactorAuthentication = async (userId: string,data:boolean) => {

  
  const result = await prisma.user.update({
    where: { id:userId },
    data:{
      twoFactor:data
    },
    select:{id:true,twoFactor:true}
    
  });

  return  result;
};


const resendParentOtp = async (userId: string) => {
  // 1️⃣ User খুঁজে বের করা
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!user.parentEmail) {
    throw new AppError(httpStatus.BAD_REQUEST, "Parent email not provided");
  }

  // 2️⃣ নতুন OTP তৈরি
  const otp = generateOtp(4);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  // 3️⃣ Database এ save করা
  await prisma.user.update({
    where: { id: userId },
    data: {
      parentOTP: otp,
      parentOTPExpiry: otpExpiry,
    },
  });

  // 4️⃣ Parent Email এ OTP পাঠানো
  const parentUser = { email: user.parentEmail, name: user.name };
  const emailService = new Email(parentUser as any);

  await emailService.sendCustomEmail(
    "Parent OTP Resend Verification",
    `Hello, your child (${user.name}) requested OTP resend. Please verify with this OTP: <b>${otp}</b>. OTP valid for 5 minutes.`
  );

  return {
    success: true,
    message: `OTP resent successfully to parent (${user.parentEmail})`,
  };
};


// const togglemicroGoal = async (userId: string,data) => {
//   const result = await prisma.microGoal.update({
//     where: { userId: },
    
//   });

//   return  result;
// };

export const UserServices = {
  requestPasswordReset,
  verifyOtp,
  resetPassword,
  updateUser,
  parentApproval,
  verifyParentOtp,
  getProfile,
  registerUserIntoDB,
  getAllUsers,
  getSingleUser,
  getUserNotification,
  resendParentOtp,
  updateTwoFactorAuthentication
};
