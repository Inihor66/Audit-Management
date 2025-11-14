import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Method not allowed' });

  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Your Verification Code",
    html: `<p>Your verification code is: <b>${otp}</b></p>`
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}
