// routes/emailRoutes.js
import express from "express";
import sgMail from "@sendgrid/mail";

const router = express.Router();

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// OTP EMAIL ROUTE
router.post("/send-otp", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "email & code required" });
  }

  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM, // verified sender
      subject: "Your Audit App Verification Code",
      text: `Your OTP is: ${code}`,
      html: `
        <div style="font-family: Arial; padding: 12px;">
          <h2>Your Verification Code</h2>
          <p>Your OTP is:</p>
          <h1 style="background:#f2f2f2;padding:10px;display:inline-block;">
            ${code}
          </h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return res.json({ success: true, message: "OTP sent successfully!" });

  } catch (err) {
    console.error("SendGrid Error:", err.response?.body || err);
    return res.status(500).json({
      error: "Failed to send email",
      details: err.response?.body || err.message,
    });
  }
});

export default router;
