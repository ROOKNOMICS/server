import { Resend } from 'resend';
import { OTP_EXPIRY_SECONDS } from './otp.js';

export const sendEmail = async (email: string, otp: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'ROOKNOMICS <no-reply@thisissud.space>',
      to: email,
      subject: 'Verify your ROOKNOMICS account',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Verify your email</h2>
          <p>Use the OTP below to complete your registration. It expires in <strong>${OTP_EXPIRY_SECONDS} seconds</strong>.</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e293b;">
              ${otp}
            </span>
          </div>
          <p style="color: #64748b; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send error:', err);
    // Re-throw so the controller can return a proper error to the client
    // instead of silently succeeding while the email never arrives.
    throw new Error('Failed to send OTP email. Please try again.');
  }
};
