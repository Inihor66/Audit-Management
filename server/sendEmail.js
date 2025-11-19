import express, { Request, Response } from "express";
import nodemailer from "nodemailer";

const router = express.Router();

interface EmailRequestBody {
  to: string;
  code: string;
}

router.post("/send-email", async (req: Request, res: Response) => {
  const { to, code } = req.body as EmailRequestBody;

  if (!to || !code) {
    return res.status(400).json({ error: "Missing parameters: 'to' and 'code' are required." });
  }

  // SendGrid SMTP Transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
      user: "apikey", // MUST be exactly "apikey"
      pass: process.env.SENDGRID_API_KEY,
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

    return res.json({
      success: true,
      message: `Email sent successfully to ${to}`,
    });

  } catch (error: any) {
    console.error("[SENDGRID EMAIL ERROR]", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to send email",
    });
  }
});

export default router;
