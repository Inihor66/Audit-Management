// routes/emailRoutes.js
import express from "express";
import sgMail from "@sendgrid/mail";

// Router initialization
const router = express.Router();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST /api/send-otp
router.post("/send-otp", async (req, res) => {
  try {
    const { email, code } = req.body;

    console.log("Incoming OTP request:", req.body);

    if (!email || !code) {
      return res.status(400).json({ success: false, error: "email & code required" });
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM,
      subject: "Your Audit App verification code",
      html: `
        <div style="font-family: Arial; padding: 10px;">
          <h3>Audit App Verification Code</h3>
          <p>Your verification code is:</p>
          <h2 style="background: #f4f4f4; display: inline-block; padding: 10px;">${code}</h2>
          <p>This code is valid for 10 minutes.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("SendGrid Error:", err.response?.body || err);

    return res.status(500).json({
      success: false,
      error: "Failed to send OTP email",
      details: err.response?.body || err.message,
    });
  }
});

export default router;
