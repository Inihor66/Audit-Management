import express from "express";
import cors from "cors";
import sgMail from "@sendgrid/mail";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// IMPORTANT → Check Env Vars
if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ Missing SENDGRID_API_KEY");
}
if (!process.env.EMAIL_FROM) {
  console.error("❌ Missing EMAIL_FROM");
}

// Set SendGrid Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ROUTE → Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // OTP Generate
    const otp = Math.floor(100000 + Math.random() * 900000);

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM, // must match SendGrid verified email
      subject: "Your Verification OTP",
      html: `
        <p>Your verification code is:</p>
        <h1>${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      `
    };

    await sgMail.send(msg);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });

  } catch (err) {
    console.error("SendGrid Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
      details: err.response?.body?.errors || null,
    });
  }
});

// SERVER START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

<button
    type="submit"
    className={`signup-btn ${
        role === Role.FIRM ? 'firm' : role === Role.STUDENT ? 'student' : 'admin'
    }`}
>
    Sign Up
</button>

<button
    type="button"
    className="back-btn"
    onClick={() => onNavigate('welcome')}
>
    Back
</button>
