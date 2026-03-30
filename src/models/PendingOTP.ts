import mongoose, { Document, Schema } from 'mongoose';

export interface IPendingOTP extends Document {
  name: string;
  email: string;
  password: string;      // already hashed — safe to store temporarily
  otpHash: string;       // SHA-256 hash of the OTP, never raw
  expiresAt: Date;       // 60 seconds from creation
  attempts: number;      // track wrong attempts — max 5
  createdAt: Date;
}

const PendingOTPSchema = new Schema<IPendingOTP>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,         // bcrypt hash stored here temporarily
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ── TTL index — MongoDB auto-deletes expired docs ─────────
// This runs a background job that removes documents where
// expiresAt is in the past. No cron job needed.
PendingOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── One pending OTP per email at a time ───────────────────
PendingOTPSchema.index({ email: 1 }, { unique: true });

export default mongoose.model<IPendingOTP>('PendingOTP', PendingOTPSchema);
