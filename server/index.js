// server/index.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sgMail from '@sendgrid/mail';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// IMPORTANT: Set frontend origin (Change when deployed)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// ENV validation
if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ Missing SENDGRID_API_KEY in .env");
}
if (!process.env.SENDGRID_FROM) {
  console.error("❌ Missing SENDGRID_FROM in .env");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ---------- MIDDLEWARE ----------
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

app.use(bodyParser.json({ limit: "10mb" }));

// ---------- TEST ROUTES ----------
app.get("/", (_req, res) => res.json({ message: "AuditFlow backend running" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- SEND VERIFICATION EMAIL ----------
app.post("/email/send-verification", async (req, res) => {
  try {
    const { userId, email, code, expiresAt } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Missing email or code" });
    }

    // Verification link
    const verifyUrl = `${FRONTEND_ORIGIN}/verify?userId=${encodeURIComponent(
      userId || ""
    )}&code=${encodeURIComponent(code)}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM,
      subject: "AuditFlow — Email Verification Code",
      text: `Your verification code is ${code}. It expires at ${new Date(
        expiresAt
      ).toLocaleString()}.`,
      html: `
        <p>Your verification code is <strong>${code}</strong>.</p>
        <p>Expires at: <strong>${new Date(expiresAt).toLocaleString()}</strong></p>
        <p><a href="${verifyUrl}">Click here to verify your email</a></p>
      `,
    };

    const response = await sgMail.send(msg);

    return res.json({
      ok: true,
      status: Array.isArray(response) ? response[0].statusCode : 202,
    });
  } catch (err) {
    console.error("❌ Email send error:", err);
    const details = err?.response?.body?.errors || null;

    return res.status(500).json({
      error: "Failed to send email",
      details,
    });
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 AuditFlow server running on port ${PORT}`);
});
