// sendEmailRouter.ts
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  const { to, code } = req.body;

  if (!to || !code) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Create SendGrid transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",                     // must be literally "apikey"
      pass: process.env.SENDGRID_API_KEY, // your SendGrid API key
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Audit Management" <${process.env.SENDGRID_FROM}>`,
      to,
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
      html: `<p>Your verification code is: <strong>${code}</strong></p>`,
    });

    console.log(`[SENDGRID EMAIL SENT] Message ID: ${info.messageId} to ${to}`);
    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err: any) {
    console.error("[SENDGRID EMAIL ERROR]", err);
    res.status(500).json({ success: false, error: err.message || "Failed to send email" });
  }
});

export default router;
