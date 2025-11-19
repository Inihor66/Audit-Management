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
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Audit Management" <${process.env.EMAIL}>`,
      to,
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
      html: `<p>Your verification code is: <strong>${code}</strong></p>`, // Optional HTML
    });

    console.log(`[EMAIL SENT] Message ID: ${info.messageId} to ${to}`);
    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err: any) {
    console.error("[EMAIL ERROR]", err);
    res.status(500).json({ success: false, error: err.message || "Failed to send email" });
  }
});

export default router;
