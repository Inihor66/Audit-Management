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
// Gmail Email Route (Normal Email)
// ----------------------------
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        message: "Missing 'to', 'subject', or 'text' field.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("SMTP Verified ✅");

    const info = await transporter.sendMail({
      from: `"Audit App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("Email sent:", info.messageId);

    return res.json({
      success: true,
      message: "Email sent successfully!",
    });

  } catch (error) {
    console.error("Email Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email.",
      error: error.message,
    });
  }
});

// ----------------------------
// SENDGRID OTP ROUTE
// ----------------------------
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, error: "Email is required" });
  }

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
      message: "OTP sent successfully!",
      otp, // remove later
    });
  } catch (error) {
    console.error("SendGrid Error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Error sending email",
    });
  }
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
