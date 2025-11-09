// 4 digit OTP generator
export const generateOtp = (length: number = 4): string => {
  const min = Math.pow(10, length - 1); // 1000
  const max = Math.pow(10, length) - 1; // 9999
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};
