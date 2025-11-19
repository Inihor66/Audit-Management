import sgMail from "@sendgrid/mail";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email or code missing" });
  }

  // Load API key
  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({ error: "Missing SENDGRID_API_KEY in .env" });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM, // MUST be a verified SendGrid sender
    subject: "Your Verification Code",
    text: `Your verification code is ${code}`,
    html: `<p>Your verification code is <strong>${code}</strong></p>`,
  };

  try {
    await sgMail.send(msg);
    return res.status(200).json({
      message: `Verification email sent to ${email}`,
      success: true,
    });
  } catch (err) {
    console.error("SENDGRID ERROR:", err);
    return res.status(500).json({
      error: "Failed to send email",
      detail: err.message,
    });
  }
}
