import {Resend} from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const isResendConfigured = !!RESEND_API_KEY && !RESEND_API_KEY.includes("placeholder");

const resend = new Resend(RESEND_API_KEY);

export async function sendOtpEmail(toEmail :string , otp : string){

   if (!isResendConfigured) {
     console.log(`[DEV] OTP for ${toEmail}: ${otp}`);
     return;
   }

   const { error } = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: toEmail,
  subject: 'verify your splitly account',
  html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
});

   if (error) {
     console.error(`[Resend] Failed to send OTP email to ${toEmail}:`, error);
     console.log(`[DEV] OTP for ${toEmail}: ${otp}`);
   }
}

export default sendOtpEmail;