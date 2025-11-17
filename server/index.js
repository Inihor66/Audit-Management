// server/index.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sgMail from '@sendgrid/mail';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aarohipurwar06@gmail.com';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("Warning: SENDGRID_API_KEY not set!");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: '10mb' }));

// ----------------------
// DEFAULT SAFE ROUTE → FIXES YOUR ERROR
// ----------------------
app.get("/", (req, res) => {
  res.json({
    freeEntries: [],   // IMPORTANT FIX
    message: "AuditFlow backend running",
  });
});

// Health Check
app.get('/health', (req, res) => res.json({ ok: true }));

// ---------------------------------------------
// SEND EMAIL VERIFICATION USING SENDGRID
// ---------------------------------------------
app.post('/email/send-verification', async (req, res) => {
  try {
    const { userId, email, code, expiresAt } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Missing email or code' });
    }

    const verifyUrl =
      `${FRONTEND_ORIGIN}/verify?userId=${encodeURIComponent(userId || '')}&code=${encodeURIComponent(code)}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM,
      subject: "AuditFlow — Email Verification Code",
      text: `Your verification code is ${code}. It expires at ${new Date(expiresAt).toLocaleString()}.
Open verification link: ${verifyUrl}`,
      html: `
        <p>Your verification code is <strong>${code}</strong>.</p>
        <p>It expires at <strong>${new Date(expiresAt).toLocaleString()}</strong>.</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
      `,
    };

    await sgMail.send(msg);

    console.log("Sent verification email to:", email);
    return res.json({ ok: true });

  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
});

app.listen(PORT, () => {
  console.log(`AuditFlow server listening on port ${PORT}`);
});
