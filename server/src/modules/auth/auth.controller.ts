import { Request, Response } from "express";
import { db } from "../../db/index.js";              
import { users, otps } from "../../db/schema.js";     
import { eq, or } from "drizzle-orm";              
import { hashPassword } from "../../utils/hash.js";   
import { generateOtp } from "../../utils/otp.js";
import { sendOtpEmail } from "../../utils/sendEmail.js";
import { desc, and } from "drizzle-orm";

// modules/auth/auth.controller.ts (add karo signup ke neeche)

import { comparePassword } from "../../utils/hash.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";

export const signup = async (req: Request, res: Response) => {
  try {
    // Step 1: Client se data nikal lo request body se
    const { name, email, phone, password } = req.body;

    // Step 2: Basic validation — zaroori fields hain ya nahi
    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        message: "Name, password, and either email or phone are required",
      });
    }

    // Step 3: Duplicate check — email ya phone pehle se to nahi hai
    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          email ? eq(users.email, email) : undefined,
          phone ? eq(users.phone, phone) : undefined
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Step 4: Password ko hash karo — kabhi bhi plain password store nahi karte
    const passwordHash = await hashPassword(password);

    // Step 5: User ko DB me insert karo, isVerified false rahega by default
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        phone,
        passwordHash,
      })
      .returning(); // returning() se insert hui row wapas mil jati hai (id samet)

    // Step 6: OTP generate karo
    const otpCode = generateOtp();

    // 10 minute baad expire hoga
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Step 7: OTP ko DB me save karo
    await db.insert(otps).values({
      userId: newUser.id,
      code: otpCode,
      purpose: "signup_verification",
      expiresAt,
    });

    // Step 8: OTP email se bhejo (agar email diya hai)
    if (email) {
      await sendOtpEmail(email, otpCode);
    }

    // Step 9: Success response — password hash kabhi bhi response me mat bhejo
    return res.status(201).json({
      message: "Signup successful. OTP sent for verification.",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Step 1: Data nikalo
    const { identifier, password } = req.body; // identifier = email ya phone

    // Step 2: Validation
    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    // Step 3: User dhoondo email ya phone se
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.phone, identifier)))
      .limit(1);

    // Step 4: User nahi mila
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Step 5: Password match karo
    const isMatch = await comparePassword(password, user.passwordHash);

    // Step 6: Match nahi hua
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Step 7: Tokens generate karo
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Step 8: httpOnly cookies me set karo (JS se access nahi ho sakte, XSS-safe)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // production me sirf HTTPS pe
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 din
    });

    // Step 9: Response — password hash kabhi mat bhejna
    return res.status(200).json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};



export const verifyOtp = async (req: Request, res: Response) => {
  try {
   
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: "userId and code are required" });
    }

    
    const [otpRecord] = await db
      .select()
      .from(otps)
      .where(and(eq(otps.userId, userId), eq(otps.purpose, "signup_verification")))
      .orderBy(desc(otps.createdAt))
      .limit(1);

   
    if (!otpRecord) {
      return res.status(400).json({ message: "No OTP found, please request a new one" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    
    if (otpRecord.attemptCount >= 5) {
      return res.status(429).json({ message: "Too many attempts, request a new OTP" });
    }

    
    if (otpRecord.code !== code) {
      await db
        .update(otps)
        .set({ attemptCount: otpRecord.attemptCount + 1 })
        .where(eq(otps.id, otpRecord.id));

      return res.status(400).json({ message: "Invalid OTP" });
    }

    
    await db.update(users).set({ isVerified: true }).where(eq(users.id, userId));

    
    await db.delete(otps).where(eq(otps.id, otpRecord.id));

    
    return res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    
    const { identifier } = req.body; 

    if (!identifier) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

   
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.phone, identifier)))
      .limit(1);


    if (!user) {
      return res.status(200).json({
        message: "If an account exists, an OTP has been sent",
      });
    }

    
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  
    await db.insert(otps).values({
      userId: user.id,
      code: otpCode,
      purpose: "forgot_password",
      expiresAt,
    });

  
    if (user.email) {
      await sendOtpEmail(user.email, otpCode);
    }

    
    return res.status(200).json({
      message: "If an account exists, an OTP has been sent",
      userId: user.id, 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
  
    const { userId, code, newPassword } = req.body;

    if (!userId || !code || !newPassword) {
      return res.status(400).json({ message: "userId, code, and newPassword are required" });
    }

    
    const [otpRecord] = await db
      .select()
      .from(otps)
      .where(and(eq(otps.userId, userId), eq(otps.purpose, "forgot_password")))
      .orderBy(desc(otps.createdAt))
      .limit(1);

    
    if (!otpRecord) {
      return res.status(400).json({ message: "No OTP found, please request a new one" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    
    if (otpRecord.attemptCount >= 5) {
      return res.status(429).json({ message: "Too many attempts, request a new OTP" });
    }

    
    if (otpRecord.code !== code) {
      await db
        .update(otps)
        .set({ attemptCount: otpRecord.attemptCount + 1 })
        .where(eq(otps.id, otpRecord.id));

      return res.status(400).json({ message: "Invalid OTP" });
    }

    
    const newPasswordHash = await hashPassword(newPassword);

    
    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));

    
    await db.delete(otps).where(eq(otps.id, otpRecord.id));

  
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};