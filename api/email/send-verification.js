import { Request, Response } from "express";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM as string, // Must be a verified SendGrid sender
    subject: "Your Verification Code",
    html: `
      <p>Your verification code is:</p>
      <h2>${otp}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  try {
    await sgMail.send(msg);

    return res.status(200).json({
      success: true,
      message: "Verification email sent",
      otp, // remove if you don't want to return OTP
    });
  } catch (err: any) {
    console.error("SendGrid Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Failed to send email",
    });
  }
}

