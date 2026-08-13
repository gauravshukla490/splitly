import {Resend} from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(toEmail :string , otp : string){

   await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: toEmail,
  subject: 'verify you splitly account',
  html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
});
}

export default sendOtpEmail;