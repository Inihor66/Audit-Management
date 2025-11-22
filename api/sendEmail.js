// api/send-otp.js
import sgMail from "@sendgrid/mail";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Missing email or code" });
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM, // verified sender
      subject: "Your Audit App verification code",
      text: `Your verification code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 12px;">
          <h3>Verification Code</h3>
          <p>Your code is:</p>
          <h2 style="background:#f4f4f4; padding:10px; display:inline-block;">${code}</h2>
          <p>This code is valid for 10 minutes.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("SendGrid Error:", err.response?.body || err);
    return res.status(500).json({ error: "Failed to send email", details: err.response?.body || err.message });
  }
}
