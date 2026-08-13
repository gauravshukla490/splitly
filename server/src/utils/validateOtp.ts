import { db } from "../db/index.js";
import { otps } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";

const MAX_ATTEMPTS = 5;

type OtpPurpose = "signup_verification" | "forgot_password";

type ValidateOtpResult =
  | { valid: true; otpRecordId: string }
  | { valid: false; status: number; message: string };


export async function validateOtp(
  userId: string,
  code: string,
  purpose: OtpPurpose
): Promise<ValidateOtpResult> {
  const [otpRecord] = await db
    .select()
    .from(otps)
    .where(and(eq(otps.userId, userId), eq(otps.purpose, purpose)))
    .orderBy(desc(otps.createdAt))
    .limit(1);

  if (!otpRecord) {
    return { valid: false, status: 400, message: "No OTP found, please request a new one" };
  }

  if (new Date() > otpRecord.expiresAt) {
    return { valid: false, status: 400, message: "OTP expired" };
  }

  if (otpRecord.attemptCount >= MAX_ATTEMPTS) {
    return { valid: false, status: 429, message: "Too many attempts, request a new OTP" };
  }

  if (otpRecord.code !== code) {
    await db
      .update(otps)
      .set({ attemptCount: otpRecord.attemptCount + 1 })
      .where(eq(otps.id, otpRecord.id));
    return { valid: false, status: 400, message: "Invalid OTP" };
  }

  return { valid: true, otpRecordId: otpRecord.id };
}

export async function consumeOtp(otpRecordId: string) {
  await db.delete(otps).where(eq(otps.id, otpRecordId));
}