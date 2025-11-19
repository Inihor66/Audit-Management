import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  const { to, code } = req.body;

  if (!to || !code) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL,       // Your Gmail
      pass: process.env.EMAIL_PASS,  // App password
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
    });

    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
