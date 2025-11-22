// backend/server.js
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------
// Root endpoint
// ----------------------------
app.get("/", (_req, res) => {
  res.send("Email backend is running!");
});

// ----------------------------
// GMAIL SMTP Normal Email Route
// ----------------------------
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        message: "Missing 'to', 'subject', or 'text'.",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Audit App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    return res.json({ success: true, message: "Email sent successfully!" });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: err.message,
    });
  }
});

// ----------------------------
// SENDGRID OTP Route
// ----------------------------
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post("/api/send-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: "email & otp required",
    });
  }

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM,
    subject: "Your Verification Code",
    html: `
      <p>Your verification code is:</p>
      <h2>${otp}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ success: true, message: "OTP sent!" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "SendGrid Error",
    });
  }
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
