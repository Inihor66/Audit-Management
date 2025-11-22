import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Missing email or code" });
  }

  try {
    // Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Email Verification Code",
      text: `Your verification code is: ${code}`,
      html: `
        <div style="font-family:sans-serif; padding:15px;">
          <h2>Verification Code</h2>
          <p style="font-size:18px;">Your OTP is:</p>
          <h1 style="background:#eee; padding:10px; text-align:center;">
            ${code}
          </h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email Error:", error);
    return res.status(500).json({ error: "Failed to send email", detail: error.message });
  }
}
