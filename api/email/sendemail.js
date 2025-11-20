import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
  // 1) API KEY check
  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({ error: "SENDGRID_API_KEY missing" });
  }

  // 2) FROM email check
  if (!process.env.EMAIL_FROM) {
    return res.status(500).json({ error: "EMAIL_FROM missing" });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    await sgMail.send({
      to: "aarohipurwar06@gmail.com",      // test ke liye
      from: process.env.EMAIL_FROM,        // SAME DOMAIN hona chahiye (SendGrid me verified)
      subject: "SendGrid Integration Test",
      text: "If you get this email, your SendGrid integration is working!"
    });

    return res.status(200).json({ message: "Email sent successfully!" });

  } catch (err) {
    console.error("SendGrid Error: ", err);

    return res.status(500).json({
      error: err.message,
      details: err.response?.body?.errors || null
    });
  }
}
