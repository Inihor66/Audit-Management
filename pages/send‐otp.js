import express from "express";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST /send-otp
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Your Verification Code",
    html: `
      <p>Your verification code is:</p>
      <h2>${otp}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  try {
    await sgMail.send(msg);

    res.status(200).json({
      success: true,
      message: "Verification email sent",
      otp, // REMOVE IN PRODUCTION
    });
  } catch (error) {
    console.error("SendGrid Error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to send email",
    });
  }
});

export default router;
