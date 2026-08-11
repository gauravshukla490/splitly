import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// Short-lived — 15 min. Ye har protected request ke saath bhejta hai
export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
}

// Long-lived — 7 din. Sirf naya access token lene ke liye use hota hai
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

// Token verify karta hai — invalid/expired hone pe error throw karega
export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as { userId: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string };
}