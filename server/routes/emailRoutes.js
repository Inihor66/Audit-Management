// routes/emailRoutes.js
import express from "express";
import sgMail from "@sendgrid/mail";

const router = express.Router();

// SET SENDGRID KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST /api/send-otp
router.post("/send-otp", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email & code are required" });
  }

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM, // verified sender
    subject: "Your Audit App verification code",
    text: `Your verification code is: ${code}`,
    html: `
      <div style="font-family: Arial; padding: 12px;">
        <h3>Your Verification Code</h3>
        <h2>${code}</h2>
        <p>Valid for 10 minutes.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    return res.json({ success: true });
  } catch (err) {
    console.error("SendGrid Error:", err.response?.body || err);
    return res.status(500).json({
      error: "Failed to send email",
      details: err.response?.body || err.message,
    });
  }
});

export default router;
