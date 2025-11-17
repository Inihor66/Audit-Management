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

app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Send verification email
app.post('/email/send-verification', async (req, res) => {
  try {
    const { userId, email, code, expiresAt } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Missing email or code' });
    }

    const verifyUrl = `${FRONTEND_ORIGIN}/verify?userId=${encodeURIComponent(
      userId || ''
    )}&code=${encodeURIComponent(code)}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM,
      subject: "AuditFlow — Email verification code",
      text: `Your verification code is ${code}. It expires at ${new Date(expiresAt).toLocaleString()}.
Open the verification link: ${verifyUrl}`,
      html: `<p>Your verification code is <strong>${code}</strong>. 
<p>It expires at <strong>${new Date(expiresAt).toLocaleString()}</strong>.</p>
<p><a href="${verifyUrl}">Open verification in the app</a></p>`
    };

    await sgMail.send(msg);

    console.log("Sent verification email:", email);
    return res.json({ ok: true });

  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send" });
  }
});

app.listen(PORT, () => {
  console.log(`AuditFlow server listening on port ${PORT}`);
});
