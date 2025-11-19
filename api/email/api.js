import express from "express";
import cors from "cors";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Check Env Vars
if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ Missing SENDGRID_API_KEY");
}
if (!process.env.EMAIL_FROM) {
  console.error("❌ Missing EMAIL_FROM");
}

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Default route
app.get("/", (req, res) => {
  res.send("SendGrid Email Backend is running!");
});

// MAIN ROUTE → Send OTP
app.post("/send-email", async (req, res) => {
  try {
    const { to, code, subject, text } = req.body;

    if (!to || !code) {
      return res.status(400).json({ success: false, error: "Missing email or code" });
    }

    const msg = {
      to,
      from: process.env.EMAIL_FROM, // VERIFIED SENDGRID SENDER
      subject: subject || "Your Verification Code",
      html: `
        <p>Your verification code is:</p>
        <h1 style="font-size:32px; letter-spacing:4px;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
    };

    await sgMail.send(msg);

    return res.status(200).json({
      success: true,
      message: "Verification email sent!",
    });

  } catch (err) {
    console.error("SendGrid Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
      details: err.response?.body?.errors || null
    });
  }
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
