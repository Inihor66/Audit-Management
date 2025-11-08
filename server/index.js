require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aarohipurwar06@gmail.com';

app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: '10mb' }));

// create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: (process.env.SMTP_SECURE === 'true'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Send verification email
app.post('/email/send-verification', async (req, res) => {
  try {
    const { userId, email, code, expiresAt } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Missing email or code' });

    const verifyUrl = `${FRONTEND_ORIGIN}/verify?userId=${encodeURIComponent(userId || '')}&code=${encodeURIComponent(code)}`;

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'AuditFlow — Email verification code',
      text: `Your verification code is ${code}. It expires at ${new Date(expiresAt).toLocaleString()}.

You can also click the link to open the app and auto-fill the code: ${verifyUrl}`,
      html: `<p>Your verification code is <strong>${code}</strong>. It expires at <strong>${new Date(expiresAt).toLocaleString()}</strong>.</p>
             <p><a href="${verifyUrl}">Open verification in the app</a></p>`
    });

    console.log('Sent verification email:', info.messageId);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send' });
  }
});

// Admin notify with screenshot
app.post('/admin/notify', async (req, res) => {
  try {
    const { firmId, firmName, ssDataUrl, to, confirmationUrl } = req.body;
    const toEmail = to || ADMIN_EMAIL;
    const attachments = [];

    if (ssDataUrl && typeof ssDataUrl === 'string') {
      // parse data URL
      const matches = ssDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const dataBase64 = matches[2];
        attachments.push({ filename: 'screenshot.png', content: Buffer.from(dataBase64, 'base64'), contentType });
      }
    }

    const html = `<p>Payment screenshot uploaded by <strong>${firmName}</strong> (ID: ${firmId}).</p>
                  <p><a href="${confirmationUrl}">Confirm subscription</a></p>`;

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: toEmail,
      subject: `AuditFlow — Payment screenshot from ${firmName}`,
      text: `Payment screenshot uploaded by ${firmName}. Confirm: ${confirmationUrl}`,
      html,
      attachments,
    });

    console.log('Sent admin notify email:', info.messageId);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send admin notify' });
  }
});

// Admin confirm endpoint (optional - frontend ConfirmSubscription will call this)
app.post('/admin/confirm', async (req, res) => {
  try {
    const { notificationId, firmId } = req.body;
    // In a real backend you'd update DB; this demo simply returns ok
    console.log('Admin confirm received', { notificationId, firmId });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to confirm' });
  }
});

app.listen(PORT, () => {
  console.log(`AuditFlow server listening on http://localhost:${PORT}`);
});
