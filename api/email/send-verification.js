import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email } = req.body;

  // OTP generate
  const otp = Math.floor(100000 + Math.random() * 900000);

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,  // Verified Sender Email
    subject: "Your Verification Code",
    html: `
      <p>Your verification code is:</p>
      <h2>${otp}</h2>
      <p>This code will expire in 10 minutes.</p>
    `
  };

  try {
    await sgMail.send(msg);

    return res.status(200).json({
      success: true,
      message: "Verification email sent",
      otp: otp  // optional – you can remove if not needed
    });

  } catch (err) {
    console.error("SendGrid Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
