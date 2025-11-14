import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Audit App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otp}`,
      html: `<p>Your verification code is: <b>${otp}</b></p>`,
    });

    res.status(200).json({ message: 'Verification code sent', otp }); // remove otp in prod
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
