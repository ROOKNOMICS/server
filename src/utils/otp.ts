import crypto from 'crypto';

export const OTP_EXPIRY_MS = 60 * 1000;
export const OTP_EXPIRY_SECONDS = OTP_EXPIRY_MS / 1000;

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOTP = (otp: string) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};
