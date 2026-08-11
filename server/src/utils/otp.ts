// 6-digit random OTP generate karta hai
export function generateOtp(): string {
  // Math.random() 0 se 1 ke beech ek decimal deta hai
  // Isse 100000-999999 ke range me convert kar rahe hain (hamesha 6 digit ka number)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}