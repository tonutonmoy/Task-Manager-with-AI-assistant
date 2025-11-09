import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../errors/AppError';
import { generateToken } from '../../utils/generateToken';
import prisma from '../../utils/prisma';

import { generateOtp } from '../../utils/generateOtp';
import Email from '../../utils/sendMail'; // class import
import { firebasePushNotificationServices } from '../Firebase/firebasePushNotificationServices';

interface LoginPayload {
  email: string;
  password: string;
  fcmToken?: string;
}

const loginUserFromDB = async (payload: LoginPayload) => {
  const { email, password, fcmToken } = payload;

  const userData:any = await prisma.user.findFirst({ where: { email } });


  console.log(userData.twoFactor)

  if (!userData) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User Not Found');
  }
if (!userData.password) {
  throw new AppError(
    httpStatus.UNAUTHORIZED,
    'Please try Google login'
  );
}

  const isCorrectPassword = await bcrypt.compare(password, userData.password);
  console.log(password,'tonu')

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password incorrect');
  }

  // ✅ If twoFactor enabled → Send OTP via Email class
  if (userData.twoFactor) {
    const otp = generateOtp(4); // 4 digit OTP
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.user.update({
      where: { id: userData.id },
      data: {
        twoFactorOTP: otp,
        twoFactorOTPExpires: expiry,
        fcmToken: fcmToken || userData.fcmToken, // update fcmToken if provided
      },
    });

    // ✅ Send OTP email
    const emailService = new Email(userData);
    await emailService.sendPasswordReset(otp);
    console.log(userData.id)

    return {
      message: ' OTP sent to your email.',
      two_step_authentication: userData.twoFactor,
      
    };
  }

  // ✅ Update FCM token if provided
  if (fcmToken) {
    await prisma.user.update({
      where: { id: userData.id },
      data: { fcmToken },
    });
  }

  // ✅ Generate access token
  const accessToken = await generateToken(
    {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  return {
    name: userData.name,
    email: userData.email,
    profession:userData.skill,
    profileImage:userData.image,
    selectedFocusAreas:userData.focus,
    bigGoal:userData.goal,
    number:userData.number,
    accessToken,
  };
};

// ✅ Verify OTP Service (same as before)
const verifyTwoFactorOTP = async (email: string, otp: string, fcmToken?: string) => {
  const user = await prisma.user.findFirst({ where: { email } });

  if (!user || user.twoFactorOTP !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  if (user.twoFactorOTPExpires && user.twoFactorOTPExpires < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP expired');
  }

  // ✅ Update FCM token if provided
  if (fcmToken) {
    await prisma.user.update({
      where: { id: user.id },
      data: { fcmToken },
    });
  }

  // ✅ Generate access token
  const accessToken = await generateToken(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  // ✅ Clear OTP fields
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorOTP: null, twoFactorOTPExpires: null },
  });

  return {
 
    name: user.name,
    email: user.email,
    profession:user.skill,
    profileImage:user.image,
    selectedFocusAreas:user.focus,
    bigGoal:user.goal,
    number:user.number,
    accessToken,
  };
};
// 


const googleLogin = async (payload: { email: string; name?: string; fcmToken?: string ,image:string}) => {
  const { email, name, fcmToken ,image} = payload;

  if (!email) throw new AppError(httpStatus.BAD_REQUEST, 'Email is required for Google login');

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // password যদি null হয় → Google login/ signup allow
    if (user.password) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have registered with email/password. Please login manually.'
      );
    }

    // ফ্রন্টএন্ড থেকে FCM token update
    if (fcmToken) {
      await prisma.user.update({
        where: { email },
        data: { fcmToken },
      });
    }
  } else {
    // নতুন user create
    user = await prisma.user.create({
      data: {
        email,
        name: name || 'Google User',
        password: null,
        fcmToken: fcmToken || null,
        image
      },
    });
  }

  const token = generateToken(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwt.access_secret as Secret,
    '7d'
  );

  return { user, token };
};



const resendTwoFactorOTP = async (email: string) => {
  // ✅ User খুঁজে বের করা
  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.twoFactor) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Two-factor authentication is not enabled');
  }

  // ✅ নতুন OTP জেনারেট করা
  const otp = generateOtp(4); // 4 digit OTP
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // ✅ Database এ নতুন OTP এবং expiry আপডেট করা
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorOTP: otp,
      twoFactorOTPExpires: expiry,
    },
  });

  // ✅ OTP পাঠানো
  const emailService = new Email(user);
  await emailService.sendPasswordReset(otp);

  return {
    message: 'New OTP has been sent to your email',
    two_step_authentication: true,
  };
};




const changePassword = async (id: any, payload: any) => {
  // 1️⃣ User খুঁজে বের করা
  const userData = await prisma.user.findFirst({
    where: { id },
  });


  if (!userData) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found!');
  }
  console.log(userData.id,userData.name)
  // 2️⃣ Password null check
  if (!userData.password) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password not set for this user!');
  }

  // 3️⃣ Auto-hash old plain text password যদি hash না হয়
  if (!userData.password.startsWith('$2b$')) {
    const hashedOldPassword = await bcrypt.hash(userData.password, 12);
    await prisma.user.update({
      where: { id: userData.id },
      data: { password: hashedOldPassword },
    });
    userData.password = hashedOldPassword; // update local variable
  }

  // 4️⃣ Old password compare
  const isCorrectPassword = await bcrypt.compare(payload.oldPassword.trim(), userData.password);

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Password incorrect!');
  }

  // 5️⃣ নতুন password hash করা
  const hashedPassword = await bcrypt.hash(payload.newPassword, 12);

  // 6️⃣ Database update
  const updatedUser = await prisma.user.update({
    where: { id: userData.id },
    data: { password: hashedPassword },
  });

  // 7️⃣ Optional: Push notification
  // if (updatedUser && userData.fcmToken) {
  //   await firebasePushNotificationServices.sendSinglePushNotification({
  //     body: {
  //       title: 'Password Changed',
  //       body: 'Your password has been successfully changed.',
  //     },
  //     fcmToken: userData.fcmToken,
  //   });
  // }

  return {
    message: 'Password changed successfully!',
  };
};

export const AuthServices = { loginUserFromDB, verifyTwoFactorOTP,googleLogin,resendTwoFactorOTP,changePassword };
