import { Request, Response } from 'express';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';
import PendingOTP from '../models/PendingOTP.js';
import { generateOTP, hashOTP, OTP_EXPIRY_MS, OTP_EXPIRY_SECONDS } from '../utils/otp.js';
import { sendEmail } from '../utils/email.js';
import { getCookieOptions , clearCookieOptions} from '../utils/cookieOptions.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    // Check if email already has a verified account
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    // Hash password now — safe to store in PendingOTP temporarily
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Delete any existing pending OTP for this email (resend scenario)
    await PendingOTP.deleteOne({ email });

    // Store registration data + OTP hash temporarily
    await PendingOTP.create({
      name,
      email,
      password: hashedPassword,
      otpHash,
      expiresAt,
      attempts: 0,
    });

    // Send OTP email
    await sendEmail(email, otp);

    res.status(200).json({
      message: `OTP sent to your email. It is valid for ${OTP_EXPIRY_SECONDS} seconds. Please verify to complete registration.`,
      email, // send back so frontend knows which email to show on OTP screen
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ── VERIFY OTP → check hash, create real user, return JWT ─
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' });
      return;
    }

    // Find the pending OTP document for this email
    const pending = await PendingOTP.findOne({ email });

    if (!pending) {
      res.status(400).json({
        message: 'OTP expired or not found. Please register again.',
      });
      return;
    }

    // Check if OTP has expired (double check — TTL handles cleanup but
    // there's a small window where doc exists but is expired)
    if (pending.expiresAt < new Date()) {
      await PendingOTP.deleteOne({ email });
      res.status(400).json({ message: 'OTP has expired. Please register again.' });
      return;
    }

    // Track wrong attempts — lock after 5 tries
    if (pending.attempts >= 5) {
      await PendingOTP.deleteOne({ email });
      res.status(400).json({
        message: 'Too many wrong attempts. Please register again.',
      });
      return;
    }

    // Hash the incoming OTP and compare
    const incomingHash = hashOTP(otp);

    if (incomingHash !== pending.otpHash) {
      // Increment wrong attempt counter
      await PendingOTP.updateOne({ email }, { $inc: { attempts: 1 } });

      const attemptsLeft = 4 - pending.attempts;
      res.status(400).json({
        message: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
      });
      return;
    }

    // ── OTP is correct — now create the real user ──────────
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password, // already hashed
      provider: 'local',
    });

    // Clean up the pending OTP document
    await PendingOTP.deleteOne({ email });

    // Generate JWT and return — user is now logged in
    const token = generateToken(user._id);

    // ── SET COOKIE instead of returning token in body ─────
    res.cookie('token', token, getCookieOptions());

    // ── Only return user — NO token in body anymore ───────
    res.status(201).json({
      message: 'Email verified. Account created successfully.',
      user: {
        id:     user._id,
        name:   user.name,
        email:  user.email,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// ── RESEND OTP → generate fresh OTP, replace old, resend ──
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Check if there's a pending registration for this email
    const pending = await PendingOTP.findOne({ email });

    if (!pending) {
      res.status(400).json({
        message: 'No pending registration found. Please register first.',
      });
      return;
    }

    // Generate a brand new OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Replace old OTP hash, reset expiry and attempts
    await PendingOTP.updateOne(
      { email },
      {
        otpHash,
        expiresAt,
        attempts: 0,   // reset wrong attempt counter
      }
    );

    // Resend the email with new OTP
    await sendEmail(email, otp);

    res.status(200).json({
      message: `A new OTP has been sent to your email. It is valid for ${OTP_EXPIRY_SECONDS} seconds.`,
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP resend' });
  }
};






export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid email ' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid  password' });
      return;
    }
    const token = generateToken(user._id);

    // ── SET COOKIE instead of returning token in body ─────
    res.cookie('token', token, getCookieOptions());

    // ── Only return user — NO token in body anymore ───────
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email) {
      res.status(400).json({ message: 'Google auth data missing' });
      return;
    }

    let user = await User.findOne({ googleId });

    if (!user) {

      user = await User.findOne({ email });

      if (user) {
        user.googleId = googleId;
        user.provider = 'google';
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          googleId,
          avatar,
          provider: 'google',
        });
      }
    }
    const token = generateToken(user._id);
    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error during Google auth' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token', clearCookieOptions());
  res.status(200).json({ message: 'Logged out successfully' });
};
